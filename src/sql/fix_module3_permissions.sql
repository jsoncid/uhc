-- Fix permissions for module3 schema
-- Run this in your Supabase SQL Editor if you're getting "permission denied for schema module3" error

-- Grant schema access
GRANT USAGE ON SCHEMA module3 TO authenticated, anon, service_role;
GRANT CREATE ON SCHEMA module3 TO authenticated, service_role;

-- Grant permissions on all existing tables
GRANT ALL ON ALL TABLES IN SCHEMA module3 TO authenticated, service_role;

-- Grant permissions on all sequences (for auto-generated IDs)
GRANT ALL ON ALL SEQUENCES IN SCHEMA module3 TO authenticated, service_role;

-- Grant permissions on all functions
GRANT ALL ON ALL FUNCTIONS IN SCHEMA module3 TO authenticated, service_role;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA module3 GRANT ALL ON TABLES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA module3 GRANT ALL ON SEQUENCES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA module3 GRANT ALL ON FUNCTIONS TO authenticated, service_role;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Permissions fixed! Try saving a patient again.';
END $$;
