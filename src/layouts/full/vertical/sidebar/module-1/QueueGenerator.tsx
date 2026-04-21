import { useState, useEffect, useMemo } from 'react';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { useOfficeStore } from '@/stores/module-1_stores/useOfficeStore';
import { useQueueStore } from '@/stores/module-1_stores/useQueueStore';
import { useUserProfile } from '@/hooks/useUserProfile';

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Queue Generator' }];

const QUEUE_TICKET_WIDTH_MM = '84.5';
const QUEUE_TICKET_HEIGHT_MM = '108';
const QUEUE_TICKET_WIDTH_IN = Number(QUEUE_TICKET_WIDTH_MM) / 25.4;
const QUEUE_TICKET_HEIGHT_IN = Number(QUEUE_TICKET_HEIGHT_MM) / 25.4;
const QUEUE_CODE_COLOR = '#dc2626';
const OFFICE_GRID_COLUMNS = 3;

const PRIORITY_PRINT_COLORS: Record<string, { code: string; badgeBg: string; badgeText: string }> = {
  regular: { code: '#16a34a', badgeBg: '#dcfce7', badgeText: '#166534' },
  senior: { code: '#2563eb', badgeBg: '#dbeafe', badgeText: '#1e3a8a' },
  pwd: { code: '#9333ea', badgeBg: '#f3e8ff', badgeText: '#6b21a8' },
  priority: { code: '#dc2626', badgeBg: '#fee2e2', badgeText: '#991b1b' },
  urgent: { code: '#ea580c', badgeBg: '#ffedd5', badgeText: '#9a3412' },
  vip: { code: '#ca8a04', badgeBg: '#fef9c3', badgeText: '#854d0e' },
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const PRIORITY_COLORS: Record<string, { bg: string; text: string; badge: string; border: string }> =
  {
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
  const [isOfficeDialogOpen, setIsOfficeDialogOpen] = useState(false);
  const [queueCode, setQueueCode] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [selectedPriorityName, setSelectedPriorityName] = useState('');
  const [selectedOffice, setSelectedOffice] = useState('');
  const [selectedOfficeName, setSelectedOfficeName] = useState('');
  const [generatedAt, setGeneratedAt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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
    const desc = description?.toLowerCase() || '';
    for (const [key, colors] of Object.entries(PRIORITY_COLORS)) {
      if (desc.includes(key)) {
        return colors;
      }
    }
    return PRIORITY_COLORS.regular;
  };

  const getPriorityPrintColor = (description: string) => {
    const desc = description.toLowerCase();
    for (const [key, colors] of Object.entries(PRIORITY_PRINT_COLORS)) {
      if (desc.includes(key)) return colors;
    }
    return PRIORITY_PRINT_COLORS.regular;
  };

  const buildTicketPrintHtml = (
    safeOffice: string,
    safeCode: string,
    safePriority: string,
    safeGeneratedAt: string,
    colors: { code: string; badgeBg: string; badgeText: string },
  ) => `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Queue Ticket</title>
          <style>
            @page {
              size: ${QUEUE_TICKET_WIDTH_MM}mm ${QUEUE_TICKET_HEIGHT_MM}mm;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            html,
            body {
              margin: 0;
              padding: 0;
              width: ${QUEUE_TICKET_WIDTH_MM}mm;
              height: ${QUEUE_TICKET_HEIGHT_MM}mm;
              background: #ffffff;
              overflow: hidden;
              font-family: "Consolas", "Courier New", monospace;
            }
            .ticket-wrap {
              width: 100%;
              height: 100%;
              padding: 3mm;
            }
            .ticket {
              width: 100%;
              height: 100%;
              border: none;
              border-radius: 2mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              align-items: center;
              text-align: center;
              padding: 2.5mm 2mm;
            }
            .title {
              margin: 0;
              font-size: 13px;
              font-weight: 700;
              letter-spacing: 0.08em;
              text-transform: uppercase;
            }
            .line {
              width: 100%;
              border-top: 1px dashed #afb2b6;
            }
            .code {
              margin: 0;
              font-size: 104;
              font-weight: 800;
              letter-spacing: 0.14em;
              line-height: 1;
              color: ${QUEUE_CODE_COLOR};
            }
            .priority {
              margin-top: 1.6mm;
              font-size: 10.5px;
              font-weight: 700;
              color: ${colors.badgeText};
              background: ${colors.badgeBg};
              border-radius: 999px;
              padding: 1mm 3mm;
              text-transform: uppercase;
            }
            .datetime {
              margin: 0;
              font-size: 9px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="ticket-wrap">
            <div class="ticket">
              <div style="width:100%;">
                <p class="title">Queue Ticket</p>
              </div>
              <div class="line"></div>
              <p class="code">${safeCode}</p>
              <p class="priority">${safePriority}</p>
              <p class="datetime">${safeGeneratedAt}</p>
            </div>
          </div>
        </body>
      </html>
    `;

  const buildTicketInlineMarkup = (
    safeOffice: string,
    safeCode: string,
    safePriority: string,
    safeGeneratedAt: string,
    colors: { code: string; badgeBg: string; badgeText: string },
  ) => `
      <div style="width:${QUEUE_TICKET_WIDTH_MM}mm;height:${QUEUE_TICKET_HEIGHT_MM}mm;padding:3mm;box-sizing:border-box;background:#ffffff;font-family:'Consolas','Courier New',monospace;">
        <div style="width:100%;height:100%;border:none;border-radius:2mm;display:flex;flex-direction:column;justify-content:space-between;align-items:center;text-align:center;padding:2.5mm 2mm;box-sizing:border-box;">
          <div style="width:100%;">
            <p style="margin:0;font-size:18px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Queue Ticket</p>
          </div>
          <div style="width:100%;border-top:1px dashed #afb2b6;"></div>
          <p style="margin:0;font-size:104px;font-weight:800;letter-spacing:0.14em;line-height:1;color:${QUEUE_CODE_COLOR};">${safeCode}</p>
          <p style="margin-top:1.6mm;font-size:16.5px;font-weight:700;color:${colors.badgeText};background:${colors.badgeBg};border-radius:999px;padding:1mm 3mm;text-transform:uppercase;">${safePriority}</p>
          <p style="margin:0;font-size:14px;color:#6b7280;">${safeGeneratedAt}</p>
        </div>
      </div>
    `;

  const printWithCurrentWindow = (markup: string) => {
    const existingRoot = document.getElementById('queue-inline-print-root');
    if (existingRoot && document.body.contains(existingRoot)) {
      document.body.removeChild(existingRoot);
    }

    const existingStyle = document.getElementById('queue-inline-print-style');
    if (existingStyle && document.head.contains(existingStyle)) {
      document.head.removeChild(existingStyle);
    }

    const printRoot = document.createElement('div');
    printRoot.id = 'queue-inline-print-root';
    printRoot.setAttribute('aria-hidden', 'true');
    printRoot.style.position = 'fixed';
    printRoot.style.left = '-10000px';
    printRoot.style.top = '0';
    printRoot.style.width = `${QUEUE_TICKET_WIDTH_MM}mm`;
    printRoot.style.height = `${QUEUE_TICKET_HEIGHT_MM}mm`;
    printRoot.innerHTML = markup;

    const printStyle = document.createElement('style');
    printStyle.id = 'queue-inline-print-style';
    printStyle.textContent = `
      @page {
        size: ${QUEUE_TICKET_WIDTH_MM}mm ${QUEUE_TICKET_HEIGHT_MM}mm;
        margin: 0;
      }
      @media print {
        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
          width: auto !important;
          height: auto !important;
          overflow: visible !important;
          background: #ffffff !important;
        }

        body > *:not(#queue-inline-print-root) {
          display: none !important;
        }

        #queue-inline-print-root,
        #queue-inline-print-root * {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        #queue-inline-print-root {
          display: block !important;
          visibility: visible !important;
          position: fixed !important;
          left: 0 !important;
          top: 0 !important;
          width: ${QUEUE_TICKET_WIDTH_MM}mm !important;
          height: ${QUEUE_TICKET_HEIGHT_MM}mm !important;
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          z-index: 2147483647 !important;
        }
      }
    `;

    let hasCleanedUp = false;

    const cleanup = () => {
      if (hasCleanedUp) return;
      hasCleanedUp = true;

      window.removeEventListener('afterprint', cleanup);
      if (document.body.contains(printRoot)) {
        document.body.removeChild(printRoot);
      }
      if (document.head.contains(printStyle)) {
        document.head.removeChild(printStyle);
      }
    };

    document.head.appendChild(printStyle);
    document.body.appendChild(printRoot);
    window.addEventListener('afterprint', cleanup);

    window.focus();
    window.print();
  };

  const printWithIframe = (html: string) => {
    const printFrame = document.createElement('iframe');
    printFrame.setAttribute('aria-hidden', 'true');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameWindow = printFrame.contentWindow;
    const frameDocument = frameWindow?.document;

    if (!frameWindow || !frameDocument) {
      document.body.removeChild(printFrame);
      return;
    }

    let hasPrinted = false;
    const cleanup = () => {
      if (!document.body.contains(printFrame)) return;
      document.body.removeChild(printFrame);
    };

    const printReceipt = () => {
      if (hasPrinted) return;
      hasPrinted = true;

      frameWindow.onafterprint = cleanup;
      frameWindow.focus();
      frameWindow.print();

      // Fallback cleanup if afterprint is not emitted.
      window.setTimeout(cleanup, 1200);
    };

    printFrame.onload = printReceipt;
    frameDocument.open();
    frameDocument.write(html);
    frameDocument.close();

    // Some browsers skip iframe onload when content is injected quickly.
    window.setTimeout(printReceipt, 160);
  };

  const handleGenerateCode = async () => {
    if (!selectedOffice || !selectedPriority) return;

    setIsGenerating(true);
    const code = await generateQueueCode(selectedOffice, selectedPriority);
    setIsGenerating(false);

    if (code) {
      setQueueCode(code);
      const office = activeOffices.find((o) => o.id === selectedOffice);
      const officeName = office?.description || 'Unnamed Office';
      setSelectedOfficeName(officeName);
      const priority = priorities.find((p) => p.id === selectedPriority);
      const priorityName = priority?.description || '';
      setSelectedPriorityName(priorityName);
      setGeneratedAt(new Date().toLocaleString());
      setIsDialogOpen(true);
      // Notification is handled automatically via Postgres Changes on sequence table
    }
  };

  const handlePrintDialog = () => {
    if (!queueCode) return;

    const colors = getPriorityPrintColor(selectedPriorityName || 'regular');
    const safeCode = escapeHtml(queueCode);
    const safePriority = escapeHtml(selectedPriorityName || 'Regular');
    const safeGeneratedAt = escapeHtml(generatedAt || '');

    const ticketInlineMarkup = buildTicketInlineMarkup(
      '',
      safeCode,
      safePriority,
      safeGeneratedAt,
      colors,
    );

    try {
      printWithCurrentWindow(ticketInlineMarkup);
    } catch {
      const ticketHtml = buildTicketPrintHtml(
        '',
        safeCode,
        safePriority,
        safeGeneratedAt,
        colors,
      );
      printWithIframe(ticketHtml);
    }
  };

  const isFormValid = !!selectedOffice && !!selectedPriority;
  const isLoading = profileLoading || officesLoading || queueLoading || isGenerating;

  const selectedPriorityData = priorities.find((p) => p.id === selectedPriority);
  const selectedPriorityColors = selectedPriorityData
    ? getPriorityColor(selectedPriorityData.description)
    : null;

  const renderQueueTicketCard = () => (
    <div className="queue-ticket-card flex h-full flex-col items-center justify-between rounded-md bg-white px-4 py-4 text-center font-mono">
      <div className="w-full">
        <span className="text-[13px] font-bold tracking-[0.1em] uppercase">Queue Ticket</span>
      </div>
      <div className="h-px w-full border-t border-dashed border-gray-300" />
      <span
        className="text-[68px] leading-none font-black tracking-[0.14em] text-red-600"
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
      <BreadcrumbComp title="Queue Code Generator" items={BCrumb} />

      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="w-full max-w-xl">
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
                <span className={`truncate ${selectedOfficeData ? 'text-black' : 'text-muted-foreground'}`}>
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
              disabled={!isFormValid || isLoading}
            >
              {isGenerating ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : null}
              Generate Queue Code
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className="sm:max-w-none max-w-none p-0"
          style={{ width: `${QUEUE_TICKET_WIDTH_IN}in` }}
        >
          <div
            className="p-4"
            style={{ width: `${QUEUE_TICKET_WIDTH_IN}in`, minHeight: `${QUEUE_TICKET_HEIGHT_IN}in` }}
          >
            {renderQueueTicketCard()}
          </div>
          <DialogFooter id="queue-print-actions" className="sm:justify-center gap-2 mb-2">
            <Button onClick={handlePrintDialog}>Print</Button>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
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
                        className={`h-14 rounded-md border border-border/60 px-4 text-base data-[selected=true]:text-black ${isSelected ? 'bg-lightprimary text-black border-primary/40' : ''}`}
                      >
                        <span className={`truncate font-medium ${isSelected ? 'text-black' : ''}`}>
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
