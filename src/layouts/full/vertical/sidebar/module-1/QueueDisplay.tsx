import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { useOfficeStore, Office } from '@/stores/module-1_stores/useOfficeStore';
import { useQueueStore } from '@/stores/module-1_stores/useQueueStore';
import { useUserProfile } from '@/hooks/useUserProfile';

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Queue Display' }];

const QueueDisplay = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const isDisplayMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('display') === '1';
  }, []);

  const { profile, loading: profileLoading } = useUserProfile();
  const { offices, fetchOffices, isLoading: officesLoading } = useOfficeStore();
  const {
    sequences,
    priorities,
    fetchSequences,
    fetchStatuses,
    fetchPriorities,
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
    fetchPriorities();
  }, [fetchStatuses, fetchSequences, fetchPriorities]);

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

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

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
    if (desc.includes('senior'))
      return {
        text: 'text-blue-700 dark:text-blue-400',
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        dot: 'bg-blue-500',
      };
    if (desc.includes('pwd'))
      return {
        text: 'text-violet-700 dark:text-violet-400',
        bg: 'bg-violet-100 dark:bg-violet-900/30',
        dot: 'bg-violet-500',
      };
    if (desc.includes('priority'))
      return {
        text: 'text-rose-700 dark:text-rose-400',
        bg: 'bg-rose-100 dark:bg-rose-900/30',
        dot: 'bg-rose-500',
      };
    if (desc.includes('urgent'))
      return {
        text: 'text-amber-700 dark:text-amber-400',
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        dot: 'bg-amber-500',
      };
    if (desc.includes('vip'))
      return {
        text: 'text-amber-800 dark:text-amber-300',
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        dot: 'bg-amber-400',
      };
    return {
      text: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/30',
      dot: 'bg-emerald-500',
    };
  };

  const dynamicPriorityLegend = useMemo(() => {
    return priorities.map((p) => ({
      label: p.description || 'Unknown',
      style: getPriorityStyle(p.description),
    }));
  }, [priorities]);

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
          <h1 className="text-lg font-bold tracking-wide text-foreground md:text-xl">
            Queue Display
          </h1>
          <div className="flex items-baseline gap-4">
            <div className="flex items-center gap-2">
              {dynamicPriorityLegend.map((item) => (
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
        <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto overflow-y-hidden">
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
                  className="flex min-w-40 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card"
                >
                  {/* Office header */}
                  <div className="shrink-0 border-b border-border px-3 py-2">
                    <p className="truncate text-sm font-bold text-foreground">{officeName}</p>
                  </div>

                  {/* Now serving — stacked per active window */}
                  <div className="flex flex-1 flex-col items-center justify-start gap-0 overflow-y-auto pt-0 px-4 pb-4">
                    {/* Serving section */}
                    {servingEntries.length > 0 ? (
                      <>
                        <div className="w-full flex flex-col items-center gap-2 pb-4">
                          {servingEntries.map(({ seq, windowLabel, style }) => (
                            <div key={seq.id} className="flex w-full flex-col items-center gap-1">
                              <span
                                className={`text-center font-black tracking-[0.12em] ${style.text}`}
                                style={{
                                  fontSize: 'clamp(2rem, 6vw, 3rem)',
                                  lineHeight: 1.1,
                                }}
                                aria-live="polite"
                              >
                                {seq.queue_data?.code || '---'}
                              </span>
                              {windowLabel && (
                                <span className="text-xs font-semibold text-muted-foreground">
                                  {windowLabel}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="w-full border-t-3 border-dashed border-border mb-4" />
                      </>
                    ) : (
                      <>
                        <span
                          className="font-bold text-muted-foreground mb-4"
                          style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
                        >
                          —
                        </span>
                        <div className="w-full border-t-3 border-dashed border-border mb-4" />
                      </>
                    )}

                    {/* Waiting section with small font */}
                    <div className="w-full flex flex-col items-center gap-1 overflow-y-auto">
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
                                style={{
                                  fontSize: 'clamp(2rem, 6vw, 2.3rem)',
                                }}
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
    </>
  );
};

export default QueueDisplay;
