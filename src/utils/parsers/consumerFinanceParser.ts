import * as XLSX from 'xlsx';

export interface LoanRecord {
  loan_amount: number;
  interest_rate: number;
  term: number;
  remaining_term: number;
  lgd: number;
  ltv: number;
  opening_balance: number;
  pd: number;
  file_name?: string;
  worksheet_name?: string;
}

export interface ParsedExcelData {
  data: LoanRecord[];
  worksheetName: string;
  fileName: string;
  warnings: string[];
}

interface ColumnMap {
  loan_amount?: number;
  interest_rate?: number;
  term?: number;
  remaining_term?: number;
  lgd?: number;
  ltv?: number;
  opening_balance?: number;
  pd?: number;
}

const findSecuritizationSheet = (worksheets: string[], workbook: XLSX.WorkBook): string => {
  const securitizationPatterns = [
    /loan.*tape/i,
    /portfolio/i,
    /data/i,
    /loans/i,
    /assets/i
  ];

  for (const pattern of securitizationPatterns) {
    const match = worksheets.find(name => pattern.test(name));
    if (match) return match;
  }

  const sheetScores = worksheets.map(name => {
    const sheet = workbook.Sheets[name];
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    const rowCount = range.e.r - range.s.r + 1;
    const colCount = range.e.c - range.s.c + 1;
    return { name, score: rowCount * colCount };
  });

  sheetScores.sort((a, b) => b.score - a.score);
  return sheetScores[0].name;
};

const createFlexibleColumnMap = (headers: string[]): ColumnMap => {
  const columnMap: ColumnMap = {};
  
  const patterns = {
    loan_amount: /(?:loan.*amount|principal|original.*balance|initial.*amount)/i,
    interest_rate: /(?:interest.*rate|rate|coupon|apr|aer)/i,
    term: /(?:^term$|original.*term|loan.*term|maturity.*months)/i,
    remaining_term: /(?:remaining.*term|months.*remaining|outstanding.*term)/i,
    lgd: /(?:lgd|loss.*given.*default)/i,
    ltv: /(?:ltv|loan.*to.*value)/i,
    opening_balance: /(?:opening.*balance|current.*balance|outstanding.*balance|balance)/i,
    pd: /(?:^pd$|probability.*default|default.*probability)/i,
  };

  headers.forEach((header, index) => {
    const cleanHeader = header.trim();
    
    Object.entries(patterns).forEach(([field, pattern]) => {
      if (pattern.test(cleanHeader) && columnMap[field as keyof ColumnMap] === undefined) {
        columnMap[field as keyof ColumnMap] = index;
      }
    });
  });

  return columnMap;
};

const parseFinancialValue = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[,\s]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const parsePDValue = (value: any): number => {
  const numValue = parseFinancialValue(value);
  if (numValue > 1) {
    return numValue / 100;
  }
  return numValue;
};

const parseLGDValue = (value: any): number => {
  const numValue = parseFinancialValue(value);
  if (numValue > 1) {
    return numValue / 100;
  }
  return numValue;
};

const parseInterestRate = (value: any): number => {
  const numValue = parseFinancialValue(value);
  if (numValue > 1) {
    return numValue / 100;
  }
  return numValue;
};

export const parseConsumerFinanceFile = async (file: File): Promise<ParsedExcelData> => {
  console.log('🔍 Starting Consumer Finance Excel file parsing:', file.name);
  
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  
  const worksheetName = findSecuritizationSheet(workbook.SheetNames, workbook);
  console.log('📄 Selected worksheet:', worksheetName);
  
  const worksheet = workbook.Sheets[worksheetName];
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  if (rawData.length < 2) {
    throw new Error('Excel file must contain at least a header row and one data row');
  }

  const headers = rawData[0].map((h: any) => String(h || '').trim());
  const columnMap = createFlexibleColumnMap(headers);
  
  console.log('🗺️ Column mapping:', columnMap);

  const essentialColumns: (keyof ColumnMap)[] = ['loan_amount', 'interest_rate', 'term', 'remaining_term', 'lgd', 'opening_balance'];
  const missingColumns = essentialColumns.filter(col => columnMap[col] === undefined);
  
  if (missingColumns.length > 0) {
    throw new Error(`Missing essential columns: ${missingColumns.join(', ')}. Found headers: ${headers.join(', ')}`);
  }

  const dataRows = rawData.slice(1);
  const warnings: string[] = [];
  
  const parsedData: LoanRecord[] = dataRows
    .map((row, index) => {
      if (!row || row.length === 0) return null;

      try {
        const record: LoanRecord = {
          loan_amount: parseFinancialValue(row[columnMap.loan_amount!]),
          interest_rate: parseInterestRate(row[columnMap.interest_rate!]),
          term: parseFinancialValue(row[columnMap.term!]),
          remaining_term: parseFinancialValue(row[columnMap.remaining_term!]),
          lgd: parseLGDValue(row[columnMap.lgd!]),
          ltv: columnMap.ltv !== undefined ? parseFinancialValue(row[columnMap.ltv]) : 0,
          opening_balance: parseFinancialValue(row[columnMap.opening_balance!]),
          pd: columnMap.pd !== undefined ? parsePDValue(row[columnMap.pd]) : 0,
          file_name: file.name,
          worksheet_name: worksheetName
        };

        if (record.loan_amount <= 0 || record.opening_balance <= 0) {
          warnings.push(`Row ${index + 2}: Invalid loan amount or balance`);
          return null;
        }

        return record;
      } catch (error) {
        warnings.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Parse error'}`);
        return null;
      }
    })
    .filter((record): record is LoanRecord => record !== null);

  console.log(`✅ Successfully parsed ${parsedData.length} Consumer Finance loan records`);
  console.log(`⚠️ ${warnings.length} warnings generated`);

  return {
    data: parsedData,
    worksheetName,
    fileName: file.name,
    warnings
  };
};
