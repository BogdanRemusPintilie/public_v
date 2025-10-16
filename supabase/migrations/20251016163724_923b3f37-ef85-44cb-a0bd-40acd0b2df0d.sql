-- Add issuer_response column to offer_responses table
ALTER TABLE offer_responses 
ADD COLUMN issuer_response text;