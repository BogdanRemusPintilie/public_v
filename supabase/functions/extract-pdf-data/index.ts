
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { inflate, inflateRaw } from 'https://esm.sh/pako@2.1.0'


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExtractedFinancialData {
  determination_date?: string;
  reporting_date?: string;
  payment_date?: string;
  next_payment_date?: string;
  period_no?: number;
  portfolio_balance?: number;
  available_distribution_amount?: number;
  overcollateralization?: number;
  wa_loan_interest_rate?: number;
  reserve_account_balance?: number;
  tranches?: TrancheData[];
  waterfall?: {
    interest_per_class?: Record<string, number>;
    principal_redemption_per_class?: Record<string, number>;
  };
  triggers?: Array<{name: string; current_value: string; breached: boolean}>;
  // legacy/compat keys
  senior_tranche_os?: number;
  protected_tranche?: number;
  cpr_annualised?: number;
  cum_losses?: number;
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
    return new Response(null, { headers: { ...corsHeaders, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Max-Age': '86400' } });
  }

  let jobId: string | null = null;
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
    
    jobId = jobData.id;
    console.log(`📝 Created ETL job: ${jobId}`);
    
    let arrayBuffer: ArrayBuffer;
    if (file) {
      arrayBuffer = await file.arrayBuffer();
    } else {
      const allowedHosts = [/^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\//i];
      const isAllowedUrl = (u: string) => allowedHosts.some(r => r.test(u));
      if (!isAllowedUrl(fileUrl)) throw new Error('Disallowed file host');
      const resp = await fetch(fileUrl, { method: 'GET' });
      const contentType = resp.headers.get('content-type') || '';
      const len = Number(resp.headers.get('content-length') || '0');
      if (!/application\/pdf/i.test(contentType)) throw new Error('Remote file is not a PDF');
      if (len && len > 50 * 1024 * 1024) throw new Error('Remote file too large');
      arrayBuffer = await resp.arrayBuffer();
    }
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
      
      // Enhanced OCR detection - check for meaningful text patterns
      const meaningfulTextRatio = calculateTextQuality(extractedText);
      const hasReadableWords = /\b[a-zA-Z]{3,}\b/.test(extractedText);
      const hasFinancialTerms = /\b(tranche|senior|balance|rate|payment|class|outstanding)\b/i.test(extractedText);
      
      if (extractedText.length < 500 || meaningfulTextRatio < 0.3 || !hasReadableWords || !hasFinancialTerms) {
        needsOcr = true;
        warnings.push('Document appears to contain scanned/encoded content - OCR processing recommended');
        console.log(`📊 Text quality metrics: length=${extractedText.length}, ratio=${meaningfulTextRatio}, readable=${hasReadableWords}, financial=${hasFinancialTerms}`);
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
    console.log(`📋 Sample text: ${extractedText.substring(0, 150)}`);
    
    // Parse the extracted text for financial data
    const financialData = parseFinancialData(extractedText);
    
    console.log('💰 Extracted financial data:', JSON.stringify(financialData, null, 2));
    
    // Validate extraction quality
    const hasValidTranches = financialData.tranches && financialData.tranches.length > 0;
    const hasFinancialMetrics = Boolean(
      (financialData as any).portfolio_balance ||
      (financialData as any).senior_notes_outstanding ||
      (financialData as any).available_distribution_amount ||
      (financialData as any).original_portfolio_balance
    );
    
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
        sampleText: extractedText.substring(0, 150),
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
      if (jobId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const errorMessage = (error as any)?.message || 'Unknown extraction error';
        await supabase
          .from('etl_jobs')
          .update({ status: 'failed', warnings: [errorMessage] })
          .eq('id', jobId);
      }
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

// Enhanced PDF text extraction using binary stream inflation (handles FlateDecode)
async function extractTextWithPdfParse(pdfBuffer: Uint8Array): Promise<{text: string, pages: number}> {
  try {
    console.log('🔍 Parsing PDF streams (binary)...');

    const encoder = new TextEncoder();
    const streamMarker = encoder.encode('stream');
    const endstreamMarker = encoder.encode('endstream');

    const decoderUtf8 = new TextDecoder('utf-8', { fatal: false });
    const decoderLatin1 = new TextDecoder('latin1', { fatal: false });

    const texts: string[] = [];

    // Byte-level search for a pattern
    const indexOfBytes = (buf: Uint8Array, pattern: Uint8Array, from: number) => {
      outer: for (let i = from; i <= buf.length - pattern.length; i++) {
        for (let j = 0; j < pattern.length; j++) {
          if (buf[i + j] !== pattern[j]) continue outer;
        }
        return i;
      }
      return -1;
    };

    let cursor = 0;
    const MAX_STREAM = 5 * 1024 * 1024; // 5MB

    while (cursor < pdfBuffer.length) {
      const startIdx = indexOfBytes(pdfBuffer, streamMarker, cursor);
      if (startIdx === -1) break;
      let dataStart = startIdx + streamMarker.length;
      // Skip newline after 'stream'
      if (pdfBuffer[dataStart] === 0x0d && pdfBuffer[dataStart + 1] === 0x0a) dataStart += 2; // CRLF
      else if (pdfBuffer[dataStart] === 0x0a) dataStart += 1; // LF

      const endIdx = indexOfBytes(pdfBuffer, endstreamMarker, dataStart);
      if (endIdx === -1) break;

      const dictStart = findDictStart(pdfBuffer, startIdx);
      const dictText = readDictBefore(pdfBuffer, dictStart, startIdx);

      // Skip clear image streams
      if (isImageStream(dictText)) {
        cursor = endIdx + endstreamMarker.length;
        continue;
      }

      const streamBytes = pdfBuffer.subarray(dataStart, endIdx);
      if (streamBytes.length > MAX_STREAM) {
        cursor = endIdx + endstreamMarker.length;
        continue;
      }

      let decompressed: Uint8Array | null = null;
      if (shouldInflate(dictText)) {
        try {
          decompressed = inflate(streamBytes);
        } catch {
          try {
            decompressed = inflateRaw(streamBytes);
          } catch {
            decompressed = null;
          }
        }
      }

      const candidates: string[] = [];
      const addCandidatesFrom = (bytes: Uint8Array) => {
        const utf = decoderUtf8.decode(bytes);
        const lat = decoderLatin1.decode(bytes);
        if (utf && /[A-Za-z0-9]{2,}/.test(utf)) candidates.push(utf);
        if (lat && /[A-Za-z0-9]{2,}/.test(lat)) candidates.push(lat);
      };

      if (decompressed && decompressed.byteLength > 0) {
        addCandidatesFrom(decompressed);
      } else if (looksLikeText(streamBytes)) {
        addCandidatesFrom(streamBytes);
      }

      for (const cand of candidates) {
        // Extract literal and hex strings used by PDF text operators
        const parts: string[] = [];
        const parenRegex = /\(([^)]+)\)/g;
        let m: RegExpExecArray | null;
        while ((m = parenRegex.exec(cand)) !== null) {
          const t = unescapePDFString(m[1]);
          if (isLikelyFinancialText(t)) parts.push(t);
        }
        const hexRegex = /<([0-9A-Fa-f\s]{4,})>/g;
        let hm: RegExpExecArray | null;
        while ((hm = hexRegex.exec(cand)) !== null) {
          try {
            const raw = (hm[1] || '').replace(/\s/g, '');
            if (raw.length % 2 === 0) {
              const decoded = hexToString(raw);
              if (decoded && isLikelyFinancialText(decoded)) parts.push(decoded);
            }
          } catch {}
        }
        const cleaned = cleanExtractedText(parts.join(' '));
        if (cleaned.length > 0) texts.push(cleaned);
      }

      cursor = endIdx + endstreamMarker.length;
    }

    // Also catch any literal strings outside streams as a last resort
    const wholeDoc = decoderLatin1.decode(pdfBuffer);
    const extraParts: string[] = [];
    const litRegex = /\(([^)]{3,})\)/g;
    let lm: RegExpExecArray | null;
    while ((lm = litRegex.exec(wholeDoc)) !== null) {
      const t = unescapePDFString(lm[1]);
      if (isLikelyFinancialText(t)) extraParts.push(t);
    }
    texts.push(...extraParts);

    const combined = [...new Set(texts)].join(' ').trim();
    console.log(`📊 Extracted ${texts.length} segments, total length: ${combined.length}`);

    return { text: combined, pages: 1 };
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

function findDictStart(pdf: Uint8Array, startIdx: number): number {
  const from = Math.max(0, startIdx - 2048);
  const decoder = new TextDecoder('latin1');
  const slice = decoder.decode(pdf.subarray(from, startIdx));
  const idx = slice.lastIndexOf('<<');
  return idx === -1 ? startIdx : from + idx;
}

function readDictBefore(pdf: Uint8Array, dictStart: number, dictEnd: number): string {
  const decoder = new TextDecoder('latin1', { fatal: false });
  return decoder.decode(pdf.subarray(dictStart, dictEnd));
}

function shouldInflate(dictText: string): boolean {
  return /\/Filter\s*(?:\[.*?FlateDecode.*?\]|\/FlateDecode)/i.test(dictText);
}

function isImageStream(dictText: string): boolean {
  return /\/Subtype\s*\/Image/i.test(dictText);
}

function looksLikeText(bytes: Uint8Array): boolean {
  let printable = 0;
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if ((b >= 32 && b <= 126) || b === 9 || b === 10 || b === 13) printable++;
  }
  const ratio = printable / Math.max(1, bytes.length);
  return ratio > 0.8; // heuristic
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

// Section utilities for glossary-driven parsing
function sliceSection(text: string, header: RegExp | string, nextHeaders: (RegExp | string)[]): string {
  if (!text) return '';
  let start = -1, after = 0;
  if (typeof header === 'string') {
    start = text.toLowerCase().indexOf(header.toLowerCase());
    after = start === -1 ? 0 : header.length;
  } else {
    const m = (header as RegExp).exec(text);
    if (m) { start = m.index; after = m[0].length; }
  }
  if (start === -1) return '';
  const tail = text.slice(start + after);
  const endIdxs = nextHeaders
    .map(h => {
      if (typeof h === 'string') return tail.toLowerCase().indexOf(h.toLowerCase());
      const mm = (h as RegExp).exec(tail); return mm ? mm.index : -1;
    })
    .filter(i => i > -1);
  const end = endIdxs.length ? Math.min(...endIdxs) : tail.length;
  return tail.slice(0, end);
}

function parseNotesSection(block: string): { tranches: TrancheData[]; overcollateralization?: number } {
  const classes = ['Class A','Class B','Class C','Class D','Class E'];
  const tranches: TrancheData[] = [];
  if (!block) return { tranches };
  const rateRow = /Interest\s*Rate\s+([\d.,]+)%\s+([\d.,]+)%\s+([\d.,]+)%\s+([\d.,]+)%\s+([\d.,]+)%/i.exec(block);
  const eopRow = /Aggregate\s+Notes\s+Principal\s+Amount\s*\(eop\)\s*per\s*Class\s+([0-9.,]+)\s+([0-9.,]+)\s+([0-9.,]+)\s+([0-9.,]+)\s+([0-9.,]+)/i.exec(block);

  if (rateRow && eopRow) {
    for (let i = 0; i < 5; i++) {
      tranches.push({
        name: classes[i],
        balance: parseFinancialNumber(eopRow[i+1]),
        interest_rate: parseFinancialNumber(rateRow[i+1]),
        wal: 0,
        rating: 'NR'
      });
    }
  }

  const ocMatch = /Overcollateralization\s+([0-9.,]+)/i.exec(block);
  const overcollateralization = ocMatch ? parseFinancialNumber(ocMatch[1]) : undefined;
  return { tranches, overcollateralization };
}

function parseWaterfallSection(block: string): { interest_per_class?: Record<string, number>; principal_redemption_per_class?: Record<string, number> } {
  if (!block) return {};
  const classes = ['Class A','Class B','Class C','Class D','Class E'];
  const interest: Record<string, number> = {};
  const principal: Record<string, number> = {};

  for (const cls of classes) {
    const interestRe = new RegExp(`${cls}\\s*(?:Notes?)?\\s*Interest\\s*Amount\\s+([0-9.,]+)`, 'i');
    const principalRe1 = new RegExp(`${cls}\\s*(?:Notes?)?\\s*Principal\\s*Redemption\\s*Amount\\s+([0-9.,]+)`, 'i');
    const principalRe2 = new RegExp(`${cls}\\s*(?:Principal\\s*Amount\\s*Redeemed)\\s+([0-9.,]+)`, 'i');
    const im = interestRe.exec(block);
    const pm = principalRe1.exec(block) || principalRe2.exec(block);
    if (im) interest[cls] = parseFinancialNumber(im[1]);
    if (pm) principal[cls] = parseFinancialNumber(pm[1]);
  }

  const res: any = {};
  if (Object.keys(interest).length) res.interest_per_class = interest;
  if (Object.keys(principal).length) res.principal_redemption_per_class = principal;
  return res;
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
  
  // Enhanced date extraction for investor reports (glossary-aware)
  const datePatterns = [
    { key: 'payment_date', regex: /(?:payment|distribution|interest)\s*date[:\s]*(\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4})/gi },
    { key: 'reporting_date', regex: /(?:investor\s*reporting|reporting|valuation|calculation)\s*date[:\s]*(\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4})/gi },
    { key: 'next_payment_date', regex: /(?:next|upcoming|following)\s*(?:payment|distribution)[:\s]*(\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4})/gi },
    { key: 'determination_date', regex: /determination\s*date[:\s]*(\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4})/gi }
  ];

  for (const dp of datePatterns) {
    const matches = text.match(dp.regex);
    if (matches && matches.length > 0) {
      const dateStr = matches[0].match(/\d{1,2}[-\/.]\d{1,2}[-\/.]\d{2,4}/)?.[0];
      if (dateStr) {
        (result as any)[dp.key] = standardizeDate(dateStr);
      }
    }
  }

  // Period number (e.g., "Period No.: 7")
  const periodMatch = text.match(/period\s*no\.?[:\s]*([0-9]{1,3})/i);
  if (periodMatch) {
    (result as any).period_no = parseInt(periodMatch[1]);
  }
  
  // Prefer glossary-driven tranche parse from Notes section; fallback to generic
  const notesBlock = sliceSection(
    text,
    /(Information regarding the Notes|Notes Information)/i,
    [/Reserve Accounts/i, /Available Distribution Amount/i, /Portfolio Information/i, /Waterfall/i, /Trigger/i, /Ratings/i]
  );
  const parsedNotes = parseNotesSection(notesBlock);
  if (parsedNotes.tranches.length) {
    result.tranches = parsedNotes.tranches;
    if (parsedNotes.overcollateralization !== undefined) {
      result.overcollateralization = parsedNotes.overcollateralization;
    }
  } else {
    result.tranches = extractSecuritizationTranches(text);
  }

  // Available Distribution Amount
  const adaBlock = sliceSection(text, /Available Distribution Amount/i, [/Waterfall/i, /Portfolio Information/i, /Reserve Accounts/i, /Trigger/i]);
  const adaMatch = adaBlock.match(/Available\s+Distribution\s+Amount\s+([0-9.,]+)/i);
  if (adaMatch) {
    result.available_distribution_amount = parseFinancialNumber(adaMatch[1]);
  }

  // Portfolio balance from Portfolio Information
  const portfolioBlock = sliceSection(text, /Portfolio Information/i, [/Swap Data/i, /Defaults/i, /Delinquency/i, /Stratification/i, /Waterfall/i]);
  const pbMatch = portfolioBlock.match(/Outstanding\s+Principal\s+Balance.*?(?:End\s*of\s*Period|eop)?[:\s]*([0-9.,]+)/i) ||
                  portfolioBlock.match(/Outstanding\s+Principal\s+Balance\s+([0-9.,]+)/i);
  if (pbMatch) {
    result.portfolio_balance = parseFinancialNumber(pbMatch[1]);
  }

  // WA loan interest rate
  const rateBlock = sliceSection(text, /Loan Interest Rate Range/i, [/Portfolio Information/i, /Notes Information/i, /Information regarding the Notes/i]);
  const waMatch = rateBlock.match(/WA\s+Loan\s+Interest\s+Rate\s+p\.a\.\s+([\d.,]+)%/i);
  if (waMatch) {
    result.wa_loan_interest_rate = parseFinancialNumber(waMatch[1]);
  }

  // Reserve Accounts
  const reserveBlock = sliceSection(text, /Reserve Accounts/i, [/Risk Retention/i, /Available Distribution Amount/i, /Waterfall/i, /Portfolio Information/i]);
  const reserveMatch = reserveBlock.match(/(?:Reserve|Reserve Account).*?([0-9.,]+)/i);
  if (reserveMatch) {
    result.reserve_account_balance = parseFinancialNumber(reserveMatch[1]);
  }

  // Waterfall breakdown
  const waterfallBlock = sliceSection(text, /Waterfall/i, [/Portfolio Information/i, /Stratification/i, /Trigger/i, /Reserve Accounts/i]);
  const waterfallParsed = parseWaterfallSection(waterfallBlock);
  if (Object.keys(waterfallParsed).length) {
    result.waterfall = waterfallParsed;
  }

  // Triggers
  const triggersBlock = sliceSection(text, /(Trigger\s*&\s*Clean\s*Up\s*Call|Trigger)/i, [/Notes Information/i, /Portfolio Information/i, /Waterfall/i]);
  const trig: Array<{name: string; current_value: string; breached: boolean}> = [];
  const clr = /Cumulative\s+Loss\s+Ratio.*?Current\s+Value\s*([0-9.,%]+).*?(?:Trigger\s*Breach|Breach)\s*(Yes|No)/i.exec(triggersBlock);
  if (clr) {
    trig.push({ name: 'Cumulative Loss Ratio', current_value: clr[1], breached: /yes/i.test(clr[2] || '') });
  }
  if (trig.length) {
    (result as any).triggers = trig;
  }

  // Legacy aggregates from parsed tranches
  if (result.tranches && result.tranches.length) {
    result.senior_tranche_os = result.tranches
      .filter(t => /class\s*a|senior/i.test(t.name))
      .reduce((s, t) => s + (t.balance || 0), 0);
    result.protected_tranche = result.tranches
      .filter(t => /class\s*[b-e]|mezzanine|junior|subordinated/i.test(t.name))
      .reduce((s, t) => s + (t.balance || 0), 0);
    if (!result.portfolio_balance) {
      result.portfolio_balance = result.tranches.reduce((s, t) => s + (t.balance || 0), 0);
    }
    if (!result.weighted_avg_rate && result.portfolio_balance) {
      const totalBal = result.portfolio_balance || 1;
      result.weighted_avg_rate = result.tranches.reduce((s, t) => s + (t.balance || 0) * (t.interest_rate || 0), 0) / totalBal;
    }
  }
  
  // Extract securitization-specific financial metrics (glossary-aware)
  const securitizationMetrics = [
    { key: 'portfolio_balance', patterns: [
      /outstanding\s*principal\s*balance[:\s]*([€$£¥]?[\d.,]+)/gi,
      /outstanding\s*(?:pool|portfolio)\s*(?:balance|amount)[:\s]*([€$£¥]?[\d.,]+)/gi,
      /total\s*outstanding[:\s]*([€$£¥]?[\d.,]+)/gi
    ]},
    { key: 'original_portfolio_balance', patterns: [
      /original\s*principal\s*balance[:\s]*([€$£¥]?[\d.,]+)/gi
    ]},
    { key: 'available_distribution_amount', patterns: [
      /available\s*distribution\s*amount[:\s]*([€$£¥]?[\d.,]+)/gi
    ]},
    { key: 'reserve_account_balance', patterns: [
      /reserve\s*accounts?\s*(?:balance|amount)[:\s]*([€$£¥]?[\d.,]+)/gi
    ]},
    { key: 'risk_retention_percent', patterns: [
      /risk\s*retention[:\s]*([\d.,]+)%/gi
    ]},
    { key: 'collateral_balance', patterns: [
      /(?:collateral|pool|portfolio)\s*(?:balance|amount)[:\s]*([\d,]+\.?\d*)/gi
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
  const pats = [
    new RegExp(`${trancheName}[^\\n]{0,80}wal[:\\s]*([\\d.,]+)`, 'i'),
    new RegExp(`wal[^\\n]{0,80}${trancheName}[:\\s]*([\\d.,]+)`, 'i'),
  ];
  for (const p of pats) {
    const m = p.exec(text);
    if (m?.[1]) {
      const val = parseFinancialNumber(m[1]);
      if (val > 0 && val < 50) return val;
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
    'loss', 'cpr', 'portfolio', 'currency', 'mezzanine', 'notes',
    'nominal', 'principal', 'isin', 'series', 'wal', 'report'
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
  let v = (value || '').trim();
  const isNeg = /^\(.*\)$/.test(v) || /^-/.test(v);
  v = v.replace(/^\(|\)$/g, '');
  // Detect European format (comma decimal) and normalize
  const hasComma = v.includes(',');
  const hasDot = v.includes('.');
  if (hasComma && (!hasDot || v.lastIndexOf(',') > v.lastIndexOf('.'))) {
    v = v
      .replace(/[€$£¥\s]/g, '')
      .replace(/\./g, '') // remove thousand separators
      .replace(/,/g, '.') // convert decimal comma to dot
      .replace(/%/g, '');
  } else {
    v = v.replace(/[€$£¥,\s%]/g, '');
  }
  const num = parseFloat(v);
  if (isNaN(num)) return 0;
  return isNeg ? -num : num;
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
  const s = dateStr.trim();
  const m1 = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s); // DD.MM.YYYY
  if (m1) {
    const [_, d, m, y] = m1;
    return `${y}-${m}-${d}`;
  }
  const m2 = /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/.exec(s);
  if (m2) {
    let [_, a, b, y] = m2 as unknown as [string, string, string, string];
    if (y.length === 2) y = String(2000 + Number(y));
    const dd = Number(a) > 12 ? a.padStart(2,'0') : b.padStart(2,'0');
    const mm = Number(a) > 12 ? b.padStart(2,'0') : a.padStart(2,'0');
    return `${y}-${mm}-${dd}`;
  }
  return s;
}

// Calculate text quality ratio (meaningful characters vs total)
function calculateTextQuality(text: string): number {
  if (!text || text.length === 0) return 0;
  
  // Count meaningful characters (letters, numbers, common punctuation)
  const meaningfulChars = text.match(/[a-zA-Z0-9\s.,;:!?€$£¥%()[\]{}_+=|\\/"'-]/g) || [];
  const meaningfulRatio = meaningfulChars.length / text.length;
  
  // Check for readable word patterns
  const readableWords = text.match(/\b[a-zA-Z]{2,}\b/g) || [];
  const wordDensity = readableWords.length / (text.length / 100); // words per 100 chars
  
  // Combined quality score
  return Math.min(meaningfulRatio + (wordDensity * 0.1), 1.0);
}

function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}
