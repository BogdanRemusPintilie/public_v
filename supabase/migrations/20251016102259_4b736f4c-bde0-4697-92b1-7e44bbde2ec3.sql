-- Create offer_responses table to track investor responses to offers
CREATE TABLE public.offer_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  investor_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('accepted', 'declined')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offer_responses ENABLE ROW LEVEL SECURITY;

-- Investors can view their own responses
CREATE POLICY "Investors can view their own responses"
  ON public.offer_responses
  FOR SELECT
  USING (auth.uid() = investor_id);

-- Investors can create their own responses
CREATE POLICY "Investors can create their own responses"
  ON public.offer_responses
  FOR INSERT
  WITH CHECK (auth.uid() = investor_id);

-- Investors can update their own responses
CREATE POLICY "Investors can update their own responses"
  ON public.offer_responses
  FOR UPDATE
  USING (auth.uid() = investor_id);

-- Offer owners can view responses to their offers
CREATE POLICY "Offer owners can view responses to their offers"
  ON public.offer_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.offers
      WHERE offers.id = offer_responses.offer_id
      AND offers.user_id = auth.uid()
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_offer_responses_updated_at
  BEFORE UPDATE ON public.offer_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_offer_responses_investor_id ON public.offer_responses(investor_id);
CREATE INDEX idx_offer_responses_offer_id ON public.offer_responses(offer_id);