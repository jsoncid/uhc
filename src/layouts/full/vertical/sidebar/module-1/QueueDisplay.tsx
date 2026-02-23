import { useState, useEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { useOfficeStore, Office, Window } from '@/stores/module-1_stores/useOfficeStore';
import { useQueueStore, Sequence } from '@/stores/module-1_stores/useQueueStore';
import { useUserProfile } from '@/hooks/useUserProfile';

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Queue Display' }];

const PRIORITY_LEGEND = [
  { label: 'Regular', color: 'bg-emerald-500', textColor: 'text-emerald-700' },
  { label: 'Senior', color: 'bg-blue-500', textColor: 'text-blue-700' },
  { label: 'PWD', color: 'bg-violet-500', textColor: 'text-violet-700' },
  { label: 'Priority', color: 'bg-rose-500', textColor: 'text-rose-700' },
  { label: 'Urgent', color: 'bg-amber-500', textColor: 'text-amber-700' },
  { label: 'VIP', color: 'bg-amber-400', textColor: 'text-amber-800' },
];

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

  const activeOffices = useMemo(() => offices.filter((o) => o.status), [offices]);
  
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
        className={`flex h-screen flex-col overflow-hidden bg-[#0d1117] text-white ${
          isDisplayMode ? 'p-4 md:p-6' : 'p-4'
        } gap-4`}
      >
        {/* Header: title + clock */}
        <header className="flex shrink-0 items-center justify-between border-b border-slate-700 pb-3">
          <h1 className="text-lg font-bold tracking-wide text-white md:text-xl">Queue Display</h1>
          <div className="flex items-baseline gap-3">
            <span
              className="text-xl font-bold tabular-nums text-white md:text-2xl"
              aria-live="polite"
            >
              {formatTime(currentTime)}
            </span>
            <span className="text-sm text-slate-400">{formatDate(currentTime)}</span>
          </div>
        </header>

        {/* Top section: Waiting + Legend side by side */}
        <div
          className="grid shrink-0 grid-cols-1 gap-4 lg:grid-cols-12"
          style={{ minHeight: '22vh', maxHeight: '26vh' }}
        >
          {/* Waiting queue */}
          <section
            className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-700 bg-[#161b22] lg:col-span-9"
            aria-label="Waiting queue"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-700 px-4 py-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Waiting
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {pendingList.length} in queue
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden p-3">
              {pendingList.length === 0 ? (
                <p className="flex h-full items-center justify-center text-sm text-slate-600">
                  No one waiting
                </p>
              ) : (
                <ul
                  className="flex h-full flex-wrap content-start gap-2 overflow-hidden"
                  role="list"
                >
                  {pendingList.map((seq) => {
                    const style = getPriorityStyle(seq.priority_data?.description);
                    return (
                      <li
                        key={seq.id}
                        className="flex items-center justify-center rounded-md border border-slate-700 bg-[#0d1117] px-3 py-1.5"
                      >
                        <span
                          className={`text-lg font-black tracking-wider sm:text-xl ${style.text}`}
                        >
                          {seq.queue_data?.code || '---'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* Legend */}
          <section
            className="flex flex-col rounded-xl border border-slate-700 bg-[#161b22] lg:col-span-3"
            aria-label="Priority legend"
          >
            <div className="shrink-0 border-b border-slate-700 px-4 py-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Legend
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2 p-3 lg:grid-cols-1">
              {PRIORITY_LEGEND.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.color}`} aria-hidden />
                  <span className={`text-xs font-semibold ${item.textColor}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Bottom section: per-office columns */}
        <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto overflow-y-hidden">
          {activeOffices.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-slate-600">
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
                    seq.status_data?.description?.toLowerCase().includes('serving'),
                )
                .map((seq) => ({
                  seq,
                  windowLabel: seq.window_data?.description || null,
                  style: getPriorityStyle(seq.priority_data?.description),
                }));

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
                  <div className="flex flex-1 flex-col items-center justify-center gap-4 overflow-y-auto p-4">
                    {servingEntries.length > 0 ? (
                      servingEntries.map(({ seq, windowLabel, style }) => (
                        <div key={seq.id} className="flex flex-col items-center gap-1">
                          <span
                            className={`text-center font-black tracking-[0.12em] ${style.text}`}
                            style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', lineHeight: 1.1 }}
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
                      ))
                    ) : (
                      <span
                        className="font-bold text-slate-700"
                        style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
                      >
                        —
                      </span>
                    )}
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
