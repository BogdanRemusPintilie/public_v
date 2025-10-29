import { supabase } from '@/integrations/supabase/client';

export interface LoanRecord {
  id?: string;
  created_at?: string;
  user_id?: string;
  dataset_name?: string;
  loan_amount: number;
  interest_rate: number;
  term: number;
  remaining_term: number;
  lgd: number;
  ltv: number;
  opening_balance: number;
  pd: number;
  file_name: string;
  worksheet_name: string;
}

interface DatasetSummary {
  dataset_name: string;
  record_count: number;
  total_value: number;
  avg_interest_rate: number;
  high_risk_loans: number;
  created_at: string;
  loan_type?: string;
}

export interface TrancheStructure {
  id: string;
  structure_name: string;
  dataset_name: string;
  tranches: any[];
  total_cost: number;
  weighted_avg_cost_bps: number;
  cost_percentage: number;
  additional_transaction_costs?: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const insertLoanData = async (
  loanData: LoanRecord[],
  progressCallback?: (completed: number, total: number) => void
): Promise<void> => {
  // Get the current user to ensure we have proper authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.error('Authentication error during insert:', authError);
    throw new Error('User not authenticated. Please log out and log back in.');
  }

  console.log('🔐 AUTHENTICATED USER FOR INSERT:', user.id);

  const BATCH_SIZE = 1000;
  const totalRecords = loanData.length;
  let completedRecords = 0;

  for (let i = 0; i < totalRecords; i += BATCH_SIZE) {
    const batch = loanData.slice(i, i + BATCH_SIZE);

    // Ensure all records have the correct user_id and cast types for database insert
    const batchWithUserId = batch.map(record => ({
      ...record,
      user_id: user.id, // Explicitly set the user_id for RLS compliance
      remaining_term: Number(record.remaining_term), // Cast to numeric for database compatibility
    }));

    console.log('💾 INSERTING BATCH:', {
      batchSize: batchWithUserId.length,
      userId: user.id,
      sampleRecord: batchWithUserId[0]
    });

    const { error } = await supabase
      .from('loan_data')
      .insert(batchWithUserId);

    if (error) {
      console.error('Error inserting loan data batch:', error);
      throw new Error(`Failed to insert data: ${error.message}`);
    }

    completedRecords += batch.length;
    if (progressCallback) {
      progressCallback(completedRecords, totalRecords);
    }
  }

  console.log('✅ ALL BATCHES INSERTED SUCCESSFULLY');
};

export interface FilterCriteria {
  minLoanAmount?: number;
  maxLoanAmount?: number;
  minInterestRate?: number;
  maxInterestRate?: number;
  minRemainingTerm?: number;
  maxRemainingTerm?: number;
  minPD?: number;
  maxPD?: number;
  minLGD?: number;
  maxLGD?: number;
  maxExposureCap?: number;
  exposureCapAmount?: number;
  enableExposureCapping?: boolean;
}

