import { supabase } from '@/integrations/supabase/client';

export interface LoanRecord {
  id?: string;
  created_at?: string;
  user_id?: string;
  dataset_name?: string;
  loan_amount: number;
  interest_rate: number;
  term: number;
  remaining_term: number | null;
  credit_score: number;
  ltv: number;
  opening_balance: number;
  pd: number;
  file_name: string;
  worksheet_name: string;
}

interface DatasetSummary {
  dataset_name: string;
  record_count: number;
  total_value: number;
  avg_interest_rate: number;
  created_at: string;
}

export interface TrancheStructure {
  id: string;
  structure_name: string;
  dataset_name: string;
  tranches: any[];
  total_cost: number;
  weighted_avg_cost_bps: number;
  cost_percentage: number;
  additional_transaction_costs?: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const insertLoanData = async (
  loanData: LoanRecord[],
  progressCallback?: (completed: number, total: number) => void
): Promise<void> => {
  // Get the current user to ensure we have proper authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('Authentication error during insert:', authError);
    throw new Error('User not authenticated. Please log out and log back in.');
  }

  console.log('🔐 AUTHENTICATED USER FOR INSERT:', user.id);

  const BATCH_SIZE = 1000;
  const totalRecords = loanData.length;
  let completedRecords = 0;

  for (let i = 0; i < totalRecords; i += BATCH_SIZE) {
    const batch = loanData.slice(i, i + BATCH_SIZE);

    // Ensure all records have the correct user_id and map to database column names
    const batchWithUserId = batch.map(record => ({
      ...record,
      user_id: user.id, // Explicitly set the user_id for RLS compliance
      // Map frontend interface to database columns
      loan_type: record.remaining_term?.toString() || 'N/A',
      credit_score: record.pd || 0,
      // Remove the frontend interface fields that don't exist in DB
      remaining_term: undefined
    }));

    console.log('💾 INSERTING BATCH:', {
      batchSize: batchWithUserId.length,
      userId: user.id,
      sampleRecord: batchWithUserId[0]
    });

    const { error } = await supabase
      .from('loan_data')
      .insert(batchWithUserId);

    if (error) {
      console.error('Error inserting loan data batch:', error);
      throw new Error(`Failed to insert data: ${error.message}`);
    }

    completedRecords += batch.length;
    if (progressCallback) {
      progressCallback(completedRecords, totalRecords);
    }
  }

  console.log('✅ ALL BATCHES INSERTED SUCCESSFULLY');
};

export const getLoanDataByDataset = async (
  datasetName: string,
  page: number,
  pageSize: number
): Promise<{ data: LoanRecord[]; totalCount: number; hasMore: boolean }> => {
  const startIndex = page * pageSize;
  
  // Fetch total count first
  const { count, error: countError } = await supabase
    .from('loan_data')
    .select('*', { count: 'exact', head: true })
    .eq('dataset_name', datasetName);
  
  if (countError) {
    console.error('Error fetching total count:', countError);
    throw countError;
  }
  
  // Then fetch the data
  const { data, error } = await supabase
    .from('loan_data')
    .select('*')
    .eq('dataset_name', datasetName)
    .range(startIndex, startIndex + pageSize - 1)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching loan data:', error);
    throw error;
  }

  const totalCount = count || 0;
  const hasMore = startIndex + pageSize < totalCount;

  // Transform database columns back to frontend interface
  const transformedData = (data || []).map(record => ({
    ...record,
    remaining_term: record.loan_type ? parseFloat(record.loan_type) : null,
    // Keep the database fields for compatibility but prefer the new interface names
    loan_type: record.loan_type,
    credit_score: record.credit_score
  }));

  return { data: transformedData, totalCount, hasMore };
};

