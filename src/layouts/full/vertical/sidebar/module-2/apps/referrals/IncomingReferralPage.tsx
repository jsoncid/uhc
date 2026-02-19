'use client';

import { useContext, useState } from 'react';
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

// ─── Stat cards ───────────────────────────────────────────────────────────────
const IncomingStatCards = ({ referrals }: { referrals: ReferralType[] }) => {
  const total = referrals.length;
  const count = (desc: string) =>
    referrals.filter((r) => r.latest_status?.description === desc).length;
  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

  const cards = [
    {
      label: 'Total Incoming',
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
      value: count('Accepted'),
      pct: pct(count('Accepted')),
      icon: 'solar:check-circle-bold-duotone',
      text: 'text-success',
      iconBg: 'bg-lightsuccess',
      bar: 'bg-success',
      accent: 'border-t-success',
    },
    {
      label: 'Arrived',
      value: count('Arrived'),
      pct: pct(count('Arrived')),
      icon: 'solar:hospital-bold-duotone',
      text: 'text-primary',
      iconBg: 'bg-lightprimary',
      bar: 'bg-primary',
      accent: 'border-t-primary',
    },
    {
      label: 'Declined',
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
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card) => (
        <CardBox key={card.label} className={`p-0 overflow-hidden border-t-4 ${card.accent}`}>
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className={`${card.iconBg} rounded-xl p-3`}>
                <Icon icon={card.icon} height={26} className={card.text} />
              </div>
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
            <p className="text-xs text-muted-foreground mt-1.5">{card.pct}% of total</p>
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
  onConfirm: (reason: string) => void;
}) => {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    setReason('');
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
            <span className="font-semibold text-foreground">{referral?.patient_name}</span>. Please
            provide a reason so the referring hospital can redirect accordingly.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5 mt-2">
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
  const pending = referrals.filter((r) => r.latest_status?.description === 'Pending');
  const visible = pending
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

  return (
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
                <TableCell className="text-sm text-muted-foreground">{fmt(r.created_at)}</TableCell>
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
  );
};

// ─── Active (Accepted / In Transit / Arrived) tab ────────────────────────────
const ActiveTab = ({ referrals, search }: { referrals: ReferralType[]; search: string }) => {
  const navigate = useNavigate();
  const { updateIncomingStatus, statuses }: ReferralContextType = useContext(ReferralContext);

  const active = referrals.filter((r) =>
    ['Accepted', 'In Transit', 'Arrived'].includes(r.latest_status?.description ?? ''),
  );
  const visible = active
    .filter((r) => {
      const q = search.toLowerCase();
      return (
        !q ||
        (r.patient_name ?? '').toLowerCase().includes(q) ||
        (r.from_assignment_name ?? '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                        <Badge
                          variant="outline"
                          className={
                            'font-medium cursor-pointer ' +
                            getStatusStyle(r.latest_status?.description)
                          }
                        >
                          {r.latest_status?.description ?? 'No Status'}
                          <Icon icon="solar:alt-arrow-down-bold" height={10} className="ml-1" />
                        </Badge>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {['Accepted', 'In Transit', 'Arrived', 'Discharged'].map((desc) => {
                        const st = statuses.find((s) => s.description === desc);
                        return st ? (
                          <DropdownMenuItem
                            key={st.id}
                            onClick={() => updateIncomingStatus(r.id, st.id)}
                            className="text-sm"
                          >
                            {desc}
                          </DropdownMenuItem>
                        ) : null;
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{fmt(r.created_at)}</TableCell>
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
  );
};

// ─── Declined tab ─────────────────────────────────────────────────────────────
const DeclinedTab = ({ referrals, search }: { referrals: ReferralType[]; search: string }) => {
  const navigate = useNavigate();
  const declined = referrals.filter((r) => r.latest_status?.description === 'Declined');
  const visible = declined
    .filter((r) => {
      const q = search.toLowerCase();
      return (
        !q ||
        (r.patient_name ?? '').toLowerCase().includes(q) ||
        (r.from_assignment_name ?? '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
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
                  <Icon icon="solar:close-circle-bold-duotone" height={44} className="opacity-25" />
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
                    <span className="text-error line-clamp-2">{r.rejection_reason}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{fmt(r.created_at)}</TableCell>
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
      {/* Stat cards */}
      <IncomingStatCards referrals={incomingReferrals} />

      <CardBox>
        <div className="flex flex-col gap-1 mb-4">
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
        onConfirm={(reason) => {
          if (rejectTarget) declineIncomingReferral(rejectTarget.id, reason);
        }}
      />
    </>
  );
};

export default IncomingReferralPage;
