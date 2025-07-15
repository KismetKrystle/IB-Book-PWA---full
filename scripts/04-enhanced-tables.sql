-- Drop existing tables to recreate with new structure
DROP TABLE IF EXISTS analytics CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS access_codes CASCADE;
DROP TABLE IF EXISTS purchase_links CASCADE;

-- Enhanced access_codes table with customer and payment data
CREATE TABLE access_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(12) UNIQUE NOT NULL,
  
  -- Customer Information
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  
  -- Payment Information
  payment_processor VARCHAR(20) CHECK (payment_processor IN ('stripe', 'paypal', 'wise')),
  transaction_id VARCHAR(255),
  amount_paid DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  payment_date TIMESTAMP WITH TIME ZONE,
  
  -- Access Control
  max_uses INTEGER DEFAULT 3,
  current_uses INTEGER DEFAULT 0,
  devices JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  type VARCHAR(20) DEFAULT 'purchase' CHECK (type IN ('purchase', 'promotional', 'manual')),
  notes TEXT,
  
  -- Purchase Link Reference
  purchase_link_id UUID,
  
  -- Admin fields
  created_by VARCHAR(50) DEFAULT 'system'
);

-- Enhanced purchase_links table
CREATE TABLE purchase_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  description TEXT,
  
  -- Payment Processor Settings
  stripe_enabled BOOLEAN DEFAULT true,
  paypal_enabled BOOLEAN DEFAULT true,
  wise_enabled BOOLEAN DEFAULT true,
  
  -- Tracking
  clicks INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  
  -- Status
  active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Expiration
  has_expiration BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced analytics table for detailed tracking
CREATE TABLE analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  
  -- References
  purchase_link_id UUID REFERENCES purchase_links(id) ON DELETE SET NULL,
  access_code_id UUID REFERENCES access_codes(id) ON DELETE SET NULL,
  
  -- User Data
  user_email VARCHAR(255),
  user_name VARCHAR(255),
  
  -- Geographic Data
  country VARCHAR(100),
  region VARCHAR(100),
  city VARCHAR(100),
  
  -- Device Data
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  
  -- Payment Data
  payment_processor VARCHAR(20),
  transaction_id VARCHAR(255),
  amount DECIMAL(10,2),
  currency VARCHAR(3),
  
  -- Additional Data
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily analytics summary table for performance
CREATE TABLE daily_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  
  -- Purchase Link Stats
  purchase_link_id UUID REFERENCES purchase_links(id) ON DELETE CASCADE,
  
  -- Daily Totals
  clicks INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  
  -- Conversion Metrics
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Geographic Breakdown
  top_countries JSONB DEFAULT '[]'::jsonb,
  
  -- Device Breakdown
  device_breakdown JSONB DEFAULT '{}'::jsonb,
  
  -- Payment Processor Breakdown
  payment_breakdown JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(date, purchase_link_id)
);

-- User sessions for device tracking
CREATE TABLE user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  access_code_id UUID REFERENCES access_codes(id) ON DELETE CASCADE,
  
  -- Session Data
  session_token VARCHAR(255) UNIQUE NOT NULL,
  device_fingerprint VARCHAR(255) NOT NULL,
  
  -- User Data
  email VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  
  -- Geographic Data
  ip_address INET,
  country VARCHAR(100),
  city VARCHAR(100),
  
  -- Device Info
  user_agent TEXT,
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  
  -- Session Management
  last_access TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  active BOOLEAN DEFAULT true
);

-- Payment transactions log
CREATE TABLE payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Transaction Data
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  payment_processor VARCHAR(20) NOT NULL,
  status VARCHAR(50) NOT NULL,
  
  -- Customer Data
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),
  
  -- Amount Data
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- References
  purchase_link_id UUID REFERENCES purchase_links(id),
  access_code_id UUID REFERENCES access_codes(id),
  
  -- Webhook Data
  webhook_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_access_codes_code ON access_codes(code);
CREATE INDEX idx_access_codes_email ON access_codes(customer_email);
CREATE INDEX idx_access_codes_transaction ON access_codes(transaction_id);
CREATE INDEX idx_access_codes_type ON access_codes(type);
CREATE INDEX idx_access_codes_active ON access_codes(active);

CREATE INDEX idx_purchase_links_slug ON purchase_links(slug);
CREATE INDEX idx_purchase_links_active ON purchase_links(active);

CREATE INDEX idx_analytics_event_type ON analytics(event_type);
CREATE INDEX idx_analytics_created_at ON analytics(created_at);
CREATE INDEX idx_analytics_purchase_link ON analytics(purchase_link_id);

CREATE INDEX idx_daily_analytics_date ON daily_analytics(date);
CREATE INDEX idx_daily_analytics_link_date ON daily_analytics(purchase_link_id, date);

CREATE INDEX idx_user_sessions_code ON user_sessions(access_code_id);
CREATE INDEX idx_user_sessions_email ON user_sessions(email);
CREATE INDEX idx_user_sessions_active ON user_sessions(active);

CREATE INDEX idx_payment_transactions_id ON payment_transactions(transaction_id);
CREATE INDEX idx_payment_transactions_email ON payment_transactions(customer_email);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);

-- Enable Row Level Security
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies (admin access for now)
CREATE POLICY "Admin full access on access_codes" ON access_codes FOR ALL USING (true);
CREATE POLICY "Admin full access on purchase_links" ON purchase_links FOR ALL USING (true);
CREATE POLICY "Admin full access on analytics" ON analytics FOR ALL USING (true);
CREATE POLICY "Admin full access on daily_analytics" ON daily_analytics FOR ALL USING (true);
CREATE POLICY "Admin full access on user_sessions" ON user_sessions FOR ALL USING (true);
CREATE POLICY "Admin full access on payment_transactions" ON payment_transactions FOR ALL USING (true);

-- Public read access for active purchase links
CREATE POLICY "Public read active purchase_links" ON purchase_links 
  FOR SELECT USING (active = true);
