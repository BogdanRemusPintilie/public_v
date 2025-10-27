import { supabase } from '@/integrations/supabase/client';
import { CorporateTermLoanRecord } from './parsers/corporateTermLoansParser';

// Re-export for use in other components
export type { CorporateTermLoanRecord };

// Helpers to normalize CTL fields to match DB constraints (e.g., varchar(3))
const toISO3 = (country?: string | null) => {
  if (!country) return null;
  const t = country.trim();
  const map: Record<string, string> = {
    Germany: 'DEU',
    Austria: 'AUT',
    Netherlands: 'NLD',
    'United Kingdom': 'GBR',
    UK: 'GBR',
    France: 'FRA',
    Italy: 'ITA',
    Spain: 'ESP',
    Belgium: 'BEL',
    Switzerland: 'CHE',
    Ireland: 'IRL',
  };
  return (map[t] || (t.length <= 3 ? t.toUpperCase() : t.slice(0, 3).toUpperCase()));
};

const normalize3 = (val?: string | null, fallback?: string) => {
  const s = (val ?? fallback ?? '').toString().trim();
  return s ? s.toUpperCase().slice(0, 3) : null;
};

const cleanNumeric = (v: any): number | null => {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  return null;
};

export const insertCorporateTermLoans = async (
  loans: CorporateTermLoanRecord[],
  progressCallback?: (completed: number, total: number) => void
): Promise<void> => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('Authentication error during CTL insert:', authError);
    throw new Error('User not authenticated. Please log out and log back in.');
  }

  console.log('🔐 AUTHENTICATED USER FOR CTL INSERT:', user.id);

  const BATCH_SIZE = 1000;
  const totalRecords = loans.length;
  let completedRecords = 0;

  for (let i = 0; i < totalRecords; i += BATCH_SIZE) {
    const batch = loans.slice(i, i + BATCH_SIZE);

    const batchWithUserId = batch.map(record => ({
      ...record,
      user_id: user.id,
      remaining_term: Number(record.remaining_term),
      currency: normalize3((record as any).currency, 'EUR'),
      base_rate: normalize3((record as any).base_rate || null) || null,
      country: toISO3((record as any).country || null),
      facility_amount: cleanNumeric((record as any).facility_amount),
      probability_of_default: cleanNumeric((record as any).probability_of_default),
      collateral_coverage_ratio: cleanNumeric((record as any).collateral_coverage_ratio),
      leverage_ratio: cleanNumeric((record as any).leverage_ratio),
      interest_coverage_ratio: cleanNumeric((record as any).interest_coverage_ratio),
      debt_service_coverage_ratio: cleanNumeric((record as any).debt_service_coverage_ratio),
    }));

    console.log('💾 INSERTING CTL BATCH:', {
      batchSize: batchWithUserId.length,
      userId: user.id,
      sampleRecord: batchWithUserId[0]
    });

    const { error } = await supabase
      .from('corporate_term_loans_data')
      .insert(batchWithUserId);

    if (error) {
      console.error('Error inserting CTL data batch:', error);
      throw new Error(`Failed to insert data: ${error.message}`);
    }

    completedRecords += batch.length;
    if (progressCallback) {
      progressCallback(completedRecords, totalRecords);
    }
  }

  console.log('✅ ALL CTL BATCHES INSERTED SUCCESSFULLY');
};

export interface CTLFilterCriteria {
  minLoanAmount?: number;
  maxLoanAmount?: number;
  minFacilityAmount?: number;
  maxFacilityAmount?: number;
  minInterestRate?: number;
  maxInterestRate?: number;
  minRemainingTerm?: number;
  maxRemainingTerm?: number;
  minPD?: number;
  maxPD?: number;
  minLGD?: number;
  maxLGD?: number;
  minLeverageRatio?: number;
  maxLeverageRatio?: number;
  minInterestCoverageRatio?: number;
  maxInterestCoverageRatio?: number;
  minDSCR?: number;
  maxDSCR?: number;
  minCollateralCoverage?: number;
  maxCollateralCoverage?: number;
  creditRating?: string;
  industrySector?: string;
  country?: string;
  securedUnsecured?: string;
  performingStatus?: string;
}

