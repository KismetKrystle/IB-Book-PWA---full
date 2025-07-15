-- Function to increment purchase link clicks
CREATE OR REPLACE FUNCTION increment_link_clicks(link_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE purchase_links 
  SET clicks = clicks + 1 
  WHERE slug = link_slug AND active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to increment purchase link purchases
CREATE OR REPLACE FUNCTION increment_link_purchases(link_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE purchase_links 
  SET purchases = purchases + 1 
  WHERE slug = link_slug AND active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to get analytics summary
CREATE OR REPLACE FUNCTION get_analytics_summary(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  total_visits BIGINT,
  total_purchases BIGINT,
  total_revenue NUMERIC,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(pl.clicks), 0) as total_visits,
    COALESCE(SUM(pl.purchases), 0) as total_purchases,
    COALESCE(SUM(pl.purchases * pl.price), 0) as total_revenue,
    CASE 
      WHEN SUM(pl.clicks) > 0 THEN 
        ROUND((SUM(pl.purchases)::NUMERIC / SUM(pl.clicks)::NUMERIC) * 100, 2)
      ELSE 0 
    END as conversion_rate
  FROM purchase_links pl
  WHERE pl.created_at >= NOW() - INTERVAL '1 day' * days_back;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired sessions
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