export const getLoanDataByDataset = async (
  datasetName: string,
  page: number,
  pageSize: number,
  filters?: FilterCriteria
): Promise<{ data: LoanRecord[]; totalCount: number; hasMore: boolean }> => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('User not authenticated');
  }

  const startIndex = page * pageSize;
  
  // Build the query with filters
  let countQuery = supabase
    .from('loan_data')
    .select('*', { count: 'exact', head: true })
    .eq('dataset_name', datasetName)
    .eq('user_id', user.id);

  let dataQuery = supabase
    .from('loan_data')
    .select('*')
    .eq('dataset_name', datasetName)
    .eq('user_id', user.id);

  // Apply filters if provided
  if (filters) {
    if (filters.minLoanAmount !== undefined) {
      countQuery = countQuery.gte('opening_balance', filters.minLoanAmount);
      dataQuery = dataQuery.gte('opening_balance', filters.minLoanAmount);
    }
    if (filters.maxLoanAmount !== undefined) {
      countQuery = countQuery.lte('opening_balance', filters.maxLoanAmount);
      dataQuery = dataQuery.lte('opening_balance', filters.maxLoanAmount);
    }
    if (filters.minInterestRate !== undefined) {
      countQuery = countQuery.gte('interest_rate', filters.minInterestRate);
      dataQuery = dataQuery.gte('interest_rate', filters.minInterestRate);
    }
    if (filters.maxInterestRate !== undefined) {
      countQuery = countQuery.lte('interest_rate', filters.maxInterestRate);
      dataQuery = dataQuery.lte('interest_rate', filters.maxInterestRate);
    }
    if (filters.minRemainingTerm !== undefined) {
      countQuery = countQuery.gte('remaining_term', filters.minRemainingTerm);
      dataQuery = dataQuery.gte('remaining_term', filters.minRemainingTerm);
    }
    if (filters.maxRemainingTerm !== undefined) {
      countQuery = countQuery.lte('remaining_term', filters.maxRemainingTerm);
      dataQuery = dataQuery.lte('remaining_term', filters.maxRemainingTerm);
    }
    if (filters.minPD !== undefined) {
      countQuery = countQuery.gte('pd', filters.minPD);
      dataQuery = dataQuery.gte('pd', filters.minPD);
    }
    if (filters.maxPD !== undefined) {
      countQuery = countQuery.lte('pd', filters.maxPD);
      dataQuery = dataQuery.lte('pd', filters.maxPD);
    }
    if (filters.minLGD !== undefined) {
      countQuery = countQuery.gte('lgd', filters.minLGD);
      dataQuery = dataQuery.gte('lgd', filters.minLGD);
    }
    if (filters.maxLGD !== undefined) {
      countQuery = countQuery.lte('lgd', filters.maxLGD);
      dataQuery = dataQuery.lte('lgd', filters.maxLGD);
    }
  }
  
  // Execute count query
  const { count, error: countError } = await countQuery;
  
  if (countError) {
    console.error('Error fetching total count:', countError);
    throw countError;
  }
  
  // Execute data query with pagination
  const { data, error } = await dataQuery
    .range(startIndex, startIndex + pageSize - 1)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching loan data:', error);
    throw error;
  }

  const totalCount = count || 0;
  const hasMore = startIndex + pageSize < totalCount;

  // Transform data to ensure remaining_term is properly typed as number
  const transformedData = (data || []).map(record => ({
    ...record,
    remaining_term: Number(record.remaining_term), // Ensure it's always a number
  })) as LoanRecord[];

  return { data: transformedData, totalCount, hasMore };
};

export const deleteLoanDataByDataset = async (datasetName: string): Promise<void> => {
  console.log('🗑️ DELETING DATASET:', datasetName);
  
  // Delete from loan_data table (Consumer Finance)
  const { error: loanDataError } = await supabase
    .from('loan_data')
    .delete()
    .eq('dataset_name', datasetName);

  if (loanDataError) {
    console.error('❌ Error deleting consumer finance loan data:', loanDataError);
    throw loanDataError;
  }

  // Delete from corporate_term_loans_data table (CTL)
  const { error: ctlDataError } = await supabase
    .from('corporate_term_loans_data')
    .delete()
    .eq('dataset_name', datasetName);

  if (ctlDataError) {
    console.error('❌ Error deleting CTL data:', ctlDataError);
    throw ctlDataError;
  }

  // Delete any dataset shares for this dataset
  const { error: sharesError } = await supabase
    .from('dataset_shares')
    .delete()
    .eq('dataset_name', datasetName);

  if (sharesError) {
    console.error('❌ Error deleting dataset shares:', sharesError);
    // Don't throw here as the main data deletion succeeded
  }

  // Delete any tranche structures for this dataset
  const { error: trancheError } = await supabase
    .from('tranche_structures')
    .delete()
    .eq('dataset_name', datasetName);

  if (trancheError) {
    console.error('❌ Error deleting tranche structures:', trancheError);
    // Don't throw here as the main data deletion succeeded
  }

  console.log(`✅ Successfully deleted dataset "${datasetName}" from all tables`);
};

export const deleteLoanData = async (recordIds: string[]): Promise<void> => {
  const { error } = await supabase
    .from('loan_data')
    .delete()
    .in('id', recordIds);

  if (error) {
    console.error('Error deleting loan data:', error);
    throw error;
  }
};

