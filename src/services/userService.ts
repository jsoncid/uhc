import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/supabase';

export interface UserWithStatus {
  id: string;
  email: string;
  name?: string;
  is_active: boolean;
  created_at: string;
}

type UserStatus = Database['public']['Tables']['user_status'];

// Custom UserRole type since user_role table may not be in generated types yet
type UserRole = {
  id: string;
  user: string;
  role: string;
  created_at: string;
};

interface AuthUser {
  id: string;
  email?: string;
  created_at: string;
  username?: string | null;
}

export interface UserProfileData {
  id: string;
  email: string;
  isActive: boolean;
  profilePictureUrl?: string;
  name?: string;
  roles: Array<{
    id: string;
    description: string;
    modules: Array<{
      id: string;
      description: string;
      permissions: {
        is_select: boolean;
        is_insert: boolean;
        is_update: boolean;
        is_delete: boolean;
      };
    }>;
  }>;
  assignments: Array<{ id: string; description: string }>;
  modules: Array<{
    id: string;
    description: string;
    permissions: { is_select: boolean; is_insert: boolean; is_update: boolean; is_delete: boolean };
  }>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://uhc-backend.180.232.187.222.sslip.io/api';

export const userService = {
  // Fetch users from backend API (connects to auth.users via PostgreSQL)
  async getAllUsersFromAPI(): Promise<AuthUser[]> {
    try {
      const response = await fetch(`${API_URL}/api/users`);
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }
      const json = await response.json();
      // Handle new backend response format: { success, count, data }
      if (json.success && json.data) {
        return json.data;
      }
      // Fallback for old format (direct array)
      return Array.isArray(json) ? json : [];
    } catch (error) {
      console.error('Error fetching users from API:', error);
      throw error;
    }
  },

