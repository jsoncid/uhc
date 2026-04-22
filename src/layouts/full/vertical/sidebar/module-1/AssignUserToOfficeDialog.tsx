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
  type OfficeWindowAssignmentInput,
} from '@/stores/module-1_stores/useOfficeUserAssignmentStore';
import { useOfficeStore, type Office } from '@/stores/module-1_stores/useOfficeStore';

interface AssignUserToOfficeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  onSuccess: () => void;
}

interface StagedOfficeAssignment {
  officeId: string;
  officeLabel: string;
  windowId: string | null;
  windowLabel: string | null;
}

export const AssignUserToOfficeDialog = ({
  isOpen,
  onClose,
  assignmentId,
  onSuccess,
}: AssignUserToOfficeDialogProps) => {
  const {
    usersInAssignment,
    fetchUsersInAssignment,
    assignUserToOffices,
    isLoading,
    error,
    clearError,
  } =
    useOfficeUserAssignmentStore();
  const { offices } = useOfficeStore();

  const [selectedUser, setSelectedUser] = useState<string>('');
  const [selectedOffice, setSelectedOffice] = useState<string>('');
  const [selectedWindow, setSelectedWindow] = useState<string>('');
  const [stagedAssignments, setStagedAssignments] = useState<StagedOfficeAssignment[]>([]);
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
      setStagedAssignments([]);
    }
  }, [isOpen, assignmentId, fetchUsersInAssignment, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!selectedUser) {
      setLocalError('Please select a user');
      return;
    }

    if (stagedAssignments.length === 0) {
      setLocalError('Please add at least one office assignment');
      return;
    }

    try {
      const payload: OfficeWindowAssignmentInput[] = stagedAssignments.map((item) => ({
        officeId: item.officeId,
        windowId: item.windowId,
      }));

      await assignUserToOffices(selectedUser, payload);
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
    setStagedAssignments([]);
    setLocalError(null);
    clearError();
    onClose();
  };

  // Reset window when office changes
  const handleOfficeChange = (value: string) => {
    setSelectedOffice(value);
    setSelectedWindow('');
  };

  const handleAddOfficeAssignment = () => {
    setLocalError(null);

    if (!selectedOffice) {
      setLocalError('Please select an office before adding');
      return;
    }

    if (stagedAssignments.some((item) => item.officeId === selectedOffice)) {
      setLocalError('This office is already added');
      return;
    }

    const office = offices.find((o) => o.id === selectedOffice);
    const window = availableWindows.find((w) => w.id === selectedWindow);

    setStagedAssignments((prev) => [
      ...prev,
      {
        officeId: selectedOffice,
        officeLabel: office?.description || 'Unnamed Office',
        windowId: selectedWindow || null,
        windowLabel: selectedWindow ? window?.description || 'Unnamed Window' : null,
      },
    ]);

    setSelectedOffice('');
    setSelectedWindow('');
  };

  const handleRemoveStagedAssignment = (officeId: string) => {
    setStagedAssignments((prev) => prev.filter((item) => item.officeId !== officeId));
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
                      <SelectItem
                        key={office.id}
                        value={office.id}
                        disabled={stagedAssignments.some((item) => item.officeId === office.id)}
                      >
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

            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddOfficeAssignment}
                disabled={!selectedOffice}
              >
                Add Office Assignment
              </Button>
            </div>

            <div className="grid gap-2">
              <Label>Offices to Assign</Label>
              {stagedAssignments.length === 0 ? (
                <div className="px-3 py-2 bg-muted rounded-md text-sm text-muted-foreground">
                  No office assignment added yet
                </div>
              ) : (
                <div className="max-h-40 overflow-y-auto rounded-md border">
                  {stagedAssignments.map((item) => (
                    <div
                      key={item.officeId}
                      className="flex items-center justify-between gap-2 border-b px-3 py-2 last:border-b-0"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{item.officeLabel}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          Window: {item.windowLabel || 'None'}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveStagedAssignment(item.officeId)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                You can assign multiple offices to one user. Each office can only have one window.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isLoading ||
                usersInAssignment.length === 0 ||
                offices.length === 0 ||
                stagedAssignments.length === 0
              }
            >
              {isLoading ? 'Assigning...' : 'Assign User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
