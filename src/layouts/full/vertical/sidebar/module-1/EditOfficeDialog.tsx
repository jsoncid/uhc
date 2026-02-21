import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
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
import { useOfficeStore, type Office } from '@/stores/module-1_stores/useOfficeStore';

interface EditOfficeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  office: Office | null;
}

export const EditOfficeDialog = ({ isOpen, onClose, office }: EditOfficeDialogProps) => {
  const {
    updateOffice,
    updateWindow,
    addWindow,
    deleteWindow,
    isLoading,
    error: storeError,
  } = useOfficeStore();

  const [officeName, setOfficeName] = useState('');
  const [editingWindowId, setEditingWindowId] = useState<string | null>(null);
  const [editingWindowValue, setEditingWindowValue] = useState('');
  const [newWindowName, setNewWindowName] = useState('');
  const [isAddingWindow, setIsAddingWindow] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);

  useEffect(() => {
    if (office) {
      setOfficeName(office.description || '');
      setEditingWindowId(null);
      setEditingWindowValue('');
      setNewWindowName('');
      setIsAddingWindow(false);
      setLocalError(null);
      setIsEditingName(false);
    }
  }, [office]);

  const handleSaveOfficeName = async () => {
    if (!office || !officeName.trim()) {
      setLocalError('Office name cannot be empty');
      return;
    }
    setLocalError(null);
    await updateOffice(office.id, officeName.trim());
    setIsEditingName(false);
  };

  const handleStartEditWindow = (windowId: string, currentDesc: string) => {
    setEditingWindowId(windowId);
    setEditingWindowValue(currentDesc || '');
  };

  const handleSaveWindow = async () => {
    if (editingWindowId === null || !editingWindowValue.trim()) {
      setLocalError('Window name cannot be empty');
      return;
    }
    setLocalError(null);
    await updateWindow(editingWindowId, editingWindowValue.trim());
    setEditingWindowId(null);
    setEditingWindowValue('');
  };

  const handleCancelEditWindow = () => {
    setEditingWindowId(null);
    setEditingWindowValue('');
  };

  const handleAddWindow = async () => {
    if (!office || !newWindowName.trim()) {
      setLocalError('Window name cannot be empty');
      return;
    }
    setLocalError(null);
    await addWindow(office.id, newWindowName.trim());
    setNewWindowName('');
    setIsAddingWindow(false);
  };

  const handleDeleteWindow = async (windowId: string) => {
    if (confirm('Are you sure you want to delete this window?')) {
      await deleteWindow(windowId);
    }
  };

  const handleClose = () => {
    setLocalError(null);
    setEditingWindowId(null);
    setIsEditingName(false);
    setIsAddingWindow(false);
    onClose();
  };

  if (!office) return null;

  const windows = office.windows || [];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Edit Office</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {(localError || storeError) && (
            <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md text-sm">
              {localError || storeError}
            </div>
          )}

          {/* Office Name */}
          <div className="grid gap-2">
            <Label>Office Name</Label>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={officeName}
                  onChange={(e) => setOfficeName(e.target.value)}
                  autoFocus
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSaveOfficeName}
                  disabled={isLoading}
                >
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setIsEditingName(false);
                    setOfficeName(office.description || '');
                  }}
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="flex-1 px-3 py-2 border rounded-md bg-muted text-sm">
                  {office.description || 'Unnamed Office'}
                </span>
                <Button size="icon" variant="ghost" onClick={() => setIsEditingName(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Windows */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Windows ({windows.length})</Label>
              {!isAddingWindow && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingWindow(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Window
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {windows.map((w, index) => (
                <div key={w.id} className="flex items-center gap-2">
                  {editingWindowId === w.id ? (
                    <>
                      <Input
                        value={editingWindowValue}
                        onChange={(e) => setEditingWindowValue(e.target.value)}
                        autoFocus
                        className="flex-1"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleSaveWindow}
                        disabled={isLoading}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={handleCancelEditWindow}>
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 px-3 py-2 border rounded-md bg-muted text-sm">
                        {w.description || `Window ${index + 1}`}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleStartEditWindow(w.id, w.description || '')}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteWindow(w.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </>
                  )}
                </div>
              ))}

              {windows.length === 0 && !isAddingWindow && (
                <p className="text-sm text-muted-foreground py-2">
                  No windows. Click "Add Window" to create one.
                </p>
              )}

              {isAddingWindow && (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Window name"
                    value={newWindowName}
                    onChange={(e) => setNewWindowName(e.target.value)}
                    autoFocus
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleAddWindow}
                    disabled={isLoading}
                  >
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setIsAddingWindow(false);
                      setNewWindowName('');
                    }}
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