  async getUsersByIds(ids: string[]): Promise<AuthUser[]> {
    try {
      if (!ids || ids.length === 0) return [];

      const response = await fetch(`${API_URL}/api/users/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }
      const data = await response.json();
      // Handle various API response formats (raw array, { success, data }, { users: [...] })
      if (data?.success && data?.data) return data.data;
      return Array.isArray(data) ? data : (data?.users ?? data?.data ?? []);
    } catch (error) {
      console.error('Error fetching users by IDs:', error);
      throw error;
    }
  },

  async createUserStatus(payload: { email: string; isActive?: boolean }): Promise<void> {
    try {
      console.log('Attempting to create user status for email:', payload.email);

      const insertPayload: UserStatus['Insert'] = {
        email: payload.email,
        is_active: payload.isActive ?? false,
      };

      const { error } = await supabase.from('user_status').insert(insertPayload);

      if (error) {
        console.error('Error creating user status:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('User status created successfully');
    } catch (error) {
      console.error('Error in createUserStatus:', error);
      throw error;
    }
  },

  async updateUserStatus(
    userId: string,
    updates: { isActive?: boolean; email?: string },
  ): Promise<void> {
    try {
      const updatePayload: Partial<UserStatus['Update']> = {};

      if (updates.email) {
        updatePayload.email = updates.email;
      }

      if (updates.isActive !== undefined) {
        updatePayload.is_active = updates.isActive;
      }

      const { error } = await supabase.from('user_status').update(updatePayload).eq('id', userId);

      if (error) {
        console.error('Error updating user status:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateUserStatus:', error);
      throw error;
    }
  },

  async deleteUserStatus(userId: string): Promise<void> {
    try {
      const { error } = await supabase.from('user_status').delete().eq('id', userId);

      if (error) {
        console.error('Error deleting user status:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteUserStatus:', error);
      throw error;
    }
  },

  async getUserStatus(userId: string): Promise<UserStatus['Row'] | null> {
    try {
      const { data, error } = await supabase
        .from('user_status')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned, user doesn't exist in status table
          return null;
        }
        console.error('Error fetching user status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserStatus:', error);
      throw error;
    }
  },

  async getAllUsers(): Promise<AuthUser[]> {
    try {
      // First try to fetch from backend API (preferred method)
      try {
        const users = await this.getAllUsersFromAPI();
        if (users && users.length > 0) {
          return users;
        }
      } catch (apiError) {
        console.warn('Could not fetch from API, falling back to current user:', apiError);
      }

      // Fallback: Get current authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No authenticated user found');
      }

      return [
        {
          id: user.id,
          email: user.email || '',
          created_at: user.created_at,
        },
      ];
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      throw error;
    }
  },

  // User Role operations
  async getAllUserRoles(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_role')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user roles:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Get unique user IDs and role IDs, filtering out null/undefined
      const userIds = [...new Set(data.map((ur: UserRole) => ur.user))].filter(id => id != null);
      const roleIds = [...new Set(data.map((ur: UserRole) => ur.role))].filter(id => id != null);

      // Fetch users from backend API and roles from Supabase
      const users = await this.getUsersByIds(userIds).catch((err) => {
        console.warn('Failed to fetch users from API:', err);
        return [];
      });
      
      // Only fetch roles if we have valid IDs
      const roles = roleIds.length > 0
        ? (await supabase.from('role').select('id, description').in('id', roleIds)).data || []
        : [];

      // Map the data together
      const enrichedUserRoles = data.map((ur: UserRole) => ({
        ...ur,
        users: users.find((u) => u.id === ur.user),
        roleData: roles.find((r) => r.id === ur.role),
      }));

      return enrichedUserRoles;
    } catch (error) {
      console.error('Error in getAllUserRoles:', error);
      throw error;
    }
  },

  async createUserRole(userRole: Omit<UserRole, 'id' | 'created_at'>): Promise<UserRole> {
    try {
      const { data, error } = await supabase.from('user_role').insert(userRole).select().single();

      if (error) {
        console.error('Error creating user role:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createUserRole:', error);
      throw error;
    }
  },

  async deleteUserRole(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('user_role').delete().eq('id', id);

      if (error) {
        console.error('Error deleting user role:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteUserRole:', error);
      throw error;
    }
  },

  // Get current user's complete profile from RBAC tables
  async getCurrentUserProfile(): Promise<UserProfileData | null> {
    try {
      // Get current authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log('No authenticated user');
        return null;
      }

      // Get user status by email from user_status table
      // Using maybeSingle() to avoid 406 error when no row exists
      const { data: statusData } = await supabase
        .from('user_status')
        .select('is_active')
        .eq('email', user.email)
        .maybeSingle();

      // Default to false if no status record found
      const isActive = statusData?.is_active ?? false;

      // Get user's roles with role descriptions
      const { data: userRoles } = await supabase
        .from('user_role')
        .select(
          `
          id,
          role (
            id,
            description,
            is_active
          )
        `,
        )
        .eq('user', user.id);

      // Get user's assignments with assignment descriptions
      const { data: userAssignments } = await supabase
        .from('user_assignment')
        .select(
          `
          id,
          assignment (
            id,
            description,
            is_active
          )
        `,
        )
        .eq('user', user.id);

      // Get modules the user can access based on their roles
      const roleIds = userRoles?.map((ur: any) => ur.role?.id).filter(Boolean) || [];

      let roleModuleAccess: any[] = [];
      if (roleIds.length > 0) {
        const { data: moduleAccess } = await supabase
          .from('role_module_access')
          .select(
            `
            role,
            is_select,
            is_insert,
            is_update,
            is_delete,
            module (
              id,
              description,
              is_active
            )
          `,
          )
          .in('role', roleIds);

        roleModuleAccess = moduleAccess || [];
      }

      // Transform the data - map modules to roles
      const roles =
        userRoles
          ?.filter((ur: any) => ur.role?.is_active)
          .map((ur: any) => {
            const roleId = ur.role.id;
            const roleModules = roleModuleAccess
              .filter((ma: any) => ma.role === roleId && ma.module?.is_active)
              .map((ma: any) => ({
                id: ma.module.id,
                description: ma.module.description || 'No description',
                permissions: {
                  is_select: ma.is_select,
                  is_insert: ma.is_insert,
                  is_update: ma.is_update,
                  is_delete: ma.is_delete,
                },
              }));

            return {
              id: roleId,
              description: ur.role.description || 'No description',
              modules: roleModules,
            };
          }) || [];

      const assignments =
        userAssignments
          ?.filter((ua: any) => ua.assignment?.is_active)
          .map((ua: any) => ({
            id: ua.assignment.id,
            description: ua.assignment.description || 'No description',
          })) || [];

      // Dedupe modules and merge permissions (for backward compatibility)
      const moduleMap = new Map<string, any>();
      roleModuleAccess.forEach((ma: any) => {
        if (ma.module?.is_active) {
          const existing = moduleMap.get(ma.module.id);
          if (existing) {
            // Merge permissions (OR)
            existing.permissions.is_select = existing.permissions.is_select || ma.is_select;
            existing.permissions.is_insert = existing.permissions.is_insert || ma.is_insert;
            existing.permissions.is_update = existing.permissions.is_update || ma.is_update;
            existing.permissions.is_delete = existing.permissions.is_delete || ma.is_delete;
          } else {
            moduleMap.set(ma.module.id, {
              id: ma.module.id,
              description: ma.module.description || 'No description',
              permissions: {
                is_select: ma.is_select,
                is_insert: ma.is_insert,
                is_update: ma.is_update,
                is_delete: ma.is_delete,
              },
            });
          }
        }
      });

      return {
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name,
        isActive,
        roles,
        assignments,
        modules: Array.from(moduleMap.values()),
      };
    } catch (error) {
      console.error('Error in getCurrentUserProfile:', error);
      throw error;
    }
  },

  // User Acceptance operations
  async getUsersWithStatus(): Promise<UserWithStatus[]> {
    try {
      const { data, error } = await supabase.rpc('get_users_with_status');

      if (error) {
        console.error('Error fetching users with status:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUsersWithStatus:', error);
      throw error;
    }
  },

  async getPendingUsers(): Promise<
    { id: string; email: string; name: string; is_active: boolean; created_at: string }[]
  > {
    try {
      const { data, error } = await supabase.rpc('get_pending_users');

      if (error) {
        console.error('Error fetching pending users:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPendingUsers:', error);
      throw error;
    }
  },

  async approveUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('approve_user', { user_id: userId });

      if (error) {
        console.error('Error approving user:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in approveUser:', error);
      throw error;
    }
  },

  async rejectUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('reject_user', { user_id: userId });

      if (error) {
        console.error('Error rejecting user:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in rejectUser:', error);
      throw error;
    }
  },

  // Upload user profile picture
  async uploadProfilePicture(file: File, userName: string, userId: string): Promise<string> {
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file (JPG, PNG, etc.)');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be under 5 MB');
      }

      const ext = file.name.split('.').pop() ?? 'jpg';
      // Sanitize the user name for folder path
      const safeName = userName.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/\s+/g, '_');
      const path = `${safeName}/${userId}_${Date.now()}.${ext}`;

      // Remove ALL existing profile pictures for this user in their folder
      try {
        const { data: existing } = await supabase.storage
          .from('user_profile')
          .list(safeName, { limit: 100 });
        
        if (existing && existing.length > 0) {
          const toRemove = existing
            .filter((f) => f.name.startsWith(userId))
            .map((f) => `${safeName}/${f.name}`);
          
          if (toRemove.length > 0) {
            await supabase.storage.from('user_profile').remove(toRemove);
          }
        }
      } catch (listError) {
        // Folder might not exist yet, that's okay
        console.log('Folder does not exist yet, will be created on upload');
      }

      // Upload new file (folder will be created automatically)
      const { error: uploadError } = await supabase.storage
        .from('user_profile')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(uploadError.message || 'Failed to upload profile picture');
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('user_profile')
        .getPublicUrl(path);

      return publicUrlData.publicUrl + '?t=' + Date.now();
    } catch (error) {
      console.error('Error in uploadProfilePicture:', error);
      throw error;
    }
  },

  // Get user profile picture URL
  async getProfilePictureUrl(userName: string, userId: string): Promise<string | null> {
    try {
      const safeName = userName.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/\s+/g, '_');
      const { data: files } = await supabase.storage
        .from('user_profile')
        .list(safeName, { limit: 100 });
      
      const match = files?.find((f) => f.name.startsWith(userId));
      if (match) {
        const { data: publicUrlData } = supabase.storage
          .from('user_profile')
          .getPublicUrl(`${safeName}/${match.name}`);
        
        return publicUrlData.publicUrl + '?t=' + Date.now();
      }
      
      return null;
    } catch (error) {
      console.error('Error in getProfilePictureUrl:', error);
      return null;
    }
  },

  // Update user name in metadata (updates current user)
  async updateUserProfileName(userId: string, name: string): Promise<void> {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error(sessionError?.message || 'No active session found. Please sign in again.');
      }

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/user`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            data: {
              name: name,
            },
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData?.msg || errorData?.message || 'Failed to update user name');
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error('Error in updateUserProfileName:', error);
      throw error;
    }
  },

