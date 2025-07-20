
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
    console.log('🚀 Starting enhanced PDF extraction with job tracking...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the file from the request
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileUrl = formData.get('fileUrl') as string;
    
    if (!file && !fileUrl) {
      throw new Error('No file or file URL provided');
    }
    
    const fileName = file?.name || fileUrl?.split('/').pop() || 'unknown.pdf';
    const mimeType = file?.type || 'application/pdf';
    
    console.log(`📄 Processing file: ${fileName}, size: ${file?.size || 'unknown'} bytes`);
    
    // Create ETL job record
    const { data: jobData, error: jobError } = await supabase
      .from('etl_jobs')
      .insert({
        file_url: fileUrl || fileName,
        mime_type: mimeType,
        needs_ocr: false, // Will be updated after text detection
        status: 'running'
      })
      .select()
      .single();
    
    if (jobError || !jobData) {
      throw new Error(`Failed to create ETL job: ${jobError?.message}`);
    }
    
    const jobId = jobData.id;
    console.log(`📝 Created ETL job: ${jobId}`);
    
    const arrayBuffer = file ? await file.arrayBuffer() : await fetch(fileUrl).then(r => r.arrayBuffer());
    const pdfBuffer = new Uint8Array(arrayBuffer);
    
    console.log('🔍 Starting PDF text extraction...');
    
    // Enhanced PDF text extraction using multiple strategies
    let extractedText = '';
    let extractionMethod = 'unknown';
    let needsOcr = false;
    const warnings: string[] = [];
    
    try {
      // Primary extraction method using pdf-parse equivalent
      const textResult = await extractTextWithPdfParse(pdfBuffer);
      extractedText = textResult.text;
      extractionMethod = 'pdf-parse';
      
      console.log(`✅ PDF-parse extraction successful: ${extractedText.length} characters`);
      
      // Detect if OCR might be needed based on text content
      if (extractedText.length < 500 || !/[a-zA-Z]{10,}/.test(extractedText)) {
        needsOcr = true;
        warnings.push('Limited text found - document may need OCR processing');
      }
      
    } catch (pdfParseError) {
      console.warn('⚠️ PDF-parse failed, trying fallback method:', pdfParseError.message);
      warnings.push(`PDF parsing failed: ${pdfParseError.message}`);
      
      // Fallback to enhanced binary extraction
      const fallbackResult = await extractTextWithFallback(pdfBuffer);
      extractedText = fallbackResult.text;
      extractionMethod = 'fallback';
      
      console.log(`✅ Fallback extraction completed: ${extractedText.length} characters`);
    }
    
    // If still no meaningful text, mark for OCR
    if (extractedText.length < 100) {
      console.log('🔄 Text extraction insufficient, marking for OCR...');
      needsOcr = true;
      warnings.push('Minimal text extracted - OCR processing recommended');
      
      const enhancedResult = await extractTextEnhanced(pdfBuffer);
      extractedText = enhancedResult.text;
      extractionMethod = 'enhanced-binary';
    }
    
    // Update job with OCR flag
    await supabase
      .from('etl_jobs')
      .update({ needs_ocr: needsOcr })
      .eq('id', jobId);
    
    console.log(`📝 Final extracted text length: ${extractedText.length}`);
    console.log(`📋 Sample text: ${extractedText.substring(0, 300)}`);
    
    // Parse the extracted text for financial data
    const financialData = parseFinancialData(extractedText);
    
    console.log('💰 Extracted financial data:', JSON.stringify(financialData, null, 2));
    
    // Validate extraction quality
    const hasValidTranches = financialData.tranches && financialData.tranches.length > 0;
    const hasFinancialMetrics = financialData.portfolio_balance || financialData.senior_notes_outstanding;
    
    // Determine job status
    let jobStatus: 'done' | 'failed' = 'done';
    if (!hasValidTranches && !hasFinancialMetrics) {
      jobStatus = 'failed';
      warnings.push('No meaningful financial data extracted');
    }
    
    if (!hasValidTranches) {
      warnings.push('No tranche information found');
    }
    
    // Update job status and warnings
    await supabase
      .from('etl_jobs')
      .update({ 
        status: jobStatus, 
        warnings: warnings 
      })
      .eq('id', jobId);
    
    return new Response(
      JSON.stringify({
        success: jobStatus === 'done',
        job_id: jobId,
        extractedData: financialData,
        textLength: extractedText.length,
        sampleText: extractedText.substring(0, 500),
        extractionMethod: extractionMethod,
        fileName: fileName,
        warnings: warnings,
        needsOcr: needsOcr
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
    
    // Update job status to failed if job was created
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Try to find and update the job - this is best effort
      const errorMessage = error.message || 'Unknown extraction error';
      await supabase
        .from('etl_jobs')
        .update({ 
          status: 'failed', 
          warnings: [errorMessage] 
        })
        .eq('status', 'running')
        .order('created_at', { ascending: false })
        .limit(1);
    } catch (updateError) {
      console.error('Failed to update job status:', updateError);
    }
    
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

// Enhanced financial data parsing with securitization focus
function parseFinancialData(text: string): ExtractedFinancialData {
  const result: ExtractedFinancialData = {};
  
  if (!text || text.length < 10) {
    console.log('⚠️ Insufficient text for parsing, returning default values');
    return { currency: 'EUR', tranches: [] };
  }
  
  console.log('🔍 Starting securitization-focused financial data parsing...');
  console.log(`📊 Input text length: ${text.length} characters`);
  
  // Enhanced date extraction for investor reports
  const datePatterns = [
    /(?:payment|distribution|interest)\s*date[:\s]*(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4})/gi,
    /(?:reporting|valuation|calculation)\s*date[:\s]*(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4})/gi,
    /(?:next|upcoming|following)\s*(?:payment|distribution)[:\s]*(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4})/gi,
    /(\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4})\s*(?:payment|distribution)/gi
  ];
  
  for (const pattern of datePatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      const dateStr = matches[0].match(/\d{1,2}[-\/\.]\d{1,2}[-\/\.]\d{2,4}/)?.[0];
      if (dateStr) {
        const context = matches[0].toLowerCase();
        if (!result.payment_date && (context.includes('payment') || context.includes('distribution'))) {
          result.payment_date = standardizeDate(dateStr);
        }
        if (!result.reporting_date && (context.includes('reporting') || context.includes('valuation'))) {
          result.reporting_date = standardizeDate(dateStr);
        }
        if (!result.next_payment_date && context.includes('next')) {
          result.next_payment_date = standardizeDate(dateStr);
        }
      }
    }
  }
  
  // Enhanced tranche extraction with securitization patterns
  result.tranches = extractSecuritizationTranches(text);
  
  // Extract securitization-specific financial metrics
  const securitizationMetrics = [
    { key: 'collateral_balance', patterns: [
      /(?:collateral|pool|portfolio)\s*(?:balance|amount)[:\s]*([\d,]+\.?\d*)/gi,
      /total\s*outstanding[:\s]*([\d,]+\.?\d*)/gi
    ]},
    { key: 'senior_notes_outstanding', patterns: [
      /senior\s*(?:notes?|class|tranche).*?(?:outstanding|balance|amount)[:\s]*([\d,]+\.?\d*)/gi,
      /class\s*a.*?(?:outstanding|balance)[:\s]*([\d,]+\.?\d*)/gi
    ]},
    { key: 'mezzanine_notes_outstanding', patterns: [
      /(?:mezzanine|subordinated?)\s*(?:notes?|class|tranche).*?(?:outstanding|balance|amount)[:\s]*([\d,]+\.?\d*)/gi,
      /class\s*[b-z].*?(?:outstanding|balance)[:\s]*([\d,]+\.?\d*)/gi
    ]},
    { key: 'cpr_3m_avg', patterns: [
      /(?:3\s*month|3m|quarterly)\s*(?:average\s*)?cpr[:\s]*([\d.]+)%?/gi,
      /cpr\s*(?:\(3m\s*avg\))[:\s]*([\d.]+)%?/gi
    ]},
    { key: 'cpr_annualised', patterns: [
      /(?:annual|yearly|annuali[sz]ed)\s*cpr[:\s]*([\d.]+)%?/gi,
      /cpr\s*(?:annual|yearly)[:\s]*([\d.]+)%?/gi
    ]},
    { key: 'cumulative_losses', patterns: [
      /(?:cumulative|cum\.?|total)\s*losses?[:\s]*([\d,]+\.?\d*)/gi,
      /losses?\s*(?:to\s*date|cumulative)[:\s]*([\d,]+\.?\d*)/gi
    ]},
    { key: 'delinquency_60_plus', patterns: [
      /(?:60\+?|60\s*plus|over\s*60)\s*(?:days?\s*)?delinquent[:\s]*([\d,]+\.?\d*)/gi,
      /delinquent\s*(?:60\+|over\s*60)[:\s]*([\d,]+\.?\d*)/gi
    ]},
    { key: 'weighted_avg_life', patterns: [
      /weighted\s*average\s*life[:\s]*([\d.]+)/gi,
      /wal[:\s]*([\d.]+)/gi
    ]},
    { key: 'excess_spread', patterns: [
      /excess\s*spread[:\s]*([\d.]+)%?/gi,
      /overcollaterali[sz]ation[:\s]*([\d.]+)%?/gi
    ]}
  ];
  
  for (const metric of securitizationMetrics) {
    for (const pattern of metric.patterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        const value = matches[0].match(/[\d.,]+/)?.[0];
        if (value) {
          const numValue = parseFinancialNumber(value);
          if (numValue > 0) {
            (result as any)[metric.key] = numValue;
            console.log(`✅ Found ${metric.key}:`, numValue);
            break;
          }
        }
      }
    }
  }
  
  // Currency detection with more patterns
  result.currency = detectSecuritizationCurrency(text) || 'EUR';
  
  console.log('💰 Final securitization data:', result);
  return result;
}

