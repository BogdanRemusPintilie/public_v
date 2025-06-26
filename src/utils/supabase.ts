import { supabase } from '@/integrations/supabase/client';

export { supabase };

export interface LoanRecord {
  id?: string;
  user_id?: string;
  loan_amount: number;
  interest_rate: number;
  term: number;
  loan_type: string;
  credit_score: number;
  ltv: number;
  opening_balance: number;
  pd?: number;
  dataset_name?: string;
  file_name?: string;
  worksheet_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DatasetShare {
  id?: string;
  dataset_name: string;
  owner_id: string;
  shared_with_user_id: string;
  created_at?: string;
  updated_at?: string;
}

export const createLoanDataTable = async () => {
  const { error } = await supabase.rpc('create_loan_data_table');
  if (error) {
    console.error('Error creating loan data table:', error);
    throw error;
  }
};

export const insertLoanData = async (
  loanData: LoanRecord[], 
  onProgress?: (completed: number, total: number) => void
) => {
  const BATCH_SIZE = 1000; // Process 1000 records at a time
  const totalRecords = loanData.length;
  let completedRecords = 0;
  const allInsertedData = [];

  console.log(`Starting batch insert of ${totalRecords} records with batch size ${BATCH_SIZE}`);
  
  // Process data in batches
  for (let i = 0; i < loanData.length; i += BATCH_SIZE) {
    const batch = loanData.slice(i, i + BATCH_SIZE);
    
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(totalRecords / BATCH_SIZE)}: records ${i + 1} to ${Math.min(i + BATCH_SIZE, totalRecords)}`);
    
    const { data, error } = await supabase
      .from('loan_data')
      .insert(batch)
      .select();
    
    if (error) {
      console.error(`Error inserting batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error);
      throw error;
    }
    
    if (data) {
      allInsertedData.push(...data);
    }
    
    completedRecords += batch.length;
    
    // Call progress callback if provided
    if (onProgress) {
      onProgress(completedRecords, totalRecords);
    }
    
    console.log(`Completed ${completedRecords}/${totalRecords} records (${Math.round((completedRecords / totalRecords) * 100)}%)`);
    
    // Add a small delay between batches to avoid overwhelming the database
    if (i + BATCH_SIZE < loanData.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(`Successfully inserted all ${totalRecords} records`);
  return allInsertedData;
};

// New optimized function to get loan data with pagination
export const getLoanDataPaginated = async (page: number = 0, pageSize: number = 1000) => {
  console.log(`Fetching loan data page ${page + 1} with ${pageSize} records per page`);
  
  const from = page * pageSize;
  const to = from + pageSize - 1;
  
  const { data, error, count } = await supabase
    .from('loan_data')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching paginated loan data:', error);
    throw error;
  }
  
  console.log(`Fetched ${data?.length || 0} records for page ${page + 1}, total count: ${count}`);
  
  return {
    data: data as LoanRecord[],
    totalCount: count || 0,
    hasMore: count ? (from + pageSize) < count : false
  };
};

