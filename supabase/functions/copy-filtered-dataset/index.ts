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
}

interface CopyFilteredDatasetRequest {
  sourceDatasetName: string;
  newDatasetName: string;
  filters: FilterCriteria;
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

    const { sourceDatasetName, newDatasetName, filters }: CopyFilteredDatasetRequest = await req.json();

    console.log('🔄 COPYING FILTERED DATASET:', {
      source: sourceDatasetName,
      destination: newDatasetName,
      userId: user.id,
      filters
    });

    // Build the WHERE clause for filtering
    let whereConditions = ['user_id = $1', 'dataset_name = $2'];
    let params: any[] = [user.id, sourceDatasetName];
    let paramIndex = 3;

    if (filters.minLoanAmount !== undefined) {
      whereConditions.push(`loan_amount >= $${paramIndex}`);
      params.push(filters.minLoanAmount);
      paramIndex++;
    }
    if (filters.maxLoanAmount !== undefined) {
      whereConditions.push(`loan_amount <= $${paramIndex}`);
      params.push(filters.maxLoanAmount);
      paramIndex++;
    }
    if (filters.minInterestRate !== undefined) {
      whereConditions.push(`interest_rate >= $${paramIndex}`);
      params.push(filters.minInterestRate);
      paramIndex++;
    }
    if (filters.maxInterestRate !== undefined) {
      whereConditions.push(`interest_rate <= $${paramIndex}`);
      params.push(filters.maxInterestRate);
      paramIndex++;
    }
    if (filters.minRemainingTerm !== undefined) {
      whereConditions.push(`remaining_term >= $${paramIndex}`);
      params.push(filters.minRemainingTerm);
      paramIndex++;
    }
    if (filters.maxRemainingTerm !== undefined) {
      whereConditions.push(`remaining_term <= $${paramIndex}`);
      params.push(filters.maxRemainingTerm);
      paramIndex++;
    }
    if (filters.minPD !== undefined) {
      whereConditions.push(`COALESCE(pd, 0) >= $${paramIndex}`);
      params.push(filters.minPD);
      paramIndex++;
    }
    if (filters.maxPD !== undefined) {
      whereConditions.push(`COALESCE(pd, 0) <= $${paramIndex}`);
      params.push(filters.maxPD);
      paramIndex++;
    }
    if (filters.minLGD !== undefined) {
      whereConditions.push(`COALESCE(lgd, 0) >= $${paramIndex}`);
      params.push(filters.minLGD);
      paramIndex++;
    }
    if (filters.maxLGD !== undefined) {
      whereConditions.push(`COALESCE(lgd, 0) <= $${paramIndex}`);
      params.push(filters.maxLGD);
      paramIndex++;
    }

    // Add the new dataset name parameter
    params.push(newDatasetName);
    const newDatasetParamIndex = paramIndex;

    // Build the SQL query for server-side copy
    const copyQuery = `
      INSERT INTO loan_data (
        user_id, dataset_name, loan_amount, interest_rate, term, remaining_term,
        lgd, ltv, opening_balance, pd, file_name, worksheet_name
      )
      SELECT 
        user_id, $${newDatasetParamIndex} as dataset_name, loan_amount, interest_rate, term, remaining_term,
        lgd, ltv, opening_balance, pd, file_name, worksheet_name
      FROM loan_data 
      WHERE ${whereConditions.join(' AND ')}
    `;

    console.log('🗃️ EXECUTING SERVER-SIDE COPY:', {
      query: copyQuery,
      paramCount: params.length
    });

    // Execute the server-side copy operation
    const { data, error } = await supabase.rpc('exec_sql_function', {
      sql_query: copyQuery,
      params: params
    });

    if (error) {
      console.error('❌ Database copy failed:', error);
      
      // Try using a direct insert-select approach
      console.log('🔄 TRYING DIRECT INSERT-SELECT...');
      
      // Get the filtered records first
      let query = supabase
        .from('loan_data')
        .select('user_id, loan_amount, interest_rate, term, remaining_term, lgd, ltv, opening_balance, pd, file_name, worksheet_name')
        .eq('user_id', user.id)
        .eq('dataset_name', sourceDatasetName);

      // Apply filters
      if (filters.minLoanAmount !== undefined) query = query.gte('loan_amount', filters.minLoanAmount);
      if (filters.maxLoanAmount !== undefined) query = query.lte('loan_amount', filters.maxLoanAmount);
      if (filters.minInterestRate !== undefined) query = query.gte('interest_rate', filters.minInterestRate);
      if (filters.maxInterestRate !== undefined) query = query.lte('interest_rate', filters.maxInterestRate);
      if (filters.minRemainingTerm !== undefined) query = query.gte('remaining_term', filters.minRemainingTerm);
      if (filters.maxRemainingTerm !== undefined) query = query.lte('remaining_term', filters.maxRemainingTerm);
      if (filters.minPD !== undefined) query = query.gte('pd', filters.minPD);
      if (filters.maxPD !== undefined) query = query.lte('pd', filters.maxPD);
      if (filters.minLGD !== undefined) query = query.gte('lgd', filters.minLGD);
      if (filters.maxLGD !== undefined) query = query.lte('lgd', filters.maxLGD);

      const { data: sourceRecords, error: selectError } = await query;
      
      if (selectError) {
        console.error('❌ Failed to select source records:', selectError);
        return new Response(
          JSON.stringify({ error: 'Failed to read source dataset', details: selectError.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log(`📊 Found ${sourceRecords?.length || 0} records to copy`);

      // Prepare records for insertion
      const recordsToInsert = sourceRecords?.map(record => ({
        ...record,
        dataset_name: newDatasetName,
        user_id: user.id
      })) || [];

      // Insert in batches to avoid timeout
      const BATCH_SIZE = 1000;
      let totalInserted = 0;

      for (let i = 0; i < recordsToInsert.length; i += BATCH_SIZE) {
        const batch = recordsToInsert.slice(i, i + BATCH_SIZE);
        console.log(`📝 Inserting batch ${Math.floor(i / BATCH_SIZE) + 1}, records ${i + 1}-${Math.min(i + BATCH_SIZE, recordsToInsert.length)}`);
        
        const { error: insertError } = await supabase
          .from('loan_data')
          .insert(batch);

        if (insertError) {
          console.error('❌ Batch insert failed:', insertError);
          return new Response(
            JSON.stringify({ 
              error: 'Failed to insert records', 
              details: insertError.message,
              insertedSoFar: totalInserted
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        totalInserted += batch.length;
      }

      console.log(`✅ Successfully copied ${totalInserted} records to dataset "${newDatasetName}"`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Successfully copied ${totalInserted} filtered records to "${newDatasetName}"`,
          recordsCopied: totalInserted
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Server-side copy completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully copied filtered records to "${newDatasetName}"` 
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