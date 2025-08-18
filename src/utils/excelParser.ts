
import * as XLSX from 'xlsx';
import { LoanRecord } from './supabase';

export interface ParsedExcelData {
  worksheets: string[];
  data: LoanRecord[];
}

interface SheetInfo {
  name: string;
  type: 'loan_tape' | 'tranche_summary' | 'portfolio_stats' | 'unknown';
}

interface ColumnMap {
  [key: string]: number | undefined;
  loan_amount?: number;
  opening_balance?: number;
  interest_rate?: number;
  term?: number;
  remaining_term?: number;
  lgd?: number;
  ltv?: number;
  pd?: number;
}

// Enhanced securitization-focused sheet detection with better heuristics
function findSecuritizationSheet(worksheets: string[], workbook: XLSX.WorkBook): SheetInfo {
  const sheetPriority = [
    { patterns: ['loan_tape', 'loantape', 'loan tape', 'asset tape', 'pool tape'], type: 'loan_tape' as const },
    { patterns: ['tranche', 'tranches', 'structure', 'notes', 'bonds', 'classes'], type: 'tranche_summary' as const },
    { patterns: ['portfolio', 'pool', 'collateral', 'summary', 'overview'], type: 'portfolio_stats' as const },
    { patterns: ['data', 'loans', 'assets', 'receivables', 'mortgages'], type: 'loan_tape' as const }
  ];

  for (const priority of sheetPriority) {
    for (const sheet of worksheets) {
      const lowerName = sheet.toLowerCase();
      if (priority.patterns.some(pattern => lowerName.includes(pattern))) {
        return { name: sheet, type: priority.type };
      }
    }
  }

  // If no specific sheet found, try to detect by content
  for (const sheet of worksheets) {
    const worksheet = workbook.Sheets[sheet];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length > 1) {
      const headers = (jsonData[0] as string[])?.map(h => h?.toString().toLowerCase()) || [];
      
      // Check for loan tape indicators
      const loanIndicators = ['loan', 'balance', 'rate', 'term', 'amount', 'principal'];
      if (loanIndicators.some(indicator => 
        headers.some(header => header?.includes(indicator))
      )) {
        return { name: sheet, type: 'loan_tape' };
      }
    }
  }

  // Default to first sheet
  return { name: worksheets[0], type: 'unknown' };
}

// Flexible column mapping based on header patterns
function createFlexibleColumnMap(headers: string[]): ColumnMap {
  const map: ColumnMap = {};
  
  // Enhanced patterns for securitization data
  const patterns = {
    loan_amount: /(?:loan.*amount|principal|original.*balance|initial.*amount|gross.*amount)/i,
    opening_balance: /(?:opening.*balance|current.*balance|outstanding.*balance|balance|outstanding|unpaid.*balance)/i,
    interest_rate: /(?:interest.*rate|rate|coupon|margin|yield|gross.*rate|contract.*rate)/i,
    term: /(?:term|maturity|duration|months|original.*term)/i,
    remaining_term: /(?:remaining.*term|rem.*term|time.*left|remaining.*months|type|product|category|purpose|loan.*purpose)/i,
    lgd: /(?:lgd|loss.*given.*default|loss.*severity|recovery.*rate|credit.*score|score|rating|fico|beacon)/i,
    ltv: /(?:ltv|loan.*to.*value|l\.t\.v|cltv|combined.*ltv)/i,
    pd: /(?:pd|probability.*default|default.*rate|risk.*score|credit.*risk)/i
  };

  headers.forEach((header, index) => {
    if (!header) return;
    
    const headerStr = header.toString().toLowerCase();
    
    for (const [field, pattern] of Object.entries(patterns)) {
      if (pattern.test(headerStr) && !map[field]) {
        map[field] = index;
        break;
      }
    }
  });

  return map;
}

// Parse financial values with various formats
function parseFinancialValue(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  
  const str = value.toString().replace(/[,\s]/g, '');
  const num = parseFloat(str);
  
  return isNaN(num) ? 0 : num;
}

// Parse interest rates (handle both decimal and percentage formats)
function parseInterestRate(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  
  const str = value.toString().replace(/[,\s%]/g, '');
  const num = parseFloat(str);
  
  if (isNaN(num)) return 0;
  
  // If value is less than 1, assume it's in decimal format (0.05 = 5%)
  // If value is greater than or equal to 1, assume it's already in percentage format
  return num < 1 ? num * 100 : num;
}

// Parse string values
function parseStringValue(value: any): string {
  if (value === null || value === undefined) return '';
  return value.toString().trim();
}

