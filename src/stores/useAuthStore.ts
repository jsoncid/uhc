import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  userModuleId: string | null;
  userRoleId: string | null;
  userAssignmentId: string | null; // uuid → public.assignment.id
  userAssignmentName: string | null; // public.assignment.description
  isLoading: boolean;
  error: string | null;
  sessionExpiry: number | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (
    email: string,
    password: string,
    options?: { data?: { [key: string]: any }; assignmentId?: string },
  ) => Promise<boolean>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
  initialize: () => Promise<void>;
  ensureSessionValid: (options?: { refreshOnExpired?: boolean }) => Promise<boolean>;
  refreshSession: () => Promise<boolean>;
}

const fetchRoleAndModule = async (userId: string) => {
  const { data: userRole, error: roleError } = await supabase
    .from('user_role')
    .select('role')
    .eq('user', userId)
    .limit(1)
    .maybeSingle();

  if (roleError || !userRole) {
    console.error('Failed to fetch user role:', roleError);
    return { roleId: null, moduleId: null };
  }

  const { data: roleModuleAccess, error: moduleError } = await supabase
    .from('role_module_access')
    .select('module')
    .eq('role', userRole.role)
    .limit(1)
    .maybeSingle();

  if (moduleError || !roleModuleAccess) {
    console.error('Failed to fetch role module access:', moduleError);
    return { roleId: userRole.role, moduleId: null };
  }

  const { data: userAssignment, error: assignError } = await supabase
    .from('user_assignment')
    .select('assignment, is_active')
    .eq('user', userId)
    .limit(1)
    .maybeSingle();

  if (assignError) {
    console.error('Failed to fetch user assignment:', assignError);
  }

  console.log('user_assignment record:', userAssignment);

  let assignmentName: string | null = null;
  if (userAssignment?.assignment) {
    const { data: asgnData } = await supabase
      .from('assignment')
      .select('description')
      .eq('id', userAssignment.assignment)
      .single();
    assignmentName = asgnData?.description ?? null;
  }

  return {
    roleId: userRole.role as string,
    moduleId: roleModuleAccess.module as string,
    assignmentId: (userAssignment?.assignment as string) ?? null,
    assignmentName,
    isAssignmentActive: userAssignment?.is_active ?? false,
  };
};

export const useAuthStore = create<AuthState>((set, get) => {
  const SESSION_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // refresh five minutes before expiry

  const getExpiryFromSession = (session: Session | null): number | null => {
    return session?.expires_at ? session.expires_at * 1000 : null;
  };

  const applySessionState = (session: Session | null) => {
    console.log('Applying session state', { expiresAt: getExpiryFromSession(session) });
    set({
      user: session?.user ?? null,
      sessionExpiry: getExpiryFromSession(session),
    });
  };

  const refreshSessionFromSupabase = async () => {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) throw error;

    applySessionState(data.session ?? null);

    return Boolean(data.session);
  };

  const ensureSessionValid = async (options?: { refreshOnExpired?: boolean }): Promise<boolean> => {
    const expiry = get().sessionExpiry;
    const isExpired = expiry ? Date.now() >= expiry : false;
    const shouldRefresh = isExpired && expiry && Date.now() >= expiry - SESSION_EXPIRY_BUFFER_MS;

    if (shouldRefresh && options?.refreshOnExpired) {
      try {
        await refreshSessionFromSupabase();
        return true;
      } catch {
        return false;
      }
    }

    return !isExpired;
  };

  return {
    user: null,
    userModuleId: null,
    userRoleId: null,
    userAssignmentId: null,
    userAssignmentName: null,
    isLoading: false,
    error: null,
    sessionExpiry: null,

    initialize: async () => {
      set({ isLoading: true });
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          set({
            user: null,
            userModuleId: null,
            userRoleId: null,
            sessionExpiry: null,
            isLoading: false,
          });
          return;
        }

        const { roleId, moduleId, assignmentId, assignmentName } = await fetchRoleAndModule(
          session.user.id,
        );

        set({
          user: session.user,
          userModuleId: moduleId,
          userRoleId: roleId,
          userAssignmentId: assignmentId ?? null,
          userAssignmentName: assignmentName ?? null,
          sessionExpiry: getExpiryFromSession(session),
          isLoading: false,
        });
      } catch (err) {
        set({ isLoading: false });
      }
    },

    signIn: async (email, password): Promise<boolean> => {
      set({ isLoading: true, error: null });
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const { roleId, moduleId, assignmentId, assignmentName } = await fetchRoleAndModule(
          data.user.id,
        );

        set({
          user: data.user,
          userModuleId: moduleId,
          userRoleId: roleId,
          userAssignmentId: assignmentId ?? null,
          userAssignmentName: assignmentName ?? null,
          sessionExpiry: getExpiryFromSession(data.session),
          isLoading: false,
        });
        return true;
      } catch (error) {
        console.error('Login error:', error);
        set({
          error: error instanceof Error ? error.message : 'Failed to sign in',
          isLoading: false,
        });
        return false;
      }
    },

    signUp: async (email, password, options): Promise<boolean> => {
      set({ isLoading: true, error: null });
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: options ? { data: options.data } : undefined,
        });
        if (error) throw error;

        if (data?.user) {
          const { error: insertStatusError } = await supabase
            .from('user_status')
            .insert([{ id: data.user.id, email: data.user.email, is_active: false }]);

          if (insertStatusError) {
            console.error('Error creating user_status:', insertStatusError);
            throw insertStatusError;
          }

          // Persist selected assignment from registration
          if (options?.assignmentId) {
            const { error: insertAssignmentError } = await supabase
              .from('user_assignment')
              .insert({
                user: data.user.id,
                assignment: options.assignmentId,
              });

            if (insertAssignmentError) {
              console.error('Error creating user_assignment:', insertAssignmentError);
              throw insertAssignmentError;
            }
          }

          // Sign out — user must wait for admin approval
          await supabase.auth.signOut();
        }

        set({
          user: null,
          userModuleId: null,
          userRoleId: null,
          sessionExpiry: null,
          isLoading: false,
        });
        return true;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to sign up',
          isLoading: false,
        });
        return false;
      }
    },

    signOut: async () => {
      set({ isLoading: true, error: null });
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        set({
          user: null,
          userModuleId: null,
          userRoleId: null,
          userAssignmentId: null,
          userAssignmentName: null,
          sessionExpiry: null,
          isLoading: false,
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Failed to sign out',
          isLoading: false,
        });
      }
    },

    setUser: (user: User | null) => set({ user }),

    clearError: () => set({ error: null }),

    ensureSessionValid,

    refreshSession: async (): Promise<boolean> => {
      try {
        return await refreshSessionFromSupabase();
      } catch (error) {
        console.error('Manual session refresh failed', error);
        return false;
      }
    },
  };
});
