import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

type Module = Database['module3']['Tables']['module']

export const moduleService = {
  async getAllModules(): Promise<Module['Row'][]> {
    try {
      const { data, error } = await supabase
        .from('module')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching modules:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in getAllModules:', error)
      throw error
    }
  },

  async getModuleById(id: string): Promise<Module['Row'] | null> {
    try {
      const { data, error } = await supabase
        .from('module')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        console.error('Error fetching module:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in getModuleById:', error)
      throw error
    }
  },

  async createModule(moduleData: Omit<Module['Insert'], 'id' | 'created_at'>): Promise<Module['Row']> {
    try {
      const { data, error } = await supabase
        .from('module')
        .insert({
          ...moduleData,
          is_active: true
        } as Module['Insert'])
        .select()
        .single()

      if (error) {
        console.error('Error creating module:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in createModule:', error)
      throw error
    }
  },

  async updateModule(id: string, moduleData: Module['Update']): Promise<Module['Row']> {
    try {
      const { data, error } = await supabase
        .from('module')
        .update(moduleData)
        .eq('id', id)
        .eq('is_active', true)
        .select()
        .single()

      if (error) {
        console.error('Error updating module:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error in updateModule:', error)
      throw error
    }
  },

  async deleteModule(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('module')
        .update({ is_active: false } as Module['Update'])
        .eq('id', id)

      if (error) {
        console.error('Error deleting module:', error)
        throw error
      }
    } catch (error) {
      console.error('Error in deleteModule:', error)
      throw error
    }
  },

  async searchModules(searchTerm: string): Promise<Module['Row'][]> {
    try {
      const { data, error } = await supabase
        .from('module')
        .select('*')
        .eq('is_active', true)
        .or(`id.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error searching modules:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error in searchModules:', error)
      throw error
    }
  }
}
