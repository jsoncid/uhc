-- Migration: Add location text fields to patient_profile table
-- This allows manual input of location information
-- Run this in your Supabase SQL Editor

-- Add location text fields to patient_profile table
ALTER TABLE module3.patient_profile 
  ADD COLUMN IF NOT EXISTS street VARCHAR(500),
  ADD COLUMN IF NOT EXISTS brgy_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS city_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS province_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS region_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);

-- Add comments for documentation
COMMENT ON COLUMN module3.patient_profile.street IS 'Street address (manual input)';
COMMENT ON COLUMN module3.patient_profile.brgy_name IS 'Barangay name (manual input)';
COMMENT ON COLUMN module3.patient_profile.city_name IS 'City/Municipality name (manual input)';
COMMENT ON COLUMN module3.patient_profile.province_name IS 'Province name (manual input)';
COMMENT ON COLUMN module3.patient_profile.region_name IS 'Region name (manual input)';
COMMENT ON COLUMN module3.patient_profile.zip_code IS 'ZIP/Postal code (manual input)';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Location fields added successfully!';
END $$;
