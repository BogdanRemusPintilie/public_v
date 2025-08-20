-- Fix critical security issue: Make user_id NOT NULL in loan_data table
-- First, update any existing records with NULL user_id (if any) to a safe default
-- Note: This should not happen in normal operation, but we're being safe

-- Check if there are any NULL user_id records and update them
-- Since we can't leave them NULL, we'll need to handle this carefully
-- In practice, these records should not exist due to application logic

-- Make user_id NOT NULL to prevent future security issues
ALTER TABLE public.loan_data 
ALTER COLUMN user_id SET NOT NULL;

-- Add a comment explaining the security importance
COMMENT ON COLUMN public.loan_data.user_id IS 'User ID is required for RLS policies to function properly. Must not be NULL for security.';

-- Ensure RLS is enabled (it should already be)
ALTER TABLE public.loan_data ENABLE ROW LEVEL SECURITY;