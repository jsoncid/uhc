import { useState, useEffect, useRef, useMemo, DragEvent } from 'react';
import { Loader2 } from 'lucide-react';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import darkLogo from 'src/assets/images/logos/dark-logo.svg';
import lightLogo from 'src/assets/images/logos/light-logo.svg';
import { useOfficeStore, Office } from '@/stores/module-1_stores/useOfficeStore';
import { useQueueStore, Sequence } from '@/stores/module-1_stores/useQueueStore';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/lib/supabase';

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Queue Display' }];

const REPEAT_COUNT = 2; // how many times to announce
const PAUSE_BETWEEN_MS = 250; // pause between each announcement
const POPUP_GAP_MS = 250; // gap after speech before picking up the next item
const SERVING_ROTATE_INTERVAL_MS = 2800;
const SERVING_FADE_DURATION_MS = 400;
const MAX_OFFICES_PER_ROW = 8;
const MAX_WAITING_PER_COLUMN = 8;
const MARQUEE_SCROLL_SPEED_PX_PER_SEC = 8;
const MIN_MARQUEE_DURATION_SEC = 18;
const WAITING_MARQUEE_TRIGGER_COUNT = 5;

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
function speakRepeat(
  text: string,
  times: number,
  onDone: () => void,
  rate?: number,
  shouldContinue: () => boolean = () => true,
): void {
  window.speechSynthesis.cancel();

  let count = 0;

  const scheduleNext = () => {
    if (!shouldContinue()) return;
    window.setTimeout(() => {
      speakOnce();
    }, PAUSE_BETWEEN_MS);
  };

  const speakOnce = () => {
    if (!shouldContinue()) return;

    const utter = new SpeechSynthesisUtterance(text);
    const voice = getFemaleVoice();
    if (voice) utter.voice = voice;
    utter.pitch = 1.05;
    utter.rate = rate ?? 0.85; // default slower pace, or per-call override

    utter.onend = () => {
      if (!shouldContinue()) return;
      count++;
      if (count < times) {
        scheduleNext();
      } else {
        onDone();
      }
    };

    utter.onerror = () => {
      if (!shouldContinue()) return;
      count++;
      if (count < times) scheduleNext();
      else onDone();
    };

    window.speechSynthesis.speak(utter);
  };

  speakOnce();
}

// ── Pure helpers at module scope so effects can reference them without stale-closure issues ──

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

const isServingSequence = (seq: Sequence): boolean =>
  seq.is_active !== false &&
  Boolean(seq.status_data?.description?.toLowerCase().includes('serving'));

const hasServingSequenceForDisplay = (
  sequenceId: string,
  sequences: Sequence[],
  activeOfficeIds: Set<string>,
): boolean =>
  sequences.some(
    (seq) => seq.id === sequenceId && isServingSequence(seq) && activeOfficeIds.has(seq.office),
  );

interface WaitingQueueColumnProps {
  title: string;
  titleClassName: string;
  numberClassName: string;
  codeClassName: string;
  entries: { seq: Sequence }[];
  orderBySeqId: Map<string, number>;
  waitingHeadingMarginClass: string;
}

interface ServingQueueEntry {
  seq: Sequence;
  windowLabel: string | null;
  style: ReturnType<typeof getPriorityStyle>;
}

interface ServingQueueRotatorProps {
  entries: ServingQueueEntry[];
  activeNotifId?: string;
}

