
-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert own loan data" ON public.loan_data;
DROP POLICY IF EXISTS "Users can view own loan data" ON public.loan_data;
DROP POLICY IF EXISTS "Users can update own loan data" ON public.loan_data;
DROP POLICY IF EXISTS "Users can delete own loan data" ON public.loan_data;

-- Recreate policies with proper authentication checks
CREATE POLICY "Users can insert own loan data" ON public.loan_data
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND auth.uid() = user_id
);

CREATE POLICY "Users can view own loan data" ON public.loan_data
FOR SELECT USING (
  auth.uid() IS NOT NULL AND auth.uid() = user_id
);

CREATE POLICY "Users can update own loan data" ON public.loan_data
FOR UPDATE USING (
  auth.uid() IS NOT NULL AND auth.uid() = user_id
);

CREATE POLICY "Users can delete own loan data" ON public.loan_data
FOR DELETE USING (
  auth.uid() IS NOT NULL AND auth.uid() = user_id
);