export const deleteLoanDataByDataset = async (datasetName: string): Promise<void> => {
  // First, delete the loan data
  const { error: loanDataError } = await supabase
    .from('loan_data')
    .delete()
    .eq('dataset_name', datasetName);

  if (loanDataError) {
    console.error('Error deleting loan data by dataset:', loanDataError);
    throw loanDataError;
  }

  // Then, delete any dataset shares for this dataset
  const { error: sharesError } = await supabase
    .from('dataset_shares')
    .delete()
    .eq('dataset_name', datasetName);

  if (sharesError) {
    console.error('Error deleting dataset shares:', sharesError);
    // Don't throw here as the main data deletion succeeded
    // Just log the error for now
  }

  console.log(`Successfully deleted dataset "${datasetName}" and its shares`);
};

export const deleteLoanData = async (recordIds: string[]): Promise<void> => {
  const { error } = await supabase
    .from('loan_data')
    .delete()
    .in('id', recordIds);

  if (error) {
    console.error('Error deleting loan data:', error);
    throw error;
  }
};

export const getDatasetSummaries = async (): Promise<DatasetSummary[]> => {
  const { data, error } = await supabase.rpc('get_dataset_summaries');
  
  if (error) {
    console.error('Error fetching dataset summaries:', error);
    throw error;
  }
  
  return data || [];
};

// Enhanced function to get datasets including shared ones with better error handling
export const getAccessibleDatasets = async (): Promise<{ name: string; owner_id: string; is_shared: boolean }[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  console.log('🔍 FETCHING ACCESSIBLE DATASETS for user:', user.id, 'email:', user.email);

  try {
    const uniqueDatasets = new Map<string, { name: string; owner_id: string; is_shared: boolean }>();
    
    // First, get unique datasets owned by the user using efficient GROUP BY database function
    const { data: ownedDatasets, error: ownedError } = await (supabase as any)
      .rpc('get_user_unique_datasets', { 
        input_user_id: user.id 
      });

    if (ownedError) {
      console.error('❌ Error fetching owned datasets:', ownedError);
      throw ownedError;
    }

    console.log('📊 OWNED DATASETS:', ownedDatasets?.length || 0, 'unique datasets');

    // Process owned datasets and deduplicate
    if (ownedDatasets && ownedDatasets.length > 0) {
      ownedDatasets.forEach(record => {
        if (record.dataset_name && record.dataset_name.trim()) {
          const datasetName = record.dataset_name.trim();
          if (!uniqueDatasets.has(datasetName)) {
            uniqueDatasets.set(datasetName, {
              name: datasetName,
              owner_id: record.user_id,
              is_shared: false
            });
          }
        }
      });
    }

    console.log('📊 UNIQUE OWNED DATASETS:', Array.from(uniqueDatasets.keys()));

    // Second, get shared datasets - check both email and user_id matches
    const { data: sharedDatasets, error: sharedError } = await supabase
      .from('dataset_shares')
      .select('dataset_name, owner_id')
      .or(`shared_with_email.eq.${user.email},shared_with_user_id.eq.${user.id}`)
      .not('dataset_name', 'is', null)
      .not('dataset_name', 'eq', '');

    if (sharedError) {
      console.error('❌ Error fetching shared datasets:', sharedError);
      // Continue with owned datasets only, don't throw
    } else {
      console.log('📊 SHARED DATASETS:', sharedDatasets?.length || 0, 'records');

      // Add shared datasets
      if (sharedDatasets && sharedDatasets.length > 0) {
        sharedDatasets.forEach(share => {
          if (share.dataset_name && share.dataset_name.trim()) {
            const datasetName = share.dataset_name.trim();
            if (!uniqueDatasets.has(datasetName)) {
              uniqueDatasets.set(datasetName, {
                name: datasetName,
                owner_id: share.owner_id,
                is_shared: true
              });
            }
          }
        });
      }
    }

    // Convert to array and sort by name
    const result = Array.from(uniqueDatasets.values())
      .sort((a, b) => a.name.localeCompare(b.name));
    
    console.log('📊 FINAL ACCESSIBLE DATASETS:', {
      totalFound: result.length,
      datasetNames: result.map(d => d.name),
      ownedCount: result.filter(d => !d.is_shared).length,
      sharedCount: result.filter(d => d.is_shared).length
    });

    return result;
  } catch (error) {
    console.error('❌ Error in getAccessibleDatasets:', error);
    throw error;
  }
};

