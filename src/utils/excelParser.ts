
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
        
        console.log('Available worksheets:', worksheets);
        
        // Process all worksheets
        worksheets.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          console.log(`Processing sheet "${sheetName}":`, {
            rowCount: jsonData.length,
            sampleRow: jsonData[0]
          });
          
          if (jsonData.length === 0) {
            console.log(`Sheet "${sheetName}" is empty, skipping`);
            return;
          }
          
          // Get all available column names from the first row
          const availableColumns = Object.keys(jsonData[0] || {});
          console.log(`Available columns in "${sheetName}":`, availableColumns);
          
          // Map Excel columns to our loan record structure with more flexible matching
          const mappedData = jsonData.map((row: any, index: number) => {
            // Helper function to find column value with flexible matching
            const findColumnValue = (possibleNames: string[], defaultValue: any = 0) => {
              for (const name of possibleNames) {
                // Try exact match first
                if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
                  return row[name];
                }
                // Try case-insensitive match
                const lowerName = name.toLowerCase();
                for (const [key, value] of Object.entries(row)) {
                  if (key.toLowerCase() === lowerName && value !== undefined && value !== null && value !== '') {
                    return value;
                  }
                }
                // Try partial match
                for (const [key, value] of Object.entries(row)) {
                  if (key.toLowerCase().includes(lowerName) && value !== undefined && value !== null && value !== '') {
                    return value;
                  }
                }
              }
              return defaultValue;
            };

            const loanRecord = {
              loan_amount: parseFloat(findColumnValue([
                'Loan Amount', 'loan_amount', 'LoanAmount', 'Loan_Amount',
                'Original Loan Amount', 'Principal', 'Balance', 'Loan Balance'
              ], 0)) || 0,
              
              interest_rate: parseFloat(findColumnValue([
                'Interest Rate', 'interest_rate', 'InterestRate', 'Interest_Rate',
                'Rate', 'Coupon', 'Note Rate', 'Current Rate'
              ], 0)) || 0,
              
              term: parseInt(findColumnValue([
                'Term', 'term', 'Term (Years)', 'Maturity', 'Original Term',
                'Term Years', 'Loan Term', 'Years'
              ], 0)) || 0,
              
              loan_type: String(findColumnValue([
                'Loan Type', 'loan_type', 'LoanType', 'Loan_Type',
                'Type', 'Product', 'Product Type', 'Loan Product'
              ], 'Unknown')),
              
              credit_score: parseInt(findColumnValue([
                'Credit Score', 'credit_score', 'CreditScore', 'Credit_Score',
                'FICO', 'Score', 'Borrower Score'
              ], 0)) || 0,
              
              ltv: parseFloat(findColumnValue([
                'LTV', 'ltv', 'LTV %', 'LTV Ratio', 'Loan to Value',
                'Current LTV', 'Original LTV', 'LoanToValue'
              ], 0)) || 0,
              
              opening_balance: parseFloat(findColumnValue([
                'Opening Balance', 'opening_balance', 'OpeningBalance', 'Opening_Balance',
                'Current Balance', 'Outstanding Balance', 'Principal Balance',
                'Balance', 'Current Principal', 'Remaining Balance'
              ], 0)) || 0,
              
              file_name: file.name,
              worksheet_name: sheetName
            };

            // Log first few records for debugging
            if (index < 3) {
              console.log(`Sample record ${index + 1} from "${sheetName}":`, loanRecord);
            }

            return loanRecord;
          }).filter((record: LoanRecord) => {
            // More lenient validation - at least one meaningful field should be present
            const hasLoanAmount = record.loan_amount > 0;
            const hasBalance = record.opening_balance > 0;
            const hasInterestRate = record.interest_rate > 0;
            
            const isValid = hasLoanAmount || hasBalance || hasInterestRate;
            
            if (!isValid && allData.length < 5) {
              console.log('Filtered out invalid record:', record);
            }
            
            return isValid;
          });
          
          console.log(`Sheet "${sheetName}" processed: ${mappedData.length} valid records out of ${jsonData.length} total rows`);
          allData.push(...mappedData);
        });
        
        console.log('Final parsing result:', {
          totalWorksheets: worksheets.length,
          totalValidRecords: allData.length,
          sampleRecord: allData[0]
        });
        
        resolve({
          worksheets,
          data: allData
        });
      } catch (error) {
        console.error('Error in parseExcelFile:', error);
        reject(new Error('Failed to parse Excel file: ' + error));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};
