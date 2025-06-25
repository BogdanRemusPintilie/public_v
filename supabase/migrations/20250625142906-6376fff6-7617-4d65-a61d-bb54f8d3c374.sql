
-- Add dataset_name column to loan_data table
ALTER TABLE loan_data ADD COLUMN dataset_name VARCHAR(255);

-- Create an index for better performance when filtering by dataset name
CREATE INDEX idx_loan_data_dataset_name ON loan_data(dataset_name);
