-- Update access codes table for ABC-123-XYZ format
ALTER TABLE access_codes ALTER COLUMN code TYPE VARCHAR(50);

-- Enhanced tables for comprehensive system
CREATE TABLE IF NOT EXISTS access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  payment_processor VARCHAR(20) CHECK (payment_processor IN ('stripe', 'paypal', 'wise')),
  transaction_id VARCHAR(255),
  amount_paid DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  payment_date TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER DEFAULT 3,
  current_uses INTEGER DEFAULT 0,
  devices JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  type VARCHAR(20) DEFAULT 'promotional' CHECK (type IN ('purchase', 'promotional', 'manual')),
  notes TEXT,
  purchase_link_id UUID REFERENCES purchase_links(id),
  created_by VARCHAR(100) DEFAULT 'system'
);

CREATE TABLE IF NOT EXISTS purchase_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'USD',
  description TEXT,
  stripe_enabled BOOLEAN DEFAULT true,
  paypal_enabled BOOLEAN DEFAULT true,
  wise_enabled BOOLEAN DEFAULT false,
  clicks INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0.00,
  active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  has_expiration BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  preview_enabled BOOLEAN DEFAULT true,
  preview_pages JSONB DEFAULT '[9,10,11,12]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_link_id UUID REFERENCES purchase_links(id),
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),
  payment_processor VARCHAR(20) NOT NULL,
  failure_reason TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMP WITH TIME ZONE,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code_id UUID REFERENCES access_codes(id),
  session_token VARCHAR(255) UNIQUE NOT NULL,
  device_fingerprint VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  purchase_link_id UUID REFERENCES purchase_links(id),
  access_code_id UUID REFERENCES access_codes(id),
  user_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add payment failure tracking
