
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
    console.log('🚀 Starting enhanced PDF extraction...');
    
    // Get the file from the request
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }
    
    console.log(`📄 Processing file: ${file.name}, size: ${file.size} bytes`);
    
    const arrayBuffer = await file?.arrayBuffer();
    const pdfBuffer = new Uint8Array(arrayBuffer);
    
    console.log('🔍 Starting PDF text extraction...');
    
    // Enhanced PDF text extraction using multiple strategies
    let extractedText = '';
    let extractionMethod = 'unknown';
    
    try {
      // Primary extraction method using pdf-parse equivalent
      const textResult = await extractTextWithPdfParse(pdfBuffer);
      extractedText = textResult.text;
      extractionMethod = 'pdf-parse';
      
      console.log(`✅ PDF-parse extraction successful: ${extractedText.length} characters`);
      
    } catch (pdfParseError) {
      console.warn('⚠️ PDF-parse failed, trying fallback method:', pdfParseError.message);
      
      // Fallback to enhanced binary extraction
      const fallbackResult = await extractTextWithFallback(pdfBuffer);
      extractedText = fallbackResult.text;
      extractionMethod = 'fallback';
      
      console.log(`✅ Fallback extraction completed: ${extractedText.length} characters`);
    }
    
    // If still no meaningful text, try OCR-like approach
    if (extractedText.length < 100) {
      console.log('🔄 Text extraction insufficient, trying enhanced binary parsing...');
      const enhancedResult = await extractTextEnhanced(pdfBuffer);
      extractedText = enhancedResult.text;
      extractionMethod = 'enhanced-binary';
    }
    
    console.log(`📝 Final extracted text length: ${extractedText.length}`);
    console.log(`📋 Sample text: ${extractedText.substring(0, 300)}`);
    
    // Parse the extracted text for financial data
    const financialData = parseFinancialData(extractedText);
    
    console.log('💰 Extracted financial data:', JSON.stringify(financialData, null, 2));
    
    return new Response(
      JSON.stringify({
        success: true,
        extractedData: financialData,
        textLength: extractedText.length,
        sampleText: extractedText.substring(0, 500),
        extractionMethod: extractionMethod,
        fileName: file.name
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

// Enhanced PDF text extraction using pdf-parse equivalent approach
async function extractTextWithPdfParse(pdfBuffer: Uint8Array): Promise<{text: string, pages: number}> {
  try {
    // Convert buffer to string for processing
    const textDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false });
    const pdfString = textDecoder.decode(pdfBuffer);
    
    console.log('🔍 Analyzing PDF structure...');
    
    // Look for PDF objects and streams
    const streamRegex = /stream\s+([\s\S]*?)\s+endstream/g;
    const textObjects: string[] = [];
    let match;
    
    // Extract content from PDF streams
    while ((match = streamRegex.exec(pdfString)) !== null) {
      const streamContent = match[1];
      
      // Try to decode the stream content
      const decodedText = decodeStreamContent(streamContent);
      if (decodedText && decodedText.length > 10) {
        textObjects.push(decodedText);
      }
    }
    
    // Also extract literal strings (text in parentheses)
    const literalRegex = /\(([^)]{3,})\)/g;
    while ((match = literalRegex.exec(pdfString)) !== null) {
      const literalText = unescapePDFString(match[1]);
      if (literalText && isLikelyFinancialText(literalText)) {
        textObjects.push(literalText);
      }
    }
    
    // Extract hex strings
    const hexRegex = /<([0-9A-Fa-f\s]{6,})>/g;
    while ((match = hexRegex.exec(pdfString)) !== null) {
      try {
        const hexContent = match[1].replace(/\s/g, '');
        if (hexContent.length % 2 === 0) {
          const decodedHex = hexToString(hexContent);
          if (decodedHex && isLikelyFinancialText(decodedHex)) {
            textObjects.push(decodedHex);
          }
        }
      } catch (e) {
        // Skip invalid hex strings
      }
    }
    
    const fullText = textObjects.join(' ').trim();
    console.log(`📊 Extracted ${textObjects.length} text objects, total length: ${fullText.length}`);
    
    return { text: fullText, pages: 1 };
    
  } catch (error) {
    console.error('❌ PDF-parse extraction failed:', error);
    throw error;
  }
}

