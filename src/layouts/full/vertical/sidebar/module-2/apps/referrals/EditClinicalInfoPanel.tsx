import { useRef, useState, useEffect, useCallback } from 'react';
import React from 'react';
import { Icon } from '@iconify/react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from 'src/components/ui/sheet';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Textarea } from 'src/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from 'src/components/ui/dialog';
import { format } from 'date-fns';
import { ReferralType, ReferralInfo } from '../../types/referral';

// ─── Shared Edit Clinical Information Side Panel ───────────────────────────────
// Used in: ReferralDetail (outgoing) and IncomingReferralDetail (incoming)
// Props: open, referral, onClose, onConfirm(Partial<ReferralInfo>)

const EditClinicalInfoPanel = ({
  open,
  referral,
  onClose,
  onConfirm,
  addDiag,
  deleteDiag,
  updateDiagAttachment,
  addVac,
  deleteVac,
  updateVacAttachment,
}: {
  open: boolean;
  referral: ReferralType | null;
  onClose: () => void;
  onConfirm: (updated: Partial<ReferralInfo>) => void;
  addDiag?: (d: { diagnostics: string; date?: string | null }) => void;
  deleteDiag?: (diagId: string) => void;
  updateDiagAttachment?: (diagId: string, attachments: string[]) => void;
  addVac?: (v: { description: string; date?: string | null }) => void;
  deleteVac?: (vacId: string) => void;
  updateVacAttachment?: (vacId: string, attachments: string[]) => void;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevOpenRef = useRef(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [showObGyne, setShowObGyne] = useState(false);

  // Diagnostics inline form
  const [diagForm, setDiagForm] = useState({ diagnostics: '', date: '' });
  const [showDiagForm, setShowDiagForm] = useState(false);
  const diagFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Vaccination inline form
  const [vacForm, setVacForm] = useState({ description: '', date: '' });
  const [showVacForm, setShowVacForm] = useState(false);
  const vacFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Attachment preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  // Sync form with referral only when the panel first opens (not on every info change).
  // Depending only on `open` prevents attachment updates from resetting unsaved edits.
  React.useEffect(() => {
    const justOpened = open && !prevOpenRef.current;
    prevOpenRef.current = open;
    if (!justOpened || !info) return;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleAddDiag = () => {
    if (!diagForm.diagnostics.trim() || !addDiag) return;
    addDiag({ diagnostics: diagForm.diagnostics.trim(), date: diagForm.date || null });
    setDiagForm({ diagnostics: '', date: '' });
    setShowDiagForm(false);
  };

  const handleDiagFileChange = (
    diagId: string,
    current: string[],
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !updateDiagAttachment) return;
    Promise.all(
      files.map(
        (f) =>
          new Promise<string>((res) => {
            const r = new FileReader();
            r.onload = () => res(r.result as string);
            r.readAsDataURL(f);
          }),
      ),
    ).then((newUrls) => updateDiagAttachment(diagId, [...current, ...newUrls]));
    e.target.value = '';
  };

  const handleAddVac = () => {
    if (!vacForm.description.trim() || !addVac) return;
    addVac({ description: vacForm.description.trim(), date: vacForm.date || null });
    setVacForm({ description: '', date: '' });
    setShowVacForm(false);
  };

  const handleVacFileChange = (
    vacId: string,
    current: string[],
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !updateVacAttachment) return;
    Promise.all(
      files.map(
        (f) =>
          new Promise<string>((res) => {
            const r = new FileReader();
            r.onload = () => res(r.result as string);
            r.readAsDataURL(f);
          }),
      ),
    ).then((newUrls) => updateVacAttachment(vacId, [...current, ...newUrls]));
    e.target.value = '';
  };

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
        className="w-full sm:max-w-xl lg:max-w-2xl p-0 flex flex-col h-full"
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
                  {referral?.patient_name} ·{' '}
                  {referral?.to_assignment_name ?? referral?.from_assignment_name}
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

            {/* ── Diagnostics ──────────────────────────────────────────────── */}
            <div className="rounded-lg border bg-card p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon
                      icon="solar:test-tube-bold-duotone"
                      height={13}
                      className="text-primary"
                    />
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Diagnostics
                  </p>
                </div>
                {addDiag && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowDiagForm((v) => !v)}
                  >
                    <Icon icon="solar:add-circle-linear" height={13} className="mr-1" />
                    Add
                  </Button>
                )}
              </div>

              {showDiagForm && (
                <div className="mb-3 p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">
                      Finding / Test Result <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      rows={2}
                      placeholder="e.g. CBC — Hgb 110 g/L"
                      className="text-sm resize-none"
                      value={diagForm.diagnostics}
                      onChange={(e) => setDiagForm((f) => ({ ...f, diagnostics: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Date</Label>
                    <Input
                      type="date"
                      className="h-8 text-sm"
                      value={diagForm.date}
                      onChange={(e) => setDiagForm((f) => ({ ...f, date: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setShowDiagForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleAddDiag}
                      disabled={!diagForm.diagnostics.trim()}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {(referral?.referral_info?.diagnostics ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-1">No diagnostics recorded.</p>
                ) : (
                  (referral?.referral_info?.diagnostics ?? []).map((d) => (
                    <div
                      key={d.id}
                      className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 border border-border"
                    >
                      <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon
                          icon="solar:document-text-bold-duotone"
                          height={11}
                          className="text-primary"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">{d.diagnostics}</p>
                        {d.date && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(d.date), 'MMM dd, yyyy')}
                          </p>
                        )}
                        {(d.attachments ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {(d.attachments ?? []).map((url, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-medium text-primary"
                              >
                                <button
                                  type="button"
                                  onClick={() => setPreviewUrl(url)}
                                  className="hover:underline"
                                >
                                  {url.startsWith('data:image')
                                    ? `Image ${idx + 1}`
                                    : `PDF ${idx + 1}`}
                                </button>
                                {updateDiagAttachment && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateDiagAttachment(
                                        d.id,
                                        (d.attachments ?? []).filter((_, i) => i !== idx),
                                      )
                                    }
                                    className="ml-1 text-muted-foreground hover:text-destructive"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {updateDiagAttachment && (
                          <label className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary cursor-pointer">
                            <Icon icon="solar:paperclip-bold-duotone" height={11} />
                            Attach file
                            <input
                              type="file"
                              multiple
                              accept="image/*,application/pdf"
                              className="hidden"
                              ref={(el) => {
                                diagFileRefs.current[d.id] = el;
                              }}
                              onChange={(e) => handleDiagFileChange(d.id, d.attachments ?? [], e)}
                            />
                          </label>
                        )}
                      </div>
                      {deleteDiag && (
                        <button
                          type="button"
                          onClick={() => deleteDiag(d.id)}
                          className="text-muted-foreground hover:text-destructive mt-0.5 flex-shrink-0"
                        >
                          <Icon icon="solar:trash-bin-trash-bold-duotone" height={15} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── Vaccination History ───────────────────────────────────────── */}
            <div className="rounded-lg border bg-card p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon icon="solar:syringe-bold-duotone" height={13} className="text-primary" />
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Vaccination History
                  </p>
                </div>
                {addVac && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowVacForm((v) => !v)}
                  >
                    <Icon icon="solar:add-circle-linear" height={13} className="mr-1" />
                    Add
                  </Button>
                )}
              </div>

              {showVacForm && (
                <div className="mb-3 p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-2">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">
                      Vaccine / Description <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      rows={2}
                      placeholder="e.g. COVID-19 Booster — Pfizer"
                      className="text-sm resize-none"
                      value={vacForm.description}
                      onChange={(e) => setVacForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Date</Label>
                    <Input
                      type="date"
                      className="h-8 text-sm"
                      value={vacForm.date}
                      onChange={(e) => setVacForm((f) => ({ ...f, date: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setShowVacForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleAddVac}
                      disabled={!vacForm.description.trim()}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {(referral?.referral_info?.vaccinations ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground py-1">No vaccinations recorded.</p>
                ) : (
                  (referral?.referral_info?.vaccinations ?? []).map((v) => (
                    <div
                      key={v.id}
                      className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 border border-border"
                    >
                      <div className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon
                          icon="solar:syringe-bold-duotone"
                          height={11}
                          className="text-primary"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">{v.description}</p>
                        {v.date && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(v.date), 'MMM dd, yyyy')}
                          </p>
                        )}
                        {(v.attachments ?? []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {(v.attachments ?? []).map((url, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-medium text-primary"
                              >
                                <button
                                  type="button"
                                  onClick={() => setPreviewUrl(url)}
                                  className="hover:underline"
                                >
                                  {url.startsWith('data:image')
                                    ? `Image ${idx + 1}`
                                    : `PDF ${idx + 1}`}
                                </button>
                                {updateVacAttachment && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateVacAttachment(
                                        v.id,
                                        (v.attachments ?? []).filter((_, i) => i !== idx),
                                      )
                                    }
                                    className="ml-1 text-muted-foreground hover:text-destructive"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {updateVacAttachment && (
                          <label className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary cursor-pointer">
                            <Icon icon="solar:paperclip-bold-duotone" height={11} />
                            Attach file
                            <input
                              type="file"
                              multiple
                              accept="image/*,application/pdf"
                              className="hidden"
                              ref={(el) => {
                                vacFileRefs.current[v.id] = el;
                              }}
                              onChange={(e) => handleVacFileChange(v.id, v.attachments ?? [], e)}
                            />
                          </label>
                        )}
                      </div>
                      {deleteVac && (
                        <button
                          type="button"
                          onClick={() => deleteVac(v.id)}
                          className="text-muted-foreground hover:text-destructive mt-0.5 flex-shrink-0"
                        >
                          <Icon icon="solar:trash-bin-trash-bold-duotone" height={15} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Attachment preview dialog */}
          <Dialog open={!!previewUrl} onOpenChange={(v) => !v && setPreviewUrl(null)}>
            <DialogContent className="max-w-3xl w-full">
              <DialogHeader>
                <DialogTitle className="text-sm">Attachment Preview</DialogTitle>
              </DialogHeader>
              {previewUrl?.startsWith('data:image') ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full rounded-lg object-contain max-h-[70vh]"
                />
              ) : (
                <iframe
                  src={previewUrl ?? ''}
                  title="Preview"
                  className="w-full rounded-lg"
                  style={{ height: '70vh' }}
                />
              )}
            </DialogContent>
          </Dialog>

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

export default EditClinicalInfoPanel;
