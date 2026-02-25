import { supabase } from '../lib/supabase';

// Duration for auth code validity (5 minutes in milliseconds)
const AUTH_CODE_EXPIRY = 5 * 60 * 1000;

/**
 * Generate a simple UUID for auth codes
 * Using crypto.randomUUID() if available, otherwise fallback to timestamp + random
 */
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback UUID generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export interface AuthCodeData {
  code: string;
  user_id: string;
  expires_at: string;
  access_token: string;
  refresh_token: string;
  created_at: string;
}

export interface GenerateAuthCodeResponse {
  success: boolean;
  authCode?: string;
  error?: string;
}

export interface ValidateAuthCodeResponse {
  success: boolean;
  userId?: string;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

/**
 * Service for managing short-lived authentication codes for mobile app deep linking
 * This service generates secure auth codes that can be used to authenticate users
 * in mobile apps without requiring them to log in again
 */
export class AuthCodeService {
  
  /**
   * Generates a short-lived authentication code using the current Supabase session
   * The code includes the user's access and refresh tokens for seamless authentication
   * 
   * @returns Promise<GenerateAuthCodeResponse> - Contains the generated auth code or error
   */
  static async generateAuthCode(): Promise<GenerateAuthCodeResponse> {
    try {
      // Get the current session from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        return {
          success: false,
          error: 'No active session found. Please log in again.'
        };
      }

      // Generate a unique auth code
      const authCode = generateUUID();
      const expiresAt = new Date(Date.now() + AUTH_CODE_EXPIRY).toISOString();
      
      // Store the auth code in Supabase with session tokens
      // Note: In production, consider using a separate table for auth codes
      const authCodeData: AuthCodeData = {
        code: authCode,
        user_id: session.user.id,
        expires_at: expiresAt,
        access_token: session.access_token,
        refresh_token: session.refresh_token || '',
        created_at: new Date().toISOString()
      };

      // Store in localStorage temporarily (in production, use a database table)
      const existingCodes = JSON.parse(localStorage.getItem('auth_codes') || '[]');
      existingCodes.push(authCodeData);
      
      // Clean up expired codes while we're at it
      const validCodes = existingCodes.filter((code: AuthCodeData) => 
        new Date(code.expires_at) > new Date()
      );
      
      localStorage.setItem('auth_codes', JSON.stringify(validCodes));

      return {
        success: true,
        authCode: authCode
      };

    } catch (error) {
      console.error('Error generating auth code:', error);
      return {
        success: false,
        error: 'Failed to generate authentication code'
      };
    }
  }

  /**
   * Validates an authentication code and returns the associated session data
   * This method is typically called by the mobile app to authenticate the user
   * 
   * @param code - The authentication code to validate
   * @returns Promise<ValidateAuthCodeResponse> - Contains session data or error
   */
  static async validateAuthCode(code: string): Promise<ValidateAuthCodeResponse> {
    try {
      // Retrieve auth codes from storage
      const authCodes: AuthCodeData[] = JSON.parse(localStorage.getItem('auth_codes') || '[]');
      
      // Find the matching code
      const authCodeData = authCodes.find(item => item.code === code);
      
      if (!authCodeData) {
        return {
          success: false,
          error: 'Invalid authentication code'
        };
      }

      // Check if the code has expired
      if (new Date(authCodeData.expires_at) <= new Date()) {
        // Clean up expired code
        const validCodes = authCodes.filter(item => item.code !== code);
        localStorage.setItem('auth_codes', JSON.stringify(validCodes));
        
        return {
          success: false,
          error: 'Authentication code has expired'
        };
      }

      // Code is valid, return session data
      // Remove the used code for security (one-time use)
      const remainingCodes = authCodes.filter(item => item.code !== code);
      localStorage.setItem('auth_codes', JSON.stringify(remainingCodes));

      return {
        success: true,
        userId: authCodeData.user_id,
        accessToken: authCodeData.access_token,
        refreshToken: authCodeData.refresh_token
      };

    } catch (error) {
      console.error('Error validating auth code:', error);
      return {
        success: false,
        error: 'Failed to validate authentication code'
      };
    }
  }

  /**
   * Ensures the Supabase session is properly stored in localStorage
   * This method should be called during app initialization or after login
   */
  static async ensureSessionStorage(): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Store session data securely in localStorage
        const sessionData = {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          user: {
            id: session.user.id,
            email: session.user.email
          },
          stored_at: new Date().toISOString()
        };
        
        localStorage.setItem('supabase_session', JSON.stringify(sessionData));
      }
    } catch (error) {
      console.error('Error storing session:', error);
    }
  }

  /**
   * Cleans up expired authentication codes from localStorage
   * This method should be called periodically to maintain storage hygiene
   */
  static cleanupExpiredCodes(): void {
    try {
      const authCodes: AuthCodeData[] = JSON.parse(localStorage.getItem('auth_codes') || '[]');
      const validCodes = authCodes.filter(code => new Date(code.expires_at) > new Date());
      localStorage.setItem('auth_codes', JSON.stringify(validCodes));
    } catch (error) {
      console.error('Error cleaning up expired codes:', error);
    }
  }

  /**
   * Comprehensive cleanup of ALL session and auth-related localStorage data
   * This method removes all Supabase and authentication-related keys
   */
  static clearAllSessionData(): void {
    try {
      // Remove our custom session storage
      localStorage.removeItem('supabase_session');
      localStorage.removeItem('auth_codes');
      
      // Remove Supabase's default storage keys
      localStorage.removeItem('uhc-supabase-auth-token');
      
      // Clean up any other potential Supabase keys
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('supabase') || 
          key.includes('auth-token') || 
          key.startsWith('sb-') ||
          key.includes('access_token') ||
          key.includes('refresh_token')
        )) {
          keysToRemove.push(key);
        }
      }
      
      // Remove all identified keys
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`AuthCodeService cleared localStorage key: ${key}`);
      });
      
      console.log('AuthCodeService: All session data cleared successfully');
    } catch (error) {
      console.error('Error clearing all session data:', error);
    }
  }
}