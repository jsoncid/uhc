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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from 'src/components/ui/tooltip';
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

const STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-lightwarning text-warning',
  Accepted: 'bg-lightsuccess text-success',
  'In Transit': 'bg-lightinfo text-info',
  Completed: 'bg-lightsecondary text-secondary',
  Rejected: 'bg-lighterror text-error',
};

const ReferralListing = () => {
  const {
    referrals,
    statuses,
    searchReferrals,
    referralSearch,
    filter,
    updateReferralStatus,
    deactivateReferral,
  }: ReferralContextType = useContext(ReferralContext);
  const navigate = useNavigate();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmName, setConfirmName] = useState<string>('');

  const handleDeactivateClick = (id: string, name: string) => {
    setConfirmId(id);
    setConfirmName(name);
  };

  const handleConfirmDeactivate = () => {
    if (confirmId) {
      deactivateReferral(confirmId);
      setConfirmId(null);
    }
  };

  const visible = referrals.filter((r) => {
    const search = referralSearch.toLowerCase();
    const matchSearch =
      !search ||
      (r.patient_name ?? '').toLowerCase().includes(search) ||
      (r.from_assignment_name ?? '').toLowerCase().includes(search) ||
      (r.referral_info?.referring_doctor ?? '').toLowerCase().includes(search);
    const matchFilter = filter === 'all' || (r.latest_status?.description ?? '') === filter;
    return matchSearch && matchFilter;
  });

  const getStatusStyle = (d?: string | null) =>
    STATUS_STYLES[d ?? ''] ?? 'bg-lightprimary text-primary';

  return (
    <CardBox>
      <div className="flex flex-wrap justify-between items-center gap-4 ">
        <div>
          <h5 className="card-title">Referral List</h5>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative sm:w-60 w-full">
            <Icon
              icon="tabler:search"
              height={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="text"
              className="pl-9 h-9 text-sm"
              onChange={(e) => searchReferrals(e.target.value)}
              placeholder="Search patient, doctor..."
            />
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
      </div>
      <div className="rounded-md border border-ld overflow-x-auto scrollbar-none">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold">Patient</TableHead>
              <TableHead className="font-semibold">From Assignment</TableHead>
              <TableHead className="font-semibold">Referring Doctor</TableHead>
              <TableHead className="font-semibold">Reason for Referral</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Date Created</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
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
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon icon="solar:user-bold-duotone" height={16} className="text-primary" />
                      </div>
                      <span className="font-medium text-sm">{referral.patient_name ?? '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {referral.from_assignment_name ?? '—'}
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-auto hover:bg-transparent"
                        >
                          <Badge
                            variant="outline"
                            className={
                              'font-medium cursor-pointer ' +
                              getStatusStyle(referral.latest_status?.description)
                            }
                          >
                            {referral.latest_status?.description ?? 'No Status'}
                            <Icon icon="solar:alt-arrow-down-bold" height={10} className="ml-1" />
                          </Badge>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {statuses.map((s) => (
                          <DropdownMenuItem
                            key={s.id}
                            onClick={() => updateReferralStatus(referral.id, s.id)}
                            className="text-sm"
                          >
                            {s.description}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(referral.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <TooltipProvider>
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-primary hover:bg-primary/10"
                              onClick={() => navigate('/module-2/referrals/detail/' + referral.id)}
                            >
                              <Icon icon="solar:eye-linear" height={16} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View Details</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-error hover:bg-error/10"
                              onClick={() =>
                                handleDeactivateClick(
                                  referral.id,
                                  referral.patient_name ?? 'this referral',
                                )
                              }
                            >
                              <Icon icon="solar:trash-bin-minimalistic-linear" height={16} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Deactivate</TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
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
