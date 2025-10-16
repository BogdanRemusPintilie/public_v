-- Migrate all users from auth.users to profiles and user_roles
-- This handles users who were created before the trigger was set up

-- First, add missing users to profiles
INSERT INTO profiles (user_id, email, full_name, created_at, updated_at)
SELECT 
  au.id as user_id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
  au.created_at,
  now() as updated_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.user_id = au.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Then, add missing users to user_roles
INSERT INTO user_roles (user_id, role, user_type, created_at, updated_at)
SELECT 
  au.id as user_id,
  'viewer'::app_role as role,
  'investor'::app_user_type as user_type,
  au.created_at,
  now() as updated_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = au.id
)
ON CONFLICT (user_id) DO NOTHING;

-- Ensure admins are set correctly
UPDATE user_roles 
SET role = 'admin', updated_at = now()
WHERE user_id IN (
  SELECT user_id FROM profiles 
  WHERE email IN ('justyntrenner@riskblocs.com', 'rosscooper@riskblocs.com')
);