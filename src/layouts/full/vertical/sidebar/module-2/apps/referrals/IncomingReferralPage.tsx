'use client';

import { useContext, useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router';

import { ReferralContext, ReferralContextType } from '../../context/ReferralContext';
import { ReferralType } from '../../types/referral';
import CardBox from 'src/components/shared/CardBox';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Badge } from 'src/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from 'src/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu';
import { Label } from 'src/components/ui/label';
import { Textarea } from 'src/components/ui/textarea';

// ─── Status style map ─────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-lightwarning text-warning',
  Accepted: 'bg-lightsuccess text-success',
  'In Transit': 'bg-lightinfo text-info',
  Discharged: 'bg-lightsecondary text-secondary',
  Declined: 'bg-lighterror text-error',
  Arrived: 'bg-lightprimary text-primary',
};

const getStatusStyle = (d?: string | null) =>
  STATUS_STYLES[d ?? ''] ?? 'bg-lightprimary text-primary';

const fmt = (iso: string | null | undefined, pattern = 'MMM dd, yyyy') =>
  iso ? format(new Date(iso), pattern) : '—';

const PAGE_SIZE = 10;

// ─── Paginator ────────────────────────────────────────────────────────────────────────────
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
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | string)[]>((acc, p, idx, arr) => {
      if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…');
      acc.push(p);
      return acc;
    }, []);
  return (
    <div className="flex items-center justify-between mt-3 px-1">
      <p className="text-xs text-muted-foreground">
        {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <Icon icon="solar:arrow-left-linear" height={13} />
        </Button>
        {pages.map((p, idx) =>
          typeof p === 'string' ? (
            <span key={`e-${idx}`} className="text-xs text-muted-foreground px-0.5">
              {p}
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? 'default' : 'outline'}
              size="icon"
              className="h-7 w-7 text-xs"
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <Icon icon="solar:arrow-right-linear" height={13} />
        </Button>
      </div>
    </div>
  );
};

// ─── Incoming stat cards ─────────────────────────────────────────────────────
const IncomingStatCards = ({ referrals }: { referrals: ReferralType[] }) => {
  const total = referrals.length;
  const count = (desc: string) =>
    referrals.filter((r) => r.latest_status?.description === desc).length;
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

  const cards = [
    {
      label: 'Total Incoming',
      sub: 'All referrals to this facility',
      value: total,
      pct: 100,
      icon: 'solar:inbox-bold-duotone',
      text: 'text-primary',
      iconBg: 'bg-lightprimary',
      bar: 'bg-primary',
      accent: 'border-t-primary',
    },
    {
      label: 'Awaiting Response',
      sub: 'Pending accept or decline',
      value: count('Pending'),
      pct: pct(count('Pending')),
      icon: 'solar:clock-circle-bold-duotone',
      text: 'text-warning',
      iconBg: 'bg-lightwarning',
      bar: 'bg-warning',
      accent: 'border-t-warning',
    },
    {
      label: 'Accepted',
      sub: 'Accepted, awaiting arrival',
      value: count('Accepted'),
      pct: pct(count('Accepted')),
      icon: 'solar:check-circle-bold-duotone',
      text: 'text-success',
      iconBg: 'bg-lightsuccess',
      bar: 'bg-success',
      accent: 'border-t-success',
    },
    {
      label: 'In Transit',
      sub: 'Patient on the way',
      value: count('In Transit'),
      pct: pct(count('In Transit')),
      icon: 'solar:routing-bold-duotone',
      text: 'text-info',
      iconBg: 'bg-lightinfo',
      bar: 'bg-info',
      accent: 'border-t-info',
    },
    {
      label: 'Arrived',
      sub: 'Patient received',
      value: count('Arrived'),
      pct: pct(count('Arrived')),
      icon: 'solar:hospital-bold-duotone',
      text: 'text-secondary',
      iconBg: 'bg-lightsecondary',
      bar: 'bg-secondary',
      accent: 'border-t-secondary',
    },
    {
      label: 'Declined',
      sub: 'Referral not accepted',
      value: count('Declined'),
      pct: pct(count('Declined')),
      icon: 'solar:close-circle-bold-duotone',
      text: 'text-error',
      iconBg: 'bg-lighterror',
      bar: 'bg-error',
      accent: 'border-t-error',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {cards.map((card) => (
        <CardBox key={card.label} className={`p-0 overflow-hidden border-t-4 ${card.accent}`}>
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className={`${card.iconBg} rounded-xl p-3`}>
                <Icon icon={card.icon} height={26} className={card.text} />
              </div>
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${card.iconBg} ${card.text}`}
              >
                {card.pct}%
              </span>
            </div>
            <div className={`text-4xl font-extrabold leading-none mb-1 ${card.text}`}>
              {card.value}
            </div>
            <p className="text-sm font-medium text-muted-foreground mb-3">{card.label}</p>
            <div className="h-1.5 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full ${card.bar} transition-all duration-500`}
                style={{ width: `${card.pct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">{card.sub}</p>
          </div>
        </CardBox>
      ))}
    </div>
  );
};

// ─── Accept dialog ────────────────────────────────────────────────────────────
const AcceptDialog = ({
  open,
  referral,
  onClose,
  onConfirm,
}: {
  open: boolean;
  referral: ReferralType | null;
  onClose: () => void;
  onConfirm: (acceptedBy: string) => void;
}) => {
  const [acceptedBy, setAcceptedBy] = useState('');

  const handleConfirm = () => {
    if (!acceptedBy.trim()) return;
    onConfirm(acceptedBy.trim());
    setAcceptedBy('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-lightsuccess flex items-center justify-center flex-shrink-0">
              <Icon icon="solar:check-circle-bold-duotone" height={22} className="text-success" />
            </div>
            <DialogTitle className="text-base">Accept Referral</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Accept the incoming referral for{' '}
            <span className="font-semibold text-foreground">{referral?.patient_name}</span> from{' '}
            <span className="font-semibold text-foreground">{referral?.from_assignment_name}</span>.
            Please assign a receiving doctor.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="accepted-by" className="text-sm font-medium">
              Receiving Doctor <span className="text-error">*</span>
            </Label>
            <Input
              id="accepted-by"
              placeholder="e.g. Dr. Santos"
              value={acceptedBy}
              onChange={(e) => setAcceptedBy(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-success hover:bg-success/90 text-white"
            onClick={handleConfirm}
            disabled={!acceptedBy.trim()}
          >
            <Icon icon="solar:check-circle-bold-duotone" height={15} className="mr-1.5" />
            Confirm Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Reject dialog ────────────────────────────────────────────────────────────
const RejectDialog = ({
  open,
  referral,
  onClose,
  onConfirm,
}: {
  open: boolean;
  referral: ReferralType | null;
  onClose: () => void;
  onConfirm: (reason: string, redirectHospital?: string) => void;
}) => {
  const [reason, setReason] = useState('');
  const [redirectHospital, setRedirectHospital] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim(), redirectHospital.trim() || undefined);
    setReason('');
    setRedirectHospital('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-lighterror flex items-center justify-center flex-shrink-0">
              <Icon icon="solar:close-circle-bold-duotone" height={22} className="text-error" />
            </div>
            <DialogTitle className="text-base">Decline Referral</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Decline the incoming referral for{' '}
            <span className="font-semibold text-foreground">{referral?.patient_name}</span>. The
            referring hospital will be notified and updated immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="reject-reason" className="text-sm font-medium">
              Reason for Declining <span className="text-error">*</span>
            </Label>
            <Textarea
              id="reject-reason"
              placeholder="e.g. No available ICU bed. No available specialist on duty."
              className="resize-none"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="redirect-hospital" className="text-sm font-medium">
              Redirect to Hospital{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <div className="relative">
              <Icon
                icon="solar:buildings-2-bold-duotone"
                height={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="redirect-hospital"
                className="pl-9"
                placeholder="e.g. Jose Reyes Memorial Medical Center"
                value={redirectHospital}
                onChange={(e) => setRedirectHospital(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Suggest a nearby facility so the referring hospital can re-route the patient.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-error hover:bg-error/90 text-white"
            onClick={handleConfirm}
            disabled={!reason.trim()}
          >
            <Icon icon="solar:close-circle-bold-duotone" height={15} className="mr-1.5" />
            Confirm Decline
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Discharge dialog ─────────────────────────────────────────────────────────
const DischargeDialog = ({
  open,
  referral,
  onClose,
  onConfirm,
}: {
  open: boolean;
  referral: ReferralType | null;
  onClose: () => void;
  onConfirm: (notes: string) => void;
}) => {
  const [notes, setNotes] = useState('');
  const handleConfirm = () => {
    if (!notes.trim()) return;
    onConfirm(notes.trim());
    setNotes('');
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-lightsecondary flex items-center justify-center flex-shrink-0">
              <Icon icon="solar:exit-bold-duotone" height={22} className="text-secondary" />
            </div>
            <DialogTitle className="text-base">Discharge Patient</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Mark <span className="font-semibold text-foreground">{referral?.patient_name}</span> as
            discharged and enter a brief discharge summary.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="discharge-notes" className="text-sm font-medium">
              Discharge Notes / Summary <span className="text-error">*</span>
            </Label>
            <Textarea
              id="discharge-notes"
              placeholder="e.g. Patient stable on discharge. Follow-up in 2 weeks."
              className="resize-none"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNotes('');
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-secondary hover:bg-secondary/90 text-white"
            onClick={handleConfirm}
            disabled={!notes.trim()}
          >
            <Icon icon="solar:exit-bold-duotone" height={15} className="mr-1.5" />
            Confirm Discharge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── Pending tab ─────────────────────────────────────────────────────────────
const PendingTab = ({
  referrals,
  search,
  onAccept,
  onReject,
}: {
  referrals: ReferralType[];
  search: string;
  onAccept: (r: ReferralType) => void;
  onReject: (r: ReferralType) => void;
}) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [search]);
  const pending = referrals.filter((r) => r.latest_status?.description === 'Pending');
  const allVisible = pending
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
      <div className="rounded-md border border-ld overflow-x-auto scrollbar-none">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold">Patient</TableHead>
              <TableHead className="font-semibold">Referring Hospital</TableHead>
              <TableHead className="font-semibold">Referred To (Our Dept.)</TableHead>
              <TableHead className="font-semibold">Referring Doctor</TableHead>
              <TableHead className="font-semibold">Reason</TableHead>
              <TableHead className="font-semibold">Received</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-14 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Icon icon="solar:inbox-bold-duotone" height={44} className="opacity-25" />
                    <p className="text-sm">No pending incoming referrals</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              visible.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell>
                    <span className="font-medium text-sm">{r.patient_name ?? '—'}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Icon
                        icon="solar:buildings-bold-duotone"
                        height={14}
                        className="text-muted-foreground flex-shrink-0"
                      />
                      {r.from_assignment_name ?? '—'}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.to_assignment_name ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.referral_info?.referring_doctor ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm max-w-xs">
                    <span className="line-clamp-2">{r.referral_info?.reason_referral ?? '—'}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {fmt(r.created_at)}
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
                          onClick={() => navigate('/module-2/referrals/incoming/detail/' + r.id)}
                        >
                          <Icon icon="solar:eye-linear" height={15} className="mr-2 text-primary" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAccept(r)}>
                          <Icon
                            icon="solar:check-circle-linear"
                            height={15}
                            className="mr-2 text-success"
                          />
                          Accept
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onReject(r)}
                          className="text-error focus:text-error"
                        >
                          <Icon
                            icon="solar:close-circle-linear"
                            height={15}
                            className="mr-2 text-error"
                          />
                          Decline
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
      <Paginator total={allVisible.length} page={page} perPage={PAGE_SIZE} onPageChange={setPage} />
    </>
  );
};

// ─── Active (Accepted / In Transit / Arrived) tab ────────────────────────────
const ActiveTab = ({ referrals, search }: { referrals: ReferralType[]; search: string }) => {
  const navigate = useNavigate();
  const { updateIncomingStatus, statuses, saveDischargeNotes }: ReferralContextType =
    useContext(ReferralContext);
  const [dischargeTarget, setDischargeTarget] = useState<ReferralType | null>(null);
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Sending facility now owns the 'In Transit' transition.
  // Receiving side only advances: Accepted → Arrived → Discharge.
  const NEXT_STATUS: Record<string, string> = {
    Accepted: 'Arrived',
    Arrived: 'Discharge Patient',
  };

  const handleAdvance = (r: ReferralType) => {
    const next = NEXT_STATUS[r.latest_status?.description ?? ''];
    if (!next) return;
    if (next === 'Discharge Patient') {
      setDischargeTarget(r);
    } else {
      const st = statuses.find((s) => s.description === next);
      if (st) updateIncomingStatus(r.id, st.id);
    }
  };

  const active = referrals.filter((r) =>
    ['Accepted', 'In Transit', 'Arrived'].includes(r.latest_status?.description ?? ''),
  );
  const allVisible = active
    .filter((r) => {
      const q = search.toLowerCase();
      return (
        !q ||
        (r.patient_name ?? '').toLowerCase().includes(q) ||
        (r.from_assignment_name ?? '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const visible = allVisible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="rounded-md border border-ld overflow-x-auto scrollbar-none">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold">Patient</TableHead>
              <TableHead className="font-semibold">Referring Hospital</TableHead>
              <TableHead className="font-semibold">Our Dept.</TableHead>
              <TableHead className="font-semibold">Accepted By</TableHead>
              <TableHead className="font-semibold">Dept. / Service</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-14 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Icon icon="solar:hospital-bold-duotone" height={44} className="opacity-25" />
                    <p className="text-sm">No active incoming patients</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              visible.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell>
                    <span className="font-medium text-sm">{r.patient_name ?? '—'}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.from_assignment_name ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.to_assignment_name ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.accepted_by ? (
                      <div className="flex items-center gap-1.5">
                        <Icon
                          icon="solar:user-check-bold-duotone"
                          height={14}
                          className="text-success flex-shrink-0"
                        />
                        {r.accepted_by}
                      </div>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.to_assignment_name ?? '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={'font-medium ' + getStatusStyle(r.latest_status?.description)}
                      >
                        {r.latest_status?.description ?? 'No Status'}
                      </Badge>
                      {NEXT_STATUS[r.latest_status?.description ?? ''] && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs whitespace-nowrap"
                          onClick={() => handleAdvance(r)}
                        >
                          <Icon icon="solar:arrow-right-bold" height={12} className="mr-1" />
                          {NEXT_STATUS[r.latest_status?.description ?? '']}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {fmt(r.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Icon icon="solar:menu-dots-bold" height={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[150px]">
                        <DropdownMenuItem
                          onClick={() => navigate('/module-2/referrals/incoming/detail/' + r.id)}
                        >
                          <Icon icon="solar:eye-linear" height={15} className="mr-2 text-primary" />
                          View Details
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
      <Paginator total={allVisible.length} page={page} perPage={PAGE_SIZE} onPageChange={setPage} />
      <DischargeDialog
        open={!!dischargeTarget}
        referral={dischargeTarget}
        onClose={() => setDischargeTarget(null)}
        onConfirm={(notes) => {
          if (dischargeTarget) saveDischargeNotes(dischargeTarget.id, notes);
        }}
      />
    </>
  );
};

// ─── Declined tab ─────────────────────────────────────────────────────────────
const DeclinedTab = ({ referrals, search }: { referrals: ReferralType[]; search: string }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [search]);
  const declined = referrals.filter((r) => r.latest_status?.description === 'Declined');
  const allVisible = declined
    .filter((r) => {
      const q = search.toLowerCase();
      return (
        !q ||
        (r.patient_name ?? '').toLowerCase().includes(q) ||
        (r.from_assignment_name ?? '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const visible = allVisible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="rounded-md border border-ld overflow-x-auto scrollbar-none">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold">Patient</TableHead>
              <TableHead className="font-semibold">Referring Hospital</TableHead>
              <TableHead className="font-semibold">Our Dept.</TableHead>
              <TableHead className="font-semibold">Referring Doctor</TableHead>
              <TableHead className="font-semibold">Decline Reason</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-14 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Icon
                      icon="solar:close-circle-bold-duotone"
                      height={44}
                      className="opacity-25"
                    />
                    <p className="text-sm">No declined referrals</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              visible.map((r) => (
                <TableRow key={r.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell>
                    <span className="font-medium text-sm">{r.patient_name ?? '—'}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.from_assignment_name ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.to_assignment_name ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.referral_info?.referring_doctor ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm max-w-xs">
                    {r.rejection_reason ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-error line-clamp-2">{r.rejection_reason}</span>
                        {r.redirect_to && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Icon icon="solar:buildings-2-bold-duotone" height={11} />
                            {r.redirect_to}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {fmt(r.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-primary hover:bg-primary/10"
                      onClick={() => navigate('/module-2/referrals/incoming/detail/' + r.id)}
                    >
                      <Icon icon="solar:eye-linear" height={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Paginator total={allVisible.length} page={page} perPage={PAGE_SIZE} onPageChange={setPage} />
    </>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const IncomingReferralPage = () => {
  const {
    incomingReferrals,
    acceptIncomingReferral,
    declineIncomingReferral,
  }: ReferralContextType = useContext(ReferralContext);

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [acceptTarget, setAcceptTarget] = useState<ReferralType | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ReferralType | null>(null);

  const pendingCount = incomingReferrals.filter(
    (r) => r.latest_status?.description === 'Pending',
  ).length;
  const activeCount = incomingReferrals.filter((r) =>
    ['Accepted', 'In Transit', 'Arrived'].includes(r.latest_status?.description ?? ''),
  ).length;
  const declinedCount = incomingReferrals.filter(
    (r) => r.latest_status?.description === 'Declined',
  ).length;

  return (
    <>
      {/* Incoming-only stat cards */}
      <IncomingStatCards referrals={incomingReferrals} />

      <CardBox>
        <div className="flex flex-col gap-1">
          <h5 className="card-title">Incoming Referrals</h5>
          <p className="text-xs text-muted-foreground">
            Referrals from other hospitals directed to your facility
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
              <TabsTrigger value="pending" className="flex items-center gap-1.5">
                <Icon icon="solar:clock-circle-bold-duotone" height={15} />
                Awaiting Response
                {pendingCount > 0 && (
                  <Badge
                    variant="outline"
                    className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-lightwarning text-warning border-warning/20"
                  >
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center gap-1.5">
                <Icon icon="solar:hospital-bold-duotone" height={15} />
                Active Patients
                {activeCount > 0 && (
                  <Badge
                    variant="outline"
                    className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-lightsuccess text-success border-success/20"
                  >
                    {activeCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="declined" className="flex items-center gap-1.5">
                <Icon icon="solar:close-circle-bold-duotone" height={15} />
                Declined
                {declinedCount > 0 && (
                  <Badge
                    variant="outline"
                    className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-lighterror text-error border-error/20"
                  >
                    {declinedCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Search */}
            <div className="relative sm:w-60 w-full">
              <Icon
                icon="tabler:search"
                height={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="text"
                className="pl-9 h-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient, hospital..."
              />
            </div>
          </div>

          <TabsContent value="pending">
            <PendingTab
              referrals={incomingReferrals}
              search={search}
              onAccept={setAcceptTarget}
              onReject={setRejectTarget}
            />
          </TabsContent>

          <TabsContent value="active">
            <ActiveTab referrals={incomingReferrals} search={search} />
          </TabsContent>

          <TabsContent value="declined">
            <DeclinedTab referrals={incomingReferrals} search={search} />
          </TabsContent>
        </Tabs>
      </CardBox>

      {/* Accept Dialog */}
      <AcceptDialog
        open={!!acceptTarget}
        referral={acceptTarget}
        onClose={() => setAcceptTarget(null)}
        onConfirm={(acceptedBy) => {
          if (acceptTarget) acceptIncomingReferral(acceptTarget.id, acceptedBy);
        }}
      />

      {/* Reject Dialog */}
      <RejectDialog
        open={!!rejectTarget}
        referral={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={(reason, redirectHospital) => {
          if (rejectTarget) declineIncomingReferral(rejectTarget.id, reason, redirectHospital);
        }}
      />
    </>
  );
};

export default IncomingReferralPage;
