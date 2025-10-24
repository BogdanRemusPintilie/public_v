import { parseConsumerFinanceFile, ParsedExcelData as CFParsedData } from './consumerFinanceParser';
import { parseCorporateTermLoansFile, ParsedCTLData } from './corporateTermLoansParser';

export type LoanType = 'consumer_finance' | 'corporate_term_loans';

export interface ParserConfig {
  name: string;
  displayName: string;
  tableTarget: string;
  parser: (file: File) => Promise<any>;
}

export const PARSER_REGISTRY: Record<LoanType, ParserConfig> = {
  consumer_finance: {
    name: 'consumer_finance',
    displayName: 'Consumer Finance Loans',
    tableTarget: 'loan_data',
    parser: parseConsumerFinanceFile
  },
  corporate_term_loans: {
    name: 'corporate_term_loans',
    displayName: 'Corporate Term Loans',
    tableTarget: 'corporate_term_loans_data',
    parser: parseCorporateTermLoansFile
  }
};

export const getLoanTypeDisplayName = (loanType: LoanType): string => {
  return PARSER_REGISTRY[loanType]?.displayName || loanType;
};