export const getCorporateTermLoansByDataset = async (
  datasetName: string,
  page: number,
  pageSize: number,
  filters?: CTLFilterCriteria
): Promise<{ data: CorporateTermLoanRecord[]; totalCount: number; hasMore: boolean }> => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('User not authenticated');
  }

  const startIndex = page * pageSize;
  
  let countQuery = supabase
    .from('corporate_term_loans_data')
    .select('*', { count: 'exact', head: true })
    .eq('dataset_name', datasetName);

  let dataQuery = supabase
    .from('corporate_term_loans_data')
    .select('*')
    .eq('dataset_name', datasetName);

  if (filters) {
    // Loan amount filters
    if (filters.minLoanAmount !== undefined) {
      countQuery = countQuery.gte('loan_amount', filters.minLoanAmount);
      dataQuery = dataQuery.gte('loan_amount', filters.minLoanAmount);
    }
    if (filters.maxLoanAmount !== undefined) {
      countQuery = countQuery.lte('loan_amount', filters.maxLoanAmount);
      dataQuery = dataQuery.lte('loan_amount', filters.maxLoanAmount);
    }
    
    // Facility amount filters
    if (filters.minFacilityAmount !== undefined) {
      countQuery = countQuery.gte('facility_amount', filters.minFacilityAmount);
      dataQuery = dataQuery.gte('facility_amount', filters.minFacilityAmount);
    }
    if (filters.maxFacilityAmount !== undefined) {
      countQuery = countQuery.lte('facility_amount', filters.maxFacilityAmount);
      dataQuery = dataQuery.lte('facility_amount', filters.maxFacilityAmount);
    }
    
    // Interest rate filters
    if (filters.minInterestRate !== undefined) {
      countQuery = countQuery.gte('interest_rate', filters.minInterestRate);
      dataQuery = dataQuery.gte('interest_rate', filters.minInterestRate);
    }
    if (filters.maxInterestRate !== undefined) {
      countQuery = countQuery.lte('interest_rate', filters.maxInterestRate);
      dataQuery = dataQuery.lte('interest_rate', filters.maxInterestRate);
    }
    
    // Remaining term filters
    if (filters.minRemainingTerm !== undefined) {
      countQuery = countQuery.gte('remaining_term', filters.minRemainingTerm);
      dataQuery = dataQuery.gte('remaining_term', filters.minRemainingTerm);
    }
    if (filters.maxRemainingTerm !== undefined) {
      countQuery = countQuery.lte('remaining_term', filters.maxRemainingTerm);
      dataQuery = dataQuery.lte('remaining_term', filters.maxRemainingTerm);
    }
    
    // PD filters
    if (filters.minPD !== undefined) {
      countQuery = countQuery.gte('pd', filters.minPD);
      dataQuery = dataQuery.gte('pd', filters.minPD);
    }
    if (filters.maxPD !== undefined) {
      countQuery = countQuery.lte('pd', filters.maxPD);
      dataQuery = dataQuery.lte('pd', filters.maxPD);
    }
    
    // LGD filters
    if (filters.minLGD !== undefined) {
      countQuery = countQuery.gte('lgd', filters.minLGD);
      dataQuery = dataQuery.gte('lgd', filters.minLGD);
    }
    if (filters.maxLGD !== undefined) {
      countQuery = countQuery.lte('lgd', filters.maxLGD);
      dataQuery = dataQuery.lte('lgd', filters.maxLGD);
    }
    
    // Leverage ratio filters
    if (filters.minLeverageRatio !== undefined) {
      countQuery = countQuery.gte('leverage_ratio', filters.minLeverageRatio);
      dataQuery = dataQuery.gte('leverage_ratio', filters.minLeverageRatio);
    }
    if (filters.maxLeverageRatio !== undefined) {
      countQuery = countQuery.lte('leverage_ratio', filters.maxLeverageRatio);
      dataQuery = dataQuery.lte('leverage_ratio', filters.maxLeverageRatio);
    }
    
    // Interest coverage ratio filters
    if (filters.minInterestCoverageRatio !== undefined) {
      countQuery = countQuery.gte('interest_coverage_ratio', filters.minInterestCoverageRatio);
      dataQuery = dataQuery.gte('interest_coverage_ratio', filters.minInterestCoverageRatio);
    }
    if (filters.maxInterestCoverageRatio !== undefined) {
      countQuery = countQuery.lte('interest_coverage_ratio', filters.maxInterestCoverageRatio);
      dataQuery = dataQuery.lte('interest_coverage_ratio', filters.maxInterestCoverageRatio);
    }
    
    // DSCR filters
    if (filters.minDSCR !== undefined) {
      countQuery = countQuery.gte('debt_service_coverage_ratio', filters.minDSCR);
      dataQuery = dataQuery.gte('debt_service_coverage_ratio', filters.minDSCR);
    }
    if (filters.maxDSCR !== undefined) {
      countQuery = countQuery.lte('debt_service_coverage_ratio', filters.maxDSCR);
      dataQuery = dataQuery.lte('debt_service_coverage_ratio', filters.maxDSCR);
    }
    
    // Collateral coverage filters
    if (filters.minCollateralCoverage !== undefined) {
      countQuery = countQuery.gte('collateral_coverage_ratio', filters.minCollateralCoverage);
      dataQuery = dataQuery.gte('collateral_coverage_ratio', filters.minCollateralCoverage);
    }
    if (filters.maxCollateralCoverage !== undefined) {
      countQuery = countQuery.lte('collateral_coverage_ratio', filters.maxCollateralCoverage);
      dataQuery = dataQuery.lte('collateral_coverage_ratio', filters.maxCollateralCoverage);
    }
    
    // Categorical filters
    if (filters.creditRating) {
      countQuery = countQuery.eq('credit_rating', filters.creditRating);
      dataQuery = dataQuery.eq('credit_rating', filters.creditRating);
    }
    if (filters.industrySector) {
      countQuery = countQuery.eq('industry_sector', filters.industrySector);
      dataQuery = dataQuery.eq('industry_sector', filters.industrySector);
    }
    if (filters.country) {
      countQuery = countQuery.eq('country', filters.country);
      dataQuery = dataQuery.eq('country', filters.country);
    }
    if (filters.securedUnsecured) {
      countQuery = countQuery.eq('secured_unsecured', filters.securedUnsecured);
      dataQuery = dataQuery.eq('secured_unsecured', filters.securedUnsecured);
    }
    if (filters.performingStatus) {
      countQuery = countQuery.eq('performing_status', filters.performingStatus);
      dataQuery = dataQuery.eq('performing_status', filters.performingStatus);
    }
  }

  const { count } = await countQuery;
  const totalCount = count || 0;

  dataQuery = dataQuery
    .order('created_at', { ascending: false })
    .range(startIndex, startIndex + pageSize - 1);

  const { data, error } = await dataQuery;

  if (error) {
    console.error('Error fetching CTL data:', error);
    throw error;
  }

  const hasMore = startIndex + pageSize < totalCount;

  return {
    data: data || [],
    totalCount,
    hasMore,
  };
};

