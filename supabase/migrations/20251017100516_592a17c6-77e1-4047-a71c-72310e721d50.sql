-- Add fields to track firm price status and counter offers
ALTER TABLE offer_responses 
ADD COLUMN firm_price_status text DEFAULT 'pending' CHECK (firm_price_status IN ('pending', 'accepted', 'declined', 'countered')),
ADD COLUMN counter_price numeric,
ADD COLUMN counter_price_updated_at timestamp with time zone;