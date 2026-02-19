import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  userModuleId: string | null
  userRoleId: string | null
  isLoading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, options?: { data?: { [key: string]: any } }) => Promise<void>
  signOut: () => Promise<void>
  setUser: (user: User | null) => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userModuleId: null,
  userRoleId: null,
  isLoading: false,
  error: null,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const { data: assignment, error: assignError } = await supabase
        .from('user_assignment')
        .select('module_id, role_id')
        .eq('user_id', data.user.id)
        .single()

      if (assignError) {
        console.error('Failed to fetch user assignment:', assignError)
      }

      console.log('Assignment fetched:', assignment)

      set({
        user: data.user,
        userModuleId: assignment?.module_id ?? null,
        userRoleId: assignment?.role_id ?? null,
        isLoading: false,
      })
    } catch (error) {
      console.error('Login error:', error)
      set({
        error: error instanceof Error ? error.message : 'Failed to sign in',
        isLoading: false,
      })
    }
  },

  signUp: async (email: string, password: string, options?: { data?: { [key: string]: any } }) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: options ? { data: options.data } : undefined
      })
      if (error) throw error

      if (data?.user) {
        const { error: insertError } = await supabase
          .from('user_status')
          .insert([{ id: data.user.id, email: data.user.email, is_active: false }])

        if (insertError) throw insertError

        await supabase.auth.signOut()
      }

      set({ user: null, userModuleId: null, userRoleId: null, isLoading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to sign up', isLoading: false })
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      set({ user: null, userModuleId: null, userRoleId: null, isLoading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to sign out', isLoading: false })
    }
  },

  setUser: (user: User | null) => set({ user }),
  clearError: () => set({ error: null }),
}))