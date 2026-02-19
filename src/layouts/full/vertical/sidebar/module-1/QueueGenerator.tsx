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

const PRIORITY_COLORS: Record<string, { bg: string; text: string; badge: string; border: string }> = {
  regular: {
    bg: 'bg-green-600 hover:bg-green-700',
    text: 'text-green-600',
    badge: 'bg-green-100 text-green-700',
    border: 'border-green-500',
  },
  senior: {
    bg: 'bg-blue-600 hover:bg-blue-700',
    text: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
    border: 'border-blue-500',
  },
  pwd: {
    bg: 'bg-purple-600 hover:bg-purple-700',
    text: 'text-purple-600',
    badge: 'bg-purple-100 text-purple-700',
    border: 'border-purple-500',
  },
  priority: {
    bg: 'bg-red-600 hover:bg-red-700',
    text: 'text-red-600',
    badge: 'bg-red-100 text-red-700',
    border: 'border-red-500',
  },
  urgent: {
    bg: 'bg-orange-600 hover:bg-orange-700',
    text: 'text-orange-600',
    badge: 'bg-orange-100 text-orange-700',
    border: 'border-orange-500',
  },
  vip: {
    bg: 'bg-yellow-600 hover:bg-yellow-700',
    text: 'text-yellow-600',
    badge: 'bg-yellow-100 text-yellow-700',
    border: 'border-yellow-500',
  },
};

const QueueGenerator = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [queueCode, setQueueCode] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
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

  const getPriorityColor = (description: string | null) => {
    const desc = description?.toLowerCase() || '';
    for (const [key, colors] of Object.entries(PRIORITY_COLORS)) {
      if (desc.includes(key)) {
        return colors;
      }
    }
    return PRIORITY_COLORS.regular;
  };

  const handleGenerateCode = async () => {
    if (!selectedOffice || !selectedPriority) return;

    setIsGenerating(true);
    const code = await generateQueueCode(selectedOffice, selectedPriority);
    setIsGenerating(false);

    if (code) {
      setQueueCode(code);
      const office = offices.find((o) => o.id === selectedOffice);
      setSelectedOfficeName(office?.description || '');
      const priority = priorities.find((p) => p.id === selectedPriority);
      setSelectedPriorityName(priority?.description || '');
      setIsDialogOpen(true);
    }
  };

  const isFormValid = !!selectedOffice && !!selectedPriority;
  const isLoading = officesLoading || queueLoading || isGenerating;

  const selectedPriorityData = priorities.find((p) => p.id === selectedPriority);
  const selectedPriorityColors = selectedPriorityData
    ? getPriorityColor(selectedPriorityData.description)
    : null;

  return (
    <>
      <BreadcrumbComp title="Queue Code Generator" items={BCrumb} />

      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Customer Check-in</CardTitle>
            <CardDescription>Select an office and queue type to get your number.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <div className="space-y-2">
              <Label>Select Priority Type</Label>
              {priorities.length > 0 ? (
                <Select value={selectedPriority} onValueChange={setSelectedPriority} disabled={isLoading}>
                  <SelectTrigger
                    className={selectedPriorityColors ? `border-2 ${selectedPriorityColors.border}` : ''}
                  >
                    <SelectValue placeholder="Choose a priority type" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((priority) => {
                      const colors = getPriorityColor(priority.description);
                      return (
                        <SelectItem key={priority.id} value={priority.id}>
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-3 h-3 rounded-full ${colors.bg.split(' ')[0]}`}
                            />
                            {priority.description || priority.id}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {queueLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading priority types...
                    </span>
                  ) : (
                    'No priority types available. Please contact an administrator.'
                  )}
                </p>
              )}
            </div>

            {selectedPriorityData && (
              <div
                className={`p-3 rounded-lg border-2 ${selectedPriorityColors?.border} ${selectedPriorityColors?.badge}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Selected Priority:</span>
                  <span className={`font-bold ${selectedPriorityColors?.text}`}>
                    {selectedPriorityData.description}
                  </span>
                </div>
              </div>
            )}

            <Button
              className={`w-full text-lg py-6 ${
                selectedPriorityColors ? selectedPriorityColors.bg : 'bg-primary hover:bg-primary/90'
              }`}
              onClick={handleGenerateCode}
              disabled={!isFormValid || isLoading}
            >
              {isGenerating ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : null}
              Generate Queue Code
            </Button>
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
