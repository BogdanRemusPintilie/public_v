-- Drop the simpler version of get_portfolio_summary that conflicts with the full version
-- Keep the version with optional filter parameters as it's more flexible
DROP FUNCTION IF EXISTS public.get_portfolio_summary(dataset_name_param text);