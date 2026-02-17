import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { userService } from '@/services/userService'

interface AuthState {
  user: User | null
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
  isLoading: false,
  error: null,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      console.log('Starting login for email:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('Supabase signIn error:', error)
        throw error
      }
      
      console.log('Supabase auth successful, checking user status...')
      
      // Check if user is active in user_status table
      const userStatus = await userService.getUserStatus(email)
      
      if (!userStatus.is_active) {
        console.error('User account is inactive for email:', email)
        // Sign out the user since they shouldn't be logged in
        await supabase.auth.signOut()
        throw new Error('Account is inactive. Please contact administrator to activate your account.')
      }
      
      console.log('User status check passed, user is active')
      set({ user: data.user, isLoading: false })
    } catch (error) {
      console.error('Login error:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to sign in',
        isLoading: false 
      })
    }
  },

  signUp: async (email: string, password: string, options?: { data?: { [key: string]: any } }) => {
    set({ isLoading: true, error: null })
    try {
      console.log('Starting registration for email:', email)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: options?.data
        }
      })
      
      if (error) {
        console.error('Supabase signUp error:', error)
        throw error
      }
      
      console.log('Supabase auth successful, user:', data.user)
      
      // Create user status record in auth_extension.user_status table
      if (data.user) {
        console.log('Creating user status record for email:', email)
        await userService.createUserStatus(email)
        console.log('User status record created successfully')
      }
      
      set({ user: data.user, isLoading: false })
    } catch (error) {
      console.error('Registration error:', error)
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