// Enhanced securitization tranche extraction
function extractSecuritizationTranches(text: string): TrancheData[] {
  const tranches: TrancheData[] = [];
  
  console.log('🎯 Extracting securitization tranche data...');
  
  // Enhanced securitization-specific tranche patterns
  const securitizationPatterns = [
    // Pattern: Class A1, Class A2, etc. with balance and rating
    /class\s+([a-z0-9]+)(?:\s+notes?)?\s*(?:.*?)(?:outstanding|balance|amount)[:\s]*([€$£¥]?[\d,]+\.?\d*)\s*(?:.*?)rating[:\s]*([a-z]{1,5})/gi,
    
    // Pattern: Senior/Subordinated notes with amounts
    /(senior|subordinated?|mezzanine|junior)(?:\s+(?:notes?|bonds?|certificates?))?[:\s]*([€$£¥]?[\d,]+\.?\d*)\s*(?:.*?)(?:coupon|rate)[:\s]*([\d.]+)%?/gi,
    
    // Pattern: Tranche details in tables (Class | Outstanding | Rate | Rating)
    /(?:class|tranche)\s+([a-z0-9-]+)\s*\|\s*([€$£¥]?[\d,]+\.?\d*)\s*\|\s*([\d.]+)%?\s*\|\s*([a-z]{1,5})/gi,
    
    // Pattern: Structured note formats
    /([a-z0-9]+)\s*(?:class|series|tranche)\s*(?:.*?)(?:principal|outstanding)[:\s]*([€$£¥]?[\d,]+\.?\d*)/gi,
    
    // Pattern: Waterfall priorities
    /(first|second|third|fourth|residual)\s*(?:priority|ranking)\s*(?:.*?)([€$£¥]?[\d,]+\.?\d*)/gi
  ];
  
  const foundTranches = new Map<string, TrancheData>();
  
  for (const pattern of securitizationPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      let name = (match[1] || 'Unknown').trim();
      let balanceStr = match[2] || '0';
      let rateStr = match[3] || '0';
      let rating = (match[4] || 'NR').toUpperCase();
      
      // Handle different match groups based on pattern
      if (pattern.toString().includes('priority')) {
        // For waterfall priorities, the structure is different
        balanceStr = match[2] || '0';
        rateStr = '0';
        rating = 'NR';
      }
      
      const balance = parseFinancialNumber(balanceStr);
      const rate = parseFloat(rateStr.replace('%', '')) || 0;
      
      // Enhanced validation for securitization tranches
      if (balance > 10000 && name.length > 0) { // Higher minimum threshold for securitization
        // Standardize tranche names
        name = standardizeTrancheName(name);
        const key = name.replace(/\s+/g, '_').toLowerCase();
        
        if (!foundTranches.has(key) || foundTranches.get(key)!.balance < balance) {
          foundTranches.set(key, {
            name: name,
            balance: balance,
            interest_rate: rate,
            wal: extractWALForTranche(text, name), // Extract WAL if available
            rating: rating
          });
          
          console.log(`🎯 Found securitization tranche: ${name} - Balance: €${balance.toLocaleString()}, Rate: ${rate}%, Rating: ${rating}`);
        }
      }
    }
  }
  
  const trancheArray = Array.from(foundTranches.values());
  console.log(`🎯 Total securitization tranches extracted: ${trancheArray.length}`);
  
  return trancheArray.sort((a, b) => {
    // Sort by seniority first (senior > mezzanine > junior), then by balance
    const seniorityOrder = { 'Class A': 1, 'Senior': 1, 'Class B': 2, 'Mezzanine': 2, 'Class C': 3, 'Junior': 3, 'Residual': 4 };
    const aSeniority = seniorityOrder[a.name as keyof typeof seniorityOrder] || 5;
    const bSeniority = seniorityOrder[b.name as keyof typeof seniorityOrder] || 5;
    
    if (aSeniority !== bSeniority) {
      return aSeniority - bSeniority;
    }
    
    return b.balance - a.balance;
  });
}