const WaitingQueueColumn = ({
  title,
  titleClassName,
  numberClassName,
  codeClassName,
  entries,
  orderBySeqId,
  waitingHeadingMarginClass,
}: WaitingQueueColumnProps) => {
  const windowRef = useRef<HTMLDivElement | null>(null);
  const measureListRef = useRef<HTMLUListElement | null>(null);
  const [shouldMarquee, setShouldMarquee] = useState(false);

  const entrySignature = useMemo(
    () => entries.map(({ seq }) => `${seq.id}:${seq.queue_data?.code || ''}`).join('|'),
    [entries],
  );

  useEffect(() => {
    const container = windowRef.current;
    const measureList = measureListRef.current;
    if (!container || !measureList) {
      setShouldMarquee(false);
      return;
    }

    const updateMarquee = () => {
      const contentHeight = measureList.scrollHeight;
      const overflowing = contentHeight > container.clientHeight + 1;
      const shouldRunMarquee = overflowing || entries.length > WAITING_MARQUEE_TRIGGER_COUNT;
      setShouldMarquee((prev) => (prev === shouldRunMarquee ? prev : shouldRunMarquee));

      if (shouldRunMarquee) {
        const durationSeconds = Math.max(
          MIN_MARQUEE_DURATION_SEC,
          Math.max(contentHeight, container.clientHeight) / MARQUEE_SCROLL_SPEED_PX_PER_SEC,
        );
        container.style.setProperty('--queue-marquee-duration', `${durationSeconds}s`);
      } else {
        container.style.removeProperty('--queue-marquee-duration');
      }
    };

    let rafId: number | null = null;
    const scheduleUpdate = () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = window.requestAnimationFrame(() => {
        updateMarquee();
        rafId = null;
      });
    };

    scheduleUpdate();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(scheduleUpdate) : null;
    resizeObserver?.observe(container);
    resizeObserver?.observe(measureList);
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener('resize', scheduleUpdate);
      resizeObserver?.disconnect();
    };
  }, [entrySignature]);

  if (entries.length === 0) {
    return (
      <div className="flex flex-col px-[2px] py-0">
        <span
          className={`${waitingHeadingMarginClass} w-full truncate text-center text-[13px] font-bold uppercase tracking-[0.14em] ${titleClassName}`}
        >
          {title}
        </span>
        <div className="flex flex-1" aria-hidden="true" />
      </div>
    );
  }

  const renderedEntries = shouldMarquee ? [...entries, ...entries] : entries;

  return (
    <div className="flex flex-col px-[2px] py-0">
      <span
        className={`${waitingHeadingMarginClass} w-full truncate text-center text-[13px] font-bold uppercase tracking-[0.14em] ${titleClassName}`}
      >
        {title}
      </span>
      <div ref={windowRef} className="queue-waiting-window">
        <ul
          ref={measureListRef}
          className="queue-waiting-list queue-waiting-measure"
          aria-hidden="true"
        >
          {entries.map(({ seq }, idx) => (
            <li key={`${seq.id}-measure-${idx}`} className="queue-waiting-item">
              <div className="flex w-full min-w-0 items-center justify-start gap-px">
                <span className={`${numberClassName} queue-waiting-order shrink-0`}>
                  {orderBySeqId.get(seq.id)}.
                </span>
                <span className={`${codeClassName} queue-waiting-code`}>
                  {seq.queue_data?.code || '---'}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <div className="queue-waiting-track">
          <ul
            className={`queue-waiting-list ${shouldMarquee ? 'queue-waiting-marquee' : ''}`}
            role="list"
          >
            {renderedEntries.map(({ seq }, idx) => (
              <li key={`${seq.id}-${idx}`} className="queue-waiting-item">
                <div className="flex w-full min-w-0 items-center justify-start gap-px">
                  <span className={`${numberClassName} queue-waiting-order shrink-0`}>
                    {orderBySeqId.get(seq.id)}.
                  </span>
                  <span className={`${codeClassName} queue-waiting-code`}>
                    {seq.queue_data?.code || '---'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

const ServingQueueRotator = ({ entries, activeNotifId }: ServingQueueRotatorProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const entrySignature = useMemo(
    () =>
      entries
        .map(({ seq, windowLabel }) => `${seq.id}:${seq.queue_data?.code || ''}:${windowLabel || ''}`)
        .join('|'),
    [entries],
  );

  useEffect(() => {
    setActiveIndex(0);
    setIsFadingOut(false);
  }, [entrySignature]);

  useEffect(() => {
    if (entries.length <= 1) return;
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;

    let fadeTimeoutId: number | null = null;
    const intervalId = window.setInterval(() => {
      setIsFadingOut(true);
      fadeTimeoutId = window.setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % entries.length);
        setIsFadingOut(false);
      }, SERVING_FADE_DURATION_MS);
    }, SERVING_ROTATE_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      if (fadeTimeoutId !== null) {
        window.clearTimeout(fadeTimeoutId);
      }
    };
  }, [entries.length, entrySignature]);

  const activeEntry = entries[activeIndex] || entries[0];
  if (!activeEntry) return null;

  const { seq, windowLabel, style } = activeEntry;
  const windowWords = windowLabel?.trim().split(/\s+/).filter(Boolean) || [];
  const isTwoWordWindow = windowWords.length === 2;

  return (
    <div className={`queue-serving-transition ${isFadingOut ? 'queue-serving-fade-out' : ''}`}>
      <div className="queue-serving-line">
        <span
          className={`queue-serving-code text-center font-black tracking-[0.08em] ${style.text}${seq.id === activeNotifId ? ' queue-blink' : ''}`}
          aria-live="polite"
        >
          {seq.queue_data?.code || '---'}
        </span>
        {windowLabel && (
          <>
            <span className={`queue-serving-separator font-black ${style.text}`} aria-hidden="true">
              -
            </span>
            {isTwoWordWindow ? (
              <span
                className={`queue-serving-window queue-serving-window-stacked font-bold ${style.text}`}
                title={windowLabel}
              >
                <span>{windowWords[0]}</span>
                <span>{windowWords[1]}</span>
              </span>
            ) : (
              <span className={`queue-serving-window font-bold ${style.text}`} title={windowLabel}>
                {windowLabel}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
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
  // Invalidate stale speech callbacks when a call is cancelled or superseded.
  const announcementRunIdRef = useRef(0);
  // Keep current speaking sequence id in a ref for async broadcast handlers.
  const activeNotifIdRef = useRef<string | null>(null);
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
  const activeOffices = useMemo(() => offices.filter((o) => o.status), [offices]);

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

  useEffect(() => {
    activeNotifIdRef.current = activeNotif?.id ?? null;
  }, [activeNotif]);

  // Detect newly-serving sequences and push onto the notification queue.
  // On the very first snapshot we silently seed seenIds (no announcement on page load);
  // every subsequent change is treated as a realtime event and will be announced.
  useEffect(() => {
    if (sequences.length === 0) return;

    if (!initializedRef.current) {
      // Seed all currently-serving IDs so they are never announced on refresh
      sequences.forEach((seq) => {
        if (isServingSequence(seq)) {
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
        isServingSequence(seq) &&
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
    if (fresh.length > 0) {
      setNotifQueue((prev) => {
        const queuedIds = new Set(prev.map((notif) => notif.id));
        const uniqueFresh = fresh.filter((notif) => !queuedIds.has(notif.id));
        if (uniqueFresh.length === 0) {
          return prev;
        }
        return [...prev, ...uniqueFresh];
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequences]);

  // Sequential processor: one announcement at a time.
  // Uses activeNotif (state) as the sole lock — clearing it triggers a re-run
  // so the next queued item is always picked up correctly.
  useEffect(() => {
    if (activeNotif !== null || notifQueue.length === 0) return;

    const activeOfficeIds = new Set(activeOffices.map((office) => office.id));
    const nextIndex = notifQueue.findIndex((notif) =>
      hasServingSequenceForDisplay(notif.id, sequences, activeOfficeIds),
    );
    if (nextIndex === -1) return;

    const next = notifQueue[nextIndex] as CallNotification & { spokenCode?: string };
    setNotifQueue((prev) => prev.slice(nextIndex + 1));
    setActiveNotif(next);
    announcementRunIdRef.current += 1;
    const runId = announcementRunIdRef.current;

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
        if (announcementRunIdRef.current !== runId) return;
        setTimeout(() => {
          if (announcementRunIdRef.current !== runId) return;
          pingChRef.current?.send({
            type: 'broadcast',
            event: 'ping-done',
            payload: { sequenceId: next.id },
          });
          setActiveNotif((current) => (current?.id === next.id ? null : current));
        }, POPUP_GAP_MS);
      },
      0.85,
      () => announcementRunIdRef.current === runId,
    );
  }, [notifQueue, activeNotif, sequences, activeOffices]);

  useEffect(() => {
    if (!activeNotif) return;

    const activeOfficeIds = new Set(activeOffices.map((office) => office.id));
    const stillServing = hasServingSequenceForDisplay(activeNotif.id, sequences, activeOfficeIds);

    if (stillServing) return;

    announcementRunIdRef.current += 1;
    window.speechSynthesis.cancel();
    setActiveNotif(null);
  }, [activeNotif, sequences, activeOffices]);

  useEffect(() => {
    return () => {
      announcementRunIdRef.current += 1;
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    const ch = supabase
      .channel('queue-ping-broadcast', { config: { broadcast: { self: true } } })
      .on('broadcast', { event: 'ping' }, ({ payload }) => {
        // Only process pings for offices that belong to this user's assignment
        const officeId = payload.officeId as string;
        const isOwnOffice = offices.some((o) => o.id === officeId && o.status);
        if (!isOwnOffice) return;

        const sequenceId = payload.sequenceId as string | undefined;
        // Ignore pings without a real sequence id so stale put-back items never speak.
        if (!sequenceId) return;

        // If already speaking this same sequence, do not enqueue it again.
        if (activeNotifIdRef.current === sequenceId) return;

        // Mark as seen so the serving-change detector won't enqueue a duplicate.
        seenIds.current.add(sequenceId);

        const code = (payload.queueCode as string) || '---';
        setNotifQueue((prev) => {
          if (prev.some((notif) => notif.id === sequenceId)) {
            return prev;
          }

          return [
            ...prev,
            {
              id: sequenceId,
              queueCode: code,
              windowLabel: (payload.windowLabel as string) || 'the window',
              officeName: (payload.officeName as string) || '',
              priorityText: (payload.priorityDesc as string) || 'Regular',
              priorityStyle: getPriorityStyle(payload.priorityDesc as string | null),
            } as CallNotification,
          ];
        });
      })
      .on('broadcast', { event: 'stop-announcement' }, ({ payload }) => {
        const officeId = payload.officeId as string | undefined;
        // Ignore malformed/global stop events that don't specify an office scope.
        if (!officeId) return;

        const isOwnOffice = offices.some((o) => o.id === officeId && o.status);
        if (!isOwnOffice) return;

        const sequenceId = payload.sequenceId as string | undefined;
        if (!sequenceId) return;

        setNotifQueue((prev) => prev.filter((notif) => notif.id !== sequenceId));

        // Cancel speech only when the currently speaking sequence is the one being stopped.
        if (activeNotifIdRef.current !== sequenceId) {
          return;
        }

        announcementRunIdRef.current += 1;
        window.speechSynthesis.cancel();
        setActiveNotif((current) => (current?.id === sequenceId ? null : current));
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

  const officeColumnCount = useMemo(
    () => Math.max(1, Math.min(orderedActiveOffices.length, MAX_OFFICES_PER_ROW)),
    [orderedActiveOffices.length],
  );

  const officeRowCount = useMemo(() => {
    if (orderedActiveOffices.length === 0) return 1;
    return Math.ceil(orderedActiveOffices.length / officeColumnCount);
  }, [orderedActiveOffices.length, officeColumnCount]);

  const isCompactQueueLayout = officeColumnCount >= 7 || officeRowCount >= 2;

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
        } ${isCompactQueueLayout ? 'queue-density-compact' : ''} gap-1.5 md:gap-2`}
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
          className="queue-scroll min-h-0 flex-1 content-start items-start grid gap-2 overflow-x-hidden overflow-y-auto"
          style={{
            gridTemplateColumns: `repeat(${officeColumnCount}, minmax(0, 1fr))`,
            gridAutoRows: 'auto',
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
                .filter((seq) => seq.office === office.id && isServingSequence(seq))
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
              const waitingPriorityOrderBySeqId = new Map(
                waitingPriorityEntries.map(({ seq }, idx) => [seq.id, idx + 1]),
              );
              const waitingRegularOrderBySeqId = new Map(
                waitingRegularEntries.map(({ seq }, idx) => [seq.id, idx + 1]),
              );

              // Queue code typography scale.
              // Small heading adjustments in dense layouts to free vertical space.
              const waitingHeadingMarginClass = isCompactQueueLayout ? 'mb-0' : 'mb-0.5';

              return (
                <div
                  key={office.id}
                  draggable
                  onDragStart={(event) => handleOfficeDragStart(event, office.id)}
                  onDragOver={handleOfficeDragOver}
                  onDragEnter={() => handleOfficeDragEnter(office.id)}
                  onDrop={(event) => handleOfficeDrop(event, office.id)}
                  onDragEnd={handleOfficeDragEnd}
                  className={`queue-office-card flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card transition-opacity duration-150 ${draggedOfficeId === office.id ? 'cursor-grabbing opacity-75' : 'cursor-grab'} ${dragOverOfficeId === office.id && draggedOfficeId !== office.id ? 'ring-2 ring-emerald-400/70' : ''}`}
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
                  <div className="flex flex-col overflow-hidden">
                    {/* ── SERVING zone (green tint) ── */}
                    <div className="queue-serving-zone flex shrink-0 flex-col overflow-hidden bg-emerald-100 px-2.5 py-0 dark:bg-emerald-950/40">
                      <span className="self-start text-[0.7rem] font-bold uppercase tracking-widest leading-none text-emerald-950 dark:text-white">
                        Now Serving
                      </span>
                      <div className="queue-serving-content flex min-h-0 items-center justify-center overflow-hidden">
                        {servingEntries.length > 0 ? (
                          <ServingQueueRotator entries={servingEntries} activeNotifId={activeNotif?.id} />
                        ) : (
                          <span className="queue-serving-empty font-bold text-emerald-400 dark:text-emerald-700/50">
                            —
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="w-full border-t border-dashed border-border" />

                    {/* ── WAITING zone (silver/slate tint) ── */}
                    <div className="queue-waiting-zone flex shrink-0 flex-col overflow-hidden bg-slate-100 px-2 py-[3px] dark:bg-slate-700/30">
                      <span className="mb-0.5 self-start text-[13px] font-bold uppercase tracking-[0.16em] text-black dark:text-white">
                        Waiting
                      </span>
                      {waitingEntries.length === 0 ? (
                        <div className="queue-waiting-empty-state">
                          <p className="text-[14px] font-medium leading-[1.1] text-black dark:text-white">
                            No waiting
                          </p>
                        </div>
                      ) : (
                        <div className="queue-waiting-columns grid flex-1 grid-cols-2 items-stretch gap-0.5">
                          <WaitingQueueColumn
                            title="Priority"
                            titleClassName="text-rose-700 dark:text-rose-300/90"
                            numberClassName="font-extrabold text-rose-500/90 dark:text-rose-300/90"
                            codeClassName="font-black tracking-[0.02em] text-rose-600 dark:text-rose-400"
                            entries={waitingPriorityEntries}
                            orderBySeqId={waitingPriorityOrderBySeqId}
                            waitingHeadingMarginClass={waitingHeadingMarginClass}
                          />

                          <WaitingQueueColumn
                            title="Regular"
                            titleClassName="text-emerald-700 dark:text-emerald-300/90"
                            numberClassName="font-extrabold text-emerald-600/90 dark:text-emerald-300/90"
                            codeClassName="font-black tracking-[0.02em] text-emerald-700 dark:text-emerald-400"
                            entries={waitingRegularEntries}
                            orderBySeqId={waitingRegularOrderBySeqId}
                            waitingHeadingMarginClass={waitingHeadingMarginClass}
                          />
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

        @keyframes queue-waiting-up {
          from { transform: translateY(0); }
          to { transform: translateY(-50%); }
        }

        .queue-serving-zone {
          --queue-serving-content-height: 72px;
          --queue-serving-fade-duration: ${SERVING_FADE_DURATION_MS}ms;
        }

        .queue-serving-content {
          height: var(--queue-serving-content-height);
          min-height: var(--queue-serving-content-height);
          max-height: var(--queue-serving-content-height);
        }

        .queue-serving-transition {
          width: 100%;
          height: 100%;
          min-width: 0;
          display: flex;
          align-items: stretch;
          opacity: 1;
          transition: opacity var(--queue-serving-fade-duration) ease-in-out;
        }

        .queue-serving-fade-out {
          opacity: 0;
        }

        .queue-waiting-zone {
          --queue-marquee-duration: 22s;
          --queue-waiting-row-height: 20px;
          --queue-waiting-row-gap: 0px;
          --queue-waiting-column-heading-height: 18px;
          --queue-waiting-window-height: calc((var(--queue-waiting-row-height) * ${MAX_WAITING_PER_COLUMN}) + (var(--queue-waiting-row-gap) * ${MAX_WAITING_PER_COLUMN - 1}));
          --queue-waiting-columns-height: calc(var(--queue-waiting-column-heading-height) + var(--queue-waiting-window-height));
        }

        .queue-waiting-columns,
        .queue-waiting-empty-state {
          height: var(--queue-waiting-columns-height);
          min-height: var(--queue-waiting-columns-height);
          max-height: var(--queue-waiting-columns-height);
        }

        .queue-waiting-empty-state {
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
          padding-top: 1px;
        }

        .queue-waiting-window {
          position: relative;
          isolation: isolate;
          contain: layout paint;
          clip-path: inset(0);
          height: var(--queue-waiting-window-height);
          min-height: var(--queue-waiting-window-height);
          max-height: var(--queue-waiting-window-height);
          overflow: hidden;
        }

        .queue-waiting-track {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .queue-waiting-list {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: var(--queue-waiting-row-gap);
        }

        .queue-waiting-measure {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          visibility: hidden;
          pointer-events: none;
        }

        .queue-waiting-item {
          display: flex;
          align-items: center;
          justify-content: center;
          height: var(--queue-waiting-row-height);
          line-height: 1;
          overflow: hidden;
        }

        .queue-office-card {
          isolation: isolate;
          contain: layout paint;
        }

        .queue-serving-code {
          flex: 0 0 auto;
          font-size: 50px;
          line-height: 0.95;
          white-space: nowrap;
        }

        .queue-serving-line {
          width: 100%;
          height: 100%;
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          overflow: hidden;
          white-space: nowrap;
        }

        .queue-serving-separator {
          flex: 0 0 auto;
          font-size: 18px;
          line-height: 1;
        }

        .queue-serving-window {
          min-width: 0;
          max-width: 66%;
          font-size: 15px;
          line-height: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .queue-serving-window-stacked {
          display: inline-flex;
          flex-direction: column;
          align-items: flex-start;
          justify-content: center;
          gap: 0;
          line-height: 0.95;
          white-space: normal;
          overflow: visible;
          text-overflow: clip;
        }

        .queue-serving-empty {
          font-size: 1.15rem;
          line-height: 1;
        }

        .queue-waiting-order {
          font-size: 13px;
          line-height: 1;
          margin-right: 0;
        }

        .queue-waiting-code {
          min-width: 0;
          font-size: 20px;
          line-height: 0.96;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .queue-density-compact .queue-serving-zone {
          --queue-serving-content-height: 58px;
        }

        .queue-density-compact .queue-waiting-zone {
          --queue-waiting-row-height: 18px;
          --queue-waiting-row-gap: 0px;
          --queue-waiting-column-heading-height: 16px;
        }

        .queue-density-compact .queue-serving-code {
          font-size: 36px;
        }

        .queue-density-compact .queue-serving-separator {
          font-size: 14px;
        }

        .queue-density-compact .queue-serving-window {
          max-width: 64%;
          font-size: 12px;
        }

        .queue-density-compact .queue-serving-empty {
          font-size: 1rem;
        }

        .queue-density-compact .queue-waiting-order {
          font-size: 10px;
        }

        .queue-density-compact .queue-waiting-code {
          font-size: 17px;
          line-height: 0.95;
        }

        .queue-waiting-marquee {
          animation: queue-waiting-up var(--queue-marquee-duration) linear infinite;
          will-change: transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .queue-serving-transition {
            transition: none;
          }

          .queue-waiting-marquee {
            animation: none;
          }
        }

      `}</style>
    </>
  );
};

export default QueueDisplay;
