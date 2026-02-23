import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

const module1 = supabase.schema('module1');

export interface Priority {
  id: string;
  created_at: string;
  description: string | null;
  status: boolean;
}

export interface Status {
  id: string;
  created_at: string;
  description: string | null;
  status: boolean;
}

export interface Queue {
  id: string;
  created_at: string;
  code: string;
  status: boolean;
}

export interface Sequence {
  id: string;
  created_at: string;
  office: string;
  queue: string;
  priority: string;
  status: string;
  window?: string | null;
  is_active: boolean;
  office_data?: { id: string; description: string };
  queue_data?: Queue;
  priority_data?: Priority;
  status_data?: Status;
  window_data?: { id: string; description: string | null };
}

interface QueueState {
  sequences: Sequence[];
  priorities: Priority[];
  allPriorities: Priority[];
  statuses: Status[];
  isLoading: boolean;
  error: string | null;

  fetchPriorities: () => Promise<void>;
  fetchAllPriorities: () => Promise<void>;
  addPriority: (description: string) => Promise<void>;
  updatePriority: (id: string, description: string, status: boolean) => Promise<void>;
  deletePriority: (id: string) => Promise<void>;
  fetchStatuses: () => Promise<void>;
  addStatus: (description: string) => Promise<void>;
  updateStatus: (id: string, description: string, status: boolean) => Promise<void>;
  deleteStatus: (id: string) => Promise<void>;
  fetchSequences: (officeId?: string) => Promise<void>;
  generateQueueCode: (officeId: string, priorityId: string) => Promise<string | null>;
  updateSequenceStatus: (sequenceId: string, statusId: string, windowId?: string | null) => Promise<void>;
  transferSequence: (sequenceId: string, targetOfficeId: string, targetWindowId?: string | null) => Promise<void>;
  isWindowAvailable: (windowId: string) => boolean;
  getServingSequenceForWindow: (windowId: string) => Sequence | undefined;
  subscribeToSequences: () => () => void;
  clearError: () => void;
}



