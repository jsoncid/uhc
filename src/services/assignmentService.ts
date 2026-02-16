import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type Assignment = Database['public']['Tables']['assignment']

export const assignmentService = {
  async getAllAssignments(): Promise<Assignment['Row'][]> {
    try {
      const { data, error } = await supabase
        .from('assignment')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching assignments:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getAllAssignments:', error)
      throw error
    }
  },

  async getAssignmentById(id: string): Promise<Assignment['Row'] | null> {
    try {
      const { data, error } = await supabase
        .from('assignment')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        console.error('Error fetching assignment:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in getAssignmentById:', error)
      throw error
    }
  },

  async createAssignment(assignmentData: Omit<Assignment['Insert'], 'id' | 'created_at'>): Promise<Assignment['Row']> {
    try {
      const { data, error } = await supabase
        .from('assignment')
        .insert({
          ...assignmentData,
          is_active: true
        } as Assignment['Insert'])
        .select()
        .single()

      if (error) {
        console.error('Error creating assignment:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in createAssignment:', error)
      throw error
    }
  },

  async updateAssignment(id: string, assignmentData: Assignment['Update']): Promise<Assignment['Row']> {
    try {
      const { data, error } = await supabase
        .from('assignment')
        .update(assignmentData)
        .eq('id', id)
        .eq('is_active', true)
        .select()
        .single()

      if (error) {
        console.error('Error updating assignment:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in updateAssignment:', error)
      throw error
    }
  },

  async deleteAssignment(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('assignment')
        .update({ is_active: false } as Assignment['Update'])
        .eq('id', id)

      if (error) {
        console.error('Error deleting assignment:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in deleteAssignment:', error)
      throw error
    }
  },

  async searchAssignments(searchTerm: string): Promise<Assignment['Row'][]> {
    try {
      const { data, error } = await supabase
        .from('assignment')
        .select('*')
        .eq('is_active', true)
        .or(`id.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error searching assignments:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in searchAssignments:', error)
      throw error
    }
  }
}
