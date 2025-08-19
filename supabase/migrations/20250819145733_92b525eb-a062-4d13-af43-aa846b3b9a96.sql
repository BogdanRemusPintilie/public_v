-- Add target_investors column to offers table
ALTER TABLE public.offers ADD COLUMN target_investors text[] DEFAULT '{}'::text[];