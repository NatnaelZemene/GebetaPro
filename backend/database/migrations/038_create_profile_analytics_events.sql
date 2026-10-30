-- 038_create_profile_analytics_events.sql
-- Tracking views and contact interactions for provider profiles and dashboard analytics.

CREATE TABLE IF NOT EXISTS profile_analytics_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL CHECK (event_type IN ('VIEW', 'CONTACT_CLICK', 'PHONE_CLICK', 'EMAIL_CLICK', 'WHATSAPP_CLICK', 'TELEGRAM_CLICK', 'WEBSITE_CLICK')),
  metadata    JSONB DEFAULT '{}'::jsonb,
  visitor_ip  TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_profile_type_date 
  ON profile_analytics_events (profile_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_created_at
  ON profile_analytics_events (created_at DESC);

-- Aggregated counter columns on profiles for quick indexing and caching
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS views_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_clicks_count INTEGER NOT NULL DEFAULT 0;
