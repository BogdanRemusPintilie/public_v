
-- Add RLS policies for the loan_data table to allow authenticated users to manage their own data

-- Policy to allow users to view their own loan data
CREATE POLICY "Users can view own loan data" ON loan_data
  FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to insert their own loan data
CREATE POLICY "Users can insert own loan data" ON loan_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own loan data
CREATE POLICY "Users can update own loan data" ON loan_data
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy to allow users to delete their own loan data
CREATE POLICY "Users can delete own loan data" ON loan_data
  FOR DELETE USING (auth.uid() = user_id);
