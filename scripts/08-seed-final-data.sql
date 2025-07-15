-- Insert sample purchase links
INSERT INTO purchase_links (name, slug, price, description, preview_enabled, preview_pages) VALUES
('Standard Access', 'standard-access', 29.99, 'Full access to the digital flipbook with all features', true, '[9,10,11,12]'::jsonb),
('Premium Package', 'premium-package', 49.99, 'Premium access with bonus content and extended features', true, '[9,10,11,12]'::jsonb),
('Student Discount', 'student-discount', 19.99, 'Special pricing for students with valid ID', true, '[9,10,11,12]'::jsonb),
('Free Preview Access', 'free-preview', 0.00, 'Claim your free access to preview the content', true, '[9,10,11,12]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample promotional access codes
INSERT INTO access_codes (code, type, max_uses, notes, created_by) VALUES
('DEMO123', 'promotional', 3, 'Demo code for testing', 'admin'),
('PROMO2024', 'promotional', 5, 'Promotional giveaway code', 'admin'),
('TEST456', 'promotional', 3, 'Test code for development', 'admin'),
('HOLIDAY999', 'promotional', 10, 'Holiday special promotional code', 'admin'),
('STUDENT100', 'promotional', 5, 'Student discount code', 'admin'),
('REVIEW200', 'promotional', 3, 'Review bonus code', 'admin'),
('VIP888', 'promotional', 1, 'VIP access code', 'admin')
ON CONFLICT (code) DO NOTHING;

-- Insert sample analytics events
INSERT INTO analytics_events (event_type, user_data) VALUES
('link_click', '{"country": "US", "device_type": "desktop", "browser": "chrome"}'::jsonb),
('link_click', '{"country": "CA", "device_type": "mobile", "browser": "safari"}'::jsonb),
('code_validation', '{"country": "UK", "device_type": "tablet", "browser": "firefox"}'::jsonb),
('purchase_completed', '{"country": "US", "device_type": "desktop", "browser": "chrome", "amount": 29.99}'::jsonb);
