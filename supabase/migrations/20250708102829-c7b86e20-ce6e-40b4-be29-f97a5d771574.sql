
-- Create a table for storing tranche structures
CREATE TABLE public.tranche_structures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  structure_name TEXT NOT NULL,
  dataset_name TEXT NOT NULL,
  tranches JSONB NOT NULL,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  weighted_avg_cost_bps NUMERIC NOT NULL DEFAULT 0,
  cost_percentage NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.tranche_structures ENABLE ROW LEVEL SECURITY;

-- Create policies for tranche structures
CREATE POLICY "Users can view their own tranche structures" 
  ON public.tranche_structures 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tranche structures" 
  ON public.tranche_structures 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tranche structures" 
  ON public.tranche_structures 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tranche structures" 
  ON public.tranche_structures 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create an index for better query performance
CREATE INDEX idx_tranche_structures_user_id ON public.tranche_structures(user_id);
CREATE INDEX idx_tranche_structures_dataset_name ON public.tranche_structures(dataset_name);
