import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      // Add your database types here
      users: {
        Row: {
          id: string
          email: string
          created_at: string
          status: boolean
        }
        Insert: {
          id?: string
          email: string
          created_at?: string
          status?: boolean
        }
        Update: {
          id?: string
          email?: string
          created_at?: string
          status?: boolean
        }
      }
    }
  }
}
