import { useState, useEffect, useRef, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import darkLogo from 'src/assets/images/logos/dark-logo.svg';
import lightLogo from 'src/assets/images/logos/light-logo.svg';
import { useOfficeStore, Office } from '@/stores/module-1_stores/useOfficeStore';
import { useQueueStore } from '@/stores/module-1_stores/useQueueStore';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/lib/supabase';

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Queue Display' }];

const REPEAT_COUNT = 3; // how many times to announce
const PAUSE_BETWEEN_MS = 800; // pause between each announcement
const POPUP_GAP_MS = 600; // gap after speech before picking up the next item

interface CallNotification {
  id: string;
  queueCode: string;
  windowLabel: string;
  officeName: string;
  priorityText: string;
  priorityStyle: { text: string; bg: string; dot: string };
}

/** Cached voices — populated once when the browser fires voiceschanged */
let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices() {
  const v = window.speechSynthesis.getVoices();
  if (v.length > 0) cachedVoices = v;
}

// Load immediately (works in Firefox) and on voiceschanged (works in Chrome/Edge)
loadVoices();
if (typeof window !== 'undefined') {
  window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
}

/** Pick the best female English voice from the cached list */
function getFemaleVoice(): SpeechSynthesisVoice | null {
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();

  const femaleKeywords = [
    'zira',
    'samantha',
    'google us english',
    'hazel',
    'susan',
    'victoria',
    'karen',
    'female',
    'woman',
  ];
  const maleKeywords = ['david', 'mark', 'james', 'richard', 'male', 'man'];

  const englishVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));

  // Priority 1: explicitly female-named voice
  const explicit = englishVoices.find((v) =>
    femaleKeywords.some((k) => v.name.toLowerCase().includes(k)),
  );
  if (explicit) return explicit;

  // Priority 2: english voice with no male indicators
  const likely = englishVoices.find(
    (v) => !maleKeywords.some((k) => v.name.toLowerCase().includes(k)),
  );
  if (likely) return likely;

  // Priority 3: first english voice
  return englishVoices[0] ?? null;
}

/** Speak `text` exactly `times` times, with a pause between each. Calls `onDone` when finished. */
function speakRepeat(text: string, times: number, onDone: () => void): void {
  window.speechSynthesis.cancel();

  let count = 0;

  const speakOnce = () => {
    const utter = new SpeechSynthesisUtterance(text);
    const voice = getFemaleVoice();
    if (voice) utter.voice = voice;
    utter.pitch = 1.15;
    utter.rate = 0.95;

    utter.onend = () => {
      count++;
      if (count < times) {
        setTimeout(speakOnce, PAUSE_BETWEEN_MS);
      } else {
        onDone();
      }
    };

    utter.onerror = () => {
      count++;
      if (count < times) setTimeout(speakOnce, PAUSE_BETWEEN_MS);
      else onDone();
    };

    window.speechSynthesis.speak(utter);
  };

  speakOnce();
}

// ── Pure helpers at module scope so effects can reference them without stale-closure issues ──

const getPriorityWeight = (priorityDescription: string | null | undefined): number => {
  const desc = (priorityDescription ?? '').toLowerCase();
  if (desc.includes('urgent')) return 1;
  if (desc.includes('vip')) return 2;
  if (desc.includes('priority')) return 3;
  if (desc.includes('pwd')) return 4;
  if (desc.includes('senior')) return 5;
  return 10;
};

const getPriorityStyle = (priority: string | null | undefined) => {
  const desc = (priority ?? '').toLowerCase();
  // Anything that is not explicitly "regular" is treated as priority (red)
  const isRegular = desc === '' || desc.includes('regular');
  if (isRegular)
    return {
      text: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      dot: 'bg-emerald-500',
    };
  return {
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    dot: 'bg-rose-500',
  };
};

