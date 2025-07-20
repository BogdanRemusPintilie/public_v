
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExtractedFinancialData {
  payment_date?: string;
  senior_tranche_os?: number;
  protected_tranche?: number;
  cpr_annualised?: number;
  cum_losses?: number;
  next_payment_date?: string;
  tranches?: TrancheData[];
  portfolio_balance?: number;
  weighted_avg_rate?: number;
  currency?: string;
}

interface TrancheData {
  name: string;
  balance: number;
  interest_rate: number;
  wal: number;
  rating: string;
  outstanding_amount?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 PDF extraction request received');
    
    // Get the file from the request
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }
    
    console.log(`📄 Processing file: ${file.name}, size: ${file.size}`);
    
    // Convert file to ArrayBuffer and then to Uint8Array for Deno
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    console.log('🔍 Starting enhanced PDF text extraction...');
    
    // Enhanced PDF parsing with better structure recognition
    let extractedText = '';
    let structuredData: any = {};
    
    try {
      // Parse PDF structure more intelligently
      const textDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false });
      const rawText = textDecoder.decode(uint8Array);
      
      console.log('📊 Analyzing PDF structure...');
      
      // Extract text content using multiple strategies
      const extractionResults = await extractPDFContent(uint8Array, rawText);
      extractedText = extractionResults.cleanText;
      structuredData = extractionResults.structuredData;
      
      console.log(`✅ Text extracted, length: ${extractedText.length}`);
      console.log(`📝 Sample text: ${extractedText.substring(0, 300)}`);
      console.log(`🏗️ Structured data found: ${Object.keys(structuredData).length} sections`);
      
    } catch (error) {
      console.error('❌ Enhanced PDF extraction failed:', error);
      extractedText = '';
    }
    
    // Parse the extracted text for financial data with enhanced algorithms
    const financialData = parseFinancialText(extractedText, structuredData);
    
    console.log('💰 Financial data extracted:', financialData);
    
    return new Response(
      JSON.stringify({
        success: true,
        extractedData: financialData,
        textLength: extractedText.length,
        sampleText: extractedText.substring(0, 500),
        structuredSections: Object.keys(structuredData).length
      }),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
      }
    );
    
  } catch (error) {
    console.error('❌ PDF extraction error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});

async function extractPDFContent(uint8Array: Uint8Array, rawText: string) {
  console.log('🔧 Enhanced PDF content extraction starting...');
  
  const results = {
    cleanText: '',
    structuredData: {} as any
  };
  
  try {
    // Strategy 1: Extract text from PDF streams with better decoding
    const streamTexts = extractFromStreams(rawText);
    console.log(`📄 Found ${streamTexts.length} text streams`);
    
    // Strategy 2: Extract text from literal strings in PDF
    const literalTexts = extractLiteralStrings(rawText);
    console.log(`📝 Found ${literalTexts.length} literal text strings`);
    
    // Strategy 3: Look for structured data patterns
    const structuredContent = extractStructuredContent(rawText);
    console.log(`🏗️ Found structured content with ${Object.keys(structuredContent).length} sections`);
    
    // Strategy 4: Extract tabular data patterns
    const tabularData = extractTabularPatterns(rawText);
    console.log(`📊 Found ${tabularData.length} potential table structures`);
    
    // Combine all extraction strategies
    const allTexts = [
      ...streamTexts,
      ...literalTexts,
      ...Object.values(structuredContent).flat(),
      ...tabularData
    ];
    
    // Clean and deduplicate extracted text
    const cleanedTexts = allTexts
      .map(text => cleanExtractedText(text))
      .filter(text => text.length > 3 && isLikelyReadableText(text))
      .filter((text, index, array) => array.indexOf(text) === index); // Remove duplicates
    
    results.cleanText = cleanedTexts.join(' ');
    results.structuredData = structuredContent;
    
    console.log(`✨ Final cleaned text length: ${results.cleanText.length}`);
    
  } catch (error) {
    console.error('❌ Enhanced extraction failed:', error);
    // Fallback to basic extraction
    results.cleanText = extractBasicText(rawText);
  }
  
  return results;
}

function extractFromStreams(rawText: string): string[] {
  const streamRegex = /stream\s+(.*?)\s+endstream/gs;
  const streams: string[] = [];
  let match;
  
  while ((match = streamRegex.exec(rawText)) !== null) {
    const streamContent = match[1];
    
    // Try different decoding strategies for stream content
    const decodedTexts = [
      decodeStreamContent(streamContent, 'utf-8'),
      decodeStreamContent(streamContent, 'latin1'),
      extractReadableChars(streamContent)
    ];
    
    decodedTexts.forEach(text => {
      if (text && text.length > 10) {
        streams.push(text);
      }
    });
  }
  
  return streams;
}

function extractLiteralStrings(rawText: string): string[] {
  // Extract text from parentheses (PDF literal strings)
  const literalRegex = /\(([^)]*)\)/g;
  const literals: string[] = [];
  let match;
  
  while ((match = literalRegex.exec(rawText)) !== null) {
    const content = match[1];
    if (content && content.length > 2) {
      literals.push(unescapePDFString(content));
    }
  }
  
  // Extract text from angle brackets (PDF hex strings)
  const hexRegex = /<([0-9A-Fa-f\s]+)>/g;
  while ((match = hexRegex.exec(rawText)) !== null) {
    try {
      const hexContent = match[1].replace(/\s/g, '');
      if (hexContent.length % 2 === 0) {
        const decoded = hexToString(hexContent);
        if (decoded && decoded.length > 2) {
          literals.push(decoded);
        }
      }
    } catch (e) {
      // Skip invalid hex strings
    }
  }
  
  return literals;
}

function extractStructuredContent(rawText: string): any {
  const sections: any = {};
  
  // Look for common financial document structures
  const sectionPatterns = [
    { name: 'waterfall', regex: /waterfall[\s\S]{0,500}/gi },
    { name: 'tranches', regex: /tranche[\s\S]{0,800}/gi },
    { name: 'payments', regex: /payment[\s\S]{0,400}/gi },
    { name: 'balances', regex: /balance[\s\S]{0,400}/gi },
    { name: 'rates', regex: /rate[\s\S]{0,300}/gi },
    { name: 'losses', regex: /loss[\s\S]{0,300}/gi }
  ];
  
  sectionPatterns.forEach(pattern => {
    const matches = rawText.match(pattern.regex) || [];
    if (matches.length > 0) {
      sections[pattern.name] = matches.map(match => 
        cleanExtractedText(match).substring(0, 500)
      );
    }
  });
  
  return sections;
}

function extractTabularPatterns(rawText: string): string[] {
  const tables: string[] = [];
  
  // Look for patterns that suggest tabular data
  const tablePatterns = [
    /(\d+[\d,]*\.?\d*)\s+(\d+[\d,]*\.?\d*)\s+(\d+[\d,]*\.?\d*)/g, // Number sequences
    /[A-Z][a-z]+\s+\d+[\d,]*\.?\d*\s+\d+[\d,]*\.?\d*/g, // Label + numbers
    /\b(?:Senior|Protected|Mezzanine|Junior|Class)\s+[A-Z]?\s*\d+[\d,]*\.?\d*/gi // Tranche patterns
  ];
  
  tablePatterns.forEach(pattern => {
    const matches = rawText.match(pattern) || [];
    tables.push(...matches);
  });
  
  return tables;
}

function decodeStreamContent(content: string, encoding: string): string {
  try {
    // Remove common PDF stream filters and decode
    const cleaned = content
      .replace(/\/Filter\s*\/\w+/g, '')
      .replace(/\/Length\s*\d+/g, '')
      .replace(/[<>]/g, '');
    
    return extractReadableChars(cleaned);
  } catch (e) {
    return '';
  }
}

function extractReadableChars(text: string): string {
  // Extract sequences of readable characters
  const readablePattern = /[a-zA-Z0-9\s.,;:!?%$€£¥@#&*()[\]{}_+=|\\/"'-]{3,}/g;
  const matches = text.match(readablePattern) || [];
  return matches.join(' ');
}

function cleanExtractedText(text: string): string {
  return text
    .replace(/[^\x20-\x7E\s]/g, ' ') // Remove non-printable chars
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/(.)\1{4,}/g, '$1') // Remove repeated characters
    .trim();
}

function isLikelyReadableText(text: string): boolean {
  if (text.length < 3) return false;
  
  const alphabeticRatio = (text.match(/[a-zA-Z]/g) || []).length / text.length;
  const digitRatio = (text.match(/\d/g) || []).length / text.length;
  const whitespaceRatio = (text.match(/\s/g) || []).length / text.length;
  
  // Text should have reasonable ratios of letters, numbers, and spaces
  return alphabeticRatio > 0.3 || (digitRatio > 0.2 && whitespaceRatio > 0.1);
}

function unescapePDFString(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
}

function hexToString(hex: string): string {
  let result = '';
  for (let i = 0; i < hex.length; i += 2) {
    const charCode = parseInt(hex.substr(i, 2), 16);
    if (charCode >= 32 && charCode <= 126) { // Printable ASCII
      result += String.fromCharCode(charCode);
    } else if (charCode === 32) {
      result += ' ';
    }
  }
  return result;
}

function extractBasicText(rawText: string): string {
  const textMatches = rawText.match(/\((.*?)\)/g) || [];
  return textMatches
    .map(match => match.slice(1, -1))
    .join(' ')
    .replace(/[^\x20-\x7E\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseFinancialText(text: string, structuredData: any): ExtractedFinancialData {
  const result: ExtractedFinancialData = {};
  
  if (!text || text.length < 10) {
    console.log('⚠️ No meaningful text to parse');
    return { currency: 'EUR', tranches: [] };
  }
  
  console.log('🔍 Enhanced parsing of financial data from text...');
  console.log(`📊 Available structured sections: ${Object.keys(structuredData).join(', ')}`);
  
  // Enhanced patterns with more variations and financial document specifics
  const enhancedPatterns = {
    payment_date: [
      /payment\s+date[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{4}-\d{2}-\d{2})/gi,
      /pay\s+date[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{4}-\d{2}-\d{2})/gi,
      /reporting\s+date[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{4}-\d{2}-\d{2})/gi,
      /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\s+payment/gi
    ],
    next_payment_date: [
      /next\s+payment[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{4}-\d{2}-\d{2})/gi,
      /following\s+payment[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{4}-\d{2}-\d{2})/gi
    ],
    senior_tranche: [
      /senior.*?(?:balance|outstanding|amount)[:\s]+([\d,]+\.?\d*)/gi,
      /class\s+a.*?(?:balance|outstanding|amount)[:\s]+([\d,]+\.?\d*)/gi,
      /tranche\s+a.*?(?:balance|outstanding|amount)[:\s]+([\d,]+\.?\d*)/gi
    ],
    protected_tranche: [
      /protected.*?(?:balance|outstanding|amount)[:\s]+([\d,]+\.?\d*)/gi,
      /mezzanine.*?(?:balance|outstanding|amount)[:\s]+([\d,]+\.?\d*)/gi,
      /class\s+b.*?(?:balance|outstanding|amount)[:\s]+([\d,]+\.?\d*)/gi
    ],
    cpr: [
      /cpr[:\s]+([\d.]+)%?/gi,
      /prepayment\s+rate[:\s]+([\d.]+)%?/gi,
      /voluntary\s+prepayment[:\s]+([\d.]+)%?/gi
    ],
    losses: [
      /(?:cumulative\s+)?losses?[:\s]+([\d,]+\.?\d*)/gi,
      /total\s+losses?[:\s]+([\d,]+\.?\d*)/gi,
      /cum\s+losses?[:\s]+([\d,]+\.?\d*)/gi
    ],
    portfolio_balance: [
      /portfolio\s+balance[:\s]+([\d,]+\.?\d*)/gi,
      /total\s+balance[:\s]+([\d,]+\.?\d*)/gi,
      /outstanding\s+balance[:\s]+([\d,]+\.?\d*)/gi
    ],
    weighted_rate: [
      /weighted.*?rate[:\s]+([\d.]+)%?/gi,
      /w\.?\s?a\.?\s?r\.?[:\s]+([\d.]+)%?/gi,
      /average\s+rate[:\s]+([\d.]+)%?/gi
    ]
  };

  // Extract using enhanced patterns
  Object.entries(enhancedPatterns).forEach(([key, patterns]) => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const value = match[1];
        switch (key) {
          case 'payment_date':
          case 'next_payment_date':
            result[key as keyof ExtractedFinancialData] = standardizeDate(value) as any;
            console.log(`📅 Found ${key}:`, result[key as keyof ExtractedFinancialData]);
            break;
          case 'senior_tranche':
            result.senior_tranche_os = parseEnhancedNumber(value);
            console.log('💰 Found senior tranche:', result.senior_tranche_os);
            break;
          case 'protected_tranche':
            result.protected_tranche = parseEnhancedNumber(value);
            console.log('💰 Found protected tranche:', result.protected_tranche);
            break;
          case 'cpr':
            result.cpr_annualised = parseFloat(value);
            console.log('📊 Found CPR:', result.cpr_annualised);
            break;
          case 'losses':
            result.cum_losses = parseEnhancedNumber(value);
            console.log('📉 Found losses:', result.cum_losses);
            break;
          case 'portfolio_balance':
            result.portfolio_balance = parseEnhancedNumber(value);
            console.log('💼 Found portfolio balance:', result.portfolio_balance);
            break;
          case 'weighted_rate':
            result.weighted_avg_rate = parseFloat(value);
            console.log('📈 Found weighted rate:', result.weighted_avg_rate);
            break;
        }
        break; // Use first match found
      }
    }
  });

  // Enhanced tranche extraction with structured data
  result.tranches = extractEnhancedTranches(text, structuredData);
  if (result.tranches.length > 0) {
    console.log('🎯 Found tranches:', result.tranches.length);
    
    // Calculate aggregated values if not found directly
    if (!result.senior_tranche_os) {
      result.senior_tranche_os = result.tranches
        .filter(t => /senior|class\s+a/i.test(t.name))
        .reduce((sum, t) => sum + (t.balance || 0), 0);
    }
    
    if (!result.protected_tranche) {
      result.protected_tranche = result.tranches
        .filter(t => /protected|mezzanine|class\s+b/i.test(t.name))
        .reduce((sum, t) => sum + (t.balance || 0), 0);
    }
  }

  // Set currency default
  result.currency = detectCurrency(text) || 'EUR';

  return result;
}

function extractEnhancedTranches(text: string, structuredData: any): TrancheData[] {
  const tranches: TrancheData[] = [];
  
  // Enhanced tranche patterns
  const tranchePatterns = [
    // Pattern: Tranche Name | Balance | Rate | Rating
    /(?:tranche\s+|class\s+)([a-z]+)\s+(?:balance\s+)?([€$£¥]?[\d,]+\.?\d*)\s+(?:rate\s+)?([\d.]+%?)\s*(?:rating\s+)?([a-z]{1,4})?/gi,
    // Pattern: Senior/Protected followed by numbers
    /(senior|protected|mezzanine|junior)\s+(?:tranche\s+)?(?:class\s+)?[a-z]?\s*([€$£¥]?[\d,]+\.?\d*)\s+([\d.]+%?)/gi,
    // Pattern: Class A/B/C format
    /class\s+([a-z])\s+([€$£¥]?[\d,]+\.?\d*)\s+([\d.]+%?)\s*([a-z]{1,4})?/gi
  ];
  
  tranchePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const tranche: TrancheData = {
        name: match[1] || 'Unknown',
        balance: parseEnhancedNumber(match[2] || '0'),
        interest_rate: parseFloat((match[3] || '0').replace('%', '')),
        wal: 0,
        rating: (match[4] || 'NR').toUpperCase()
      };
      
      // Only add if we have meaningful data
      if (tranche.balance > 0 || tranche.interest_rate > 0) {
        tranches.push(tranche);
      }
    }
  });
  
  // Look for tabular data in structured sections
  if (structuredData.tranches) {
    structuredData.tranches.forEach((section: string) => {
      const sectionTranches = parseTrancheSection(section);
      tranches.push(...sectionTranches);
    });
  }
  
  // Remove duplicates based on name similarity
  return deduplicateTranches(tranches);
}

