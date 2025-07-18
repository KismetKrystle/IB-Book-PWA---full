-- Function to generate a unique access code
CREATE OR REPLACE FUNCTION generate_access_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate an 8-character alphanumeric code
        new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FOR 8));
        
        -- Check if the code already exists
        SELECT EXISTS (SELECT 1 FROM access_codes WHERE code = new_code) INTO code_exists;
        
        -- If the code does not exist, exit the loop
        IF NOT code_exists THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to increment link clicks and log user data
CREATE OR REPLACE FUNCTION increment_link_clicks(
    link_slug TEXT,
    user_data JSONB DEFAULT '{}'::JSONB
)
RETURNS VOID AS $$
DECLARE
    link_record RECORD;
BEGIN
    -- Find the purchase link by slug
    SELECT id, clicks INTO link_record FROM purchase_links WHERE slug = link_slug;

    IF FOUND THEN
        -- Increment clicks
        UPDATE purchase_links
        SET clicks = clicks + 1, updated_at = NOW()
        WHERE id = link_record.id;

        -- Log the click event with user data
        INSERT INTO link_clicks (
            purchase_link_id,
            country,
            device_type,
            browser,
            os,
            ip_address
        ) VALUES (
            link_record.id,
            user_data->>'country',
            user_data->>'device_type',
            user_data->>'browser',
            user_data->>'os',
            user_data->>'ip_address'
        );
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
        revenue = revenue + amount,
        updated_at = NOW()
    WHERE id = link_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create a purchase access code and link it to a purchase
CREATE OR REPLACE FUNCTION create_purchase_access_code(
    p_customer_name TEXT,
    p_customer_email TEXT,
    p_payment_processor TEXT,
    p_transaction_id TEXT,
    p_amount NUMERIC,
    p_currency TEXT,
    p_purchase_link_id UUID
)
RETURNS TABLE(code_id UUID, generated_code TEXT) AS $$
DECLARE
    v_access_code_id UUID;
    v_generated_code TEXT;
BEGIN
    -- Generate a unique access code
    v_generated_code := generate_access_code();

    -- Insert the new access code
    INSERT INTO access_codes (
        code,
        type,
        customer_name,
        customer_email,
        payment_processor,
        transaction_id,
        amount_paid,
        currency,
        purchase_link_id,
        max_uses,
        current_uses,
        active,
        created_by
    ) VALUES (
        v_generated_code,
        'purchase',
        p_customer_name,
        p_customer_email,
        p_payment_processor,
        p_transaction_id,
        p_amount,
        p_currency,
        p_purchase_link_id,
        1, -- Default max_uses for a purchase code
        0, -- Initial current_uses
        TRUE,
        'system' -- Created by the system (webhook)
    )
    RETURNING id INTO v_access_code_id;

    -- Increment purchases and revenue for the associated purchase link
    UPDATE purchase_links
    SET
        purchases = purchases + 1,
        revenue = revenue + p_amount,
        updated_at = NOW()
    WHERE id = p_purchase_link_id;

    RETURN QUERY SELECT v_access_code_id, v_generated_code;
END;
$$ LANGUAGE plpgsql;

-- Function to log payment failures
CREATE OR REPLACE FUNCTION log_payment_failure(
    p_purchase_link_id UUID,
    p_customer_email TEXT,
    p_customer_name TEXT,
    p_payment_processor TEXT,
    p_failure_reason TEXT,
    p_amount NUMERIC,
    p_currency TEXT
)
RETURNS UUID AS $$
DECLARE
    v_failure_id UUID;
BEGIN
    INSERT INTO payment_failures (
        purchase_link_id,
        customer_email,
        customer_name,
        payment_processor,
        failure_reason,
        amount,
        currency,
        retry_count,
        resolved
    ) VALUES (
        p_purchase_link_id,
        p_customer_email,
        p_customer_name,
        p_payment_processor,
        p_failure_reason,
        p_amount,
        p_currency,
        0,
        FALSE
    )
    RETURNING id INTO v_failure_id;

    RETURN v_failure_id;
END;
$$ LANGUAGE plpgsql;
