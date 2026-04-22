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

const BCrumb: never[] = [];

const QUEUE_TICKET_WIDTH_MM = '84.5';
const QUEUE_TICKET_HEIGHT_MM = '108';
const QUEUE_TICKET_WIDTH_IN = Number(QUEUE_TICKET_WIDTH_MM) / 25.4;
const QUEUE_TICKET_HEIGHT_IN = Number(QUEUE_TICKET_HEIGHT_MM) / 25.4;
const OFFICE_GRID_COLUMNS = 3;
const DEFAULT_PRINTER_VALUE = '__default_printer__';
const DEFAULT_PAPER_SIZE_VALUE = '__printer_default_paper__';
const PRINTER_DISCOVERY_TIMEOUT_MS = 2500;
const DEFAULT_PRINTER_BRIDGE_PORT = '4679';

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
  const [selectedOfficeName, setSelectedOfficeName] = useState('');
  const [generatedAt, setGeneratedAt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [preventClose, setPreventClose] = useState(false);
  const [selectedPrinter, setSelectedPrinter] = useState(DEFAULT_PRINTER_VALUE);
  const [selectedPaperSize, setSelectedPaperSize] = useState(DEFAULT_PAPER_SIZE_VALUE);
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [isPrinterLoading, setIsPrinterLoading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const printLockRef = useRef(false);
  const activeBridgeEndpointRef = useRef<string | null>(null);
  const [printerDiscoveryHint, setPrinterDiscoveryHint] = useState('');

  interface PrinterInfo {
    name: string;
    description?: string;
    paperSize?: string;
    paperSizes?: string[];
    isDefault?: boolean;
  }

  type PrinterProviderLike = {
    query: () => Promise<unknown>;
  };

  type GenericPrinterBridge = {
    getPrinters?: () => Promise<unknown> | unknown;
  };

  interface BridgePrintTicketPayload {
    queueCode: string;
    priority: string;
    generatedAt: string;
    isSpecial: boolean;
    printerName?: string;
    paperSize?: string;
  }

  const getPrinterBridgeEndpoints = () => {
    const configuredBridgeUrl = import.meta.env.VITE_PRINTER_BRIDGE_URL;

    const endpoints = [
      configuredBridgeUrl ? `${configuredBridgeUrl.replace(/\/$/, '')}/printers` : null,
      `http://localhost:${DEFAULT_PRINTER_BRIDGE_PORT}/printers`,
      `http://127.0.0.1:${DEFAULT_PRINTER_BRIDGE_PORT}/printers`,
    ].filter((endpoint): endpoint is string => Boolean(endpoint));

    return Array.from(new Set(endpoints));
  };

  const getPrinterBridgePrintEndpoints = () => {
    const endpoints = getPrinterBridgeEndpoints();
    const orderedEndpoints = activeBridgeEndpointRef.current
      ? [
        activeBridgeEndpointRef.current,
        ...endpoints.filter((endpoint) => endpoint !== activeBridgeEndpointRef.current),
      ]
      : endpoints;

    return orderedEndpoints.map((endpoint) => {
      if (endpoint.endsWith('/printers')) {
        return endpoint.replace(/\/printers$/, '/print-ticket');
      }

      return `${endpoint.replace(/\/$/, '')}/print-ticket`;
    });
  };

  const fetchPrinterEndpoint = async (endpoint: string) => {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`printer-endpoint-${response.status}`);
    }

    return response.json();
  };

  const postPrintTicketEndpoint = async (
    endpoint: string,
    payload: BridgePrintTicketPayload,
  ) => {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`print-endpoint-${response.status}`);
    }

    return response.json().catch(() => ({ ok: true }));
  };

  const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('timeout')), timeoutMs);
        }),
      ]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  };

  const normalizePrinter = (value: unknown): PrinterInfo | null => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed ? { name: trimmed } : null;
    }

    if (!value || typeof value !== 'object') {
      return null;
    }

    const rawPrinter = value as Record<string, unknown>;
    const rawName = rawPrinter.name
      ?? rawPrinter.displayName
      ?? rawPrinter.printerName
      ?? rawPrinter.deviceName
      ?? rawPrinter.id;

    if (typeof rawName !== 'string' || rawName.trim() === '') {
      return null;
    }

    const rawPaperSize = rawPrinter.paperSize
      ?? rawPrinter.PaperSize
      ?? rawPrinter.mediaSize
      ?? rawPrinter.media;

    const rawPaperSizes = rawPrinter.paperSizes ?? rawPrinter.PaperSizes;

    const rawIsDefault = rawPrinter.isDefault ?? rawPrinter.Default;

    const parsedPaperSizes = Array.isArray(rawPaperSizes)
      ? rawPaperSizes
        .filter((paperSize): paperSize is string => typeof paperSize === 'string')
        .map((paperSize) => paperSize.trim())
        .filter((paperSize) => paperSize.length > 0)
      : [];

    return {
      name: rawName.trim(),
      description:
        typeof rawPrinter.description === 'string'
          ? rawPrinter.description
          : undefined,
      paperSize: typeof rawPaperSize === 'string' ? rawPaperSize : undefined,
      paperSizes: Array.from(new Set(parsedPaperSizes)),
      isDefault: Boolean(rawIsDefault),
    };
  };

  const normalizePrinterList = (value: unknown): PrinterInfo[] => {
    if (Array.isArray(value)) {
      return value
        .map(normalizePrinter)
        .filter((printer): printer is PrinterInfo => Boolean(printer));
    }

    if (value && typeof value === 'object') {
      const wrapped = value as Record<string, unknown>;
      if (Array.isArray(wrapped.printers)) {
        return wrapped.printers
          .map(normalizePrinter)
          .filter((printer): printer is PrinterInfo => Boolean(printer));
      }
    }

    return [];
  };

  const getPrinterProvider = (): PrinterProviderLike | undefined => {
    const navigatorProvider = (
      navigator as Navigator & { printerProvider?: unknown }
    ).printerProvider;

    if (
      navigatorProvider
      && typeof (navigatorProvider as PrinterProviderLike).query === 'function'
    ) {
      return navigatorProvider as PrinterProviderLike;
    }

    const windowProvider = (
      window as Window & { printerProvider?: unknown }
    ).printerProvider;

    if (
      windowProvider
      && typeof (windowProvider as PrinterProviderLike).query === 'function'
    ) {
      return windowProvider as PrinterProviderLike;
    }

    return undefined;
  };

  const fetchPrinters = async () => {
    setIsPrinterLoading(true);
    setPrinterDiscoveryHint('');

    try {
      const printerLoaders: Array<() => Promise<unknown>> = [
        async () => {
          const provider = getPrinterProvider();
          return provider?.query();
        },
        async () => {
          const navPrinting = (
            navigator as Navigator & { printing?: GenericPrinterBridge }
          ).printing;
          return navPrinting?.getPrinters ? navPrinting.getPrinters() : undefined;
        },
        async () => {
          const winPrinting = (
            window as Window & { printing?: GenericPrinterBridge }
          ).printing;
          return winPrinting?.getPrinters ? winPrinting.getPrinters() : undefined;
        },
        async () => {
          const navBridge = navigator as Navigator & {
            getPrinters?: () => Promise<unknown> | unknown;
          };
          return navBridge.getPrinters ? navBridge.getPrinters() : undefined;
        },
        async () => {
          const winBridge = window as Window & {
            getPrinters?: () => Promise<unknown> | unknown;
          };
          return winBridge.getPrinters ? winBridge.getPrinters() : undefined;
        },
        async () => {
          const electronBridge = (window as Window & {
            electronAPI?: { getPrinters?: () => Promise<unknown> };
          }).electronAPI;
          return electronBridge?.getPrinters ? electronBridge.getPrinters() : undefined;
        },
      ];

      const printerMap = new Map<string, PrinterInfo>();
      let bridgeDetected = false;

      for (const loadPrinters of printerLoaders) {
        try {
          const rawResult = await withTimeout(
            Promise.resolve(loadPrinters()),
            PRINTER_DISCOVERY_TIMEOUT_MS,
          );

          if (rawResult !== undefined && rawResult !== null) {
            bridgeDetected = true;
          }

          const discoveredPrinters = normalizePrinterList(rawResult);

          if (discoveredPrinters.length > 0) {
            discoveredPrinters.forEach((printer) => {
              if (!printerMap.has(printer.name)) {
                printerMap.set(printer.name, printer);
              }
            });
          }
        } catch {
          // Continue trying other discovery sources.
        }
      }

      const bridgeEndpoints = getPrinterBridgeEndpoints();
      let activeBridgeEndpoint: string | null = null;
      for (const endpoint of bridgeEndpoints) {
        try {
          const rawResult = await withTimeout(
            fetchPrinterEndpoint(endpoint),
            PRINTER_DISCOVERY_TIMEOUT_MS,
          );

          bridgeDetected = true;
          if (!activeBridgeEndpoint) {
            activeBridgeEndpoint = endpoint;
          }

          const discoveredPrinters = normalizePrinterList(rawResult);
          discoveredPrinters.forEach((printer) => {
            if (!printerMap.has(printer.name)) {
              printerMap.set(printer.name, printer);
            }
          });
        } catch {
          // Continue trying other bridge endpoints.
        }
      }

      activeBridgeEndpointRef.current = activeBridgeEndpoint;

      const result = Array.from(printerMap.values());
      setPrinters(result);

      if (!bridgeDetected) {
        setPrinterDiscoveryHint('No printer API detected. Run local bridge on this PC: npm run printer-bridge');
      } else if (result.length === 0) {
        setPrinterDiscoveryHint('Printer API detected but no printers were returned.');
      }

      setSelectedPrinter((currentPrinter) => {
        if (result.length === 0) {
          return DEFAULT_PRINTER_VALUE;
        }

        if (
          currentPrinter !== DEFAULT_PRINTER_VALUE
          && result.some((printer) => printer.name === currentPrinter)
        ) {
          return currentPrinter;
        }

        return result[0].name;
      });
    } catch {
      setPrinters([]);
      setSelectedPrinter(DEFAULT_PRINTER_VALUE);
      setPrinterDiscoveryHint('Unable to load printer list from available sources.');
    } finally {
      setIsPrinterLoading(false);
    }
  };

  const getSelectedPrinterDetails = () => {
    if (selectedPrinter === DEFAULT_PRINTER_VALUE) {
      return printers.find((printer) => printer.isDefault);
    }

    return printers.find((printer) => printer.name === selectedPrinter);
  };

  const getSelectedPrinterPaperSizes = () => {
    const selectedPrinterDetails = getSelectedPrinterDetails();

    if (!selectedPrinterDetails) {
      return [];
    }

    const sizes = selectedPrinterDetails.paperSizes || [];
    if (sizes.length > 0) {
      return sizes;
    }

    return selectedPrinterDetails.paperSize ? [selectedPrinterDetails.paperSize] : [];
  };

  const getSelectedPrinterPaperSize = () => {
    const selectedPrinterDetails = getSelectedPrinterDetails();
    return selectedPrinterDetails?.paperSize || 'Unknown';
  };

  const getSelectedPaperSizeLabel = () => {
    if (selectedPaperSize !== DEFAULT_PAPER_SIZE_VALUE) {
      return selectedPaperSize;
    }

    return getSelectedPrinterPaperSize();
  };

  const printWithBridge = async (payload: BridgePrintTicketPayload) => {
    const bridgePrintEndpoints = getPrinterBridgePrintEndpoints();

    for (const endpoint of bridgePrintEndpoints) {
      try {
        await postPrintTicketEndpoint(endpoint, payload);
        return true;
      } catch {
        // Continue trying other bridge print endpoints.
      }
    }

    return false;
  };

  useEffect(() => {
    const availablePaperSizes = getSelectedPrinterPaperSizes();

    if (availablePaperSizes.length === 0) {
      if (selectedPaperSize !== DEFAULT_PAPER_SIZE_VALUE) {
        setSelectedPaperSize(DEFAULT_PAPER_SIZE_VALUE);
      }
      return;
    }

    if (
      selectedPaperSize !== DEFAULT_PAPER_SIZE_VALUE
      && availablePaperSizes.includes(selectedPaperSize)
    ) {
      return;
    }

    setSelectedPaperSize(availablePaperSizes[0]);
  }, [selectedPrinter, printers, selectedPaperSize]);

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

  // Load printers on mount
  useEffect(() => {
    fetchPrinters();
  }, []);

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
      const office = activeOffices.find((o) => o.id === selectedOffice);
      const officeName = office?.description || 'Unnamed Office';
      setSelectedOfficeName(officeName);
      const priority = priorities.find((p) => p.id === selectedPriority);
      const priorityName = priority?.description || '';
      setSelectedPriorityName(priorityName);
      setSelectedOffice('');
      setSelectedPriority('');
      setGeneratedAt(new Date().toLocaleString());
      setPreventClose(true);
      setIsDialogOpen(true);
      // Notification is handled automatically via Postgres Changes on sequence table
    }
  };

  const handlePrintDialog = async () => {
    if (!queueCode || isPrinting || printLockRef.current) return;

    printLockRef.current = true;
    setIsPrinting(true);

    try {
      const printerName = selectedPrinter === DEFAULT_PRINTER_VALUE
        ? undefined
        : selectedPrinter;

      const paperSize = selectedPaperSize === DEFAULT_PAPER_SIZE_VALUE
        ? undefined
        : selectedPaperSize;

      const didPrint = await printWithBridge({
        queueCode,
        priority: selectedPriorityName || 'Regular',
        generatedAt,
        isSpecial: isSpecialPriorityType(selectedPriorityName || 'regular'),
        printerName,
        paperSize,
      });

      if (!didPrint) {
        setPrinterDiscoveryHint('Automatic print failed. Ensure printer bridge is running: npm run printer-bridge');
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
  const selectedPrinterPaperSizes = getSelectedPrinterPaperSizes();

  const renderQueueTicketCard = () => (
    <div className="queue-ticket-card flex h-full flex-col items-center justify-between rounded-md bg-white px-4 py-4 text-center font-mono">
      <div className="w-full">
        <span className="text-[13px] font-bold tracking-[0.1em] uppercase">Queue Ticket</span>
      </div>
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
        <div className="flex flex-col items-end gap-1">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Select
              value={selectedPrinter}
              onValueChange={setSelectedPrinter}
              disabled={isPrinterLoading}
            >
              <SelectTrigger className="h-10 w-[220px] bg-white dark:bg-dark text-sm">
                <SelectValue placeholder="Select printer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DEFAULT_PRINTER_VALUE}>System Default Printer</SelectItem>
                {printers.map((printer) => (
                  <SelectItem key={printer.name} value={printer.name}>
                    {printer.name || 'Default Printer'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedPaperSize}
              onValueChange={setSelectedPaperSize}
              disabled={isPrinterLoading}
            >
              <SelectTrigger className="h-10 w-[180px] bg-white dark:bg-dark text-sm">
                <SelectValue placeholder="Paper size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DEFAULT_PAPER_SIZE_VALUE}>Current Printer Default</SelectItem>
                {selectedPrinterPaperSizes.map((paperSize) => (
                  <SelectItem key={paperSize} value={paperSize}>
                    {paperSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={fetchPrinters}
              disabled={isPrinterLoading}
              className="h-10 px-3"
            >
              {isPrinterLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
            </Button>
            {selectedPrinter ? (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Paper: {getSelectedPaperSizeLabel()} | Ticket: {QUEUE_TICKET_WIDTH_MM}mm x {QUEUE_TICKET_HEIGHT_MM}mm
              </span>
            ) : null}
          </div>
          {printerDiscoveryHint ? (
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              {printerDiscoveryHint}
            </p>
          ) : null}
        </div>
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
        <DialogContent
          className="sm:max-w-none max-w-none p-0 bg-white text-black dark:bg-white dark:text-black"
          style={{ width: `${QUEUE_TICKET_WIDTH_IN}in` }}
        >
          <div
            className="p-4"
            style={{ width: `${QUEUE_TICKET_WIDTH_IN}in`, minHeight: `${QUEUE_TICKET_HEIGHT_IN}in` }}
          >
            {renderQueueTicketCard()}
          </div>
          <DialogFooter id="queue-print-actions" className="sm:justify-center gap-2 mb-2">
            <Button type="button" onClick={handlePrintDialog} disabled={isPrinting}>
              {isPrinting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {isPrinting ? 'Printing...' : 'Print'}
            </Button>
            <Button type="button" variant="outline" onClick={() => {
                setPreventClose(false);
                setIsDialogOpen(false);
              }}>
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
