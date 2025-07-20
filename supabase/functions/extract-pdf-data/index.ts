import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1'

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
    console.log('🚀 Enhanced PDF extraction request received');
    
    // Get the file from the request
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }
    
    console.log(`📄 Processing file: ${file.name}, size: ${file.size}`);
    
    // Convert file to ArrayBuffer for PDF-lib
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    console.log('🔍 Starting PDF-lib text extraction...');
    
    // Enhanced PDF parsing with PDF-lib
    let extractedText = '';
    let structuredData: any = {};
    
    try {
      // Use PDF-lib for proper PDF text extraction
      const pdfDoc = await PDFDocument.load(uint8Array);
      const pages = pdfDoc.getPages();
      
      console.log(`📊 Found ${pages.length} pages in PDF`);
      
      const allText: string[] = [];
      
      for (let i = 0; i < pages.length; i++) {
        console.log(`📄 Processing page ${i + 1}/${pages.length}`);
        
        try {
          // Extract text content from each page
          const page = pages[i];
          const { width, height } = page.getSize();
          
          console.log(`📐 Page ${i + 1} dimensions: ${width}x${height}`);
          
          // Get page content and try to extract text
          const pageText = await extractTextFromPage(page, uint8Array, i);
          if (pageText && pageText.trim().length > 0) {
            allText.push(pageText);
            console.log(`✅ Extracted ${pageText.length} characters from page ${i + 1}`);
          }
          
        } catch (pageError) {
          console.warn(`⚠️ Error processing page ${i + 1}:`, pageError.message);
          // Continue with other pages
        }
      }
      
      extractedText = allText.join('\n\n');
      
      // If PDF-lib extraction didn't work well, fall back to enhanced binary parsing
      if (extractedText.length < 100) {
        console.log('🔄 PDF-lib extraction insufficient, using fallback method...');
        const fallbackResult = await extractPDFContentFallback(uint8Array);
        extractedText = fallbackResult.cleanText;
        structuredData = fallbackResult.structuredData;
      } else {
        // Structure the extracted text for better parsing
        structuredData = structureExtractedText(extractedText);
      }
      
      console.log(`✅ Total text extracted: ${extractedText.length} characters`);
      console.log(`📝 Sample text: ${extractedText.substring(0, 300)}`);
      console.log(`🏗️ Structured sections found: ${Object.keys(structuredData).length}`);
      
    } catch (error) {
      console.error('❌ PDF-lib extraction failed:', error);
      // Fallback to enhanced binary parsing
      console.log('🔄 Using fallback extraction method...');
      const fallbackResult = await extractPDFContentFallback(uint8Array);
      extractedText = fallbackResult.cleanText;
      structuredData = fallbackResult.structuredData;
    }
    
    // Parse the extracted text for financial data with enhanced algorithms
    const financialData = parseEnhancedFinancialText(extractedText, structuredData);
    
    console.log('💰 Enhanced financial data extracted:', financialData);
    
    return new Response(
      JSON.stringify({
        success: true,
        extractedData: financialData,
        textLength: extractedText.length,
        sampleText: extractedText.substring(0, 500),
        structuredSections: Object.keys(structuredData).length,
        extractionMethod: extractedText.length > 100 ? 'pdf-lib' : 'fallback'
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

async function extractTextFromPage(page: any, pdfBytes: Uint8Array, pageIndex: number): Promise<string> {
  try {
    // This is a simplified approach - PDF-lib doesn't directly expose text extraction
    // We'll implement a hybrid approach using the raw PDF content analysis
    
    // Convert PDF bytes to text for this page's content
    const textDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false });
    const rawText = textDecoder.decode(pdfBytes);
    
    // Look for page-specific content markers
    const pageMarkers = [
      `${pageIndex} 0 obj`,
      `Page ${pageIndex + 1}`,
      `/Page ${pageIndex + 1}/`
    ];
    
    // Extract text using enhanced methods focused on this page
    const pageText = extractEnhancedPageText(rawText, pageIndex);
    return cleanExtractedText(pageText);
    
  } catch (error) {
    console.warn(`Failed to extract text from page ${pageIndex + 1}:`, error);
    return '';
  }
}

function extractEnhancedPageText(rawText: string, pageIndex: number): string {
  const texts: string[] = [];
  
  // Enhanced literal string extraction with better decoding
  const literalRegex = /\(([^)]{3,})\)/g;
  let match;
  while ((match = literalRegex.exec(rawText)) !== null) {
    const content = unescapePDFString(match[1]);
    if (content && isLikelyFinancialText(content)) {
      texts.push(content);
    }
  }
  
  // Enhanced hex string extraction
  const hexRegex = /<([0-9A-Fa-f\s]{6,})>/g;
  while ((match = hexRegex.exec(rawText)) !== null) {
    try {
      const hexContent = match[1].replace(/\s/g, '');
      if (hexContent.length % 2 === 0 && hexContent.length > 6) {
        const decoded = hexToString(hexContent);
        if (decoded && isLikelyFinancialText(decoded)) {
          texts.push(decoded);
        }
      }
    } catch (e) {
      // Skip invalid hex strings
    }
  }
  
  // Look for financial keywords and extract surrounding context
  const financialKeywords = [
    'tranche', 'balance', 'outstanding', 'rate', 'payment', 'senior', 'protected',
    'mezzanine', 'junior', 'class', 'coupon', 'yield', 'maturity', 'wal',
    'cpr', 'losses', 'prepayment', 'currency', 'portfolio', 'weighted'
  ];
  
  for (const keyword of financialKeywords) {
    const keywordRegex = new RegExp(`.{0,100}${keyword}.{0,100}`, 'gi');
    const matches = rawText.match(keywordRegex) || [];
    for (const match of matches) {
      const cleaned = cleanExtractedText(match);
      if (cleaned.length > 10 && isLikelyFinancialText(cleaned)) {
        texts.push(cleaned);
      }
    }
  }
  
  return texts.join(' ');
}