export const getDatasetSummaries = async (): Promise<DatasetSummary[]> => {
  try {
    console.log('🔄 getDatasetSummaries - Starting fetch...');
    
    // Get all accessible datasets (including shared ones)
    const accessibleDatasets = await getAccessibleDatasets();
    console.log('📊 Found', accessibleDatasets.length, 'accessible datasets');
    
    if (accessibleDatasets.length === 0) {
      return [];
    }
    
    // For each dataset, get its summary information
    const summaries: DatasetSummary[] = [];
    
    for (const dataset of accessibleDatasets) {
      try {
        // Use appropriate RPC function based on loan type
        if (dataset.loan_type === 'corporate_term_loans') {
          console.log(`🔍 Fetching CTL summary for ${dataset.name}`);
          
          const { data, error } = await supabase.rpc('get_ctl_portfolio_summary', {
            dataset_name_param: dataset.name
          });
          
          if (error) {
            console.error(`❌ Error fetching CTL summary for ${dataset.name}:`, error);
            continue;
          }
          
          if (data && data.length > 0) {
            const summary = data[0];
            summaries.push({
              dataset_name: dataset.name,
              record_count: summary.total_records || 0,
              total_value: summary.total_exposure || 0,
              avg_interest_rate: summary.avg_interest_rate || 0,
              high_risk_loans: summary.high_risk_loans || 0,
              created_at: new Date().toISOString(),
              loan_type: dataset.loan_type
            });
          }
        } else {
          console.log(`🔍 Fetching consumer finance summary for ${dataset.name}`);
          
          const { data, error } = await supabase.rpc('get_portfolio_summary', {
            dataset_name_param: dataset.name
          });
          
          if (error) {
            console.error(`❌ Error fetching summary for ${dataset.name}:`, error);
            continue;
          }
          
          if (data && data.length > 0) {
            const summary = data[0];
            summaries.push({
              dataset_name: dataset.name,
              record_count: summary.total_records || 0,
              total_value: summary.total_value || 0,
              avg_interest_rate: summary.avg_interest_rate || 0,
              high_risk_loans: summary.high_risk_loans || 0,
              created_at: new Date().toISOString(),
              loan_type: dataset.loan_type
            });
          }
        }
      } catch (err) {
        console.error(`Error processing dataset ${dataset.name}:`, err);
        continue;
      }
    }
    
    console.log('✅ getDatasetSummaries - Success, found', summaries.length, 'dataset summaries');
    return summaries;
  } catch (error) {
    console.error('💥 getDatasetSummaries - Error fetching dataset summaries:', error);
    return [];
  }
};

// Enhanced function to get datasets including shared ones with better error handling
export const getAccessibleDatasets = async (): Promise<{ name: string; owner_id: string; is_shared: boolean; loan_type?: string }[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  console.log('🔍 FETCHING ACCESSIBLE DATASETS for user:', user.id, 'email:', user.email);

  try {
    const uniqueDatasets = new Map<string, { name: string; owner_id: string; is_shared: boolean; loan_type?: string }>();
    
    // First, get unique datasets owned by the user using efficient GROUP BY database function
    const { data: ownedDatasets, error: ownedError } = await (supabase as any)
      .rpc('get_user_unique_datasets', { 
        input_user_id: user.id 
      });

    if (ownedError) {
      console.error('❌ Error fetching owned datasets:', ownedError);
      throw ownedError;
    }

    console.log('📊 OWNED DATASETS:', ownedDatasets?.length || 0, 'unique datasets');

    // Process owned datasets and deduplicate
    if (ownedDatasets && ownedDatasets.length > 0) {
      ownedDatasets.forEach(record => {
        if (record.dataset_name && record.dataset_name.trim()) {
          const datasetName = record.dataset_name.trim();
          if (!uniqueDatasets.has(datasetName)) {
            uniqueDatasets.set(datasetName, {
              name: datasetName,
              owner_id: record.user_id,
              is_shared: false,
              loan_type: record.loan_type
            });
          }
        }
      });
    }

    console.log('📊 UNIQUE OWNED DATASETS:', Array.from(uniqueDatasets.keys()));

    // Second, get shared datasets - check both email and user_id matches
    const { data: sharedDatasets, error: sharedError } = await supabase
      .from('dataset_shares')
      .select('dataset_name, owner_id, loan_type')
      .or(`shared_with_email.eq.${user.email},shared_with_user_id.eq.${user.id}`)
      .not('dataset_name', 'is', null)
      .not('dataset_name', 'eq', '');

    if (sharedError) {
      console.error('❌ Error fetching shared datasets:', sharedError);
      // Continue with owned datasets only, don't throw
    } else {
      console.log('📊 SHARED DATASETS:', sharedDatasets?.length || 0, 'records');

      // Add shared datasets
      if (sharedDatasets && sharedDatasets.length > 0) {
        sharedDatasets.forEach(share => {
          if (share.dataset_name && share.dataset_name.trim()) {
            const datasetName = share.dataset_name.trim();
            if (!uniqueDatasets.has(datasetName)) {
              uniqueDatasets.set(datasetName, {
                name: datasetName,
                owner_id: share.owner_id,
                is_shared: true,
                loan_type: share.loan_type
              });
            }
          }
        });
      }
    }

    // Convert to array and sort by name
    const result = Array.from(uniqueDatasets.values())
      .sort((a, b) => a.name.localeCompare(b.name));
    
    console.log('📊 FINAL ACCESSIBLE DATASETS:', {
      totalFound: result.length,
      datasetNames: result.map(d => d.name),
      ownedCount: result.filter(d => !d.is_shared).length,
      sharedCount: result.filter(d => d.is_shared).length
    });

    return result;
  } catch (error) {
    console.error('❌ Error in getAccessibleDatasets:', error);
    throw error;
  }
};

