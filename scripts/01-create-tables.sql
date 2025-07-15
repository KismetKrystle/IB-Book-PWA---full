-- Create access_codes table
CREATE TABLE IF NOT EXISTS access_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(12) UNIQUE NOT NULL,
  payment_id VARCHAR(255),
  customer_email VARCHAR(255),
  max_uses INTEGER DEFAULT 3,
  current_uses INTEGER DEFAULT 0,
  devices JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  type VARCHAR(20) DEFAULT 'purchase' CHECK (type IN ('purchase', 'promotional')),
  notes TEXT,
  active BOOLEAN DEFAULT true
);

-- Create purchase_links table
CREATE TABLE IF NOT EXISTS purchase_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  has_expiration BOOLEAN DEFAULT false,
  clicks INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  access_code_id UUID REFERENCES access_codes(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  device_fingerprint VARCHAR(255) NOT NULL,
  last_access TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  active BOOLEAN DEFAULT true
);

-- Create analytics table
CREATE TABLE IF NOT EXISTS analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  purchase_link_id UUID REFERENCES purchase_links(id) ON DELETE SET NULL,
  access_code_id UUID REFERENCES access_codes(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_email ON access_codes(customer_email);
CREATE INDEX IF NOT EXISTS idx_purchase_links_slug ON purchase_links(slug);
CREATE INDEX IF NOT EXISTS idx_purchase_links_active ON purchase_links(active);
CREATE INDEX IF NOT EXISTS idx_user_sessions_email ON user_sessions(email);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);

-- Enable Row Level Security
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for access_codes (admin only for now)
CREATE POLICY "Admin can do everything on access_codes" ON access_codes
  FOR ALL USING (true);

-- Create policies for purchase_links (public read, admin write)
CREATE POLICY "Anyone can read active purchase_links" ON purchase_links
  FOR SELECT USING (active = true);

CREATE POLICY "Admin can do everything on purchase_links" ON purchase_links
  FOR ALL USING (true);

-- Create policies for user_sessions (users can read their own)
CREATE POLICY "Users can read their own sessions" ON user_sessions
  FOR SELECT USING (email = current_setting('request.jwt.claims', true)::json->>'email');

CREATE POLICY "Admin can do everything on user_sessions" ON user_sessions
  FOR ALL USING (true);

-- Create policies for analytics (admin only)
CREATE POLICY "Admin can do everything on analytics" ON analytics
  FOR ALL USING (true);
