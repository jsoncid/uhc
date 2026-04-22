import { useState, useEffect, useRef, useMemo, DragEvent } from 'react';
import { Loader2 } from 'lucide-react';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import darkLogo from 'src/assets/images/logos/dark-logo.svg';
import lightLogo from 'src/assets/images/logos/light-logo.svg';
import { useOfficeStore, Office } from '@/stores/module-1_stores/useOfficeStore';
import { useQueueStore } from '@/stores/module-1_stores/useQueueStore';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/lib/supabase';

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Queue Display' }];

const REPEAT_COUNT = 2; // how many times to announce
const PAUSE_BETWEEN_MS = 250; // pause between each announcement
const POPUP_GAP_MS = 250; // gap after speech before picking up the next item
const MAX_OFFICES_PER_ROW = 8;
const MAX_WAITING_PER_COLUMN = 6;

// Full-bleed spacing and persisted office order key.
const SCREEN_SIDE_MARGIN_PX = 8;
const OFFICE_ORDER_STORAGE_KEY = 'queue-display-office-order-v1';
const QUEUE_UI_SCALE = 1.79;

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
function speakRepeat(text: string, times: number, onDone: () => void, rate?: number): void {
  window.speechSynthesis.cancel();

  let count = 0;

  const speakOnce = () => {
    const utter = new SpeechSynthesisUtterance(text);
    const voice = getFemaleVoice();
    if (voice) utter.voice = voice;
    utter.pitch = 1.05;
    utter.rate = rate ?? 0.85; // default slower pace, or per-call override

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

const isRegularPriority = (priority: string | null | undefined): boolean => {
  const desc = (priority ?? '').toLowerCase();
  return desc === '' || desc.includes('regular');
};

const getPriorityStyle = (priority: string | null | undefined) => {
  // Anything that is not explicitly "regular" is treated as priority (red)
  const isRegular = isRegularPriority(priority);
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
  const [officeOrderIds, setOfficeOrderIds] = useState<string[]>([]);
  const [draggedOfficeId, setDraggedOfficeId] = useState<string | null>(null);
  const [dragOverOfficeId, setDragOverOfficeId] = useState<string | null>(null);
  const [isOfficeOrderHydrated, setIsOfficeOrderHydrated] = useState(false);
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
    const activeOfficeIds = new Set(activeOffices.map((o) => o.id));
    const fresh: CallNotification[] = [];
    sequences.forEach((seq) => {
      if (
        seq.is_active !== false &&
        seq.status_data?.description?.toLowerCase().includes('serving') &&
        !seenIds.current.has(seq.id) &&
        activeOfficeIds.has(seq.office)
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

    /** Format a queue code so each letter is spoken with a longer pause, e.g. "ABX" → "A...... B...... C...... " */
    function formatQueueCodeForSpeech(code: string): string {
      return (code || '').split('').join('... ') + '... ';
    }

    const spokenCode = formatQueueCodeForSpeech(next.queueCode);
    // Announce once: "Now calling, V...... A...... X...... , at the office. Please proceed to Window 1."
    const announcement = `Now calling, ${spokenCode}to ${next.officeName || 'the office'}. Please proceed to ${next.windowLabel}.`;

    speakRepeat(
      announcement,
      REPEAT_COUNT,
      () => {
        setTimeout(() => {
          pingChRef.current?.send({
            type: 'broadcast',
            event: 'ping-done',
            payload: { sequenceId: next.id },
          });
          setActiveNotif(null);
        }, POPUP_GAP_MS);
      },
      0.85,
    );
  }, [notifQueue, activeNotif]);
  useEffect(() => {
    const ch = supabase
      .channel('queue-ping-broadcast', { config: { broadcast: { self: true } } })
      .on('broadcast', { event: 'ping' }, ({ payload }) => {
        // Only process pings for offices that belong to this user's assignment
        const officeId = payload.officeId as string;
        const isOwnOffice = offices.some((o) => o.id === officeId && o.status);
        if (!isOwnOffice) return;

        const code = (payload.queueCode as string) || '---';
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
          } as CallNotification,
        ]);
      })
      .subscribe();
    pingChRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
      pingChRef.current = null;
    };
  }, [offices]);

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

  // Load any previously saved office order from localStorage.
  // This preserves the drag arrangement after page refresh.
  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsOfficeOrderHydrated(true);
      return;
    }

    try {
      const raw = window.localStorage.getItem(OFFICE_ORDER_STORAGE_KEY);
      if (!raw) return;

      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      const savedOrder = parsed.filter((id): id is string => typeof id === 'string');
      if (savedOrder.length > 0) {
        setOfficeOrderIds(savedOrder);
      }
    } catch {
      // Ignore malformed localStorage payloads and continue with default order.
    } finally {
      setIsOfficeOrderHydrated(true);
    }
  }, []);

  // Persist office order whenever it changes.
  useEffect(() => {
    if (!isOfficeOrderHydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(OFFICE_ORDER_STORAGE_KEY, JSON.stringify(officeOrderIds));
  }, [officeOrderIds, isOfficeOrderHydrated]);

  // Keep the saved order in sync with active offices.
  // 1) remove ids that are no longer active
  // 2) append newly active offices at the end
  useEffect(() => {
    const activeIds = activeOffices.map((office) => office.id);
    setOfficeOrderIds((prev) => {
      if (activeIds.length === 0) return prev;

      const retained = prev.filter((id) => activeIds.includes(id));
      const added = activeIds.filter((id) => !retained.includes(id));
      const next = [...retained, ...added];

      if (next.length === prev.length && next.every((id, idx) => id === prev[idx])) {
        return prev;
      }

      return next;
    });
  }, [activeOffices]);

  // Materialize ordered office objects from the id list.
  const orderedActiveOffices = useMemo(() => {
    if (officeOrderIds.length === 0) return activeOffices;

    const officeById = new Map(activeOffices.map((office) => [office.id, office]));
    return officeOrderIds
      .map((officeId) => officeById.get(officeId))
      .filter((office): office is Office => Boolean(office));
  }, [activeOffices, officeOrderIds]);

  // Move one office id before/into another position during drag reorder.
  const moveOffice = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;

    setOfficeOrderIds((prev) => {
      const fromIndex = prev.indexOf(sourceId);
      const toIndex = prev.indexOf(targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const next = [...prev];
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, sourceId);
      return next;
    });
  };

  // Drag and drop handlers for office card rearrangement.
  const handleOfficeDragStart = (event: DragEvent<HTMLDivElement>, officeId: string) => {
    setDraggedOfficeId(officeId);
    setDragOverOfficeId(officeId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', officeId);
  };

  const handleOfficeDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleOfficeDragEnter = (officeId: string) => {
    if (!draggedOfficeId || draggedOfficeId === officeId) return;
    setDragOverOfficeId(officeId);
    moveOffice(draggedOfficeId, officeId);
  };

  const handleOfficeDrop = (event: DragEvent<HTMLDivElement>, officeId: string) => {
    event.preventDefault();
    const droppedOfficeId = event.dataTransfer.getData('text/plain') || draggedOfficeId;
    if (droppedOfficeId) {
      moveOffice(droppedOfficeId, officeId);
    }
    setDraggedOfficeId(null);
    setDragOverOfficeId(null);
  };

  const handleOfficeDragEnd = () => {
    setDraggedOfficeId(null);
    setDragOverOfficeId(null);
  };

  const queueScaledStyle = useMemo(
    () => ({
      width: isDisplayMode
        ? `calc((100vw - ${SCREEN_SIDE_MARGIN_PX * 2}px) / ${QUEUE_UI_SCALE})`
        : `calc(100% / ${QUEUE_UI_SCALE})`,
      height: `calc(100vh / ${QUEUE_UI_SCALE})`,
      marginLeft: isDisplayMode ? `calc(50% - 50vw + ${SCREEN_SIDE_MARGIN_PX}px)` : 0,
      marginRight: isDisplayMode ? `calc(50% - 50vw + ${SCREEN_SIDE_MARGIN_PX}px)` : 0,
      transform: `scale(${QUEUE_UI_SCALE})`,
      transformOrigin: 'top left',
    }),
    [isDisplayMode],
  );

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
        style={queueScaledStyle}
        className={`flex h-screen flex-col overflow-hidden text-foreground ${
          isDisplayMode ? 'px-0 py-1 md:py-1.5' : 'px-0 py-1 md:py-1.5'
        } gap-1.5 md:gap-2`}
      >
        {/* Header: title + clock */}
        <header className="flex shrink-0 items-center justify-between border-b border-border pb-2.5">
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
          <div className="flex items-center gap-3 pr-1">
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
              className="whitespace-nowrap text-xl font-extrabold tabular-nums text-foreground dark:text-white md:text-2xl"
              aria-live="polite"
            >
              {formatTime(currentTime)}
            </span>
            <span className="whitespace-nowrap text-sm font-semibold text-foreground/80 dark:text-white/85">
              {formatDate(currentTime)}
            </span>
          </div>
        </header>

        {/* Bottom section: per-office columns */}
        <div
          className="queue-scroll min-h-0 flex-1 grid gap-2 overflow-x-hidden overflow-y-auto"
          style={{
            gridTemplateColumns: `repeat(${Math.max(1, Math.min(orderedActiveOffices.length, MAX_OFFICES_PER_ROW))}, minmax(0, 1fr))`,
            gridAutoRows: 'max-content',
          }}
        >
          {orderedActiveOffices.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              No active offices
            </div>
          ) : (
            orderedActiveOffices.map((office: Office) => {
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
                .map((seq) => ({ seq }))
                .sort((a, b) => {
                  const pa = getPriorityWeight(a.seq.priority_data?.description);
                  const pb = getPriorityWeight(b.seq.priority_data?.description);
                  if (pa !== pb) return pa - pb;
                  return (
                    new Date(a.seq.created_at).getTime() - new Date(b.seq.created_at).getTime()
                  );
                });

              const waitingPriorityEntries = waitingEntries.filter(
                ({ seq }) => !isRegularPriority(seq.priority_data?.description),
              );
              const waitingRegularEntries = waitingEntries.filter(({ seq }) =>
                isRegularPriority(seq.priority_data?.description),
              );
              const waitingPriorityVisible = waitingPriorityEntries.slice(
                0,
                MAX_WAITING_PER_COLUMN,
              );
              const waitingRegularVisible = waitingRegularEntries.slice(0, MAX_WAITING_PER_COLUMN);

              // Density = max rows shown in either waiting column.
              // We use this to scale code font sizes and vertical spacing.
              const waitingDensity = Math.max(
                waitingPriorityVisible.length,
                waitingRegularVisible.length,
              );

              // Queue code typography scale.
              // Serving size is stable; waiting size adapts by density for readability.
              const servingCodeSize = 'clamp(1.92rem, 2.8vw, 2.54rem)';
              const waitingCodeSize =
                waitingDensity >= 6
                  ? 'clamp(1.14rem, 1.56vw, 1.37rem)'
                  : waitingDensity === 5
                    ? 'clamp(1.25rem, 1.76vw, 1.51rem)'
                    : waitingDensity === 4
                      ? 'clamp(1.35rem, 1.95vw, 1.64rem)'
                      : 'clamp(1.53rem, 2.34vw, 1.95rem)';

              // Small heading adjustments in dense layouts to free vertical space.
              const waitingHeadingMarginClass = waitingDensity >= 5 ? 'mb-0.5' : 'mb-1';
              const waitingCodeLineHeight = 1.12;

              return (
                <div
                  key={office.id}
                  draggable
                  onDragStart={(event) => handleOfficeDragStart(event, office.id)}
                  onDragOver={handleOfficeDragOver}
                  onDragEnter={() => handleOfficeDragEnter(office.id)}
                  onDrop={(event) => handleOfficeDrop(event, office.id)}
                  onDragEnd={handleOfficeDragEnd}
                  className={`flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card transition-opacity duration-150 ${draggedOfficeId === office.id ? 'cursor-grabbing opacity-75' : 'cursor-grab'} ${dragOverOfficeId === office.id && draggedOfficeId !== office.id ? 'ring-2 ring-emerald-400/70' : ''}`}
                >
                  {/* Office header */}
                  <div className="shrink-0 border-b border-border px-2.5 py-0.5">
                    <p
                      className="w-full truncate text-center text-base font-bold text-foreground"
                      title={officeName}
                    >
                      {officeName}
                    </p>
                  </div>

                  {/* Now serving / waiting — split into two colour zones */}
                  <div className="flex flex-1 flex-col overflow-hidden">
                    {/* ── SERVING zone (green tint) ── */}
                    <div className="flex shrink-0 flex-col overflow-hidden bg-emerald-100 px-2.5 py-1 dark:bg-emerald-950/40">
                      <span className="self-start text-[0.7rem] font-bold uppercase tracking-widest text-emerald-950 dark:text-white">
                        Now Serving
                      </span>
                      <div className="flex min-h-0 items-start justify-center overflow-hidden pt-0.5">
                        {servingEntries.length > 0 ? (
                          <div className="flex w-full min-h-0 flex-col items-center justify-start gap-0.5 overflow-hidden">
                            {servingEntries.map(({ seq, windowLabel, style }) => (
                              <div
                                key={seq.id}
                                className="flex w-full flex-col items-center gap-0.5 overflow-hidden"
                              >
                                <span
                                  className={`text-center font-black tracking-[0.12em] ${style.text}${seq.id === activeNotif?.id ? ' queue-blink' : ''}`}
                                  style={{ fontSize: servingCodeSize, lineHeight: 1.1 }}
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
                            ))}
                          </div>
                        ) : (
                          <span
                            className="font-bold text-emerald-400 dark:text-emerald-700/50"
                            style={{ fontSize: 'clamp(1.1rem, 2.6vw, 1.7rem)' }}
                          >
                            —
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="w-full border-t border-dashed border-border" />

                    {/* ── WAITING zone (silver/slate tint) ── */}
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100 px-2.5 py-1 dark:bg-slate-700/30">
                      <span className="mb-1 self-start text-[0.7rem] font-bold uppercase tracking-widest text-black dark:text-white">
                        Waiting
                      </span>
                      {waitingEntries.length === 0 ? (
                        <p className="text-xs font-medium text-black dark:text-white">No waiting</p>
                      ) : (
                        <div className="grid flex-1 grid-cols-2 items-stretch gap-1">
                          <div className="flex flex-col px-1 py-0.5">
                            <span
                              className={`${waitingHeadingMarginClass} w-full truncate text-center text-[0.7rem] font-bold uppercase tracking-wide text-rose-700 dark:text-rose-300/90`}
                            >
                              Priority
                            </span>
                            {waitingPriorityVisible.length === 0 ? (
                              <div className="flex flex-1" aria-hidden="true" />
                            ) : (
                              <ul className="space-y-1" role="list">
                                {waitingPriorityVisible.map(({ seq }) => (
                                  <li key={seq.id} className="flex items-center justify-center">
                                    <span
                                      className="font-black tracking-wide text-rose-600 dark:text-rose-400"
                                      style={{
                                        fontSize: waitingCodeSize,
                                        lineHeight: waitingCodeLineHeight,
                                      }}
                                    >
                                      {seq.queue_data?.code || '---'}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <div className="flex flex-col px-1 py-0.5">
                            <span
                              className={`${waitingHeadingMarginClass} w-full truncate text-center text-[0.7rem] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300/90`}
                            >
                              Regular
                            </span>
                            {waitingRegularVisible.length === 0 ? (
                              <div className="flex flex-1" aria-hidden="true" />
                            ) : (
                              <ul className="space-y-1" role="list">
                                {waitingRegularVisible.map(({ seq }) => (
                                  <li key={seq.id} className="flex items-center justify-center">
                                    <span
                                      className="font-black tracking-wide text-emerald-700 dark:text-emerald-400"
                                      style={{
                                        fontSize: waitingCodeSize,
                                        lineHeight: waitingCodeLineHeight,
                                      }}
                                    >
                                      {seq.queue_data?.code || '---'}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
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
        /* Hide outer grid scrollbars for a cleaner wall-display look. */
        .queue-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .queue-scroll::-webkit-scrollbar {
          width: 0;
          height: 0;
        }
      `}</style>
    </>
  );
};

export default QueueDisplay;
