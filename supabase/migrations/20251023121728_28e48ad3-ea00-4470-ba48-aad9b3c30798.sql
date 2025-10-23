-- Add compliance_status field to offer_responses table to track issuer compliance progress
ALTER TABLE offer_responses
ADD COLUMN compliance_status jsonb DEFAULT '{"kyc": false, "aml": false, "creditCommittee": false, "legalReview": false}'::jsonb;