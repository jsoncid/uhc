import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Queue Realtime Display' }];

// Types
interface Priority {
  id: string;
  description: string | null;
  status: boolean;
}

interface Status {
  id: string;
  description: string | null;
}

interface Office {
  id: string;
  description: string | null;
  status: boolean;
}

interface Sequence {
  id: number;
  created_at: string;
  office: string;
  queue: string;
  priority: string;
  status: string;
  // Enriched data
  office_data?: Office;
  priority_data?: Priority;
  status_data?: Status;
}

// Database row type (raw from Supabase)
interface SequenceRow {
  id: number;
  created_at: string;
  office: string;
  queue: string;
  priority: string;
  status: string;
}

const PRIORITY_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  regular: { bg: 'bg-green-600', text: 'text-green-600', badge: 'bg-green-100 text-green-700' },
  senior: { bg: 'bg-blue-600', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  pwd: { bg: 'bg-purple-600', text: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' },
  priority: { bg: 'bg-red-600', text: 'text-red-600', badge: 'bg-red-100 text-red-700' },
  urgent: { bg: 'bg-orange-600', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
  vip: { bg: 'bg-yellow-600', text: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' },
};

const module1 = supabase.schema('module1');

// Helper to fetch and enrich a sequence row on-demand
const fetchEnrichedSequence = async (row: SequenceRow): Promise<Sequence> => {
  const [officeRes, priorityRes, statusRes] = await Promise.all([
    module1.from('office').select('*').eq('id', row.office).single(),
    module1.from('priority').select('*').eq('id', row.priority).single(),
    module1.from('status').select('*').eq('id', row.status).single(),
  ]);

  return {
    ...row,
    office_data: officeRes.data || undefined,
    priority_data: priorityRes.data || undefined,
    status_data: statusRes.data || undefined,
  };
};

const QueueRealtimeDisplay = () => {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);

  // Helper to get priority color
  const getPriorityColor = (description: string | null | undefined) => {
    const desc = description?.toLowerCase() || '';
    for (const [key, colors] of Object.entries(PRIORITY_COLORS)) {
      if (desc.includes(key)) return colors;
    }
    return PRIORITY_COLORS.regular;
  };

  // Helper to get priority weight for sorting
  const getPriorityWeight = (description: string | null | undefined): number => {
    const desc = description?.toLowerCase() || '';
    if (desc.includes('urgent')) return 1;
    if (desc.includes('vip')) return 2;
    if (desc.includes('priority')) return 3;
    if (desc.includes('pwd')) return 4;
    if (desc.includes('senior')) return 5;
    return 10;
  };

  // Initial fetch of all data
  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch reference data and sequences in parallel
      const [officesRes, prioritiesRes, statusesRes, sequencesRes] = await Promise.all([
        module1.from('office').select('*').eq('status', true),
        module1.from('priority').select('*'),
        module1.from('status').select('*'),
        module1.from('sequence').select('*').order('created_at', { ascending: true }),
      ]);

      if (officesRes.error) throw officesRes.error;
      if (prioritiesRes.error) throw prioritiesRes.error;
      if (statusesRes.error) throw statusesRes.error;
      if (sequencesRes.error) throw sequencesRes.error;

      const officesData = officesRes.data || [];
      const prioritiesData = prioritiesRes.data || [];
      const statusesData = statusesRes.data || [];
      const sequencesData = sequencesRes.data || [];

      setOffices(officesData);
      setStatuses(statusesData);

      // Enrich sequences with reference data
      const enriched = sequencesData.map((row) => ({
        ...row,
        office_data: officesData.find((o) => o.id === row.office),
        priority_data: prioritiesData.find((p) => p.id === row.priority),
        status_data: statusesData.find((s) => s.id === row.status),
      }));

      setSequences(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to realtime changes - stable function, no dependencies
  const subscribeToChanges = () => {
    // Prevent duplicate subscriptions
    if (isSubscribedRef.current || channelRef.current) {
      return;
    }

    isSubscribedRef.current = true;

    const channel = supabase
      .channel('queue-realtime-display-v2')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'module1',
          table: 'sequence',
        },
        async (payload) => {
          const newRow = payload.new as SequenceRow;
          console.log('🟢 INSERT:', newRow);

          // Fetch enriched data on-demand
          const enriched = await fetchEnrichedSequence(newRow);

          setSequences((prev) => {
            if (prev.some((seq) => seq.id === newRow.id)) return prev;
            return [...prev, enriched];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'module1',
          table: 'sequence',
        },
        async (payload) => {
          const updatedRow = payload.new as SequenceRow;
          console.log('🟡 UPDATE:', updatedRow);

          // Fetch enriched data on-demand
          const enriched = await fetchEnrichedSequence(updatedRow);

          setSequences((prev) =>
            prev.map((seq) => (seq.id === updatedRow.id ? enriched : seq))
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'module1',
          table: 'sequence',
        },
        (payload) => {
          const deletedRow = payload.old as { id: number };
          console.log('🔴 DELETE:', deletedRow);

          setSequences((prev) => prev.filter((seq) => seq.id !== deletedRow.id));
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;
  };

  // Cleanup subscription
  const unsubscribe = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
      setIsConnected(false);
    }
  };

  // Clock timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial data load and subscription setup - runs once on mount
  useEffect(() => {
    fetchAllData().then(() => {
      subscribeToChanges();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Get status by description helper
  const getStatusByDescription = (description: string) => {
    return statuses.find((s) => s.description?.toLowerCase().includes(description.toLowerCase()));
  };

  // Get pending sequences sorted by priority
  const getPendingSequences = (): Sequence[] => {
    const pendingStatus = getStatusByDescription('pending');
    const pending = sequences.filter((seq) => seq.status === pendingStatus?.id);

    return pending.sort((a, b) => {
      const priorityA = getPriorityWeight(a.priority_data?.description);
      const priorityB = getPriorityWeight(b.priority_data?.description);

      if (priorityA !== priorityB) return priorityA - priorityB;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  };

  // Get currently serving sequence for an office
  const getServingSequenceForOffice = (officeId: string): Sequence | undefined => {
    const servingStatus = getStatusByDescription('serving');
    return sequences.find((seq) => seq.office === officeId && seq.status === servingStatus?.id);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const activeOffices = offices.filter((o) => o.status);
  const pendingQueueList = getPendingSequences();

  if (isLoading && activeOffices.length === 0) {
    return (
      <>
        <BreadcrumbComp title="Queue Realtime Display" items={BCrumb} />
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <BreadcrumbComp title="Queue Realtime Display" items={BCrumb} />

      {/* Connection Status & Error Display */}
      <div className="flex items-center justify-between px-6 py-2">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              <Wifi className="h-3 w-3 mr-1" />
              Live Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
              <WifiOff className="h-3 w-3 mr-1" />
              Disconnected
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={fetchAllData} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-6 p-6 min-h-screen bg-muted/30">
        {/* Left side - Pending Queue */}
        <div className="w-80 shrink-0 space-y-4">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-center text-xl">
                Pending Queue
                <Badge variant="secondary" className="ml-2">
                  {pendingQueueList.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {pendingQueueList.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No customers waiting</div>
              ) : (
                <div className="divide-y max-h-[50vh] overflow-y-auto">
                  {pendingQueueList.map((seq) => {
                    const colors = getPriorityColor(seq.priority_data?.description);
                    return (
                      <div
                        key={seq.id}
                        className="py-4 px-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                      >
                        <span className={`text-2xl font-bold tracking-widest ${colors.text}`}>
                          {seq.queue_data?.code || '---'}
                        </span>
                        <Badge className={colors.badge}>
                          {seq.priority_data?.description || 'Regular'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Priority Legend */}
          <Card>
            <CardHeader className="border-b py-3">
              <CardTitle className="text-center text-sm">Priority Legend</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PRIORITY_COLORS).map(([key, colors]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${colors.bg}`} />
                    <span className={`text-xs capitalize ${colors.text}`}>{key}</span>
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
            <span className="text-2xl font-mono text-muted-foreground">{formatTime(currentTime)}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeOffices.map((office) => {
              const servingSequence = getServingSequenceForOffice(office.id);
              const colors = servingSequence
                ? getPriorityColor(servingSequence.priority_data?.description)
                : null;

              return (
                <Card key={office.id} className="overflow-hidden">
                  <CardHeader className="bg-primary/10 py-4">
                    <CardTitle className="text-xl text-center">
                      {office.description || office.id}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex flex-col items-center justify-center py-8 px-4">
                      {servingSequence ? (
                        <>
                          <span className={`text-6xl font-bold tracking-widest ${colors?.text}`}>
                            {servingSequence.queue}
                          </span>
                          <Badge className={`mt-3 ${colors?.badge}`}>
                            {servingSequence.priority_data?.description || 'Regular'}
                          </Badge>
                        </>
                      ) : (
                        <span className="text-4xl font-bold text-muted-foreground">—</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {activeOffices.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No active offices configured
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default QueueRealtimeDisplay;
