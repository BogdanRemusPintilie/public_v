
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
  let query = supabase.from('loan_data').select('*');
  
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching loan data:', error);
    throw error;
  }
  
  return data as LoanRecord[];
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
