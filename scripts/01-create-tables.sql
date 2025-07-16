-- Create access_codes table
CREATE TABLE IF NOT EXISTS access_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    usage_limit INT, -- NULL for unlimited uses
    current_usage INT DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase_links table
CREATE TABLE IF NOT EXISTS purchase_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link access codes to purchase links (optional, for purchased codes)
ALTER TABLE access_codes
ADD COLUMN purchase_link_id UUID REFERENCES purchase_links(id) ON DELETE SET NULL;

-- Add customer information to access_codes for tracking purchases
ALTER TABLE access_codes
ADD COLUMN customer_name TEXT,
ADD COLUMN customer_email TEXT,
ADD COLUMN transaction_id TEXT,
ADD COLUMN amount_paid NUMERIC(10, 2),
ADD COLUMN payment_processor TEXT,
ADD COLUMN purchase_date TIMESTAMP WITH TIME ZONE;

-- Create table for tracking device fingerprints per access code
CREATE TABLE IF NOT EXISTS access_code_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    access_code_id UUID REFERENCES access_codes(id) ON DELETE CASCADE NOT NULL,
    device_fingerprint TEXT NOT NULL,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (access_code_id, device_fingerprint) -- Ensure a device can only be registered once per code
);

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL, -- e.g., 'page_view', 'audio_play', 'offline_sync'
    event_data JSONB, -- Flexible JSON for event-specific data
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id TEXT, -- Could be session token or device fingerprint
    access_code_id UUID REFERENCES access_codes(id) ON DELETE SET NULL,
    is_offline BOOLEAN DEFAULT FALSE,
    synced_at TIMESTAMP WITH TIME ZONE -- Timestamp when synced to backend
);