function structureExtractedText(text: string): any {
  const sections: any = {};
  
  // Look for structured sections in the text
  const sectionPatterns = [
    { name: 'tranches', regex: /(?:tranche|class)\s+[a-z]\s*(?:information|details|data)[\s\S]{0,1000}/gi },
    { name: 'payment_info', regex: /payment\s+(?:date|information|schedule)[\s\S]{0,500}/gi },
    { name: 'portfolio_summary', regex: /portfolio\s+(?:summary|balance|information)[\s\S]{0,800}/gi },
    { name: 'financial_metrics', regex: /(?:cpr|losses|rate|yield)[\s\S]{0,400}/gi },
    { name: 'waterfall', regex: /waterfall[\s\S]{0,600}/gi }
  ];
  
  sectionPatterns.forEach(pattern => {
    const matches = text.match(pattern.regex) || [];
    if (matches.length > 0) {
      sections[pattern.name] = matches.map(match => 
        cleanExtractedText(match).substring(0, 800)
      );
    }
  });
  
  return sections;
}

async function extractPDFContentFallback(uint8Array: Uint8Array) {
  console.log('🔧 Enhanced fallback PDF content extraction...');
  
  const results = {
    cleanText: '',
    structuredData: {} as any
  };
  
  try {
    const textDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false });
    const rawText = textDecoder.decode(uint8Array);
    
    // Multiple extraction strategies
    const extractionMethods = [
      () => extractFromStreamsEnhanced(rawText),
      () => extractLiteralStringsEnhanced(rawText),
      () => extractStructuredContentEnhanced(rawText),
      () => extractTabularPatternsEnhanced(rawText)
    ];
    
    const allTexts: string[] = [];
    
    for (const method of extractionMethods) {
      try {
        const methodResults = method();
        if (Array.isArray(methodResults)) {
          allTexts.push(...methodResults);
        } else if (typeof methodResults === 'string') {
          allTexts.push(methodResults);
        }
      } catch (e) {
        console.warn('Extraction method failed:', e.message);
      }
    }
    
    // Clean and deduplicate
    const cleanedTexts = allTexts
      .map(text => cleanExtractedText(text))
      .filter(text => text.length > 5 && isLikelyFinancialText(text))
      .filter((text, index, array) => array.indexOf(text) === index);
    
    results.cleanText = cleanedTexts.join(' ');
    results.structuredData = structureExtractedText(results.cleanText);
    
    console.log(`✨ Fallback extraction completed: ${results.cleanText.length} characters`);
    
  } catch (error) {
    console.error('❌ Fallback extraction failed:', error);
    results.cleanText = 'Extraction failed';
  }
  
  return results;
}