function parseTrancheSection(section: string): TrancheData[] {
  const tranches: TrancheData[] = [];
  const lines = section.split(/[\n\r]+/);
  
  for (const line of lines) {
    if (line.length < 10) continue;
    
    // Look for lines with tranche-like data
    const numbers = line.match(/[\d,]+\.?\d*/g) || [];
    const words = line.match(/[a-zA-Z]+/g) || [];
    
    if (numbers.length >= 2 && words.length >= 1) {
      const tranche: TrancheData = {
        name: words[0],
        balance: parseEnhancedNumber(numbers[0]),
        interest_rate: parseFloat(numbers[1]),
        wal: numbers[2] ? parseFloat(numbers[2]) : 0,
        rating: words[1] || 'NR'
      };
      
      if (tranche.balance > 1000) { // Filter out noise
        tranches.push(tranche);
      }
    }
  }
  
  return tranches;
}

function deduplicateTranches(tranches: TrancheData[]): TrancheData[] {
  const seen = new Set<string>();
  return tranches.filter(tranche => {
    const key = `${tranche.name.toLowerCase()}_${tranche.balance}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseEnhancedNumber(value: any): number {
  if (typeof value === 'number') return value;
  
  const str = String(value)
    .replace(/[€$£¥,\s]/g, '') // Remove currency symbols and commas
    .replace(/[%]/g, ''); // Remove percentage signs
  
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function detectCurrency(text: string): string | undefined {
  const currencyPatterns = [
    { symbol: '€', code: 'EUR' },
    { symbol: '$', code: 'USD' },
    { symbol: '£', code: 'GBP' },
    { symbol: '¥', code: 'JPY' }
  ];
  
  for (const currency of currencyPatterns) {
    if (text.includes(currency.symbol)) {
      return currency.code;
    }
  }
  
  // Look for written currency names
  if (/euro/i.test(text)) return 'EUR';
  if (/dollar/i.test(text)) return 'USD';
  if (/pound/i.test(text)) return 'GBP';
  if (/yen/i.test(text)) return 'JPY';
  
  return undefined;
}

function standardizeDate(dateStr: string): string {
  try {
    // Handle various date formats
    let date: Date;
    
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts[2] && parts[2].length === 4) {
        // MM/DD/YYYY or DD/MM/YYYY
        date = new Date(parts[2], parseInt(parts[1]) - 1, parseInt(parts[0]));
      } else {
        date = new Date(dateStr);
      }
    } else {
      date = new Date(dateStr);
    }
    
    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  } catch {
    return dateStr;
  }
}
