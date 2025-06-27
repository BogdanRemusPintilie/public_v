
-- Create a database function to get accurate dataset summaries
CREATE OR REPLACE FUNCTION get_dataset_summaries()
RETURNS TABLE (
  dataset_name TEXT,
  record_count BIGINT,
  total_value NUMERIC,
  avg_interest_rate NUMERIC,
  high_risk_count BIGINT,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
AS $$
  SELECT 
    COALESCE(ld.dataset_name, 'Unnamed Dataset') as dataset_name,
    COUNT(*) as record_count,
    COALESCE(SUM(ld.opening_balance), 0) as total_value,
    CASE 
      WHEN SUM(ld.opening_balance) > 0 
      THEN SUM(ld.interest_rate * ld.opening_balance) / SUM(ld.opening_balance)
      ELSE 0 
    END as avg_interest_rate,
    COUNT(CASE WHEN COALESCE(ld.pd, 0) > 0.05 THEN 1 END) as high_risk_count,
    MIN(ld.created_at) as created_at
  FROM loan_data ld
  WHERE ld.dataset_name IS NOT NULL
  GROUP BY ld.dataset_name
  ORDER BY MIN(ld.created_at) DESC;
$$;
