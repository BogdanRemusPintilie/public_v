-- Delete any demo offer responses that might exist
DELETE FROM offer_responses 
WHERE offer_id::text = 'demo-offer' OR NOT EXISTS (
  SELECT 1 FROM offers WHERE offers.id = offer_responses.offer_id
);