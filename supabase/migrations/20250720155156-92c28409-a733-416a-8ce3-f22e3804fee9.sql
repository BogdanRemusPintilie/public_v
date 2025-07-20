-- Create investor reports table
CREATE TABLE public.investor_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  deal_name TEXT NOT NULL,
  issuer TEXT,
  asset_class TEXT,
  jurisdiction TEXT,
  report_type TEXT,
  period_start DATE,
  period_end DATE,
  publish_date DATE,
  currency TEXT DEFAULT 'EUR',
  sustainability_labelled BOOLEAN DEFAULT false,
  sts_compliant BOOLEAN DEFAULT false,
  notes TEXT,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  file_path TEXT NOT NULL,
  file_sha256 TEXT,
  extracted_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investor_reports ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own reports" 
ON public.investor_reports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reports" 
ON public.investor_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" 
ON public.investor_reports 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports" 
ON public.investor_reports 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage bucket for investor report files
INSERT INTO storage.buckets (id, name, public) VALUES ('investor-reports', 'investor-reports', false);

-- Create storage policies
CREATE POLICY "Users can view their own report files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'investor-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own report files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'investor-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own report files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'investor-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own report files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'investor-reports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_investor_reports_updated_at
BEFORE UPDATE ON public.investor_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();