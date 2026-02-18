import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { userService } from '@/services/userService';

interface AuthProviderProps {
  children: React.ReactNode;
}

const checkUserActiveStatus = async (userId: string): Promise<boolean> => {
  try {
    const userStatus = await userService.getUserStatus(userId);
    return userStatus?.is_active === true;
  } catch (error) {
    console.error('Error checking user active status:', error);
    return false;
  }
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { setUser } = useAuthStore();

  useEffect(() => {
    // Get initial session and verify user is active
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const isActive = await checkUserActiveStatus(session.user.id);
        if (isActive) {
          setUser(session.user);
        } else {
          // User is not active, sign them out
          console.log('User is not active, signing out...');
          await supabase.auth.signOut();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });

    // Listen for auth changes and verify user is active
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Skip handling for SIGNED_IN - useAuthStore.signIn already handles the active check
      // This prevents a race condition where AuthProvider and signIn both check status
      if (event === 'SIGNED_IN') {
        return;
      }
      
      if (session?.user) {
        const isActive = await checkUserActiveStatus(session.user.id);
        if (isActive) {
          setUser(session.user);
        } else {
          // User is not active, sign them out
          console.log('User is not active, signing out...');
          await supabase.auth.signOut();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  return <>{children}</>;
};
