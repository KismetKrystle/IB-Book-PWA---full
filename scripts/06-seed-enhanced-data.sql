-- Insert enhanced purchase links
INSERT INTO purchase_links (
  name, slug, price, description, is_default, active,
  stripe_enabled, paypal_enabled, wise_enabled
) VALUES
(
  'The Infinite Bloom', 
  'the-infinite-bloom', 
  19.99, 
  'Experience a transformative journey through poetry that evolves your perspective on life, love, and consciousness.', 
  true, 
  true,
  true, true, true
),
(
  'Holiday Special', 
  'holiday-special', 
  14.99, 
  'Limited time holiday offer - Experience transformative poetry at a special price.', 
  false, 
  true,
  true, true, false
),
(
  'Student Discount', 
  'student-discount', 
  12.99, 
  'Special pricing for students - Transform your perspective with poetry.', 
  false, 
  true,
  true, false, true
)
ON CONFLICT (slug) DO UPDATE SET
  price = EXCLUDED.price,
  description = EXCLUDED.description,
  stripe_enabled = EXCLUDED.stripe_enabled,
  paypal_enabled = EXCLUDED.paypal_enabled,
  wise_enabled = EXCLUDED.wise_enabled;

-- Insert demo promotional access codes
INSERT INTO access_codes (
  code, type, notes, max_uses, created_by
) VALUES
('DEMO123', 'promotional', 'Demo code for testing', 3, 'admin'),
('PROMO2024', 'promotional', 'Promotional giveaway code', 5, 'admin'),
('TEST456', 'promotional', 'Test code for development', 3, 'admin')
ON CONFLICT (code) DO NOTHING;

-- Insert sample purchase access codes (simulated past purchases)
DO $$
DECLARE
  link_id UUID;
BEGIN
  -- Get the main purchase link ID
  SELECT id INTO link_id FROM purchase_links WHERE slug = 'the-infinite-bloom';
  
  -- Insert sample purchase codes
  INSERT INTO access_codes (
    code, customer_name, customer_email, payment_processor, 
    transaction_id, amount_paid, payment_date, purchase_link_id, type
  ) VALUES
  (
    'ABC123XY', 'John Smith', 'john@example.com', 'stripe',
    'pi_1234567890', 19.99, NOW() - INTERVAL '5 days', link_id, 'purchase'
  ),
  (
    'DEF456ZW', 'Sarah Johnson', 'sarah@example.com', 'paypal',
    'PAYID-M123456', 19.99, NOW() - INTERVAL '3 days', link_id, 'purchase'
  ),
  (
    'GHI789UV', 'Mike Chen', 'mike@example.com', 'wise',
    'wise_transfer_123', 19.99, NOW() - INTERVAL '1 day', link_id, 'purchase'
  );
  
  -- Update purchase link stats
  UPDATE purchase_links 
  SET purchases = 3, revenue = 59.97 
  WHERE id = link_id;
END $$;

-- Insert sample analytics data
DO $$
DECLARE
  link_id UUID;
  code_id UUID;
BEGIN
  SELECT id INTO link_id FROM purchase_links WHERE slug = 'the-infinite-bloom';
  SELECT id INTO code_id FROM access_codes WHERE code = 'ABC123XY';
  
  -- Insert sample click events
  INSERT INTO analytics (
    event_type, purchase_link_id, country, device_type, browser, os
  ) VALUES
  ('link_click', link_id, 'United States', 'desktop', 'Chrome', 'Windows'),
  ('link_click', link_id, 'Canada', 'mobile', 'Safari', 'iOS'),
  ('link_click', link_id, 'United Kingdom', 'tablet', 'Firefox', 'Android'),
  ('link_click', link_id, 'Australia', 'desktop', 'Edge', 'Windows'),
  ('link_click', link_id, 'Germany', 'mobile', 'Chrome', 'Android');
  
  -- Insert sample purchase events
  INSERT INTO analytics (
    event_type, purchase_link_id, access_code_id, user_email, user_name,
    payment_processor, transaction_id, amount, currency, country, device_type
  ) VALUES
  (
    'purchase_completed', link_id, code_id, 'john@example.com', 'John Smith',
    'stripe', 'pi_1234567890', 19.99, 'USD', 'United States', 'desktop'
  );
END $$;
