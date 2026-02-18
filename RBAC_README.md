# Role-Based Access Control (RBAC) System

This document provides comprehensive information about the RBAC system implementation in your React/Supabase application.

## Overview

The RBAC system provides fine-grained access control through a flexible role and module-based permission system. It includes:

- **Assignment Management**: Create and manage assignments
- **Module Management**: Define system modules/resources
- **User Assignment**: Assign users to specific assignments
- **Role Module Access**: Configure permissions for roles to access modules

## Database Schema

### Tables

1. **`role`** - Defines roles in the system
2. **`module`** - Defines modules/resources that can be accessed
3. **`assignment`** - Defines assignments that group roles and permissions
4. **`role_module_access`** - Junction table defining module access permissions for roles
5. **`user_assignment`** - Junction table assigning users to specific assignments

### Key Features

- **Soft Delete**: All main tables use `is_active` flag instead of hard deletes
- **UUID Primary Keys**: All tables use UUID for better security and scalability
- **Foreign Key Constraints**: Proper referential integrity
- **Indexes**: Optimized for performance on commonly queried columns

## Setup Instructions

### 1. Database Setup

Run the following SQL files in your Supabase dashboard:

```sql
-- 1. Create tables
\i src/sql/rbac_schema.sql

-- 2. Set up Row Level Security policies
\i src/sql/rbac_rls_policies.sql
```

### 2. Environment Variables

Ensure your `.env` file contains:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Navigation

The RBAC pages are automatically added to your sidebar navigation:

- Assignment Management: `/rbac/assignments`
- Module Management: `/rbac/modules`
- User Assignments: `/rbac/user-assignments`

## File Structure

```
src/
├── components/rbac/
│   ├── AssignmentList.tsx          # Assignment management UI
│   ├── AssignmentDialog.tsx        # Assignment create/edit dialog
│   ├── ModuleList.tsx              # Module management UI
│   ├── ModuleDialog.tsx            # Module create/edit dialog
│   ├── UserAssignmentList.tsx      # User assignment management UI
│   ├── UserAssignmentDialog.tsx    # User assignment dialog
│   └── RoleModuleAccessDialog.tsx  # Role module access dialog
├── services/
│   ├── assignmentService.ts        # Assignment CRUD operations
│   ├── moduleService.ts            # Module CRUD operations
│   └── roleService.ts              # Role and user assignment operations
├── views/rbac/
│   ├── AssignmentManagement.tsx    # Assignment management page
│   ├── ModuleManagement.tsx        # Module management page
│   └── UserAssignmentManagement.tsx # User assignment page
├── sql/
│   ├── rbac_schema.sql             # Database schema
│   └── rbac_rls_policies.sql       # Row Level Security policies
└── lib/supabase.ts                 # Updated with RBAC types
```

## Usage Guide

### Managing Assignments

1. Navigate to **Assignment Management** in the sidebar
2. Click **Add Assignment** to create new assignments
3. Use the search functionality to find specific assignments
4. Edit or delete assignments using the action buttons

### Managing Modules

1. Navigate to **Module Management** in the sidebar
2. Click **Add Module** to create new modules
3. Modules represent different parts of your application
4. Use descriptive names and descriptions for better organization

### User Assignments

1. Navigate to **User Assignments** in the sidebar
2. Use the **User Assignments** tab to assign users to assignments
3. Use the **Role Module Access** tab to configure permissions
4. Set granular permissions (Select, Insert, Update, Delete) for each role-module combination

## Security Features

### Row Level Security (RLS)

All RBAC tables have RLS enabled with policies that:

- Allow authenticated users to read active records
- Prevent unauthorized access to sensitive data
- Implement soft delete patterns
- Provide audit trails through timestamps

### Soft Delete Pattern

Following the user rules, the system implements soft deletes:

- Never uses `.delete()` method for standard record removal
- Always uses `.update({ is_active: false })` for deletions
- Automatically filters inactive records in all SELECT queries

### Permission Checking

The system includes helper functions for checking permissions:

```sql
-- Check if user has specific module access
SELECT public.user_has_module_access(user_id, 'module_name', 'select');

-- Get all accessible modules for a user
SELECT * FROM public.get_user_accessible_modules(user_id);
```

## API Reference

### Assignment Service

```typescript
// Get all active assignments
const assignments = await assignmentService.getAllAssignments()

// Create new assignment
const assignment = await assignmentService.createAssignment({
  description: 'Assignment description'
})

// Update assignment
const updated = await assignmentService.updateAssignment(id, {
  description: 'Updated description'
})

// Soft delete assignment
await assignmentService.deleteAssignment(id)
```

### Module Service

```typescript
// Get all active modules
const modules = await moduleService.getAllModules()

// Create new module
const module = await moduleService.createModule({
  description: 'Module description'
})

// Update module
const updated = await moduleService.updateModule(id, {
  description: 'Updated description'
})

// Soft delete module
await moduleService.deleteModule(id)
```

### Role Service

```typescript
// Get all active roles
const roles = await roleService.getAllRoles()

// Create user assignment
const userAssignment = await roleService.createUserAssignment({
  user: 'user-uuid',
  assignment: 'assignment-uuid'
})

// Create role module access
const access = await roleService.createRoleModuleAccess({
  role: 'role-uuid',
  module: 'module-uuid',
  is_select: true,
  is_insert: false,
  is_update: false,
  is_delete: false
})
```

## Best Practices

1. **Principle of Least Privilege**: Grant only the minimum permissions necessary
2. **Regular Audits**: Periodically review user assignments and permissions
3. **Descriptive Names**: Use clear, descriptive names for roles, modules, and assignments
4. **Documentation**: Keep permission structures well-documented
5. **Testing**: Test permission changes in a development environment first

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all dialog components are properly created in the rbac folder
2. **Database Errors**: Verify RLS policies are correctly applied
3. **Permission Denied**: Check that users have proper authentication and role assignments

### Debugging

- Check browser console for detailed error messages
- Verify Supabase connection and authentication
- Review RLS policies in Supabase dashboard
- Use the network tab to inspect API calls

## Future Enhancements

Potential improvements to consider:

1. **Hierarchical Roles**: Implement role inheritance
2. **Time-based Access**: Add expiration dates to assignments
3. **Audit Logging**: Track all permission changes
4. **Bulk Operations**: Add bulk user assignment capabilities
5. **Role Templates**: Create predefined role templates

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review the Supabase documentation for RLS
3. Examine the browser console for error details
4. Verify database schema matches the provided SQL files
