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
  username?: string | null
}

interface UserProfileData {
  id: string
  email: string
  isActive: boolean
  roles: Array<{ id: string; description: string }>
  assignments: Array<{ id: string; description: string }>
  modules: Array<{ id: string; description: string; permissions: { is_select: boolean; is_insert: boolean; is_update: boolean; is_delete: boolean } }>
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const userService = {
  // Fetch users from backend API (connects to auth.users via PostgreSQL)
  async getAllUsersFromAPI(): Promise<AuthUser[]> {
    try {
      const response = await fetch(`${API_URL}/api/users`)
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching users from API:', error)
      throw error
    }
  },

  async getUsersByIds(ids: string[]): Promise<AuthUser[]> {
    try {
      if (!ids || ids.length === 0) return []
      
      const response = await fetch(`${API_URL}/api/users/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching users by IDs:', error)
      throw error
    }
  },

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

  async updateUserStatus(userId: string, isActive: boolean): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_status')
        .update({ is_active: isActive } as UserStatus['Update'])
        .eq('id', userId)

      if (error) {
        console.error('Error updating user status:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in updateUserStatus:', error)
      throw error
    }
  },

  async getUserStatus(userId: string): Promise<UserStatus['Row'] | null> {
    try {
      const { data, error } = await supabase
        .from('user_status')
        .select('*')
        .eq('id', userId)
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
      // First try to fetch from backend API (preferred method)
      try {
        const users = await this.getAllUsersFromAPI()
        if (users && users.length > 0) {
          return users
        }
      } catch (apiError) {
        console.warn('Could not fetch from API, falling back to current user:', apiError)
      }

      // Fallback: Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('No authenticated user found')
      }

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
  async getAllUserRoles(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_role')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user roles:', error)
        throw error
      }

      if (!data || data.length === 0) {
        return []
      }

      // Get unique user IDs and role IDs
      const userIds = [...new Set(data.map((ur: UserRole) => ur.user))]
      const roleIds = [...new Set(data.map((ur: UserRole) => ur.role))]

      // Fetch users from backend API and roles from Supabase
      const [users, rolesResult] = await Promise.all([
        this.getUsersByIds(userIds).catch(err => {
          console.warn('Failed to fetch users from API:', err)
          return []
        }),
        supabase.from('role').select('id, description').in('id', roleIds)
      ])

      const roles = rolesResult.data || []

      // Map the data together
      const enrichedUserRoles = data.map((ur: UserRole) => ({
        ...ur,
        users: users.find(u => u.id === ur.user),
        roleData: roles.find(r => r.id === ur.role)
      }))

      return enrichedUserRoles
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
  },

  // User Acceptance operations
  async getUsersWithStatus(): Promise<{ id: string; email: string; name: string; is_active: boolean; created_at: string }[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_users_with_status')

      if (error) {
        console.error('Error fetching users with status:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getUsersWithStatus:', error)
      throw error
    }
  },

  async getPendingUsers(): Promise<{ id: string; email: string; name: string; is_active: boolean; created_at: string }[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_pending_users')

      if (error) {
        console.error('Error fetching pending users:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getPendingUsers:', error)
      throw error
    }
  },

  async approveUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('approve_user', { user_id: userId })

      if (error) {
        console.error('Error approving user:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in approveUser:', error)
      throw error
    }
  },

  async rejectUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('reject_user', { user_id: userId })

      if (error) {
        console.error('Error rejecting user:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in rejectUser:', error)
      throw error
    }
  }
}
