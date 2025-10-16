-- Step 1: Create Role Enum (if not exists)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create User Type Enum
CREATE TYPE public.app_user_type AS ENUM ('investor', 'issuer');

-- Step 3: Create user_roles Table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'viewer',
  user_type app_user_type NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE (user_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create Security Definer Functions
CREATE OR REPLACE FUNCTION public.has_user_type(_user_id uuid, _type app_user_type)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND user_type = _type
  )
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_type(_user_id uuid)
RETURNS app_user_type
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_type
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Step 5: Create RLS Policies for user_roles Table
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Step 6: Update handle_new_user Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  
  -- Insert into user_roles with default values
  INSERT INTO public.user_roles (user_id, role, user_type)
  VALUES (
    NEW.id,
    'viewer'::app_role,
    COALESCE(
      (NEW.raw_user_meta_data ->> 'user_type')::app_user_type,
      'investor'::app_user_type
    )
  );
  
  RETURN NEW;
END;
$$;

-- Step 7: Migrate existing users to user_roles table
-- Convert user_role enum to app_role enum based on text value
INSERT INTO public.user_roles (user_id, role, user_type)
SELECT 
  user_id,
  CASE 
    WHEN role::text = 'admin' THEN 'admin'::app_role
    WHEN role::text = 'moderator' THEN 'moderator'::app_role
    ELSE 'viewer'::app_role
  END as role,
  'investor'::app_user_type as user_type
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- Step 8: Create trigger for updated_at
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();