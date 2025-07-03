
import { supabase } from '@/integrations/supabase/client';

export interface LoanRecord {
  id?: string;
  created_at?: string;
  user_id?: string;
  dataset_name?: string;
  loan_amount: number;
  interest_rate: number;
  term: number;
  loan_type: string;
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

export const insertLoanData = async (
  loanData: LoanRecord[],
  progressCallback?: (completed: number, total: number) => void
): Promise<void> => {
  const BATCH_SIZE = 1000;
  const totalRecords = loanData.length;
  let completedRecords = 0;

  for (let i = 0; i < totalRecords; i += BATCH_SIZE) {
    const batch = loanData.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from('loan_data')
      .insert(batch);

    if (error) {
      console.error('Error inserting loan data:', error);
      throw error; // Re-throw to stop the process
    }

    completedRecords += batch.length;
    if (progressCallback) {
      progressCallback(completedRecords, totalRecords);
    }
  }
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

  return { data: data || [], totalCount, hasMore };
};

export const deleteLoanDataByDataset = async (datasetName: string): Promise<void> => {
  const { error } = await supabase
    .from('loan_data')
    .delete()
    .eq('dataset_name', datasetName);

  if (error) {
    console.error('Error deleting loan data by dataset:', error);
    throw error;
  }
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

  console.log('🔍 FETCHING ACCESSIBLE DATASETS for user:', user.id);

  try {
    // Get owned datasets with better error handling
    const { data: ownedDatasets, error: ownedError } = await supabase
      .from('loan_data')
      .select('dataset_name, user_id')
      .eq('user_id', user.id)
      .not('dataset_name', 'is', null);

    if (ownedError) {
      console.error('❌ Error fetching owned datasets:', ownedError);
      throw ownedError;
    }

    console.log('📊 OWNED DATASETS RAW:', ownedDatasets);

    // Get shared datasets with better error handling
    const { data: sharedDatasets, error: sharedError } = await supabase
      .from('dataset_shares')
      .select('dataset_name, owner_id')
      .or(`shared_with_email.eq.${user.email},shared_with_user_id.eq.${user.id}`);

    if (sharedError) {
      console.error('❌ Error fetching shared datasets:', sharedError);
      // Don't throw here, just log the error and continue with owned datasets only
      console.log('⚠️ Continuing with owned datasets only due to sharing error');
    }

    console.log('📊 SHARED DATASETS RAW:', sharedDatasets);

    // Combine and deduplicate datasets with better logic
    const datasets = new Map<string, { name: string; owner_id: string; is_shared: boolean }>();

    // Add owned datasets - get unique dataset names
    const uniqueOwnedDatasets = new Map();
    ownedDatasets?.forEach(dataset => {
      if (dataset.dataset_name && dataset.dataset_name.trim()) {
        uniqueOwnedDatasets.set(dataset.dataset_name, dataset);
      }
    });

    // Add unique owned datasets to final result
    uniqueOwnedDatasets.forEach((dataset, datasetName) => {
      datasets.set(datasetName, {
        name: datasetName,
        owner_id: dataset.user_id,
        is_shared: false
      });
    });

    // Add shared datasets (don't override owned ones) - also deduplicate
    const uniqueSharedDatasets = new Map();
    sharedDatasets?.forEach(share => {
      if (share.dataset_name && share.dataset_name.trim()) {
        uniqueSharedDatasets.set(share.dataset_name, share);
      }
    });

    // Add unique shared datasets that aren't already owned
    uniqueSharedDatasets.forEach((share, datasetName) => {
      if (!datasets.has(datasetName)) {
        datasets.set(datasetName, {
          name: datasetName,
          owner_id: share.owner_id,
          is_shared: true
        });
      }
    });

    const result = Array.from(datasets.values());
    console.log('📊 FINAL ACCESSIBLE DATASETS:', result);

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
