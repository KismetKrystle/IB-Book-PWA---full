-- Function to generate unique access codes
CREATE OR REPLACE FUNCTION generate_access_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    -- Generate 8-character code with letters and numbers
    code := UPPER(
      SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) || 
      SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)
    );
    
    -- Check if code already exists
    SELECT COUNT(*) INTO exists_check FROM access_codes WHERE access_codes.code = code;
    
    EXIT WHEN exists_check = 0;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to create access code after payment
CREATE OR REPLACE FUNCTION create_purchase_access_code(
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_payment_processor TEXT,
  p_transaction_id TEXT,
  p_amount DECIMAL,
  p_currency TEXT DEFAULT 'USD',
  p_purchase_link_id UUID DEFAULT NULL
)
RETURNS TABLE(
  access_code TEXT,
  code_id UUID
) AS $$
DECLARE
  new_code TEXT;
  new_code_id UUID;
BEGIN
  -- Generate unique code
  new_code := generate_access_code();
  
  -- Insert access code
  INSERT INTO access_codes (
    code,
    customer_name,
    customer_email,
    payment_processor,
    transaction_id,
    amount_paid,
    currency,
    payment_date,
    purchase_link_id,
    type
  ) VALUES (
    new_code,
    p_customer_name,
    p_customer_email,
    p_payment_processor,
    p_transaction_id,
    p_amount,
    p_currency,
    NOW(),
    p_purchase_link_id,
    'purchase'
  ) RETURNING id INTO new_code_id;
  
  -- Update purchase link stats
  IF p_purchase_link_id IS NOT NULL THEN
    UPDATE purchase_links 
    SET 
      purchases = purchases + 1,
      revenue = revenue + p_amount,
      updated_at = NOW()
    WHERE id = p_purchase_link_id;
  END IF;
  
  -- Log analytics event
  INSERT INTO analytics (
    event_type,
    purchase_link_id,
    access_code_id,
    user_email,
    user_name,
    payment_processor,
    transaction_id,
    amount,
    currency
  ) VALUES (
    'purchase_completed',
    p_purchase_link_id,
    new_code_id,
    p_customer_email,
    p_customer_name,
    p_payment_processor,
    p_transaction_id,
    p_amount,
    p_currency
  );
  
  RETURN QUERY SELECT new_code, new_code_id;
END;
$$ LANGUAGE plpgsql;

-- Function to increment purchase link clicks
CREATE OR REPLACE FUNCTION increment_link_clicks(link_slug TEXT, user_data JSONB DEFAULT '{}')
RETURNS void AS $$
DECLARE
  link_id UUID;