export const useQueueStore = create<QueueState>((set, get) => ({
  sequences: [],
  priorities: [],
  allPriorities: [],
  statuses: [],
  isLoading: false,
  error: null,

  fetchPriorities: async () => {
    try {
      const { data, error } = await module1
        .from('priority')
        .select('*')
        .eq('status', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ priorities: data || [] });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch priorities',
      });
    }
  },

  fetchAllPriorities: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await module1
        .from('priority')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ allPriorities: data || [], isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch priorities',
        isLoading: false,
      });
    }
  },

  addPriority: async (description: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error: insertError } = await module1
        .from('priority')
        .insert({ description, status: true });

      if (insertError) throw insertError;

      await get().fetchAllPriorities();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add priority',
        isLoading: false,
      });
    }
  },

  updatePriority: async (id: string, description: string, status: boolean) => {
    set({ isLoading: true, error: null });
    try {
      const { error: updateError } = await module1
        .from('priority')
        .update({ description, status })
        .eq('id', id);

      if (updateError) throw updateError;

      set((state) => ({
        allPriorities: state.allPriorities.map((p) =>
          p.id === id ? { ...p, description, status } : p,
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update priority',
        isLoading: false,
      });
    }
  },

  deletePriority: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error: deleteError } = await module1
        .from('priority')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      set((state) => ({
        allPriorities: state.allPriorities.filter((p) => p.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete priority',
        isLoading: false,
      });
    }
  },

  fetchStatuses: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await module1
        .from('status')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ statuses: data || [], isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch statuses',
        isLoading: false,
      });
    }
  },

  addStatus: async (description: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error: insertError } = await module1
        .from('status')
        .insert({ description, status: true });

      if (insertError) throw insertError;

      await get().fetchStatuses();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add status',
        isLoading: false,
      });
    }
  },

  updateStatus: async (id: string, description: string, status: boolean) => {
    set({ isLoading: true, error: null });
    try {
      const { error: updateError } = await module1
        .from('status')
        .update({ description, status })
        .eq('id', id);

      if (updateError) throw updateError;

      set((state) => ({
        statuses: state.statuses.map((s) =>
          s.id === id ? { ...s, description, status } : s,
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update status',
        isLoading: false,
      });
    }
  },

  deleteStatus: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error: deleteError } = await module1
        .from('status')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      set((state) => ({
        statuses: state.statuses.filter((s) => s.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete status',
        isLoading: false,
      });
    }
  },

  fetchSequences: async (officeId?: string) => {
    set({ isLoading: true, error: null });
    try {
      let query = module1
        .from('sequence')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (officeId) {
        query = query.eq('office', officeId);
      }

      const { data: sequencesData, error: sequencesError } = await query;

      if (sequencesError) throw sequencesError;

      if (!sequencesData || sequencesData.length === 0) {
        set({ sequences: [], isLoading: false });
        return;
      }

      const officeIds = [...new Set(sequencesData.map((s) => s.office))];
      const queueIds = [...new Set(sequencesData.map((s) => s.queue))];
      const priorityIds = [...new Set(sequencesData.map((s) => s.priority))];
      const statusIds = [...new Set(sequencesData.map((s) => s.status))];
      const windowIds = [...new Set((sequencesData as { window?: string | null }[]).map((s) => s.window).filter((id): id is string => id != null))];

      const [officesResult, queuesResult, prioritiesResult, statusesResult, windowsResult] = await Promise.all([
        module1.from('office').select('id, description').in('id', officeIds),
        module1.from('queue').select('*').in('id', queueIds),
        module1.from('priority').select('*').in('id', priorityIds),
        module1.from('status').select('*').in('id', statusIds),
        windowIds.length > 0 ? module1.from('window').select('id, description').in('id', windowIds) : Promise.resolve({ data: [] }),
      ]);

      const officesMap = new Map(officesResult.data?.map((o) => [o.id, o]) || []);
      const queuesMap = new Map(queuesResult.data?.map((q) => [q.id, q]) || []);
      const prioritiesMap = new Map(prioritiesResult.data?.map((p) => [p.id, p]) || []);
      const statusesMap = new Map(statusesResult.data?.map((s) => [s.id, s]) || []);
      const windowsMap = new Map((windowsResult.data || []).map((w) => [w.id, w]));

      const enrichedSequences: Sequence[] = sequencesData.map((seq) => {
        const row = seq as { window?: string | null; is_active?: boolean };
        return {
          ...seq,
          window: row.window ?? null,
          is_active: row.is_active ?? true,
          office_data: officesMap.get(seq.office),
          queue_data: queuesMap.get(seq.queue),
          priority_data: prioritiesMap.get(seq.priority),
          status_data: statusesMap.get(seq.status),
          window_data: row.window != null ? windowsMap.get(row.window) : undefined,
        };
      });

      set({ sequences: enrichedSequences, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch sequences',
        isLoading: false,
      });
    }
  },

  generateQueueCode: async (officeId: string, priorityId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: statuses } = await module1
        .from('status')
        .select('*')
        .ilike('description', '%pending%')
        .limit(1);

      let pendingStatusId: string;

      if (statuses && statuses.length > 0) {
        pendingStatusId = statuses[0].id;
      } else {
        const { data: allStatuses } = await module1
          .from('status')
          .select('*')
          .order('created_at', { ascending: true })
          .limit(1);

        if (!allStatuses || allStatuses.length === 0) {
          throw new Error('No status records found. Please create status records first.');
        }
        pendingStatusId = allStatuses[0].id;
      }

      // Use the database function to generate a unique queue code
      const { data: codeData, error: codeError } = await module1
        .rpc('generate_ph_queue_code');

      if (codeError) throw codeError;
      
      const code = codeData as string;

      // Insert the new queue code
      const { data: queueData, error: queueError } = await module1
        .from('queue')
        .insert({ code, status: true })
        .select()
        .single();

      if (queueError) throw queueError;

      const { error: sequenceError } = await module1.from('sequence').insert({
        office: officeId,
        queue: queueData.id,
        priority: priorityId,
        status: pendingStatusId,
        is_active: true,
      });

      if (sequenceError) throw sequenceError;

      set({ isLoading: false });
      return code;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to generate queue code',
        isLoading: false,
      });
      return null;
    }
  },

  updateSequenceStatus: async (sequenceId: string, statusId: string, windowId?: string | null) => {
    set({ error: null });
    try {
      const { statuses, sequences } = get();
      const currentSequence = sequences.find((s) => s.id === sequenceId);
      
      if (!currentSequence) {
        throw new Error('Sequence not found');
      }

      const targetStatus = statuses.find((s) => s.id === statusId);
      const isCompleted = targetStatus?.description?.toLowerCase().includes('completed') || false;

      console.log('📝 Processing sequence transition:', { 
        sequenceId, 
        statusId, 
        windowId, 
        isCompleted,
        currentQueue: currentSequence.queue 
      });

      // Step 1: Set current sequence as inactive
      const { error: deactivateError } = await module1
        .from('sequence')
        .update({ is_active: false })
        .eq('id', sequenceId);

      if (deactivateError) {
        console.error('❌ Failed to deactivate current sequence:', deactivateError);
        throw deactivateError;
      }
      console.log('✅ Current sequence deactivated');

      // Step 2: Insert new sequence record with updated status/window
      const newSequencePayload: Record<string, unknown> = {
        office: currentSequence.office,
        queue: currentSequence.queue,
        priority: currentSequence.priority,
        status: statusId,
        is_active: !isCompleted,
      };
      
      if (windowId !== undefined && windowId !== null) {
        newSequencePayload.window = windowId;
      }

      const { data: newSequence, error: insertError } = await module1
        .from('sequence')
        .insert(newSequencePayload)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Failed to insert new sequence:', insertError);
        throw insertError;
      }
      console.log('✅ New sequence created:', newSequence);

      // Step 3: If completed, also set queue status to false
      if (isCompleted && currentSequence.queue) {
        console.log('📝 Setting queue status to false:', currentSequence.queue);
        const { error: queueError } = await module1
          .from('queue')
          .update({ status: false })
          .eq('id', currentSequence.queue);
        
        if (queueError) {
          console.error('❌ Queue update error:', queueError);
        } else {
          console.log('✅ Queue status updated to false');
        }
      }

      // Refresh sequences to get the updated list
      await get().fetchSequences();
    } catch (error: unknown) {
      console.error('❌ Failed to update sequence status:', error);
      const errorObj = error as { message?: string; code?: string; details?: string; hint?: string };
      const errorMessage = errorObj.message || 
        (error instanceof Error ? error.message : 'Failed to update sequence status');
      set({
        error: errorMessage,
      });
    }
  },

  isWindowAvailable: (windowId: string): boolean => {
    const { sequences, statuses } = get();
    const servingStatus = statuses.find((s) => s.description?.toLowerCase().includes('serving'));
    if (!servingStatus) return true;
    
    return !sequences.some(
      (seq) => seq.window === windowId && seq.status === servingStatus.id && seq.is_active
    );
  },

  getServingSequenceForWindow: (windowId: string): Sequence | undefined => {
    const { sequences, statuses } = get();
    const servingStatus = statuses.find((s) => s.description?.toLowerCase().includes('serving'));
    if (!servingStatus) return undefined;
    
    return sequences.find(
      (seq) => seq.window === windowId && seq.status === servingStatus.id && seq.is_active
    );
  },

  transferSequence: async (sequenceId: string, targetOfficeId: string, targetWindowId?: string | null) => {
    set({ error: null });
    try {
      const { sequences, statuses, isWindowAvailable } = get();
      const currentSequence = sequences.find((s) => s.id === sequenceId);
      
      if (!currentSequence) {
        throw new Error('Sequence not found');
      }

      const servingStatus = statuses.find((s) => s.description?.toLowerCase().includes('serving'));
      const pendingStatus = statuses.find((s) => s.description?.toLowerCase().includes('pending'));

      if (!servingStatus || !pendingStatus) {
        throw new Error('Required statuses (serving/pending) not found');
      }

      // Determine new status based on window availability
      // If transferring to a specific window, use serving if available, pending if busy
      // If transferring with no window, use pending
      let newStatus: string;
      if (targetWindowId) {
        const windowAvailable = isWindowAvailable(targetWindowId);
        newStatus = windowAvailable ? servingStatus.id : pendingStatus.id;
      } else {
        newStatus = pendingStatus.id;
      }

      console.log('🔄 Transferring sequence:', {
        sequenceId,
        targetOfficeId,
        targetWindowId,
        newStatus: targetWindowId 
          ? (isWindowAvailable(targetWindowId) ? 'serving' : 'pending')
          : 'pending',
      });

      // Step 1: Deactivate current sequence
      const { error: deactivateError } = await module1
        .from('sequence')
        .update({ is_active: false })
        .eq('id', sequenceId);

      if (deactivateError) {
        console.error('❌ Failed to deactivate current sequence:', deactivateError);
        throw deactivateError;
      }
      console.log('✅ Current sequence deactivated');

      // Step 2: Insert new sequence record with new office/window
      const newSequencePayload: Record<string, unknown> = {
        office: targetOfficeId,
        queue: currentSequence.queue,
        priority: currentSequence.priority,
        status: newStatus,
        is_active: true,
        window: targetWindowId ?? null,  // Explicitly set window (either windowId or null if no window selected)
      };

      const { data: newSequence, error: insertError } = await module1
        .from('sequence')
        .insert(newSequencePayload)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Failed to insert transferred sequence:', insertError);
        throw insertError;
      }
      console.log('✅ Transferred sequence created:', newSequence);

      // Refresh sequences
      await get().fetchSequences();
    } catch (error: unknown) {
      console.error('❌ Failed to transfer sequence:', error);
      const errorObj = error as { message?: string; code?: string; details?: string; hint?: string };
      const errorMessage = errorObj.message || 
        (error instanceof Error ? error.message : 'Failed to transfer sequence');
      set({
        error: errorMessage,
      });
    }
  },

  subscribeToSequences: () => {
    const enrichRow = async (row: {
      id: string;
      created_at: string;
      office: string;
      queue: string;
      priority: string;
      status: string;
      window?: string | null;
      is_active?: boolean;
    }): Promise<Sequence> => {
      const [officeRes, queueRes, priorityRes, statusRes, windowRes] = await Promise.all([
        module1.from('office').select('id, description').eq('id', row.office).single(),
        module1.from('queue').select('*').eq('id', row.queue).single(),
        module1.from('priority').select('*').eq('id', row.priority).single(),
        module1.from('status').select('*').eq('id', row.status).single(),
        row.window != null ? module1.from('window').select('id, description').eq('id', row.window).single() : Promise.resolve({ data: null }),
      ]);

      return {
        ...row,
        window: row.window ?? null,
        is_active: row.is_active ?? true,
        office_data: officeRes.data || undefined,
        queue_data: queueRes.data || undefined,
        priority_data: priorityRes.data || undefined,
        status_data: statusRes.data || undefined,
        window_data: windowRes.data || undefined,
      };
    };

    console.log('🔌 Setting up realtime subscription for module1.sequence...');

    const channel = supabase
      .channel('sequence-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'module1',
          table: 'sequence',
        },
        async (payload) => {
          console.log('🟢 INSERT event received:', payload);
          const newRow = payload.new as {
            id: string;
            created_at: string;
            office: string;
            queue: string;
            priority: string;
            status: string;
            window?: string | null;
            is_active?: boolean;
          };
          const enriched = await enrichRow(newRow);
          set((state) => {
            if (state.sequences.some((seq) => seq.id === newRow.id)) return state;
            return { sequences: [...state.sequences, enriched] };
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'module1',
          table: 'sequence',
        },
        async (payload) => {
          console.log('🟡 UPDATE event received:', payload);
          const updatedRow = payload.new as {
            id: string;
            created_at: string;
            office: string;
            queue: string;
            priority: string;
            status: string;
            window?: string | null;
            is_active?: boolean;
          };
          const enriched = await enrichRow(updatedRow);
          set((state) => ({
            sequences: state.sequences.map((seq) =>
              seq.id === updatedRow.id ? enriched : seq,
            ),
          }));
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'module1',
          table: 'sequence',
        },
        (payload) => {
          console.log('🔴 DELETE event received:', payload);
          const deletedRow = payload.old as { id: string };
          set((state) => ({
            sequences: state.sequences.filter((seq) => seq.id !== deletedRow.id),
          }));
        },
      )
      .subscribe((status, err) => {
        console.log('📡 Subscription status:', status);
        if (err) {
          console.error('❌ Subscription error:', err);
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to module1.sequence changes');
        }
      });

    return () => {
      console.log('🔌 Unsubscribing from realtime...');
      supabase.removeChannel(channel);
    };
  },

  clearError: () => {
    set({ error: null });
  },
}));
