import { useState } from 'react';
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
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Queue Generator' }];

// Sample offices
const offices = [
  { id: '1', name: 'Emergency Room' },
  { id: '2', name: 'Billing & Payment' },
  { id: '3', name: 'Laboratory' },
  { id: '4', name: 'Pharmacy' },
  { id: '5', name: 'Registration' },
];

const QueueGenerator = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [queueNumber, setQueueNumber] = useState('');
  const [queueType, setQueueType] = useState<'regular' | 'priority'>('regular');
  const [selectedOffice, setSelectedOffice] = useState('');
  const [selectedOfficeName, setSelectedOfficeName] = useState('');

  const handleGetQueueNumber = (type: 'regular' | 'priority') => {
    if (!selectedOffice) return;

    // Generate a sample queue number based on type
    const number = Math.floor(Math.random() * 100) + 1;
    const prefix = type === 'regular' ? 'R' : 'P';
    setQueueNumber(`${prefix}-${String(number).padStart(3, '0')}`);
    setQueueType(type);

    const office = offices.find((o) => o.id === selectedOffice);
    setSelectedOfficeName(office?.name || '');

    setIsDialogOpen(true);
  };

  const isOfficeSelected = !!selectedOffice;

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
              <Select value={selectedOffice} onValueChange={setSelectedOffice}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an office" />
                </SelectTrigger>
                <SelectContent>
                  {offices.map((office) => (
                    <SelectItem key={office.id} value={office.id}>
                      {office.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => handleGetQueueNumber('regular')}
                disabled={!isOfficeSelected}
              >
                Regular
              </Button>
              <Button
                className="w-full bg-red-600 hover:bg-red-700"
                onClick={() => handleGetQueueNumber('priority')}
                disabled={!isOfficeSelected}
              >
                Priority
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Your Queue Number</DialogTitle>
            <DialogDescription className="text-center">
              Please wait for your number to be called.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-8 space-y-4">
            <span className="text-sm text-muted-foreground">{selectedOfficeName}</span>
            <span
              className={`text-6xl font-bold ${queueType === 'regular' ? 'text-green-600' : 'text-red-600'}`}
            >
              {queueNumber}
            </span>
            <span
              className={`text-sm font-medium px-3 py-1 rounded-full ${
                queueType === 'regular' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {queueType === 'regular' ? 'Regular' : 'Priority'}
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
