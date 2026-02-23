'use client';

import { useContext, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router';

import { ReferralContext, ReferralContextType } from '../../context/ReferralContext';
import { ReferralType, ReferralHistory } from '../../types/referral';
import CardBox from 'src/components/shared/CardBox';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Badge } from 'src/components/ui/badge';
import { Separator } from 'src/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'src/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from 'src/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from 'src/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu';

// ─── Shared helpers ───────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-lightwarning text-warning',
  Accepted: 'bg-lightsuccess text-success',
  'In Transit': 'bg-lightinfo text-info',
  Arrived: 'bg-lightprimary text-primary',
  Admitted: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  Discharged: 'bg-lightsecondary text-secondary',
  Declined: 'bg-lighterror text-error',
  Deactivated: 'bg-muted text-muted-foreground',
};

const getStatusStyle = (d?: string | null) =>
  STATUS_STYLES[d ?? ''] ?? 'bg-lightprimary text-primary';

const fmt = (iso: string | null | undefined, pattern = 'MMM dd, yyyy') =>
  iso ? format(new Date(iso), pattern) : '—';

// ─── Timeline entry ───────────────────────────────────────────────────────────
const TimelineEntry = ({ entry, isLast }: { entry: ReferralHistory; isLast: boolean }) => (
  <div className="flex gap-3">
    <div className="flex flex-col items-center">
      <div
        className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ring-2 ring-offset-2 ${
          STATUS_STYLES[entry.status_description ?? '']
            ? 'ring-current ' + STATUS_STYLES[entry.status_description ?? '']
            : 'bg-primary ring-primary'
        }`}
      />
      {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
    </div>
    <div className="pb-4 flex-1">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge
          variant="outline"
          className={'text-xs font-medium ' + getStatusStyle(entry.status_description)}
        >
          {entry.status_description ?? '—'}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {format(new Date(entry.created_at), 'MMM dd, yyyy – h:mm a')}
        </span>
      </div>
      <p className="text-sm font-semibold mt-1">{entry.to_assignment_name ?? '—'}</p>
      {entry.details && (
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{entry.details}</p>
      )}
    </div>
  </div>
);

// ─── History dialog ───────────────────────────────────────────────────────────
const HistoryDialog = ({
  referral,
  open,
  onClose,
}: {
  referral: ReferralType | null;
  open: boolean;
  onClose: () => void;
}) => {
  if (!referral) return null;
  const sorted = [...(referral.history ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {referral.patient_name ?? '—'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-1">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              From
            </p>
            <p className="text-sm font-semibold">{referral.from_assignment_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Destination
            </p>
            <p className="text-sm font-semibold">{referral.to_assignment_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Date Created
            </p>
            <p className="text-sm font-semibold">{fmt(referral.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Last Status
            </p>
            <Badge
              variant="outline"
              className={
                'text-xs font-medium ' + getStatusStyle(referral.latest_status?.description)
              }
            >
              {referral.latest_status?.description ?? '—'}
            </Badge>
          </div>
          {referral.deactivated_by && (
            <>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Deactivated By
                </p>
                <p className="text-sm font-semibold">{referral.deactivated_by}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Deactivated At
                </p>
                <p className="text-sm font-semibold">
                  {fmt(referral.deactivated_at, 'MMM dd, yyyy – h:mm a')}
                </p>
              </div>
            </>
          )}
        </div>

        <Separator className="my-4" />

        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Icon icon="solar:history-bold-duotone" height={16} className="text-muted-foreground" />
            Referral History
          </h4>
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history recorded.</p>
          ) : (
            sorted.map((entry, idx) => (
              <TimelineEntry key={entry.id} entry={entry} isLast={idx === sorted.length - 1} />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─── Stop badges ──────────────────────────────────────────────────────────────
const StopBadges = ({ history }: { history: ReferralHistory[] }) => {
  const stops = history.length;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex -space-x-1">
        {history.slice(0, 3).map((h) => (
          <div
            key={h.id}
            className={`w-5 h-5 rounded-full border-2 border-background flex items-center justify-center text-[9px] font-bold ${getStatusStyle(h.status_description)}`}
          >
            {(h.status_description ?? '?')[0]}
          </div>
        ))}
        {stops > 3 && (
          <div className="w-5 h-5 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
            +{stops - 3}
          </div>
        )}
      </div>
      <span className="text-xs text-muted-foreground">
        {stops} stop{stops !== 1 ? 's' : ''}
      </span>
    </div>
  );
};

// ─── Search bar ───────────────────────────────────────────────────────────────
const SearchBar = ({
  value,
  onChange,
  placeholder = 'Search patient, facility...',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => (
  <div className="relative sm:w-60 w-full">
    <Icon
      icon="tabler:search"
      height={16}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
    />
    <Input
      type="text"
      className="pl-9 h-9 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  </div>
);

// ─── Pagination ───────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

const Paginator = ({
  total,
  page,
  perPage,
  onPageChange,
}: {
  total: number;
  page: number;
  perPage: number;
  onPageChange: (p: number) => void;
}) => {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).reduce<(number | string)[]>(
    (acc, p) => {
      if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
        if (
          acc.length > 0 &&
          typeof acc[acc.length - 1] === 'number' &&
          (acc[acc.length - 1] as number) !== p - 1
        )
          acc.push('…');
        acc.push(p);
      }
      return acc;
    },
    [],
  );
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
      <span>
        Showing {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of{' '}
        {total}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <Icon icon="solar:alt-arrow-left-linear" height={14} />
        </Button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-1">
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(p as number)}
            >
              {p}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <Icon icon="solar:alt-arrow-right-linear" height={14} />
        </Button>
      </div>
    </div>
  );
};

// ─── Tab: Referral History (all) ──────────────────────────────────────────────
const AllHistoryTab = ({
  referrals,
  deactivated,
  incoming,
  onView,
  search,
}: {
  referrals: ReferralType[];
  deactivated: ReferralType[];
  incoming: ReferralType[];
  onView: (r: ReferralType) => void;
  search: string;
}) => {
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Merge outgoing, deactivated, and incoming — deduplicate by id
  const seen = new Set<string>();
  const all = [...referrals, ...deactivated, ...incoming].filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
  const allVisible = all
    .filter((r) => {
      const q = search.toLowerCase();
      return (
        !q ||
        (r.patient_name ?? '').toLowerCase().includes(q) ||
        (r.from_assignment_name ?? '').toLowerCase().includes(q) ||
        (r.referral_info?.referring_doctor ?? '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const visible = allVisible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div>
        <div className="rounded-md border border-ld overflow-x-auto scrollbar-none">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Patient</TableHead>
                <TableHead className="font-semibold">From Assignment</TableHead>
                <TableHead className="font-semibold">Destination</TableHead>
                <TableHead className="font-semibold">Last Status</TableHead>
                <TableHead className="font-semibold">Date Created</TableHead>
                <TableHead className="font-semibold">Journey</TableHead>
                <TableHead className="font-semibold text-right">History</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-14 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Icon icon="solar:history-bold-duotone" height={44} className="opacity-25" />
                      <p className="text-sm">No records found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <span className="font-medium text-sm">{r.patient_name ?? '—'}</span>
                          {r.status === false && (
                            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
                              Deactivated
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.from_assignment_name ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.to_assignment_name ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          'text-xs font-medium ' + getStatusStyle(r.latest_status?.description)
                        }
                      >
                        {r.latest_status?.description ?? '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fmt(r.created_at)}
                    </TableCell>
                    <TableCell>
                      <StopBadges history={r.history ?? []} />
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary hover:bg-primary/10"
                              onClick={() => onView(r)}
                            >
                              <Icon icon="solar:history-bold-duotone" height={16} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View History</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <Paginator total={allVisible.length} page={page} perPage={PAGE_SIZE} onPageChange={setPage} />
    </>
  );
};

// ─── Tab: Discharged ──────────────────────────────────────────────────────────
const DischargedTab = ({
  referrals,
  incoming,
  onView,
  search,
}: {
  referrals: ReferralType[];
  incoming: ReferralType[];
  onView: (r: ReferralType) => void;
  search: string;
}) => {
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Merge outgoing + incoming discharged, deduplicate by id
  const seen = new Set<string>();
  const discharged = [...referrals, ...incoming]
    .filter((r) => r.latest_status?.description === 'Discharged')
    .filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  const allVisible = discharged
    .filter((r) => {
      const q = search.toLowerCase();
      return (
        !q ||
        (r.patient_name ?? '').toLowerCase().includes(q) ||
        (r.from_assignment_name ?? '').toLowerCase().includes(q) ||
        (r.referral_info?.referring_doctor ?? '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const visible = allVisible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div>
        <div className="rounded-md border border-ld overflow-x-auto scrollbar-none">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Patient</TableHead>
                <TableHead className="font-semibold">From Assignment</TableHead>
                <TableHead className="font-semibold">Referring Doctor</TableHead>
                <TableHead className="font-semibold">Destination</TableHead>
                <TableHead className="font-semibold">Date Created</TableHead>
                <TableHead className="font-semibold">Journey</TableHead>
                <TableHead className="font-semibold text-right">History</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-14 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Icon icon="solar:exit-bold-duotone" height={44} className="opacity-25" />
                      <p className="text-sm">No discharged referrals found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{r.patient_name ?? '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.from_assignment_name ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.referral_info?.referring_doctor ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.to_assignment_name ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fmt(r.created_at)}
                    </TableCell>
                    <TableCell>
                      <StopBadges history={r.history ?? []} />
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-secondary hover:bg-lightsecondary"
                              onClick={() => onView(r)}
                            >
                              <Icon icon="solar:history-bold-duotone" height={16} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View History</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <Paginator total={allVisible.length} page={page} perPage={PAGE_SIZE} onPageChange={setPage} />
    </>
  );
};

// ─── Tab: Deactivated ─────────────────────────────────────────────────────────
const DeactivatedTab = ({
  deactivated,
  onView,
  search,
}: {
  deactivated: ReferralType[];
  onView: (r: ReferralType) => void;
  search: string;
}) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [search]);

  const allVisible = deactivated
    .filter((r) => {
      const q = search.toLowerCase();
      return (
        !q ||
        (r.patient_name ?? '').toLowerCase().includes(q) ||
        (r.from_assignment_name ?? '').toLowerCase().includes(q) ||
        (r.deactivated_by ?? '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const visible = allVisible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div>
        <div className="rounded-md border border-ld overflow-x-auto scrollbar-none">
          <Table className="min-w-[960px]">
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold">Patient</TableHead>
                <TableHead className="font-semibold">From Assignment</TableHead>
                <TableHead className="font-semibold">Destination</TableHead>
                <TableHead className="font-semibold">Last Status</TableHead>
                <TableHead className="font-semibold">Deactivated By</TableHead>
                <TableHead className="font-semibold">Deactivated At</TableHead>
                <TableHead className="font-semibold">Journey</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-14 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Icon
                        icon="solar:archive-minimalistic-bold-duotone"
                        height={44}
                        className="opacity-25"
                      />
                      <p className="text-sm">No deactivated referrals found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                visible.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{r.patient_name ?? '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.from_assignment_name ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.to_assignment_name ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          'text-xs font-medium ' + getStatusStyle(r.latest_status?.description)
                        }
                      >
                        {r.latest_status?.description ?? '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1.5">
                        <Icon
                          icon="solar:user-cross-bold-duotone"
                          height={14}
                          className="text-muted-foreground flex-shrink-0"
                        />
                        {r.deactivated_by ?? '—'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fmt(r.deactivated_at)}
                    </TableCell>
                    <TableCell>
                      <StopBadges history={r.history ?? []} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Icon icon="solar:menu-dots-bold" height={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[160px]">
                          <DropdownMenuItem
                            onClick={() => navigate('/module-2/referrals/detail/' + r.id)}
                          >
                            <Icon
                              icon="solar:eye-linear"
                              height={15}
                              className="mr-2 text-primary"
                            />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onView(r)}>
                            <Icon
                              icon="solar:history-bold-duotone"
                              height={15}
                              className="mr-2 text-muted-foreground"
                            />
                            View History
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <Paginator total={allVisible.length} page={page} perPage={PAGE_SIZE} onPageChange={setPage} />
    </>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const ReferralHistoryPage = () => {
  const { referrals, deactivatedReferrals, incomingReferrals }: ReferralContextType =
    useContext(ReferralContext);
  const [selected, setSelected] = useState<ReferralType | null>(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('history');

  const dischargedCount = [...referrals, ...incomingReferrals]
    .filter((r) => r.latest_status?.description === 'Discharged')
    .reduce((acc, r) => (acc.has(r.id) ? acc : acc.add(r.id)), new Set<string>()).size;

  return (
    <>
      <CardBox>
        <div className="flex flex-col gap-1">
          <h5 className="card-title">Referral History</h5>
          <p className="text-xs text-muted-foreground mt-0.5">
            Complete referral history across facilities
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v);
            setSearch('');
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <TabsList>
              <TabsTrigger value="history" className="flex items-center gap-1.5">
                <Icon icon="solar:history-bold-duotone" height={15} />
                Referral History
                <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0 h-4">
                  {referrals.length + deactivatedReferrals.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="discharged" className="flex items-center gap-1.5">
                <Icon icon="solar:exit-bold-duotone" height={15} />
                Discharged
                <Badge
                  variant="outline"
                  className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-lightsecondary text-secondary border-secondary/20"
                >
                  {dischargedCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="deactivated" className="flex items-center gap-1.5">
                <Icon icon="solar:archive-minimalistic-bold-duotone" height={15} />
                Deactivated
                <Badge
                  variant="outline"
                  className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-lighterror text-error border-error/20"
                >
                  {deactivatedReferrals.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
            <SearchBar value={search} onChange={setSearch} />
          </div>

          <TabsContent value="history">
            <AllHistoryTab
              referrals={referrals}
              deactivated={deactivatedReferrals}
              incoming={incomingReferrals}
              onView={setSelected}
              search={search}
            />
          </TabsContent>

          <TabsContent value="discharged">
            <DischargedTab
              referrals={referrals}
              incoming={incomingReferrals}
              onView={setSelected}
              search={search}
            />
          </TabsContent>

          <TabsContent value="deactivated">
            <DeactivatedTab
              deactivated={deactivatedReferrals}
              onView={setSelected}
              search={search}
            />
          </TabsContent>
        </Tabs>
      </CardBox>

      <HistoryDialog referral={selected} open={!!selected} onClose={() => setSelected(null)} />
    </>
  );
};

export default ReferralHistoryPage;