export const getUserDatasets = async (): Promise<{ name: string; owner_id: string }[]> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('loan_data')
    .select('dataset_name, user_id')
    .eq('user_id', user.id)
    .not('dataset_name', 'is', null);

  if (error) {
    console.error('Error fetching user datasets:', error);
    throw error;
  }

  // Deduplicate datasets by name
  const uniqueDatasets = new Map();
  data?.forEach(dataset => {
    if (dataset.dataset_name && dataset.dataset_name.trim()) {
      uniqueDatasets.set(dataset.dataset_name, { name: dataset.dataset_name, owner_id: dataset.user_id });
    }
  });

  return Array.from(uniqueDatasets.values());
};

export interface DatasetShare {
  id?: string;
  dataset_name: string;
  owner_id: string;
  shared_with_email: string;
  created_at?: string;
}

export const shareDataset = async (datasetName: string, sharedWithEmail: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('dataset_shares')
    .insert([{
      dataset_name: datasetName,
      owner_id: user.id,
      shared_with_email: sharedWithEmail
    }]);

  if (error) {
    console.error('Error sharing dataset:', error);
    throw error;
  }
};

export const getDatasetShares = async (datasetName: string): Promise<DatasetShare[]> => {
  const { data, error } = await supabase
    .from('dataset_shares')
    .select('*')
    .eq('dataset_name', datasetName);

  if (error) {
    console.error('Error fetching dataset shares:', error);
    throw error;
  }

  return (data || []) as DatasetShare[];
};

export const removeDatasetShare = async (shareId: string): Promise<void> => {
  const { error } = await supabase
    .from('dataset_shares')
    .delete()
    .eq('id', shareId);

  if (error) {
    console.error('Error removing dataset share:', error);
    throw error;
  }
};

// Tranche structure functions
export const saveTrancheStructure = async (structure: TrancheStructure): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('tranche_structures')
    .insert({
      structure_name: structure.structure_name,
      dataset_name: structure.dataset_name,
      tranches: structure.tranches as any, // Cast to Json type for database
      total_cost: structure.total_cost,
      weighted_avg_cost_bps: structure.weighted_avg_cost_bps,
      cost_percentage: structure.cost_percentage,
      user_id: user.id
    });

  if (error) {
    console.error('Error saving tranche structure:', error);
    throw error;
  }
};

export const getTrancheStructures = async (): Promise<TrancheStructure[]> => {
  const { data, error } = await supabase
    .from('tranche_structures')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tranche structures:', error);
    throw error;
  }

  // Cast the Json tranches back to array type
  return (data || []).map(item => ({
    ...item,
    tranches: item.tranches as any[]
  })) as TrancheStructure[];
};

export const deleteTrancheStructure = async (structureId: string): Promise<void> => {
  const { error } = await supabase
    .from('tranche_structures')
    .delete()
    .eq('id', structureId);

  if (error) {
    console.error('Error deleting tranche structure:', error);
    throw error;
  }
};

// Portfolio summary function - calculates summary for entire dataset server-side
export interface PortfolioSummary {
  totalValue: number;
  avgInterestRate: number;
  highRiskLoans: number;
  totalRecords: number;
}

export const getPortfolioSummary = async (datasetName: string): Promise<PortfolioSummary | null> => {
  const { data, error } = await (supabase as any)
    .rpc('get_portfolio_summary', { 
      dataset_name_param: datasetName 
    });

  if (error) {
    console.error('Error fetching portfolio summary:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    return null;
  }

  const summary = data[0];
  return {
    totalValue: parseFloat(summary.total_value) || 0,
    avgInterestRate: parseFloat(summary.avg_interest_rate) || 0,
    highRiskLoans: parseInt(summary.high_risk_loans) || 0,
    totalRecords: parseInt(summary.total_records) || 0
  };
};