export const parseExcelFile = async (file: File): Promise<ParsedExcelData & { warnings: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const warnings: string[] = [];
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const worksheets = workbook.SheetNames;
        console.log('Available worksheets:', worksheets);
        
        // Enhanced securitization-focused sheet detection
        const targetSheet = findSecuritizationSheet(worksheets, workbook);
        
        console.log(`Processing sheet: "${targetSheet.name}" (detected as: ${targetSheet.type})`);
        
        if (targetSheet.type === 'unknown') {
          warnings.push(`Could not identify sheet type for "${targetSheet.name}" - proceeding with basic parsing`);
        }
        
        const worksheet = workbook.Sheets[targetSheet.name];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log(`Sheet data:`, {
          totalRows: jsonData.length,
          headers: jsonData[0],
          sampleDataRow: jsonData[1]
        });
        
        if (jsonData.length < 2) {
          throw new Error(`${targetSheet.name} sheet appears to be empty or has no data rows`);
        }
        
        // Get headers and create flexible column mapping
        const headers = jsonData[0] as string[];
        const columnMap = createFlexibleColumnMap(headers);
        console.log('Column mapping:', columnMap);
        
        // Validate essential columns are present
        const essentialColumns = ['opening_balance', 'loan_amount'];
        const missingEssentials = essentialColumns.filter(col => 
          columnMap[col] === undefined
        );
        
        if (missingEssentials.length > 0) {
          warnings.push(`Missing essential columns: ${missingEssentials.join(', ')}`);
        }
        
        // Check for securitization-specific columns
        const securitizationColumns = ['interest_rate', 'term', 'ltv'];
        const missingSecurity = securitizationColumns.filter(col => 
          columnMap[col] === undefined
        );
        
        if (missingSecurity.length > 0) {
          warnings.push(`Missing recommended securitization columns: ${missingSecurity.join(', ')}`);
        }
        
        // Process data rows (skip header row)
        const dataRows = jsonData.slice(1);
        
        const mappedData = dataRows.map((row: any[], index: number) => {
          const loanRecord = {
            loan_amount: parseFinancialValue(row[columnMap.loan_amount || columnMap.opening_balance || 1]) || 0,
            interest_rate: parseInterestRate(row[columnMap.interest_rate || 2]) || 0,
            term: parseFinancialValue(row[columnMap.term || 3]) || 0,
            remaining_term: parseFinancialValue(row[columnMap.remaining_term || 4]) || null,
            credit_score: parseFinancialValue(row[columnMap.credit_score || columnMap.pd || 5]) || 0,
            ltv: parseFinancialValue(row[columnMap.ltv || 6]) || 0,
            opening_balance: parseFinancialValue(row[columnMap.opening_balance || columnMap.loan_amount || 1]) || 0,
            pd: parseFinancialValue(row[columnMap.pd || 9]) || 0,
            file_name: file.name,
            worksheet_name: targetSheet.name
          };

          // Log first few records for debugging
          if (index < 3) {
            console.log(`Sample record ${index + 1}:`, loanRecord);
          }

          return loanRecord;
        }).filter((record: any) => {
          // Filter out records with invalid data
          const isValid = record.opening_balance > 0 && record.interest_rate >= 0;
          return isValid;
        });
        
        // Generate parsing quality warnings
        if (mappedData.length === 0) {
          warnings.push('No valid data rows found in the sheet');
        } else if (mappedData.length < dataRows.length * 0.5) {
          warnings.push(`High data rejection rate: ${dataRows.length - mappedData.length} of ${dataRows.length} rows rejected`);
        }
        
        const portfolioValue = mappedData.reduce((sum, loan) => sum + loan.opening_balance, 0);
        if (portfolioValue === 0) {
          warnings.push('Portfolio has zero total value - check balance columns');
        }
        
        console.log('Final parsing result:', {
          totalWorksheets: worksheets.length,
          targetWorksheet: targetSheet.name,
          sheetType: targetSheet.type,
          totalDataRows: dataRows.length,
          validRecords: mappedData.length,
          portfolioValue,
          avgInterestRate: mappedData.length > 0 ? 
            mappedData.reduce((sum, loan) => sum + (loan.interest_rate * loan.opening_balance), 0) / 
            mappedData.reduce((sum, loan) => sum + loan.opening_balance, 0) : 0,
          higherRiskLoans: mappedData.filter(loan => (loan.pd || 0) > 0.10).length,
          warnings: warnings.length
        });
        
        resolve({
          worksheets: [targetSheet.name],
          data: mappedData,
          warnings
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
