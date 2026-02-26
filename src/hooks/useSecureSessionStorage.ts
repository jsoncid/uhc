import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { AuthCodeService } from '../services/authCodeService';

/**
 * Custom hook for managing secure Supabase session storage
 * This hook ensures that the user's session is properly stored in localStorage
 * and provides methods for session validation and cleanup
 */
export const useSecureSessionStorage = () => {
  
  /**
   * Initialize session storage when the hook mounts
   * Sets up session monitoring and cleanup
   */
  useEffect(() => {
    const initializeSessionStorage = async () => {
      try {
        // Ensure current session is stored securely
        await AuthCodeService.ensureSessionStorage();
        
        // Clean up any expired auth codes
        AuthCodeService.cleanupExpiredCodes();
        
        // Set up periodic cleanup (every 5 minutes)
        const cleanupInterval = setInterval(() => {
          AuthCodeService.cleanupExpiredCodes();
        }, 5 * 60 * 1000);

        // Cleanup interval on unmount
        return () => clearInterval(cleanupInterval);
      } catch (error) {
        console.error('Failed to initialize session storage:', error);
      }
    };

    initializeSessionStorage();
  }, []);

  /**
   * Listen for auth state changes and update session storage accordingly
   */
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (event === 'SIGNED_IN' && session) {
            // Store new session data
            await AuthCodeService.ensureSessionStorage();
            console.log('Session updated and stored securely');
          } else if (event === 'SIGNED_OUT') {
            // Clear ALL session data on sign out
            AuthCodeService.clearAllSessionData();
            console.log('All session data cleared on sign out');
          } else if (event === 'TOKEN_REFRESHED' && session) {
            // Update stored session with new tokens
            await AuthCodeService.ensureSessionStorage();
            console.log('Session tokens refreshed and updated');
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  /**
   * Validate that the current session is still valid
   * @returns {Promise<boolean>} - True if session is valid, false otherwise
   */
  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        // Clear invalid session data
        localStorage.removeItem('supabase_session');
        localStorage.removeItem('auth_codes');
        return false;
      }

      // Check if session is expired
      const now = Date.now() / 1000;
      if (session.expires_at && session.expires_at < now) {
        console.log('Session expired, attempting refresh...');
        
        // Try to refresh the session
        const { data: { session: refreshedSession }, error: refreshError } = 
          await supabase.auth.refreshSession();
        
        if (refreshError || !refreshedSession) {
          localStorage.removeItem('supabase_session');
          localStorage.removeItem('auth_codes');
          return false;
        }

        // Update stored session with refreshed tokens
        await AuthCodeService.ensureSessionStorage();
      }

      return true;
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  }, []);

  /**
   * Get the current stored session data
   * @returns {object|null} - Session data or null if not available
   */
  const getStoredSession = useCallback(() => {
    try {
      const storedSession = localStorage.getItem('supabase_session');
      return storedSession ? JSON.parse(storedSession) : null;
    } catch (error) {
      console.error('Error retrieving stored session:', error);
      return null;
    }
  }, []);

  /**
   * Force refresh the current session and update storage
   * @returns {Promise<boolean>} - True if refresh successful, false otherwise
   */
  const refreshAndStoreSession = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error || !session) {
        console.error('Failed to refresh session:', error);
        return false;
      }

      await AuthCodeService.ensureSessionStorage();
      return true;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
  }, []);

  /**
   * Clear all session data and auth codes
   * This function removes ALL Supabase-related localStorage keys
   */
  const clearSessionData = useCallback(() => {
    AuthCodeService.clearAllSessionData();
    console.log('All session data cleared manually via hook');
  }, []);

  return {
    validateSession,
    getStoredSession,
    refreshAndStoreSession,
    clearSessionData
  };
};