-- Add RLS policy to allow users to view offers shared with their email
CREATE POLICY "Users can view offers shared with them"
ON offers
FOR SELECT
USING (
  auth.email() = ANY(shared_with_emails)
);