// Fallback extraction method
async function extractTextWithFallback(pdfBuffer: Uint8Array): Promise<{text: string}> {
  const textDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false });
  const pdfString = textDecoder.decode(pdfBuffer);
  
  console.log('🔧 Using fallback extraction method...');
  
  // Multiple extraction strategies
  const extractedTexts: string[] = [];
  
  // Strategy 1: Look for readable ASCII text
  const readableText = pdfString.match(/[a-zA-Z0-9\s.,;:!?€$£¥%()[\]{}_+=|\\/"'-]{10,}/g) || [];
  extractedTexts.push(...readableText.filter(text => isLikelyFinancialText(text)));
  
  // Strategy 2: Extract numbers and financial patterns
  const financialPatterns = pdfString.match(/\d+[.,]\d+|\d+%|[€$£¥]\s*\d+/g) || [];
  extractedTexts.push(...financialPatterns);
  
  // Strategy 3: Look for common financial keywords with surrounding context
  const keywordContext = extractKeywordContext(pdfString);
  extractedTexts.push(...keywordContext);
  
  const combinedText = extractedTexts.join(' ').trim();
  console.log(`🔧 Fallback extraction found ${extractedTexts.length} text segments`);
  
  return { text: combinedText };
}

// Enhanced binary parsing for difficult PDFs
async function extractTextEnhanced(pdfBuffer: Uint8Array): Promise<{text: string}> {
  console.log('⚡ Using enhanced binary parsing...');
  
  // Convert to different encodings and try to extract readable text
  const encodings = ['utf-8', 'latin1', 'ascii'];
  const allTexts: string[] = [];
  
  for (const encoding of encodings) {
    try {
      const textDecoder = new TextDecoder(encoding, { fatal: false });
      const decodedText = textDecoder.decode(pdfBuffer);
      
      // Extract sequences of readable characters
      const readableSequences = decodedText.match(/[a-zA-Z0-9\s.,;:!?€$£¥%()[\]{}_+=|\\/"'-]{5,}/g) || [];
      
      for (const sequence of readableSequences) {
        const cleaned = cleanExtractedText(sequence);
        if (cleaned.length > 5 && isLikelyFinancialText(cleaned)) {
          allTexts.push(cleaned);
        }
      }
    } catch (e) {
      // Skip failed encodings
      continue;
    }
  }
  
  // Remove duplicates and combine
  const uniqueTexts = [...new Set(allTexts)];
  const combinedText = uniqueTexts.join(' ').trim();
  
  console.log(`⚡ Enhanced binary parsing extracted ${uniqueTexts.length} unique text segments`);
  
  return { text: combinedText };
}

// Decode PDF stream content
function decodeStreamContent(streamContent: string): string {
  // Remove common PDF encoding artifacts
  let cleaned = streamContent
    .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // Try to extract readable text patterns
  const readablePatterns = cleaned.match(/[a-zA-Z][a-zA-Z0-9\s.,;:!?€$£¥%()[\]{}_+=|\\/"'-]{3,}/g) || [];
  
  return readablePatterns.join(' ');
}

// Extract context around financial keywords
function extractKeywordContext(text: string): string[] {
  const financialKeywords = [
    'tranche', 'senior', 'protected', 'mezzanine', 'junior',
    'balance', 'outstanding', 'payment', 'rate', 'coupon',
    'yield', 'maturity', 'wal', 'cpr', 'losses', 'prepayment',
    'portfolio', 'weighted', 'currency', 'class'
  ];
  
  const contexts: string[] = [];
  
  for (const keyword of financialKeywords) {
    const regex = new RegExp(`.{0,50}${keyword}.{0,50}`, 'gi');
    const matches = text.match(regex) || [];
    
    for (const match of matches) {
      const cleaned = cleanExtractedText(match);
      if (cleaned.length > 10) {
        contexts.push(cleaned);
      }
    }
  }
  
  return contexts;
}

// Enhanced financial data parsing
function parseFinancialData(text: string): ExtractedFinancialData {
  const result: ExtractedFinancialData = {};
  
  if (!text || text.length < 10) {
    console.log('⚠️ Insufficient text for parsing, returning default values');
    return { currency: 'EUR', tranches: [] };
  }
  
  console.log('🔍 Starting enhanced financial data parsing...');
  console.log(`📊 Input text length: ${text.length} characters`);
  
  // Enhanced date extraction patterns
  const datePatterns = [
    /(?:payment|pay|reporting)\s*date[:\s]*(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4})/gi,
    /(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4})\s*(?:payment|pay)/gi,
    /(?:next|following)\s*payment[:\s]*(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4})/gi
  ];
  
  for (const pattern of datePatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      const dateStr = matches[0].match(/\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4}/)?.[0];
      if (dateStr) {
        if (!result.payment_date && matches[0].toLowerCase().includes('payment')) {
          result.payment_date = standardizeDate(dateStr);
        }
        if (!result.next_payment_date && matches[0].toLowerCase().includes('next')) {
          result.next_payment_date = standardizeDate(dateStr);
        }
      }
    }
  }
  
  // Enhanced tranche extraction
  result.tranches = extractTranches(text);
  
  // Extract financial metrics with improved patterns
  const metrics = [
    { key: 'senior_tranche_os', patterns: [/senior.*?(?:balance|outstanding|amount)[:\s]*([\d,]+\.?\d*)/gi] },
    { key: 'protected_tranche', patterns: [/(?:protected|mezzanine).*?(?:balance|outstanding|amount)[:\s]*([\d,]+\.?\d*)/gi] },
    { key: 'cpr_annualised', patterns: [/cpr[:\s]*([\d.]+)%?/gi, /prepayment\s*rate[:\s]*([\d.]+)%?/gi] },
    { key: 'cum_losses', patterns: [/(?:cumulative\s*)?losses?[:\s]*([\d,]+\.?\d*)/gi] },
    { key: 'portfolio_balance', patterns: [/portfolio\s*balance[:\s]*([\d,]+\.?\d*)/gi, /total\s*balance[:\s]*([\d,]+\.?\d*)/gi] },
    { key: 'weighted_avg_rate', patterns: [/weighted.*?rate[:\s]*([\d.]+)%?/gi, /w\.?a\.?r\.?[:\s]*([\d.]+)%?/gi] }
  ];
  
  for (const metric of metrics) {
    for (const pattern of metric.patterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        const value = matches[0].match(/[\d.,]+/)?.[0];
        if (value) {
          const numValue = parseFinancialNumber(value);
          if (numValue > 0) {
            if (metric.key === 'cpr_annualised' || metric.key === 'weighted_avg_rate') {
              (result as any)[metric.key] = numValue;
            } else {
              (result as any)[metric.key] = numValue;
            }
            console.log(`✅ Found ${metric.key}:`, numValue);
            break;
          }
        }
      }
    }
  }
  
  // Currency detection
  result.currency = detectCurrency(text) || 'EUR';
  
  console.log('💰 Final parsed financial data:', result);
  return result;
}

