import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

// Use module1 schema
const module1 = supabase.schema('module1');

export interface QueueNotification {
  id: string;
  sequenceId: string;
  queueId: string; // FK to queue table — used to block staff-action duplicates
  officeId: string;
  officeName: string;
  queueCode: string;
  priorityType: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationState {
  notifications: QueueNotification[];
  seenSequenceIds: Set<string>;
  seenQueueIds: Set<string>; // tracks queue IDs that have already been notified
  // ISO timestamp of last clear, keyed by userId so clearing on one account
  // never affects another account on the same browser.
  clearedAtByUser: Record<string, string>;

  // Actions
  addNotification: (notification: Omit<QueueNotification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: (userId: string) => void;
  purgeNotificationsForOtherOffices: (myOfficeId: string) => void;

  // Realtime subscription using Postgres Changes on sequence table
  subscribeToSequenceChanges: (officeIds: string[]) => () => void;

  // Load recent sequences on mount (for persistence)
  loadRecentSequences: (officeIds: string[], userId: string) => Promise<void>;
}

// Store subscription outside Zustand to avoid re-render loops
let activeChannel: ReturnType<typeof supabase.channel> | null = null;
let isCurrentlySubscribed = false;

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      seenSequenceIds: new Set(),
      seenQueueIds: new Set(),
      clearedAtByUser: {},

      addNotification: (notification) => {
        const { seenSequenceIds, seenQueueIds } = get();

        // Block staff-action sequences — Complete/Arrived/Transfer reuse the same queue ID
        if (seenQueueIds.has(notification.queueId)) {
          console.log(
            '🔕 Skipping staff-action sequence for already-notified queue:',
            notification.queueId,
          );
          return;
        }

        // Block duplicate sequence IDs
        if (seenSequenceIds.has(notification.sequenceId)) {
          console.log('🔕 Skipping duplicate notification for sequence:', notification.sequenceId);
          return;
        }

        const newNotification: QueueNotification = {
          ...notification,
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          timestamp: new Date(),
          read: false,
        };

        console.log('🔔 Adding notification:', newNotification);

        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50),
          seenSequenceIds: new Set([...state.seenSequenceIds, notification.sequenceId]),
          seenQueueIds: new Set([...state.seenQueueIds, notification.queueId]),
        }));
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      clearNotifications: (userId: string) => {
        const clearedAt = new Date().toISOString();

        // Update local store immediately
        set((state) => ({
          notifications: [],
          seenSequenceIds: new Set(),
          seenQueueIds: state.seenQueueIds, // preserve — do NOT reset
          clearedAtByUser: {
            ...state.clearedAtByUser,
            [userId]: clearedAt,
          },
        }));

        // Persist clearedAt to Supabase auth metadata so it syncs across all
        // browsers and incognito sessions for this user account.
        supabase.auth
          .updateUser({ data: { notification_cleared_at: clearedAt } })
          .catch((err) =>
            console.warn('Failed to sync notification_cleared_at to auth metadata:', err),
          );
      },

      purgeNotificationsForOtherOffices: (myOfficeId: string) => {
        // Remove any persisted notifications that don't belong to the user's current office.
        // This handles stale localStorage entries from previous sessions or office changes.
        set((state) => {
          const filtered = state.notifications.filter((n) => n.officeId === myOfficeId);
          if (filtered.length === state.notifications.length) return state; // nothing to purge
          console.log(
            `🧹 Purged ${state.notifications.length - filtered.length} notification(s) from other offices`,
          );
          // Also clean seenSequenceIds to remove IDs that no longer have a matching notification
          const keptSeqIds = new Set(filtered.map((n) => n.sequenceId));
          return {
            notifications: filtered,
            seenSequenceIds: keptSeqIds,
          };
        });
      },

      loadRecentSequences: async (officeIds: string[], userId: string) => {
        if (officeIds.length === 0) return;

        console.log('📥 Loading recent sequences for offices:', officeIds);

        try {
          // Primary source: Supabase auth metadata (syncs across all browsers/incognito).
          // Fallback: localStorage clearedAtByUser (for offline / immediate use).
          let clearedAt = get().clearedAtByUser[userId] ?? null;
          try {
            const { data: userData } = await supabase.auth.getUser();
            const metaClearedAt: string | undefined =
              userData?.user?.user_metadata?.notification_cleared_at;
            if (metaClearedAt) {
              // Use whichever timestamp is more recent
              if (!clearedAt || metaClearedAt > clearedAt) {
                clearedAt = metaClearedAt;
                // Sync back to localStorage so subsequent reads are fast
                set((state) => ({
                  clearedAtByUser: { ...state.clearedAtByUser, [userId]: metaClearedAt },
                }));
              }
            }
          } catch {
            // Auth fetch failed — continue with localStorage value
          }

          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

          // Capture persisted seenQueueIds BEFORE step 1 expands it.
          // This represents queues that were already notified in a previous session.
          const persistedSeenQueueIds = new Set(get().seenQueueIds);

          // Step 1: Fetch ALL sequences from last 24 h (with created_at) to:
          //   a) seed seenQueueIds so realtime staff-actions are blocked
          //   b) identify which queues had their FIRST row BEFORE clearedAt
          //      — those are pre-clear queues and must never reappear regardless
          //      of whether the browser has localStorage data (handles incognito
          //      and cross-browser scenarios without relying on persisted state).
          const { data: allSequences } = await module1
            .from('sequence')
            .select('queue, created_at')
            .in('office', officeIds)
            .gte('created_at', oneDayAgo);

          // Build: earliest sequence timestamp per queue across the full 24-h window
          const earliestPerQueue = new Map<string, string>();
          (allSequences || []).forEach((s) => {
            const prev = earliestPerQueue.get(s.queue);
            if (!prev || s.created_at < prev) earliestPerQueue.set(s.queue, s.created_at);
          });

          // A queue is "pre-clear" if its earliest row was created before clearedAt.
          // On a fresh browser (no localStorage) this is the authoritative source of truth.
          const preClearQueueIds = new Set<string>();
          if (clearedAt) {
            earliestPerQueue.forEach((earliest, queueId) => {
              if (earliest < clearedAt!) preClearQueueIds.add(queueId);
            });
          }

          // Combine with persisted set for same-browser sessions
          const blockedQueueIds = new Set([...persistedSeenQueueIds, ...preClearQueueIds]);

          // Seed every queue ID seen in the last 24 h so realtime staff-action
          // INSERTs for those queues are blocked immediately.
          const allQueueIds = new Set(persistedSeenQueueIds);
          (allSequences || []).forEach((s) => allQueueIds.add(s.queue));
          set({ seenQueueIds: allQueueIds });

          // Step 2: Load notification-worthy sequences (respects clearedAt).
          const lowerBound = clearedAt && clearedAt > oneDayAgo ? clearedAt : oneDayAgo;

          const { data: sequences, error } = await module1
            .from('sequence')
            .select(
              `
          id,
          created_at,
          office,
          queue,
          priority
        `,
            )
            .in('office', officeIds)
            .gte('created_at', lowerBound)
            .order('created_at', { ascending: false })
            .limit(20);

          if (error) {
            console.error('Error loading recent sequences:', error);
            return;
          }

          if (!sequences || sequences.length === 0) {
            console.log('📭 No recent sequences found');
            return;
          }

          // Fetch related data
          const queueIds = [...new Set(sequences.map((s) => s.queue))];
          const priorityIds = [...new Set(sequences.map((s) => s.priority))];

          const [officesResult, queuesResult, prioritiesResult] = await Promise.all([
            module1.from('office').select('id, description').in('id', officeIds),
            module1.from('queue').select('id, code').in('id', queueIds),
            module1.from('priority').select('id, description').in('id', priorityIds),
          ]);

          const officesMap = new Map(officesResult.data?.map((o) => [o.id, o.description]) || []);
          const queuesMap = new Map(queuesResult.data?.map((q) => [q.id, q.code]) || []);
          const prioritiesMap = new Map(
            prioritiesResult.data?.map((p) => [p.id, p.description]) || [],
          );

          // Keep only the EARLIEST sequence per queue — that is the customer-generated one.
          // Staff actions (Complete, Arrived, Transfer) create additional rows for the same queue.
          const firstSeqPerQueue = new Map<string, (typeof sequences)[number]>();
          sequences.forEach((seq) => {
            const existing = firstSeqPerQueue.get(seq.queue);
            if (!existing || new Date(seq.created_at) < new Date(existing.created_at)) {
              firstSeqPerQueue.set(seq.queue, seq);
            }
          });
          const customerSequences = Array.from(firstSeqPerQueue.values());

          // Add notifications for unseen sequences.
          // blockedQueueIds = persistedSeenQueueIds ∪ preClearQueueIds, so this guards
          // both same-browser sessions AND fresh browsers (incognito/cross-browser).
          const { seenSequenceIds, seenQueueIds } = get();
          const newNotifications: QueueNotification[] = [];
          const newSeenIds = new Set(seenSequenceIds);
          const newSeenQueueIds = new Set(seenQueueIds);

          // Seed ALL queue IDs (including ones already in store) so realtime staff-actions are blocked
          customerSequences.forEach((seq) => newSeenQueueIds.add(seq.queue));

          customerSequences.reverse().forEach((seq) => {
            // Block pre-clear queues (identified from DB, works even on fresh browser
            // with no localStorage — covers incognito and cross-browser scenarios)
            if (blockedQueueIds.has(seq.queue)) return;
            if (!newSeenIds.has(seq.id)) {
              newSeenIds.add(seq.id);
              newNotifications.push({
                id: `notif-${seq.id}`,
                sequenceId: seq.id,
                queueId: seq.queue,
                officeId: seq.office,
                officeName: officesMap.get(seq.office) || 'Unknown Office',
                queueCode: queuesMap.get(seq.queue) || 'Unknown',
                priorityType: prioritiesMap.get(seq.priority) || 'Regular',
                timestamp: new Date(seq.created_at),
                read: true, // loaded sequences are pre-read; only realtime ones are unread
              });
            }
          });

          if (newNotifications.length > 0) {
            console.log(`📥 Loaded ${newNotifications.length} recent notifications`);
            set((state) => ({
              notifications: [...newNotifications.reverse(), ...state.notifications].slice(0, 50),
              seenSequenceIds: newSeenIds,
              seenQueueIds: newSeenQueueIds,
            }));
          } else {
            // Even if no new notifications, update seenQueueIds to block realtime staff-actions
            set({ seenQueueIds: newSeenQueueIds });
          }
        } catch (err) {
          console.error('Error loading recent sequences:', err);
        }
      },

      subscribeToSequenceChanges: (officeIds: string[]) => {
        if (isCurrentlySubscribed || officeIds.length === 0) {
          return () => {};
        }

        // Clean up existing channel
        if (activeChannel) {
          supabase.removeChannel(activeChannel);
          activeChannel = null;
        }

        console.log('🔔 Subscribing to sequence changes for offices:', officeIds);
        isCurrentlySubscribed = true;

        const channel = supabase
          .channel('sequence-notifications')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'module1',
              table: 'sequence',
            },
            async (payload) => {
              console.log('📥 Received sequence INSERT:', payload);

              const newSeq = payload.new as {
                id: string;
                office: string;
                queue: string;
                priority: string;
                created_at: string;
              };

              // Only process if it's for one of user's offices
              if (!officeIds.includes(newSeq.office)) {
                console.log('🔕 Ignoring sequence for different office');
                return;
              }

              // Core deduplication: seenQueueIds holds every queue ID we have already
              // notified (or seen during initial load). The very first INSERT for a
              // queue ID is the customer-generated one — notify it and add to the set.
              // Every subsequent INSERT for that same queue ID (Complete, Arrived,
              // Transfer, Call Next) hits this guard and is silently dropped.
              if (get().seenQueueIds.has(newSeq.queue)) {
                console.log(
                  '🔕 Ignoring staff-action sequence for already-seen queue:',
                  newSeq.queue,
                );
                return;
              }
              try {
                const [officeResult, queueResult, priorityResult] = await Promise.all([
                  module1.from('office').select('description').eq('id', newSeq.office).single(),
                  module1.from('queue').select('code').eq('id', newSeq.queue).single(),
                  module1.from('priority').select('description').eq('id', newSeq.priority).single(),
                ]);

                get().addNotification({
                  sequenceId: newSeq.id,
                  queueId: newSeq.queue,
                  officeId: newSeq.office,
                  officeName: officeResult.data?.description || 'Unknown Office',
                  queueCode: queueResult.data?.code || 'Unknown',
                  priorityType: priorityResult.data?.description || 'Regular',
                });
              } catch (err) {
                console.error('Error fetching sequence details:', err);
              }
            },
          )
          .subscribe((status) => {
            console.log('📡 Sequence channel status:', status);
          });

        activeChannel = channel;

        return () => {
          console.log('🔔 Cleaning up sequence subscription');
          if (activeChannel) {
            supabase.removeChannel(activeChannel);
            activeChannel = null;
          }
          isCurrentlySubscribed = false;
        };
      },
    }),
    {
      name: 'notification-storage',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          return {
            ...parsed,
            state: {
              ...parsed.state,
              notifications:
                parsed.state.notifications?.map((n: QueueNotification) => ({
                  ...n,
                  timestamp: new Date(n.timestamp),
                })) || [],
              seenSequenceIds: new Set(parsed.state.seenSequenceIds || []),
              seenQueueIds: new Set(parsed.state.seenQueueIds || []),
              clearedAtByUser: parsed.state.clearedAtByUser ?? {},
            },
          };
        },
        setItem: (name, value) => {
          const toStore = {
            ...value,
            state: {
              ...value.state,
              seenSequenceIds: Array.from(value.state.seenSequenceIds || []),
              seenQueueIds: Array.from(value.state.seenQueueIds || []),
              // clearedAtByUser is a plain object — no special serialization needed
              clearedAtByUser: value.state.clearedAtByUser ?? {},
            },
          };
          localStorage.setItem(name, JSON.stringify(toStore));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
      partialize: (state) =>
        ({
          notifications: state.notifications,
          seenSequenceIds: state.seenSequenceIds,
          seenQueueIds: state.seenQueueIds,
          clearedAtByUser: state.clearedAtByUser,
        }) as NotificationState,
    },
  ),
);
