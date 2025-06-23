import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('VITE_SUPABASE_URL is not set. Please check your Supabase integration.');
}

if (!supabaseKey) {
  console.error('VITE_SUPABASE_ANON_KEY is not set. Please check your Supabase integration.');
}

// Only create client if both URL and key are available
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

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

export const insertLoanData = async (loanData: LoanRecord[]) => {
  const { data, error } = await supabase
    .from('loan_data')
    .insert(loanData)
    .select();
  
  if (error) {
    console.error('Error inserting loan data:', error);
    throw error;
  }
  
  return data;
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
  const { error } = await supabase
    .from('loan_data')
    .delete()
    .in('id', ids);
  
  if (error) {
    console.error('Error deleting loan data:', error);
    throw error;
  }
};