export const deleteCorporateTermLoansByDataset = async (datasetName: string): Promise<void> => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('User not authenticated');
  }

  console.log(`🗑️ DELETING CTL DATASET: ${datasetName} for user ${user.id}`);

  const { error } = await supabase
    .from('corporate_term_loans_data')
    .delete()
    .eq('dataset_name', datasetName)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting CTL dataset:', error);
    throw new Error(`Failed to delete dataset: ${error.message}`);
  }

  console.log('✅ CTL DATASET DELETED SUCCESSFULLY');
};

export const deleteCorporateTermLoans = async (recordIds: string[]): Promise<void> => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('User not authenticated');
  }

  console.log(`🗑️ DELETING ${recordIds.length} CTL RECORDS`);

  const { error } = await supabase
    .from('corporate_term_loans_data')
    .delete()
    .in('id', recordIds)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting CTL records:', error);
    throw error;
  }

  console.log('✅ CTL RECORDS DELETED SUCCESSFULLY');
};

export interface CTLPortfolioSummary {
  totalExposure: number;
  avgInterestRate: number;
  highRiskLoans: number;
  totalRecords: number;
  avgLeverageRatio: number;
  performingCount: number;
  nonPerformingCount: number;
  weightedAvgPd: number;
  weightedAvgLgd: number;
  expectedLoss: number;
  avgLoanSize: number;
}

