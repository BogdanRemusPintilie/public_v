-- Drop the restrictive SELECT policy on investors table
DROP POLICY IF EXISTS "Users can view their own investors" ON investors;

-- Create a new policy that allows all authenticated users to view all investors
CREATE POLICY "All authenticated users can view all investors"
ON investors
FOR SELECT
TO authenticated
USING (true);

-- Keep the other policies restrictive (only own records)
-- INSERT, UPDATE, DELETE policies remain unchanged and already restrict to own records