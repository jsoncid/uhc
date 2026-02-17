import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type UserStatus = Database['public']['Tables']['user_status']

// Custom UserRole type since user_role table may not be in generated types yet
type UserRole = {
  id: string
  user: string
  role: string
  created_at: string
}

interface AuthUser {
  id: string
  email?: string
  created_at: string
}

// Types for user profile data from RBAC tables
export interface UserProfileData {
  id: string
  email: string
  isActive: boolean
  roles: { id: string; description: string }[]
  assignments: { id: string; description: string }[]
  modules: { 
    id: string
    description: string
    permissions: {
      is_select: boolean
      is_insert: boolean
      is_update: boolean
      is_delete: boolean
    }
  }[]
}

export const userService = {
  async createUserStatus(email: string): Promise<void> {
    try {
      console.log('Attempting to create user status for email:', email)
      
      const { error } = await supabase
        .from('user_status')
        .insert({
          email,
          is_active: false
        } as UserStatus['Insert'])

      if (error) {
        console.error('Error creating user status:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        throw error
      }
      
      console.log('User status created successfully')
    } catch (error) {
      console.error('Error in createUserStatus:', error)
      throw error
    }
  },

  async updateUserStatus(email: string, isActive: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_status')
        .update({ is_active: isActive } as UserStatus['Update'])
        .eq('email', email)

      if (error) {
        console.error('Error updating user status:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in updateUserStatus:', error)
      throw error
    }
  },

  async getUserStatus(email: string): Promise<UserStatus['Row'] | null> {
    try {
      const { data, error } = await supabase
        .from('user_status')
        .select('*')
        .eq('email', email)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned, user doesn't exist in status table
          return null
        }
        console.error('Error fetching user status:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in getUserStatus:', error)
      throw error
    }
  },

  async getAllUsers(): Promise<AuthUser[]> {
    try {
      // Get current authenticated user as a fallback
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No authenticated user found')
      }

      // For now, return the current user. In a production environment,
      // you would need to create a server-side endpoint or use RLS policies
      // to fetch all users safely.
      return [{
        id: user.id,
        email: user.email || '',
        created_at: user.created_at
      }]
    } catch (error) {
      console.error('Error in getAllUsers:', error)
      throw error
    }
  },

  // User Role operations
  async getAllUserRoles(): Promise<UserRole[]> {
    try {
      const { data, error } = await supabase
        .from('user_role')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user roles:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getAllUserRoles:', error)
      throw error
    }
  },

  async createUserRole(userRole: Omit<UserRole, 'id' | 'created_at'>): Promise<UserRole> {
    try {
      const { data, error } = await supabase
        .from('user_role')
        .insert(userRole)
        .select()
        .single()

      if (error) {
        console.error('Error creating user role:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in createUserRole:', error)
      throw error
    }
  },

  async deleteUserRole(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_role')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting user role:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in deleteUserRole:', error)
      throw error
    }
  },

  // Get current user's complete profile from RBAC tables
  async getCurrentUserProfile(): Promise<UserProfileData | null> {
    try {
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error('No authenticated user')
        return null
      }

      // Get user status by email from user_status table
      const { data: statusData } = await supabase
        .from('user_status')
        .select('is_active')
        .eq('email', user.email)
        .single()

      // Get user's roles with role descriptions
      const { data: userRoles } = await supabase
        .from('user_role')
        .select(`
          id,
          role (
            id,
            description,
            is_active
          )
        `)
        .eq('user', user.id)

      // Get user's assignments with assignment descriptions  
      const { data: userAssignments } = await supabase
        .from('user_assignment')
        .select(`
          id,
          assignment (
            id,
            description,
            is_active
          )
        `)
        .eq('user', user.id)

      // Get modules the user can access based on their roles
      const roleIds = userRoles?.map((ur: any) => ur.role?.id).filter(Boolean) || []
      
      let userModules: any[] = []
      if (roleIds.length > 0) {
        const { data: moduleAccess } = await supabase
          .from('role_module_access')
          .select(`
            is_select,
            is_insert,
            is_update,
            is_delete,
            module (
              id,
              description,
              is_active
            )
          `)
          .in('role', roleIds)

        userModules = moduleAccess || []
      }

      // Transform the data
      const roles = userRoles
        ?.filter((ur: any) => ur.role?.is_active)
        .map((ur: any) => ({
          id: ur.role.id,
          description: ur.role.description || 'No description'
        })) || []

      const assignments = userAssignments
        ?.filter((ua: any) => ua.assignment?.is_active)
        .map((ua: any) => ({
          id: ua.assignment.id,
          description: ua.assignment.description || 'No description'
        })) || []

      // Dedupe modules and merge permissions
      const moduleMap = new Map<string, any>()
      userModules.forEach((ma: any) => {
        if (ma.module?.is_active) {
          const existing = moduleMap.get(ma.module.id)
          if (existing) {
            // Merge permissions (OR)
            existing.permissions.is_select = existing.permissions.is_select || ma.is_select
            existing.permissions.is_insert = existing.permissions.is_insert || ma.is_insert
            existing.permissions.is_update = existing.permissions.is_update || ma.is_update
            existing.permissions.is_delete = existing.permissions.is_delete || ma.is_delete
          } else {
            moduleMap.set(ma.module.id, {
              id: ma.module.id,
              description: ma.module.description || 'No description',
              permissions: {
                is_select: ma.is_select,
                is_insert: ma.is_insert,
                is_update: ma.is_update,
                is_delete: ma.is_delete
              }
            })
          }
        }
      })

      return {
        id: user.id,
        email: user.email || '',
        isActive: statusData?.is_active ?? false,
        roles,
        assignments,
        modules: Array.from(moduleMap.values())
      }
    } catch (error) {
      console.error('Error in getCurrentUserProfile:', error)
      throw error
    }
  }
}
