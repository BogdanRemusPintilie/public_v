-- Add columns to offer_responses table for indicative price and comments
ALTER TABLE offer_responses
ADD COLUMN IF NOT EXISTS indicative_price numeric,
ADD COLUMN IF NOT EXISTS comments text;