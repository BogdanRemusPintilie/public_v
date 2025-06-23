
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
        console.log('Available worksheets:', worksheets);
        
        // Focus specifically on the loan_tape sheet
        const loanTapeSheet = worksheets.find(name => 
          name.toLowerCase().includes('loan_tape') || 
          name.toLowerCase().includes('loantape') ||
          name.toLowerCase() === 'loan_tape'
        );
        
        if (!loanTapeSheet) {
          console.error('loan_tape sheet not found. Available sheets:', worksheets);
          throw new Error('loan_tape sheet not found in the Excel file');
        }
        
        console.log(`Processing loan_tape sheet: "${loanTapeSheet}"`);
        
        const worksheet = workbook.Sheets[loanTapeSheet];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log(`loan_tape sheet data:`, {
          totalRows: jsonData.length,
          headers: jsonData[0],
          sampleDataRow: jsonData[1]
        });
        
        if (jsonData.length < 2) {
          throw new Error('loan_tape sheet appears to be empty or has no data rows');
        }
        
        // Get headers from row 1 (index 0)
        const headers = jsonData[0] as string[];
        console.log('Headers found:', headers);
        
        // Process data rows (skip header row)
        const dataRows = jsonData.slice(1);
        
        const mappedData = dataRows.map((row: any[], index: number) => {
          // Column mapping based on your specifications:
          // Column A: Loan ID
          // Column B: Opening Balance  
          // Column C: Interest Rate
          // Column J: PD (Probability of Default)
          
          const loanId = row[0]; // Column A
          const openingBalance = parseFloat(row[1]) || 0; // Column B
          const interestRate = parseFloat(row[2]) || 0; // Column C
          const pd = parseFloat(row[9]) || 0; // Column J (0-indexed, so J = 9)
          
          const loanRecord = {
            loan_amount: openingBalance, // Using opening balance as loan amount for now
            interest_rate: interestRate,
            term: 0, // Not specified in your mapping
            loan_type: 'Standard', // Default value
            credit_score: 0, // Not specified in your mapping
            ltv: 0, // Not specified in your mapping
            opening_balance: openingBalance,
            pd: pd, // Adding PD for risk calculation
            file_name: file.name,
            worksheet_name: loanTapeSheet
          };

          // Log first few records for debugging
          if (index < 5) {
            console.log(`Sample record ${index + 1}:`, {
              loanId,
              openingBalance,
              interestRate,
              pd,
              fullRecord: loanRecord
            });
          }

          return loanRecord;
        }).filter((record: any) => {
          // Filter out records with invalid opening balance
          const isValid = record.opening_balance > 0;
          
          if (!isValid && dataRows.length < 10) {
            console.log('Filtered out invalid record:', record);
          }
          
          return isValid;
        });
        
        console.log('Final parsing result:', {
          totalWorksheets: worksheets.length,
          targetWorksheet: loanTapeSheet,
          totalDataRows: dataRows.length,
          validRecords: mappedData.length,
          portfolioValue: mappedData.reduce((sum, loan) => sum + loan.opening_balance, 0),
          avgInterestRate: mappedData.length > 0 ? 
            mappedData.reduce((sum, loan) => sum + (loan.interest_rate * loan.opening_balance), 0) / 
            mappedData.reduce((sum, loan) => sum + loan.opening_balance, 0) : 0,
          higherRiskLoans: mappedData.filter(loan => loan.pd > 0.05).length
        });
        
        resolve({
          worksheets: [loanTapeSheet],
          data: mappedData
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