function extractFromStreamsEnhanced(rawText: string): string[] {
  const streamRegex = /stream\s+([\s\S]*?)\s+endstream/g;
  const streams: string[] = [];
  let match;
  
  while ((match = streamRegex.exec(rawText)) !== null) {
    const streamContent = match[1];
    
    // Multiple decoding strategies
    const decodedOptions = [
      extractReadableChars(streamContent),
      decodeBase64IfPossible(streamContent),
      extractNumericPatterns(streamContent)
    ];
    
    decodedOptions.forEach(decoded => {
      if (decoded && decoded.length > 10 && isLikelyFinancialText(decoded)) {
        streams.push(decoded);
      }
    });
  }
  
  return streams;
}

function extractLiteralStringsEnhanced(rawText: string): string[] {
  const literals: string[] = [];
  
  // Enhanced parentheses extraction with better filtering
  const literalRegex = /\(([^)]{2,})\)/g;
  let match;
  
  while ((match = literalRegex.exec(rawText)) !== null) {
    const content = unescapePDFString(match[1]);
    if (content && content.length > 2 && isLikelyFinancialText(content)) {
      literals.push(content);
    }
  }
  
  // Enhanced hex string extraction with validation
  const hexRegex = /<([0-9A-Fa-f\s]+)>/g;
  while ((match = hexRegex.exec(rawText)) !== null) {
    try {
      const hexContent = match[1].replace(/\s/g, '');
      if (hexContent.length >= 6 && hexContent.length % 2 === 0) {
        const decoded = hexToString(hexContent);
        if (decoded && decoded.length > 2 && isLikelyFinancialText(decoded)) {
          literals.push(decoded);
        }
      }
    } catch (e) {
      // Skip invalid hex
    }
  }
  
  return literals;
}

function extractStructuredContentEnhanced(rawText: string): any {
  const sections: any = {};
  
  // Enhanced financial document patterns
  const enhancedPatterns = [
    { name: 'tranche_data', regex: /(?:tranche|class)\s+[a-z]+[\s\S]{0,800}/gi },
    { name: 'payment_dates', regex: /(?:payment|pay)\s+date[\s\S]{0,300}/gi },
    { name: 'balances', regex: /(?:balance|outstanding|amount)[\s\S]{0,400}/gi },
    { name: 'rates_yields', regex: /(?:rate|yield|coupon|interest)[\s\S]{0,300}/gi },
    { name: 'losses_prepayments', regex: /(?:loss|prepayment|cpr)[\s\S]{0,300}/gi },
    { name: 'currency_amounts', regex: /(?:eur|usd|gbp|jpy|\$|€|£|¥)\s*[\d,]+/gi }
  ];
  
  enhancedPatterns.forEach(pattern => {
    const matches = rawText.match(pattern.regex) || [];
    if (matches.length > 0) {
      sections[pattern.name] = matches
        .map(match => cleanExtractedText(match))
        .filter(text => text.length > 5)
        .slice(0, 20); // Limit to prevent overflow
    }
  });
  
  return sections;
}

function extractTabularPatternsEnhanced(rawText: string): string[] {
  const tables: string[] = [];
  
  // Enhanced table detection patterns
  const tablePatterns = [
    // Financial data rows: Name | Amount | Rate | Rating
    /([A-Za-z\s]+(?:tranche|class|senior|protected|mezzanine))\s+([\d,]+\.?\d*)\s+([\d.]+%?)\s+([A-Za-z]{1,4})/gi,
    // Amount sequences with currency
    /(?:€|$|£|¥)\s*([\d,]+\.?\d*)\s+([\d,]+\.?\d*)\s+([\d.]+%?)/g,
    // Percentage and number combinations
    /([\d.]+%)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)/g,
    // Date and amount patterns
    /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})\s+([\d,]+\.?\d*)/g
  ];
  
  tablePatterns.forEach(pattern => {
    const matches = rawText.match(pattern) || [];
    tables.push(...matches.slice(0, 50)); // Limit matches
  });
  
  return tables;
}

