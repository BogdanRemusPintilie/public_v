-- Insert NDA record with accepted status for Investor Offer Demo
INSERT INTO ndas (
  offer_id,
  investor_id,
  issuer_id,
  nda_title,
  nda_content,
  status
)
SELECT 
  '3bc85752-c339-4bbb-87f9-1aaf3bee20b1'::uuid,
  '81fdbd93-daff-4150-b4d7-9e4cba12279c'::uuid,
  o.user_id,
  'Standard Non-Disclosure Agreement',
  'This is a standard NDA for the offer.',
  'accepted'
FROM offers o
WHERE o.id = '3bc85752-c339-4bbb-87f9-1aaf3bee20b1'
ON CONFLICT DO NOTHING;