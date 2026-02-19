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
  const { setUser, initialize } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const isActive = await checkUserActiveStatus(session.user.id);
        if (isActive) {
          await initialize(); 
        } else {
          console.log('User is not active, signing out...');
          await supabase.auth.signOut();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') return;

      if (session?.user) {
        const isActive = await checkUserActiveStatus(session.user.id);
        if (isActive) {
          await initialize(); 
        } else {
          console.log('User is not active, signing out...');
          await supabase.auth.signOut();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []); 

  return <>{children}</>;
};