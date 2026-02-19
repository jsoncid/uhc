import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { useOfficeStore, Office } from '@/stores/module-1_stores/useOfficeStore';
import { useQueueStore, Sequence } from '@/stores/module-1_stores/useQueueStore';

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Queue Display' }];

const PRIORITY_LEGEND = [
  { label: 'Regular', color: 'bg-green-600', textColor: 'text-green-600' },
  { label: 'Senior Citizen', color: 'bg-blue-600', textColor: 'text-blue-600' },
  { label: 'PWD', color: 'bg-purple-600', textColor: 'text-purple-600' },
  { label: 'Priority', color: 'bg-red-600', textColor: 'text-red-600' },
  { label: 'Urgent', color: 'bg-orange-600', textColor: 'text-orange-600' },
  { label: 'VIP', color: 'bg-yellow-600', textColor: 'text-yellow-600' },
];

const QueueDisplay = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  const { offices, fetchOffices, isLoading: officesLoading } = useOfficeStore();
  const {
    sequences,
    statuses,
    fetchSequences,
    fetchStatuses,
    subscribeToSequences,
    isLoading: queueLoading,
  } = useQueueStore();

  useEffect(() => {
    fetchOffices();
    fetchStatuses();
    fetchSequences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToSequences();
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getStatusByDescription = (description: string) => {
    return statuses.find((s) => s.description?.toLowerCase().includes(description.toLowerCase()));
  };

  const getPriorityWeight = (priorityDescription: string | null | undefined): number => {
    const desc = priorityDescription?.toLowerCase() || '';
    if (desc.includes('urgent')) return 1;
    if (desc.includes('vip')) return 2;
    if (desc.includes('priority')) return 3;
    if (desc.includes('pwd')) return 4;
    if (desc.includes('senior')) return 5;
    return 10; // Regular/default - lowest priority
  };

  const getPendingSequences = (): Sequence[] => {
    const pendingStatus = getStatusByDescription('pending');
    const pending = sequences.filter((seq) => seq.status === pendingStatus?.id);
    
    // Sort by priority weight (lower = higher priority), then by created_at (FIFO within same priority)
    return pending.sort((a, b) => {
      const priorityA = getPriorityWeight(a.priority_data?.description);
      const priorityB = getPriorityWeight(b.priority_data?.description);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Same priority - sort by created_at (FIFO)
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  };

  const getServingSequenceForOffice = (officeId: string): Sequence | undefined => {
    const servingStatus = getStatusByDescription('serving');
    return sequences.find(
      (seq) => seq.office === officeId && seq.status === servingStatus?.id,
    );
  };

  const getPriorityColor = (priority: string | null | undefined) => {
    const desc = priority?.toLowerCase() || '';
    if (desc.includes('senior')) return 'text-blue-600';
    if (desc.includes('pwd')) return 'text-purple-600';
    if (desc.includes('priority')) return 'text-red-600';
    if (desc.includes('urgent')) return 'text-orange-600';
    if (desc.includes('vip')) return 'text-yellow-600';
    return 'text-green-600';
  };

  const activeOffices = offices.filter((o) => o.status);
  const pendingQueueList = getPendingSequences();
  const isLoading = officesLoading || queueLoading;

  if (isLoading && activeOffices.length === 0) {
    return (
      <>
        <BreadcrumbComp title="Queue Display" items={BCrumb} />
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <BreadcrumbComp title="Queue Display" items={BCrumb} />
      <div className="flex gap-6 p-6 min-h-screen bg-muted/30">
        {/* Left side - Queue List and Legend */}
        <div className="w-80 shrink-0 space-y-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-center text-xl">Pending Queue</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {pendingQueueList.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No customers waiting
                </div>
              ) : (
                <div className="divide-y max-h-[50vh] overflow-y-auto">
                  {pendingQueueList.map((seq) => (
                    <div
                      key={seq.id}
                      className={`py-4 text-center text-2xl font-bold tracking-widest ${getPriorityColor(
                        seq.priority_data?.description,
                      )}`}
                    >
                      {seq.queue}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Color Legend */}
          <Card>
            <CardHeader className="border-b py-3">
              <CardTitle className="text-center text-sm">Priority Legend</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-2">
                {PRIORITY_LEGEND.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className={`text-xs ${item.textColor}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right side - Now Serving */}
        <div className="flex-1">
          <div className="flex items-center justify-center gap-4 mb-6">
            <h2 className="text-3xl font-bold">Now Serving</h2>
            <span className="text-2xl font-mono text-muted-foreground">
              {formatTime(currentTime)}
            </span>
          </div>
          <div className="space-y-6">
            {activeOffices.map((office: Office) => {
              const servingSequence = getServingSequenceForOffice(office.id);

              return (
                <Card key={office.id}>
                  <CardHeader className="bg-primary/10 py-3">
                    <CardTitle className="text-xl">{office.description || office.id}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex flex-col items-center justify-center py-6 px-4">
                      {servingSequence ? (
                        <>
                          <span
                            className={`text-5xl font-bold tracking-widest ${getPriorityColor(
                              servingSequence.priority_data?.description,
                            )}`}
                          >
                            {servingSequence.queue}
                          </span>
                          <span className="text-sm text-muted-foreground mt-2">
                            {servingSequence.priority_data?.description || 'Regular'}
                          </span>
                        </>
                      ) : (
                        <span className="text-3xl font-bold text-muted-foreground">-</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default QueueDisplay;
