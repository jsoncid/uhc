import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { useOfficeStore } from '@/stores/module-1_stores/useOfficeStore';
import { useQueueStore } from '@/stores/module-1_stores/useQueueStore';
import { useUserProfile } from '@/hooks/useUserProfile';
import { cn } from '@/lib/utils';

/** Custom DialogContent without X/close button for the queue ticket dialog */
const DialogContentNoClose = ({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogPrimitive.Content
      className={cn(
        'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 bg-white dark:bg-dark p-6 shadow-lg duration-200 rounded-lg',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%]',
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
);

const BCrumb: never[] = [];

const QUEUE_TICKET_WIDTH_MM = '84.5';
const QUEUE_TICKET_HEIGHT_MM = '108';
const QUEUE_TICKET_WIDTH_IN = Number(QUEUE_TICKET_WIDTH_MM) / 25.4;
const QUEUE_TICKET_HEIGHT_IN = Number(QUEUE_TICKET_HEIGHT_MM) / 25.4;
const OFFICE_GRID_COLUMNS = 3;
const PRINT_CLICK_COOLDOWN_MS = 1200;

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const PRIORITY_COLORS = {
  regular: {
    bg: 'bg-green-600 hover:bg-green-700',
    text: 'text-green-600',
    badge: 'bg-green-100 text-green-700',
    border: 'border-green-500',
  },
  special: {
    bg: 'bg-red-600 hover:bg-red-700',
    text: 'text-red-600',
    badge: 'bg-red-100 text-red-700',
    border: 'border-red-500',
  },
};

const isSpecialPriorityType = (description: string | null | undefined): boolean => {
  const desc = (description || '').toLowerCase();
  return desc.includes('senior') || desc.includes('pwd') || desc.includes('ob');
};

const QueueGenerator = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isOfficeDialogOpen, setIsOfficeDialogOpen] = useState(false);
  const [queueCode, setQueueCode] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedPriorityName, setSelectedPriorityName] = useState('');
  const [selectedOffice, setSelectedOffice] = useState('');
  const [generatedAt, setGeneratedAt] = useState('');
  const [ticketBorderColor, setTicketBorderColor] = useState('');
  const [ticketOfficeDescription, setTicketOfficeDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [preventClose, setPreventClose] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printDisabled, setPrintDisabled] = useState(false);
  const printLockRef = useRef(false);
  const lastPrintClickAtRef = useRef(0);
  const [printSuccess, setPrintSuccess] = useState(false);

  interface QueueTicketPrintPayload {
      queueCode: string;
      priority: string;
      generatedAt: string;
      isSpecial: boolean;
      borderColor?: string;
      officeDescription?: string;
    }

  const printWithBrowserKiosk = async (payload: QueueTicketPrintPayload) => {
      const priorityText = (payload.priority || 'Regular').toUpperCase();
      const codeColor = payload.isSpecial ? '#dc2626' : '#16a34a';
      const badgeBorder = payload.isSpecial ? '#dc2626' : '#16a34a';
      const badgeTextColor = payload.isSpecial ? '#dc2626' : '#16a34a';
      const ticketBorder = payload.borderColor || '#d1d5db';
    const officeDescription = payload.officeDescription || '';

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Queue Ticket</title>
    <style>
      @page { size: ${QUEUE_TICKET_WIDTH_MM}mm ${QUEUE_TICKET_HEIGHT_MM}mm; margin: 0; }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        width: ${QUEUE_TICKET_WIDTH_MM}mm;
        height: ${QUEUE_TICKET_HEIGHT_MM}mm;
        overflow: hidden;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }
      .ticket {
              width: ${QUEUE_TICKET_WIDTH_MM}mm;
              height: ${QUEUE_TICKET_HEIGHT_MM}mm;
              padding: 4mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              text-align: center;
              border: 6px solid ${ticketBorder};
            }
      .title {
        width: 100%;
        font-size: 23px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .line {
              width: 100%;
              border-top: 1px dashed #d1d5db;
            }
            .office {
              width: 100%;
              font-size: 18px;
              font-weight: 700;
              color: #374151;
              text-transform: uppercase;
              letter-spacing: 0.06em;
            }
      .code {
        color: ${codeColor};
        font-size: 90px;
        line-height: 1;
        font-weight: 900;
        letter-spacing: 0.14em;
      }
      .priority {
        color: ${badgeTextColor};
        border: 2px solid ${badgeBorder};
        border-radius: 9999px;
        padding: 4px 12px;
        font-size: 22px;
        font-weight: 700;
        text-transform: uppercase;
      }
      .time {
        font-size: 20px;
        color: #6b7288;
      }
    </style>
  </head>
  <body>
    <div class="ticket">
          <div class="title">Queue Ticket</div>
          ${officeDescription ? `<div class="line"></div><div class="office">${escapeHtml(officeDescription)}</div>` : ''}
          <div class="line"></div>
      <div class="code">${escapeHtml(payload.queueCode)}</div>
      <div class="priority">${escapeHtml(priorityText)}</div>
      <div class="time">${escapeHtml(payload.generatedAt)}</div>
    </div>
  </body>
</html>`;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');

    document.body.appendChild(iframe);

    try {
      const frameWindow = iframe.contentWindow;
      if (!frameWindow) {
        return false;
      }

      const frameDoc = frameWindow.document;
      frameDoc.open();
      frameDoc.write(html);
      frameDoc.close();

      frameWindow.focus();
      frameWindow.print();
      return true;
    } catch {
      return false;
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1000);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && preventClose) return;
    setIsDialogOpen(open);
  };

  const { profile, loading: profileLoading } = useUserProfile();
  const { offices, fetchOffices, isLoading: officesLoading } = useOfficeStore();
  const {
    priorities,
    fetchPriorities,
    generateQueueCode,
    isLoading: queueLoading,
  } = useQueueStore();

  // Get assignment IDs from user profile
  const userAssignmentIds = useMemo(() => {
    return profile?.assignments?.map((a) => a.id) || [];
  }, [profile?.assignments]);

  const activeOffices = useMemo(
    () =>
      offices
        .filter((office) => office.status)
        .sort((a, b) =>
          (a.description || 'Unnamed Office').localeCompare(
            b.description || 'Unnamed Office',
            undefined,
            { sensitivity: 'base', numeric: true },
          ),
        ),
    [offices],
  );

  const officePickerItems = useMemo(() => {
    const rows = Math.ceil(activeOffices.length / OFFICE_GRID_COLUMNS);
    const reordered: typeof activeOffices = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < OFFICE_GRID_COLUMNS; col += 1) {
        const sourceIndex = col * rows + row;
        if (sourceIndex < activeOffices.length) {
          reordered.push(activeOffices[sourceIndex]);
        }
      }
    }

    return reordered;
  }, [activeOffices]);

  const selectedOfficeData = useMemo(
    () => activeOffices.find((office) => office.id === selectedOffice),
    [activeOffices, selectedOffice],
  );

  useEffect(() => {
    fetchPriorities();
  }, [fetchPriorities]);

  // Fetch offices filtered by user's assignments
  useEffect(() => {
    if (!profileLoading) {
      fetchOffices(userAssignmentIds.length > 0 ? userAssignmentIds : undefined);
    }
  }, [profileLoading, userAssignmentIds, fetchOffices]);

  useEffect(() => {
    if (!selectedOffice) return;

    if (!activeOffices.some((office) => office.id === selectedOffice)) {
      setSelectedOffice('');
    }
  }, [activeOffices, selectedOffice]);

  const getPriorityColor = (description: string | null) => {
    return isSpecialPriorityType(description)
      ? PRIORITY_COLORS.special
      : PRIORITY_COLORS.regular;
  };

  const handleGenerateCode = async () => {
    if (!selectedOffice || !selectedPriority) return;

    setIsGenerating(true);
    const code = await generateQueueCode(selectedOffice, selectedPriority);
    setIsGenerating(false);

    if (code) {
          setQueueCode(code);
          const priority = priorities.find((p) => p.id === selectedPriority);
          const priorityName = priority?.description || '';
          const officeColor = selectedOfficeData?.office_color || '';
                    const officeDesc = selectedOfficeData?.description || '';
                    setTicketBorderColor(officeColor);
                    setTicketOfficeDescription(officeDesc);
          setSelectedPriorityName(priorityName);
          setSelectedOffice('');
          setSelectedPriority('');
          setGeneratedAt(new Date().toLocaleString());
          setPreventClose(true);
          setPrintDisabled(false);
          setIsDialogOpen(true);
      // Notification is handled automatically via Postgres Changes on sequence table
    }
  };

  const handlePrintDialog = async () => {
    const now = Date.now();
    if (now - lastPrintClickAtRef.current < PRINT_CLICK_COOLDOWN_MS) return;
    lastPrintClickAtRef.current = now;

    if (!queueCode || isPrinting || printLockRef.current || printDisabled) return;

    printLockRef.current = true;
    setIsPrinting(true);
    setPrintDisabled(true);

    try {
      const payload: QueueTicketPrintPayload = {
              queueCode,
              priority: selectedPriorityName || 'Regular',
              generatedAt,
              isSpecial: isSpecialPriorityType(selectedPriorityName || 'regular'),
              borderColor: ticketBorderColor,
              officeDescription: ticketOfficeDescription,
            };

      const didPrint = await printWithBrowserKiosk(payload);

      if (didPrint) {
        setPrintSuccess(true);
        setTimeout(() => {
                  setPrintSuccess(false);
                  setPreventClose(false);
                  setIsDialogOpen(false);
                  setQueueCode('');
                  setSelectedPriorityName('');
                  setGeneratedAt('');
                  setTicketBorderColor('');
                  setTicketOfficeDescription('');
                }, 1500);
      }
    } finally {
      printLockRef.current = false;
      setIsPrinting(false);
    }
  };

  const isFormValid = !!selectedOffice && !!selectedPriority;
  const isLoading = profileLoading || officesLoading || queueLoading || isGenerating;

  const selectedPriorityData = priorities.find((p) => p.id === selectedPriority);
  const selectedPriorityColors = selectedPriorityData
    ? getPriorityColor(selectedPriorityData.description)
    : null;
  const renderQueueTicketCard = () => (
      <div
        className="queue-ticket-card flex h-full flex-col items-center justify-between rounded-md bg-white px-4 py-4 text-center font-mono border-[10px]"
        style={ticketBorderColor ? { borderColor: ticketBorderColor } : undefined}
      >
      <div className="w-full">
              <span className="text-[13px] font-bold tracking-[0.1em] uppercase">Queue Ticket</span>
            </div>
            {ticketOfficeDescription && (
              <>
                <div className="h-px w-full border-t border-dashed border-gray-300" />
                <span className="w-full text-[15px] font-bold uppercase tracking-[0.06em] text-foreground">
                  {ticketOfficeDescription}
                </span>
              </>
            )}
            <div className="h-px w-full border-t border-dashed border-gray-300" />
      <span
        className={`text-[68px] leading-none font-black tracking-[0.14em] ${getPriorityColor(selectedPriorityName).text}`}
      >
        {queueCode}
      </span>
      <span
        className={`text-[12px] font-bold px-3 py-1 rounded-full uppercase ${getPriorityColor(selectedPriorityName).badge}`}
      >
        {selectedPriorityName}
      </span>
      <span className="text-[10px] text-muted-foreground">{generatedAt}</span>
    </div>
  );

  return (
    <>
      <BreadcrumbComp title="Queue Code Generator" items={BCrumb}>
      </BreadcrumbComp>

      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="w-full max-w-xl border border-border/80 dark:border-white/20 bg-background/70 dark:bg-background/60 shadow-[0_6px_16px_rgba(0,0,0,0.20)]">
          <CardHeader className="text-center space-y-1">
            <CardTitle className="text-3xl">Customer Check-in</CardTitle>
            <CardDescription className="text-lg">Select an office and queue type to get your number.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-7">
            <div className="space-y-3">
              <Label className="text-lg font-semibold">Select Office</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full h-14 px-5 text-lg justify-between"
                onClick={() => setIsOfficeDialogOpen(true)}
                disabled={isLoading || activeOffices.length === 0}
              >
                <span className={`truncate ${selectedOfficeData ? 'text-black dark:text-white' : 'text-muted-foreground'}`}>
                  {selectedOfficeData?.description || 'Choose an office'}
                </span>
                <ChevronsUpDown className="h-5 w-5 opacity-60" />
              </Button>
              {activeOffices.length === 0 && !isLoading ? (
                <p className="text-sm text-muted-foreground">No offices available.</p>
              ) : null}
            </div>

            <div className="space-y-3">
              <Label className="text-lg font-semibold">Select Priority Type</Label>
              {priorities.length > 0 ? (
                <Select
                  value={selectedPriority}
                  onValueChange={setSelectedPriority}
                  disabled={isLoading}
                >
                  <SelectTrigger
                    className={`w-full !h-14 data-[size=default]:!h-14 !px-5 !text-lg justify-between ${selectedPriorityColors ? `border-2 ${selectedPriorityColors.border}` : ''}`}
                  >
                    <SelectValue className="text-lg" placeholder="Choose a priority type" />
                  </SelectTrigger>
                  <SelectContent className="w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] text-lg">
                    {priorities.map((priority) => {
                      const colors = getPriorityColor(priority.description);
                      return (
                        <SelectItem key={priority.id} value={priority.id} className="py-3.5 text-base">
                          <div className="flex items-center gap-3">
                            <span className={`w-4 h-4 rounded-full ${colors.bg.split(' ')[0]}`} />
                            {priority.description || priority.id}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-base text-muted-foreground text-center py-4">
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

            <Button
              className="w-full text-2xl py-7 bg-primary hover:bg-primary/90"
              onClick={handleGenerateCode}
              disabled={!isFormValid || isLoading || isGenerating}
            >
              {isGenerating ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
              Generate Queue Code
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <DialogContentNoClose
          className="sm:max-w-none max-w-none p-0 bg-white text-black dark:bg-white dark:text-black"
          style={{ width: `${QUEUE_TICKET_WIDTH_IN}in` }}
        >
          {printSuccess && (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-green-500 bg-green-50 px-4 py-3 text-green-700">
              <Check className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Printed successfully!</span>
            </div>
          )}
          <div
            className="p-4"
            style={{ width: `${QUEUE_TICKET_WIDTH_IN}in`, minHeight: `${QUEUE_TICKET_HEIGHT_IN}in` }}
          >
            {renderQueueTicketCard()}
          </div>
          <DialogFooter id="queue-print-actions" className="sm:justify-center gap-2 mb-2">
            <Button type="button" onClick={handlePrintDialog} disabled={isPrinting || printDisabled}>
              {isPrinting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {isPrinting ? 'Printing...' : 'Print'}
            </Button>
          </DialogFooter>
        </DialogContentNoClose>
      </Dialog>

      <Dialog open={isOfficeDialogOpen} onOpenChange={setIsOfficeDialogOpen}>
        <DialogContent className="w-[96vw] max-w-5xl p-0 overflow-hidden">
          <Command>
            <div className="px-4 pt-4 pb-2">
              <Label className="text-base font-semibold">Select Office</Label>
            </div>
            <CommandInput placeholder="Search office..." />
            <CommandList className="max-h-[65vh] px-3 pb-3">
              <CommandEmpty>No office found.</CommandEmpty>
              <CommandGroup heading="Available offices" className="p-1">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {officePickerItems.map((office) => {
                    const isSelected = office.id === selectedOffice;

                    return (
                      <CommandItem
                        key={office.id}
                        value={office.description || 'Unnamed Office'}
                        onSelect={() => {
                          setSelectedOffice(office.id);
                          setIsOfficeDialogOpen(false);
                        }}
                        className={`h-14 rounded-md border px-4 text-base bg-background/60 dark:bg-background/40 border-border/80 dark:border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.20)] data-[selected=true]:text-black dark:data-[selected=true]:text-white ${isSelected ? 'bg-lightprimary text-black dark:text-white border-primary/60 ring-1 ring-primary/30 shadow-[0_6px_14px_rgba(34,197,94,0.18)]' : ''}`}
                      >
                        <span className={`truncate font-medium ${isSelected ? 'text-black dark:text-white' : ''}`}>
                          {office.description || 'Unnamed Office'}
                        </span>
                        <Check
                          className={`ml-auto h-4 w-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`}
                        />
                      </CommandItem>
                    );
                  })}
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
          <DialogFooter className="px-4 pb-4 pt-2">
            <Button variant="outline" onClick={() => setIsOfficeDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QueueGenerator;