// Optimized function to get dataset summaries without loading all data
export const getDatasetSummaries = async () => {
  console.log('Fetching dataset summaries');
  
  const { data, error } = await supabase
    .from('loan_data')
    .select(`
      dataset_name,
      opening_balance,
      interest_rate,
      created_at,
      id,
      pd
    `)
    .not('dataset_name', 'is', null);
  
  if (error) {
    console.error('Error fetching dataset summaries:', error);
    throw error;
  }
  
  // Group by dataset_name and calculate summaries
  const datasetMap = new Map();
  
  data.forEach(record => {
    const datasetName = record.dataset_name || 'Unnamed Dataset';
    if (!datasetMap.has(datasetName)) {
      datasetMap.set(datasetName, {
        dataset_name: datasetName,
        record_count: 0,
        total_value: 0,
        weighted_interest_sum: 0,
        high_risk_count: 0,
        earliest_date: record.created_at,
        record_ids: []
      });
    }
    
    const dataset = datasetMap.get(datasetName);
    dataset.record_count++;
    dataset.total_value += record.opening_balance;
    dataset.weighted_interest_sum += (record.interest_rate * record.opening_balance);
    if ((record.pd || 0) > 0.05) {
      dataset.high_risk_count++;
    }
    if (new Date(record.created_at) < new Date(dataset.earliest_date)) {
      dataset.earliest_date = record.created_at;
    }
    dataset.record_ids.push(record.id);
  });
  
  // Convert to array and calculate averages
  const summaries = Array.from(datasetMap.values()).map(dataset => ({
    dataset_name: dataset.dataset_name,
    record_count: dataset.record_count,
    total_value: dataset.total_value,
    avg_interest_rate: dataset.total_value > 0 ? dataset.weighted_interest_sum / dataset.total_value : 0,
    high_risk_count: dataset.high_risk_count,
    created_at: dataset.earliest_date,
    record_ids: dataset.record_ids
  }));
  
  console.log(`Found ${summaries.length} dataset summaries`);
  return summaries;
};

export const getLoanData = async (userId?: string) => {
  console.log('Fetching loan data for authenticated user');
  
  // For backward compatibility, fetch first page only
  const result = await getLoanDataPaginated(0, 1000);
  return result.data;
};

export const deleteLoanData = async (ids: string[]) => {
  console.log('Attempting to delete loan records with IDs:', ids);
  
  if (!ids || ids.length === 0) {
    throw new Error('No IDs provided for deletion');
  }

  // Delete records in smaller batches to avoid URL length issues
  const BATCH_SIZE = 100;
  const batches = [];
  
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    batches.push(ids.slice(i, i + BATCH_SIZE));
  }
  
  for (const batch of batches) {
    console.log(`Deleting batch of ${batch.length} records`);
    
    const { error } = await supabase
      .from('loan_data')
      .delete()
      .in('id', batch);
    
    if (error) {
      console.error('Error deleting loan data batch:', error);
      throw error;
    }
    
    console.log(`Successfully deleted batch of ${batch.length} records`);
  }
  
  console.log(`Successfully deleted all ${ids.length} records`);
};

// New functions for dataset sharing
export const shareDataset = async (datasetName: string, sharedWithUserId: string) => {
  console.log('Sharing dataset:', datasetName, 'with user:', sharedWithUserId);
  
  const { data, error } = await (supabase as any)
    .from('dataset_shares')
    .insert({
      dataset_name: datasetName,
      owner_id: (await supabase.auth.getUser()).data.user?.id,
      shared_with_user_id: sharedWithUserId
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error sharing dataset:', error);
    throw error;
  }
  
  console.log('Dataset shared successfully:', data);
  return data;
};

export const getDatasetShares = async (datasetName?: string) => {
  console.log('Fetching dataset shares for:', datasetName);
  
  let query = (supabase as any)
    .from('dataset_shares')
    .select('*');
  
  if (datasetName) {
    query = query.eq('dataset_name', datasetName);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching dataset shares:', error);
    throw error;
  }
  
  console.log('Dataset shares fetched:', data);
  return data as DatasetShare[];
};

export const removeDatasetShare = async (shareId: string) => {
  console.log('Removing dataset share:', shareId);
  
  const { error } = await (supabase as any)
    .from('dataset_shares')
    .delete()
    .eq('id', shareId);
  
  if (error) {
    console.error('Error removing dataset share:', error);
    throw error;
  }
  
  console.log('Dataset share removed successfully');
};

export const getUserDatasets = async () => {
  console.log('Fetching user datasets');
  
  // Use the optimized dataset summaries function
  const datasets = await getDatasetSummaries();
  
  return datasets.map(dataset => ({
    name: dataset.dataset_name,
    owner_id: 'current_user' // This would need to be enhanced for proper ownership tracking
  }));
};
