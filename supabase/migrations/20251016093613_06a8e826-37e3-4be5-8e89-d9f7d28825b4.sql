-- Create NDAs table
CREATE TABLE public.ndas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  issuer_id UUID NOT NULL,
  investor_id UUID NOT NULL,
  offer_id UUID REFERENCES public.offers(id) ON DELETE CASCADE,
  nda_title TEXT NOT NULL,
  nda_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ndas ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Issuers can create NDAs"
ON public.ndas
FOR INSERT
WITH CHECK (auth.uid() = issuer_id);

CREATE POLICY "Issuers can view their sent NDAs"
ON public.ndas
FOR SELECT
USING (auth.uid() = issuer_id);

CREATE POLICY "Investors can view NDAs sent to them"
ON public.ndas
FOR SELECT
USING (auth.uid() = investor_id);

CREATE POLICY "Investors can update NDAs sent to them"
ON public.ndas
FOR UPDATE
USING (auth.uid() = investor_id);

-- Trigger for updated_at
CREATE TRIGGER update_ndas_updated_at
BEFORE UPDATE ON public.ndas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();