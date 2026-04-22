import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronRight, Check, Loader2, ArrowRightLeft, UserCheck, Bell, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { useOfficeStore } from '@/stores/module-1_stores/useOfficeStore';
import { useQueueStore, Sequence } from '@/stores/module-1_stores/useQueueStore';
import { useOfficeUserAssignmentStore } from '@/stores/module-1_stores/useOfficeUserAssignmentStore';
import { useUserProfile } from '@/hooks/useUserProfile';

type QueueBucket = 'priority' | 'regular';

const StaffQueueManager = () => {
  const [activeTab, setActiveTab] = useState<string>('');
  const [selectedWindowByOffice, setSelectedWindowByOffice] = useState<Record<string, string>>({});
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferringSequence, setTransferringSequence] = useState<Sequence | null>(null);
  const [transferTargetOffice, setTransferTargetOffice] = useState<string>('');
  const [transferSuccess, setTransferSuccess] = useState<string>('');
  // Tracks which sequenceId is currently being announced; Ping is disabled until it finishes
  const [pingingId, setPingingId] = useState<string | null>(null);
  // Channel ref for receiving ping-done callbacks from QueueDisplay
  const pingDoneChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const { profile, loading: profileLoading } = useUserProfile();
  const { offices, fetchOffices, fetchOfficeById, isLoading: officesLoading } = useOfficeStore();
  const {
    sequences,
    statuses,
    fetchSequences,
    fetchStatuses,
    updateSequenceStatus,
    transferSequence,
    subscribeToSequences,
    isLoading: queueLoading,
  } = useQueueStore();
  const { myAssignments, myAssignment, myAssignmentLoaded, fetchMyAssignment } =
    useOfficeUserAssignmentStore();

  // Get assignment IDs from user profile
  const userAssignmentIds = useMemo(() => {
    return profile?.assignments?.map((a) => a.id) || [];
  }, [profile?.assignments]);

  const assignedOfficeEntries = useMemo(() => {
    const fallbackAssignments = myAssignment ? [myAssignment] : [];
    const sourceAssignments = myAssignments.length > 0 ? myAssignments : fallbackAssignments;
    const byOffice = new Map<string, (typeof sourceAssignments)[number]>();

    sourceAssignments.forEach((assignment) => {
      if (!assignment.office) return;
      if (!byOffice.has(assignment.office)) {
        byOffice.set(assignment.office, assignment);
      }
    });

    return byOffice;
  }, [myAssignments, myAssignment]);

  const assignedOfficeIds = useMemo(
    () => new Set(Array.from(assignedOfficeEntries.keys())),
    [assignedOfficeEntries],
  );

  useEffect(() => {
    fetchStatuses();
    fetchSequences();
  }, [fetchStatuses, fetchSequences]);

  useEffect(() => {
    // Subscribe to ping-done so we know when to re-enable the Ping button
    const ch = supabase
      .channel('queue-ping-done-listener')
      .on('broadcast', { event: 'ping-done' }, ({ payload }) => {
        setPingingId((curr) =>
          curr === (payload.sequenceId as string) ? null : curr,
        );
      })
      .subscribe();
    pingDoneChannelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
      pingDoneChannelRef.current = null;
    };
  }, []);

  // Fetch offices filtered by user's assignments
  useEffect(() => {
    if (!profileLoading) {
      fetchOffices(userAssignmentIds.length > 0 ? userAssignmentIds : undefined);
    }
  }, [profileLoading, userAssignmentIds, fetchOffices]);

  // Ensure all offices from the user's direct office assignments are fetched,
  // even if they don't appear in the RBAC assignment filter above.
  useEffect(() => {
    assignedOfficeEntries.forEach((assignment, officeId) => {
      if (assignment.office) {
        fetchOfficeById(officeId);
      }
    });
  }, [assignedOfficeEntries, fetchOfficeById]);

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
        const officeAssignment = assignedOfficeEntries.get(office.id);
        if (officeAssignment?.window) {
          next[office.id] = officeAssignment.window;
          return;
        }
        const activeWindows = (office.windows || []).filter((w) => w.status);
        if (activeWindows.length > 0 && next[office.id] === undefined) {
          next[office.id] = activeWindows[0].id;
        }
      });
      return next;
    });
  }, [offices, assignedOfficeEntries]);

  // Scope visible offices: only the office assigned to the current user.
  // If the user has no assignment, nothing is shown.
  const activeOffices = useMemo(() => {
    if (!myAssignmentLoaded) return [];
    if (assignedOfficeIds.size === 0) return [];
    return offices.filter((o) => o.status && assignedOfficeIds.has(o.id));
  }, [offices, assignedOfficeIds, myAssignmentLoaded]);

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
    return sequences.filter((seq) => seq.office === officeId && seq.is_active !== false);
  };

  const isRegularPriority = (priorityDescription: string | null | undefined): boolean => {
    const desc = priorityDescription?.toLowerCase() || '';
    return desc === '' || desc.includes('regular');
  };

  const getWaitingSequences = (officeId: string, windowId?: string): Sequence[] => {
    const pendingStatus = getStatusByDescription('pending');
    let pending = getSequencesForOffice(officeId).filter(
      (seq) => seq.status === pendingStatus?.id,
    );

    // Filter by window if provided - show sequences assigned to this window OR unassigned
    if (windowId) {
      pending = pending.filter((seq) => seq.window === windowId || !seq.window);
    }

    // Strict FIFO by created_at so call-next follows queue creation time.
    return pending.sort((a, b) => {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  };

  const getServingSequence = (officeId: string, windowId?: string): Sequence | undefined => {
    const servingStatus = getStatusByDescription('serving');
    const arrivedStatus = getStatusByDescription('arrived');
    const activeStatusIds = [servingStatus?.id, arrivedStatus?.id].filter(Boolean) as string[];
    const officeSequences = getSequencesForOffice(officeId); // already filters is_active
    if (windowId) {
      return officeSequences.find(
        (seq) => activeStatusIds.includes(seq.status) && seq.window === windowId,
      );
    }
    return officeSequences.find((seq) => activeStatusIds.includes(seq.status));
  };

  // Global guard: if the staff is currently serving in any assigned office/window,
  // disable calling next in all assigned offices.
  const hasAnyServingAcrossAssignedOffices = activeOffices.some((office) =>
    Boolean(getServingSequence(office.id, selectedWindowByOffice[office.id]))
  );

  const handleCallNext = async (officeId: string, bucket: QueueBucket) => {
    const servingStatus = getStatusByDescription('serving');

    if (!servingStatus) {
      console.error('Serving status not found. Available statuses:', statuses);
      return;
    }

    if (hasAnyServingAcrossAssignedOffices) {
      console.log('ℹCall Next is blocked while there is an active serving queue');
      return;
    }

    const windowId = selectedWindowByOffice[officeId];

    // Guard: block if this window already has someone serving/arrived
    const currentServing = getServingSequence(officeId, windowId);
    if (currentServing) {
      console.log('ℹSomeone is already being served, Call Next is blocked');
      return;
    }

    if (!windowId) {
      console.error('No window selected');
      return;
    }

    const waiting = getWaitingSequences(officeId, windowId);
    const waitingByBucket = waiting.filter((seq) =>
      bucket === 'regular'
        ? isRegularPriority(seq.priority_data?.description)
        : !isRegularPriority(seq.priority_data?.description),
    );

    const nextForBucket = waitingByBucket[0];

    if (!nextForBucket) {
      console.log(`ℹNo one waiting in ${bucket} queue`);
      return;
    }

    // Move only the selected bucket's first waiting queue to serving.
    await updateSequenceStatus(nextForBucket.id, servingStatus.id, windowId);
  };

  const handleComplete = async (sequenceId: string) => {
    const completedStatus = getStatusByDescription('completed');
    if (completedStatus) {
      await updateSequenceStatus(sequenceId, completedStatus.id);
    }
  };

  const handleArrived = async (sequenceId: string, windowId: string) => {
    const arrivedStatus = getStatusByDescription('arrived');
    if (arrivedStatus) {
      await updateSequenceStatus(sequenceId, arrivedStatus.id, windowId);
    }
  };

  const handlePing = async (serving: Sequence, officeName: string, officeId: string) => {
    // Use the Supabase REST broadcast API — no WebSocket subscription needed,
    // fires instantly on the very first click with no channel-ready race condition.
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    await fetch(`${supabaseUrl}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        messages: [
          {
            topic: 'queue-ping-broadcast',
            event: 'ping',
            payload: {
              sequenceId: serving.id,
              officeId,
              queueCode: serving.queue_data?.code || '---',
              windowLabel: serving.window_data?.description || 'the window',
              officeName,
              priorityDesc: serving.priority_data?.description || null,
            },
          },
        ],
      }),
    });
    // Disable the button immediately — re-enabled when QueueDisplay broadcasts ping-done
    setPingingId(serving.id);
  };

  const handlePutBackOnQueue = async (sequenceId: string) => {
    const pendingStatus = getStatusByDescription('pending');
    if (pendingStatus) {
      // Put back to pending status with no window assignment
      // The new created_at timestamp will automatically place it at the end of the queue
      await updateSequenceStatus(sequenceId, pendingStatus.id, null);
    }
  };

  // Offices available as transfer targets: all active offices under the same
  // assignment as the sequence being transferred, excluding the source office.
  const transferableOffices = useMemo(() => {
    if (!transferringSequence) return [];
    const sourceOffice = offices.find((o) => o.id === transferringSequence.office);
    if (!sourceOffice) return [];
    return offices.filter(
      (o) =>
        o.status &&
        o.assignment === sourceOffice.assignment &&
        o.id !== transferringSequence.office,
    );
  }, [offices, transferringSequence]);

  const handleOpenTransferDialog = (sequence: Sequence) => {
    setTransferringSequence(sequence);
    setTransferTargetOffice('');     // reset — user must pick a different office
    setTransferDialogOpen(true);
  };

  const handleTransfer = async () => {
    if (!transferringSequence || !transferTargetOffice) return;

    const targetOffice = offices.find((o) => o.id === transferTargetOffice);

    await transferSequence(transferringSequence.id, transferTargetOffice, null);

    // Show success message
    const message = `✓ Queue ${transferringSequence?.queue_data?.code} transferred to ${targetOffice?.description}. It will be queued based on priority.`;
    setTransferSuccess(message);

    setTransferDialogOpen(false);
    setTransferringSequence(null);
    setTransferTargetOffice('');

    // Clear success message after 3 seconds
    setTimeout(() => setTransferSuccess(''), 3000);
  };

  const getPriorityColor = (priority: string | null | undefined) => {
    return isRegularPriority(priority) ? 'text-emerald-600' : 'text-red-600';
  };

  const isLoading = profileLoading || officesLoading || queueLoading;

  if (isLoading || !myAssignmentLoaded) {
    return (
      <>
        <div className="flex justify-center items-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      {transferSuccess && (
        <div className="mx-6 mt-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {transferSuccess}
        </div>
      )}

      {activeOffices.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            You are not assigned to any office or window. Please contact an administrator.
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4 md:space-y-6">
          {activeOffices.length > 1 && (
            <TabsList>
              {activeOffices.map((office) => (
                <TabsTrigger key={office.id} value={office.id}>
                  {office.description || office.id}
                </TabsTrigger>
              ))}
            </TabsList>
          )}

          {activeOffices.map((office) => {
            const officeAssignment = assignedOfficeEntries.get(office.id);
            const serving = getServingSequence(office.id, selectedWindowByOffice[office.id]);
            const waiting = getWaitingSequences(office.id, selectedWindowByOffice[office.id]);
            const priorityWaiting = waiting.filter(
              (seq) => !isRegularPriority(seq.priority_data?.description),
            );
            const regularWaiting = waiting.filter((seq) =>
              isRegularPriority(seq.priority_data?.description),
            );

            return (
              <TabsContent key={office.id} value={office.id} className="w-full">
                <Card className="w-full">
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <CardTitle>{office.description || office.id} Queue</CardTitle>
                      <div className="flex items-center gap-3">
                        {officeAssignment?.window && (
                          <div className="flex items-center gap-2">
                            <Label className="text-sm text-muted-foreground whitespace-nowrap">
                              Window
                            </Label>
                            <div className="px-3 py-2 border rounded-md text-sm bg-muted w-45">
                              {(office.windows || []).find((w) => w.id === officeAssignment.window)
                                ?.description ||
                                officeAssignment.window_description ||
                                'Assigned Window'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6">
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(320px,1fr)_minmax(460px,1.25fr)] 2xl:grid-cols-[minmax(360px,1fr)_minmax(540px,1.35fr)] xl:gap-6">
                      {/* Now Serving Section */}
                      <Card className="bg-muted/50">
                        <CardContent className="pt-3 pb-4 md:pt-4 md:pb-5">
                          <h3 className="font-semibold text-xl md:text-2xl mb-4">Now Serving</h3>
                          {serving ? (
                            <div className="space-y-4">
                              <div
                                className={`text-3xl md:text-4xl 2xl:text-5xl font-bold tracking-widest ${getPriorityColor(
                                  serving.priority_data?.description,
                                )}`}
                              >
                                {serving.queue_data?.code || '---'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {serving.priority_data?.description || 'Regular'}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleComplete(serving.id)}
                                  disabled={isLoading || !serving.status_data?.description?.toLowerCase().includes('arrived')}
                                  className="w-full justify-center bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Complete
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleOpenTransferDialog(serving)}
                                  disabled={isLoading}
                                  className="w-full justify-center bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                                  Transfer
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleArrived(serving.id, selectedWindowByOffice[office.id])}
                                  disabled={isLoading || serving.status_data?.description?.toLowerCase().includes('arrived')}
                                  className="w-full justify-center bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Arrived
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handlePing(serving, office.description || '', office.id)}
                                  disabled={isLoading || pingingId === serving.id}
                                  title="Re-announce this queue on the display"
                                  className="w-full justify-center bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
                                >
                                  <Bell className="h-4 w-4 mr-2" />
                                  Ping
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handlePutBackOnQueue(serving.id)}
                                  disabled={isLoading}
                                  title="Put back to end of queue (customer didn't arrive)"
                                  className="w-full justify-center bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Put Back
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
                        <CardContent className="pt-2 pb-3 md:pt-3 md:pb-4">
                          <h3 className="font-semibold text-xl md:text-2xl mb-4">Waiting ({waiting.length})</h3>
                          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                            <div className="rounded-md border bg-background p-4 h-full flex flex-col gap-4">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="font-medium text-sm text-rose-600">
                                  Priority ({priorityWaiting.length})
                                </h4>
                                <Button
                                  size="sm"
                                  onClick={() => handleCallNext(office.id, 'priority')}
                                  disabled={
                                    isLoading ||
                                    hasAnyServingAcrossAssignedOffices ||
                                    !!serving ||
                                    priorityWaiting.length === 0
                                  }
                                >
                                  {isLoading ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 mr-2" />
                                  )}
                                  Call Next
                                </Button>
                              </div>

                              {priorityWaiting.length > 0 ? (
                                <div className="space-y-3 flex-1 overflow-y-auto pr-1 max-h-[12rem]">
                                  {priorityWaiting.map((seq) => (
                                    <div key={seq.id} className="flex items-center justify-between py-1">
                                      <div
                                        className={`text-3xl md:text-4xl 2xl:text-5xl font-semibold tracking-wide leading-none ${getPriorityColor(seq.priority_data?.description)}`}
                                      >
                                        {seq.queue_data?.code || '---'}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleOpenTransferDialog(seq)}
                                        disabled={isLoading}
                                      >
                                        <ArrowRightLeft className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-muted-foreground italic text-sm">
                                  No waiting priority queue.
                                </p>
                              )}
                            </div>

                            <div className="rounded-md border bg-background p-4 h-full flex flex-col gap-4">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="font-medium text-sm text-emerald-600">
                                  Regular ({regularWaiting.length})
                                </h4>
                                <Button
                                  size="sm"
                                  onClick={() => handleCallNext(office.id, 'regular')}
                                  disabled={
                                    isLoading ||
                                    hasAnyServingAcrossAssignedOffices ||
                                    !!serving ||
                                    regularWaiting.length === 0
                                  }
                                >
                                  {isLoading ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 mr-2" />
                                  )}
                                  Call Next
                                </Button>
                              </div>

                              {regularWaiting.length > 0 ? (
                                <div className="space-y-3 flex-1 overflow-y-auto pr-1 max-h-[12rem]">
                                  {regularWaiting.map((seq) => (
                                    <div key={seq.id} className="flex items-center justify-between py-1">
                                      <div
                                        className={`text-3xl md:text-4xl 2xl:text-5xl font-semibold tracking-wide leading-none ${getPriorityColor(seq.priority_data?.description)}`}
                                      >
                                        {seq.queue_data?.code || '---'}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleOpenTransferDialog(seq)}
                                        disabled={isLoading}
                                      >
                                        <ArrowRightLeft className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-muted-foreground italic text-sm">
                                  No waiting regular queue.
                                </p>
                              )}
                            </div>
                          </div>
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
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Transfer Queue</DialogTitle>
            <DialogDescription>
              Transfer queue code{' '}
              <span className="font-bold">{transferringSequence?.queue_data?.code}</span> to another
              office.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Target Office</Label>
              <Select
                value={transferTargetOffice}
                onValueChange={(v) => {
                  setTransferTargetOffice(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select office" />
                </SelectTrigger>
                <SelectContent>
                  {transferableOffices.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No other offices available
                    </div>
                  ) : (
                    transferableOffices.map((office) => (
                      <SelectItem key={office.id} value={office.id}>
                        {office.description || office.id}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
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
