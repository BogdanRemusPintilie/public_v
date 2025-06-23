
import * as XLSX from 'xlsx';
import { LoanRecord } from './supabase';

export interface ParsedExcelData {
  worksheets: string[];
  data: LoanRecord[];
}

export const parseExcelFile = async (file: File): Promise<ParsedExcelData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const worksheets = workbook.SheetNames;
        const allData: LoanRecord[] = [];
        
        // Process all worksheets
        worksheets.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Map Excel columns to our loan record structure
          const mappedData = jsonData.map((row: any) => ({
            loan_amount: parseFloat(row['Loan Amount'] || row['loan_amount'] || row['LoanAmount'] || 0),
            interest_rate: parseFloat(row['Interest Rate'] || row['interest_rate'] || row['InterestRate'] || 0),
            term: parseInt(row['Term'] || row['term'] || row['Term (Years)'] || 0),
            loan_type: row['Loan Type'] || row['loan_type'] || row['LoanType'] || 'Unknown',
            credit_score: parseInt(row['Credit Score'] || row['credit_score'] || row['CreditScore'] || 0),
            ltv: parseFloat(row['LTV'] || row['ltv'] || row['LTV %'] || 0),
            opening_balance: parseFloat(row['Opening Balance'] || row['opening_balance'] || row['OpeningBalance'] || 0),
            file_name: file.name,
            worksheet_name: sheetName
          })).filter((record: LoanRecord) => 
            record.loan_amount > 0 && record.interest_rate > 0 // Basic validation
          );
          
          allData.push(...mappedData);
        });
        
        resolve({
          worksheets,
          data: allData
        });
      } catch (error) {
        reject(new Error('Failed to parse Excel file: ' + error));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};
