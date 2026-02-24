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
import { Separator } from 'src/components/ui/separator';
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
import ReferralPrintDocument from './ReferralPrintDocument';
import EditClinicalInfoPanel from './EditClinicalInfoPanel';

// ─── Status style map ─────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-lightwarning text-warning',
  Seen: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
  Accepted: 'bg-lightsuccess text-success',
  'In Transit': 'bg-lightinfo text-info',
  Arrived: 'bg-lightprimary text-primary',
  Admitted: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  Discharged: 'bg-lightsecondary text-secondary',
  Declined: 'bg-lighterror text-error',
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

// ─── Incoming stat cards (exported for standalone use) ────────────────────────
export const IncomingStatCards = ({ referrals }: { referrals: ReferralType[] }) => {
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
      text: 'text-primary',
      iconBg: 'bg-lightprimary',
      bar: 'bg-primary',
      accent: 'border-t-primary',
    },
    {
      label: 'Admitted',
      sub: 'Admitted to ward/dept',
      value: count('Admitted'),
      pct: pct(count('Admitted')),
      icon: 'solar:bed-bold-duotone',
      text: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      bar: 'bg-purple-500',
      accent: 'border-t-purple-500',
    },
    {
      label: 'Discharged',
      sub: 'Patient discharged',
      value: count('Discharged'),
      pct: pct(count('Discharged')),
      icon: 'solar:exit-bold-duotone',
      text: 'text-slate-500',
      iconBg: 'bg-slate-100 dark:bg-slate-800',
      bar: 'bg-slate-400',
      accent: 'border-t-slate-400',
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
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
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
  onPrint,
}: {
  referrals: ReferralType[];
  search: string;
  onPrint: (r: ReferralType) => void;
}) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [search]);
  const pending = referrals.filter((r) =>
    ['Pending', 'Seen'].includes(r.latest_status?.description ?? ''),
  );
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
                <TableCell colSpan={7} className="text-center h-[530px] text-muted-foreground">
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
                        <DropdownMenuItem onClick={() => onPrint(r)}>
                          <Icon
                            icon="solar:printer-minimalistic-bold-duotone"
                            height={15}
                            className="mr-2 text-muted-foreground"
                          />
                          Print Referral
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
            {/* Filler rows — keep table height fixed at PAGE_SIZE rows */}
            {visible.length > 0 &&
              Array.from({ length: Math.max(0, PAGE_SIZE - visible.length) }).map((_, i) => (
                <TableRow key={`filler-${i}`} className="pointer-events-none">
                  <TableCell colSpan={7} className="h-[53px]" />
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
      <Paginator total={allVisible.length} page={page} perPage={PAGE_SIZE} onPageChange={setPage} />
    </>
  );
};

// ─── Active (Accepted / In Transit / Arrived) tab ────────────────────────────
const ActiveTab = ({
  referrals,
  search,
  onPrint,
}: {
  referrals: ReferralType[];
  search: string;
  onPrint: (r: ReferralType) => void;
}) => {
  const navigate = useNavigate();
  const {
    updateIncomingStatus,
    statuses,
    saveDischargeNotes,
    updateReferralInfo,
    addDiagnostic,
    deleteDiagnostic,
    updateDiagnosticAttachment,
    addVaccination,
    deleteVaccination,
    updateVaccinationAttachment,
    incomingReferrals,
  }: ReferralContextType = useContext(ReferralContext);
  const [dischargeTarget, setDischargeTarget] = useState<ReferralType | null>(null);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const editTarget = editTargetId
    ? (incomingReferrals.find((r) => r.id === editTargetId) ?? null)
    : null;
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Sending facility marks 'In Transit'; receiving side advances the patient.
  // Receiving advances: Accepted → Arrived, In Transit → Arrived, Arrived → Admitted, Admitted → Discharge.
  const NEXT_STATUS: Record<string, string> = {
    Accepted: 'Arrived',
    'In Transit': 'Arrived',
    Arrived: 'Admitted',
    Admitted: 'Discharge Patient',
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
    ['Accepted', 'In Transit', 'Arrived', 'Admitted'].includes(r.latest_status?.description ?? ''),
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
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-[530px] text-muted-foreground">
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
                      <DropdownMenuContent align="end" className="min-w-[160px]">
                        <DropdownMenuItem
                          onClick={() => navigate('/module-2/referrals/incoming/detail/' + r.id)}
                        >
                          <Icon icon="solar:eye-linear" height={15} className="mr-2 text-primary" />
                          View Details
                        </DropdownMenuItem>
                        {r.latest_status?.description === 'Admitted' && (
                          <DropdownMenuItem onClick={() => setEditTargetId(r.id)}>
                            <Icon
                              icon="solar:pen-linear"
                              height={15}
                              className="mr-2 text-muted-foreground"
                            />
                            Edit Clinical Info
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onPrint(r)}>
                          <Icon
                            icon="solar:printer-minimalistic-bold-duotone"
                            height={15}
                            className="mr-2 text-muted-foreground"
                          />
                          Print Referral
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
            {/* Filler rows — keep table height fixed at PAGE_SIZE rows */}
            {visible.length > 0 &&
              Array.from({ length: Math.max(0, PAGE_SIZE - visible.length) }).map((_, i) => (
                <TableRow key={`filler-${i}`} className="pointer-events-none">
                  <TableCell colSpan={8} className="h-[53px]" />
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
      <Paginator total={allVisible.length} page={page} perPage={PAGE_SIZE} onPageChange={setPage} />
      <EditClinicalInfoPanel
        open={!!editTarget}
        referral={editTarget}
        onClose={() => setEditTargetId(null)}
        onConfirm={(updated) => {
          if (editTargetId) updateReferralInfo(editTargetId, updated);
        }}
        addDiag={(d) => editTargetId && addDiagnostic(editTargetId, d)}
        deleteDiag={(diagId) => editTargetId && deleteDiagnostic(diagId, editTargetId)}
        updateDiagAttachment={(diagId, atts) =>
          editTargetId && updateDiagnosticAttachment(diagId, editTargetId, atts)
        }
        addVac={(v) => editTargetId && addVaccination(editTargetId, v)}
        deleteVac={(vacId) => editTargetId && deleteVaccination(vacId, editTargetId)}
        updateVacAttachment={(vacId, atts) =>
          editTargetId && updateVaccinationAttachment(vacId, editTargetId, atts)
        }
      />
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
const DeclinedTab = ({
  referrals,
  search,
  onPrint,
}: {
  referrals: ReferralType[];
  search: string;
  onPrint: (r: ReferralType) => void;
}) => {
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
                <TableCell colSpan={7} className="text-center h-[530px] text-muted-foreground">
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
                        <DropdownMenuItem onClick={() => onPrint(r)}>
                          <Icon
                            icon="solar:printer-minimalistic-bold-duotone"
                            height={15}
                            className="mr-2 text-muted-foreground"
                          />
                          Print Referral
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
            {/* Filler rows — keep table height fixed at PAGE_SIZE rows */}
            {visible.length > 0 &&
              Array.from({ length: Math.max(0, PAGE_SIZE - visible.length) }).map((_, i) => (
                <TableRow key={`filler-${i}`} className="pointer-events-none">
                  <TableCell colSpan={7} className="h-[53px]" />
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
      <Paginator total={allVisible.length} page={page} perPage={PAGE_SIZE} onPageChange={setPage} />
    </>
  );
};

// ─── Discharged tab ───────────────────────────────────────────────────────────
const DischargedTab = ({
  referrals,
  search,
  onPrint,
}: {
  referrals: ReferralType[];
  search: string;
  onPrint: (r: ReferralType) => void;
}) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [search]);

  const discharged = referrals.filter((r) => r.latest_status?.description === 'Discharged');
  const allVisible = discharged
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
              <TableHead className="font-semibold">Discharge Summary</TableHead>
              <TableHead className="font-semibold">Date</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-[530px] text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Icon icon="solar:logout-3-bold-duotone" height={44} className="opacity-25" />
                    <p className="text-sm">No discharged patients</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              visible.map((r) => {
                const dischargeEntry = (r.history ?? []).find(
                  (h) => h.status_description === 'Discharged',
                );
                return (
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
                      {dischargeEntry?.details ? (
                        <span className="text-secondary line-clamp-2">
                          {dischargeEntry.details}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
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
                            <Icon
                              icon="solar:eye-linear"
                              height={15}
                              className="mr-2 text-primary"
                            />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onPrint(r)}>
                            <Icon
                              icon="solar:printer-minimalistic-bold-duotone"
                              height={15}
                              className="mr-2 text-muted-foreground"
                            />
                            Print Referral
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
            {/* Filler rows — keep table height fixed at PAGE_SIZE rows */}
            {visible.length > 0 &&
              Array.from({ length: Math.max(0, PAGE_SIZE - visible.length) }).map((_, i) => (
                <TableRow key={`filler-${i}`} className="pointer-events-none">
                  <TableCell colSpan={7} className="h-[53px]" />
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
      <Paginator total={allVisible.length} page={page} perPage={PAGE_SIZE} onPageChange={setPage} />
    </>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const IncomingReferralPage = () => {
  const { incomingReferrals }: ReferralContextType = useContext(ReferralContext);

  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [printTarget, setPrintTarget] = useState<ReferralType | null>(null);

  // Apply date filter before passing referrals to each tab
  const dateFilteredReferrals = incomingReferrals.filter(
    (r) => !dateFrom || new Date(r.created_at).toISOString().slice(0, 10) === dateFrom,
  );

  const pendingCount = dateFilteredReferrals.filter((r) =>
    ['Pending', 'Seen'].includes(r.latest_status?.description ?? ''),
  ).length;
  const activeCount = dateFilteredReferrals.filter((r) =>
    ['Accepted', 'In Transit', 'Arrived', 'Admitted'].includes(r.latest_status?.description ?? ''),
  ).length;
  const declinedCount = dateFilteredReferrals.filter(
    (r) => r.latest_status?.description === 'Declined',
  ).length;
  const dischargedCount = dateFilteredReferrals.filter(
    (r) => r.latest_status?.description === 'Discharged',
  ).length;

  return (
    <>
      <CardBox>
        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h5 className="text-lg font-semibold">Received Referrals</h5>
            <p className="text-xs text-muted-foreground mt-0.5">
              Referrals from other hospitals directed to your facility
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        {/* ── Filters ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: 'pending', label: 'Awaiting Response', count: pendingCount },
              { key: 'active', label: 'Active Patients', count: activeCount },
              { key: 'declined', label: 'Declined', count: declinedCount },
              { key: 'discharged', label: 'Discharged', count: dischargedCount },
            ].map((f) => (
              <Button
                key={f.key}
                size="sm"
                variant={activeTab === f.key ? 'default' : 'outline'}
                className="h-7 text-xs px-3"
                onClick={() => {
                  setActiveTab(f.key);
                  setSearch('');
                }}
              >
                {f.label}
                {f.count > 0 && (
                  <Badge variant="outline" className="ml-1.5 text-[10px] px-1.5 py-0 h-4">
                    {f.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative sm:w-56 w-full">
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
            <div className="relative">
              <Input
                type="date"
                className={`h-9 text-sm ${dateFrom ? 'w-44 pr-7' : 'w-36'}`}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              {dateFrom && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setDateFrom('')}
                >
                  <Icon icon="solar:close-circle-linear" height={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        {activeTab === 'pending' && (
          <PendingTab referrals={dateFilteredReferrals} search={search} onPrint={setPrintTarget} />
        )}
        {activeTab === 'active' && (
          <ActiveTab referrals={dateFilteredReferrals} search={search} onPrint={setPrintTarget} />
        )}
        {activeTab === 'declined' && (
          <DeclinedTab referrals={dateFilteredReferrals} search={search} onPrint={setPrintTarget} />
        )}
        {activeTab === 'discharged' && (
          <DischargedTab
            referrals={dateFilteredReferrals}
            search={search}
            onPrint={setPrintTarget}
          />
        )}
      </CardBox>

      {/* Print Document */}
      {printTarget && (
        <ReferralPrintDocument referral={printTarget} onClose={() => setPrintTarget(null)} />
      )}
    </>
  );
};

export default IncomingReferralPage;