export const getCTLPortfolioSummary = async (
  datasetName: string,
  filters?: CTLFilterCriteria
): Promise<CTLPortfolioSummary | null> => {
  console.log(`📊 FETCHING CTL PORTFOLIO SUMMARY for ${datasetName}`);

  const { data, error } = await supabase.rpc('get_ctl_portfolio_summary', {
    dataset_name_param: datasetName,
    min_loan_amount: filters?.minLoanAmount || null,
    max_loan_amount: filters?.maxLoanAmount || null,
    min_leverage_ratio: filters?.minLeverageRatio || null,
    max_leverage_ratio: filters?.maxLeverageRatio || null,
    credit_rating_filter: filters?.creditRating || null,
  });

  if (error) {
    console.error('Error fetching CTL portfolio summary:', error);
    return null;
  }

  if (!data || data.length === 0) {
    return {
      totalExposure: 0,
      avgInterestRate: 0,
      highRiskLoans: 0,
      totalRecords: 0,
      avgLeverageRatio: 0,
      performingCount: 0,
      nonPerformingCount: 0,
      weightedAvgPd: 0,
      weightedAvgLgd: 0,
      expectedLoss: 0,
      avgLoanSize: 0,
    };
  }

  const summary = data[0];
  return {
    totalExposure: Number(summary.total_exposure) || 0,
    avgInterestRate: Number(summary.avg_interest_rate) || 0,
    highRiskLoans: Number(summary.high_risk_loans) || 0,
    totalRecords: Number(summary.total_records) || 0,
    avgLeverageRatio: Number(summary.avg_leverage_ratio) || 0,
    performingCount: Number(summary.performing_count) || 0,
    nonPerformingCount: Number(summary.non_performing_count) || 0,
    weightedAvgPd: Number(summary.weighted_avg_pd) || 0,
    weightedAvgLgd: Number(summary.weighted_avg_lgd) || 0,
    expectedLoss: Number(summary.expected_loss) || 0,
    avgLoanSize: Number(summary.avg_loan_size) || 0,
  };
};

export const getCTLIndustryDistribution = async (
  datasetName: string
): Promise<{ industry: string; count: number; totalExposure: number }[]> => {
  const { data, error } = await supabase.rpc('get_ctl_industry_distribution', {
    dataset_name_param: datasetName,
  });

  if (error) {
    console.error('Error fetching CTL industry distribution:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    industry: item.industry,
    count: Number(item.count),
    totalExposure: Number(item.total_exposure),
  }));
};

export const getCTLRatingDistribution = async (
  datasetName: string
): Promise<{ rating: string; count: number }[]> => {
  const { data, error } = await supabase.rpc('get_ctl_rating_distribution', {
    dataset_name_param: datasetName,
  });

  if (error) {
    console.error('Error fetching CTL rating distribution:', error);
    return [];
  }

  return (data || []).map((item: any) => ({
    rating: item.rating,
    count: Number(item.count),
  }));
};
