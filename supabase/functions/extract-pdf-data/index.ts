
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
    
    console.log('🔍 Starting PDF text extraction...');
    
    // Use PDF parsing - we'll use a simple text extraction approach
    // since complex PDF libraries aren't easily available in Deno
    let extractedText = '';
    
    try {
      // For now, we'll extract what we can from the PDF structure
      // This is a simplified approach - in production you'd use a proper PDF library
      const textDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false });
      const rawText = textDecoder.decode(uint8Array);
      
      // Extract readable text from PDF structure
      const textMatches = rawText.match(/\((.*?)\)/g) || [];
      const streamMatches = rawText.match(/stream\s+(.*?)\s+endstream/gs) || [];
      
      // Combine extracted text
      extractedText = [
        ...textMatches.map(match => match.slice(1, -1)),
        ...streamMatches.map(match => match.replace(/stream\s+|\s+endstream/g, ''))
      ].join(' ').replace(/[^\x20-\x7E\s]/g, ' ').replace(/\s+/g, ' ').trim();
      
      console.log(`✅ Text extracted, length: ${extractedText.length}`);
      console.log(`📝 Sample text: ${extractedText.substring(0, 200)}`);
      
    } catch (error) {
      console.error('❌ PDF text extraction failed:', error);
      extractedText = '';
    }
    
    // Parse the extracted text for financial data
    const financialData = parseFinancialText(extractedText);
    
    console.log('💰 Financial data extracted:', financialData);
    
    return new Response(
      JSON.stringify({
        success: true,
        extractedData: financialData,
        textLength: extractedText.length,
        sampleText: extractedText.substring(0, 500)
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

function parseFinancialText(text: string): ExtractedFinancialData {
  const result: ExtractedFinancialData = {};
  
  if (!text || text.length < 10) {
    console.log('⚠️ No meaningful text to parse');
    return result;
  }
  
  console.log('🔍 Parsing financial data from text...');
  
  // Common patterns for financial data extraction
  const patterns = {
    payment_date: /payment\s+date[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{4}-\d{2}-\d{2})/i,
    next_payment_date: /next\s+payment[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{4}|\d{4}-\d{2}-\d{2})/i,
    senior_tranche: /senior.*?(?:balance|outstanding)[:\s]+([\d,]+\.?\d*)/i,
    protected_tranche: /protected.*?(?:balance|outstanding)[:\s]+([\d,]+\.?\d*)/i,
    cpr: /cpr[:\s]+([\d.]+)%?/i,
    losses: /(?:cumulative\s+)?losses[:\s]+([\d,]+\.?\d*)/i,
    portfolio_balance: /portfolio\s+balance[:\s]+([\d,]+\.?\d*)/i,
    weighted_rate: /weighted.*?rate[:\s]+([\d.]+)%?/i
  };

  // Extract dates
  const paymentMatch = text.match(patterns.payment_date);
  if (paymentMatch) {
    result.payment_date = standardizeDate(paymentMatch[1]);
    console.log('📅 Found payment date:', result.payment_date);
  }

  const nextPaymentMatch = text.match(patterns.next_payment_date);
  if (nextPaymentMatch) {
    result.next_payment_date = standardizeDate(nextPaymentMatch[1]);
    console.log('📅 Found next payment date:', result.next_payment_date);
  }

  // Extract financial figures
  const seniorMatch = text.match(patterns.senior_tranche);
  if (seniorMatch) {
    result.senior_tranche_os = parseNumber(seniorMatch[1]);
    console.log('💰 Found senior tranche:', result.senior_tranche_os);
  }

  const protectedMatch = text.match(patterns.protected_tranche);
  if (protectedMatch) {
    result.protected_tranche = parseNumber(protectedMatch[1]);
    console.log('💰 Found protected tranche:', result.protected_tranche);
  }

  const cprMatch = text.match(patterns.cpr);
  if (cprMatch) {
    result.cpr_annualised = parseFloat(cprMatch[1]);
    console.log('📊 Found CPR:', result.cpr_annualised);
  }

  const lossesMatch = text.match(patterns.losses);
  if (lossesMatch) {
    result.cum_losses = parseNumber(lossesMatch[1]);
    console.log('📉 Found losses:', result.cum_losses);
  }

  const portfolioMatch = text.match(patterns.portfolio_balance);
  if (portfolioMatch) {
    result.portfolio_balance = parseNumber(portfolioMatch[1]);
    console.log('💼 Found portfolio balance:', result.portfolio_balance);
  }

  const rateMatch = text.match(patterns.weighted_rate);
  if (rateMatch) {
    result.weighted_avg_rate = parseFloat(rateMatch[1]);
    console.log('📈 Found weighted rate:', result.weighted_avg_rate);
  }

  // Extract tranche information
  result.tranches = extractTranches(text);
  if (result.tranches.length > 0) {
    console.log('🎯 Found tranches:', result.tranches.length);
  }

  // Set currency default
  result.currency = 'EUR';

  return result;
}

function extractTranches(text: string): TrancheData[] {
  const tranches: TrancheData[] = [];
  
  // Look for tabular data patterns
  const lines = text.split(/[\n\r]+/);
  const tranchePattern = /(senior|protected|mezzanine|junior|class\s+[a-z])\s+.*?(\d+[\d,]*\.?\d*)\s+.*?(\d+\.?\d*%?)/i;
  
  for (const line of lines) {
    const match = line.match(tranchePattern);
    if (match) {
      tranches.push({
        name: match[1],
        balance: parseNumber(match[2]),
        interest_rate: parseNumber(match[3]),
        wal: 0,
        rating: 'NR'
      });
    }
  }
  
  return tranches;
}

function parseNumber(value: any): number {
  if (typeof value === 'number') return value;
  const str = String(value).replace(/[,$%]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

function standardizeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  } catch {
    return dateStr;
  }
}