export const getUserDatasets = async (): Promise<{ name: string; owner_id: string }[]> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('loan_data')
    .select('dataset_name, user_id')
    .eq('user_id', user.id)
    .not('dataset_name', 'is', null);

  if (error) {
    console.error('Error fetching user datasets:', error);
    throw error;
  }

  // Deduplicate datasets by name
  const uniqueDatasets = new Map();
  data?.forEach(dataset => {
    if (dataset.dataset_name && dataset.dataset_name.trim()) {
      uniqueDatasets.set(dataset.dataset_name, { name: dataset.dataset_name, owner_id: dataset.user_id });
    }
  });

  return Array.from(uniqueDatasets.values());
};

export interface DatasetShare {
  id?: string;
  dataset_name: string;
  owner_id: string;
  shared_with_email: string;
  created_at?: string;
}

export const shareDataset = async (datasetName: string, sharedWithEmail: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('dataset_shares')
    .insert([{
      dataset_name: datasetName,
      owner_id: user.id,
      shared_with_email: sharedWithEmail
    }]);

  if (error) {
    console.error('Error sharing dataset:', error);
    throw error;
  }
};

export const getDatasetShares = async (datasetName: string): Promise<DatasetShare[]> => {
  const { data, error } = await supabase
    .from('dataset_shares')
    .select('*')
    .eq('dataset_name', datasetName);

  if (error) {
    console.error('Error fetching dataset shares:', error);
    throw error;
  }

  return (data || []) as DatasetShare[];
};

export const removeDatasetShare = async (shareId: string): Promise<void> => {
  const { error } = await supabase
    .from('dataset_shares')
    .delete()
    .eq('id', shareId);

  if (error) {
    console.error('Error removing dataset share:', error);
    throw error;
  }
};

// Tranche structure functions
export const saveTrancheStructure = async (structure: TrancheStructure): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('tranche_structures')
    .insert({
      structure_name: structure.structure_name,
      dataset_name: structure.dataset_name,
      tranches: structure.tranches as any, // Cast to Json type for database
      total_cost: structure.total_cost,
      weighted_avg_cost_bps: structure.weighted_avg_cost_bps,
      cost_percentage: structure.cost_percentage,
      user_id: user.id
    });

  if (error) {
    console.error('Error saving tranche structure:', error);
    throw error;
  }
};

export const getTrancheStructures = async (): Promise<TrancheStructure[]> => {
  const { data, error } = await supabase
    .from('tranche_structures')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tranche structures:', error);
    throw error;
  }

  // Cast the Json tranches back to array type
  return (data || []).map(item => ({
    ...item,
    tranches: item.tranches as any[]
  })) as TrancheStructure[];
};

export const deleteTrancheStructure = async (structureId: string): Promise<void> => {
  const { error } = await supabase
    .from('tranche_structures')
    .delete()
    .eq('id', structureId);

  if (error) {
    console.error('Error deleting tranche structure:', error);
    throw error;
  }
};

