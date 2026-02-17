-- =====================================================
-- RBAC Row Level Security (RLS) Policies
-- =====================================================
-- This file contains all RLS policies for the RBAC system
-- Apply these policies in your Supabase dashboard SQL editor

-- Enable RLS on all RBAC tables
ALTER TABLE public.role ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assignment ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ROLE TABLE POLICIES
-- =====================================================

-- Allow authenticated users to read active roles
CREATE POLICY "Users can view active roles" ON public.role
    FOR SELECT USING (
        auth.role() = 'authenticated' AND is_active = true
    );

-- Allow authenticated users to insert roles (you may want to restrict this further)
CREATE POLICY "Authenticated users can create roles" ON public.role
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );

-- Allow authenticated users to update roles they have access to
CREATE POLICY "Authenticated users can update roles" ON public.role
    FOR UPDATE USING (
        auth.role() = 'authenticated'
    );

-- Prevent hard deletes - only soft deletes allowed
CREATE POLICY "No hard deletes on roles" ON public.role
    FOR DELETE USING (false);

-- =====================================================
-- MODULE TABLE POLICIES
-- =====================================================

-- Allow authenticated users to read active modules
CREATE POLICY "Users can view active modules" ON public.module
    FOR SELECT USING (
        auth.role() = 'authenticated' AND is_active = true
    );

-- Allow authenticated users to insert modules
CREATE POLICY "Authenticated users can create modules" ON public.module
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );

-- Allow authenticated users to update modules
CREATE POLICY "Authenticated users can update modules" ON public.module
    FOR UPDATE USING (
        auth.role() = 'authenticated'
    );

-- Prevent hard deletes - only soft deletes allowed
CREATE POLICY "No hard deletes on modules" ON public.module
    FOR DELETE USING (false);

-- =====================================================
-- ASSIGNMENT TABLE POLICIES
-- =====================================================

-- Allow authenticated users to read active assignments
CREATE POLICY "Users can view active assignments" ON public.assignment
    FOR SELECT USING (
        auth.role() = 'authenticated' AND is_active = true
    );

-- Allow authenticated users to insert assignments
CREATE POLICY "Authenticated users can create assignments" ON public.assignment
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );

-- Allow authenticated users to update assignments
CREATE POLICY "Authenticated users can update assignments" ON public.assignment
    FOR UPDATE USING (
        auth.role() = 'authenticated'
    );

-- Prevent hard deletes - only soft deletes allowed
CREATE POLICY "No hard deletes on assignments" ON public.assignment
    FOR DELETE USING (false);

-- =====================================================
-- ROLE_MODULE_ACCESS TABLE POLICIES
-- =====================================================

-- Allow authenticated users to read role module access
CREATE POLICY "Users can view role module access" ON public.role_module_access
    FOR SELECT USING (
        auth.role() = 'authenticated'
    );

-- Allow authenticated users to create role module access
CREATE POLICY "Authenticated users can create role module access" ON public.role_module_access
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );

-- Allow authenticated users to update role module access
CREATE POLICY "Authenticated users can update role module access" ON public.role_module_access
    FOR UPDATE USING (
        auth.role() = 'authenticated'
    );

-- Allow authenticated users to delete role module access (hard delete is OK for this junction table)
CREATE POLICY "Authenticated users can delete role module access" ON public.role_module_access
    FOR DELETE USING (
        auth.role() = 'authenticated'
    );

-- =====================================================
-- USER_ASSIGNMENT TABLE POLICIES
-- =====================================================

-- Allow users to view their own assignments and admins to view all
CREATE POLICY "Users can view relevant user assignments" ON public.user_assignment
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            auth.uid()::text = "user" OR
            -- Add admin role check here if you have admin roles
            true -- For now, allow all authenticated users to view
        )
    );

-- Allow authenticated users to create user assignments
CREATE POLICY "Authenticated users can create user assignments" ON public.user_assignment
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
    );

-- Allow users to update their own assignments and admins to update all
CREATE POLICY "Users can update relevant user assignments" ON public.user_assignment
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            auth.uid()::text = "user" OR
            -- Add admin role check here if you have admin roles
            true -- For now, allow all authenticated users to update
        )
    );

-- Allow authenticated users to delete user assignments (hard delete is OK for this junction table)
CREATE POLICY "Authenticated users can delete user assignments" ON public.user_assignment
    FOR DELETE USING (
        auth.role() = 'authenticated'
    );

-- =====================================================
-- ADDITIONAL SECURITY CONSIDERATIONS
-- =====================================================

-- You may want to create more restrictive policies based on:
-- 1. User roles (admin, manager, user)
-- 2. Department/organization boundaries
-- 3. Specific module access permissions
-- 4. Time-based access restrictions

-- Example of a more restrictive policy (commented out):
-- CREATE POLICY "Only admins can manage roles" ON public.role
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM public.user_roles ur
--             WHERE ur.user_id = auth.uid()
--             AND ur.role_name = 'admin'
--         )
--     );

-- =====================================================
-- FUNCTIONS FOR RBAC CHECKS (Optional)
-- =====================================================

-- Function to check if user has specific module access
CREATE OR REPLACE FUNCTION public.user_has_module_access(
    user_id UUID,
    module_name TEXT,
    access_type TEXT -- 'select', 'insert', 'update', 'delete'
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_assignment ua
        JOIN public.role_module_access rma ON ua.assignment = rma.role
        WHERE ua."user" = user_id::text
        AND rma.module = module_name
        AND (
            (access_type = 'select' AND rma.is_select = true) OR
            (access_type = 'insert' AND rma.is_insert = true) OR
            (access_type = 'update' AND rma.is_update = true) OR
            (access_type = 'delete' AND rma.is_delete = true)
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's accessible modules
CREATE OR REPLACE FUNCTION public.get_user_accessible_modules(user_id UUID)
RETURNS TABLE(
    module_id TEXT,
    can_select BOOLEAN,
    can_insert BOOLEAN,
    can_update BOOLEAN,
    can_delete BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rma.module,
        rma.is_select,
        rma.is_insert,
        rma.is_update,
        rma.is_delete
    FROM public.user_assignment ua
    JOIN public.role_module_access rma ON ua.assignment = rma.role
    WHERE ua."user" = user_id::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
