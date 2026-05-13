import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

const module1 = supabase.schema('module1');

const getUserEmailsByIds = async (userIds: string[]): Promise<Map<string, string>> => {
  const emailMap = new Map<string, string>();
  if (!userIds || userIds.length === 0) return emailMap;

  try {
    const { data, error } = await supabase
      .from('user_status')
      .select('id, email')
      .in('id', userIds);

    if (error) {
      console.warn('Failed to fetch user emails from user_status:', error);
      return emailMap;
    }

    data?.forEach((user) => {
      emailMap.set(user.id, user.email);
    });
  } catch (err) {
    console.warn('Error fetching user emails:', err);
  }

  return emailMap;
};

export interface OfficeUserAssignment {
  id: string;
  created_at: string;
  user: string;
  office: string;
  window?: string | null;
  user_email?: string;
  office_description?: string;
  window_description?: string;
}

export interface UserForAssignment {
  id: string;
  email: string;
}

export interface OfficeWindowAssignmentInput {
  officeId: string;
  windowId?: string | null;
}

interface OfficeUserAssignmentState {
  assignments: OfficeUserAssignment[];
  usersInAssignment: UserForAssignment[];
  myAssignments: OfficeUserAssignment[];
  myAssignment: OfficeUserAssignment | null;
  myAssignmentLoaded: boolean;
  isLoading: boolean;
  error: string | null;

  fetchOfficeUserAssignments: (assignmentId: string) => Promise<void>;
  fetchUsersInAssignment: (assignmentId: string) => Promise<void>;
  fetchMyAssignment: (userId: string) => Promise<void>;
  assignUserToOffice: (userId: string, officeId: string, windowId?: string | null) => Promise<void>;
  assignUserToOffices: (
    userId: string,
    assignments: OfficeWindowAssignmentInput[],
  ) => Promise<void>;
  updateUserOfficeAssignment: (assignmentId: string, newOfficeId: string, newWindowId?: string | null) => Promise<void>;
  removeUserFromOffice: (assignmentId: string) => Promise<void>;
  clearError: () => void;
}

