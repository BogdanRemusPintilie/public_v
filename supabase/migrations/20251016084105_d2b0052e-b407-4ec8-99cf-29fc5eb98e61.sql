-- Set justyntrenner@riskblocs.com as admin
UPDATE user_roles 
SET role = 'admin', updated_at = now()
WHERE user_id IN (
  SELECT user_id FROM profiles WHERE email = 'justyntrenner@riskblocs.com'
);