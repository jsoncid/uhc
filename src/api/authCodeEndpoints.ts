/**
 * Backend API endpoints for handling authentication codes
 * This file provides example implementations that can be adapted to your backend framework
 * (Express.js, Next.js API routes, Supabase Edge Functions, etc.)
 */

import { AuthCodeService } from '../services/authCodeService';

/**
 * POST /api/auth/generate-code
 * Generates a short-lived authentication code for mobile app deep linking
 * 
 * Example Express.js implementation:
 */
export const generateAuthCodeEndpoint = async (req: any, res: any) => {
  try {
    // Verify user is authenticated (add your auth verification logic here)
    const userSession = req.session || req.headers.authorization;
    
    if (!userSession) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Generate the auth code
    const result = await AuthCodeService.generateAuthCode();
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    // Log for security monitoring
    console.log(`Auth code generated for user at ${new Date().toISOString()}`);

    return res.json({
      success: true,
      authCode: result.authCode,
      expiresIn: 300 // 5 minutes in seconds
    });

  } catch (error) {
    console.error('Error generating auth code:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * POST /api/auth/validate-code
 * Validates an authentication code and returns session data
 * This endpoint would typically be called by your mobile app
 */
export const validateAuthCodeEndpoint = async (req: any, res: any) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authentication code is required'
      });
    }

    // Validate the auth code
    const result = await AuthCodeService.validateAuthCode(code);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    // Log successful validation for security monitoring
    console.log(`Auth code validated successfully for user ${result.userId} at ${new Date().toISOString()}`);

    return res.json({
      success: true,
      userId: result.userId,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });

  } catch (error) {
    console.error('Error validating auth code:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Supabase Edge Function implementation example
 * Create a new Edge Function in your Supabase project:
 * File: supabase/functions/auth-code/index.ts
 */
export const supabaseEdgeFunction = `
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AuthCodeData {
  code: string;
  user_id: string;
  expires_at: string;
  access_token: string;
  refresh_token: string;
  created_at: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { 
          headers: { Authorization: req.headers.get('Authorization')! } 
        } 
      }
    )

    // Get the user from the JWT token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (req.method === 'POST') {
      const { action, code } = await req.json()

      if (action === 'generate') {
        // Generate auth code logic here
        const authCode = crypto.randomUUID()
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
        
        // Store in Supabase database (create auth_codes table first)
        const { error: insertError } = await supabaseClient
          .from('auth_codes')
          .insert({
            code: authCode,
            user_id: user.id,
            expires_at: expiresAt,
            access_token: req.headers.get('Authorization')?.replace('Bearer ', ''),
            created_at: new Date().toISOString()
          })

        if (insertError) {
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to generate code' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        return new Response(
          JSON.stringify({ success: true, authCode, expiresIn: 300 }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      if (action === 'validate') {
        // Validate auth code logic here
        const { data: authCodeData } = await supabaseClient
          .from('auth_codes')
          .select('*')
          .eq('code', code)
          .gt('expires_at', new Date().toISOString())
          .single()

        if (!authCodeData) {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid or expired code' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Delete the used code
        await supabaseClient
          .from('auth_codes')
          .delete()
          .eq('code', code)

        return new Response(
          JSON.stringify({ 
            success: true, 
            userId: authCodeData.user_id,
            accessToken: authCodeData.access_token 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
`;

/**
 * Next.js API Route implementation example
 * Create file: pages/api/auth/code.ts or app/api/auth/code/route.ts
 */
export const nextjsApiRoute = `
import { NextApiRequest, NextApiResponse } from 'next';
import { AuthCodeService } from '../../../services/authCodeService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { action, code } = req.body;

    try {
      if (action === 'generate') {
        const result = await AuthCodeService.generateAuthCode();
        
        if (!result.success) {
          return res.status(400).json({ success: false, error: result.error });
        }

        return res.json({ 
          success: true, 
          authCode: result.authCode,
          expiresIn: 300 
        });
      }

      if (action === 'validate') {
        const result = await AuthCodeService.validateAuthCode(code);
        
        if (!result.success) {
          return res.status(400).json({ success: false, error: result.error });
        }

        return res.json({
          success: true,
          userId: result.userId,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken
        });
      }

      return res.status(400).json({ success: false, error: 'Invalid action' });
    } catch (error) {
      console.error('API Error:', error);
      return res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
`;

// Database schema for storing auth codes (if using database instead of localStorage)
export const authCodesTableSQL = `
-- Create auth_codes table in Supabase
CREATE TABLE auth_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster lookups
CREATE INDEX idx_auth_codes_code ON auth_codes(code);
CREATE INDEX idx_auth_codes_expires_at ON auth_codes(expires_at);

-- Add Row Level Security
ALTER TABLE auth_codes ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to manage their own auth codes
CREATE POLICY "Users can manage their own auth codes" ON auth_codes
  FOR ALL USING (auth.uid() = user_id);

-- Function to clean up expired codes (optional)
CREATE OR REPLACE FUNCTION cleanup_expired_auth_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM auth_codes WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
`;