export const useOfficeUserAssignmentStore = create<OfficeUserAssignmentState>((set, get) => ({
  assignments: [],
  usersInAssignment: [],
  myAssignments: [],
  myAssignment: null,
  myAssignmentLoaded: false,
  isLoading: false,
  error: null,

  fetchOfficeUserAssignments: async (assignmentId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Get all offices for this assignment first
      const { data: offices, error: officesError } = await module1
        .from('office')
        .select('id, description')
        .eq('assignment', assignmentId);

      if (officesError) throw officesError;

      if (!offices || offices.length === 0) {
        set({ assignments: [], isLoading: false });
        return;
      }

      const officeIds = offices.map((o) => o.id);

      // Get office user assignments for these offices
      const { data: assignmentsData, error: assignmentsError } = await module1
        .from('office_user_assignment')
        .select('*')
        .in('office', officeIds)
        .order('created_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      if (!assignmentsData || assignmentsData.length === 0) {
        set({ assignments: [], isLoading: false });
        return;
      }

      // Get user emails from user_status table
      const userIds = [...new Set(assignmentsData.map((a) => a.user))];
      const emailMap = await getUserEmailsByIds(userIds);

      // Collect unique window IDs and fetch their descriptions
      const windowIds = [...new Set(assignmentsData.map((a) => a.window).filter(Boolean))] as string[];
      let windowDescMap = new Map<string, string>();
      if (windowIds.length > 0) {
        const { data: windowsData } = await module1
          .from('window')
          .select('id, description')
          .in('id', windowIds);
        (windowsData || []).forEach((w) => {
          windowDescMap.set(w.id, w.description || 'Unnamed Window');
        });
      }

      // Enrich assignments with user emails, office descriptions, and window descriptions
      const enrichedAssignments: OfficeUserAssignment[] = assignmentsData.map((assignment) => ({
        ...assignment,
        user_email: emailMap.get(assignment.user) || 'Unknown',
        office_description: offices.find((o) => o.id === assignment.office)?.description || 'Unnamed Office',
        window_description: assignment.window ? (windowDescMap.get(assignment.window) || 'Unnamed Window') : undefined,
      }));

      set({ assignments: enrichedAssignments, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch office user assignments',
        isLoading: false,
      });
    }
  },

  fetchUsersInAssignment: async (assignmentId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Get all users who are assigned to this assignment (hospital/org)
      const { data: userAssignments, error: userAssignmentsError } = await supabase
        .from('user_assignment')
        .select('user')
        .eq('assignment', assignmentId);

      if (userAssignmentsError) throw userAssignmentsError;

      if (!userAssignments || userAssignments.length === 0) {
        set({ usersInAssignment: [], isLoading: false });
        return;
      }

      const userIds = userAssignments.map((ua) => ua.user);

      // Get user details from user_status table
      const emailMap = await getUserEmailsByIds(userIds);
      
      const usersWithEmails: UserForAssignment[] = userIds.map((id) => ({
        id,
        email: emailMap.get(id) || 'Unknown',
      }));

      set({ usersInAssignment: usersWithEmails, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch users in assignment',
        isLoading: false,
      });
    }
  },

  fetchMyAssignment: async (userId: string) => {
    try {
      const { data, error } = await module1
        .from('office_user_assignment')
        .select('*')
        .eq('user', userId)
        .order('created_at', { ascending: false });

      console.log('[fetchMyAssignment] userId:', userId, '| data:', data, '| error:', error);

      if (error) {
        console.warn('Failed to fetch my assignment:', error);
        set({ myAssignments: [], myAssignment: null, myAssignmentLoaded: true });
        return;
      }

      const rows = data || [];

      const windowIds = [...new Set(rows.map((row) => row.window).filter(Boolean))] as string[];
      const windowDescMap = new Map<string, string>();
      if (windowIds.length > 0) {
        const { data: windowsData } = await module1
          .from('window')
          .select('id, description')
          .in('id', windowIds);

        (windowsData || []).forEach((windowRow) => {
          windowDescMap.set(windowRow.id, windowRow.description || 'Unnamed Window');
        });
      }

      const enrichedRows: OfficeUserAssignment[] = rows.map((row) => ({
        ...row,
        window_description: row.window
          ? (windowDescMap.get(row.window) || 'Unnamed Window')
          : undefined,
      }));

      set({
        myAssignments: enrichedRows,
        myAssignment: enrichedRows[0] ?? null,
        myAssignmentLoaded: true,
      });
    } catch (err) {
      console.warn('Error fetching my assignment:', err);
      set({ myAssignments: [], myAssignment: null, myAssignmentLoaded: true });
    }
  },

  assignUserToOffice: async (userId: string, officeId: string, windowId?: string | null) => {
    set({ isLoading: true, error: null });
    try {
      // Check if assignment already exists
      const { data: existing, error: checkError } = await module1
        .from('office_user_assignment')
        .select('id')
        .eq('user', userId)
        .eq('office', officeId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        throw new Error('User is already assigned to this office');
      }

      const { error: insertError } = await module1
        .from('office_user_assignment')
        .insert({
          user: userId,
          office: officeId,
          window: windowId || null,
        });

      if (insertError) throw insertError;

      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to assign user to office',
        isLoading: false,
      });
      throw error;
    }
  },

  assignUserToOffices: async (userId: string, assignments: OfficeWindowAssignmentInput[]) => {
    set({ isLoading: true, error: null });
    try {
      const normalizedByOffice = new Map<string, string | null>();

      for (const assignment of assignments) {
        if (!assignment.officeId) continue;
        normalizedByOffice.set(assignment.officeId, assignment.windowId || null);
      }

      const normalized = [...normalizedByOffice.entries()].map(([officeId, windowId]) => ({
        officeId,
        windowId,
      }));

      if (normalized.length === 0) {
        throw new Error('Please add at least one office assignment');
      }

      const officeIds = normalized.map((item) => item.officeId);

      const { data: existingAssignments, error: existingError } = await module1
        .from('office_user_assignment')
        .select('office')
        .eq('user', userId)
        .in('office', officeIds);

      if (existingError) throw existingError;

      const existingOfficeIds = new Set((existingAssignments || []).map((item) => item.office));

      const rowsToInsert = normalized
        .filter((item) => !existingOfficeIds.has(item.officeId))
        .map((item) => ({
          user: userId,
          office: item.officeId,
          window: item.windowId,
        }));

      if (rowsToInsert.length === 0) {
        throw new Error('User is already assigned to all selected offices');
      }

      const { error: insertError } = await module1.from('office_user_assignment').insert(rowsToInsert);

      if (insertError) throw insertError;

      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to assign user to offices',
        isLoading: false,
      });
      throw error;
    }
  },

  updateUserOfficeAssignment: async (assignmentId: string, newOfficeId: string, newWindowId?: string | null) => {
    set({ isLoading: true, error: null });
    try {
      // Get the current assignment to check the user
      const currentAssignment = get().assignments.find((a) => a.id === assignmentId);
      if (!currentAssignment) {
        throw new Error('Assignment not found');
      }

      // Check if user is already assigned to the new office (only when office changes)
      if (newOfficeId !== currentAssignment.office) {
        const { data: existing, error: checkError } = await module1
          .from('office_user_assignment')
          .select('id')
          .eq('user', currentAssignment.user)
          .eq('office', newOfficeId)
          .neq('id', assignmentId)
          .maybeSingle();

        if (checkError) throw checkError;

        if (existing) {
          throw new Error('User is already assigned to this office');
        }
      }

      const updatePayload: Record<string, unknown> = { office: newOfficeId };
      if (newWindowId !== undefined) {
        updatePayload.window = newWindowId || null;
      }

      const { error: updateError } = await module1
        .from('office_user_assignment')
        .update(updatePayload)
        .eq('id', assignmentId);

      if (updateError) throw updateError;

      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update office assignment',
        isLoading: false,
      });
      throw error;
    }
  },

  removeUserFromOffice: async (assignmentId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error: deleteError } = await module1
        .from('office_user_assignment')
        .delete()
        .eq('id', assignmentId);

      if (deleteError) throw deleteError;

      set((state) => ({
        assignments: state.assignments.filter((a) => a.id !== assignmentId),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to remove user from office',
        isLoading: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
