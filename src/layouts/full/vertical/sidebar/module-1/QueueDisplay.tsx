import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { useOfficeStore, Office, Window } from '@/stores/module-1_stores/useOfficeStore';
import { useQueueStore, Sequence } from '@/stores/module-1_stores/useQueueStore';
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
    statuses,
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

  const getStatusByDescription = (description: string) =>
    statuses.find((s) => s.description?.toLowerCase().includes(description.toLowerCase()));

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
      return { text: 'text-blue-700', bg: 'bg-blue-100', dot: 'bg-blue-500' };
    if (desc.includes('pwd'))
      return { text: 'text-violet-700', bg: 'bg-violet-100', dot: 'bg-violet-500' };
    if (desc.includes('priority'))
      return { text: 'text-rose-700', bg: 'bg-rose-100', dot: 'bg-rose-500' };
    if (desc.includes('urgent'))
      return { text: 'text-amber-700', bg: 'bg-amber-100', dot: 'bg-amber-500' };
    if (desc.includes('vip'))
      return { text: 'text-amber-800', bg: 'bg-amber-100', dot: 'bg-amber-400' };
    return { text: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' };
  };

  const dynamicPriorityLegend = useMemo(() => {
    return priorities.map((p) => ({
      label: p.description || 'Unknown',
      style: getPriorityStyle(p.description),
    }));
  }, [priorities]);

  const activeOffices = useMemo(() => offices.filter((o) => o.status), [offices]);

  const activeOfficesWithQueues = useMemo(() => {
    return activeOffices.filter((office) => {
      const hasServing = sequences.some(
        (seq) =>
          seq.office === office.id &&
          seq.status_data?.description?.toLowerCase().includes('serving'),
      );
      const hasWaiting = sequences.some(
        (seq) =>
          seq.office === office.id &&
          seq.status_data?.description?.toLowerCase().includes('pending'),
      );
      return hasServing || hasWaiting;
    });
  }, [activeOffices, sequences]);

  const pendingList = useMemo(() => {
    const pendingStatus = getStatusByDescription('pending');
    const officeIds = new Set(activeOffices.map((o) => o.id));
    const pending = sequences.filter(
      (seq) => seq.status === pendingStatus?.id && officeIds.has(seq.office),
    );
    return pending.sort((a, b) => {
      const pa = getPriorityWeight(a.priority_data?.description);
      const pb = getPriorityWeight(b.priority_data?.description);
      if (pa !== pb) return pa - pb;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, [sequences, activeOffices, statuses]);

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
        className={`flex h-screen flex-col overflow-hidden  text-white ${
          isDisplayMode ? 'p-4 md:p-6' : 'p-4'
        } gap-4`}
      >
        {/* Header: title + clock */}
        <header className="flex shrink-0 items-center justify-between border-b border-slate-700 pb-3">
          <h1 className="text-lg font-bold tracking-wide text-white md:text-xl">Queue Display</h1>
          <div className="flex items-baseline gap-4">
            <div className="flex items-center gap-2">
              {dynamicPriorityLegend.map((item) => (
                <div key={item.label} className="flex items-center gap-1">
                  <span className={`h-4 w-4 shrink-0 rounded-full ${item.style.dot}`} aria-hidden />
                  <span className={`text-xl font-semibold ${item.style.text}`}>{item.label}</span>
                </div>
              ))}
            </div>
            <div className="h-6 w-px bg-slate-600" />
            <span
              className="text-xl font-bold tabular-nums text-white md:text-2xl"
              aria-live="polite"
            >
              {formatTime(currentTime)}
            </span>
            <span className="text-sm text-slate-400">{formatDate(currentTime)}</span>
          </div>
        </header>

        {/* Bottom section: per-office columns */}
        <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto overflow-y-hidden">
          {activeOfficesWithQueues.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-slate-600">
              No active queues
            </div>
          ) : (
            activeOfficesWithQueues.map((office: Office) => {
              const officeName = office.description || office.id;

              // Use enriched status_data & window_data — no fragile ID lookup needed
              const servingEntries = sequences
                .filter(
                  (seq) =>
                    seq.office === office.id &&
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
                  className="flex min-w-[160px] flex-1 flex-col overflow-hidden rounded-xl border border-slate-700 bg-[#161b22]"
                >
                  {/* Office header */}
                  <div className="shrink-0 border-b border-slate-700 px-3 py-2">
                    <p className="truncate text-sm font-bold text-white">{officeName}</p>
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
                                <span className="text-xs font-semibold text-slate-400">
                                  {windowLabel}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="w-full border-t-3 border-dashed border-slate-500 mb-4" />
                      </>
                    ) : (
                      <>
                        <span
                          className="font-bold text-slate-700 mb-4"
                          style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
                        >
                          —
                        </span>
                        <div className="w-full border-t-3 border-dashed border-slate-500 mb-4" />
                      </>
                    )}

                    {/* Waiting section with small font */}
                    <div className="w-full flex flex-col items-center gap-1 overflow-y-auto">
                      {waitingEntries.length === 0 ? (
                        <p className="text-xs text-slate-600">No waiting</p>
                      ) : (
                        <ul className="flex flex-col items-center gap-2 w-full" role="list">
                          {waitingEntries.map(({ seq, windowLabel, style }) => (
                            <li
                              key={seq.id}
                              className="flex flex-col items-center justify-center w-full"
                              style={{ opacity: windowLabel ? 1 : 0.7 }}
                            >
                              <span
                                className={`font-black tracking-wide ${style.text}`}
                                style={{
                                  fontSize: 'clamp(2rem, 6vw, 2.3rem)',
                                }}
                              >
                                {seq.queue_data?.code || '---'}
                              </span>
                              <span className="text-xs font-semibold text-slate-400">
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
