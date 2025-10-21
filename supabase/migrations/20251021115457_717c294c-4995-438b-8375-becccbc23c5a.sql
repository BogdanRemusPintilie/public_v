-- Update get_offer_with_issuer_company to include structure_name
-- This allows investors to see the structure name without accessing the full structure data

DROP FUNCTION IF EXISTS public.get_offer_with_issuer_company(uuid);

CREATE OR REPLACE FUNCTION public.get_offer_with_issuer_company(p_offer_id uuid)
RETURNS TABLE(
  id uuid,
  offer_name text,
  is_anonymous boolean,
  user_id uuid,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  structure_id uuid,
  status text,
  issuer_nationality text,
  issuer_overview text,
  issuer_business_focus text,
  structure_synthetic boolean,
  structure_true_sale boolean,
  structure_sts boolean,
  structure_consumer_finance boolean,
  expected_pool_size numeric,
  weighted_average_life numeric,
  additional_comments text,
  shared_with_emails text[],
  target_investors text[],
  structure_sector text,
  issuer_company text,
  structure_name text,
  dataset_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    o.id,
    o.offer_name,
    o.is_anonymous,
    o.user_id,
    o.created_at,
    o.updated_at,
    o.structure_id,
    o.status,
    o.issuer_nationality,
    o.issuer_overview,
    o.issuer_business_focus,
    o.structure_synthetic,
    o.structure_true_sale,
    o.structure_sts,
    o.structure_consumer_finance,
    o.expected_pool_size,
    o.weighted_average_life,
    o.additional_comments,
    o.shared_with_emails,
    o.target_investors,
    o.structure_sector,
    p.company AS issuer_company,
    ts.structure_name,
    ts.dataset_name
  FROM public.offers o
  LEFT JOIN public.profiles p ON p.user_id = o.user_id
  LEFT JOIN public.tranche_structures ts ON ts.id = o.structure_id
  WHERE o.id = p_offer_id
    AND (
      o.user_id = auth.uid() OR
      auth.email() = ANY (o.shared_with_emails)
    );
$function$;