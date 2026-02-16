import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type Role = Database['public']['Tables']['role']
type RoleModuleAccess = Database['public']['Tables']['role_module_access']
type UserAssignment = Database['public']['Tables']['user_assignment']

export const roleService = {
  // Role CRUD operations
  async getAllRoles(): Promise<Role['Row'][]> {
    try {
      const { data, error } = await supabase
        .from('role')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching roles:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getAllRoles:', error)
      throw error
    }
  },

  async getRoleById(id: string): Promise<Role['Row'] | null> {
    try {
      const { data, error } = await supabase
        .from('role')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        console.error('Error fetching role:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in getRoleById:', error)
      throw error
    }
  },

  async createRole(roleData: Omit<Role['Insert'], 'created_at'>): Promise<Role['Row']> {
    try {
      const insertData = {
        ...roleData,
        is_active: roleData.is_active ?? true
      } as Role['Insert']
      
      console.log('Attempting to create role with data:', insertData)
      
      const { data, error } = await supabase
        .from('role')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error('Error creating role:', error)
        console.error('Insert data was:', insertData)
        throw error
      }

      console.log('Role created successfully:', data)
      return data
    } catch (error) {
      console.error('Error in createRole:', error)
      throw error
    }
  },

  async updateRole(id: string, roleData: Role['Update']): Promise<Role['Row']> {
    try {
      const { data, error } = await supabase
        .from('role')
        .update(roleData)
        .eq('id', id)
        .eq('is_active', true)
        .select()
        .single()

      if (error) {
        console.error('Error updating role:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in updateRole:', error)
      throw error
    }
  },

  async deleteRole(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('role')
        .update({ is_active: false } as Role['Update'])
        .eq('id', id)

      if (error) {
        console.error('Error deleting role:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in deleteRole:', error)
      throw error
    }
  },

  // Role Module Access operations
  async getRoleModuleAccess(roleId: string): Promise<RoleModuleAccess['Row'][]> {
    try {
      const { data, error } = await supabase
        .from('role_module_access')
        .select('*')
        .eq('role', roleId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching role module access:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getRoleModuleAccess:', error)
      throw error
    }
  },

  async createRoleModuleAccess(accessData: Omit<RoleModuleAccess['Insert'], 'id' | 'created_at'>): Promise<RoleModuleAccess['Row']> {
    try {
      const { data, error } = await supabase
        .from('role_module_access')
        .insert(accessData as RoleModuleAccess['Insert'])
        .select()
        .single()

      if (error) {
        console.error('Error creating role module access:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in createRoleModuleAccess:', error)
      throw error
    }
  },

  async updateRoleModuleAccess(id: string, accessData: RoleModuleAccess['Update']): Promise<RoleModuleAccess['Row']> {
    try {
      const { data, error } = await supabase
        .from('role_module_access')
        .update(accessData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating role module access:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in updateRoleModuleAccess:', error)
      throw error
    }
  },

  async deleteRoleModuleAccess(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('role_module_access')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting role module access:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in deleteRoleModuleAccess:', error)
      throw error
    }
  },

  // User Assignment operations
  async getAllUserAssignments(): Promise<any[]> {
    try {
      // First get the user assignments
      const { data: userAssignments, error } = await supabase
        .from('user_assignment')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user assignments:', error)
        throw error
      }

      if (!userAssignments || userAssignments.length === 0) {
        return []
      }

      // Get unique user IDs and assignment IDs
      const userIds = [...new Set(userAssignments.map(ua => ua.user))]
      const assignmentIds = [...new Set(userAssignments.map(ua => ua.assignment))]

      // Fetch users and assignments separately
      const [usersResult, assignmentsResult] = await Promise.all([
        supabase.from('users').select('id, email, username').in('id', userIds),
        supabase.from('assignment').select('id, description').in('id', assignmentIds)
      ])

      const users = usersResult.data || []
      const assignments = assignmentsResult.data || []

      // Map the data together
      const enrichedAssignments = userAssignments.map(ua => ({
        ...ua,
        users: users.find(u => u.id === ua.user),
        assignment: assignments.find(a => a.id === ua.assignment)
      }))

      return enrichedAssignments
    } catch (error) {
      console.error('Error in getAllUserAssignments:', error)
      throw error
    }
  },

  async getUserAssignments(userId: string): Promise<UserAssignment['Row'][]> {
    try {
      const { data, error } = await supabase
        .from('user_assignment')
        .select('*')
        .eq('user', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user assignments:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getUserAssignments:', error)
      throw error
    }
  },

  async getAssignmentUsers(assignmentId: string): Promise<UserAssignment['Row'][]> {
    try {
      const { data, error } = await supabase
        .from('user_assignment')
        .select('*')
        .eq('assignment', assignmentId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching assignment users:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getAssignmentUsers:', error)
      throw error
    }
  },

  async createUserAssignment(assignmentData: Omit<UserAssignment['Insert'], 'id' | 'created_at'>): Promise<UserAssignment['Row']> {
    try {
      const { data, error } = await supabase
        .from('user_assignment')
        .insert(assignmentData as UserAssignment['Insert'])
        .select()
        .single()

      if (error) {
        console.error('Error creating user assignment:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in createUserAssignment:', error)
      throw error
    }
  },

  async deleteUserAssignment(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_assignment')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting user assignment:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in deleteUserAssignment:', error)
      throw error
    }
  },

  async deleteUserAssignmentByUserAndAssignment(userId: string, assignmentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_assignment')
        .delete()
        .eq('user', userId)
        .eq('assignment', assignmentId)

      if (error) {
        console.error('Error deleting user assignment by user and assignment:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in deleteUserAssignmentByUserAndAssignment:', error)
      throw error
    }
  }
}
