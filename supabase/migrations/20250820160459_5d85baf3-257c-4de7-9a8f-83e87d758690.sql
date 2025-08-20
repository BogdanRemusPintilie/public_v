-- Create investors table for SRT market participants
CREATE TABLE public.investors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  investor TEXT NOT NULL,
  overview TEXT,
  contact_name TEXT,
  contact_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL DEFAULT auth.uid()
);

-- Enable Row Level Security
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all investors" 
ON public.investors 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create investors" 
ON public.investors 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investors" 
ON public.investors 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investors" 
ON public.investors 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_investors_updated_at
BEFORE UPDATE ON public.investors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_investors_user_id ON public.investors(user_id);
CREATE INDEX idx_investors_contact_email ON public.investors(contact_email);
CREATE INDEX idx_investors_investor_name ON public.investors(investor);