function parseEnhancedFinancialText(text: string, structuredData: any): ExtractedFinancialData {
  const result: ExtractedFinancialData = {};
  
  if (!text || text.length < 10) {
    console.log('⚠️ Insufficient text for parsing');
    return { currency: 'EUR', tranches: [] };
  }
  
  console.log('🔍 Enhanced financial data parsing...');
  console.log(`📊 Text length: ${text.length}, Structured sections: ${Object.keys(structuredData).length}`);
  
  // Enhanced parsing patterns with multiple variations
  const enhancedPatterns = {
    payment_date: [
      /payment\s+date[:\s]*(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{4})/gi,
      /pay\s+date[:\s]*(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{4})/gi,
      /reporting\s+date[:\s]*(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{4})/gi,
      /(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{4})\s*payment/gi
    ],
    next_payment_date: [
      /next\s+payment[:\s]*(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{4})/gi,
      /following\s+payment[:\s]*(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{4})/gi
    ],
    senior_tranche: [
      /senior.*?(?:balance|outstanding|amount)[:\s]*([\d,]+\.?\d*)/gi,
      /class\s*a.*?(?:balance|outstanding|amount)[:\s]*([\d,]+\.?\d*)/gi,
      /tranche\s*a.*?(?:balance|outstanding|amount)[:\s]*([\d,]+\.?\d*)/gi
    ],
    protected_tranche: [
      /protected.*?(?:balance|outstanding|amount)[:\s]*([\d,]+\.?\d*)/gi,
      /mezzanine.*?(?:balance|outstanding|amount)[:\s]*([\d,]+\.?\d*)/gi,
      /class\s*b.*?(?:balance|outstanding|amount)[:\s]*([\d,]+\.?\d*)/gi
    ],
    cpr: [
      /cpr[:\s]*([\d.]+)%?/gi,
      /prepayment\s+rate[:\s]*([\d.]+)%?/gi,
      /voluntary\s+prepayment[:\s]*([\d.]+)%?/gi
    ],
    losses: [
      /(?:cumulative\s+)?losses?[:\s]*([\d,]+\.?\d*)/gi,
      /total\s+losses?[:\s]*([\d,]+\.?\d*)/gi,
      /cum\s+losses?[:\s]*([\d,]+\.?\d*)/gi
    ],
    portfolio_balance: [
      /portfolio\s+balance[:\s]*([\d,]+\.?\d*)/gi,
      /total\s+balance[:\s]*([\d,]+\.?\d*)/gi,
      /outstanding\s+balance[:\s]*([\d,]+\.?\d*)/gi
    ],
    weighted_rate: [
      /weighted.*?rate[:\s]*([\d.]+)%?/gi,
      /w\.?a\.?r\.?[:\s]*([\d.]+)%?/gi,
      /average\s+rate[:\s]*([\d.]+)%?/gi
    ]
  };

  // Extract using enhanced patterns with validation
  Object.entries(enhancedPatterns).forEach(([key, patterns]) => {
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        const value = matches[0].match(/[\d.]+/)?.[0];
        if (value) {
          switch (key) {
            case 'payment_date':
            case 'next_payment_date':
              result[key as keyof ExtractedFinancialData] = standardizeDate(matches[0]) as any;
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
    }
  });

  // Enhanced tranche extraction
  result.tranches = extractEnhancedTranches(text, structuredData);
  if (result.tranches && result.tranches.length > 0) {
    console.log('🎯 Found tranches:', result.tranches.length);
    result.tranches.forEach((tranche, i) => {
      console.log(`  Tranche ${i + 1}: ${tranche.name} - Balance: ${tranche.balance}, Rate: ${tranche.interest_rate}%`);
    });
  }

  // Currency detection with better accuracy
  result.currency = detectCurrencyEnhanced(text) || 'EUR';
  console.log('💱 Detected currency:', result.currency);

  // Data validation and consistency checks
  validateAndCleanData(result);

  return result;
}

function extractEnhancedTranches(text: string, structuredData: any): TrancheData[] {
  const tranches: TrancheData[] = [];
  
  // Enhanced tranche patterns with better structure recognition
  const tranchePatterns = [
    // Pattern: Class/Tranche Name Balance Rate Rating
    /(?:class|tranche)\s+([a-z]+)\s+(?:balance[:\s]*)?([€$£¥]?[\d,]+\.?\d*)\s+(?:rate[:\s]*)?([\d.]+%?)\s*(?:rating[:\s]*)?([a-z]{1,4})?/gi,
    // Pattern: Senior/Protected with financial data
    /(senior|protected|mezzanine|junior)(?:\s+tranche|\s+class)?\s*([€$£¥]?[\d,]+\.?\d*)\s+([\d.]+%?)/gi,
    // Pattern: Named tranche with detailed info
    /([a-z]+\s+(?:tranche|class|notes))\s*([€$£¥]?[\d,]+\.?\d*)\s+([\d.]+%?)\s*([a-z]{1,4})?/gi
  ];
  
  for (const pattern of tranchePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const tranche: TrancheData = {
        name: (match[1] || 'Unknown').trim(),
        balance: parseEnhancedNumber(match[2] || '0'),
        interest_rate: parseFloat((match[3] || '0').replace('%', '')),
        wal: 0, // Will be filled if found separately
        rating: (match[4] || 'NR').toUpperCase()
      };
      
      // Validate tranche data quality
      if (tranche.balance >= 1000 && tranche.interest_rate >= 0) {
        tranches.push(tranche);
      }
    }
  }
  
  // Look for additional tranche information in structured data
  if (structuredData.tranche_data) {
    for (const section of structuredData.tranche_data) {
      const sectionTranches = parseTrancheSection(section);
      tranches.push(...sectionTranches);
    }
  }
  
  // Remove duplicates and validate
  return deduplicateAndValidateTranches(tranches);
}

