import { supabase } from '@/integrations/supabase/client';
import { CorporateTermLoanRecord } from './parsers/corporateTermLoansParser';

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
  minLeverageRatio?: number;
  maxLeverageRatio?: number;
  creditRating?: string;
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
    if (filters.minLoanAmount !== undefined) {
      countQuery = countQuery.gte('loan_amount', filters.minLoanAmount);
      dataQuery = dataQuery.gte('loan_amount', filters.minLoanAmount);
    }
    if (filters.maxLoanAmount !== undefined) {
      countQuery = countQuery.lte('loan_amount', filters.maxLoanAmount);
      dataQuery = dataQuery.lte('loan_amount', filters.maxLoanAmount);
    }
    if (filters.minLeverageRatio !== undefined) {
      countQuery = countQuery.gte('leverage_ratio', filters.minLeverageRatio);
      dataQuery = dataQuery.gte('leverage_ratio', filters.minLeverageRatio);
    }
    if (filters.maxLeverageRatio !== undefined) {
      countQuery = countQuery.lte('leverage_ratio', filters.maxLeverageRatio);
      dataQuery = dataQuery.lte('leverage_ratio', filters.maxLeverageRatio);
    }
    if (filters.creditRating) {
      countQuery = countQuery.eq('credit_rating', filters.creditRating);
      dataQuery = dataQuery.eq('credit_rating', filters.creditRating);
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
