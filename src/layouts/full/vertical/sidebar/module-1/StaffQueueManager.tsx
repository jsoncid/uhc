import { useState, useEffect, useMemo } from 'react';
import { ChevronRight, Check, Loader2, ArrowRightLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { useOfficeStore } from '@/stores/module-1_stores/useOfficeStore';
import { useQueueStore, Sequence } from '@/stores/module-1_stores/useQueueStore';
import { useOfficeUserAssignmentStore } from '@/stores/module-1_stores/useOfficeUserAssignmentStore';
import { useUserProfile } from '@/hooks/useUserProfile';

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Staff Queue Manager' }];

const StaffQueueManager = () => {
  const [activeTab, setActiveTab] = useState<string>('');
  const [selectedWindowByOffice, setSelectedWindowByOffice] = useState<Record<string, string>>({});
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferringSequence, setTransferringSequence] = useState<Sequence | null>(null);
  const [transferTargetOffice, setTransferTargetOffice] = useState<string>('');
  const [transferTargetWindow, setTransferTargetWindow] = useState<string>('none');
  const [transferSuccess, setTransferSuccess] = useState<string>('');

  const { profile, loading: profileLoading } = useUserProfile();
  const { offices, fetchOffices, isLoading: officesLoading } = useOfficeStore();
  const {
    sequences,
    statuses,
    fetchSequences,
    fetchStatuses,
    updateSequenceStatus,
    transferSequence,
    isWindowAvailable,
    subscribeToSequences,
    isLoading: queueLoading,
  } = useQueueStore();
  const { myAssignment, myAssignmentLoaded, fetchMyAssignment } = useOfficeUserAssignmentStore();

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

  // Fetch current user's office+window assignment
  useEffect(() => {
    if (profile?.id) {
      fetchMyAssignment(profile.id);
    }
  }, [profile?.id, fetchMyAssignment]);

  // Default selected window to first active window per office,
  // but lock to assigned window when the user has one.
  useEffect(() => {
    setSelectedWindowByOffice((prev) => {
      const next = { ...prev };
      offices.forEach((office) => {
        if (myAssignment?.office === office.id && myAssignment?.window) {
          next[office.id] = myAssignment.window;
          return;
        }
        const activeWindows = (office.windows || []).filter((w) => w.status);
        if (activeWindows.length > 0 && next[office.id] === undefined) {
          next[office.id] = activeWindows[0].id;
        }
      });
      return next;
    });
  }, [offices, myAssignment]);

  // Scope visible offices:
  //  • Window-assigned user → only their assigned office
  //  • Unassigned user      → all active offices (global access)
  const activeOffices = useMemo(() => {
    if (!myAssignmentLoaded) return [];
    const all = offices.filter((o) => o.status);
    if (myAssignment?.window) {
      return all.filter((o) => o.id === myAssignment.office);
    }
    return all;
  }, [offices, myAssignment, myAssignmentLoaded]);

  // Keep activeTab in sync with visible offices
  useEffect(() => {
    if (activeOffices.length > 0) {
      setActiveTab((prev) => {
        const stillValid = activeOffices.some((o) => o.id === prev);
        return stillValid ? prev : activeOffices[0].id;
      });
    }
  }, [activeOffices]);

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

  const getWaitingSequences = (officeId: string, windowId?: string): Sequence[] => {
    const pendingStatus = getStatusByDescription('pending');
    let pending = getSequencesForOffice(officeId).filter(
      (seq) => seq.status === pendingStatus?.id,
    );
    
    // Filter by window if provided - show sequences assigned to this window OR unassigned (newly added)
    if (windowId) {
      pending = pending.filter((seq) => seq.window === windowId || !seq.window);
    }
    
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

  const getServingSequence = (officeId: string, windowId?: string): Sequence | undefined => {
    const servingStatus = getStatusByDescription('serving');
    const officeSequences = getSequencesForOffice(officeId);
    if (windowId) {
      return officeSequences.find(
        (seq) => seq.status === servingStatus?.id && seq.window === windowId,
      );
    }
    return officeSequences.find((seq) => seq.status === servingStatus?.id);
  };

  const handleCallNext = async (officeId: string) => {
    const servingStatus = getStatusByDescription('serving');
    const completedStatus = getStatusByDescription('completed');
    
    if (!servingStatus) {
      console.error('Serving status not found. Available statuses:', statuses);
      return;
    }

    console.log('📞 Calling next - servingStatus:', servingStatus, 'completedStatus:', completedStatus);

    const windowId = selectedWindowByOffice[officeId];
    // Only mark as completed if there's already a sequence serving at THIS specific window
    const currentServing = getServingSequence(officeId, windowId);
    if (currentServing && completedStatus) {
      console.log('🔄 Marking current serving as completed:', currentServing.id);
      await updateSequenceStatus(currentServing.id, completedStatus.id);
    }

    let waiting = getWaitingSequences(officeId, windowId);
    const nextInQueue = waiting[0]; // Already sorted by priority

    if (nextInQueue) {
      console.log('➡️ Calling next in queue:', nextInQueue.id, 'to window:', windowId);
      await updateSequenceStatus(nextInQueue.id, servingStatus.id, windowId ?? undefined);
    } else {
      console.log('ℹ️ No one waiting in queue');
    }
  };

  const handleComplete = async (sequenceId: string) => {
    const completedStatus = getStatusByDescription('completed');
    if (completedStatus) {
      await updateSequenceStatus(sequenceId, completedStatus.id);
    }
  };

  const handleOpenTransferDialog = (sequence: Sequence) => {
    setTransferringSequence(sequence);
    setTransferTargetOffice(sequence.office);
    setTransferTargetWindow('none');
    setTransferDialogOpen(true);
  };

  const handleTransfer = async () => {
    if (!transferringSequence || !transferTargetOffice) return;

    const windowId = transferTargetWindow === 'none' ? null : transferTargetWindow;
    const targetWindow = getTargetOfficeWindows().find((w) => w.id === windowId);
    const targetOffice = activeOffices.find((o) => o.id === transferTargetOffice);

    await transferSequence(
      transferringSequence.id,
      transferTargetOffice,
      windowId
    );

    // Show success message with transfer details
    const windowName = windowId
      ? (targetWindow?.description || `Window ${windowId}`)
      : 'Pending (No Window)';
    const message = `✓ Queue ${transferringSequence?.queue_data?.code} transferred to ${targetOffice?.description} - ${windowName}`;
    setTransferSuccess(message);

    setTransferDialogOpen(false);
    setTransferringSequence(null);
    setTransferTargetOffice('');
    setTransferTargetWindow('none');

    // Clear success message after 3 seconds
    setTimeout(() => setTransferSuccess(''), 3000);
  };

  const getTargetOfficeWindows = () => {
    const targetOffice = activeOffices.find((o) => o.id === transferTargetOffice);
    return (targetOffice?.windows || []).filter((w) => w.status);
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

  if (isLoading || !myAssignmentLoaded) {
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

      {transferSuccess && (
        <div className="mx-6 mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {transferSuccess}
        </div>
      )}

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
            const serving = getServingSequence(office.id, selectedWindowByOffice[office.id]);
            const waiting = getWaitingSequences(office.id, selectedWindowByOffice[office.id]);

            return (
              <TabsContent key={office.id} value={office.id}>
                <Card>
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <CardTitle>{office.description || office.id} Queue</CardTitle>
                      <div className="flex items-center gap-3">
                        {(office.windows || []).filter((w) => w.status).length > 0 && (
                          <div className="flex items-center gap-2">
                            <Label className="text-sm text-muted-foreground whitespace-nowrap">Call to window</Label>
                            {/* Assigned user: locked window | Unassigned: free dropdown */}
                            {myAssignment?.office === office.id && myAssignment?.window ? (
                              <div className="px-3 py-2 border rounded-md text-sm bg-muted w-[180px]">
                                {(office.windows || []).find((w) => w.id === myAssignment.window)?.description
                                  || myAssignment.window_description
                                  || 'Assigned Window'}
                              </div>
                            ) : (
                              <Select
                                value={selectedWindowByOffice[office.id]?.toString() ?? ''}
                                onValueChange={(v) =>
                                  setSelectedWindowByOffice((prev) => ({ ...prev, [office.id]: v }))
                                }
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Select window" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(office.windows || [])
                                    .filter((w) => w.status)
                                    .map((w) => (
                                      <SelectItem key={w.id} value={w.id.toString()}>
                                        {w.description || `Window ${w.id}`}
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        )}
                        <Button onClick={() => handleCallNext(office.id)} disabled={isLoading || !!serving}>
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <ChevronRight className="h-4 w-4 mr-2" />
                          )}
                          Call Next
                        </Button>
                      </div>
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
                                {serving.queue_data?.code || '---'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {serving.priority_data?.description || 'Regular'}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleComplete(serving.id)}
                                  disabled={isLoading}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Complete
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenTransferDialog(serving)}
                                  disabled={isLoading}
                                >
                                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                                  Transfer
                                </Button>
                              </div>
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
                                  className="flex items-center justify-between"
                                >
                                  <div className={`text-lg font-medium tracking-wider ${getPriorityColor(seq.priority_data?.description)}`}>
                                    {seq.queue_data?.code || '---'}
                                    <span className="text-xs ml-2 text-muted-foreground">
                                      ({seq.priority_data?.description || 'Regular'})
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenTransferDialog(seq)}
                                    disabled={isLoading}
                                  >
                                    <ArrowRightLeft className="h-3 w-3" />
                                  </Button>
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

      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Transfer Queue</DialogTitle>
            <DialogDescription>
              Transfer queue code <span className="font-bold">{transferringSequence?.queue_data?.code}</span> to another office or window.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Target Office</Label>
              <Select
                value={transferTargetOffice}
                onValueChange={(v) => {
                  setTransferTargetOffice(v);
                  setTransferTargetWindow('none');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select office" />
                </SelectTrigger>
                <SelectContent>
                  {activeOffices.map((office) => (
                    <SelectItem key={office.id} value={office.id}>
                      {office.description || office.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Target Window (Optional)</Label>
              <Select
                value={transferTargetWindow}
                onValueChange={setTransferTargetWindow}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select window (or leave empty for pending)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No window (move to pending)</SelectItem>
                  {getTargetOfficeWindows().map((w) => {
                    const available = isWindowAvailable(w.id);
                    return (
                      <SelectItem key={w.id} value={w.id}>
                        <div className="flex items-center gap-2">
                          {w.description || `Window ${w.id}`}
                          {available ? (
                            <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                              Available
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-orange-600 border-orange-600 text-xs">
                              Busy
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {transferTargetWindow !== 'none' && !isWindowAvailable(transferTargetWindow) && (
                <p className="text-xs text-orange-600">
                  This window is currently busy. The queue will be moved to pending status.
                </p>
              )}
              {transferTargetWindow === 'none' && (
                <p className="text-xs text-muted-foreground">
                  No window selected. The queue will be moved to pending status.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTransfer} disabled={!transferTargetOffice || isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRightLeft className="h-4 w-4 mr-2" />
              )}
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StaffQueueManager;
