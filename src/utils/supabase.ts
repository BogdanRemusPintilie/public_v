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
  shared_with_email: string;
  shared_with_user_id?: string;
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

// Function to get loan data with pagination
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

// FIXED: Function to get ALL loan data without any limits
export const getAllLoanData = async () => {
  console.log('Fetching ALL loan data for authenticated user');
  
  // Get total count first
  const { count } = await supabase
    .from('loan_data')
    .select('*', { count: 'exact', head: true });
  
  if (!count || count === 0) {
    console.log('No loan data found');
    return [];
  }
  
  console.log(`Found ${count} total records, fetching all...`);
  
  // CRITICAL FIX: Use smaller batch size and proper range calculation
  const BATCH_SIZE = 1000; // Use smaller batch size to avoid any potential limits
  const allRecords: LoanRecord[] = [];
  
  for (let offset = 0; offset < count; offset += BATCH_SIZE) {
    const endOffset = Math.min(offset + BATCH_SIZE - 1, count - 1);
    console.log(`Fetching batch: records ${offset} to ${endOffset} of ${count - 1}`);
    
    const { data, error } = await supabase
      .from('loan_data')
      .select('*')
      .range(offset, endOffset)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(`Error fetching batch starting at ${offset}:`, error);
      throw error;
    }
    
    if (data && data.length > 0) {
      allRecords.push(...data as LoanRecord[]);
      console.log(`Fetched ${data.length} records in this batch, total so far: ${allRecords.length}`);
    } else {
      console.log(`No data returned for batch starting at ${offset}`);
      break;
    }
    
    // Add a small delay between batches to avoid overwhelming the database
    if (offset + BATCH_SIZE < count) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  console.log(`Successfully fetched all ${allRecords.length} records out of expected ${count}`);
  
  // Verify we got all the records
  if (allRecords.length !== count) {
    console.warn(`Warning: Expected ${count} records but got ${allRecords.length}`);
  }
  
  return allRecords;
};

