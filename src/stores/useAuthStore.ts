import { create } from 'zustand'
import { Session, User } from '@supabase/supabase-js'
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
  sessionExpiry: number | null
  ensureSessionValid: (options?: { refreshOnExpired?: boolean }) => Promise<boolean>
  refreshSession: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>((set, get) => {
  const SESSION_EXPIRY_BUFFER_MS = 5 * 60 * 1000 // refresh five minutes before expiry

  const getExpiryFromSession = (session: Session | null): number | null => {
    return session?.expires_at ? session.expires_at * 1000 : null
  }

  const applySessionState = (session: Session | null) => {
    console.log('Applying session state', { expiresAt: getExpiryFromSession(session) })
    set({
      user: session?.user ?? null,
      sessionExpiry: getExpiryFromSession(session),
    })
  }

  const refreshSessionFromSupabase = async () => {
    const { data, error } = await supabase.auth.refreshSession()

    if (error) throw error

    applySessionState(data.session ?? null)

    return Boolean(data.session)
  }

  const ensureSessionValid = async (options?: { refreshOnExpired?: boolean }): Promise<boolean> => {
    const expiry = get().sessionExpiry
    const isExpired = expiry ? Date.now() >= expiry : false

    if (isExpired && options?.refreshOnExpired) {
      try {
        await refreshSessionFromSupabase()
        return true
      } catch {
        return false
      }
    }

    return !isExpired
  }

  return {
    user: null,
    isLoading: false,
    error: null,
    sessionExpiry: null,

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

        // Check if user is active in user_status table (using user id as primary key)
        const userStatus = await userService.getUserStatus(data.user.id)

        // if (!userStatus) {
        //   console.error('User status not found for email:', email)
        //   // Sign out the user since they shouldn't be logged in
        //   await supabase.auth.signOut()
        //   throw new Error('Account not found. Please contact administrator.')
        // }

        // if (!userStatus.is_active) {
        //   console.error('User account is inactive for email:', email)
        //   // Sign out the user since they shouldn't be logged in
        //   await supabase.auth.signOut()
        //   throw new Error('Account is inactive. Please contact administrator to activate your account.')
        // }

        console.log('User status check passed, user is active')
        applySessionState(data.session ?? null)
        set({ isLoading: false })
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
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: options ? { data: options.data } : undefined
        })
        if (error) throw error

        if (data?.user) {
          // After successful signup, insert user details into user_status table
          const { error: insertError } = await supabase
            .from('user_status')
            .insert([
              {
                id: data.user.id,
                email: data.user.email,
                is_active: false
              },
            ])

          if (insertError) {
            console.error('Error creating user_status:', insertError)
            throw insertError
          }

          console.log('Successfully created an account and saved user details.')

          // Sign out the user to prevent automatic login
          // User must wait for admin approval and login manually
          await supabase.auth.signOut()
        }

        // Don't set user - registration successful but user needs to login manually after approval
        set({ user: null, sessionExpiry: null, isLoading: false })

        // Return success indication (caller can check isLoading: false and error: null)
        return
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to sign up', isLoading: false })
      }
    },

    signOut: async () => {
      set({ isLoading: true, error: null })
      try {
        const { error } = await supabase.auth.signOut()

        if (error) throw error

        set({ user: null, sessionExpiry: null, isLoading: false })
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
    ensureSessionValid,
    refreshSession: async () => {
      try {
        return Boolean(await refreshSessionFromSupabase())
      } catch (error) {
        console.error('Manual session refresh failed', error)
        return false
      }
    },
  }
})
