-- Create complete patient profile schema following the existing database structure
-- Run this in your Supabase SQL Editor

-- STEP 0: Create module3 schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS module3;

-- Grant usage and create privileges on schema
GRANT USAGE ON SCHEMA module3 TO authenticated, anon, service_role;
GRANT CREATE ON SCHEMA module3 TO authenticated, service_role;
GRANT ALL ON SCHEMA module3 TO postgres;

-- Grant privileges on all existing tables in module3
GRANT ALL ON ALL TABLES IN SCHEMA module3 TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA module3 TO authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA module3 TO authenticated, service_role;

-- Set default privileges for future objects in module3
ALTER DEFAULT PRIVILEGES IN SCHEMA module3 GRANT ALL ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA module3 GRANT ALL ON SEQUENCES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA module3 GRANT ALL ON FUNCTIONS TO authenticated, service_role;

-- STEP 1: Create location tables (if they don't exist)
-- These tables should match the schema shown in your database diagram

-- Create region table
CREATE TABLE IF NOT EXISTS module3.region (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    description VARCHAR(255)
);

-- Create province table
CREATE TABLE IF NOT EXISTS module3.province (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    description VARCHAR(255),
    region UUID REFERENCES module3.region(id)
);

-- Create city_municipality table
CREATE TABLE IF NOT EXISTS module3.city_municipality (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    description VARCHAR(255),
    province UUID REFERENCES module3.province(id)
);

-- Create brgy table
CREATE TABLE IF NOT EXISTS module3.brgy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    description VARCHAR(255),
    city_municipality UUID REFERENCES module3.city_municipality(id)
);

-- Enable RLS for location tables
ALTER TABLE module3.region ENABLE ROW LEVEL SECURITY;
ALTER TABLE module3.province ENABLE ROW LEVEL SECURITY;
ALTER TABLE module3.city_municipality ENABLE ROW LEVEL SECURITY;
ALTER TABLE module3.brgy ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON module3.region TO authenticated, service_role;
GRANT ALL ON module3.province TO authenticated, service_role;
GRANT ALL ON module3.city_municipality TO authenticated, service_role;
GRANT ALL ON module3.brgy TO authenticated, service_role;

