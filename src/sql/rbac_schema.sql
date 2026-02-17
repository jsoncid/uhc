-- =====================================================
-- RBAC Database Schema
-- =====================================================
-- This file contains all table definitions for the RBAC system
-- Apply these in your Supabase dashboard SQL editor

-- =====================================================
-- ROLE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.role (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_role_is_active ON public.role(is_active);
CREATE INDEX IF NOT EXISTS idx_role_created_at ON public.role(created_at);

-- =====================================================
-- MODULE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.module (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_module_is_active ON public.module(is_active);
CREATE INDEX IF NOT EXISTS idx_module_created_at ON public.module(created_at);

-- =====================================================
-- ASSIGNMENT TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.assignment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assignment_is_active ON public.assignment(is_active);
CREATE INDEX IF NOT EXISTS idx_assignment_created_at ON public.assignment(created_at);

-- =====================================================
-- ROLE_MODULE_ACCESS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.role_module_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    role UUID NOT NULL,
    module UUID NOT NULL,
    is_select BOOLEAN DEFAULT false NOT NULL,
    is_insert BOOLEAN DEFAULT false NOT NULL,
    is_update BOOLEAN DEFAULT false NOT NULL,
    is_delete BOOLEAN DEFAULT false NOT NULL,
    description TEXT,
    
    -- Foreign key constraints
    CONSTRAINT fk_role_module_access_role 
        FOREIGN KEY (role) REFERENCES public.role(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_module_access_module 
        FOREIGN KEY (module) REFERENCES public.module(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate role-module combinations
    CONSTRAINT uk_role_module_access_role_module 
        UNIQUE (role, module)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_role_module_access_role ON public.role_module_access(role);
CREATE INDEX IF NOT EXISTS idx_role_module_access_module ON public.role_module_access(module);
CREATE INDEX IF NOT EXISTS idx_role_module_access_created_at ON public.role_module_access(created_at);

-- =====================================================
-- USER_ASSIGNMENT TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_assignment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "user" UUID NOT NULL,
    assignment UUID NOT NULL,
    
    -- Foreign key constraints
    CONSTRAINT fk_user_assignment_user 
        FOREIGN KEY ("user") REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_assignment_assignment 
        FOREIGN KEY (assignment) REFERENCES public.assignment(id) ON DELETE CASCADE,
    
    -- Unique constraint to prevent duplicate user-assignment combinations
    CONSTRAINT uk_user_assignment_user_assignment 
        UNIQUE ("user", assignment)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_assignment_user ON public.user_assignment("user");
CREATE INDEX IF NOT EXISTS idx_user_assignment_assignment ON public.user_assignment(assignment);
CREATE INDEX IF NOT EXISTS idx_user_assignment_created_at ON public.user_assignment(created_at);

-- =====================================================
-- SAMPLE DATA (Optional)
-- =====================================================
-- Uncomment the following to insert sample data

-- Insert sample roles
-- INSERT INTO public.role (id, description) VALUES 
--     ('admin', 'Administrator role with full access'),
--     ('manager', 'Manager role with limited administrative access'),
--     ('user', 'Standard user role with basic access');

-- Insert sample modules
-- INSERT INTO public.module (id, description) VALUES 
--     ('users', 'User management module'),
--     ('reports', 'Reports and analytics module'),
--     ('settings', 'System settings module'),
--     ('dashboard', 'Dashboard and overview module');

-- Insert sample assignments
-- INSERT INTO public.assignment (id, description) VALUES 
--     ('admin', 'Full system administration assignment'),
--     ('hr_manager', 'Human resources management assignment'),
--     ('sales_rep', 'Sales representative assignment'),
--     ('viewer', 'Read-only access assignment');

-- Insert sample role module access
-- INSERT INTO public.role_module_access (role, module, is_select, is_insert, is_update, is_delete, description) VALUES 
--     ('admin', 'users', true, true, true, true, 'Full access to user management'),
--     ('admin', 'reports', true, true, true, true, 'Full access to reports'),
--     ('admin', 'settings', true, true, true, true, 'Full access to settings'),
--     ('admin', 'dashboard', true, true, true, true, 'Full access to dashboard'),
--     ('manager', 'users', true, true, true, false, 'Manage users but cannot delete'),
--     ('manager', 'reports', true, true, false, false, 'View and create reports'),
--     ('manager', 'dashboard', true, false, false, false, 'View dashboard only'),
--     ('user', 'dashboard', true, false, false, false, 'View dashboard only'),
--     ('user', 'reports', true, false, false, false, 'View reports only');

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

-- Add table comments for documentation
COMMENT ON TABLE public.role IS 'Defines roles in the RBAC system';
COMMENT ON TABLE public.module IS 'Defines modules/resources that can be accessed';
COMMENT ON TABLE public.assignment IS 'Defines assignments that group roles and permissions';
COMMENT ON TABLE public.role_module_access IS 'Junction table defining what modules each role can access and with what permissions';
COMMENT ON TABLE public.user_assignment IS 'Junction table assigning users to specific assignments';

-- Add column comments
COMMENT ON COLUMN public.role.id IS 'Unique identifier for the role';
COMMENT ON COLUMN public.role.description IS 'Human-readable description of the role';
COMMENT ON COLUMN public.role.is_active IS 'Soft delete flag - false means deleted';

COMMENT ON COLUMN public.module.id IS 'Unique identifier for the module';
COMMENT ON COLUMN public.module.description IS 'Human-readable description of the module';
COMMENT ON COLUMN public.module.is_active IS 'Soft delete flag - false means deleted';

COMMENT ON COLUMN public.assignment.id IS 'Unique identifier for the assignment';
COMMENT ON COLUMN public.assignment.description IS 'Human-readable description of the assignment';
COMMENT ON COLUMN public.assignment.is_active IS 'Soft delete flag - false means deleted';

COMMENT ON COLUMN public.role_module_access.role IS 'Foreign key reference to role table';
COMMENT ON COLUMN public.role_module_access.module IS 'Foreign key reference to module table';
COMMENT ON COLUMN public.role_module_access.is_select IS 'Permission to read/select data';
COMMENT ON COLUMN public.role_module_access.is_insert IS 'Permission to create/insert data';
COMMENT ON COLUMN public.role_module_access.is_update IS 'Permission to modify/update data';
COMMENT ON COLUMN public.role_module_access.is_delete IS 'Permission to delete data';

COMMENT ON COLUMN public.user_assignment."user" IS 'Foreign key reference to auth.users table';
COMMENT ON COLUMN public.user_assignment.assignment IS 'Foreign key reference to assignment table';
