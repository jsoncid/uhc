import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { useOfficeStore } from '@/stores/module-1_stores/useOfficeStore';
import { useQueueStore } from '@/stores/module-1_stores/useQueueStore';

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Queue Generator' }];

const QueueGenerator = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [queueCode, setQueueCode] = useState('');
  const [selectedPriorityName, setSelectedPriorityName] = useState('');
  const [selectedOffice, setSelectedOffice] = useState('');
  const [selectedOfficeName, setSelectedOfficeName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const { offices, fetchOffices, isLoading: officesLoading } = useOfficeStore();
  const { priorities, fetchPriorities, generateQueueCode, isLoading: queueLoading } = useQueueStore();

  useEffect(() => {
    fetchOffices();
    fetchPriorities();
  }, [fetchOffices, fetchPriorities]);

  const handleGetQueueNumber = async (priorityId: string) => {
    if (!selectedOffice) return;

    setIsGenerating(true);
    const code = await generateQueueCode(selectedOffice, priorityId);
    setIsGenerating(false);

    if (code) {
      setQueueCode(code);
      const office = offices.find((o) => o.id === selectedOffice);
      setSelectedOfficeName(office?.description || '');
      const priority = priorities.find((p) => p.id === priorityId);
      setSelectedPriorityName(priority?.description || '');
      setIsDialogOpen(true);
    }
  };

  const isOfficeSelected = !!selectedOffice;
  const isLoading = officesLoading || queueLoading || isGenerating;

  const getPriorityColor = (description: string | null) => {
    const desc = description?.toLowerCase() || '';
    if (desc.includes('priority') || desc.includes('urgent')) {
      return { bg: 'bg-red-600 hover:bg-red-700', text: 'text-red-600', badge: 'bg-red-100 text-red-700' };
    }
    return { bg: 'bg-green-600 hover:bg-green-700', text: 'text-green-600', badge: 'bg-green-100 text-green-700' };
  };

  return (
    <>
      <BreadcrumbComp title="Queue Code Generator" items={BCrumb} />

      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Customer Check-in</CardTitle>
            <CardDescription>Select an office and queue type to get your number.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Office</Label>
              <Select value={selectedOffice} onValueChange={setSelectedOffice} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an office" />
                </SelectTrigger>
                <SelectContent>
                  {offices.filter(o => o.status).map((office) => (
                    <SelectItem key={office.id} value={office.id}>
                      {office.description || office.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 pt-2">
              {priorities.length > 0 ? (
                priorities.map((priority) => {
                  const colors = getPriorityColor(priority.description);
                  return (
                    <Button
                      key={priority.id}
                      className={`w-full ${colors.bg}`}
                      onClick={() => handleGetQueueNumber(priority.id)}
                      disabled={!isOfficeSelected || isLoading}
                    >
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      {priority.description || priority.id}
                    </Button>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {queueLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading queue types...
                    </span>
                  ) : (
                    'No queue types available. Please contact an administrator to set up priority types.'
                  )}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Your Queue Code</DialogTitle>
            <DialogDescription className="text-center">
              Please wait for your code to be called.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-8 space-y-4">
            <span className="text-sm text-muted-foreground">{selectedOfficeName}</span>
            <span
              className={`text-6xl font-bold tracking-widest ${getPriorityColor(selectedPriorityName).text}`}
            >
              {queueCode}
            </span>
            <span
              className={`text-sm font-medium px-3 py-1 rounded-full ${getPriorityColor(selectedPriorityName).badge}`}
            >
              {selectedPriorityName}
            </span>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QueueGenerator;