-- CREATE TABLE payment_failures (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   purchase_link_id UUID REFERENCES purchase_links(id),
--   customer_email VARCHAR(255),
--   customer_name VARCHAR(255),
--   payment_processor VARCHAR(20),
--   failure_reason TEXT,
--   amount DECIMAL(10,2),
--   currency VARCHAR(3) DEFAULT 'USD',
--   retry_count INTEGER DEFAULT 0,
--   last_retry_at TIMESTAMP WITH TIME ZONE,
--   resolved BOOLEAN DEFAULT false,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Add preview settings to purchase links
ALTER TABLE purchase_links ADD COLUMN preview_enabled BOOLEAN DEFAULT true;
ALTER TABLE purchase_links ADD COLUMN preview_pages JSONB DEFAULT '[9,10,11,12]'::jsonb;

-- Enhanced access code generation function with ABC-123-XYZ format
CREATE OR REPLACE FUNCTION generate_formatted_access_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check INTEGER;
  part1 TEXT;
  part2 TEXT;
  part3 TEXT;
BEGIN
  LOOP
    -- Generate ABC-123-XYZ format
    part1 := UPPER(CHR(65 + (RANDOM() * 25)::INT) || CHR(65 + (RANDOM() * 25)::INT) || CHR(65 + (RANDOM() * 25)::INT));
    part2 := LPAD((RANDOM() * 999)::INT::TEXT, 3, '0');
    part3 := UPPER(CHR(65 + (RANDOM() * 25)::INT) || CHR(65 + (RANDOM() * 25)::INT) || CHR(65 + (RANDOM() * 25)::INT));
    
    code := part1 || '-' || part2 || '-' || part3;
    
    -- Check if code already exists
    SELECT COUNT(*) INTO exists_check FROM access_codes WHERE access_codes.code = code;
    
    EXIT WHEN exists_check = 0;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to handle payment failures
CREATE OR REPLACE FUNCTION log_payment_failure(
  p_purchase_link_id UUID,
  p_customer_email TEXT,
  p_customer_name TEXT,
  p_payment_processor TEXT,
  p_failure_reason TEXT,
  p_amount DECIMAL,
  p_currency TEXT DEFAULT 'USD'
)
RETURNS UUID AS $$
DECLARE
  failure_id UUID;
BEGIN
  INSERT INTO payment_failures (
    purchase_link_id,
    customer_email,
    customer_name,
    payment_processor,
    failure_reason,
    amount,
    currency
  ) VALUES (
    p_purchase_link_id,
    p_customer_email,
    p_customer_name,
    p_payment_processor,
    p_failure_reason,
    p_amount,
    p_currency
  ) RETURNING id INTO failure_id;
  
  -- Log analytics event
  INSERT INTO analytics_events (
    event_type,
    purchase_link_id,
    access_code_id,
    user_data
  ) VALUES (
    'payment_failed',
    p_purchase_link_id,
    NULL,
    jsonb_build_object('failure_reason', p_failure_reason, 'customer_email', p_customer_email, 'customer_name', p_customer_name, 'payment_processor', p_payment_processor, 'amount', p_amount, 'currency', p_currency)
  );
  
  RETURN failure_id;
END;
$$ LANGUAGE plpgsql;

-- Update the create_purchase_access_code function to use new format
CREATE OR REPLACE FUNCTION create_purchase_access_code(
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_payment_processor TEXT,
  p_transaction_id TEXT,
  p_amount DECIMAL,
  p_currency TEXT DEFAULT 'USD',
  p_purchase_link_id UUID DEFAULT NULL
)
RETURNS TABLE(
  access_code TEXT,
  code_id UUID
) AS $$
DECLARE
  new_code TEXT;
  new_code_id UUID;
BEGIN
  -- Generate unique formatted code
  new_code := generate_formatted_access_code();
  
  -- Insert access code
  INSERT INTO access_codes (
    code,
    customer_name,
    customer_email,
    payment_processor,
    transaction_id,
    amount_paid,
    currency,
    payment_date,
    purchase_link_id,
    type
  ) VALUES (
    new_code,
    p_customer_name,
    p_customer_email,
    p_payment_processor,
    p_transaction_id,
    p_amount,
    p_currency,
    NOW(),
    p_purchase_link_id,
    'purchase'
  ) RETURNING id INTO new_code_id;
  
  -- Update purchase link stats
  IF p_purchase_link_id IS NOT NULL THEN
    UPDATE purchase_links 
    SET 
      purchases = purchases + 1,
      revenue = revenue + p_amount,
      updated_at = NOW()
    WHERE id = p_purchase_link_id;
  END IF;
  
  -- Log analytics event
  INSERT INTO analytics_events (
    event_type,
    purchase_link_id,
    access_code_id,
    user_data
  ) VALUES (
    'purchase_completed',
    p_purchase_link_id,
    new_code_id,
    jsonb_build_object('customer_email', p_customer_email, 'customer_name', p_customer_name, 'payment_processor', p_payment_processor, 'transaction_id', p_transaction_id, 'amount', p_amount, 'currency', p_currency)
  );
  
  RETURN QUERY SELECT new_code, new_code_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_payment_failures_email ON payment_failures(customer_email);
CREATE INDEX IF NOT EXISTS idx_payment_failures_link ON payment_failures(purchase_link_id);
CREATE INDEX IF NOT EXISTS idx_payment_failures_resolved ON payment_failures(resolved);
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_email ON access_codes(customer_email);
CREATE INDEX IF NOT EXISTS idx_access_codes_active ON access_codes(active);
CREATE INDEX IF NOT EXISTS idx_purchase_links_slug ON purchase_links(slug);
CREATE INDEX IF NOT EXISTS idx_purchase_links_active ON purchase_links(active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_device ON user_sessions(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);

-- Enable RLS for new table
ALTER TABLE payment_failures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access on payment_failures" ON payment_failures FOR ALL USING (true);

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_access_codes_updated_at BEFORE UPDATE ON access_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_links_updated_at BEFORE UPDATE ON purchase_links FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
