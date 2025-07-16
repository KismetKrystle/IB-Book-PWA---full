-- Update existing purchase_links with new fields
UPDATE purchase_links
SET
    stripe_price_id = 'price_1P9gWwR2e3x4y5z6a7b8c9d0', -- Replace with actual Stripe Price ID
    paypal_link = 'https://paypal.me/infinitebloomstandard',
    wise_link = 'https://wise.com/pay/infinitebloomstandard',
    is_free = FALSE,
    preview_pages = ARRAY[9, 10, 11, 12]
WHERE slug = 'infinite-bloom-standard';

UPDATE purchase_links
SET
    stripe_price_id = 'price_1P9gXAR2e3x4y5z6a7b8c9d1', -- Replace with actual Stripe Price ID
    paypal_link = 'https://paypal.me/infinitebloompremium',
    wise_link = NULL, -- Example: Wise not enabled for premium
    is_free = FALSE,
    preview_pages = ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
WHERE slug = 'infinite-bloom-premium';

UPDATE purchase_links
SET
    stripe_price_id = NULL,
    paypal_link = NULL,
    wise_link = NULL,
    is_free = TRUE,
    preview_pages = ARRAY[1, 2, 3, 4, 5]
WHERE slug = 'free-preview';

-- Add a new purchase link for a "Holiday Special"
INSERT INTO purchase_links (slug, price, currency, description, is_active, stripe_price_id, paypal_link, wise_link, is_free, preview_pages)
VALUES
    ('holiday-special', 14.99, 'USD', 'Limited time holiday offer - Experience transformative poetry at a special price.', TRUE, 'price_1P9gXQR2e3x4y5z6a7b8c9d2', 'https://paypal.me/holidayspecial', NULL, FALSE, ARRAY[1, 2, 9, 10]);

-- Add a new free access link with a specific name and description
INSERT INTO purchase_links (slug, price, currency, description, is_active, is_free, preview_pages)
VALUES
    ('free-sample-access', 0.00, 'USD', 'Complimentary sample access to selected pages.', TRUE, TRUE, ARRAY[1, 2]);

-- Update existing access codes to reflect new purchase_link_id if applicable
-- (This part depends on how you want to map existing codes to new links)
-- For example, if 'DEMO123' is now associated with 'free-sample-access':
DO $$
DECLARE
    free_sample_link_id UUID;
BEGIN
    SELECT id INTO free_sample_link_id FROM purchase_links WHERE slug = 'free-sample-access';
    UPDATE access_codes
    SET purchase_link_id = free_sample_link_id
    WHERE code = 'DEMO123';
