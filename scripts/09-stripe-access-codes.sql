-- Create access_codes table for Stripe integration
CREATE TABLE IF NOT EXISTS access_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),
  code VARCHAR(50) NOT NULL UNIQUE,
  amount_paid DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  stripe_session_id VARCHAR(255) UNIQUE,
  used BOOLEAN DEFAULT FALSE,
  email_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_access_codes_email ON access_codes(email);
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_stripe_session ON access_codes(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_created_at ON access_codes(created_at);

-- Create webhook_failures table for monitoring
CREATE TABLE IF NOT EXISTS webhook_failures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  stripe_session_id VARCHAR(255),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_failures table for monitoring
CREATE TABLE IF NOT EXISTS email_failures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  access_code_id UUID REFERENCES access_codes(id),
  customer_email VARCHAR(255) NOT NULL,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for failure tables
CREATE INDEX IF NOT EXISTS idx_webhook_failures_resolved ON webhook_failures(resolved);
CREATE INDEX IF NOT EXISTS idx_email_failures_resolved ON email_failures(resolved);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_access_codes_updated_at BEFORE UPDATE ON access_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_webhook_failures_updated_at BEFORE UPDATE ON webhook_failures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_failures_updated_at BEFORE UPDATE ON email_failures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
