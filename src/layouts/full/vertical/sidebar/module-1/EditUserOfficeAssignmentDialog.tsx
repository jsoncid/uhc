import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useOfficeUserAssignmentStore,
  type OfficeUserAssignment,
} from '@/stores/module-1_stores/useOfficeUserAssignmentStore';
import { useOfficeStore, type Office } from '@/stores/module-1_stores/useOfficeStore';

interface EditUserOfficeAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: OfficeUserAssignment | null;
  onSuccess: () => void;
}

export const EditUserOfficeAssignmentDialog = ({
  isOpen,
  onClose,
  assignment,
  onSuccess,
}: EditUserOfficeAssignmentDialogProps) => {
  const { updateUserOfficeAssignment, isLoading, error, clearError } =
    useOfficeUserAssignmentStore();
  const { offices } = useOfficeStore();

  const [selectedOffice, setSelectedOffice] = useState<string>('');
  const [selectedWindow, setSelectedWindow] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Windows available for the currently selected office
  const availableWindows = offices.find((o) => o.id === selectedOffice)?.windows ?? [];

  useEffect(() => {
    if (isOpen && assignment) {
      setSelectedOffice(assignment.office);
      setSelectedWindow(assignment.window || '');
      clearError();
      setLocalError(null);
    }
  }, [isOpen, assignment, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!assignment) {
      setLocalError('No assignment selected');
      return;
    }

    if (!selectedOffice) {
      setLocalError('Please select an office');
      return;
    }

    if (selectedOffice === assignment.office && (selectedWindow || null) === (assignment.window || null)) {
      setLocalError('No changes detected');
      return;
    }

    try {
      await updateUserOfficeAssignment(assignment.id, selectedOffice, selectedWindow || null);
      onSuccess();
      onClose();
    } catch (err) {
      // Error is already set in the store
    }
  };

  const handleClose = () => {
    setSelectedOffice('');
    setSelectedWindow('');
    setLocalError(null);
    clearError();
    onClose();
  };

  // Reset window when office changes
  const handleOfficeChange = (value: string) => {
    setSelectedOffice(value);
    setSelectedWindow('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Office Assignment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {(error || localError) && (
              <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm">
                {error || localError}
              </div>
            )}

            <div className="grid gap-2">
              <Label>User</Label>
              <div className="px-3 py-2 bg-muted rounded-md text-sm">
                {assignment?.user_email || 'Unknown User'}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Current Office</Label>
              <div className="px-3 py-2 bg-muted rounded-md text-sm">
                {assignment?.office_description || 'Unnamed Office'}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Current Window</Label>
              <div className="px-3 py-2 bg-muted rounded-md text-sm">
                {assignment?.window_description || <span className="text-muted-foreground">None</span>}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="office">New Office</Label>
              <Select value={selectedOffice} onValueChange={handleOfficeChange}>
                <SelectTrigger id="office">
                  <SelectValue placeholder="Select a new office" />
                </SelectTrigger>
                <SelectContent>
                  {offices.length === 0 ? (
                    <SelectItem value="no-offices" disabled>
                      No offices available
                    </SelectItem>
                  ) : (
                    offices.map((office: Office) => (
                      <SelectItem key={office.id} value={office.id}>
                        {office.description || 'Unnamed Office'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="window">New Window <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Select
                value={selectedWindow}
                onValueChange={setSelectedWindow}
                disabled={!selectedOffice || availableWindows.length === 0}
              >
                <SelectTrigger id="window">
                  <SelectValue placeholder={!selectedOffice ? 'Select an office first' : availableWindows.length === 0 ? 'No windows available' : 'Select a window'} />
                </SelectTrigger>
                <SelectContent>
                  {availableWindows.map((window) => (
                    <SelectItem key={window.id} value={window.id}>
                      {window.description || 'Unnamed Window'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || offices.length === 0 || (selectedOffice === assignment?.office && (selectedWindow || null) === (assignment?.window || null))}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
