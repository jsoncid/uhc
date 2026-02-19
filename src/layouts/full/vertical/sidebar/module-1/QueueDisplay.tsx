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

  const getPendingSequences = (): Sequence[] => {
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
  };

  const getServingSequenceForOffice = (officeId: string): Sequence | undefined => {
    const serving = getStatusByDescription('serving');
    return sequences.find((seq) => seq.office === officeId && seq.status === serving?.id);
  };

  const getServingSequenceForWindow = (
    officeId: string,
    windowId: number,
    firstWindowId: number,
  ): Sequence | undefined => {
    const serving = getStatusByDescription('serving');
    return sequences.find(
      (seq) =>
        seq.office === officeId &&
        seq.status === serving?.id &&
        (seq.window_id === windowId || (seq.window_id == null && windowId === firstWindowId)),
    );
  };

  const getPriorityStyle = (priority: string | null | undefined) => {
    const desc = (priority ?? '').toLowerCase();
    if (desc.includes('senior')) return { text: 'text-blue-700', bg: 'bg-blue-100', dot: 'bg-blue-500' };
    if (desc.includes('pwd')) return { text: 'text-violet-700', bg: 'bg-violet-100', dot: 'bg-violet-500' };
    if (desc.includes('priority')) return { text: 'text-rose-700', bg: 'bg-rose-100', dot: 'bg-rose-500' };
    if (desc.includes('urgent')) return { text: 'text-amber-700', bg: 'bg-amber-100', dot: 'bg-amber-500' };
    if (desc.includes('vip')) return { text: 'text-amber-800', bg: 'bg-amber-100', dot: 'bg-amber-400' };
    return { text: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' };
  };

  const activeOffices = offices.filter((o) => o.status);
  const pendingList = getPendingSequences();
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
      {!isDisplayMode && <BreadcrumbComp title="Queue Display" items={BCrumb} />}
      <div
        className={`flex h-screen flex-col overflow-hidden bg-white text-slate-900 ${
          isDisplayMode ? 'p-4 md:p-6' : 'p-4'
        }`}
      >
        {/* Top: title + time only */}
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 pb-3">
          <h1 className="text-lg font-semibold text-slate-800 md:text-xl">Queue Display</h1>
          <div className="flex items-baseline gap-3">
            <span className="text-xl font-bold tabular-nums text-slate-900 md:text-2xl" aria-live="polite">
              {formatTime(currentTime)}
            </span>
            <span className="text-sm text-slate-500">{formatDate(currentTime)}</span>
          </div>
        </header>

        {/* Two clear sections */}
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden pt-4">
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden" aria-label="Now serving">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Now Serving
            </p>
            <div className="grid min-h-0 flex-1 gap-4 overflow-hidden sm:grid-cols-2 lg:grid-cols-3">
            {activeOffices.map((office: Office) => {
              const officeWindows = (office.windows || []).filter((w: Window) => w.status);
              const firstWindowId = officeWindows[0]?.id ?? null;
              const officeName = office.description || office.id;

              // Only windows that are currently serving a queue code
              const servingWindows =
                officeWindows.length > 0
                  ? officeWindows
                      .map((w: Window) => ({
                        window: w,
                        serving: getServingSequenceForWindow(office.id, w.id, firstWindowId!),
                      }))
                      .filter((x): x is { window: Window; serving: Sequence } => !!x.serving)
                  : [];

              return (
                <div
                  key={office.id}
                  className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-slate-50/50"
                >
                  <p className="shrink-0 border-b border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800">
                    {officeName}
                  </p>
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
                    {officeWindows.length > 0 ? (
                      servingWindows.length > 0 ? (
                        <div className="flex min-h-0 flex-wrap content-start gap-3 overflow-hidden">
                          {servingWindows.map(({ window: w, serving }) => {
                            const style = getPriorityStyle(serving.priority_data?.description);
                            const windowLabel = w.description || `Window ${w.id}`;
                            return (
                              <div
                                key={w.id}
                                className={`flex flex-shrink-0 flex-col items-center justify-center rounded-md border border-slate-200 p-3 ${style!.bg}`}
                              >
                                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                                  {windowLabel}
                                </p>
                                <span
                                  className={`text-center font-black tracking-[0.15em] text-slate-900 sm:text-[clamp(1.5rem,3.5vw,2.75rem)] ${style!.text}`}
                                  style={{ lineHeight: 1.1 }}
                                  aria-live="polite"
                                >
                                  {serving.queue}
                                </span>
                                <p className={`mt-1 text-[10px] font-medium ${style!.text}`}>
                                  {serving.priority_data?.description || 'Regular'}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-1 items-center justify-center">
                          <span className="text-2xl font-medium text-slate-300">—</span>
                        </div>
                      )
                    ) : (
                      <div className="flex flex-1 flex-col items-center justify-center">
                        {(() => {
                          const serving = getServingSequenceForOffice(office.id);
                          const style = serving
                            ? getPriorityStyle(serving.priority_data?.description)
                            : null;
                          return serving ? (
                            <>
                              <span
                                className={`font-black tracking-[0.12em] text-slate-900 sm:text-[clamp(2rem,4.5vw,3.5rem)] ${style!.text}`}
                                aria-live="polite"
                              >
                                {serving.queue}
                              </span>
                              <p className={`mt-1 text-xs font-medium ${style!.text}`}>
                                {serving.priority_data?.description || 'Regular'}
                              </p>
                            </>
                          ) : (
                            <span className="text-2xl font-medium text-slate-300">—</span>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </section>

          {/* Waiting + Legend – fixed height so no scroll */}
          <div className="grid h-[18vh] min-h-[88px] max-h-[160px] shrink-0 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-12">
            <section
              className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-slate-50/50 lg:col-span-8"
              aria-label="Waiting queue"
            >
              <p className="shrink-0 border-b border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Waiting
              </p>
              <div className="min-h-0 flex-1 overflow-hidden p-3">
                {pendingList.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-slate-400">
                    No one waiting
                  </p>
                ) : (
                  <ul className="grid h-full grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10" role="list">
                    {pendingList.map((seq) => {
                      const office = activeOffices.find((o) => o.id === seq.office);
                      const style = getPriorityStyle(seq.priority_data?.description);
                      return (
                        <li
                          key={seq.id}
                          className={`flex flex-col items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-2 ${style.bg}`}
                        >
                          <span className={`text-base font-black tracking-wider sm:text-lg ${style.text}`}>
                            {seq.queue}
                          </span>
                          <span className="mt-0.5 w-full truncate text-center text-[10px] text-slate-600">
                            {office?.description || office?.id || '—'}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
            <section
              className="flex flex-col rounded-lg border border-slate-200 bg-slate-50/50 lg:col-span-4"
              aria-label="Priority legend"
            >
              <p className="shrink-0 border-b border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Priority
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 p-3">
                {PRIORITY_LEGEND.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.color}`} aria-hidden />
                    <span className={`text-xs font-medium ${item.textColor}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
};

export default QueueDisplay;
