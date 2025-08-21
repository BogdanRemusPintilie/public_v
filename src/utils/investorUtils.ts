import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';

export interface InvestorRecord {
  id?: string;
  investor: string;
  overview?: string;
  contact_name?: string;
  contact_email?: string;
  user_id?: string;
}

export const parseInvestorExcel = (file: File): Promise<InvestorRecord[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // Skip header row and map to InvestorRecord format
        const investors: InvestorRecord[] = (jsonData as any[][])
          .slice(1)
          .filter(row => row[0]) // Filter out empty rows
          .map(row => ({
            investor: String(row[0] || ''),
            overview: String(row[1] || ''),
            contact_name: String(row[2] || ''),
            contact_email: String(row[3] || '')
          }));
        
        resolve(investors);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

export const insertInvestors = async (investors: InvestorRecord[]): Promise<void> => {
  const { error } = await supabase
    .from('investors')
    .insert(investors);
  
  if (error) {
    throw new Error(`Failed to insert investors: ${error.message}`);
  }
};

export const getInvestors = async (): Promise<InvestorRecord[]> => {
  const { data, error } = await supabase
    .from('investors')
    .select('*')
    .order('investor');
  
  if (error) {
    throw new Error(`Failed to fetch investors: ${error.message}`);
  }
  
  return data || [];
};

export const deleteAllInvestors = async (): Promise<void> => {
  const { error } = await supabase
    .from('investors')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records for current user (RLS handles user filtering)
  
  if (error) {
    throw new Error(`Failed to delete investors: ${error.message}`);
  }
};