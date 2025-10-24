-- Create loan_type enum
CREATE TYPE loan_type AS ENUM ('consumer_finance', 'corporate_term_loans');

-- Add loan_type column to loan_data
ALTER TABLE loan_data ADD COLUMN loan_type loan_type DEFAULT 'consumer_finance';
CREATE INDEX idx_loan_data_loan_type ON loan_data(loan_type);

-- Add loan_type to dataset_shares to track what type of data each dataset contains
ALTER TABLE dataset_shares ADD COLUMN loan_type loan_type DEFAULT 'consumer_finance';

-- Create corporate_term_loans_data table with CTL-specific fields
CREATE TABLE corporate_term_loans_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dataset_name VARCHAR,
  
  -- Core loan fields
  borrower_name TEXT,
  loan_amount NUMERIC NOT NULL,
  facility_amount NUMERIC,
  currency VARCHAR(3) DEFAULT 'EUR',
  interest_rate NUMERIC NOT NULL,
  margin NUMERIC,
  base_rate VARCHAR(50),
  
  -- Terms
  origination_date DATE,
  maturity_date DATE,
  term INTEGER NOT NULL,
  remaining_term NUMERIC NOT NULL,
  amortization_type VARCHAR(50),
  
  -- Risk metrics
  credit_rating VARCHAR(10),
  pd NUMERIC,
  lgd NUMERIC NOT NULL,
  probability_of_default NUMERIC,
  
  -- Collateral & Security
  secured_unsecured VARCHAR(20),
  collateral_type TEXT,
  collateral_coverage_ratio NUMERIC,
  
  -- Industry/Sector
  industry_sector TEXT,
  country VARCHAR(3),
  
  -- Covenants & Financial
  leverage_ratio NUMERIC,
  interest_coverage_ratio NUMERIC,
  debt_service_coverage_ratio NUMERIC,
  covenant_status VARCHAR(20),
  
  -- Performance
  current_balance NUMERIC NOT NULL,
  opening_balance NUMERIC NOT NULL,
  arrears_days INTEGER DEFAULT 0,
  performing_status VARCHAR(20) DEFAULT 'performing',
  
  -- Metadata
  file_name TEXT,
  worksheet_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for corporate_term_loans_data
ALTER TABLE corporate_term_loans_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own or shared CTL data" ON corporate_term_loans_data
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      auth.uid() = user_id OR
      EXISTS (
        SELECT 1 FROM dataset_shares
        WHERE dataset_shares.dataset_name = corporate_term_loans_data.dataset_name
        AND (dataset_shares.shared_with_user_id = auth.uid() OR dataset_shares.shared_with_email = auth.email())
      )
    )
  );

CREATE POLICY "Users can insert own CTL data" ON corporate_term_loans_data
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update own CTL data" ON corporate_term_loans_data
  FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete own CTL data" ON corporate_term_loans_data
  FOR DELETE USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Create indexes for CTL table
CREATE INDEX idx_ctl_user_id ON corporate_term_loans_data(user_id);
CREATE INDEX idx_ctl_dataset_name ON corporate_term_loans_data(dataset_name);
CREATE INDEX idx_ctl_created_at ON corporate_term_loans_data(created_at);
CREATE INDEX idx_ctl_loan_type ON corporate_term_loans_data(user_id, dataset_name);

-- Create CTL-specific database functions
CREATE OR REPLACE FUNCTION get_ctl_portfolio_summary(
  dataset_name_param TEXT,
  min_loan_amount NUMERIC DEFAULT NULL,
  max_loan_amount NUMERIC DEFAULT NULL,
  min_leverage_ratio NUMERIC DEFAULT NULL,
  max_leverage_ratio NUMERIC DEFAULT NULL,
  credit_rating_filter TEXT DEFAULT NULL
) RETURNS TABLE (
  total_exposure NUMERIC,
  avg_interest_rate NUMERIC,
  high_risk_loans BIGINT,
  total_records BIGINT,
  avg_leverage_ratio NUMERIC,
  performing_count BIGINT,
  non_performing_count BIGINT
) 
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(SUM(ctl.current_balance), 0) as total_exposure,
    COALESCE(AVG(ctl.interest_rate), 0) as avg_interest_rate,
    COUNT(CASE WHEN COALESCE(ctl.pd, 0) > 0.10 THEN 1 END) as high_risk_loans,
    COUNT(*) as total_records,
    COALESCE(AVG(ctl.leverage_ratio), 0) as avg_leverage_ratio,
    COUNT(CASE WHEN ctl.performing_status = 'performing' THEN 1 END) as performing_count,
    COUNT(CASE WHEN ctl.performing_status != 'performing' THEN 1 END) as non_performing_count
  FROM corporate_term_loans_data ctl
  WHERE ctl.dataset_name = dataset_name_param
    AND (
      ctl.user_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM dataset_shares ds
        WHERE ds.dataset_name = ctl.dataset_name
          AND (ds.shared_with_user_id = auth.uid() OR ds.shared_with_email = auth.email())
      )
    )
    AND (min_loan_amount IS NULL OR ctl.loan_amount >= min_loan_amount)
    AND (max_loan_amount IS NULL OR ctl.loan_amount <= max_loan_amount)
    AND (min_leverage_ratio IS NULL OR COALESCE(ctl.leverage_ratio, 0) >= min_leverage_ratio)
    AND (max_leverage_ratio IS NULL OR COALESCE(ctl.leverage_ratio, 0) <= max_leverage_ratio)
    AND (credit_rating_filter IS NULL OR ctl.credit_rating = credit_rating_filter);
$$;

CREATE OR REPLACE FUNCTION get_ctl_industry_distribution(
  dataset_name_param TEXT
) RETURNS TABLE (
  industry TEXT,
  count BIGINT,
  total_exposure NUMERIC
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(ctl.industry_sector, 'Unknown') as industry,
    COUNT(*) as count,
    COALESCE(SUM(ctl.current_balance), 0) as total_exposure
  FROM corporate_term_loans_data ctl
  WHERE ctl.dataset_name = dataset_name_param
    AND (
      ctl.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM dataset_shares ds
        WHERE ds.dataset_name = ctl.dataset_name
          AND (ds.shared_with_user_id = auth.uid() OR ds.shared_with_email = auth.email())
      )
    )
  GROUP BY ctl.industry_sector
  ORDER BY total_exposure DESC;
$$;

CREATE OR REPLACE FUNCTION get_ctl_rating_distribution(
  dataset_name_param TEXT
) RETURNS TABLE (
  rating TEXT,
  count BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(ctl.credit_rating, 'Not Rated') as rating,
    COUNT(*) as count
  FROM corporate_term_loans_data ctl
  WHERE ctl.dataset_name = dataset_name_param
    AND (
      ctl.user_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM dataset_shares ds
        WHERE ds.dataset_name = ctl.dataset_name
          AND (ds.shared_with_user_id = auth.uid() OR ds.shared_with_email = auth.email())
      )
    )
  GROUP BY ctl.credit_rating
  ORDER BY count DESC;
$$;