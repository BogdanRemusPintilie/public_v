-- Migrate existing users from profiles to user_roles
-- This ensures all existing users have a user_roles entry
INSERT INTO user_roles (user_id, role, user_type, created_at, updated_at)
SELECT 
  p.user_id,
  'viewer'::app_role as role,
  'investor'::app_user_type as user_type,
  p.created_at,
  now() as updated_at
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = p.user_id
)
ON CONFLICT (user_id) DO NOTHING;

-- Set justyntrenner@riskblocs.com as admin
UPDATE user_roles 
SET role = 'admin', updated_at = now()
WHERE user_id IN (
  SELECT user_id FROM profiles WHERE email = 'justyntrenner@riskblocs.com'
);

-- Set rosscooper@riskblocs.com as admin (when they sign up)
UPDATE user_roles 
SET role = 'admin', updated_at = now()
WHERE user_id IN (
  SELECT user_id FROM profiles WHERE email = 'rosscooper@riskblocs.com'
);