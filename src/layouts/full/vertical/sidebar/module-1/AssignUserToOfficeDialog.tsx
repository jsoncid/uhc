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
import { useOfficeUserAssignmentStore } from '@/stores/module-1_stores/useOfficeUserAssignmentStore';
import { useOfficeStore, type Office } from '@/stores/module-1_stores/useOfficeStore';

interface AssignUserToOfficeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  onSuccess: () => void;
}

export const AssignUserToOfficeDialog = ({
  isOpen,
  onClose,
  assignmentId,
  onSuccess,
}: AssignUserToOfficeDialogProps) => {
  const { usersInAssignment, fetchUsersInAssignment, assignUserToOffice, isLoading, error, clearError } =
    useOfficeUserAssignmentStore();
  const { offices } = useOfficeStore();

  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedOffice, setSelectedOffice] = useState<string>('');
  const [selectedWindow, setSelectedWindow] = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Windows available for the currently selected office
  const availableWindows = offices.find((o) => o.id === selectedOffice)?.windows ?? [];

  useEffect(() => {
    if (isOpen && assignmentId) {
      fetchUsersInAssignment(assignmentId);
      clearError();
      setLocalError(null);
      setSelectedUser('');
      setSelectedOffice('');
      setSelectedWindow('');
    }
  }, [isOpen, assignmentId, fetchUsersInAssignment, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!selectedUser) {
      setLocalError('Please select a user');
      return;
    }

    if (!selectedOffice) {
      setLocalError('Please select an office');
      return;
    }

    try {
      await assignUserToOffice(selectedUser, selectedOffice, selectedWindow || null);
      onSuccess();
      onClose();
    } catch (err) {
      // Error is already set in the store
    }
  };

  const handleClose = () => {
    setSelectedUser('');
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
          <DialogTitle>Assign User to Office</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {(error || localError) && (
              <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm">
                {error || localError}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="user">User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger id="user">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {usersInAssignment.length === 0 ? (
                    <SelectItem value="no-users" disabled>
                      No users available
                    </SelectItem>
                  ) : (
                    usersInAssignment.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Only users assigned to this hospital/organization are shown
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="office">Office</Label>
              <Select value={selectedOffice} onValueChange={handleOfficeChange}>
                <SelectTrigger id="office">
                  <SelectValue placeholder="Select an office" />
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
              <Label htmlFor="window">Window <span className="text-muted-foreground text-xs">(optional)</span></Label>
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
            <Button type="submit" disabled={isLoading || usersInAssignment.length === 0 || offices.length === 0}>
              {isLoading ? 'Assigning...' : 'Assign User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
