-- Add anonymous field to offers table
ALTER TABLE public.offers
ADD COLUMN is_anonymous boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.offers.is_anonymous IS 'Whether the issuer wishes to remain anonymous in this offer';