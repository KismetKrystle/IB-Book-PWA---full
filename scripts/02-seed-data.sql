-- Insert default purchase links
INSERT INTO purchase_links (name, slug, price, description, is_default, active) VALUES
('The Infinite Bloom', 'the-infinite-bloom', 19.99, 'Experience a transformative journey through poetry that evolves your perspective on life, love, and consciousness.', true, true),
('Holiday Special', 'holiday-special', 14.99, 'Limited time holiday offer - Experience transformative poetry at a special price.', false, true),
('Student Discount', 'student-discount', 12.99, 'Special pricing for students - Transform your perspective with poetry.', false, true)
ON CONFLICT (slug) DO NOTHING;

-- Insert demo access codes
INSERT INTO access_codes (code, type, notes, customer_email) VALUES
('DEMO123', 'promotional', 'Demo code for testing', 'demo@example.com'),
('PROMO2024', 'promotional', 'Promotional giveaway code', 'promo@example.com'),
('TEST456', 'promotional', 'Test code for development', 'test@example.com')
ON CONFLICT (code) DO NOTHING;

-- Insert some sample analytics data
INSERT INTO analytics (event_type, metadata) VALUES
('app_visit', '{"source": "direct", "device": "desktop"}'),
('purchase_link_click', '{"link_slug": "the-infinite-bloom"}'),
('access_code_used', '{"code": "DEMO123"}')
ON CONFLICT DO NOTHING;
