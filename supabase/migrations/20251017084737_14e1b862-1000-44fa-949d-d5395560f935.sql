-- Add columns for investor questions and additional data requirements
ALTER TABLE offer_responses 
ADD COLUMN IF NOT EXISTS questions TEXT,
ADD COLUMN IF NOT EXISTS additional_data_needs TEXT,
ADD COLUMN IF NOT EXISTS requirements_acknowledged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS requirements_acknowledged_at TIMESTAMP WITH TIME ZONE;