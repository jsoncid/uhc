'use client';

import { useContext, useEffect, useState } from 'react';
import React from 'react';
import { format } from 'date-fns';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router';
import { ReferralContext, ReferralContextType } from '../../context/ReferralContext';
import { ReferralType } from '../../types/referral';
import EditClinicalInfoPanel from './EditClinicalInfoPanel';
import CardBox from 'src/components/shared/CardBox';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'src/components/ui/table';
import { Badge } from 'src/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from 'src/components/ui/dialog';
import ReferralPrintDocument from './ReferralPrintDocument';
import { Label } from 'src/components/ui/label';
import { Separator } from 'src/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select';
import { assignmentService } from '@/services/assignmentService';
import { useAuthStore } from '@/stores/useAuthStore';

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

// ─── Re-Refer Dialog ─────────────────────────────────────────────────────────────────────
const ReReferDialog = ({
  open,
  referral,
  onClose,
  onConfirm,
}: {
  open: boolean;
  referral: ReferralType | null;
  onClose: () => void;
  onConfirm: (selected: { id: string; description: string }) => void;
}) => {
  const [hospital, setHospital] = useState('');
  const [assignments, setAssignments] = useState<{ id: string; description: string }[]>([]);

  useEffect(() => {
    if (open) {
      assignmentService.getAllAssignments().then((data) => {
        setAssignments(
          data
            .filter((a) => a.description)
            .map((a) => ({ id: a.id, description: a.description! }))
            .sort((a, b) => a.description.localeCompare(b.description)),
        );
      });
    } else {
      setHospital('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-lightprimary flex items-center justify-center flex-shrink-0">
              <Icon icon="solar:refresh-circle-bold-duotone" height={22} className="text-primary" />
            </div>
            <DialogTitle className="text-base">Re-refer Patient</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Create a new referral for{' '}
            <span className="font-semibold text-foreground">{referral?.patient_name}</span> to a
            different hospital. Clinical information will be carried over.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Previous Hospital (Declined)</Label>
            <div className="h-9 px-3 flex items-center rounded-md bg-muted/50 border border-border text-sm text-muted-foreground">
              {referral?.to_assignment_name ?? '—'}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">
              New Destination Hospital <span className="text-error">*</span>
            </Label>
            <Select value={hospital} onValueChange={setHospital}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select a facility..." />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((a) => (
                  <SelectItem key={a.id} value={a.description}>
                    <div className="flex items-center gap-2">
                      <Icon
                        icon="solar:buildings-2-bold-duotone"
                        height={14}
                        className="text-muted-foreground flex-shrink-0"
                      />
                      {a.description}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setHospital('');
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => {
              if (hospital) {
                const selected = assignments.find((a) => a.description === hospital);
                if (selected) {
                  onConfirm(selected);
                  setHospital('');
                  onClose();
                }
              }
            }}
            disabled={!hospital}
          >
            <Icon icon="solar:refresh-circle-bold-duotone" height={15} className="mr-1.5" />
            Create Re-referral
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ReferralListing = () => {
  const {
    referrals,
    addReferral,
    updateReferralInfo,
    addOutgoingDiagnostic,
    deleteOutgoingDiagnostic,
    updateOutgoingDiagnosticAttachment,
    addOutgoingVaccination,
    deleteOutgoingVaccination,
    updateOutgoingVaccinationAttachment,
    searchReferrals,
    referralSearch,
    filter,
    setFilter,
    deactivateReferral,
  }: ReferralContextType = useContext(ReferralContext);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const currentUserName =
    user?.user_metadata?.full_name ?? user?.user_metadata?.username ?? user?.email ?? 'Unknown';
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmName, setConfirmName] = useState<string>('');
  const [printReferral, setPrintReferral] = useState<ReferralType | null>(null);
  const [reReferTarget, setReReferTarget] = useState<ReferralType | null>(null);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const editTarget = editTargetId ? (referrals.find((r) => r.id === editTargetId) ?? null) : null;
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState('');
  const [sortKey, setSortKey] = useState<'patient_name' | 'status' | 'created_at'>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  React.useEffect(() => {
    setPage(1);
  }, [referralSearch, filter, dateFrom]);

  const handleDeactivateClick = (id: string, name: string) => {
    setConfirmId(id);
    setConfirmName(name);
  };

  const handleConfirmDeactivate = () => {
    if (confirmId) {
      deactivateReferral(confirmId, currentUserName);
      setConfirmId(null);
    }
  };

  const allVisible = referrals
    .filter((r) => {
      const search = referralSearch.toLowerCase();
      const matchSearch =
        !search ||
        (r.patient_name ?? '').toLowerCase().includes(search) ||
        (r.from_assignment_name ?? '').toLowerCase().includes(search) ||
        (r.referral_info?.referring_doctor ?? '').toLowerCase().includes(search);
      const matchFilter = filter === 'all' || (r.latest_status?.description ?? '') === filter;
      const matchDate = !dateFrom || new Date(r.created_at).toISOString().slice(0, 10) === dateFrom;
      return matchSearch && matchFilter && matchDate;
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'patient_name')
        return dir * (a.patient_name ?? '').localeCompare(b.patient_name ?? '');
      if (sortKey === 'status')
        return (
          dir *
          (a.latest_status?.description ?? '').localeCompare(b.latest_status?.description ?? '')
        );
      return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    });

  const visible = allVisible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const getStatusStyle = (d?: string | null) =>
    STATUS_STYLES[d ?? ''] ?? 'bg-lightprimary text-primary';

  return (
    <CardBox>
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h5 className="text-lg font-semibold">Sent Referrals</h5>
          <p className="text-xs text-muted-foreground mt-0.5">
            Referrals sent from your facility to other hospitals
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="whitespace-nowrap">
              <Icon icon="solar:add-circle-bold-duotone" height={17} className="mr-1.5" />
              New Referral
              <Icon icon="solar:alt-arrow-down-bold" height={14} className="ml-1.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[190px]">
            <DropdownMenuItem onClick={() => navigate('/module-2/referrals/create')}>
              <Icon
                icon="solar:document-medicine-bold-duotone"
                height={16}
                className="mr-2 text-primary"
              />
              Regular Referral
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/module-2/referrals/create-obgyne')}>
              <Icon
                icon="solar:heart-angle-bold-duotone"
                height={16}
                className="mr-2 text-pink-500"
              />
              OB/GYNE Referral
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator className="my-4" />

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            'all',
            'Pending',
            'Seen',
            'Accepted',
            'In Transit',
            'Arrived',
            'Admitted',
            'Discharged',
            'Declined',
          ].map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              className="h-7 text-xs px-3"
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
            >
              {f === 'all' ? 'All' : f}
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
              onChange={(e) => {
                searchReferrals(e.target.value);
                setPage(1);
              }}
              placeholder="Search patient, doctor..."
            />
          </div>
          <div className="relative">
            <Input
              type="date"
              className={`h-9 text-sm ${dateFrom ? 'w-44 pr-7' : 'w-36'}`}
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
            />
            {dateFrom && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setDateFrom('');
                  setPage(1);
                }}
              >
                <Icon icon="solar:close-circle-linear" height={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-md border border-ld overflow-x-auto scrollbar-none">
        <Table className="min-w-[960px]">
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead
                className="font-semibold cursor-pointer select-none"
                onClick={() => toggleSort('patient_name')}
              >
                <span className="flex items-center">
                  Patient
                  <Icon
                    icon={
                      sortKey === 'patient_name'
                        ? sortDir === 'asc'
                          ? 'solar:sort-from-bottom-to-top-bold'
                          : 'solar:sort-from-top-to-bottom-bold'
                        : 'solar:sort-bold'
                    }
                    height={13}
                    className={`ml-1 ${sortKey === 'patient_name' ? 'text-primary' : 'opacity-30'}`}
                  />
                </span>
              </TableHead>
              <TableHead className="font-semibold">From Assignment</TableHead>
              <TableHead className="font-semibold">Referred To</TableHead>
              <TableHead className="font-semibold">Referring Doctor</TableHead>
              <TableHead className="font-semibold">Reason for Referral</TableHead>
              <TableHead
                className="font-semibold cursor-pointer select-none"
                onClick={() => toggleSort('status')}
              >
                <span className="flex items-center">
                  Status
                  <Icon
                    icon={
                      sortKey === 'status'
                        ? sortDir === 'asc'
                          ? 'solar:sort-from-bottom-to-top-bold'
                          : 'solar:sort-from-top-to-bottom-bold'
                        : 'solar:sort-bold'
                    }
                    height={13}
                    className={`ml-1 ${sortKey === 'status' ? 'text-primary' : 'opacity-30'}`}
                  />
                </span>
              </TableHead>
              <TableHead
                className="font-semibold cursor-pointer select-none"
                onClick={() => toggleSort('created_at')}
              >
                <span className="flex items-center">
                  Date Created
                  <Icon
                    icon={
                      sortKey === 'created_at'
                        ? sortDir === 'asc'
                          ? 'solar:sort-from-bottom-to-top-bold'
                          : 'solar:sort-from-top-to-bottom-bold'
                        : 'solar:sort-bold'
                    }
                    height={13}
                    className={`ml-1 ${sortKey === 'created_at' ? 'text-primary' : 'opacity-30'}`}
                  />
                </span>
              </TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-[530px] text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Icon
                      icon="solar:clipboard-remove-bold-duotone"
                      height={40}
                      className="opacity-30"
                    />
                    <p className="text-sm">No referrals found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              visible.map((referral: ReferralType) => (
                <TableRow key={referral.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{referral.patient_name ?? '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {referral.from_assignment_name ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {referral.to_assignment_name ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {referral.referral_info?.referring_doctor ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm max-w-xs">
                    <span className="line-clamp-2">
                      {referral.referral_info?.reason_referral ?? '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        'font-medium ' + getStatusStyle(referral.latest_status?.description)
                      }
                    >
                      {referral.latest_status?.description ?? 'No Status'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(referral.created_at), 'MMM dd, yyyy')}
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
                          onClick={() => navigate('/module-2/referrals/detail/' + referral.id)}
                        >
                          <Icon icon="solar:eye-linear" height={15} className="mr-2 text-primary" />
                          View Details
                        </DropdownMenuItem>{' '}
                        {referral.latest_status?.description === 'Declined' && (
                          <DropdownMenuItem onClick={() => setReReferTarget(referral)}>
                            <Icon
                              icon="solar:refresh-circle-bold-duotone"
                              height={15}
                              className="mr-2 text-primary"
                            />
                            Re-refer Patient
                          </DropdownMenuItem>
                        )}
                        {['Pending', 'Seen', 'In Transit'].includes(
                          referral.latest_status?.description ?? '',
                        ) && (
                          <DropdownMenuItem onClick={() => setEditTargetId(referral.id)}>
                            <Icon
                              icon="solar:pen-linear"
                              height={15}
                              className="mr-2 text-muted-foreground"
                            />
                            Edit Clinical Info
                          </DropdownMenuItem>
                        )}{' '}
                        <DropdownMenuItem onClick={() => setPrintReferral(referral)}>
                          <Icon
                            icon="solar:printer-minimalistic-bold-duotone"
                            height={15}
                            className="mr-2 text-muted-foreground"
                          />
                          Print Referral
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-error focus:text-error"
                          onClick={() =>
                            handleDeactivateClick(
                              referral.id,
                              referral.patient_name ?? 'this referral',
                            )
                          }
                        >
                          <Icon
                            icon="solar:trash-bin-minimalistic-linear"
                            height={15}
                            className="mr-2"
                          />
                          Deactivate
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
      {/* Pagination */}
      <Paginator total={allVisible.length} page={page} perPage={PAGE_SIZE} onPageChange={setPage} />

      {/* Print document (hidden, triggers window.print()) */}
      {printReferral && (
        <ReferralPrintDocument referral={printReferral} onClose={() => setPrintReferral(null)} />
      )}

      {/* Re-Refer Dialog */}
      <ReReferDialog
        open={!!reReferTarget}
        referral={reReferTarget}
        onClose={() => setReReferTarget(null)}
        onConfirm={(selected) => {
          if (!reReferTarget) return;
          const newId = `ref-${Date.now()}`;
          addReferral({
            id: newId,
            created_at: new Date().toISOString(),
            status: true,
            patient_profile: reReferTarget.patient_profile,
            from_assignment: reReferTarget.from_assignment,
            to_assignment: selected.id,
            patient_name: reReferTarget.patient_name,
            from_assignment_name: reReferTarget.from_assignment_name,
            to_assignment_name: selected.description,
            // Strip the old referral_info.id so Supabase generates a new one,
            // and clear diagnostics/vaccinations to avoid UUID conflicts
            referral_info: reReferTarget.referral_info
              ? {
                  ...reReferTarget.referral_info,
                  id: '',
                  diagnostics: [],
                  vaccinations: [],
                }
              : undefined,
          });
        }}
      />

      {/* Edit Clinical Info Panel */}
      <EditClinicalInfoPanel
        open={!!editTarget}
        referral={editTarget}
        onClose={() => setEditTargetId(null)}
        onConfirm={(updated) => {
          if (editTargetId) updateReferralInfo(editTargetId, updated);
        }}
        addDiag={(d) => editTargetId && addOutgoingDiagnostic(editTargetId, d)}
        deleteDiag={(diagId) => editTargetId && deleteOutgoingDiagnostic(diagId, editTargetId)}
        updateDiagAttachment={(diagId, atts) =>
          editTargetId && updateOutgoingDiagnosticAttachment(diagId, editTargetId, atts)
        }
        addVac={(v) => editTargetId && addOutgoingVaccination(editTargetId, v)}
        deleteVac={(vacId) => editTargetId && deleteOutgoingVaccination(vacId, editTargetId)}
        updateVacAttachment={(vacId, atts) =>
          editTargetId && updateOutgoingVaccinationAttachment(vacId, editTargetId, atts)
        }
      />

      {/* Deactivate confirmation dialog */}
      <Dialog
        open={!!confirmId}
        onOpenChange={(open) => {
          if (!open) setConfirmId(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-lighterror flex items-center justify-center flex-shrink-0">
                <Icon
                  icon="solar:trash-bin-minimalistic-bold-duotone"
                  height={22}
                  className="text-error"
                />
              </div>
              <DialogTitle className="text-base">Deactivate Referral</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to deactivate the referral for{' '}
              <span className="font-semibold text-foreground">{confirmName}</span>? This will mark
              the referral as inactive and remove it from the active list. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 px-1 py-2 rounded-lg bg-muted/50">
            <Icon
              icon="solar:user-bold-duotone"
              height={16}
              className="text-muted-foreground flex-shrink-0"
            />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Deactivating as</span>
              <span className="text-sm font-medium">{currentUserName}</span>
            </div>
          </div>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmId(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-error hover:bg-error/90 text-white"
              onClick={handleConfirmDeactivate}
            >
              <Icon icon="solar:trash-bin-minimalistic-linear" height={15} className="mr-1.5" />
              Deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardBox>
  );
};

export default ReferralListing;
