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
}

export interface Queue {
  id: number;
  created_at: string;
  code: string;
  status: boolean;
}

export interface Sequence {
  id: number;
  created_at: string;
  office: string;
  queue: string;
  priority: string;
  status: string;
  window_id?: number | null;
  office_data?: { id: string; description: string };
  priority_data?: Priority;
  status_data?: Status;
  window_data?: { id: number; description: string | null };
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
  updateStatus: (id: string, description: string) => Promise<void>;
  deleteStatus: (id: string) => Promise<void>;
  fetchSequences: (officeId?: string) => Promise<void>;
  generateQueueCode: (officeId: string, priorityId: string) => Promise<string | null>;
  updateSequenceStatus: (sequenceId: number, statusId: string, windowId?: number | null) => Promise<void>;
  subscribeToSequences: () => () => void;
  clearError: () => void;
}

const generateThreeLetterCode = (): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return code;
};

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
        .insert({ description });

      if (insertError) throw insertError;

      await get().fetchStatuses();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add status',
        isLoading: false,
      });
    }
  },

  updateStatus: async (id: string, description: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error: updateError } = await module1
        .from('status')
        .update({ description })
        .eq('id', id);

      if (updateError) throw updateError;

      set((state) => ({
        statuses: state.statuses.map((s) =>
          s.id === id ? { ...s, description } : s,
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
      const priorityIds = [...new Set(sequencesData.map((s) => s.priority))];
      const statusIds = [...new Set(sequencesData.map((s) => s.status))];
      const windowIds = [...new Set((sequencesData as { window_id?: number | null }[]).map((s) => s.window_id).filter((id): id is number => id != null))];

      const [officesResult, prioritiesResult, statusesResult, windowsResult] = await Promise.all([
        module1.from('office').select('id, description').in('id', officeIds),
        module1.from('priority').select('*').in('id', priorityIds),
        module1.from('status').select('*').in('id', statusIds),
        windowIds.length > 0 ? module1.from('window').select('id, description').in('id', windowIds) : Promise.resolve({ data: [] }),
      ]);

      const officesMap = new Map(officesResult.data?.map((o) => [o.id, o]) || []);
      const prioritiesMap = new Map(prioritiesResult.data?.map((p) => [p.id, p]) || []);
      const statusesMap = new Map(statusesResult.data?.map((s) => [s.id, s]) || []);
      const windowsMap = new Map((windowsResult.data || []).map((w) => [w.id, w]));

      const enrichedSequences: Sequence[] = sequencesData.map((seq) => {
        const row = seq as { window_id?: number | null };
        return {
          ...seq,
          window_id: row.window_id ?? null,
          office_data: officesMap.get(seq.office),
          priority_data: prioritiesMap.get(seq.priority),
          status_data: statusesMap.get(seq.status),
          window_data: row.window_id != null ? windowsMap.get(row.window_id) : undefined,
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

      const code = generateThreeLetterCode();

      const { data: existingCode } = await module1
        .from('queue')
        .select('id')
        .eq('code', code)
        .limit(1);

      let queueId: string;

      if (existingCode && existingCode.length > 0) {
        queueId = code;
      } else {
        const { data: queueData, error: queueError } = await module1
          .from('queue')
          .insert({ code, status: true })
          .select()
          .single();

        if (queueError) throw queueError;
        queueId = queueData.code;
      }

      const { error: sequenceError } = await module1.from('sequence').insert({
        office: officeId,
        queue: queueId,
        priority: priorityId,
        status: pendingStatusId,
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

  updateSequenceStatus: async (sequenceId: number, statusId: string, windowId?: number | null) => {
    set({ error: null });
    try {
      const updatePayload: { status: string; window_id?: number | null } = { status: statusId };
      if (windowId !== undefined) updatePayload.window_id = windowId;

      const { error: updateError } = await module1
        .from('sequence')
        .update(updatePayload)
        .eq('id', sequenceId);

      if (updateError) throw updateError;

      set((state) => ({
        sequences: state.sequences.map((seq) =>
          seq.id === sequenceId
            ? { ...seq, status: statusId, status_data: state.statuses.find((s) => s.id === statusId), window_id: windowId ?? seq.window_id }
            : seq,
        ),
      }));

      await get().fetchSequences();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update sequence status',
      });
    }
  },

  subscribeToSequences: () => {
    const enrichRow = async (row: {
      id: number;
      created_at: string;
      office: string;
      queue: string;
      priority: string;
      status: string;
      window_id?: number | null;
    }): Promise<Sequence> => {
      const [officeRes, priorityRes, statusRes, windowRes] = await Promise.all([
        module1.from('office').select('id, description').eq('id', row.office).single(),
        module1.from('priority').select('*').eq('id', row.priority).single(),
        module1.from('status').select('*').eq('id', row.status).single(),
        row.window_id != null ? module1.from('window').select('id, description').eq('id', row.window_id).single() : Promise.resolve({ data: null }),
      ]);

      return {
        ...row,
        window_id: row.window_id ?? null,
        office_data: officeRes.data || undefined,
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
            id: number;
            created_at: string;
            office: string;
            queue: string;
            priority: string;
            status: string;
            window_id?: number | null;
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
            id: number;
            created_at: string;
            office: string;
            queue: string;
            priority: string;
            status: string;
            window_id?: number | null;
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
          const deletedRow = payload.old as { id: number };
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
