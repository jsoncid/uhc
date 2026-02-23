import { createClient } from '@supabase/supabase-js';
import type { Module2Database } from 'src/layouts/full/vertical/sidebar/module-2/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client without default schema to access both public and module3
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// module2 schema client — use for all module2.* table queries (referrals, referral_history, etc.)
export const supabaseM2 = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'module2' },
});

// module3 schema client — use for module3.* table queries (patient_profile, etc.)
export const supabaseM3 = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'module3' },
});

export type Database = {
  public: {
    Tables: {
      // RBAC and User Management Tables (in public schema)
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          status: boolean;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
          status?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          status?: boolean;
        };
      };
      user_status: {
        Row: {
          email: string;
          created_at: string;
          is_active: boolean;
        };
        Insert: {
          email: string;
          created_at?: string;
          is_active?: boolean;
        };
        Update: {
          email?: string;
          created_at?: string;
          is_active?: boolean;
        };
      };
      role: {
        Row: {
          id: string;
          created_at: string;
          description: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          description?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          description?: string | null;
          is_active?: boolean;
        };
      };
      module: {
        Row: {
          id: string;
          created_at: string;
          description: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          description?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          description?: string | null;
          is_active?: boolean;
        };
      };
      assignment: {
        Row: {
          id: string;
          created_at: string;
          description: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          description?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          description?: string | null;
          is_active?: boolean;
        };
      };
      role_module_access: {
        Row: {
          id: string;
          created_at: string;
          role: string;
          module: string;
          is_select: boolean;
          is_insert: boolean;
          is_update: boolean;
          is_delete: boolean;
          description: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          role: string;
          module: string;
          is_select?: boolean;
          is_insert?: boolean;
          is_update?: boolean;
          is_delete?: boolean;
          description?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          role?: string;
          module?: string;
          is_select?: boolean;
          is_insert?: boolean;
          is_update?: boolean;
          is_delete?: boolean;
          description?: string | null;
        };
      };
      user_assignment: {
        Row: {
          id: string;
          created_at: string;
          user: string;
          assignment: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user: string;
          assignment: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          user?: string;
          assignment?: string;
        };
      };
    };
  };
  module3: {
    Tables: {
      // Patient and Location Tables (in module3 schema)
      patient_profile: {
        Row: {
          id: string;
          created_at: string;
          first_name: string | null;
          middle_name: string | null;
          last_name: string | null;
          ext_name: string | null;
          sex: string | null;
          birth_date: string | null;
          brgy: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          first_name?: string | null;
          middle_name?: string | null;
          last_name?: string | null;
          ext_name?: string | null;
          sex?: string | null;
          birth_date?: string | null;
          brgy?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          first_name?: string | null;
          middle_name?: string | null;
          last_name?: string | null;
          ext_name?: string | null;
          sex?: string | null;
          birth_date?: string | null;
          brgy?: string | null;
        };
      };
      brgy: {
        Row: {
          id: string;
          created_at: string;
          description: string | null;
          city_municipality: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          description?: string | null;
          city_municipality?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          description?: string | null;
          city_municipality?: string | null;
        };
      };
      city_municipality: {
        Row: {
          id: string;
          created_at: string;
          description: string | null;
          province: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          description?: string | null;
          province?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          description?: string | null;
          province?: string | null;
        };
      };
      province: {
        Row: {
          id: string;
          created_at: string;
          description: string | null;
          region: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          description?: string | null;
          region?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          description?: string | null;
          region?: string | null;
        };
      };
      region: {
        Row: {
          id: string;
          created_at: string;
          description: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          description?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          description?: string | null;
        };
      };
      patient_repository: {
        Row: {
          id: string;
          created_at: string;
          patient_profile: string | null;
          facility_code: string | null;
          hpercode: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          patient_profile?: string | null;
          facility_code?: string | null;
          hpercode?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          patient_profile?: string | null;
          facility_code?: string | null;
          hpercode?: string | null;
        };
      };
    };
  };
  module2: Module2Database;
  module1: {
    Tables: {
      office: {
        Row: {
          id: string;
          created_at: string;
          assignment: string;
          status: boolean;
          description: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          assignment: string;
          status?: boolean;
          description?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          assignment?: string;
          status?: boolean;
          description?: string | null;
        };
      };
      window: {
        Row: {
          id: string
          created_at: string
          office: string
          description: string | null
          status: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          office: string
          description?: string | null
          status?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          office?: string
          description?: string | null
          status?: boolean
        }
      }
      priority: {
        Row: {
          id: string;
          created_at: string;
          description: string | null;
          status: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          description?: string | null;
          status?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          description?: string | null;
          status?: boolean;
        };
      };
      status: {
        Row: {
          id: string;
          created_at: string;
          description: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          description?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          description?: string | null;
        };
      };
      queue: {
        Row: {
          id: string
          created_at: string
          code: string
          status: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          code: string
          status?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          code?: string
          status?: boolean
        }
      }
      sequence: {
        Row: {
          id: string
          created_at: string
          office: string
          queue: string
          priority: string
          status: string
          window: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          office: string
          queue: string
          priority: string
          status: string
          window?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          office?: string
          queue?: string
          priority?: string
          status?: string
          window?: string | null
          is_active?: boolean
        }
      }
    }
  }
}
