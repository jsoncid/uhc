import { useState, useEffect, useMemo } from 'react';
import { ChevronRight, Check, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { useOfficeStore } from '@/stores/module-1_stores/useOfficeStore';
import { useQueueStore, Sequence } from '@/stores/module-1_stores/useQueueStore';
import { useUserProfile } from '@/hooks/useUserProfile';

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Staff Queue Manager' }];

const StaffQueueManager = () => {
  const [activeTab, setActiveTab] = useState<string>('');

  const { profile, loading: profileLoading } = useUserProfile();
  const { offices, fetchOffices, isLoading: officesLoading } = useOfficeStore();
  const {
    sequences,
    statuses,
    fetchSequences,
    fetchStatuses,
    updateSequenceStatus,
    subscribeToSequences,
    isLoading: queueLoading,
  } = useQueueStore();

  // Get assignment IDs from user profile
  const userAssignmentIds = useMemo(() => {
    return profile?.assignments?.map((a) => a.id) || [];
  }, [profile?.assignments]);

  useEffect(() => {
    fetchStatuses();
    fetchSequences();
  }, [fetchStatuses, fetchSequences]);

  // Fetch offices filtered by user's assignments
  useEffect(() => {
    if (!profileLoading) {
      fetchOffices(userAssignmentIds.length > 0 ? userAssignmentIds : undefined);
    }
  }, [profileLoading, userAssignmentIds, fetchOffices]);

  useEffect(() => {
    const unsubscribe = subscribeToSequences();
    return () => unsubscribe();
  }, [subscribeToSequences]);

  useEffect(() => {
    if (offices.length > 0 && !activeTab) {
      setActiveTab(offices[0].id);
    }
  }, [offices, activeTab]);

  const getStatusByDescription = (description: string) => {
    return statuses.find((s) => s.description?.toLowerCase().includes(description.toLowerCase()));
  };

  const getSequencesForOffice = (officeId: string) => {
    return sequences.filter((seq) => seq.office === officeId);
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

  const getWaitingSequences = (officeId: string): Sequence[] => {
    const pendingStatus = getStatusByDescription('pending');
    const pending = getSequencesForOffice(officeId).filter(
      (seq) => seq.status === pendingStatus?.id,
    );
    
    // Sort by priority weight (lower = higher priority), then by created_at (FIFO within same priority)
    return pending.sort((a, b) => {
      const priorityA = getPriorityWeight(a.priority_data?.description);
      const priorityB = getPriorityWeight(b.priority_data?.description);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  };

  const getServingSequence = (officeId: string): Sequence | undefined => {
    const servingStatus = getStatusByDescription('serving');
    return getSequencesForOffice(officeId).find(
      (seq) => seq.status === servingStatus?.id,
    );
  };

  const handleCallNext = async (officeId: string) => {
    const servingStatus = getStatusByDescription('serving');
    const completedStatus = getStatusByDescription('completed');
    
    if (!servingStatus) {
      console.error('Serving status not found');
      return;
    }

    const currentServing = getServingSequence(officeId);
    if (currentServing && completedStatus) {
      await updateSequenceStatus(currentServing.id, completedStatus.id);
    }

    const waiting = getWaitingSequences(officeId);
    const nextInQueue = waiting[0]; // Already sorted by priority

    if (nextInQueue) {
      await updateSequenceStatus(nextInQueue.id, servingStatus.id);
    }
  };

  const handleComplete = async (sequenceId: number) => {
    const completedStatus = getStatusByDescription('completed');
    if (completedStatus) {
      await updateSequenceStatus(sequenceId, completedStatus.id);
    }
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

  const isLoading = profileLoading || officesLoading || queueLoading;
  const activeOffices = offices.filter((o) => o.status);

  if (isLoading && activeOffices.length === 0) {
    return (
      <>
        <BreadcrumbComp title="Staff Queue Manager" items={BCrumb} />
        <div className="flex justify-center items-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <BreadcrumbComp title="Staff Queue Manager" items={BCrumb} />

      {activeOffices.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No offices available. Please contact an administrator.
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            {activeOffices.map((office) => (
              <TabsTrigger key={office.id} value={office.id}>
                {office.description || office.id}
              </TabsTrigger>
            ))}
          </TabsList>

          {activeOffices.map((office) => {
            const serving = getServingSequence(office.id);
            const waiting = getWaitingSequences(office.id);

            return (
              <TabsContent key={office.id} value={office.id}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{office.description || office.id} Queue</CardTitle>
                      <Button onClick={() => handleCallNext(office.id)} disabled={isLoading}>
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-2" />
                        )}
                        Call Next
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      {/* Now Serving Section */}
                      <Card className="bg-muted/50">
                        <CardContent className="pt-6">
                          <h3 className="font-semibold text-lg mb-4">Now Serving</h3>
                          {serving ? (
                            <div className="space-y-4">
                              <div
                                className={`text-4xl font-bold tracking-widest ${getPriorityColor(
                                  serving.priority_data?.description,
                                )}`}
                              >
                                {serving.queue}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {serving.priority_data?.description || 'Regular'}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleComplete(serving.id)}
                                disabled={isLoading}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Mark Complete
                              </Button>
                            </div>
                          ) : (
                            <p className="text-muted-foreground italic">
                              No customer is currently being served.
                            </p>
                          )}
                        </CardContent>
                      </Card>

                      {/* Waiting Section */}
                      <Card className="bg-muted/50">
                        <CardContent className="pt-6">
                          <h3 className="font-semibold text-lg mb-4">
                            Waiting ({waiting.length})
                          </h3>
                          {waiting.length > 0 ? (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {waiting.map((seq) => (
                                <div
                                  key={seq.id}
                                  className={`text-lg font-medium tracking-wider ${getPriorityColor(
                                    seq.priority_data?.description,
                                  )}`}
                                >
                                  {seq.queue}
                                  <span className="text-xs ml-2 text-muted-foreground">
                                    ({seq.priority_data?.description || 'Regular'})
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground italic">The waiting queue is empty.</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </>
  );
};

export default StaffQueueManager;
