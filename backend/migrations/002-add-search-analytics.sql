-- Migration to add search_analytics table for customer demand insights

CREATE TABLE IF NOT EXISTS search_analytics (
    id SERIAL PRIMARY KEY,
    search_term VARCHAR(255) NOT NULL,
    store_id_searched INTEGER REFERENCES stores(id) ON DELETE SET NULL, -- which store's context was it searched in, if any
    user_session_id VARCHAR(255), -- to track unique users without personal data
    found_match BOOLEAN NOT NULL DEFAULT FALSE,
    search_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster searching and aggregation
CREATE INDEX IF NOT EXISTS idx_search_analytics_term ON search_analytics(search_term);
CREATE INDEX IF NOT EXISTS idx_search_analytics_last_searched ON search_analytics(last_searched_at);

-- A function and trigger to update the search_count and last_searched_at
-- This is more efficient than handling it in the application logic.
CREATE OR REPLACE FUNCTION upsert_search_analytic()
RETURNS TRIGGER AS $$
BEGIN
    -- This function is a placeholder for a more complex upsert logic
    -- that would be implemented in the application layer or a more sophisticated trigger.
    -- For now, we will handle the logic in the application.
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- We will handle the upsert logic in the application code for simplicity,
-- so no trigger is created in this migration.