// Portfolio summary function - calculates summary for entire dataset server-side
export interface PortfolioSummary {
  totalValue: number;
  avgInterestRate: number;
  highRiskLoans: number;
  totalRecords: number;
  weightedAvgInterestRate: number;
  weightedAvgLtv: number;
  weightedAvgPd: number;
  weightedAvgLgd: number;
  expectedLoss: number;
}

export const getPortfolioSummary = async (datasetName: string, filters?: FilterCriteria): Promise<PortfolioSummary | null> => {
  try {
    console.log('🔍 GET PORTFOLIO SUMMARY:', { datasetName, filters });
    
    // Prepare filter parameters for the RPC function
    const filterParams = {
      dataset_name_param: datasetName,
      min_loan_amount: filters?.minLoanAmount || null,
      max_loan_amount: filters?.maxLoanAmount || null,
      min_interest_rate: filters?.minInterestRate || null,
      max_interest_rate: filters?.maxInterestRate || null,
      min_remaining_term: filters?.minRemainingTerm || null,
      max_remaining_term: filters?.maxRemainingTerm || null,
      min_pd: filters?.minPD || null,
      max_pd: filters?.maxPD || null,
      min_lgd: filters?.minLGD || null,
      max_lgd: filters?.maxLGD || null
    };

    console.log('📊 Calling database RPC with filters:', filterParams);

    const { data, error } = await supabase
      .rpc('get_portfolio_summary', filterParams);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      const result = data[0];
      const summary = {
        totalValue: Number(result.total_value) || 0,
        avgInterestRate: Number(result.avg_interest_rate) || 0,
        highRiskLoans: Number(result.high_risk_loans) || 0,
        totalRecords: Number(result.total_records) || 0,
        weightedAvgInterestRate: Number(result.weighted_avg_interest_rate) || 0,
        weightedAvgLtv: Number(result.weighted_avg_ltv) || 0,
        weightedAvgPd: Number(result.weighted_avg_pd) || 0,
        weightedAvgLgd: Number(result.weighted_avg_lgd) || 0,
        expectedLoss: Number(result.expected_loss) || 0,
      };
      
      console.log('✅ Portfolio summary from database:', summary);
      return summary;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting portfolio summary:', error);
    return null;
  }
};

// Chart data functions
export const getMaturityDistribution = async (
  datasetName: string,
  filters?: FilterCriteria
): Promise<{ range: string; count: number }[]> => {
  const { data, error } = await supabase.rpc('get_maturity_distribution', {
    dataset_name_param: datasetName,
    min_loan_amount: filters?.minLoanAmount || null,
    max_loan_amount: filters?.maxLoanAmount || null,
    min_interest_rate: filters?.minInterestRate || null,
    max_interest_rate: filters?.maxInterestRate || null,
    min_remaining_term: filters?.minRemainingTerm || null,
    max_remaining_term: filters?.maxRemainingTerm || null,
    min_pd: filters?.minPD || null,
    max_pd: filters?.maxPD || null,
    min_lgd: filters?.minLGD || null,
    max_lgd: filters?.maxLGD || null,
  });

  if (error) {
    console.error('Error fetching maturity distribution:', error);
    return [];
  }

  return data?.map((item: any) => ({
    range: item.range_name,
    count: Number(item.count)
  })) || [];
};

export const getLoanSizeDistribution = async (
  datasetName: string,
  filters?: FilterCriteria
): Promise<{ name: string; value: number; fill: string }[]> => {
  const { data, error } = await supabase.rpc('get_loan_size_distribution', {
    dataset_name_param: datasetName,
    min_loan_amount: filters?.minLoanAmount || null,
    max_loan_amount: filters?.maxLoanAmount || null,
    min_interest_rate: filters?.minInterestRate || null,
    max_interest_rate: filters?.maxInterestRate || null,
    min_remaining_term: filters?.minRemainingTerm || null,
    max_remaining_term: filters?.maxRemainingTerm || null,
    min_pd: filters?.minPD || null,
    max_pd: filters?.maxPD || null,
    min_lgd: filters?.minLGD || null,
    max_lgd: filters?.maxLGD || null,
  });

  if (error) {
    console.error('Error fetching loan size distribution:', error);
    return [];
  }

  const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
  
  return data?.map((item: any, index: number) => ({
    name: item.range_name,
    value: Number(item.count),
    fill: colors[index % colors.length]
  })).filter((item: any) => item.value > 0) || [];
};
