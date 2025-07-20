
-- Create ETL jobs table for tracking extraction jobs
CREATE TABLE public.etl_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  needs_ocr BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done', 'failed')),
  warnings JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies for etl_jobs
ALTER TABLE public.etl_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own jobs
CREATE POLICY "Users can view their own ETL jobs" 
  ON public.etl_jobs 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Users can create their own jobs  
CREATE POLICY "Users can create their own ETL jobs" 
  ON public.etl_jobs 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own jobs
CREATE POLICY "Users can update their own ETL jobs" 
  ON public.etl_jobs 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Add indexes for performance
CREATE INDEX idx_etl_jobs_status ON public.etl_jobs(status);
CREATE INDEX idx_etl_jobs_created_at ON public.etl_jobs(created_at DESC);

-- Add artifact tracking columns to investor_reports
ALTER TABLE public.investor_reports 
  ADD COLUMN raw_pdf_id UUID,
  ADD COLUMN extract_json_id UUID,
  ADD COLUMN etl_job_id UUID;

-- Create trigger to update updated_at on etl_jobs
CREATE OR REPLACE FUNCTION update_etl_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_etl_jobs_updated_at
  BEFORE UPDATE ON public.etl_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_etl_jobs_updated_at();