  // Admin functions for user management
  async createUserAdmin(userData: {
    email: string;
    password: string;
    name?: string;
    isActive?: boolean;
  }): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      // Note: This requires the Supabase Service Role Key on the backend
      // In production, this should be a server-side API call
      const response = await fetch(`${API_URL}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          name: userData.name,
          isActive: userData.isActive ?? true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create user' }));
        throw new Error(errorData.message || 'Failed to create user');
      }

      const result = await response.json();
      return {
        success: true,
        userId: result.userId || result.id,
      };
    } catch (error) {
      console.error('Error in createUserAdmin:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user',
      };
    }
  },

  async updateUserAdmin(
    userId: string,
    updates: {
      email?: string;
      name?: string;
      isActive?: boolean;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update user_status table for active status only
      const statusUpdates: any = {};
      if (updates.isActive !== undefined) {
        statusUpdates.is_active = updates.isActive;
      }
      
      if (Object.keys(statusUpdates).length > 0) {
        const { data: existingStatus } = await supabase
          .from('user_status')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (existingStatus) {
          const { error: updateError } = await supabase
            .from('user_status')
            .update(statusUpdates)
            .eq('id', userId);

          if (updateError) {
            throw updateError;
          }
        } else {
          // Create status record if it doesn't exist
          const { error: insertError } = await supabase
            .from('user_status')
            .insert({
              id: userId,
              email: updates.email || '',
              ...statusUpdates,
            });

          if (insertError) {
            throw insertError;
          }
        }
      }

      // Update email or name via backend API (requires service role key)
      if (updates.email || updates.name) {
        const response = await fetch(`${API_URL}/admin/users/${userId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email: updates.email,
            name: updates.name 
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to update user' }));
          throw new Error(errorData.message || 'Failed to update user');
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateUserAdmin:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user',
      };
    }
  },

  async resetUserPassword(
    userId: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // This requires backend API with service role key
      const response = await fetch(`${API_URL}/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to reset password' }));
        throw new Error(errorData.message || 'Failed to reset password');
      }

      return { success: true };
    } catch (error) {
      console.error('Error in resetUserPassword:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset password',
      };
    }
  },

  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error in sendPasswordResetEmail:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send password reset email',
      };
    }
  },

  async generatePasswordResetLink(email: string): Promise<{ success: boolean; link?: string; error?: string }> {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
        throw new Error('Backend API URL not configured. Please set VITE_API_URL in your .env file');
      }

      const response = await fetch(`${apiUrl}/api/admin/users/generate-reset-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          // Ensure error is a string, not an object
          if (errorData.error) {
            errorMessage = typeof errorData.error === 'string' 
              ? errorData.error 
              : JSON.stringify(errorData.error);
          } else if (errorData.message) {
            errorMessage = typeof errorData.message === 'string'
              ? errorData.message
              : JSON.stringify(errorData.message);
          }
        } catch {
          // Response wasn't JSON, use the status message
          if (response.status === 404) {
            errorMessage = 'Backend endpoint not found. Please implement the /api/admin/users/generate-reset-link endpoint';
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return { success: true, link: data.resetLink };
    } catch (error) {
      console.error('Error in generatePasswordResetLink:', error);
      let errorMessage = 'Failed to generate password reset link';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        errorMessage = JSON.stringify(error);
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  async toggleUserStatus(userId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('user_status')
        .update({ is_active: isActive })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error in toggleUserStatus:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle user status',
      };
    }
  },
};
