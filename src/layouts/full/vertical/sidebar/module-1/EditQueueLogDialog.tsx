import { useState, useEffect } from 'react';
import { Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useQueueStore, type Sequence } from '@/stores/module-1_stores/useQueueStore';
import { useOfficeStore } from '@/stores/module-1_stores/useOfficeStore';

interface EditQueueLogDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sequence: Sequence | null;
  onSuccess?: () => void;
}

export const EditQueueLogDialog = ({ isOpen, onClose, sequence, onSuccess }: EditQueueLogDialogProps) => {
  const { statuses, fetchStatuses, updateSequence } = useQueueStore();
  const { offices, fetchOffices } = useOfficeStore();

  const [selectedStatusId, setSelectedStatusId] = useState<string>('');
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchStatuses();
      fetchOffices();
    }
  }, [isOpen, fetchStatuses, fetchOffices]);

  useEffect(() => {
    if (sequence) {
      setSelectedStatusId(sequence.status || '');
      setSelectedOfficeId(sequence.office || '');
      setIsActive(sequence.is_active);
      setLocalError(null);
    }
  }, [sequence]);

  const handleSave = async () => {
    if (!sequence) return;

    setIsSaving(true);
    setLocalError(null);

    try {
      const result = await useQueueStore.getState().updateSequence(
        sequence.id,
        selectedStatusId,
        isActive,
        selectedOfficeId
      );

      if (result.error) {
        setLocalError(result.error.message || 'Failed to update queue log');
        return;
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (!sequence) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Edit Queue Log
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Queue Code (Read-only) */}
          <div className="rounded-md border border-green-600 p-3 bg-muted/50">
            <p className="text-sm font-medium">Queue Code</p>
            <code className="text-lg font-mono">{sequence.queue_data?.code || 'N/A'}</code>
          </div>

          {/* Office Select */}
          <div className="space-y-2">
            <Label htmlFor="office">Office</Label>
            <Select value={selectedOfficeId} onValueChange={setSelectedOfficeId}>
              <SelectTrigger className="w-full py-5 text-base border border-green-600 [&>span]:!leading-[2rem] hover:bg-accent hover:text-accent-foreground transition-colors [&_.lucide-chevron-down]:!text-green-600">
                <SelectValue placeholder="Select office" />
              </SelectTrigger>
              <SelectContent>
                {offices.map((office) => (
                  <SelectItem key={office.id} value={office.id} className="hover:bg-accent hover:text-accent-foreground transition-colors">
                    {office.description || 'Unnamed'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Select */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={selectedStatusId} onValueChange={setSelectedStatusId}>
              <SelectTrigger className="w-full py-5 text-base border border-green-600 [&>span]:!leading-[2rem] hover:bg-accent hover:text-accent-foreground transition-colors [&_.lucide-chevron-down]:!text-green-600">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.id} value={status.id} className="hover:bg-accent hover:text-accent-foreground transition-colors">
                    {status.description || 'Unnamed'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Toggle */}
          <div className={`flex items-center justify-between rounded-md border p-3 ${isActive ? 'border-green-600' : 'border-red-600'}`}>
            <div>
              <Label htmlFor="isActive" className="font-medium">{isActive ? 'Activated' : 'Deactivated'}</Label>
              <p className="text-sm text-muted-foreground">
                {isActive ? 'This queue is active' : 'This queue is inactive'}
              </p>
            </div>
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
              className={isActive ? 'data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-300' : 'data-[state=checked]:bg-red-600 data-[state=unchecked]:bg-gray-300'}
            />
          </div>

          {/* Error Message */}
          {localError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {localError}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
