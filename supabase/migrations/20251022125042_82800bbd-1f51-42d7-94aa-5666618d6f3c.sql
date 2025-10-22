-- Allow users to view loan data that has been shared with them
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own loan data" ON loan_data;

-- Create a new policy that allows viewing own data OR shared data
CREATE POLICY "Users can view own or shared loan data" 
ON loan_data 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL) AND (
    -- User owns the data
    (auth.uid() = user_id) OR
    -- Data has been shared with the user (via email or user_id)
    EXISTS (
      SELECT 1 FROM dataset_shares
      WHERE dataset_shares.dataset_name = loan_data.dataset_name
        AND (
          dataset_shares.shared_with_user_id = auth.uid() OR
          dataset_shares.shared_with_email = auth.email()
        )
    )
  )
);