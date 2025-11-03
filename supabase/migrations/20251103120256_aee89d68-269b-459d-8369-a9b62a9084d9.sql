-- Add GIN index for array contains on offers.shared_with_emails
CREATE INDEX IF NOT EXISTS idx_offers_shared_emails_gin ON public.offers USING GIN (shared_with_emails);

-- Add composite index to speed status + recency ordering
CREATE INDEX IF NOT EXISTS idx_offers_status_created_at ON public.offers (status, created_at DESC);

-- Add composite indexes for response and NDA lookups
CREATE INDEX IF NOT EXISTS idx_offer_responses_investor_offer ON public.offer_responses (investor_id, offer_id);
CREATE INDEX IF NOT EXISTS idx_ndas_investor_offer ON public.ndas (investor_id, offer_id);