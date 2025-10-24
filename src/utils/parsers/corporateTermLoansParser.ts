import * as XLSX from 'xlsx';

export interface CorporateTermLoanRecord {
  id?: string;
  created_at?: string;
  user_id?: string;
  dataset_name?: string;
  borrower_name?: string;
  loan_amount: number;
  facility_amount?: number;
  currency?: string;
  interest_rate: number;
  margin?: number;
  base_rate?: string;
  origination_date?: string;
  maturity_date?: string;
  term: number;
  remaining_term: number;
  amortization_type?: string;
  credit_rating?: string;
  pd?: number;
  lgd: number;
  probability_of_default?: number;
  secured_unsecured?: string;
  collateral_type?: string;
  collateral_coverage_ratio?: number;
  industry_sector?: string;
  country?: string;
  leverage_ratio?: number;
  interest_coverage_ratio?: number;
  debt_service_coverage_ratio?: number;
  covenant_status?: string;
  current_balance: number;
  opening_balance: number;
  arrears_days?: number;
  performing_status?: string;
  file_name?: string;
  worksheet_name?: string;
}

export interface ParsedCTLData {
  data: CorporateTermLoanRecord[];
  worksheetName: string;
  fileName: string;
  warnings: string[];
}

interface CTLColumnMap {
  borrower_name?: number;
  loan_amount?: number;
  facility_amount?: number;
  currency?: number;
  interest_rate?: number;
  margin?: number;
  base_rate?: number;
  origination_date?: number;
  maturity_date?: number;
  term?: number;
  remaining_term?: number;
  amortization_type?: number;
  credit_rating?: number;
  pd?: number;
  lgd?: number;
  probability_of_default?: number;
  secured_unsecured?: number;
  collateral_type?: number;
  collateral_coverage_ratio?: number;
  industry_sector?: number;
  country?: number;
  leverage_ratio?: number;
  interest_coverage_ratio?: number;
  debt_service_coverage_ratio?: number;
  covenant_status?: number;
  current_balance?: number;
  opening_balance?: number;
  arrears_days?: number;
  performing_status?: number;
}

