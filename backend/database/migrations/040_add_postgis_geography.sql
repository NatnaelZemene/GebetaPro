-- 040_add_postgis_geography.sql
-- Enable PostGIS extension for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add a generated geography point column from existing lat/lng
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS location_geog GEOGRAPHY(Point, 4326)
GENERATED ALWAYS AS (
  CASE 
    WHEN latitude IS NOT NULL AND longitude IS NOT NULL 
    THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
    ELSE NULL
  END
) STORED;

-- Spatial GIST index for fast radius queries
CREATE INDEX IF NOT EXISTS idx_profiles_location_geog 
ON profiles USING GIST (location_geog);

