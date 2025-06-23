
-- Create loan_data table for storing uploaded loan portfolio data
CREATE TABLE IF NOT EXISTS loan_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  loan_amount DECIMAL(15,2) NOT NULL,
  interest_rate DECIMAL(5,3) NOT NULL,
  term INTEGER NOT NULL,
  loan_type VARCHAR(50) NOT NULL,
  credit_score INTEGER NOT NULL,
  ltv DECIMAL(5,2) NOT NULL,
  opening_balance DECIMAL(15,2) NOT NULL,
  file_name VARCHAR(255),
  worksheet_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_loan_data_updated_at 
  BEFORE UPDATE ON loan_data 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE loan_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own loan data" ON loan_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loan data" ON loan_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loan data" ON loan_data
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own loan data" ON loan_data
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_loan_data_user_id ON loan_data(user_id);
CREATE INDEX idx_loan_data_created_at ON loan_data(created_at);
CREATE INDEX idx_loan_data_loan_type ON loan_data(loan_type);
