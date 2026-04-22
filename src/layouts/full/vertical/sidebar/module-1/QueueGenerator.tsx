import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Loader2 } from 'lucide-react';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { useOfficeStore } from '@/stores/module-1_stores/useOfficeStore';
import { useQueueStore } from '@/stores/module-1_stores/useQueueStore';
import { useUserProfile } from '@/hooks/useUserProfile';

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Queue Generator' }];

const QUEUE_TICKET_WIDTH_MM = '82.5';
const QUEUE_TICKET_HEIGHT_MM = '100';
const QUEUE_TICKET_WIDTH_IN = Number(QUEUE_TICKET_WIDTH_MM) / 25.4;
const QUEUE_TICKET_HEIGHT_IN = Number(QUEUE_TICKET_HEIGHT_MM) / 25.4;

const PRIORITY_PRINT_COLORS = {
  regular: { code: '#16a34a', badgeBg: '#dcfce7', badgeText: '#166534' },
  special: { code: '#dc2626', badgeBg: '#fee2e2', badgeText: '#991b1b' },
};

const escapeHtml = (value: string) =>
  value
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

  useEffect(() => {
    fetchPriorities();
  }, [fetchPriorities]);

  // Fetch offices filtered by user's assignments
  useEffect(() => {
    if (!profileLoading) {
      fetchOffices(userAssignmentIds.length > 0 ? userAssignmentIds : undefined);
    }
  }, [profileLoading, userAssignmentIds, fetchOffices]);

  const getPriorityColor = (description: string | null) => {
    return isSpecialPriorityType(description)
      ? PRIORITY_COLORS.special
      : PRIORITY_COLORS.regular;
  };

  const getPriorityPrintColor = (description: string) => {
    return isSpecialPriorityType(description)
      ? PRIORITY_PRINT_COLORS.special
      : PRIORITY_PRINT_COLORS.regular;
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
            .office {
              margin: 1.2mm 0 0;
              font-size: 10px;
              color: #4b5563;
              text-transform: uppercase;
              line-height: 1.2;
            }
            .line {
              width: 100%;
              border-top: 1px dashed #d1d5db;
              margin: 1.8mm 0;
            }
            .code {
              margin: 0;
              font-size: 104;
              font-weight: 800;
              letter-spacing: 0.14em;
              line-height: 1;
              color: ${colors.code};
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
            <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Queue Ticket</p>
          </div>
          <div style="width:100%;border-top:1px dashed #d1d5db;margin:1.8mm 0;"></div>
          <p style="margin:0;font-size:104px;font-weight:800;letter-spacing:0.14em;line-height:1;color:${colors.code};">${safeCode}</p>
          <p style="margin-top:1.6mm;font-size:10.5px;font-weight:700;color:${colors.badgeText};background:${colors.badgeBg};border-radius:999px;padding:1mm 3mm;text-transform:uppercase;">${safePriority}</p>
          <p style="margin:0;font-size:9px;color:#6b7280;">${safeGeneratedAt}</p>
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
      const office = offices.find((o) => o.id === selectedOffice);
      const officeName = office?.description || '';
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
    const safeOffice = escapeHtml(selectedOfficeName || '');
    const safeCode = escapeHtml(queueCode);
    const safePriority = escapeHtml(selectedPriorityName || 'Regular');
    const safeGeneratedAt = escapeHtml(generatedAt || '');

    const ticketInlineMarkup = buildTicketInlineMarkup(
      safeOffice,
      safeCode,
      safePriority,
      safeGeneratedAt,
      colors,
    );

    try {
      printWithCurrentWindow(ticketInlineMarkup);
    } catch {
      const ticketHtml = buildTicketPrintHtml(
        safeOffice,
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
      <span className="text-[11px] font-medium leading-tight text-muted-foreground text-center uppercase">
        {selectedOfficeName}
      </span>
      <div className="h-px w-full bg-gray-300" />
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
      <BreadcrumbComp title="Queue Code Generator" items={BCrumb} />

      <div className="flex justify-center items-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Customer Check-in</CardTitle>
            <CardDescription className="text-base">Select an office and queue type to get your number.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Select Office</Label>
              <Select value={selectedOffice} onValueChange={setSelectedOffice} disabled={isLoading}>
                <SelectTrigger className="w-full h-12 px-4 text-base">
                  <SelectValue className="text-base" placeholder="Choose an office" />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] text-base">
                  {offices
                    .filter((o) => o.status)
                    .map((office) => (
                      <SelectItem key={office.id} value={office.id} className="py-3 text-base">
                        {office.description || office.id}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Select Priority Type</Label>
              {priorities.length > 0 ? (
                <Select
                  value={selectedPriority}
                  onValueChange={setSelectedPriority}
                  disabled={isLoading}
                >
                  <SelectTrigger
                    className={`w-full h-12 px-4 text-base ${selectedPriorityColors ? `border-2 ${selectedPriorityColors.border}` : ''}`}
                  >
                    <SelectValue className="text-base" placeholder="Choose a priority type" />
                  </SelectTrigger>
                  <SelectContent className="w-[var(--radix-select-trigger-width)] min-w-[var(--radix-select-trigger-width)] text-base">
                    {priorities.map((priority) => {
                      const colors = getPriorityColor(priority.description);
                      return (
                        <SelectItem key={priority.id} value={priority.id} className="py-3 text-base">
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

            {selectedPriorityData && (
              <div
                className={`p-3 rounded-lg border-2 ${selectedPriorityColors?.border} ${selectedPriorityColors?.badge}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium">Selected Priority:</span>
                  <span className={`text-lg font-bold ${selectedPriorityColors?.text}`}>
                    {selectedPriorityData.description}
                  </span>
                </div>
              </div>
            )}

            <Button
              className={`w-full text-lg py-6 ${
                selectedPriorityColors
                  ? selectedPriorityColors.bg
                  : 'bg-primary hover:bg-primary/90'
              }`}
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
          <DialogFooter id="queue-print-actions" className="sm:justify-center gap-2">
            <Button onClick={handlePrintDialog}>Print</Button>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QueueGenerator;