-- Create policies for location tables (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to read regions" ON module3.region;
CREATE POLICY "Allow authenticated users to read regions"
    ON module3.region FOR SELECT TO authenticated USING (true);
    
DROP POLICY IF EXISTS "Allow authenticated users to insert regions" ON module3.region;
CREATE POLICY "Allow authenticated users to insert regions"
    ON module3.region FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to read provinces" ON module3.province;
CREATE POLICY "Allow authenticated users to read provinces"
    ON module3.province FOR SELECT TO authenticated USING (true);
    
DROP POLICY IF EXISTS "Allow authenticated users to insert provinces" ON module3.province;
CREATE POLICY "Allow authenticated users to insert provinces"
    ON module3.province FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to read cities" ON module3.city_municipality;
CREATE POLICY "Allow authenticated users to read cities"
    ON module3.city_municipality FOR SELECT TO authenticated USING (true);
    
DROP POLICY IF EXISTS "Allow authenticated users to insert cities" ON module3.city_municipality;
CREATE POLICY "Allow authenticated users to insert cities"
    ON module3.city_municipality FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to read brgys" ON module3.brgy;
CREATE POLICY "Allow authenticated users to read brgys"
    ON module3.brgy FOR SELECT TO authenticated USING (true);
    
DROP POLICY IF EXISTS "Allow authenticated users to insert brgys" ON module3.brgy;
CREATE POLICY "Allow authenticated users to insert brgys"
    ON module3.brgy FOR INSERT TO authenticated WITH CHECK (true);

-- STEP 2: Create patient_profile table
CREATE TABLE IF NOT EXISTS module3.patient_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    first_name VARCHAR(255) NOT NULL,
    middle_name VARCHAR(255),
    last_name VARCHAR(255) NOT NULL,
    ext_name VARCHAR(50),
    sex VARCHAR(20) NOT NULL,
    birth_date DATE NOT NULL,
    brgy UUID REFERENCES module3.brgy(id),
    street VARCHAR(500),
    brgy_name VARCHAR(255),
    city_name VARCHAR(255),
    province_name VARCHAR(255),
    region_name VARCHAR(255),
    zip_code VARCHAR(20),
    CONSTRAINT patient_profile_sex_check CHECK (sex IN ('male', 'female', 'other', 'unknown'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_patient_profile_first_name ON module3.patient_profile(first_name);
CREATE INDEX IF NOT EXISTS idx_patient_profile_last_name ON module3.patient_profile(last_name);
CREATE INDEX IF NOT EXISTS idx_patient_profile_birth_date ON module3.patient_profile(birth_date);
CREATE INDEX IF NOT EXISTS idx_patient_profile_brgy ON module3.patient_profile(brgy);
CREATE INDEX IF NOT EXISTS idx_patient_profile_full_name ON module3.patient_profile(first_name, last_name, birth_date);

-- Enable Row Level Security
ALTER TABLE module3.patient_profile ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to read patient profiles" ON module3.patient_profile;
CREATE POLICY "Allow authenticated users to read patient profiles"
    ON module3.patient_profile
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert patient profiles" ON module3.patient_profile;
CREATE POLICY "Allow authenticated users to insert patient profiles"
    ON module3.patient_profile
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update patient profiles" ON module3.patient_profile;
CREATE POLICY "Allow authenticated users to update patient profiles"
    ON module3.patient_profile
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete patient profiles" ON module3.patient_profile;
CREATE POLICY "Allow authenticated users to delete patient profiles"
    ON module3.patient_profile
    FOR DELETE
    TO authenticated
    USING (true);

-- Grant permissions
GRANT ALL ON module3.patient_profile TO authenticated;
GRANT ALL ON module3.patient_profile TO service_role;

-- Comments
COMMENT ON TABLE module3.patient_profile IS 'Stores patient profile information';
COMMENT ON COLUMN module3.patient_profile.brgy IS 'Foreign key reference to brgy table';

-- STEP 3: Create patient_repository table
-- Links patient_profile with hpercode and facility from MySQL database
CREATE TABLE IF NOT EXISTS module3.patient_repository (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    patient_profile UUID REFERENCES module3.patient_profile(id) ON DELETE CASCADE,
    facility_code VARCHAR(255),
    hpercode VARCHAR(255),
    status BOOLEAN DEFAULT TRUE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_patient_repository_patient_profile ON module3.patient_repository(patient_profile);
CREATE INDEX IF NOT EXISTS idx_patient_repository_hpercode ON module3.patient_repository(hpercode);
CREATE INDEX IF NOT EXISTS idx_patient_repository_facility ON module3.patient_repository(facility_code);
CREATE INDEX IF NOT EXISTS idx_patient_repository_status ON module3.patient_repository(status);

-- Enable RLS
ALTER TABLE module3.patient_repository ENABLE ROW LEVEL SECURITY;

-- Create policies (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to read patient repository" ON module3.patient_repository;
CREATE POLICY "Allow authenticated users to read patient repository"
    ON module3.patient_repository
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to insert patient repository" ON module3.patient_repository;
CREATE POLICY "Allow authenticated users to insert patient repository"
    ON module3.patient_repository
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to update patient repository" ON module3.patient_repository;
CREATE POLICY "Allow authenticated users to update patient repository"
    ON module3.patient_repository
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated users to delete patient repository" ON module3.patient_repository;
CREATE POLICY "Allow authenticated users to delete patient repository"
    ON module3.patient_repository
    FOR DELETE
    TO authenticated
    USING (true);

-- Grant permissions
GRANT ALL ON module3.patient_repository TO authenticated;
GRANT ALL ON module3.patient_repository TO service_role;

-- Comments
COMMENT ON TABLE module3.patient_repository IS 'Links patient profiles with MySQL repository data (hpercode and facility)';

-- FINAL STEP: Grant all permissions on schema and all objects
GRANT USAGE ON SCHEMA module3 TO authenticated, anon, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA module3 TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA module3 TO authenticated, service_role;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Schema created successfully! You can now save patient profiles.';
END $$;
