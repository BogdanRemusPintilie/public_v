-- Allow admins to view all user roles (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' 
    AND policyname = 'Admins can view all user roles'
  ) THEN
    CREATE POLICY "Admins can view all user roles"
    ON user_roles
    FOR SELECT
    USING (
      has_role(auth.uid(), 'admin'::app_role)
    );
  END IF;
END $$;

-- Update the handle_new_user trigger to handle existing user_roles entries
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Insert into user_roles with default values (only if not exists)
  INSERT INTO public.user_roles (user_id, role, user_type)
  VALUES (
    NEW.id,
    'viewer'::app_role,
    COALESCE(
      (NEW.raw_user_meta_data ->> 'user_type')::app_user_type,
      'investor'::app_user_type
    )
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$function$;