const QueueDisplay = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifQueue, setNotifQueue] = useState<CallNotification[]>([]);
  const [activeNotif, setActiveNotif] = useState<CallNotification | null>(null);
  // Tracks sequence IDs already enqueued so we never repeat
  const seenIds = useRef<Set<string>>(new Set());
  // Prevents announcements on the initial page load snapshot
  const initializedRef = useRef(false);
  // Reference to the ping broadcast channel so the processor can send ping-done
  const pingChRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isDisplayMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('display') === '1';
  }, []);

  const { profile, loading: profileLoading } = useUserProfile();
  const { offices, fetchOffices, isLoading: officesLoading } = useOfficeStore();
  const {
    sequences,
    fetchSequences,
    fetchStatuses,
    subscribeToSequences,
    isLoading: queueLoading,
  } = useQueueStore();

  const userAssignmentIds = useMemo(
    () => profile?.assignments?.map((a) => a.id) || [],
    [profile?.assignments],
  );

  useEffect(() => {
    fetchStatuses();
    fetchSequences();
  }, [fetchStatuses, fetchSequences]);

  useEffect(() => {
    if (!profileLoading) {
      fetchOffices(userAssignmentIds.length > 0 ? userAssignmentIds : undefined);
    }
  }, [profileLoading, userAssignmentIds, fetchOffices]);

  useEffect(() => {
    const unsub = subscribeToSequences();
    return () => unsub();
  }, [subscribeToSequences]);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Detect newly-serving sequences and push onto the notification queue.
  // On the very first snapshot we silently seed seenIds (no announcement on page load);
  // every subsequent change is treated as a realtime event and will be announced.
  useEffect(() => {
    if (sequences.length === 0) return;

    if (!initializedRef.current) {
      // Seed all currently-serving IDs so they are never announced on refresh
      sequences.forEach((seq) => {
        if (seq.status_data?.description?.toLowerCase().includes('serving')) {
          seenIds.current.add(seq.id);
        }
      });
      initializedRef.current = true;
      return; // do not announce anything from the initial load
    }

    // Realtime path — only runs after initialisation
    const fresh: CallNotification[] = [];
    sequences.forEach((seq) => {
      if (
        seq.is_active !== false &&
        seq.status_data?.description?.toLowerCase().includes('serving') &&
        !seenIds.current.has(seq.id)
      ) {
        seenIds.current.add(seq.id);
        // Spell out the queue code so TTS reads each letter: "C T B" not "CTB"
        const spokenCode = (seq.queue_data?.code || '').split('').join(' ');
        // Use enriched office_data first (always present on the sequence), fallback to offices store
        const officeName =
          seq.office_data?.description ||
          offices.find((o) => o.id === seq.office)?.description ||
          '';
        fresh.push({
          id: seq.id,
          queueCode: seq.queue_data?.code || '---',
          windowLabel: seq.window_data?.description || 'the window',
          officeName,
          priorityText: seq.priority_data?.description || 'Regular',
          priorityStyle: getPriorityStyle(seq.priority_data?.description),
          // store spokenCode on the object — cast through unknown to extend the type inline
          ...({ spokenCode } as { spokenCode: string }),
        });
      }
    });
    if (fresh.length > 0) setNotifQueue((prev) => [...prev, ...fresh]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequences]);

  // Sequential processor: one announcement at a time.
  // Uses activeNotif (state) as the sole lock — clearing it triggers a re-run
  // so the next queued item is always picked up correctly.
  useEffect(() => {
    if (activeNotif !== null || notifQueue.length === 0) return;

    const next = notifQueue[0] as CallNotification & { spokenCode?: string };
    setNotifQueue((prev) => prev.slice(1));
    setActiveNotif(next);

    const announcement =
      `Now calling, ${next.spokenCode ?? next.queueCode} at ${next.officeName || 'the office'}. ` +
      `Please proceed to ${next.windowLabel}.`;

    speakRepeat(announcement, REPEAT_COUNT, () => {
      setTimeout(() => {
        // Notify StaffQueueManager the announcement is done so Ping button re-enables
        pingChRef.current?.send({
          type: 'broadcast',
          event: 'ping-done',
          payload: { sequenceId: next.id },
        });
        setActiveNotif(null); // state change → effect re-runs → picks up next item
      }, POPUP_GAP_MS);
    });
  }, [notifQueue, activeNotif]);

  // Subscribe to ping broadcasts sent by staff — bypasses seenIds so it always re-announces
  useEffect(() => {
    const ch = supabase
      .channel('queue-ping-broadcast', { config: { broadcast: { self: true } } })
      .on('broadcast', { event: 'ping' }, ({ payload }) => {
        const code = (payload.queueCode as string) || '---';
        const spokenCode = code.split('').join(' ');
        // Use the real sequenceId as the notification id so the blink matches seq.id in the display
        const notifId = (payload.sequenceId as string) || `ping-${Date.now()}`;
        setNotifQueue((prev) => [
          ...prev,
          {
            id: notifId,
            queueCode: code,
            windowLabel: (payload.windowLabel as string) || 'the window',
            officeName: (payload.officeName as string) || '',
            priorityText: (payload.priorityDesc as string) || 'Regular',
            priorityStyle: getPriorityStyle(payload.priorityDesc as string | null),
            ...({ spokenCode } as { spokenCode: string }),
          } as CallNotification,
        ]);
      })
      .subscribe();
    pingChRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
      pingChRef.current = null;
    };
  }, []);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const staticPriorityLegend = [
    {
      label: 'Regular',
      style: { text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
    },
    { label: 'Priority', style: { text: 'text-rose-600 dark:text-rose-400', dot: 'bg-rose-500' } },
  ];

  const activeOffices = useMemo(() => offices.filter((o) => o.status), [offices]);

  const isLoading = profileLoading || officesLoading || queueLoading;

  if (isLoading && activeOffices.length === 0) {
    return (
      <>
        {!isDisplayMode && <BreadcrumbComp title="Queue Display" items={BCrumb} />}
        <div className="flex min-h-[60vh] items-center justify-center bg-slate-100">
          <Loader2 className="h-10 w-10 animate-spin text-slate-500" />
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className={`flex h-screen flex-col overflow-hidden text-foreground ${
          isDisplayMode ? 'p-4 md:p-6' : 'p-4'
        } gap-4`}
      >
        {/* Header: title + clock */}
        <header className="flex shrink-0 items-center justify-between border-b border-border pb-3">
          <h1 className="flex items-center gap-3 text-lg font-bold tracking-wide text-foreground md:text-xl">
            <img
              src={darkLogo}
              alt="UHC logo"
              className="block dark:hidden h-9 w-auto shrink-0 object-contain"
            />
            <img
              src={lightLogo}
              alt="UHC logo"
              className="hidden dark:block h-9 w-auto shrink-0 object-contain"
            />
            Queue Display
          </h1>
          <div className="flex items-baseline gap-4">
            <div className="flex items-center gap-2">
              {staticPriorityLegend.map((item) => (
                <div key={item.label} className="flex items-center gap-1">
                  <span className={`h-4 w-4 shrink-0 rounded-full ${item.style.dot}`} aria-hidden />
                  <span className={`text-xl font-semibold ${item.style.text}`}>{item.label}</span>
                </div>
              ))}
            </div>
            <div className="h-6 w-px bg-border" />
            <span
              className="text-xl font-bold tabular-nums text-foreground md:text-2xl"
              aria-live="polite"
            >
              {formatTime(currentTime)}
            </span>
            <span className="text-sm text-muted-foreground">{formatDate(currentTime)}</span>
          </div>
        </header>

        {/* Bottom section: per-office columns */}
        <div
          className="min-h-0 flex-1 grid gap-4 overflow-x-auto overflow-y-hidden"
          style={{
            gridTemplateColumns: `repeat(${activeOffices.length}, minmax(calc((100% - 5 * 1rem) / 6), 1fr))`,
          }}
        >
          {activeOffices.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              No active offices
            </div>
          ) : (
            activeOffices.map((office: Office) => {
              const officeName = office.description || office.id;

              // Use enriched status_data & window_data — no fragile ID lookup needed
              const servingEntries = sequences
                .filter(
                  (seq) =>
                    seq.office === office.id &&
                    seq.is_active !== false &&
                    seq.status_data?.description?.toLowerCase().includes('serving'),
                )
                .map((seq) => ({
                  seq,
                  windowLabel: seq.window_data?.description || null,
                  style: getPriorityStyle(seq.priority_data?.description),
                }));

              const waitingEntries = sequences
                .filter(
                  (seq) =>
                    seq.office === office.id &&
                    seq.is_active !== false &&
                    seq.status_data?.description?.toLowerCase().includes('pending'),
                )
                .map((seq) => ({
                  seq,
                  windowLabel: seq.window_data?.description || null,
                  style: getPriorityStyle(seq.priority_data?.description),
                }))
                .sort((a, b) => {
                  const pa = getPriorityWeight(a.seq.priority_data?.description);
                  const pb = getPriorityWeight(b.seq.priority_data?.description);
                  if (pa !== pb) return pa - pb;
                  return (
                    new Date(a.seq.created_at).getTime() - new Date(b.seq.created_at).getTime()
                  );
                });

              return (
                <div
                  key={office.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
                >
                  {/* Office header */}
                  <div className="shrink-0 border-b border-border px-3 py-2">
                    <p className="break-words text-sm font-bold text-foreground">{officeName}</p>
                  </div>

                  {/* Now serving / waiting — split into two colour zones */}
                  <div className="flex flex-1 flex-col overflow-hidden">
                    {/* ── SERVING zone (green tint) ── */}
                    <div className="flex flex-col items-center gap-2 bg-emerald-100 dark:bg-emerald-950/40 px-4 pt-3 pb-3 shrink-0">
                      <span className="self-start text-[10px] font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400/70">
                        Now Serving
                      </span>
                      {servingEntries.length > 0 ? (
                        servingEntries.map(({ seq, windowLabel, style }) => (
                          <div key={seq.id} className="flex w-full flex-col items-center gap-0.5">
                            <span
                              className={`text-center font-black tracking-[0.12em] ${style.text}${seq.id === activeNotif?.id ? ' queue-blink' : ''}`}
                              style={{ fontSize: 'clamp(2rem, 6vw, 3rem)', lineHeight: 1.1 }}
                              aria-live="polite"
                            >
                              {seq.queue_data?.code || '---'}
                            </span>
                            {windowLabel && (
                              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300/80">
                                {windowLabel}
                              </span>
                            )}
                          </div>
                        ))
                      ) : (
                        <span
                          className="font-bold text-emerald-400 dark:text-emerald-700/50"
                          style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
                        >
                          —
                        </span>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="w-full border-t border-dashed border-border" />

                    {/* ── WAITING zone (silver/slate tint) ── */}
                    <div className="flex flex-1 flex-col items-center gap-1 overflow-y-auto bg-slate-100 dark:bg-slate-700/30 px-4 pt-3 pb-4">
                      <span className="self-start text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400/70 mb-1">
                        Waiting
                      </span>
                      {waitingEntries.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No waiting</p>
                      ) : (
                        <ul className="flex flex-col items-center gap-2 w-full" role="list">
                          {waitingEntries.map(({ seq, windowLabel, style }) => (
                            <li
                              key={seq.id}
                              className="flex flex-col items-center justify-center w-full"
                              style={{ opacity: windowLabel ? 1 : 0.5 }}
                            >
                              <span
                                className={`font-black tracking-wide ${style.text}`}
                                style={{ fontSize: 'clamp(2rem, 6vw, 2.3rem)' }}
                              >
                                {seq.queue_data?.code || '---'}
                              </span>
                              <span className="text-xs font-semibold text-muted-foreground">
                                {windowLabel || 'Unassigned'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Blink keyframe for the currently-called queue code */}
      <style>{`
        @keyframes blink-queue {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        .queue-blink { animation: blink-queue 0.55s step-end infinite; }
      `}</style>
    </>
  );
};

export default QueueDisplay;
