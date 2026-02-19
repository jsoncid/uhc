import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useOfficeStore } from '@/stores/module-1_stores/useOfficeStore';

export interface WindowItem {
  id: string;
  name: string;
}

export interface OfficeFormData {
  officeName: string;
  windows: WindowItem[];
}

interface AddOfficeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: string;
  onSuccess?: () => void;
}

export const AddOfficeDialog = ({ isOpen, onClose, assignmentId, onSuccess }: AddOfficeDialogProps) => {
  const { addOffice, isLoading: storeLoading, error: storeError } = useOfficeStore();
  const [formData, setFormData] = useState<OfficeFormData>({
    officeName: '',
    windows: [{ id: crypto.randomUUID(), name: '' }],
  });
  const [error, setError] = useState<string | null>(null);

  const handleAddWindow = () => {
    setFormData((prev) => ({
      ...prev,
      windows: [...prev.windows, { id: crypto.randomUUID(), name: '' }],
    }));
  };

  const handleRemoveWindow = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      windows: prev.windows.filter((w) => w.id !== id),
    }));
  };

  const handleWindowChange = (id: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      windows: prev.windows.map((w) => (w.id === id ? { ...w, name: value } : w)),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.officeName.trim()) {
      setError('Please enter an office name');
      return;
    }

    const filledWindows = formData.windows.filter((w) => w.name.trim() !== '');
    if (filledWindows.length === 0) {
      setError('Please add at least one window');
      return;
    }

    setError(null);

    try {
      const windowDescriptions = filledWindows.map((w) => w.name);
      await addOffice(assignmentId, formData.officeName, windowDescriptions);
      onSuccess?.();
      handleClose();
    } catch {
      setError('Failed to add office');
    }
  };

  const handleClose = () => {
    setFormData({
      officeName: '',
      windows: [{ id: crypto.randomUUID(), name: '' }],
    });
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Office</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">{error}</div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="officeName">Office Name</Label>
              <Input
                id="officeName"
                placeholder="e.g., Registration Office"
                value={formData.officeName}
                onChange={(e) => setFormData({ ...formData, officeName: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Windows</Label>
              <div className="space-y-2">
                {formData.windows.map((window, index) => (
                  <div key={window.id} className="flex items-center gap-2">
                    <Input
                      placeholder={`e.g., Window ${index + 1}`}
                      value={window.name}
                      onChange={(e) => handleWindowChange(window.id, e.target.value)}
                    />
                    {formData.windows.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => handleRemoveWindow(window.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-1 w-fit"
                onClick={handleAddWindow}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Window
              </Button>
            </div>
          </div>

          {storeError && (
            <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">{storeError}</div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={storeLoading}>
              {storeLoading ? 'Adding...' : 'Add Office'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
