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
  }
}
