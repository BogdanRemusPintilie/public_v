-- Update compliance_status structure to include detailed tracking
-- Change from simple boolean flags to detailed objects with status, notes, and evidence

COMMENT ON COLUMN offer_responses.compliance_status IS 'JSONB structure: { "kyc": { "status": "pending"|"in_progress"|"completed", "notes": "text", "evidence": ["file_url"] }, "aml": {...}, "creditCommittee": {...}, "legalReview": {...} }';