import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FilterCriteria {
  minLoanAmount?: number;
  maxLoanAmount?: number;
  minInterestRate?: number;
  maxInterestRate?: number;
  minRemainingTerm?: number;
  maxRemainingTerm?: number;
  minPD?: number;
  maxPD?: number;
  minLGD?: number;
  maxLGD?: number;
  maxExposureCap?: number;
  exposureCapAmount?: number;
  minLeverageRatio?: number;
  maxLeverageRatio?: number;
  creditRating?: string;
}

interface CopyFilteredDatasetRequest {
  sourceDatasetName: string;
  newDatasetName: string;
  filters: FilterCriteria;
  loanType?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header to identify the user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ User authenticated:', user.id);

    const { sourceDatasetName, newDatasetName, filters, loanType }: CopyFilteredDatasetRequest = await req.json();

    console.log('🔄 COPYING FILTERED DATASET:', {
      source: sourceDatasetName,
      destination: newDatasetName,
      userId: user.id,
      loanType,
      filters
    });

    // Route to appropriate database function based on loan type
    let copyResult, copyError;
    
    if (loanType === 'corporate_term_loans') {
      console.log('📊 Using CTL-specific copy function');
      const result = await supabase.rpc('copy_filtered_ctl_dataset', {
        p_source_dataset: sourceDatasetName,
        p_new_dataset: newDatasetName,
        p_user_id: user.id,
        p_min_loan_amount: filters.minLoanAmount || null,
        p_max_loan_amount: filters.maxLoanAmount || null,
        p_min_leverage_ratio: filters.minLeverageRatio || null,
        p_max_leverage_ratio: filters.maxLeverageRatio || null,
        p_credit_rating_filter: filters.creditRating || null,
        p_max_exposure_cap: filters.maxExposureCap || null,
        p_exposure_cap_amount: filters.exposureCapAmount || null,
      });
      copyResult = result.data;
      copyError = result.error;
    } else {
      console.log('💰 Using consumer finance copy function');
      const result = await supabase.rpc('copy_filtered_dataset', {
        p_source_dataset: sourceDatasetName,
        p_new_dataset: newDatasetName,
        p_user_id: user.id,
        p_min_loan_amount: filters.minLoanAmount || null,
        p_max_loan_amount: filters.maxLoanAmount || null,
        p_min_interest_rate: filters.minInterestRate || null,
        p_max_interest_rate: filters.maxInterestRate || null,
        p_min_remaining_term: filters.minRemainingTerm || null,
        p_max_remaining_term: filters.maxRemainingTerm || null,
        p_min_pd: filters.minPD || null,
        p_max_pd: filters.maxPD || null,
        p_min_lgd: filters.minLGD || null,
        p_max_lgd: filters.maxLGD || null,
        p_max_exposure_cap: filters.maxExposureCap || null,
        p_exposure_cap_amount: filters.exposureCapAmount || null,
      });
      copyResult = result.data;
      copyError = result.error;
    }

    if (copyError) {
      console.error('❌ Database function copy failed:', copyError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to copy dataset', 
          details: copyError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const recordsCopied = copyResult?.[0]?.records_copied || 0;
    console.log(`✅ Successfully copied ${recordsCopied} records to dataset "${newDatasetName}"`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully copied ${recordsCopied} filtered records to "${newDatasetName}"`,
        recordsCopied: recordsCopied
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Edge function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});