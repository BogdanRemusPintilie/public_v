
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

export const getLoanData = async (userId?: string) => {
  console.log('Fetching loan data for user:', userId);
  
  // First, get the total count
  let countQuery = supabase.from('loan_data').select('*', { count: 'exact', head: true });
  if (userId) {
    countQuery = countQuery.eq('user_id', userId);
  }
  
  const { count, error: countError } = await countQuery;
  
  if (countError) {
    console.error('Error getting record count:', countError);
    throw countError;
  }
  
  console.log(`Total records available: ${count}`);
  
  // If there are no records, return empty array
  if (!count || count === 0) {
    console.log('No records found');
    return [];
  }
  
  // Fetch all records in batches to avoid memory issues with very large datasets
  const BATCH_SIZE = 1000; // Use smaller batch size for more reliable fetching
  let allData: LoanRecord[] = [];
  let from = 0;
  
  // Continue fetching until we have all records
  while (allData.length < count) {
    const to = Math.min(from + BATCH_SIZE - 1, count - 1);
    console.log(`Fetching batch from ${from} to ${to} (${allData.length}/${count} records fetched so far)`);
    
    let query = supabase
      .from('loan_data')
      .select('*')
      .range(from, to)
      .order('created_at', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching loan data batch:', error);
      throw error;
    }
    
    if (data && data.length > 0) {
      allData = [...allData, ...data];
      console.log(`Fetched ${data.length} records in this batch. Total so far: ${allData.length}`);
      
      // Move to next batch
      from = to + 1;
      
      // If we got fewer records than expected, we might have reached the end
      if (data.length < BATCH_SIZE && allData.length < count) {
        console.log(`Got ${data.length} records but expected ${BATCH_SIZE}. Continuing to fetch remaining records.`);
      }
    } else {
      console.log('No more data returned, stopping fetch');
      break;
    }
    
    // Safety check to prevent infinite loops
    if (from >= count) {
      console.log('Reached the end based on count, stopping fetch');
      break;
    }
  }
  
  console.log(`Successfully fetched all ${allData.length} loan records out of ${count} total records`);
  
  return allData as LoanRecord[];
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
