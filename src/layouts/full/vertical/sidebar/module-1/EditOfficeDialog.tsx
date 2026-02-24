import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, Check, X, Building2, LayoutGrid, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  const displayError = localError || storeError;

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[580px] p-0 gap-0 overflow-hidden rounded-xl border border-border/50 shadow-xl">
          {/* ── Header ── */}
          <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-lg font-semibold leading-tight">
                  Edit Office
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Update office details and manage service windows.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Separator />

          {/* ── Body ── */}
          <div className="px-6 py-5 space-y-6">
            {/* Error Banner */}
            {displayError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{displayError}</span>
              </div>
            )}

            {/* ── Office Name Section ── */}
            <div className="space-y-2.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Office Name
              </Label>

              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={officeName}
                    onChange={(e) => setOfficeName(e.target.value)}
                    autoFocus
                    className="h-10 transition-shadow focus-visible:ring-2 focus-visible:ring-primary/30"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveOfficeName();
                      if (e.key === 'Escape') {
                        setIsEditingName(false);
                        setOfficeName(office.description || '');
                      }
                    }}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 shrink-0 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                        onClick={handleSaveOfficeName}
                        disabled={isLoading}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Save</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 shrink-0 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        onClick={() => {
                          setIsEditingName(false);
                          setOfficeName(office.description || '');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Cancel</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              ) : (
                <div
                  className="group flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-4 py-2.5 transition-colors hover:border-primary/30 hover:bg-muted/60 cursor-pointer"
                  onClick={() => setIsEditingName(true)}
                >
                  <span className="flex-1 text-sm font-medium">
                    {office.description || 'Unnamed Office'}
                  </span>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>

            {/* ── Windows Section ── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Windows
                  </Label>
                  <Badge
                    variant="secondary"
                    className="h-5 px-1.5 text-[10px] font-bold rounded-full"
                  >
                    {windows.length}
                  </Badge>
                </div>
                {!isAddingWindow && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-colors"
                    onClick={() => setIsAddingWindow(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Window
                  </Button>
                )}
              </div>

              <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1 scrollbar-thin">
                {windows.map((w, index) => (
                  <div
                    key={w.id}
                    className={`group flex items-center gap-2 rounded-lg border px-3 py-2.5 transition-all ${
                      editingWindowId === w.id
                        ? 'border-primary/40 bg-primary/5 shadow-sm'
                        : 'border-border/50 bg-card hover:border-border hover:shadow-sm'
                    }`}
                  >
                    {editingWindowId === w.id ? (
                      <>
                        <Input
                          value={editingWindowValue}
                          onChange={(e) => setEditingWindowValue(e.target.value)}
                          autoFocus
                          className="flex-1 h-8 text-sm border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveWindow();
                            if (e.key === 'Escape') handleCancelEditWindow();
                          }}
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              onClick={() => {
                                if (editingWindowId) handleDeleteWindow(editingWindowId);
                              }}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p>Delete</p>
                          </TooltipContent>
                        </Tooltip>
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-mono text-muted-foreground/60 w-5 text-center select-none">
                          {index + 1}
                        </span>
                        <span
                          className="flex-1 text-sm cursor-pointer"
                          onClick={() => handleStartEditWindow(w.id, w.description || '')}
                        >
                          {w.description || `Window ${index + 1}`}
                        </span>
                        <div className="flex items-center gap-0.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                onClick={() => handleDeleteWindow(w.id)}
                                disabled={isLoading}
                              >
                                <Trash2 className="h-4.5 w-4.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <p>Delete</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* Empty State */}
                {windows.length === 0 && !isAddingWindow && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 mb-3">
                      <LayoutGrid className="h-5 w-5 text-muted-foreground/60" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">No windows yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      Click "Add Window" to create one
                    </p>
                  </div>
                )}

                {/* Add Window Inline Form */}
                {isAddingWindow && (
                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2.5 animate-in fade-in slide-in-from-bottom-2">
                    <Plus className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                    <Input
                      placeholder="Enter window name..."
                      value={newWindowName}
                      onChange={(e) => setNewWindowName(e.target.value)}
                      autoFocus
                      className="flex-1 h-8 text-sm border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddWindow();
                        if (e.key === 'Escape') {
                          setIsAddingWindow(false);
                          setNewWindowName('');
                        }
                      }}
                    />
                    <div className="flex items-center gap-0.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                        onClick={handleAddWindow}
                        disabled={isLoading}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        onClick={() => {
                          setIsAddingWindow(false);
                          setNewWindowName('');
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <Separator />
          <DialogFooter className="px-6 py-4 bg-muted/20">
            <Button variant="outline" onClick={handleClose} className="px-5 transition-colors">
              Close
            </Button>
            <Button
              onClick={async () => {
                if (isEditingName) await handleSaveOfficeName();
                if (editingWindowId) await handleSaveWindow();
                handleClose();
              }}
              disabled={isLoading}
              className="px-5 transition-colors"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};