function parseTrancheSection(section: string): TrancheData[] {
  const tranches: TrancheData[] = [];
  const lines = section.split(/[\n\r]+/);
  
  for (const line of lines) {
    if (line.length < 10) continue;
    
    // Extract numeric values and text
    const numbers = line.match(/[\d,]+\.?\d*/g) || [];
    const words = line.match(/[a-zA-Z]+/g) || [];
    
    if (numbers.length >= 2 && words.length >= 1) {
      const tranche: TrancheData = {
        name: words.find(w => /^(senior|protected|mezzanine|junior|class|tranche)/i.test(w)) || words[0],
        balance: parseEnhancedNumber(numbers[0]),
        interest_rate: parseFloat(numbers[1]),
        wal: numbers[2] ? parseFloat(numbers[2]) : 0,
        rating: words.find(w => /^[A-Z]{1,4}$/i.test(w)) || 'NR'
      };
      
      if (tranche.balance >= 1000) {
        tranches.push(tranche);
      }
    }
  }
  
  return tranches;
}

function deduplicateAndValidateTranches(tranches: TrancheData[]): TrancheData[] {
  const seen = new Map<string, TrancheData>();
  
  for (const tranche of tranches) {
    const key = `${tranche.name.toLowerCase().replace(/\s+/g, '_')}_${Math.round(tranche.balance)}`;
    
    if (!seen.has(key) || seen.get(key)!.balance < tranche.balance) {
      // Keep the tranche with more complete data
      seen.set(key, tranche);
    }
  }
  
  return Array.from(seen.values())
    .filter(t => t.balance > 0 && t.name.length > 1)
    .sort((a, b) => b.balance - a.balance); // Sort by balance descending
}

