-- Add transaction overview fields to offers table
ALTER TABLE public.offers
ADD COLUMN issuer_nationality TEXT,
ADD COLUMN issuer_overview TEXT,
ADD COLUMN issuer_business_focus TEXT,
ADD COLUMN structure_type TEXT,
ADD COLUMN structure_figures TEXT,
ADD COLUMN structure_synthetic BOOLEAN DEFAULT false,
ADD COLUMN structure_true_sale BOOLEAN DEFAULT false,
ADD COLUMN structure_sts BOOLEAN DEFAULT false,
ADD COLUMN structure_consumer_finance BOOLEAN DEFAULT false,
ADD COLUMN additional_comments TEXT;

-- Add comments to document the new columns
COMMENT ON COLUMN public.offers.issuer_nationality IS 'Nationality of the issuer';
COMMENT ON COLUMN public.offers.issuer_overview IS 'General overview of the issuer';
COMMENT ON COLUMN public.offers.issuer_business_focus IS 'Business focus of the issuer';
COMMENT ON COLUMN public.offers.structure_type IS 'Type of structure (e.g., ABS, MBS, etc.)';
COMMENT ON COLUMN public.offers.structure_figures IS 'Key figures of the structure';
COMMENT ON COLUMN public.offers.structure_synthetic IS 'Whether the structure is synthetic';
COMMENT ON COLUMN public.offers.structure_true_sale IS 'Whether the structure involves true sale';
COMMENT ON COLUMN public.offers.structure_sts IS 'Whether the structure is STS compliant';
COMMENT ON COLUMN public.offers.structure_consumer_finance IS 'Whether the structure involves consumer finance';
COMMENT ON COLUMN public.offers.additional_comments IS 'Additional open-ended comments about the transaction';