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

export interface UserProfileData {
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

  // Get pending users (users with is_active = false)
  async getPendingUsers(): Promise<{ id: string; email: string; name: string; is_active: boolean; created_at: string }[]> {
    try {
      const { data, error } = await supabase
        .from('user_status')
        .select('*')
        .eq('is_active', false)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching pending users:', error)
        throw error
      }

      return (data || []).map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.email?.split('@')[0] || 'Unknown',
        is_active: user.is_active,
        created_at: user.created_at
      }))
    } catch (error) {
      console.error('Error in getPendingUsers:', error)
      throw error
    }
  },

  // Approve a user by setting is_active to true
  async approveUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_status')
        .update({ is_active: true } as UserStatus['Update'])
        .eq('id', userId)

      if (error) {
        console.error('Error approving user:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in approveUser:', error)
      throw error
    }
  },

  // Reject a user by deleting their record
  async rejectUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_status')
        .delete()
        .eq('id', userId)

      if (error) {
        console.error('Error rejecting user:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in rejectUser:', error)
      throw error
    }
  },

  // Get current user's profile with roles, assignments, and modules
  async getCurrentUserProfile(): Promise<UserProfileData | null> {
    try {
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return null
      }

      // Get user status
      const { data: statusData } = await supabase
        .from('user_status')
        .select('*')
        .eq('email', user.email)
        .single()

      // Get user roles
      const { data: userRoles } = await supabase
        .from('user_role')
        .select('role')
        .eq('user', user.id)

      const roleIds = userRoles?.map(ur => ur.role) || []

      // Get role details
      let roles: Array<{ id: string; description: string }> = []
      if (roleIds.length > 0) {
        const { data: rolesData } = await supabase
          .from('role')
          .select('id, description')
          .in('id', roleIds)
        roles = rolesData || []
      }

      // Get assignments through roles
      let assignments: Array<{ id: string; description: string }> = []
      if (roleIds.length > 0) {
        const { data: roleAssignments } = await supabase
          .from('role_assignment')
          .select('assignment')
          .in('role', roleIds)
        
        const assignmentIds = roleAssignments?.map(ra => ra.assignment) || []
        if (assignmentIds.length > 0) {
          const { data: assignmentsData } = await supabase
            .from('assignment')
            .select('id, description')
            .in('id', assignmentIds)
          assignments = assignmentsData || []
        }
      }

      // Get modules through assignments
      let modules: Array<{ id: string; description: string; permissions: { is_select: boolean; is_insert: boolean; is_update: boolean; is_delete: boolean } }> = []
      if (assignments.length > 0) {
        const assignmentIds = assignments.map(a => a.id)
        const { data: assignmentModules } = await supabase
          .from('assignment_module')
          .select('module, is_select, is_insert, is_update, is_delete')
          .in('assignment', assignmentIds)
        
        const moduleIds = assignmentModules?.map(am => am.module) || []
        if (moduleIds.length > 0) {
          const { data: modulesData } = await supabase
            .from('module')
            .select('id, description')
            .in('id', moduleIds)
          
          modules = (modulesData || []).map(mod => {
            const perms = assignmentModules?.find(am => am.module === mod.id)
            return {
              id: mod.id,
              description: mod.description,
              permissions: {
                is_select: perms?.is_select || false,
                is_insert: perms?.is_insert || false,
                is_update: perms?.is_update || false,
                is_delete: perms?.is_delete || false
              }
            }
          })
        }
      }

      return {
        id: user.id,
        email: user.email || '',
        isActive: statusData?.is_active || false,
        roles,
        assignments,
        modules
      }
    } catch (error) {
      console.error('Error in getCurrentUserProfile:', error)
      throw error
    }
  }
}
