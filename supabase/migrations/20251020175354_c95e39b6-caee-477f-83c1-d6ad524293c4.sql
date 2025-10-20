-- Add issuer_company to NDAs and populate it securely from profiles

-- 1) Add column
ALTER TABLE public.ndas
ADD COLUMN IF NOT EXISTS issuer_company text;

-- 2) Backfill existing rows from profiles
UPDATE public.ndas n
SET issuer_company = p.company
FROM public.profiles p
WHERE p.user_id = n.issuer_id
  AND (n.issuer_company IS NULL OR n.issuer_company = '');

-- 3) Function to set issuer_company on insert (SECURITY DEFINER to bypass RLS on profiles)
CREATE OR REPLACE FUNCTION public.set_nda_issuer_company()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT company INTO NEW.issuer_company
  FROM public.profiles
  WHERE user_id = NEW.issuer_id;
  RETURN NEW;
END;
$$;

-- 4) Trigger to apply on insert
DROP TRIGGER IF EXISTS trg_set_nda_issuer_company ON public.ndas;
CREATE TRIGGER trg_set_nda_issuer_company
BEFORE INSERT ON public.ndas
FOR EACH ROW
EXECUTE FUNCTION public.set_nda_issuer_company();