const findSecuritizationSheet = (worksheets: string[], workbook: XLSX.WorkBook): string => {
  const ctlPatterns = [
    /corporate.*loan/i,
    /term.*loan/i,
    /ctl/i,
    /loan.*tape/i,
    /portfolio/i
  ];

  for (const pattern of ctlPatterns) {
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

const createCTLColumnMap = (headers: string[]): CTLColumnMap => {
  const columnMap: CTLColumnMap = {};
  
  const patterns = {
    borrower_name: /(?:borrower|company|obligor|counterparty|client.*name)/i,
    loan_amount: /(?:loan.*amount|exposure|commitment|drawn.*amount)/i,
    facility_amount: /(?:facility.*amount|facility.*size|total.*facility)/i,
    currency: /(?:currency|ccy)/i,
    interest_rate: /(?:interest.*rate|all.*in.*rate|total.*rate|coupon)/i,
    margin: /(?:margin|spread)/i,
    base_rate: /(?:base.*rate|reference.*rate|euribor|sofr|libor)/i,
    origination_date: /(?:origination.*date|start.*date|inception.*date)/i,
    maturity_date: /(?:maturity.*date|end.*date|final.*date)/i,
    term: /(?:^term$|original.*term|loan.*term|total.*term)/i,
    remaining_term: /(?:remaining.*term|months.*remaining|outstanding.*term)/i,
    amortization_type: /(?:amortization|repayment.*type|repayment.*structure)/i,
    credit_rating: /(?:rating|grade|credit.*quality|moody|s&p|fitch)/i,
    pd: /(?:^pd$|probability.*default)/i,
    lgd: /(?:lgd|loss.*given.*default)/i,
    probability_of_default: /(?:default.*probability|prob.*default)/i,
    secured_unsecured: /(?:secured|security.*type|collateral.*status)/i,
    collateral_type: /(?:collateral.*type|security.*type)/i,
    collateral_coverage_ratio: /(?:collateral.*coverage|security.*coverage)/i,
    industry_sector: /(?:industry|sector|business|vertical)/i,
    country: /(?:country|jurisdiction|domicile)/i,
    leverage_ratio: /(?:leverage|debt.*equity|gearing|debt.*ebitda)/i,
    interest_coverage_ratio: /(?:interest.*coverage|icr|ebitda.*interest)/i,
    debt_service_coverage_ratio: /(?:dscr|debt.*service|coverage.*ratio)/i,
    covenant_status: /(?:covenant.*status|compliance.*status)/i,
    current_balance: /(?:current.*balance|outstanding.*balance|drawn.*balance)/i,
    opening_balance: /(?:opening.*balance|initial.*balance|starting.*balance)/i,
    arrears_days: /(?:arrears|days.*overdue|dpd|delinquency)/i,
    performing_status: /(?:performing.*status|loan.*status|status)/i,
  };

  headers.forEach((header, index) => {
    const cleanHeader = header.trim();
    
    Object.entries(patterns).forEach(([field, pattern]) => {
      if (pattern.test(cleanHeader) && columnMap[field as keyof CTLColumnMap] === undefined) {
        columnMap[field as keyof CTLColumnMap] = index;
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
  if (numValue > 1) return numValue / 100;
  return numValue;
};

const parseLGDValue = (value: any): number => {
  const numValue = parseFinancialValue(value);
  if (numValue > 1) return numValue / 100;
  return numValue;
};

const parseInterestRate = (value: any): number => {
  const numValue = parseFinancialValue(value);
  if (numValue > 1) return numValue / 100;
  return numValue;
};

const parseStringValue = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

export const parseCorporateTermLoansFile = async (file: File): Promise<ParsedCTLData> => {
  console.log('🔍 Starting Corporate Term Loans Excel file parsing:', file.name);
  
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
  const columnMap = createCTLColumnMap(headers);
  
  console.log('🗺️ CTL Column mapping:', columnMap);

  const essentialColumns: (keyof CTLColumnMap)[] = ['loan_amount', 'interest_rate', 'term', 'remaining_term', 'lgd', 'current_balance', 'opening_balance'];
  const missingColumns = essentialColumns.filter(col => columnMap[col] === undefined);
  
  if (missingColumns.length > 0) {
    throw new Error(`Missing essential columns: ${missingColumns.join(', ')}. Found headers: ${headers.join(', ')}`);
  }

  const dataRows = rawData.slice(1);
  const warnings: string[] = [];
  
  const parsedData: CorporateTermLoanRecord[] = dataRows
    .map((row, index) => {
      if (!row || row.length === 0) return null;

      try {
        const record: CorporateTermLoanRecord = {
          borrower_name: columnMap.borrower_name !== undefined ? parseStringValue(row[columnMap.borrower_name]) : undefined,
          loan_amount: parseFinancialValue(row[columnMap.loan_amount!]),
          facility_amount: columnMap.facility_amount !== undefined ? parseFinancialValue(row[columnMap.facility_amount]) : undefined,
          currency: columnMap.currency !== undefined ? parseStringValue(row[columnMap.currency]) : 'EUR',
          interest_rate: parseInterestRate(row[columnMap.interest_rate!]),
          margin: columnMap.margin !== undefined ? parseInterestRate(row[columnMap.margin]) : undefined,
          base_rate: columnMap.base_rate !== undefined ? parseStringValue(row[columnMap.base_rate]) : undefined,
          origination_date: columnMap.origination_date !== undefined ? parseStringValue(row[columnMap.origination_date]) : undefined,
          maturity_date: columnMap.maturity_date !== undefined ? parseStringValue(row[columnMap.maturity_date]) : undefined,
          term: parseFinancialValue(row[columnMap.term!]),
          remaining_term: parseFinancialValue(row[columnMap.remaining_term!]),
          amortization_type: columnMap.amortization_type !== undefined ? parseStringValue(row[columnMap.amortization_type]) : undefined,
          credit_rating: columnMap.credit_rating !== undefined ? parseStringValue(row[columnMap.credit_rating]) : undefined,
          pd: columnMap.pd !== undefined ? parsePDValue(row[columnMap.pd]) : undefined,
          lgd: parseLGDValue(row[columnMap.lgd!]),
          probability_of_default: columnMap.probability_of_default !== undefined ? parsePDValue(row[columnMap.probability_of_default]) : undefined,
          secured_unsecured: columnMap.secured_unsecured !== undefined ? parseStringValue(row[columnMap.secured_unsecured]) : undefined,
          collateral_type: columnMap.collateral_type !== undefined ? parseStringValue(row[columnMap.collateral_type]) : undefined,
          collateral_coverage_ratio: columnMap.collateral_coverage_ratio !== undefined ? parseFinancialValue(row[columnMap.collateral_coverage_ratio]) : undefined,
          industry_sector: columnMap.industry_sector !== undefined ? parseStringValue(row[columnMap.industry_sector]) : undefined,
          country: columnMap.country !== undefined ? parseStringValue(row[columnMap.country]) : undefined,
          leverage_ratio: columnMap.leverage_ratio !== undefined ? parseFinancialValue(row[columnMap.leverage_ratio]) : undefined,
          interest_coverage_ratio: columnMap.interest_coverage_ratio !== undefined ? parseFinancialValue(row[columnMap.interest_coverage_ratio]) : undefined,
          debt_service_coverage_ratio: columnMap.debt_service_coverage_ratio !== undefined ? parseFinancialValue(row[columnMap.debt_service_coverage_ratio]) : undefined,
          covenant_status: columnMap.covenant_status !== undefined ? parseStringValue(row[columnMap.covenant_status]) : undefined,
          current_balance: parseFinancialValue(row[columnMap.current_balance!]),
          opening_balance: parseFinancialValue(row[columnMap.opening_balance!]),
          arrears_days: columnMap.arrears_days !== undefined ? parseFinancialValue(row[columnMap.arrears_days]) : 0,
          performing_status: columnMap.performing_status !== undefined ? parseStringValue(row[columnMap.performing_status]) : 'performing',
          file_name: file.name,
          worksheet_name: worksheetName
        };

        if (record.loan_amount <= 0 || record.current_balance <= 0) {
          warnings.push(`Row ${index + 2}: Invalid loan amount or balance`);
          return null;
        }

        return record;
      } catch (error) {
        warnings.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Parse error'}`);
        return null;
      }
    })
    .filter((record): record is CorporateTermLoanRecord => record !== null);

  console.log(`✅ Successfully parsed ${parsedData.length} Corporate Term Loan records`);
  console.log(`⚠️ ${warnings.length} warnings generated`);

  return {
    data: parsedData,
    worksheetName,
    fileName: file.name,
    warnings
  };
};
