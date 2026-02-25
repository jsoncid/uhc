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
      user_status: {
        Row: {
          email: string
          created_at: string
          is_active: boolean
        }
        Insert: {
          email: string
          created_at?: string
          is_active?: boolean
        }
        Update: {
          email?: string
          created_at?: string
          is_active?: boolean
        }
      }
      role: {
        Row: {
          id: string
          created_at: string
          description: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          description?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          description?: string | null
          is_active?: boolean
        }
      }
      module: {
        Row: {
          id: string
          created_at: string
          description: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          description?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          description?: string | null
          is_active?: boolean
        }
      }
      assignment: {
        Row: {
          id: string
          created_at: string
          description: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          description?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          description?: string | null
          is_active?: boolean
        }
      }
      role_module_access: {
        Row: {
          id: string
          created_at: string
          role: string
          module: string
          is_select: boolean
          is_insert: boolean
          is_update: boolean
          is_delete: boolean
          description: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          role: string
          module: string
          is_select?: boolean
          is_insert?: boolean
          is_update?: boolean
          is_delete?: boolean
          description?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          role?: string
          module?: string
          is_select?: boolean
          is_insert?: boolean
          is_update?: boolean
          is_delete?: boolean
          description?: string | null
        }
      }
      user_assignment: {
        Row: {
          id: string
          created_at: string
          user: string
          assignment: string
        }
        Insert: {
          id?: string
          created_at?: string
          user: string
          assignment: string
        }
        Update: {
          id?: string
          created_at?: string
          user?: string
          assignment?: string
        }
      }
      office: {
        Row: {
          id: string
          created_at: string
          assignment: string
          status: boolean
          description: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          assignment: string
          status?: boolean
          description?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          assignment?: string
          status?: boolean
          description?: string | null
        }
      }
      window: {
        Row: {
          id: number
          created_at: string
          office: string
          description: string | null
          status: boolean
        }
        Insert: {
          id?: number
          created_at?: string
          office: string
          description?: string | null
          status?: boolean
        }
        Update: {
          id?: number
          created_at?: string
          office?: string
          description?: string | null
          status?: boolean
        }
      }
    }
  }
  module1: {
    Tables: {
      priority: {
        Row: {
          id: string
          created_at: string
          description: string | null
          status: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          description?: string | null
          status?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          description?: string | null
          status?: boolean
        }
      }
      status: {
        Row: {
          id: string
          created_at: string
          description: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          description?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          description?: string | null
        }
      }
      queue: {
        Row: {
          id: number
          created_at: string
          code: string
          status: boolean
        }
        Insert: {
          id?: number
          created_at?: string
          code: string
          status?: boolean
        }
        Update: {
          id?: number
          created_at?: string
          code?: string
          status?: boolean
        }
      }
      sequence: {
        Row: {
          id: number
          created_at: string
          office: string
          queue: string
          priority: string
          status: string
        }
        Insert: {
          id?: number
          created_at?: string
          office: string
          queue: string
          priority: string
          status: string
        }
        Update: {
          id?: number
          created_at?: string
          office?: string
          queue?: string
          priority?: string
          status?: string
        }
      }
    }
  }
  module5: {
    Tables: {
      scribble_text: {
        Row: {
          id: string
          created_at: string
          user_id: string
          input_uuid: string
          content: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          input_uuid: string
          content?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          input_uuid?: string
          content?: string | null
        }
      }
    }
  }
}
