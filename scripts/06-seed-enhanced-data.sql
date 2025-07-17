-- Seed initial data for access_codes
INSERT INTO access_codes (code, usage_limit, expires_at, is_active, type, notes, created_by)
VALUES
    ('DEMO123', 3, NULL, TRUE, 'promotional', 'Demo code for testing', 'admin'),
    ('PROMO2024', 5, '2024-12-31 23:59:59+00', TRUE, 'promotional', 'Promotional giveaway code', 'admin'),
    ('TEST456', 10, NULL, TRUE, 'promotional', 'Test code for development', 'admin'),
    ('EXPIRED789', 1, '2023-01-01 00:00:00+00', TRUE, 'promotional', 'Expired demo code', 'admin'),
    ('INACTIVE000', 5, NULL, FALSE, 'promotional', 'Inactive demo code', 'admin'),
    ('MANUAL001', 2, NULL, TRUE, 'manual', 'Manually created code for a specific user', 'admin');

-- Seed initial data for purchase_links
INSERT INTO purchase_links (name, slug, price, currency, description, is_active, stripe_enabled, paypal_enabled, wise_enabled, is_default)
VALUES
    ('The Infinite Bloom - Standard', 'infinite-bloom-standard', 19.99, 'USD', 'Standard access to The Infinite Bloom.', TRUE, TRUE, TRUE, FALSE, TRUE),
    ('The Infinite Bloom - Premium', 'infinite-bloom-premium', 29.99, 'USD', 'Premium access with bonus content.', TRUE, TRUE, TRUE, TRUE, FALSE),
    ('Free Preview Access', 'free-preview', 0.00, 'USD', 'Complimentary preview of The Infinite Bloom.', TRUE, FALSE, FALSE, FALSE, FALSE);

-- Link some access codes to purchase links (example: a code given after a purchase)
-- First, get the IDs of the purchase links
DO $$
DECLARE
    standard_link_id UUID;
    premium_link_id UUID;
    free_preview_link_id UUID;
BEGIN
    SELECT id INTO standard_link_id FROM purchase_links WHERE slug = 'infinite-bloom-standard';
    SELECT id INTO premium_link_id FROM purchase_links WHERE slug = 'infinite-bloom-premium';
    SELECT id INTO free_preview_link_id FROM purchase_links WHERE slug = 'free-preview';

    -- Insert a purchase-related access code
    INSERT INTO access_codes (code, usage_limit, current_usage, is_active, purchase_link_id, customer_name, customer_email, transaction_id, amount_paid, currency, payment_processor, purchase_date, type, created_by)
    VALUES
        ('PURCHASEABC', 1, 0, TRUE, standard_link_id, 'Alice Smith', 'alice@example.com', 'txn_12345', 19.99, 'USD', 'Stripe', NOW() - INTERVAL '5 days', 'purchase', 'system'),
        ('PURCHASEXYZ', 1, 0, TRUE, premium_link_id, 'Bob Johnson', 'bob@example.com', 'txn_67890', 29.99, 'USD', 'PayPal', NOW() - INTERVAL '2 days', 'purchase', 'system'),
        ('FREEACCESS1', 1, 0, TRUE, free_preview_link_id, 'Charlie Brown', 'charlie@example.com', 'free_001', 0.00, 'USD', 'Free Access', NOW() - INTERVAL '1 day', 'purchase', 'system');

    -- Update usage for a demo code
    UPDATE access_codes SET current_usage = 1 WHERE code = 'DEMO123';

    -- Insert some analytics data
    INSERT INTO analytics (event_type, purchase_link_id, metadata, created_at)
    VALUES
        ('link_click', standard_link_id, '{"country": "US", "device_type": "desktop", "browser": "Chrome"}', NOW() - INTERVAL '6 days'),
        ('link_click', standard_link_id, '{"country": "CA", "device_type": "mobile", "browser": "Safari"}', NOW() - INTERVAL '5 days'),
        ('purchase_completed', standard_link_id, '{"amount": 19.99, "currency": "USD", "country": "US"}', NOW() - INTERVAL '5 days'),
        ('link_click', premium_link_id, '{"country": "GB", "device_type": "tablet", "browser": "Firefox"}', NOW() - INTERVAL '3 days'),
        ('purchase_completed', premium_link_id, '{"amount": 29.99, "currency": "USD", "country": "GB"}', NOW() - INTERVAL '2 days'),
        ('link_click', free_preview_link_id, '{"country": "US", "device_type": "desktop", "browser": "Chrome"}', NOW() - INTERVAL '1 day');

    -- Update purchase link stats based on seeded analytics (optional, functions handle this)
    UPDATE purchase_links
    SET
        clicks = (SELECT COUNT(*) FROM analytics WHERE event_type = 'link_click' AND purchase_link_id = purchase_links.id),
        purchases = (SELECT COUNT(*) FROM analytics WHERE event_type = 'purchase_completed' AND purchase_link_id = purchase_links.id),
        revenue = (SELECT COALESCE(SUM((metadata->>'amount')::NUMERIC), 0) FROM analytics WHERE event_type = 'purchase_completed' AND purchase_link_id = purchase_links.id);

END $$;