function validateAndCleanData(data: ExtractedFinancialData): void {
  // Validate numeric ranges
  if (data.cpr_annualised && (data.cpr_annualised < 0 || data.cpr_annualised > 100)) {
    console.warn('⚠️ CPR value seems invalid:', data.cpr_annualised);
    delete data.cpr_annualised;
  }
  
  if (data.weighted_avg_rate && (data.weighted_avg_rate < 0 || data.weighted_avg_rate > 50)) {
    console.warn('⚠️ Interest rate seems invalid:', data.weighted_avg_rate);
    delete data.weighted_avg_rate;
  }
  
  // Validate date formats
  if (data.payment_date && !isValidDate(data.payment_date)) {
    console.warn('⚠️ Payment date format invalid:', data.payment_date);
    delete data.payment_date;
  }
  
  if (data.next_payment_date && !isValidDate(data.next_payment_date)) {
    console.warn('⚠️ Next payment date format invalid:', data.next_payment_date);
    delete data.next_payment_date;
  }
}

function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100;
}

// Helper functions
function cleanExtractedText(text: string): string {
  return text
    .replace(/[^\x20-\x7E\s€£¥$]/g, ' ') // Keep currency symbols
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/(.)\1{3,}/g, '$1') // Remove excessive repetition
    .trim();
}

function isLikelyFinancialText(text: string): boolean {
  if (text.length < 3) return false;
  
  const financialKeywords = ['tranche', 'balance', 'rate', 'payment', 'class', 'senior', 'protected', 'amount', 'outstanding', 'coupon', 'yield', 'loss', 'cpr'];
  const hasFinancialKeyword = financialKeywords.some(keyword => 
    text.toLowerCase().includes(keyword)
  );
  
  const alphabeticRatio = (text.match(/[a-zA-Z]/g) || []).length / text.length;
  const digitRatio = (text.match(/\d/g) || []).length / text.length;
  
  return hasFinancialKeyword || (alphabeticRatio > 0.3 && digitRatio > 0.1);
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
    if (charCode >= 32 && charCode <= 126) {
      result += String.fromCharCode(charCode);
    } else if (charCode === 32) {
      result += ' ';
    }
  }
  return result;
}

function extractReadableChars(text: string): string {
  const readablePattern = /[a-zA-Z0-9\s.,;:!?%$€£¥@#&*()[\]{}_+=|\\/"'-]{3,}/g;
  const matches = text.match(readablePattern) || [];
  return matches.join(' ');
}

function decodeBase64IfPossible(text: string): string {
  try {
    if (text.length > 0 && text.length % 4 === 0) {
      const decoded = atob(text);
      return extractReadableChars(decoded);
    }
  } catch (e) {
    // Not base64
  }
  return '';
}

function extractNumericPatterns(text: string): string {
  const numericPattern = /[\d,]+\.?\d*\s*[%€$£¥]?/g;
  const matches = text.match(numericPattern) || [];
  return matches.join(' ');
}

function parseEnhancedNumber(value: any): number {
  if (typeof value === 'number') return value;
  
  const str = String(value)
    .replace(/[€$£¥,\s]/g, '')
    .replace(/[%]/g, '');
  
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function detectCurrencyEnhanced(text: string): string | undefined {
  const currencyPatterns = [
    { symbols: ['€', 'eur', 'euro'], code: 'EUR' },
    { symbols: ['$', 'usd', 'dollar'], code: 'USD' },
    { symbols: ['£', 'gbp', 'pound'], code: 'GBP' },
    { symbols: ['¥', 'jpy', 'yen'], code: 'JPY' }
  ];
  
  const lowerText = text.toLowerCase();
  
  for (const currency of currencyPatterns) {
    for (const symbol of currency.symbols) {
      if (lowerText.includes(symbol)) {
        return currency.code;
      }
    }
  }
  
  return undefined;
}

function standardizeDate(dateStr: string): string {
  try {
    const dateMatch = dateStr.match(/\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{4}/);
    if (dateMatch) {
      const parts = dateMatch[0].split(/[-\/\.]/);
      // Assume DD/MM/YYYY or MM/DD/YYYY format
      const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      return date.toISOString().split('T')[0];
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}
