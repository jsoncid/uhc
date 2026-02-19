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
  office_data?: { id: string; description: string };
  priority_data?: Priority;
  status_data?: Status;
}

interface QueueState {
  sequences: Sequence[];
  priorities: Priority[];
  statuses: Status[];
  isLoading: boolean;
  error: string | null;

  fetchPriorities: () => Promise<void>;
  fetchStatuses: () => Promise<void>;
  fetchSequences: (officeId?: string) => Promise<void>;
  generateQueueCode: (officeId: string, priorityId: string) => Promise<string | null>;
  updateSequenceStatus: (sequenceId: number, statusId: string) => Promise<void>;
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

  fetchStatuses: async () => {
    try {
      const { data, error } = await module1
        .from('status')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ statuses: data || [] });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch statuses',
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

      const [officesResult, prioritiesResult, statusesResult] = await Promise.all([
        module1.from('office').select('id, description').in('id', officeIds),
        module1.from('priority').select('*').in('id', priorityIds),
        module1.from('status').select('*').in('id', statusIds),
      ]);

      const officesMap = new Map(officesResult.data?.map((o) => [o.id, o]) || []);
      const prioritiesMap = new Map(prioritiesResult.data?.map((p) => [p.id, p]) || []);
      const statusesMap = new Map(statusesResult.data?.map((s) => [s.id, s]) || []);

      const enrichedSequences: Sequence[] = sequencesData.map((seq) => ({
        ...seq,
        office_data: officesMap.get(seq.office),
        priority_data: prioritiesMap.get(seq.priority),
        status_data: statusesMap.get(seq.status),
      }));

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

  updateSequenceStatus: async (sequenceId: number, statusId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error: updateError } = await module1
        .from('sequence')
        .update({ status: statusId })
        .eq('id', sequenceId);

      if (updateError) throw updateError;

      set((state) => ({
        sequences: state.sequences.map((seq) =>
          seq.id === sequenceId
            ? { ...seq, status: statusId, status_data: state.statuses.find((s) => s.id === statusId) }
            : seq,
        ),
        isLoading: false,
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update sequence status',
        isLoading: false,
      });
    }
  },

  subscribeToSequences: () => {
    const channel = supabase
      .channel('sequence-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'module1',
          table: 'sequence',
        },
        () => {
          get().fetchSequences();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  clearError: () => {
    set({ error: null });
  },
}));