BEGIN
  -- Get link ID and increment clicks
  UPDATE purchase_links 
  SET clicks = clicks + 1, updated_at = NOW()
  WHERE slug = link_slug AND active = true
  RETURNING id INTO link_id;
  
  -- Log analytics event
  IF link_id IS NOT NULL THEN
    INSERT INTO analytics (
      event_type,
      purchase_link_id,
      country,
      device_type,
      browser,
      os,
      metadata
    ) VALUES (
      'link_click',
      link_id,
      user_data->>'country',
      user_data->>'device_type',
      user_data->>'browser',
      user_data->>'os',
      user_data
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get advanced analytics
CREATE OR REPLACE FUNCTION get_advanced_analytics(
  days_back INTEGER DEFAULT 30,
  link_id UUID DEFAULT NULL
)
RETURNS TABLE(
  total_clicks BIGINT,
  total_purchases BIGINT,
  total_revenue NUMERIC,
  conversion_rate NUMERIC,
  avg_order_value NUMERIC,
  daily_stats JSONB,
  geographic_stats JSONB,
  device_stats JSONB,
  payment_processor_stats JSONB
) AS $$
DECLARE
  start_date TIMESTAMP := NOW() - INTERVAL '1 day' * days_back;
  daily_data JSONB;
  geo_data JSONB;
  device_data JSONB;
  payment_data JSONB;
BEGIN
  -- Get daily statistics
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', DATE(created_at),
      'clicks', COUNT(*) FILTER (WHERE event_type = 'link_click'),
      'purchases', COUNT(*) FILTER (WHERE event_type = 'purchase_completed'),
      'revenue', COALESCE(SUM(amount) FILTER (WHERE event_type = 'purchase_completed'), 0)
    ) ORDER BY DATE(created_at)
  ) INTO daily_data
  FROM analytics 
  WHERE created_at >= start_date
    AND (link_id IS NULL OR purchase_link_id = link_id)
  GROUP BY DATE(created_at);
  
  -- Get geographic statistics
  SELECT jsonb_agg(
    jsonb_build_object(
      'country', COALESCE(country, 'Unknown'),
      'clicks', COUNT(*) FILTER (WHERE event_type = 'link_click'),
      'purchases', COUNT(*) FILTER (WHERE event_type = 'purchase_completed'),
      'revenue', COALESCE(SUM(amount) FILTER (WHERE event_type = 'purchase_completed'), 0)
    ) ORDER BY COUNT(*) DESC
  ) INTO geo_data
  FROM analytics 
  WHERE created_at >= start_date
    AND (link_id IS NULL OR purchase_link_id = link_id)
  GROUP BY country;
  
  -- Get device statistics
  SELECT jsonb_agg(
    jsonb_build_object(
      'device_type', COALESCE(device_type, 'Unknown'),
      'clicks', COUNT(*) FILTER (WHERE event_type = 'link_click'),
      'purchases', COUNT(*) FILTER (WHERE event_type = 'purchase_completed')
    ) ORDER BY COUNT(*) DESC
  ) INTO device_data
  FROM analytics 
  WHERE created_at >= start_date
    AND (link_id IS NULL OR purchase_link_id = link_id)
  GROUP BY device_type;
  
  -- Get payment processor statistics
  SELECT jsonb_agg(
    jsonb_build_object(
      'processor', COALESCE(payment_processor, 'Unknown'),
      'purchases', COUNT(*),
      'revenue', COALESCE(SUM(amount), 0)
    ) ORDER BY COUNT(*) DESC
  ) INTO payment_data
  FROM analytics 
  WHERE created_at >= start_date
    AND event_type = 'purchase_completed'
    AND (link_id IS NULL OR purchase_link_id = link_id)
  GROUP BY payment_processor;
  
  -- Return aggregated data
  RETURN QUERY
  SELECT 
    COUNT(*) FILTER (WHERE event_type = 'link_click') as total_clicks,
    COUNT(*) FILTER (WHERE event_type = 'purchase_completed') as total_purchases,
    COALESCE(SUM(amount) FILTER (WHERE event_type = 'purchase_completed'), 0) as total_revenue,
    CASE 
      WHEN COUNT(*) FILTER (WHERE event_type = 'link_click') > 0 THEN
        ROUND((COUNT(*) FILTER (WHERE event_type = 'purchase_completed')::NUMERIC / 
               COUNT(*) FILTER (WHERE event_type = 'link_click')::NUMERIC) * 100, 2)
      ELSE 0 
    END as conversion_rate,
    CASE 
      WHEN COUNT(*) FILTER (WHERE event_type = 'purchase_completed') > 0 THEN
        ROUND(SUM(amount) FILTER (WHERE event_type = 'purchase_completed') / 
              COUNT(*) FILTER (WHERE event_type = 'purchase_completed'), 2)
      ELSE 0 
    END as avg_order_value,
    COALESCE(daily_data, '[]'::jsonb) as daily_stats,
    COALESCE(geo_data, '[]'::jsonb) as geographic_stats,
    COALESCE(device_data, '[]'::jsonb) as device_stats,
    COALESCE(payment_data, '[]'::jsonb) as payment_processor_stats
  FROM analytics 
  WHERE created_at >= start_date
    AND (link_id IS NULL OR purchase_link_id = link_id);
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- No new functions needed for schema changes in 04-enhanced-tables.sql
-- This file is kept for consistency in script numbering.
