import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  userModuleId: string | null
  userRoleId: string | null
  isLoading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, options?: { data?: { [key: string]: any }, assignmentId?: string }) => Promise<boolean>
  signOut: () => Promise<void>
  setUser: (user: User | null) => void
  clearError: () => void
  initialize: () => Promise<void>
}

const fetchRoleAndModule = async (userId: string) => {
  const { data: userRole, error: roleError } = await supabase
    .from('user_role')
    .select('role')
    .eq('user', userId)
    .single()

  if (roleError) {
    console.error('Failed to fetch user role:', roleError)
    return { roleId: null, moduleId: null }
  }

  const { data: roleModuleAccess, error: moduleError } = await supabase
    .from('role_module_access')
    .select('module')
    .eq('role', userRole.role)
    .single()

  if (moduleError) {
    console.error('Failed to fetch role module access:', moduleError)
    return { roleId: userRole.role, moduleId: null }
  }

  const { data: userAssignment, error: assignError } = await supabase
    .from('user_assignment')
    .select('assignment, is_active')
    .eq('user', userId)
    .single()

  if (assignError) {
    console.error('Failed to fetch user assignment:', assignError)
  }

  console.log('user_assignment record:', userAssignment)

  return {
    roleId: userRole.role as string,
    moduleId: roleModuleAccess.module as string,
    isAssignmentActive: userAssignment?.is_active ?? false,
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userModuleId: null,
  userRoleId: null,
  isLoading: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true })
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        set({ user: null, userModuleId: null, userRoleId: null, isLoading: false })
        return
      }

      const { roleId, moduleId } = await fetchRoleAndModule(session.user.id)

      set({ user: session.user, userModuleId: moduleId, userRoleId: roleId, isLoading: false })
    } catch (err) {
      set({ isLoading: false })
    }
  },

  signIn: async (email, password): Promise<boolean> => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const { roleId, moduleId } = await fetchRoleAndModule(data.user.id)

      set({ user: data.user, userModuleId: moduleId, userRoleId: roleId, isLoading: false })
      return true

    } catch (error) {
      console.error('Login error:', error)
      set({ error: error instanceof Error ? error.message : 'Failed to sign in', isLoading: false })
      return false
    }
  },

  signUp: async (email, password, options): Promise<boolean> => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: options ? { data: options.data } : undefined,
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
      return true

    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to sign up', isLoading: false })
      return false
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

  setUser: (user) => set({ user }),
  clearError: () => set({ error: null }),
}))