// Enhanced tranche extraction
function extractTranches(text: string): TrancheData[] {
  const tranches: TrancheData[] = [];
  
  console.log('🎯 Extracting tranche data...');
  
  // Enhanced tranche patterns
  const tranchePatterns = [
    // Pattern: Class/Tranche Name Balance Rate Rating
    /(?:class|tranche)\s+([a-z]+)\s*(?:.*?)?([€$£¥]?[\d,]+\.?\d*)\s*(?:.*?)?(?:([\d.]+)%?)?\s*(?:.*?)?([a-z]{1,4})?/gi,
    // Pattern: Senior/Protected with amounts
    /(senior|protected|mezzanine|junior)(?:\s+(?:tranche|class|notes))?\s*[:\s]*([€$£¥]?[\d,]+\.?\d*)\s*(?:.*?)?([\d.]+%?)?/gi,
    // Pattern: Named sections with financial data
    /([a-z]+\s*(?:tranche|class|notes))\s*([€$£¥]?[\d,]+\.?\d*)\s*([\d.]+%?)?/gi
  ];
  
  const foundTranches = new Map<string, TrancheData>();
  
  for (const pattern of tranchePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = (match[1] || 'Unknown').trim().toLowerCase();
      const balanceStr = match[2] || '0';
      const rateStr = match[3] || '0';
      const rating = (match[4] || 'NR').toUpperCase();
      
      const balance = parseFinancialNumber(balanceStr);
      const rate = parseFloat(rateStr.replace('%', '')) || 0;
      
      if (balance > 1000 && name.length > 1) { // Minimum thresholds for valid data
        const key = name.replace(/\s+/g, '_');
        
        if (!foundTranches.has(key) || foundTranches.get(key)!.balance < balance) {
          foundTranches.set(key, {
            name: capitalizeWords(name),
            balance: balance,
            interest_rate: rate,
            wal: 0, // Will be populated separately if found
            rating: rating
          });
          
          console.log(`🎯 Found tranche: ${name} - Balance: ${balance}, Rate: ${rate}%`);
        }
      }
    }
  }
  
  const trancheArray = Array.from(foundTranches.values());
  console.log(`🎯 Total tranches extracted: ${trancheArray.length}`);
  
  return trancheArray.sort((a, b) => b.balance - a.balance); // Sort by balance descending
}

// Helper functions
function cleanExtractedText(text: string): string {
  return text
    .replace(/[^\x20-\x7E\s€£¥$]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/(.)\1{4,}/g, '$1')
    .trim();
}

function isLikelyFinancialText(text: string): boolean {
  if (text.length < 3) return false;
  
  const financialKeywords = [
    'tranche', 'balance', 'rate', 'payment', 'class', 'senior', 
    'protected', 'amount', 'outstanding', 'coupon', 'yield', 
    'loss', 'cpr', 'portfolio', 'currency', 'mezzanine'
  ];
  
  const lowerText = text.toLowerCase();
  const hasKeyword = financialKeywords.some(keyword => lowerText.includes(keyword));
  
  const hasNumbers = /\d/.test(text);
  const hasReasonableLength = text.length >= 3 && text.length <= 1000;
  
  return (hasKeyword || hasNumbers) && hasReasonableLength;
}

function unescapePDFString(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
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

function parseFinancialNumber(value: string): number {
  const cleaned = value
    .replace(/[€$£¥,\s]/g, '')
    .replace(/[%]/g, '');
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function detectCurrency(text: string): string | undefined {
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
  
  return 'EUR'; // Default fallback
}

function standardizeDate(dateStr: string): string {
  try {
    const parts = dateStr.split(/[-\/\.]/);
    if (parts.length === 3) {
      // Assume DD/MM/YYYY or MM/DD/YYYY format
      const year = parseInt(parts[2]);
      const month = parseInt(parts[1]) - 1; // JavaScript months are 0-based
      const day = parseInt(parts[0]);
      
      const date = new Date(year, month, day);
      return date.toISOString().split('T')[0];
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}
