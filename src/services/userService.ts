import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type UserStatus = Database['public']['Tables']['user_status']

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
  }
}
