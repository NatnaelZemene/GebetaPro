-- 041_add_is_featured_and_notification_metadata.sql
-- Task 2.3: Add is_featured to profiles and metadata JSONB to notifications

-- 1. Add is_featured flag to profiles for tier promotion / downgrade
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for featured profile discovery queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_featured
  ON profiles (is_featured)
  WHERE is_featured = TRUE;

-- 2. Add metadata column to notifications for structured payload (e.g. subscription_id)
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

