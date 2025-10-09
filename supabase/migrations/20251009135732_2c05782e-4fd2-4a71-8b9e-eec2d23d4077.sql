-- ============================================
-- SECURITY FIX: Address Critical Vulnerabilities (Part 2)
-- ============================================

-- 2. FIX: Add user_id to etl_jobs table and update RLS policies
-- Prevents users from accessing other users' ETL job data
ALTER TABLE public.etl_jobs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Delete existing records since we can't determine ownership
DELETE FROM public.etl_jobs;

-- Make user_id required going forward
ALTER TABLE public.etl_jobs ALTER COLUMN user_id SET NOT NULL;

-- Drop old insecure policies
DROP POLICY IF EXISTS "Users can create their own ETL jobs" ON public.etl_jobs;
DROP POLICY IF EXISTS "Users can update their own ETL jobs" ON public.etl_jobs;
DROP POLICY IF EXISTS "Users can view their own ETL jobs" ON public.etl_jobs;

-- Create new secure policies
CREATE POLICY "Users can create their own ETL jobs"
ON public.etl_jobs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own ETL jobs"
ON public.etl_jobs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own ETL jobs"
ON public.etl_jobs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 3. FIX: Restrict investors table to user's own data
DROP POLICY IF EXISTS "Users can view all investors" ON public.investors;

CREATE POLICY "Users can view their own investors"
ON public.investors FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. FIX: Add SET search_path to all SECURITY DEFINER functions
CREATE OR REPLACE FUNCTION public.update_etl_jobs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_company_access(_user_id uuid, _company_type company_type)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND company_type = _company_type
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_user_profile(_user_id uuid)
RETURNS TABLE(id uuid, email text, full_name text, company text, company_type company_type, role user_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.company,
    p.company_type,
    p.role
  FROM public.profiles p
  WHERE p.user_id = _user_id
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_dataset_summaries_optimized()
RETURNS TABLE(dataset_name text, record_count bigint, total_value numeric, avg_interest_rate numeric, high_risk_count bigint, created_at timestamp with time zone)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    COALESCE(ld.dataset_name, 'Unnamed Dataset') as dataset_name,
    COUNT(*) as record_count,
    COALESCE(SUM(ld.opening_balance), 0) as total_value,
    COALESCE(AVG(ld.interest_rate), 0) as avg_interest_rate,
    COUNT(CASE WHEN COALESCE(ld.pd, 0) > 0.10 THEN 1 END) as high_risk_count,
    MIN(ld.created_at) as created_at
  FROM loan_data ld
  WHERE ld.dataset_name IS NOT NULL 
    AND ld.dataset_name != ''
    AND ld.user_id = auth.uid()
  GROUP BY ld.dataset_name
  ORDER BY MIN(ld.created_at) DESC;
$function$;

CREATE OR REPLACE FUNCTION public.handle_dataset_share()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  owner_email TEXT;
  request_id BIGINT;
BEGIN
  SELECT email INTO owner_email
  FROM auth.users 
  WHERE id = NEW.owner_id;
  
  SELECT net.http_post(
    url := 'https://oaormiiytqivgahmtxfj.supabase.co/functions/v1/send-share-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hb3JtaWl5dHFpdmdhaG10eGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODc0NTMsImV4cCI6MjA2NjI2MzQ1M30.XKAPReT-dl0858PkmUktOM0T8_ERwYH8O9ndWc_IVes'
    ),
    body := jsonb_build_object(
      'dataset_name', NEW.dataset_name,
      'owner_email', owner_email,
      'shared_with_email', NEW.shared_with_email
    )
  ) INTO request_id;
  
  RAISE NOTICE 'Email notification request sent with ID: %', request_id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Failed to send email notification: %', SQLERRM;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_datasets_distinct(input_user_id uuid)
