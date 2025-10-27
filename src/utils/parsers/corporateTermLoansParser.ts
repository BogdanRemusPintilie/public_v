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
    borrower_name: /(?:^borrower$|borrower_name|borrower|company|obligor|counterparty|client.*name)/i,
    loan_amount: /(?:^committed.*amount|committed.*amount.*\(|loan.*amount|exposure|commitment.*amount|drawn.*amount)/i,
    facility_amount: /(?:facility.*amount|facility.*size|total.*facility)/i,
    currency: /(?:currency|ccy)/i,
    interest_rate: /(?:interest.*rate|all.*in.*rate|total.*rate|coupon)/i,
    margin: /(?:^margin.*\(|^margin.*%|margin|spread)/i,
    base_rate: /(?:^base.*rate$|base_rate|base.*rate|reference.*rate|euribor|sofr|libor)/i,
    origination_date: /(?:^inception.*date$|inception_date|inception.*date|origination.*date|start.*date)/i,
    maturity_date: /(?:^maturity.*date$|maturity_date|maturity.*date|end.*date|final.*date)/i,
    term: /(?:^term$|original.*term|loan.*term|total.*term)/i,
    remaining_term: /(?:remaining.*term|months.*remaining|outstanding.*term)/i,
    amortization_type: /(?:amortization|amortisation|repayment.*type|repayment.*structure)/i,
    credit_rating: /(?:^credit.*rating$|credit_rating|credit.*rating|rating|grade|credit.*quality|moody|s&p|fitch)/i,
    pd: /(?:^pd$|probability.*default)/i,
    lgd: /(?:^lgd$|loss.*given.*default)/i,
    probability_of_default: /(?:default.*probability|prob.*default)/i,
    secured_unsecured: /(?:secured|security.*type|collateral.*status)/i,
    collateral_type: /(?:^collateral.*type$|collateral_type|collateral.*type|security.*type)/i,
    collateral_coverage_ratio: /(?:collateral.*coverage|security.*coverage)/i,
    industry_sector: /(?:^sector$|industry_sector|industry|sector|business|vertical)/i,
    country: /(?:^country$|country|jurisdiction|domicile)/i,
    leverage_ratio: /(?:leverage|debt.*equity|gearing|debt.*ebitda)/i,
    interest_coverage_ratio: /(?:interest.*coverage|icr|ebitda.*interest)/i,
    debt_service_coverage_ratio: /(?:dscr|debt.*service|coverage.*ratio)/i,
    covenant_status: /(?:covenant.*status|compliance.*status)/i,
    current_balance: /(?:^outstanding.*amount|outstanding.*amount.*\(|current.*balance|outstanding.*balance|drawn.*balance)/i,
    opening_balance: /(?:opening.*balance|initial.*balance|starting.*balance)/i,
    arrears_days: /(?:^in.*arrears$|in_arrears|arrears|days.*overdue|dpd|delinquency)/i,
    performing_status: /(?:^defaulted$|performing.*status|loan.*status|^status$|defaulted|restructured)/i,
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

const parseYesNoToNumber = (value: any): number => {
  const strValue = parseStringValue(value).toLowerCase();
  if (strValue === 'yes' || strValue === 'true' || strValue === '1') return 30;
  return 0;
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

  // Essential columns - only require loan_amount and lgd, everything else can be derived or defaulted
  const essentialColumns: (keyof CTLColumnMap)[] = ['loan_amount', 'lgd'];
  const missingColumns = essentialColumns.filter(col => columnMap[col] === undefined);
  
  if (missingColumns.length > 0) {
    throw new Error(`Missing essential columns: ${missingColumns.join(', ')}. Found headers: ${headers.join(', ')}`);
  }
  
  // Warn about missing optional but important columns
  const importantColumns: (keyof CTLColumnMap)[] = ['interest_rate', 'origination_date', 'maturity_date'];
  const missingImportant = importantColumns.filter(col => columnMap[col] === undefined);
  if (missingImportant.length > 0) {
    console.warn(`⚠️ Missing important columns (will use defaults): ${missingImportant.join(', ')}`);
  }

  const dataRows = rawData.slice(1);
  const warnings: string[] = [];
  
  const parsedData: CorporateTermLoanRecord[] = dataRows
    .map((row, index) => {
      if (!row || row.length === 0) return null;

      try {
        // Parse dates if available
        const originationDate = columnMap.origination_date !== undefined ? parseStringValue(row[columnMap.origination_date]) : undefined;
        const maturityDate = columnMap.maturity_date !== undefined ? parseStringValue(row[columnMap.maturity_date]) : undefined;
        
        // Calculate term and remaining_term from dates if not provided
        let term = columnMap.term !== undefined ? parseFinancialValue(row[columnMap.term]) : 0;
        let remaining_term = columnMap.remaining_term !== undefined ? parseFinancialValue(row[columnMap.remaining_term]) : 0;
        
        // If term not provided but dates are, calculate it
        if (term === 0 && originationDate && maturityDate) {
          try {
            const origDate = new Date(originationDate);
            const matDate = new Date(maturityDate);
            const monthsDiff = (matDate.getFullYear() - origDate.getFullYear()) * 12 + (matDate.getMonth() - origDate.getMonth());
            term = monthsDiff > 0 ? monthsDiff : 12; // Default to 12 if calculation fails
            
            // Calculate remaining term from today
            const today = new Date();
            const remainingMonths = (matDate.getFullYear() - today.getFullYear()) * 12 + (matDate.getMonth() - today.getMonth());
            remaining_term = remainingMonths > 0 ? remainingMonths : 0;
          } catch (e) {
            term = 12; // Default to 12 months if date parsing fails
            remaining_term = 6;
          }
        }
        
        // Default values if still not set
        if (term === 0) term = 12;
        if (remaining_term === 0) remaining_term = term / 2;
        
        const loanAmount = parseFinancialValue(row[columnMap.loan_amount!]);
        // If no separate current_balance column, use loan_amount (Committed_Amount)
        const currentBalance = columnMap.current_balance !== undefined ? parseFinancialValue(row[columnMap.current_balance]) : loanAmount;
        // If no separate opening_balance column, use loan_amount (Committed_Amount)
        const openingBalance = columnMap.opening_balance !== undefined ? parseFinancialValue(row[columnMap.opening_balance]) : loanAmount;
        
        const record: CorporateTermLoanRecord = {
          borrower_name: columnMap.borrower_name !== undefined ? parseStringValue(row[columnMap.borrower_name]) : undefined,
          loan_amount: loanAmount,
          facility_amount: columnMap.facility_amount !== undefined ? parseFinancialValue(row[columnMap.facility_amount]) : undefined,
          currency: columnMap.currency !== undefined ? parseStringValue(row[columnMap.currency]) : 'GBP',
          // Calculate interest_rate from base_rate + margin if separate, or use margin if no interest_rate column
          interest_rate: columnMap.interest_rate !== undefined 
            ? parseInterestRate(row[columnMap.interest_rate])
            : columnMap.margin !== undefined 
              ? parseInterestRate(row[columnMap.margin])
              : 0.05,
          margin: columnMap.margin !== undefined ? parseInterestRate(row[columnMap.margin]) : undefined,
          base_rate: columnMap.base_rate !== undefined ? parseStringValue(row[columnMap.base_rate]) : undefined,
          origination_date: originationDate,
          maturity_date: maturityDate,
          term: term,
          remaining_term: remaining_term,
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
          current_balance: currentBalance,
          opening_balance: openingBalance,
          // Handle In_Arrears column - Yes/No or numeric
          arrears_days: columnMap.arrears_days !== undefined 
            ? (typeof row[columnMap.arrears_days] === 'number' 
                ? row[columnMap.arrears_days] 
                : parseYesNoToNumber(row[columnMap.arrears_days]))
            : 0,
          // Handle Defaulted column - map to performing_status
          performing_status: columnMap.performing_status !== undefined 
            ? (parseStringValue(row[columnMap.performing_status]).toLowerCase() === 'yes' || 
               parseStringValue(row[columnMap.performing_status]).toLowerCase() === 'true' ||
               parseStringValue(row[columnMap.performing_status]) === '1'
                ? 'defaulted' 
                : 'performing')
            : 'performing',
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
