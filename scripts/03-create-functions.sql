-- Function to generate a random access code
CREATE OR REPLACE FUNCTION generate_access_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INT := 0;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || SUBSTRING(chars, (random() * LENGTH(chars) + 1)::INT, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to increment link clicks and optionally record user data
CREATE OR REPLACE FUNCTION increment_link_clicks(link_slug TEXT, user_data JSONB DEFAULT '{}'::JSONB)
RETURNS VOID AS $$
DECLARE
    link_id UUID;
BEGIN
    SELECT id INTO link_id FROM purchase_links WHERE slug = link_slug;

    IF link_id IS NOT NULL THEN
        UPDATE purchase_links
        SET clicks = clicks + 1
        WHERE id = link_id;

        INSERT INTO analytics (event_type, purchase_link_id, metadata)
        VALUES ('link_click', link_id, user_data);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to increment link purchases and revenue
CREATE OR REPLACE FUNCTION increment_link_purchases_and_revenue(link_id UUID, amount NUMERIC)
RETURNS VOID AS $$
BEGIN
    UPDATE purchase_links
    SET
        purchases = purchases + 1,
        revenue = revenue + amount
    WHERE id = link_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create a purchase access code and record payment transaction
CREATE OR REPLACE FUNCTION create_purchase_access_code(
    p_customer_name TEXT,
    p_customer_email TEXT,
    p_payment_processor TEXT,
    p_transaction_id TEXT,
    p_amount NUMERIC,
    p_currency TEXT,
    p_purchase_link_id UUID
)
RETURNS TABLE(code_id UUID, access_code TEXT) AS $$
DECLARE
    new_access_code_id UUID;
    generated_code TEXT;
BEGIN
    -- Generate a unique access code
    LOOP
        generated_code := generate_access_code();
        SELECT id INTO new_access_code_id FROM access_codes WHERE code = generated_code;
        IF new_access_code_id IS NULL THEN
            EXIT; -- Code is unique, exit loop
        END IF;
    END LOOP;

    -- Insert the new access code
    INSERT INTO access_codes (
        code,
        usage_limit,
        current_usage,
        is_active,
        purchase_link_id,
        customer_name,
        customer_email,
        transaction_id,
        amount_paid,
        currency,
        payment_processor,
        purchase_date,
        type
    )
    VALUES (
        generated_code,
        1, -- Purchased codes typically have a usage limit of 1
        0,
        TRUE,
        p_purchase_link_id,
        p_customer_name,
        p_customer_email,
        p_transaction_id,
        p_amount,
        p_currency,
        p_payment_processor,
        NOW(),
        'purchase'
    )
    RETURNING id INTO new_access_code_id;

    -- Record the payment transaction
    INSERT INTO payment_transactions (
        transaction_id,
        payment_processor,
        status,
        customer_email,
        customer_name,
        amount,
        currency,
        purchase_link_id,
        access_code_id,
        created_at,
        completed_at
    )
    VALUES (
        p_transaction_id,
        p_payment_processor,
        'completed', -- Assuming this function is called on successful payment
        p_customer_email,
        p_customer_name,
        p_amount,
        p_currency,
        p_purchase_link_id,
        new_access_code_id,
        NOW(),
        NOW()
    );

    RETURN QUERY SELECT new_access_code_id, generated_code;
END;
$$ LANGUAGE plpgsql;
