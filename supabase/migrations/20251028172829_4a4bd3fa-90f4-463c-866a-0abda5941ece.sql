-- Create table for exposure limits
CREATE TABLE IF NOT EXISTS public.exposure_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  dataset_name TEXT NOT NULL,
  limit_type TEXT NOT NULL, -- 'sector', 'borrower', 'country', 'rating'
  limit_key TEXT NOT NULL, -- The specific value (e.g., 'Technology', 'AAA', 'DEU')
  limit_amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, dataset_name, limit_type, limit_key)
);

-- Enable RLS
ALTER TABLE public.exposure_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own exposure limits"
  ON public.exposure_limits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own exposure limits"
  ON public.exposure_limits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exposure limits"
  ON public.exposure_limits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exposure limits"
  ON public.exposure_limits FOR DELETE
  USING (auth.uid() = user_id);

-- Function to get exposure by dimension
CREATE OR REPLACE FUNCTION public.get_ctl_exposure_by_dimension(
  dataset_name_param TEXT,
  dimension_type TEXT -- 'sector', 'borrower', 'country', 'rating'
)
RETURNS TABLE(
  dimension_key TEXT,
  total_exposure NUMERIC,
  loan_count BIGINT,
  limit_amount NUMERIC,
  limit_breach BOOLEAN,
  breach_amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH exposures AS (
    SELECT 
      CASE 
        WHEN dimension_type = 'sector' THEN COALESCE(ctl.industry_sector, 'Unknown')
        WHEN dimension_type = 'borrower' THEN COALESCE(ctl.borrower_name, 'Unknown')
        WHEN dimension_type = 'country' THEN COALESCE(ctl.country, 'Unknown')
        WHEN dimension_type = 'rating' THEN COALESCE(ctl.credit_rating, 'Not Rated')
      END AS dim_key,
      SUM(ctl.current_balance) AS total_exp,
      COUNT(*) AS cnt
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
    GROUP BY dim_key
  ),
  limits AS (
    SELECT 
      el.limit_key,
      el.limit_amount AS lmt
    FROM exposure_limits el
    WHERE el.user_id = auth.uid()
      AND el.dataset_name = dataset_name_param
      AND el.limit_type = dimension_type
  )
  SELECT 
    e.dim_key AS dimension_key,
    COALESCE(e.total_exp, 0) AS total_exposure,
    COALESCE(e.cnt, 0) AS loan_count,
    l.lmt AS limit_amount,
    CASE 
      WHEN l.lmt IS NOT NULL AND e.total_exp > l.lmt THEN true
      ELSE false
    END AS limit_breach,
    CASE 
      WHEN l.lmt IS NOT NULL AND e.total_exp > l.lmt THEN e.total_exp - l.lmt
      ELSE 0
    END AS breach_amount
  FROM exposures e
  LEFT JOIN limits l ON e.dim_key = l.limit_key
  ORDER BY e.total_exp DESC;
END;
$$;