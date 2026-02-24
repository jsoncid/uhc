'use client';

import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import React from 'react';
import { format } from 'date-fns';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router';
import { ReferralContext, ReferralContextType } from '../../context/ReferralContext';
import { ReferralType, ReferralInfo } from '../../types/referral';
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
import { Textarea } from 'src/components/ui/textarea';
import { Separator } from 'src/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from 'src/components/ui/sheet';
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

// ─── Edit Referral Info Panel ───────────────────────────────────────────────────────────
const EditReferralPanel = ({
  open,
  referral,
  onClose,
  onConfirm,
}: {
  open: boolean;
  referral: ReferralType | null;
  onClose: () => void;
  onConfirm: (updated: Partial<ReferralInfo>) => void;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showObGyne, setShowObGyne] = useState(false);

  const info = referral?.referral_info;

  const [form, setForm] = useState<Partial<ReferralInfo>>({
    reason_referral: '',
    chief_complaints: '',
    history_present_illness: '',
    pe: '',
    blood_pressure: '',
    temperature: '',
    heart_rate: '',
    respiratory_rate: '',
    o2_sat: '',
    o2_requirement: '',
    gcs: '',
    eye: '',
    vision: '',
    motor: '',
    referring_doctor: '',
    contact_no: '',
    rtpcr: '',
    rtpcr_date: '',
    antigen: '',
    antigen_date: '',
    exposure_covid: '',
    medications: '',
    gravida: '',
    parity: '',
    menarche: '',
    lmp: '',
    aog: '',
    edc: '',
    fh: '',
    fht: '',
    ie: '',
    dilatation: '',
    effacement: '',
    station: '',
    presenting_part: '',
    prom_hours: '',
    ultrasound_1st_date: '',
    ultrasound_1st_aog: '',
    ultrasound_latest_date: '',
    ultrasound_efw: '',
    ultrasound_presentation: '',
    ultrasound_impression: '',
    comorbidity: '',
    previous_surgeries: '',
    previous_cs: '',
    lab_result: '',
    xray: '',
    other_diagnostics: '',
  });

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isScrollable = scrollHeight > clientHeight;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
      setShowScrollIndicator(isScrollable && !isAtBottom);
    }
  }, []);

  const handleScroll = useCallback(() => {
    setIsScrolling(true);
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      checkScroll();
    }, 800);
    checkScroll();
  }, [checkScroll]);

  useEffect(() => {
    if (open) setTimeout(checkScroll, 100);
  }, [open, checkScroll]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', checkScroll);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      };
    }
  }, [handleScroll, checkScroll]);

  // Sync form with referral when panel opens
  React.useEffect(() => {
    if (open && info) {
      const hasObGyne = !!(
        info.lmp ||
        info.aog ||
        info.edc ||
        info.gravida ||
        info.parity ||
        info.fh ||
        info.fht ||
        info.ie
      );
      setShowObGyne(hasObGyne);
      setForm({
        reason_referral: info.reason_referral ?? '',
        chief_complaints: info.chief_complaints ?? '',
        history_present_illness: info.history_present_illness ?? '',
        pe: info.pe ?? '',
        blood_pressure: info.blood_pressure ?? '',
        temperature: info.temperature ?? '',
        heart_rate: info.heart_rate ?? '',
        respiratory_rate: info.respiratory_rate ?? '',
        o2_sat: info.o2_sat ?? '',
        o2_requirement: info.o2_requirement ?? '',
        gcs: info.gcs ?? '',
        eye: info.eye ?? '',
        vision: info.vision ?? '',
        motor: info.motor ?? '',
        referring_doctor: info.referring_doctor ?? '',
        contact_no: info.contact_no ?? '',
        rtpcr: info.rtpcr ?? '',
        rtpcr_date: info.rtpcr_date ?? '',
        antigen: info.antigen ?? '',
        antigen_date: info.antigen_date ?? '',
        exposure_covid: info.exposure_covid ?? '',
        medications: info.medications ?? '',
        gravida: info.gravida ?? '',
        parity: info.parity ?? '',
        menarche: info.menarche ?? '',
        lmp: info.lmp ?? '',
        aog: info.aog ?? '',
        edc: info.edc ?? '',
        fh: info.fh ?? '',
        fht: info.fht ?? '',
        ie: info.ie ?? '',
        dilatation: info.dilatation ?? '',
        effacement: info.effacement ?? '',
        station: info.station ?? '',
        presenting_part: info.presenting_part ?? '',
        prom_hours: info.prom_hours ?? '',
        ultrasound_1st_date: info.ultrasound_1st_date ?? '',
        ultrasound_1st_aog: info.ultrasound_1st_aog ?? '',
        ultrasound_latest_date: info.ultrasound_latest_date ?? '',
        ultrasound_efw: info.ultrasound_efw ?? '',
        ultrasound_presentation: info.ultrasound_presentation ?? '',
        ultrasound_impression: info.ultrasound_impression ?? '',
        comorbidity: info.comorbidity ?? '',
        previous_surgeries: info.previous_surgeries ?? '',
        previous_cs: info.previous_cs ?? '',
        lab_result: info.lab_result ?? '',
        xray: info.xray ?? '',
        other_diagnostics: info.other_diagnostics ?? '',
      });
    }
  }, [open, info]);

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  };

  const SectionHeader = ({
    icon,
    title,
    pink,
  }: {
    icon: string;
    title: string;
    pink?: boolean;
  }) => (
    <h4
      className={`text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-2 ${
        pink ? 'text-pink-500' : 'text-muted-foreground'
      }`}
    >
      <Icon icon={icon} height={14} />
      {title}
    </h4>
  );

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md lg:max-w-lg p-0 flex flex-col h-full"
      >
        {/* Header */}
        <SheetHeader className="px-4 sm:px-6 py-4 border-b bg-muted/30 flex-shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-lightprimary flex items-center justify-center flex-shrink-0">
                <Icon
                  icon="solar:pen-bold-duotone"
                  height={20}
                  className="text-primary sm:hidden"
                />
                <Icon
                  icon="solar:pen-bold-duotone"
                  height={24}
                  className="text-primary hidden sm:block"
                />
              </div>
              <div className="min-w-0">
                <SheetTitle className="text-sm sm:text-base font-semibold truncate">
                  Edit Clinical Information
                </SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {referral?.patient_name} · {referral?.to_assignment_name}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 flex-shrink-0 rounded-full"
              onClick={onClose}
            >
              <Icon
                icon="solar:close-circle-bold-duotone"
                height={20}
                className="text-muted-foreground"
              />
            </Button>
          </div>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="relative flex-1">
          <div
            ref={scrollRef}
            className="absolute inset-0 overflow-y-auto scrollbar-none px-4 sm:px-6 py-4 space-y-4"
          >
            {/* ── Referral Information ─────────────────────────────────────── */}
            <div className="rounded-lg border bg-card p-3 sm:p-4">
              <SectionHeader icon="solar:document-text-bold-duotone" title="Referral Information" />
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs sm:text-sm font-medium">Reason for Referral</Label>
                  <Textarea
                    className="resize-none text-sm"
                    rows={2}
                    value={form.reason_referral ?? ''}
                    onChange={set('reason_referral')}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs sm:text-sm font-medium">Chief Complaints</Label>
                  <Textarea
                    className="resize-none text-sm"
                    rows={2}
                    value={form.chief_complaints ?? ''}
                    onChange={set('chief_complaints')}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs sm:text-sm font-medium">Referring Doctor</Label>
                    <Input
                      className="h-8 sm:h-9 text-sm"
                      value={form.referring_doctor ?? ''}
                      onChange={set('referring_doctor')}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs sm:text-sm font-medium">Contact No.</Label>
                    <Input
                      className="h-8 sm:h-9 text-sm"
                      value={form.contact_no ?? ''}
                      onChange={set('contact_no')}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Clinical History ─────────────────────────────────────────── */}
            <div className="rounded-lg border bg-card p-3 sm:p-4">
              <SectionHeader icon="solar:clipboard-list-bold-duotone" title="Clinical History" />
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs sm:text-sm font-medium">
                    History of Present Illness
                  </Label>
                  <Textarea
                    className="resize-none text-sm"
                    rows={3}
                    value={form.history_present_illness ?? ''}
                    onChange={set('history_present_illness')}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs sm:text-sm font-medium">Physical Examination</Label>
                  <Textarea
                    className="resize-none text-sm"
                    rows={3}
                    value={form.pe ?? ''}
                    onChange={set('pe')}
                  />
                </div>
              </div>
            </div>

            {/* ── Vital Signs ──────────────────────────────────────────────── */}
            <div className="rounded-lg border bg-card p-3 sm:p-4">
              <SectionHeader icon="solar:health-bold-duotone" title="Vital Signs" />
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    {
                      key: 'blood_pressure',
                      label: 'Blood Pressure',
                      icon: 'solar:heart-pulse-bold-duotone',
                    },
                    {
                      key: 'temperature',
                      label: 'Temperature (°C)',
                      icon: 'solar:thermometer-bold-duotone',
                    },
                    { key: 'heart_rate', label: 'Heart Rate', icon: 'solar:pulse-bold-duotone' },
                    {
                      key: 'respiratory_rate',
                      label: 'Respiratory Rate',
                      icon: 'solar:wind-bold-duotone',
                    },
                    { key: 'o2_sat', label: 'O2 Sat', icon: 'solar:water-bold-duotone' },
                    {
                      key: 'o2_requirement',
                      label: 'O2 Requirement',
                      icon: 'solar:mask-happi-bold-duotone',
                    },
                  ] as { key: keyof typeof form; label: string; icon: string }[]
                ).map(({ key, label, icon }) => (
                  <div key={String(key)} className="flex flex-col gap-1.5">
                    <Label className="text-[10px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Icon icon={icon} height={12} className="flex-shrink-0" />
                      {label}
                    </Label>
                    <Input
                      className="h-8 sm:h-9 text-sm"
                      value={(form[key] as string) ?? ''}
                      onChange={set(key)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* ── GCS ─────────────────────────────────────────────────────── */}
            <div className="rounded-lg border bg-card p-3 sm:p-4">
              <SectionHeader icon="solar:brain-bold-duotone" title="GCS — Glasgow Coma Scale" />
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Total GCS</Label>
                  <Input
                    className="h-8 sm:h-9 text-sm"
                    placeholder="e.g. 15"
                    value={form.gcs ?? ''}
                    onChange={set('gcs')}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Eye (E)</Label>
                  <Input
                    className="h-8 sm:h-9 text-sm"
                    placeholder="1–4"
                    value={form.eye ?? ''}
                    onChange={set('eye')}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Verbal (V)</Label>
                  <Input
                    className="h-8 sm:h-9 text-sm"
                    placeholder="1–5"
                    value={form.vision ?? ''}
                    onChange={set('vision')}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Motor (M)</Label>
                  <Input
                    className="h-8 sm:h-9 text-sm"
                    placeholder="1–6"
                    value={form.motor ?? ''}
                    onChange={set('motor')}
                  />
                </div>
              </div>
            </div>

            {/* ── COVID-19 ─────────────────────────────────────────────────── */}
            <div className="rounded-lg border bg-card p-3 sm:p-4">
              <SectionHeader icon="solar:virus-bold-duotone" title="COVID-19 Information" />
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">RT-PCR Result</Label>
                  <Input
                    className="h-8 sm:h-9 text-sm"
                    placeholder="Positive / Negative"
                    value={form.rtpcr ?? ''}
                    onChange={set('rtpcr')}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">RT-PCR Date</Label>
                  <Input
                    type="date"
                    className="h-8 sm:h-9 text-sm"
                    value={form.rtpcr_date ?? ''}
                    onChange={set('rtpcr_date')}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Antigen Result
                  </Label>
                  <Input
                    className="h-8 sm:h-9 text-sm"
                    placeholder="Positive / Negative"
                    value={form.antigen ?? ''}
                    onChange={set('antigen')}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Antigen Date</Label>
                  <Input
                    type="date"
                    className="h-8 sm:h-9 text-sm"
                    value={form.antigen_date ?? ''}
                    onChange={set('antigen_date')}
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Exposure to COVID-19
                  </Label>
                  <Input
                    className="h-8 sm:h-9 text-sm"
                    placeholder="Yes / No / Possible"
                    value={form.exposure_covid ?? ''}
                    onChange={set('exposure_covid')}
                  />
                </div>
              </div>
            </div>

            {/* ── Medications ──────────────────────────────────────────────── */}
            <div className="rounded-lg border bg-card p-3 sm:p-4">
              <SectionHeader icon="solar:pill-bold-duotone" title="Medications" />
              <Textarea
                className="resize-none text-sm"
                rows={3}
                placeholder="List current medications..."
                value={form.medications ?? ''}
                onChange={set('medications')}
              />
            </div>

            {/* ── OB/GYNE Toggle ───────────────────────────────────────────── */}
            <div className="rounded-lg border bg-card p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center flex-shrink-0">
                    <Icon icon="solar:heart-bold-duotone" height={13} className="text-pink-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      OB / GYNE Information
                    </p>
                    {!showObGyne && (info?.lmp || info?.aog || info?.gravida) && (
                      <p className="text-[10px] text-pink-500 mt-0.5">
                        Existing OB/GYNE data detected
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant={showObGyne ? 'default' : 'outline'}
                  size="sm"
                  className={
                    showObGyne
                      ? 'bg-pink-500 hover:bg-pink-600 text-white h-7 text-xs'
                      : 'h-7 text-xs'
                  }
                  onClick={() => setShowObGyne((v) => !v)}
                >
                  <Icon
                    icon={
                      showObGyne
                        ? 'solar:minus-circle-bold-duotone'
                        : 'solar:add-circle-bold-duotone'
                    }
                    height={13}
                    className="mr-1"
                  />
                  {showObGyne ? 'Hide' : 'Show OB/GYNE Fields'}
                </Button>
              </div>
            </div>

            {/* ── OB/GYNE Fields ───────────────────────────────────────────── */}
            {showObGyne && (
              <>
                {/* Obstetric History */}
                <div className="rounded-lg border border-pink-200 dark:border-pink-800/50 bg-card p-3 sm:p-4">
                  <SectionHeader
                    icon="solar:medical-kit-bold-duotone"
                    title="Obstetric History"
                    pink
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Gravida</Label>
                      <Input
                        className="h-8 sm:h-9 text-sm"
                        value={form.gravida ?? ''}
                        onChange={set('gravida')}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Parity (TPAL)
                      </Label>
                      <Input
                        className="h-8 sm:h-9 text-sm"
                        placeholder="T-P-A-L"
                        value={form.parity ?? ''}
                        onChange={set('parity')}
                      />
                    </div>
                    <div className="col-span-2 flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Menarche</Label>
                      <Input
                        className="h-8 sm:h-9 text-sm"
                        value={form.menarche ?? ''}
                        onChange={set('menarche')}
                      />
                    </div>
                  </div>
                </div>

                {/* Current Pregnancy */}
                <div className="rounded-lg border border-pink-200 dark:border-pink-800/50 bg-card p-3 sm:p-4">
                  <SectionHeader icon="solar:baby-bold-duotone" title="Current Pregnancy" pink />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">LMP</Label>
                      <Input
                        type="date"
                        className="h-8 sm:h-9 text-sm"
                        value={form.lmp ?? ''}
                        onChange={set('lmp')}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">AOG</Label>
                      <Input
                        className="h-8 sm:h-9 text-sm"
                        placeholder="e.g. 38 weeks"
                        value={form.aog ?? ''}
                        onChange={set('aog')}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">EDC</Label>
                      <Input
                        type="date"
                        className="h-8 sm:h-9 text-sm"
                        value={form.edc ?? ''}
                        onChange={set('edc')}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Fundal Height (FH)
                      </Label>
                      <Input
                        className="h-8 sm:h-9 text-sm"
                        placeholder="cm"
                        value={form.fh ?? ''}
                        onChange={set('fh')}
                      />
                    </div>
                    <div className="col-span-2 flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        FHT (Fetal Heart Tone)
                      </Label>
                      <Input
                        className="h-8 sm:h-9 text-sm"
                        placeholder="bpm"
                        value={form.fht ?? ''}
                        onChange={set('fht')}
                      />
                    </div>
                  </div>
                </div>

                {/* IE Findings */}
                <div className="rounded-lg border border-pink-200 dark:border-pink-800/50 bg-card p-3 sm:p-4">
                  <SectionHeader icon="solar:stethoscope-bold-duotone" title="IE Findings" pink />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Internal Examination (IE)
                      </Label>
                      <Textarea
                        className="resize-none text-sm"
                        rows={2}
                        value={form.ie ?? ''}
                        onChange={set('ie')}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Dilatation
                      </Label>
                      <Input
                        className="h-8 sm:h-9 text-sm"
                        placeholder="cm"
                        value={form.dilatation ?? ''}
                        onChange={set('dilatation')}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Effacement
                      </Label>
                      <Input
                        className="h-8 sm:h-9 text-sm"
                        placeholder="%"
                        value={form.effacement ?? ''}
                        onChange={set('effacement')}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Station</Label>
                      <Input
                        className="h-8 sm:h-9 text-sm"
                        placeholder="e.g. -2, 0, +1"
                        value={form.station ?? ''}
                        onChange={set('station')}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Presenting Part
                      </Label>
                      <Input
                        className="h-8 sm:h-9 text-sm"
                        value={form.presenting_part ?? ''}
                        onChange={set('presenting_part')}
                      />
                    </div>
                    <div className="col-span-2 flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        PROM (hours)
                      </Label>
                      <Input
                        className="h-8 sm:h-9 text-sm"
                        placeholder="hours"
                        value={form.prom_hours ?? ''}
                        onChange={set('prom_hours')}
                      />
                    </div>
                  </div>
                </div>

                {/* Ultrasound */}
                <div className="rounded-lg border border-pink-200 dark:border-pink-800/50 bg-card p-3 sm:p-4">
                  <SectionHeader icon="solar:monitor-bold-duotone" title="Ultrasound" pink />
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">
                    1st Ultrasound
                  </p>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Date</Label>
                      <Input
                        type="date"
                        className="h-8 sm:h-9 text-sm"
                        value={form.ultrasound_1st_date ?? ''}
                        onChange={set('ultrasound_1st_date')}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        AOG by 1st US
                      </Label>
                      <Input
                        className="h-8 sm:h-9 text-sm"
                        value={form.ultrasound_1st_aog ?? ''}
                        onChange={set('ultrasound_1st_aog')}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">
                    Latest Ultrasound
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">Date</Label>
                      <Input
                        type="date"
                        className="h-8 sm:h-9 text-sm"
                        value={form.ultrasound_latest_date ?? ''}
                        onChange={set('ultrasound_latest_date')}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        EFW (Est. Fetal Weight)
                      </Label>
                      <Input
                        className="h-8 sm:h-9 text-sm"
                        placeholder="grams"
                        value={form.ultrasound_efw ?? ''}
                        onChange={set('ultrasound_efw')}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Presentation
                      </Label>
                      <Input
                        className="h-8 sm:h-9 text-sm"
                        value={form.ultrasound_presentation ?? ''}
                        onChange={set('ultrasound_presentation')}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Impression
                      </Label>
                      <Input
                        className="h-8 sm:h-9 text-sm"
                        value={form.ultrasound_impression ?? ''}
                        onChange={set('ultrasound_impression')}
                      />
                    </div>
                  </div>
                </div>

                {/* Comorbidities & Surgical History */}
                <div className="rounded-lg border border-pink-200 dark:border-pink-800/50 bg-card p-3 sm:p-4">
                  <SectionHeader
                    icon="solar:notes-minimalistic-bold-duotone"
                    title="Comorbidities & Surgical History"
                    pink
                  />
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Comorbidities
                      </Label>
                      <Textarea
                        className="resize-none text-sm"
                        rows={2}
                        value={form.comorbidity ?? ''}
                        onChange={set('comorbidity')}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Previous Surgeries
                      </Label>
                      <Textarea
                        className="resize-none text-sm"
                        rows={2}
                        value={form.previous_surgeries ?? ''}
                        onChange={set('previous_surgeries')}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Previous CS (when / where / indication)
                      </Label>
                      <Textarea
                        className="resize-none text-sm"
                        rows={2}
                        value={form.previous_cs ?? ''}
                        onChange={set('previous_cs')}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Diagnostics */}
                <div className="rounded-lg border border-pink-200 dark:border-pink-800/50 bg-card p-3 sm:p-4">
                  <SectionHeader
                    icon="solar:test-tube-bold-duotone"
                    title="Additional Diagnostics"
                    pink
                  />
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Lab Results
                      </Label>
                      <Textarea
                        className="resize-none text-sm"
                        rows={2}
                        value={form.lab_result ?? ''}
                        onChange={set('lab_result')}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">X-Ray</Label>
                      <Textarea
                        className="resize-none text-sm"
                        rows={2}
                        value={form.xray ?? ''}
                        onChange={set('xray')}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        Other Diagnostics
                      </Label>
                      <Textarea
                        className="resize-none text-sm"
                        rows={2}
                        value={form.other_diagnostics ?? ''}
                        onChange={set('other_diagnostics')}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Scroll indicator arrow */}
          {showScrollIndicator && !isScrolling && (
            <div
              className="absolute bottom-0 left-0 right-0 flex justify-center pb-2 pt-6 bg-gradient-to-t from-background via-background/80 to-transparent cursor-pointer"
              onClick={scrollToBottom}
            >
              <div className="flex flex-col items-center gap-0.5 animate-bounce">
                <span className="text-[10px] text-muted-foreground font-medium">Scroll down</span>
                <Icon icon="solar:alt-arrow-down-bold" height={18} className="text-primary" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t bg-muted/20 flex-shrink-0 flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={onClose}>
            <Icon icon="solar:close-circle-linear" height={15} className="mr-1.5" />
            Cancel
          </Button>
          <Button
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => {
              onConfirm(form);
              onClose();
            }}
          >
            <Icon icon="solar:diskette-bold-duotone" height={15} className="mr-1.5" />
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

const ReferralListing = () => {
  const {
    referrals,
    addReferral,
    updateReferralInfo,
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
  const [editTarget, setEditTarget] = useState<ReferralType | null>(null);
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
                        {!['Declined', 'Discharged', 'Deactivated'].includes(
                          referral.latest_status?.description ?? '',
                        ) && (
                          <DropdownMenuItem onClick={() => setEditTarget(referral)}>
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
      <EditReferralPanel
        open={!!editTarget}
        referral={editTarget}
        onClose={() => setEditTarget(null)}
        onConfirm={(updated) => {
          if (editTarget) updateReferralInfo(editTarget.id, updated);
        }}
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
