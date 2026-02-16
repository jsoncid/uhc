import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  isLoading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  setUser: (user: User | null) => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      set({ user: data.user, isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to sign in',
        isLoading: false 
      })
    }
  },

  signUp: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      
      if (error) throw error
      
      set({ user: data.user, isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to sign up',
        isLoading: false 
      })
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null })
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) throw error
      
      set({ user: null, isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to sign out',
        isLoading: false 
      })
    }
  },

  setUser: (user: User | null) => {
    set({ user })
  },

  clearError: () => {
    set({ error: null })
  },
}))