// FIXED: Use database function for accurate dataset summaries
export const getDatasetSummaries = async () => {
  console.log('Fetching dataset summaries using database function for accurate counts');
  
  try {
    // Call the database function to get accurate aggregated data
    const { data, error } = await supabase.rpc('get_dataset_summaries');
    
    if (error) {
      console.error('Error calling get_dataset_summaries function:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log('No datasets found');
      return [];
    }
    
    // Transform the data to match our interface
    const summaries = data.map((dataset: any) => ({
      dataset_name: dataset.dataset_name,
      record_count: parseInt(dataset.record_count) || 0,
      total_value: parseFloat(dataset.total_value) || 0,
      avg_interest_rate: parseFloat(dataset.avg_interest_rate) || 0,
      high_risk_count: parseInt(dataset.high_risk_count) || 0,
      created_at: dataset.created_at,
      record_ids: [] // We don't need individual IDs for summaries
    }));
    
    console.log(`Found ${summaries.length} dataset summaries with accurate database counts:`, 
      summaries.map(s => `${s.dataset_name}: ${s.record_count.toLocaleString()} records`));
    
    return summaries;
    
  } catch (error) {
    console.error('Error in getDatasetSummaries:', error);
    throw error;
  }
};

// Updated function that uses getAllLoanData for backward compatibility
export const getLoanData = async (userId?: string) => {
  console.log('Fetching all loan data for authenticated user (backward compatibility)');
  return await getAllLoanData();
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
export const shareDataset = async (datasetName: string, sharedWithEmail: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('dataset_shares')
    .insert({
      dataset_name: datasetName,
      owner_id: user.id,
      shared_with_email: sharedWithEmail
    });

  if (error) throw error;
};

export const getDatasetShares = async (datasetName: string): Promise<DatasetShare[]> => {
  const { data, error } = await supabase
    .from('dataset_shares')
    .select('*')
    .eq('dataset_name', datasetName);

  if (error) throw error;
  return data || [];
};

export const removeDatasetShare = async (shareId: string): Promise<void> => {
  const { error } = await supabase
    .from('dataset_shares')
    .delete()
    .eq('id', shareId);

  if (error) throw error;
};

export const getUserDatasets = async (): Promise<{ name: string; owner_id: string }[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get datasets owned by the user
  const { data: ownedDatasets, error: ownedError } = await supabase
    .from('loan_data')
    .select('dataset_name, user_id')
    .eq('user_id', user.id)
    .not('dataset_name', 'is', null);

  if (ownedError) throw ownedError;

  // Get datasets shared with the user
  const { data: sharedDatasets, error: sharedError } = await supabase
    .from('dataset_shares')
    .select('dataset_name, owner_id')
    .or(`shared_with_email.eq.${user.email},shared_with_user_id.eq.${user.id}`);

  if (sharedError) throw sharedError;

  // Combine and deduplicate datasets
  const allDatasets: { [key: string]: { name: string; owner_id: string } } = {};

  // Add owned datasets
  ownedDatasets?.forEach(dataset => {
    if (dataset.dataset_name) {
      allDatasets[dataset.dataset_name] = {
        name: dataset.dataset_name,
        owner_id: dataset.user_id || user.id
      };
    }
  });

  // Add shared datasets
  sharedDatasets?.forEach(share => {
    if (share.dataset_name) {
      allDatasets[share.dataset_name] = {
        name: share.dataset_name,
        owner_id: share.owner_id
      };
    }
  });

  return Object.values(allDatasets);
};

export const getAllLoanDataByDataset = async (datasetName: string): Promise<LoanRecord[]> => {
  console.log('🔍 FETCHING COMPLETE DATASET:', datasetName);
  
  // Get total count first
  const { count } = await supabase
    .from('loan_data')
    .select('*', { count: 'exact', head: true })
    .eq('dataset_name', datasetName);
  
  if (!count || count === 0) {
    console.log('No records found for dataset:', datasetName);
    return [];
  }
  
  console.log(`Found ${count} total records for dataset ${datasetName}, fetching all...`);
  
  // Use batching to fetch all records
  const BATCH_SIZE = 1000;
  const allRecords: LoanRecord[] = [];
  
  for (let offset = 0; offset < count; offset += BATCH_SIZE) {
    const endOffset = Math.min(offset + BATCH_SIZE - 1, count - 1);
    console.log(`Fetching batch: records ${offset} to ${endOffset} of ${count - 1} for dataset ${datasetName}`);
    
    const { data, error } = await supabase
      .from('loan_data')
      .select('*')
      .eq('dataset_name', datasetName)
      .range(offset, endOffset)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error(`Error fetching batch starting at ${offset} for dataset ${datasetName}:`, error);
      throw error;
    }
    
    if (data && data.length > 0) {
      allRecords.push(...data as LoanRecord[]);
      console.log(`Fetched ${data.length} records in this batch, total so far: ${allRecords.length}`);
    } else {
      console.log(`No data returned for batch starting at ${offset}`);
      break;
    }
    
    // Add a small delay between batches to avoid overwhelming the database
    if (offset + BATCH_SIZE < count) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  console.log(`✅ COMPLETE DATASET FETCHED: ${allRecords.length} records out of expected ${count} for ${datasetName}`);
  
  // Verify we got all the records
  if (allRecords.length !== count) {
    console.warn(`Warning: Expected ${count} records but got ${allRecords.length} for dataset ${datasetName}`);
  }
  
  return allRecords;
};

export const deleteLoanDataByDataset = async (datasetName: string): Promise<void> => {
  console.log('🗑️ DELETING DATASET:', datasetName);
  
  const { error } = await supabase
    .from('loan_data')
    .delete()
    .eq('dataset_name', datasetName);

  if (error) {
    console.error('❌ Error deleting dataset:', error);
    throw error;
  }

  console.log(`✅ DATASET DELETED: ${datasetName}`);
};