// Standardize tranche names for securitization
function standardizeTrancheName(name: string): string {
  const lowerName = name.toLowerCase();
  
  // Map common variations to standard names
  const standardNames: { [key: string]: string } = {
    'a': 'Class A',
    'a1': 'Class A1',
    'a2': 'Class A2',
    'b': 'Class B',
    'c': 'Class C',
    'senior': 'Senior Notes',
    'subordinated': 'Subordinated Notes',
    'mezzanine': 'Mezzanine Notes',
    'junior': 'Junior Notes',
    'first': 'First Priority',
    'second': 'Second Priority',
    'residual': 'Residual'
  };
  
  return standardNames[lowerName] || capitalizeWords(name);
}

// Extract WAL (Weighted Average Life) for specific tranche
function extractWALForTranche(text: string, trancheName: string): number {
  const walPatterns = [
    new RegExp(`${trancheName}.*?wal[:\\s]*([\\d.]+)`, 'gi'),
    new RegExp(`wal.*?${trancheName}[:\\s]*([\\d.]+)`, 'gi'),
    new RegExp(`weighted.*?average.*?life.*?${trancheName}[:\\s]*([\\d.]+)`, 'gi')
  ];
  
  for (const pattern of walPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const wal = parseFloat(match[1]);
      if (wal > 0 && wal < 50) { // Reasonable WAL range (0-50 years)
        return wal;
      }
    }
  }
  
  return 0;
}

// Enhanced currency detection for securitization reports
function detectSecuritizationCurrency(text: string): string {
  const currencyPatterns = [
    { code: 'EUR', patterns: [/€/g, /EUR/gi, /euro/gi] },
    { code: 'USD', patterns: [/\$/g, /USD/gi, /dollar/gi] },
    { code: 'GBP', patterns: [/£/g, /GBP/gi, /sterling/gi, /pound/gi] },
    { code: 'CHF', patterns: [/CHF/gi, /swiss franc/gi] },
    { code: 'JPY', patterns: [/¥/g, /JPY/gi, /yen/gi] }
  ];
  
  let maxMatches = 0;
  let detectedCurrency = 'EUR';
  
  for (const currency of currencyPatterns) {
    let totalMatches = 0;
    for (const pattern of currency.patterns) {
      const matches = text.match(pattern);
      totalMatches += matches ? matches.length : 0;
    }
    
    if (totalMatches > maxMatches) {
      maxMatches = totalMatches;
      detectedCurrency = currency.code;
    }
  }
  
  console.log(`💱 Detected currency: ${detectedCurrency} (${maxMatches} matches)`);
  return detectedCurrency;
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
