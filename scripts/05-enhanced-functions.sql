-- Function to get advanced analytics data
CREATE OR REPLACE FUNCTION get_advanced_analytics(days_back INT DEFAULT 30, link_id UUID DEFAULT NULL)
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
    start_date TIMESTAMP WITH TIME ZONE := NOW() - (days_back || ' days')::INTERVAL;
    total_clicks_val BIGINT;
    total_purchases_val BIGINT;
    total_revenue_val NUMERIC;
    daily_stats_json JSONB;
    geographic_stats_json JSONB;
    device_stats_json JSONB;
    payment_processor_stats_json JSONB;
BEGIN
    -- Calculate total clicks, purchases, and revenue
    SELECT
        COALESCE(SUM(clicks), 0),
        COALESCE(SUM(purchases), 0),
        COALESCE(SUM(revenue), 0.00)
    INTO
        total_clicks_val,
        total_purchases_val,
        total_revenue_val
    FROM purchase_links
    WHERE (link_id IS NULL OR id = link_id)
      AND created_at >= start_date;

    -- Calculate daily stats
    SELECT JSONB_AGG(daily_data ORDER BY date)
    INTO daily_stats_json
    FROM (
        SELECT
            TO_CHAR(created_at, 'YYYY-MM-DD') AS date,
            COUNT(CASE WHEN event_type = 'link_click' THEN 1 END) AS clicks,
            COUNT(CASE WHEN event_type = 'purchase_completed' THEN 1 END) AS purchases,
            COALESCE(SUM((metadata->>'amount')::NUMERIC), 0.00) AS revenue
        FROM analytics
        WHERE created_at >= start_date
          AND (link_id IS NULL OR purchase_link_id = link_id)
        GROUP BY date
    ) AS daily_data;

    -- Calculate geographic stats (example: by country from metadata)
    SELECT JSONB_AGG(geo_data)
    INTO geographic_stats_json
    FROM (
        SELECT
            metadata->>'country' AS country,
            COUNT(CASE WHEN event_type = 'link_click' THEN 1 END) AS clicks,
            COUNT(CASE WHEN event_type = 'purchase_completed' THEN 1 END) AS purchases,
            COALESCE(SUM((metadata->>'amount')::NUMERIC), 0.00) AS revenue
        FROM analytics
        WHERE created_at >= start_date
          AND (link_id IS NULL OR purchase_link_id = link_id)
          AND metadata ? 'country'
        GROUP BY country
        ORDER BY revenue DESC
    ) AS geo_data;

    -- Calculate device stats (example: by device_type from metadata)
    SELECT JSONB_AGG(device_data)
    INTO device_stats_json
    FROM (
        SELECT
            metadata->>'device_type' AS device_type,
            COUNT(CASE WHEN event_type = 'link_click' THEN 1 END) AS clicks,
            COUNT(CASE WHEN event_type = 'purchase_completed' THEN 1 END) AS purchases
        FROM analytics
        WHERE created_at >= start_date
          AND (link_id IS NULL OR purchase_link_id = link_id)
          AND metadata ? 'device_type'
        GROUP BY device_type
        ORDER BY clicks DESC
    ) AS device_data;

    -- Calculate payment processor stats
    SELECT JSONB_AGG(processor_data)
    INTO payment_processor_stats_json
    FROM (
        SELECT
            payment_processor AS processor,
            COUNT(id) AS purchases,
            COALESCE(SUM(amount), 0.00) AS revenue
        FROM payment_transactions
        WHERE created_at >= start_date
          AND (link_id IS NULL OR purchase_link_id = link_id)
          AND status = 'completed'
        GROUP BY payment_processor
        ORDER BY revenue DESC
    ) AS processor_data;

    RETURN QUERY SELECT
        total_clicks_val,
        total_purchases_val,
        total_revenue_val,
        CASE
            WHEN total_clicks_val > 0 THEN (total_purchases_val::NUMERIC / total_clicks_val::NUMERIC) * 100
            ELSE 0.00
        END AS conversion_rate,
        CASE
            WHEN total_purchases_val > 0 THEN total_revenue_val / total_purchases_val
            ELSE 0.00
        END AS avg_order_value,
        daily_stats_json,
        geographic_stats_json,
        device_stats_json,
        payment_processor_stats_json;
END;
$$ LANGUAGE plpgsql;
