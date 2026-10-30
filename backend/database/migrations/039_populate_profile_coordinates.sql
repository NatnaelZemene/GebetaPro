-- 039_populate_profile_coordinates.sql
-- Assigns coordinates to existing profiles based on their known city and area
-- so they appear on the interactive map discovery page.

UPDATE profiles SET latitude = 8.9982, longitude = 38.7865 WHERE slug = 'abebe-plumbing' AND latitude IS NULL;
UPDATE profiles SET latitude = 8.9892, longitude = 38.7402 WHERE slug = 'alem-photography-studio' AND latitude IS NULL;
UPDATE profiles SET latitude = 9.0205, longitude = 38.8023 WHERE slug = 'almaz-general-clinic' AND latitude IS NULL;
UPDATE profiles SET latitude = 9.0108, longitude = 38.7447 WHERE slug = 'belay-law-office' AND latitude IS NULL;
UPDATE profiles SET latitude = 9.0195, longitude = 38.7695 WHERE slug = 'dawit-specialty-coffee' AND latitude IS NULL;
UPDATE profiles SET latitude = 9.0210, longitude = 38.8470 WHERE slug = 'fasil-academic-tutoring' AND latitude IS NULL;
UPDATE profiles SET latitude = 9.0350, longitude = 38.7525 WHERE slug = 'natnael-tech-repair' AND latitude IS NULL;
UPDATE profiles SET latitude = 9.0082, longitude = 38.7825 WHERE slug = 'seble-beauty-salon' AND latitude IS NULL;
UPDATE profiles SET latitude = 9.0345, longitude = 38.7516 WHERE slug = 'selam-habesha-kitchen' AND latitude IS NULL;
UPDATE profiles SET latitude = 9.0015, longitude = 38.7840 WHERE slug = 'shewaye-fashion-boutique' AND latitude IS NULL;
UPDATE profiles SET latitude = 8.9950, longitude = 38.7360 WHERE slug = 'solomon-construction' AND latitude IS NULL;
UPDATE profiles SET latitude = 9.0150, longitude = 38.8680 WHERE slug = 'yonas-garden-landscape' AND latitude IS NULL;

-- Gondar & surrounding listings
UPDATE profiles SET latitude = 12.6030, longitude = 37.4520 WHERE slug = 'florida-international-hotel-gondar' AND latitude IS NULL;
UPDATE profiles SET latitude = 12.6200, longitude = 37.4680 WHERE slug = 'goha-hotel-gondar' AND latitude IS NULL;
UPDATE profiles SET latitude = 12.6120, longitude = 37.4710 WHERE slug = 'gondar-hills-resort' AND latitude IS NULL;
UPDATE profiles SET latitude = 12.6090, longitude = 37.4640 WHERE slug = 'gondar-plaza-hotel' AND latitude IS NULL;
UPDATE profiles SET latitude = 12.5980, longitude = 37.4560 WHERE slug = 'haile-resort-gondar' AND latitude IS NULL;
UPDATE profiles SET latitude = 12.6070, longitude = 37.4610 WHERE slug = 'haz-hotel-gondar' AND latitude IS NULL;
UPDATE profiles SET latitude = 12.6020, longitude = 37.4540 WHERE slug = 'mass-ethiopia-tours' AND latitude IS NULL;
UPDATE profiles SET latitude = 12.6180, longitude = 37.4480 WHERE slug = 'nor-gondar-guesthouse' AND latitude IS NULL;
UPDATE profiles SET latitude = 12.6010, longitude = 37.4530 WHERE slug = 'north-expeditions-ethiopia' AND latitude IS NULL;
UPDATE profiles SET latitude = 12.6040, longitude = 37.4550 WHERE slug = 'simien-ethio-tours' AND latitude IS NULL;
UPDATE profiles SET latitude = 12.6080, longitude = 37.4590 WHERE slug = 'simien-tour-ethiopia' AND latitude IS NULL;
UPDATE profiles SET latitude = 12.6060, longitude = 37.4580 WHERE slug = 'simien-eco-tours' AND latitude IS NULL;
UPDATE profiles SET latitude = 12.6075, longitude = 37.4630 WHERE slug = 'tesema-simien-ethio-guide' AND latitude IS NULL;
UPDATE profiles SET latitude = 12.6050, longitude = 37.4620 WHERE slug = 'zobel-resort-hotel' AND latitude IS NULL;
UPDATE profiles SET latitude = 12.6100, longitude = 37.4600 WHERE slug = 'simien-trekking-tours' AND latitude IS NULL;