RETURNS TABLE(dataset_name text, user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT DISTINCT 
    ld.dataset_name,
    ld.user_id
  FROM loan_data ld
  WHERE ld.user_id = input_user_id
    AND ld.dataset_name IS NOT NULL
    AND ld.dataset_name != ''
  ORDER BY ld.dataset_name;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_unique_datasets(input_user_id uuid)
RETURNS TABLE(dataset_name text, user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    ld.dataset_name,
    ld.user_id
  FROM loan_data ld
  WHERE ld.user_id = input_user_id
    AND ld.dataset_name IS NOT NULL
    AND ld.dataset_name != ''
  GROUP BY ld.dataset_name, ld.user_id
  ORDER BY ld.dataset_name;
$function$;

CREATE OR REPLACE FUNCTION public.get_portfolio_summary(
  dataset_name_param text, 
  min_loan_amount numeric DEFAULT NULL, 
  max_loan_amount numeric DEFAULT NULL, 
  min_interest_rate numeric DEFAULT NULL, 
  max_interest_rate numeric DEFAULT NULL, 
  min_remaining_term numeric DEFAULT NULL, 
  max_remaining_term numeric DEFAULT NULL, 
  min_pd numeric DEFAULT NULL, 
  max_pd numeric DEFAULT NULL, 
  min_lgd numeric DEFAULT NULL, 
  max_lgd numeric DEFAULT NULL
)
RETURNS TABLE(total_value numeric, avg_interest_rate numeric, high_risk_loans bigint, total_records bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    COALESCE(SUM(ld.opening_balance), 0) as total_value,
    COALESCE(AVG(ld.interest_rate), 0) as avg_interest_rate,
    COUNT(CASE WHEN COALESCE(ld.pd, 0) > 0.10 THEN 1 END) as high_risk_loans,
    COUNT(*) as total_records
  FROM loan_data ld
  WHERE ld.dataset_name = dataset_name_param
    AND ld.user_id = auth.uid()
    AND (min_loan_amount IS NULL OR ld.loan_amount >= min_loan_amount)
    AND (max_loan_amount IS NULL OR ld.loan_amount <= max_loan_amount)
    AND (min_interest_rate IS NULL OR ld.interest_rate >= min_interest_rate)
    AND (max_interest_rate IS NULL OR ld.interest_rate <= max_interest_rate)
    AND (min_remaining_term IS NULL OR CAST(ld.remaining_term AS numeric) >= min_remaining_term)
    AND (max_remaining_term IS NULL OR CAST(ld.remaining_term AS numeric) <= max_remaining_term)
    AND (min_pd IS NULL OR COALESCE(ld.pd, 0) >= min_pd)
    AND (max_pd IS NULL OR COALESCE(ld.pd, 0) <= max_pd)
    AND (min_lgd IS NULL OR COALESCE(ld.lgd, 0) >= min_lgd)
    AND (max_lgd IS NULL OR COALESCE(ld.lgd, 0) <= max_lgd);
$function$;

CREATE OR REPLACE FUNCTION public.get_maturity_distribution(
  dataset_name_param text,
  min_loan_amount numeric DEFAULT NULL,
  max_loan_amount numeric DEFAULT NULL,
  min_interest_rate numeric DEFAULT NULL,
  max_interest_rate numeric DEFAULT NULL,
  min_remaining_term numeric DEFAULT NULL,
  max_remaining_term numeric DEFAULT NULL,
  min_pd numeric DEFAULT NULL,
  max_pd numeric DEFAULT NULL,
  min_lgd numeric DEFAULT NULL,
  max_lgd numeric DEFAULT NULL
)
RETURNS TABLE(range_name text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  WITH filtered_data AS (
    SELECT term
    FROM loan_data ld
    WHERE ld.dataset_name = dataset_name_param
      AND ld.user_id = auth.uid()
      AND (min_loan_amount IS NULL OR ld.loan_amount >= min_loan_amount)
      AND (max_loan_amount IS NULL OR ld.loan_amount <= max_loan_amount)
      AND (min_interest_rate IS NULL OR ld.interest_rate >= min_interest_rate)
      AND (max_interest_rate IS NULL OR ld.interest_rate <= max_interest_rate)
      AND (min_remaining_term IS NULL OR ld.remaining_term >= min_remaining_term)
      AND (max_remaining_term IS NULL OR ld.remaining_term <= max_remaining_term)
      AND (min_pd IS NULL OR COALESCE(ld.pd, 0) >= min_pd)
      AND (max_pd IS NULL OR COALESCE(ld.pd, 0) <= max_pd)
      AND (min_lgd IS NULL OR COALESCE(ld.lgd, 0) >= min_lgd)
      AND (max_lgd IS NULL OR COALESCE(ld.lgd, 0) <= max_lgd)
  ),
  buckets AS (
    SELECT 'Up to 36 months' as range_name, 0 as min_val, 36 as max_val
    UNION ALL
    SELECT '37-60 months', 37, 60
    UNION ALL  
    SELECT '61-84 months', 61, 84
    UNION ALL
    SELECT 'More than 84 months', 85, 1000
  )
  SELECT 
    b.range_name,
    COUNT(fd.term) as count
  FROM buckets b
  LEFT JOIN filtered_data fd ON fd.term >= b.min_val AND fd.term <= b.max_val
  GROUP BY b.range_name, b.min_val
  ORDER BY b.min_val;
$function$;

CREATE OR REPLACE FUNCTION public.get_loan_size_distribution(
  dataset_name_param text,
  min_loan_amount numeric DEFAULT NULL,
  max_loan_amount numeric DEFAULT NULL,
  min_interest_rate numeric DEFAULT NULL,
  max_interest_rate numeric DEFAULT NULL,
  min_remaining_term numeric DEFAULT NULL,
  max_remaining_term numeric DEFAULT NULL,
  min_pd numeric DEFAULT NULL,
  max_pd numeric DEFAULT NULL,
  min_lgd numeric DEFAULT NULL,
  max_lgd numeric DEFAULT NULL
)
RETURNS TABLE(range_name text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  WITH filtered_data AS (
    SELECT opening_balance
    FROM loan_data ld
    WHERE ld.dataset_name = dataset_name_param
      AND ld.user_id = auth.uid()
      AND (min_loan_amount IS NULL OR ld.loan_amount >= min_loan_amount)
      AND (max_loan_amount IS NULL OR ld.loan_amount <= max_loan_amount)
      AND (min_interest_rate IS NULL OR ld.interest_rate >= min_interest_rate)
      AND (max_interest_rate IS NULL OR ld.interest_rate <= max_interest_rate)
      AND (min_remaining_term IS NULL OR ld.remaining_term >= min_remaining_term)
      AND (max_remaining_term IS NULL OR ld.remaining_term <= max_remaining_term)
      AND (min_pd IS NULL OR COALESCE(ld.pd, 0) >= min_pd)
      AND (max_pd IS NULL OR COALESCE(ld.pd, 0) <= max_pd)
      AND (min_lgd IS NULL OR COALESCE(ld.lgd, 0) >= min_lgd)
      AND (max_lgd IS NULL OR COALESCE(ld.lgd, 0) <= max_lgd)
  ),
  buckets AS (
    SELECT 'Up to €10k' as range_name, 0 as min_val, 10000 as max_val
    UNION ALL
    SELECT '€10k-€25k', 10000, 25000
    UNION ALL  
    SELECT '€25k-€50k', 25000, 50000
    UNION ALL
    SELECT '€50k-€100k', 50000, 100000
    UNION ALL
    SELECT 'More than €100k', 100000, 99999999999
  )
  SELECT 
    b.range_name,
    COUNT(fd.opening_balance) as count
  FROM buckets b
  LEFT JOIN filtered_data fd ON fd.opening_balance > b.min_val AND fd.opening_balance <= b.max_val
  GROUP BY b.range_name, b.min_val
  ORDER BY b.min_val;
$function$;

CREATE OR REPLACE FUNCTION public.copy_filtered_dataset(
  p_source_dataset text,
  p_new_dataset text,
  p_user_id uuid,
  p_min_loan_amount numeric DEFAULT NULL,
  p_max_loan_amount numeric DEFAULT NULL,
  p_min_interest_rate numeric DEFAULT NULL,
  p_max_interest_rate numeric DEFAULT NULL,
  p_min_remaining_term numeric DEFAULT NULL,
  p_max_remaining_term numeric DEFAULT NULL,
  p_min_pd numeric DEFAULT NULL,
  p_max_pd numeric DEFAULT NULL,
  p_min_lgd numeric DEFAULT NULL,
  p_max_lgd numeric DEFAULT NULL
)
RETURNS TABLE(records_copied bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  copied_count bigint;
BEGIN
  INSERT INTO loan_data (
    user_id, dataset_name, loan_amount, interest_rate, term, remaining_term,
    lgd, ltv, opening_balance, pd, file_name, worksheet_name
  )
  SELECT 
    user_id, p_new_dataset as dataset_name, loan_amount, interest_rate, term, remaining_term,
    lgd, ltv, opening_balance, pd, file_name, worksheet_name
  FROM loan_data 
  WHERE user_id = p_user_id 
    AND dataset_name = p_source_dataset
    AND (p_min_loan_amount IS NULL OR loan_amount >= p_min_loan_amount)
    AND (p_max_loan_amount IS NULL OR loan_amount <= p_max_loan_amount)
    AND (p_min_interest_rate IS NULL OR interest_rate >= p_min_interest_rate)
    AND (p_max_interest_rate IS NULL OR interest_rate <= p_max_interest_rate)
    AND (p_min_remaining_term IS NULL OR remaining_term >= p_min_remaining_term)
    AND (p_max_remaining_term IS NULL OR remaining_term <= p_max_remaining_term)
    AND (p_min_pd IS NULL OR COALESCE(pd, 0) >= p_min_pd)
    AND (p_max_pd IS NULL OR COALESCE(pd, 0) <= p_max_pd)
    AND (p_min_lgd IS NULL OR COALESCE(lgd, 0) >= p_min_lgd)
    AND (p_max_lgd IS NULL OR COALESCE(lgd, 0) <= p_max_lgd);

  GET DIAGNOSTICS copied_count = ROW_COUNT;
  
  RETURN QUERY SELECT copied_count;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;