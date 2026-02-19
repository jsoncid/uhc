import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { useOfficeStore, Office } from '@/stores/module-1_stores/useOfficeStore';
import { useQueueStore, Sequence } from '@/stores/module-1_stores/useQueueStore';

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Queue Display' }];

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
  }, [fetchOffices, fetchStatuses, fetchSequences]);

  useEffect(() => {
    const unsubscribe = subscribeToSequences();
    return () => unsubscribe();
  }, [subscribeToSequences]);

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

  const getPendingAndServingSequences = (): Sequence[] => {
    const pendingStatus = getStatusByDescription('pending');
    const servingStatus = getStatusByDescription('serving');
    return sequences.filter(
      (seq) => seq.status === pendingStatus?.id || seq.status === servingStatus?.id,
    );
  };

  const getServingSequenceForOffice = (officeId: string): Sequence | undefined => {
    const servingStatus = getStatusByDescription('serving');
    return sequences.find(
      (seq) => seq.office === officeId && seq.status === servingStatus?.id,
    );
  };

  const getPriorityColor = (priority: string | null | undefined) => {
    const desc = priority?.toLowerCase() || '';
    if (desc.includes('priority') || desc.includes('urgent')) {
      return 'text-red-600';
    }
    return 'text-green-600';
  };

  const activeOffices = offices.filter((o) => o.status);
  const queueList = getPendingAndServingSequences();
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
        {/* Left side - Queue List */}
        <Card className="w-80 shrink-0">
          <CardHeader className="border-b">
            <CardTitle className="text-center text-xl">Queue</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {queueList.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No customers in queue
              </div>
            ) : (
              <div className="divide-y max-h-[70vh] overflow-y-auto">
                {queueList.map((seq) => (
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
