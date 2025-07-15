-- Fix access_codes table to match the API expectations
ALTER TABLE access_codes 
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS payment_processor TEXT,
ADD COLUMN IF NOT EXISTS transaction_id TEXT,
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP;

-- Update existing records to have proper structure
UPDATE access_codes 
SET currency = 'USD' 
WHERE currency IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_access_codes_customer_email ON access_codes(customer_email);
CREATE INDEX IF NOT EXISTS idx_access_codes_transaction_id ON access_codes(transaction_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_payment_processor ON access_codes(payment_processor);
