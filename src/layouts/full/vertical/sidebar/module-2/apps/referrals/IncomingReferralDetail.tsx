import { useParams, useNavigate } from 'react-router';
import { format } from 'date-fns';
import { Icon } from '@iconify/react';
import { useContext, useEffect, useState } from 'react';
import { ReferralContext, ReferralContextType } from '../../context/ReferralContext';
import { assignmentService } from '@/services/assignmentService';
import { patientService } from 'src/services/patientService';
import CardBox from 'src/components/shared/CardBox';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { Separator } from 'src/components/ui/separator';
import ReferralPrintDocument from './ReferralPrintDocument';
import EditClinicalInfoPanel from './EditClinicalInfoPanel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from 'src/components/ui/dialog';
import { Label } from 'src/components/ui/label';
import { Input } from 'src/components/ui/input';
import { Textarea } from 'src/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select';

const STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-lightwarning text-warning',
  Seen: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
  Accepted: 'bg-lightsuccess text-success',
  'In Transit': 'bg-lightinfo text-info',
  Discharged: 'bg-lightsecondary text-secondary',
  Declined: 'bg-lighterror text-error',
  Arrived: 'bg-lightprimary text-primary',
};

const Field = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: string;
}) => (
  <div className="flex flex-col gap-0.5">
    <div className="flex items-center gap-1.5">
      {icon && <Icon icon={icon} height={13} className="text-muted-foreground" />}
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
    </div>
    <p className="text-sm font-semibold">{value ?? '—'}</p>
  </div>
);

const SectionTitle = ({ icon, title }: { icon: string; title: string }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
      <Icon icon={icon} height={16} className="text-primary" />
    </div>
    <h3 className="text-base font-semibold">{title}</h3>
  </div>
);

// ─── Accept Dialog ─────────────────────────────────────────────────────────────
const AcceptDialog = ({
  open,
  patientName,
  onClose,
  onConfirm,
}: {
  open: boolean;
  patientName?: string;
  onClose: () => void;
  onConfirm: (acceptedBy: string) => void;
}) => {
  const [acceptedBy, setAcceptedBy] = useState('');

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-lightsuccess flex items-center justify-center">
              <Icon icon="solar:check-circle-bold-duotone" height={22} className="text-success" />
            </div>
            <DialogTitle className="text-base">Accept Referral</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Accept this referral for{' '}
            <span className="font-semibold text-foreground">{patientName}</span>. Assign a receiving
            doctor.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">
              Receiving Doctor <span className="text-error">*</span>
            </Label>
            <Input
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
            onClick={() => {
              if (acceptedBy.trim()) {
                onConfirm(acceptedBy.trim());
                setAcceptedBy('');
                onClose();
              }
            }}
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

// ─── Reject Dialog ─────────────────────────────────────────────────────────────
const RejectDialog = ({
  open,
  patientName,
  onClose,
  onConfirm,
}: {
  open: boolean;
  patientName?: string;
  onClose: () => void;
  onConfirm: (reason: string, redirectHospital?: string) => void;
}) => {
  const [reason, setReason] = useState('');
  const [redirectHospital, setRedirectHospital] = useState('');
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
      setReason('');
      setRedirectHospital('');
    }
  }, [open]);

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason.trim(), redirectHospital || undefined);
      setReason('');
      setRedirectHospital('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-lighterror flex items-center justify-center">
              <Icon icon="solar:close-circle-bold-duotone" height={22} className="text-error" />
            </div>
            <DialogTitle className="text-base">Decline Referral</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Decline this referral for{' '}
            <span className="font-semibold text-foreground">{patientName}</span>. The referring
            hospital will be notified and updated immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">
              Reason for Declining <span className="text-error">*</span>
            </Label>
            <Textarea
              placeholder="e.g. No available ICU bed. No specialist on duty."
              className="resize-none"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium">
              Redirect to Facility{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Select value={redirectHospital} onValueChange={setRedirectHospital}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select a facility to redirect to..." />
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
            {redirectHospital && (
              <button
                type="button"
                className="self-start text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                onClick={() => setRedirectHospital('')}
              >
                <Icon icon="solar:close-circle-linear" height={13} />
                Clear selection
              </button>
            )}
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

// ─── Main ──────────────────────────────────────────────────────────────────────
const IncomingReferralDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    acceptIncomingReferral,
    declineIncomingReferral,
    incomingReferrals,
    statuses,
    updateIncomingStatus,
    addDiagnostic,
    deleteDiagnostic,
    updateDiagnosticAttachment,
    addVaccination,
    deleteVaccination,
    updateVaccinationAttachment,
    updateReferralInfo,
  } = useContext<ReferralContextType>(ReferralContext);

  // Look up from live context (reflects accept/reject state changes)
  const referral = incomingReferrals.find((r) => r.id === id);
  const info = referral?.referral_info;
  const history = [...(referral?.history ?? [])].sort((a, b) => {
    const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (diff !== 0) return diff;
    // Tiebreaker: active entry (most recent) always last
    return (a.is_active ? 1 : 0) - (b.is_active ? 1 : 0);
  });

  const [showAccept, setShowAccept] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);

  // ── Patient address
  const [patientAddress, setPatientAddress] = useState<string | null>(null);
  useEffect(() => {
    patientService.getPatientAddressById(referral?.patient_profile ?? null).then((result) => {
      if (!result) {
        setPatientAddress(null);
        return;
      }
      const parts = [
        result.street,
        result.brgy_name,
        result.city_name,
        result.province_name,
        result.region_name,
      ].filter(Boolean);
      setPatientAddress(parts.join(', ') || null);
    });
  }, [referral?.patient_profile]);

  // Editable only when the patient is already in the receiving facility (Admitted)
  const statusDesc = referral?.latest_status?.description;
  const canEditInfo = !!referral && ['Arrived', 'Admitted'].includes(statusDesc ?? '');

  // Auto-mark as Seen when the receiving facility opens this referral
  useEffect(() => {
    if (!id || !referral) return;
    if (referral.latest_status?.description !== 'Pending') return;
    const seenStatus = statuses.find((s) => s.description === 'Seen');
    if (seenStatus) updateIncomingStatus(id, seenStatus.id);
  }, [id, referral?.id, referral?.latest_status?.description, statuses.length]);

  // ── Diagnostic inline-add form state
  const [diagForm, setDiagForm] = useState({ diagnostics: '', date: '' });
  const [showDiagForm, setShowDiagForm] = useState(false);

  // ── Vaccination inline-add form state
  const [vacForm, setVacForm] = useState({ description: '', date: '' });
  const [showVacForm, setShowVacForm] = useState(false);

  // ── Attachment preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleAddDiagnostic = () => {
    if (!diagForm.diagnostics.trim() || !id) return;
    addDiagnostic(id, { diagnostics: diagForm.diagnostics.trim(), date: diagForm.date || null });
    setDiagForm({ diagnostics: '', date: '' });
    setShowDiagForm(false);
  };

  const handleDiagFileChange = (
    diagId: string,
    currentAttachments: string[],
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !id) return;
    Promise.all(
      files.map(
        (f) =>
          new Promise<string>((res) => {
            const r = new FileReader();
            r.onload = () => res(r.result as string);
            r.readAsDataURL(f);
          }),
      ),
    ).then((newUrls) =>
      updateDiagnosticAttachment(diagId, id, [...currentAttachments, ...newUrls]),
    );
    e.target.value = '';
  };

  const handleRemoveDiagAttachment = (
    diagId: string,
    currentAttachments: string[],
    idx: number,
  ) => {
    if (!id) return;
    updateDiagnosticAttachment(
      diagId,
      id,
      currentAttachments.filter((_, i) => i !== idx),
    );
  };

  const handleAddVaccination = () => {
    if (!vacForm.description.trim() || !id) return;
    addVaccination(id, { description: vacForm.description.trim(), date: vacForm.date || null });
    setVacForm({ description: '', date: '' });
    setShowVacForm(false);
  };

  const handleVacFileChange = (
    vacId: string,
    currentAttachments: string[],
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !id) return;
    Promise.all(
      files.map(
        (f) =>
          new Promise<string>((res) => {
            const r = new FileReader();
            r.onload = () => res(r.result as string);
            r.readAsDataURL(f);
          }),
      ),
    ).then((newUrls) =>
      updateVaccinationAttachment(vacId, id, [...currentAttachments, ...newUrls]),
    );
    e.target.value = '';
  };

  const handleRemoveVacAttachment = (vacId: string, currentAttachments: string[], idx: number) => {
    if (!id) return;
    updateVaccinationAttachment(
      vacId,
      id,
      currentAttachments.filter((_, i) => i !== idx),
    );
  };

  const isPending =
    referral?.latest_status?.description === 'Pending' ||
    referral?.latest_status?.description === 'Seen';
  const isDeclined = referral?.latest_status?.description === 'Declined';

  if (!referral) {
    return (
      <CardBox>
        <div className="flex flex-col items-center py-16 gap-3">
          <Icon
            icon="solar:clipboard-remove-bold-duotone"
            height={56}
            className="text-muted-foreground opacity-30"
          />
          <p className="text-muted-foreground font-medium">Referral not found.</p>
          <Button
            onClick={() => navigate('/module-2/referrals')}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            <Icon icon="solar:arrow-left-linear" height={16} className="mr-1.5" />
            Back to Referrals
          </Button>
        </div>
      </CardBox>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* ── Header banner ── */}
      <div className="col-span-12">
        <CardBox>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-lightprimary flex items-center justify-center flex-shrink-0">
                <Icon icon="solar:inbox-bold-duotone" height={26} className="text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold">{referral.patient_name ?? 'Patient'}</h2>
                  <Badge
                    variant="outline"
                    className="text-xs bg-lightprimary text-primary border-primary/20"
                  >
                    <Icon icon="solar:inbox-bold-duotone" height={11} className="mr-1" />
                    Incoming
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap text-sm text-muted-foreground">
                  <Icon icon="solar:buildings-bold-duotone" height={13} />
                  <span>{referral.from_assignment_name ?? '—'}</span>
                  <Icon icon="solar:arrow-right-linear" height={12} />
                  <span>{referral.to_assignment_name ?? '—'}</span>
                  <span>·</span>
                  <span>{format(new Date(referral.created_at), 'MMM dd, yyyy')}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={`text-sm px-3 py-1 font-semibold ${STATUS_STYLES[referral.latest_status?.description ?? ''] ?? 'bg-lightprimary text-primary'}`}
              >
                {referral.latest_status?.description ?? 'No Status'}
              </Badge>
              {isPending && (
                <>
                  <Button
                    size="sm"
                    className="bg-success hover:bg-success/90 text-white"
                    onClick={() => setShowAccept(true)}
                  >
                    <Icon icon="solar:check-circle-bold-duotone" height={15} className="mr-1.5" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-error text-error hover:bg-lighterror"
                    onClick={() => setShowReject(true)}
                  >
                    <Icon icon="solar:close-circle-linear" height={15} className="mr-1.5" />
                    Decline
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={() => setPrintOpen(true)}>
                <Icon
                  icon="solar:printer-minimalistic-bold-duotone"
                  height={16}
                  className="mr-1.5"
                />
                Print
              </Button>
              {canEditInfo && (
                <Button variant="outline" size="sm" onClick={() => setShowEditPanel(true)}>
                  <Icon icon="solar:pen-bold-duotone" height={15} className="mr-1.5" />
                  Edit Clinical Info
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => navigate('/module-2/referrals')}>
                <Icon icon="solar:arrow-left-linear" height={16} className="mr-1.5" />
                Back
              </Button>
            </div>
          </div>

          {/* Accepted / Decline info bar */}
          {referral.accepted_by && (
            <div className="mt-4 flex flex-wrap gap-6 p-3 rounded-lg bg-lightsuccess border border-success/20">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Accepted By
                </p>
                <p className="text-sm font-semibold text-success">{referral.accepted_by}</p>
              </div>
              {referral.to_assignment_name && (
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Dept. / Service
                  </p>
                  <p className="text-sm font-semibold text-success">
                    {referral.to_assignment_name}
                  </p>
                </div>
              )}
            </div>
          )}
          {isDeclined && referral.rejection_reason && (
            <div className="mt-4 p-3 rounded-lg bg-lighterror border border-error/20 flex flex-col gap-2">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                  Decline Reason
                </p>
                <p className="text-sm font-medium text-error">{referral.rejection_reason}</p>
              </div>
              {referral.redirect_to && (
                <div className="flex items-center gap-2 pt-2 border-t border-error/20">
                  <Icon
                    icon="solar:buildings-2-bold-duotone"
                    height={14}
                    className="text-error flex-shrink-0"
                  />
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      Suggested Redirect
                    </p>
                    <p className="text-sm font-semibold text-error">{referral.redirect_to}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Discharge summary bar */}
          {referral.latest_status?.description === 'Discharged' &&
            (() => {
              const dischargeEntry = history.find((h) => h.status_description === 'Discharged');
              return dischargeEntry?.details ? (
                <div className="mt-4 p-3 rounded-lg bg-lightsecondary border border-secondary/20 flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon
                      icon="solar:hospital-bold-duotone"
                      height={14}
                      className="text-secondary flex-shrink-0"
                    />
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      Discharge Summary
                    </p>
                  </div>
                  <p className="text-sm font-medium text-secondary">{dischargeEntry.details}</p>
                </div>
              ) : null;
            })()}
        </CardBox>
      </div>

      {/* ── Left column ── */}
      <div className="lg:col-span-8 col-span-12 flex flex-col gap-6">
        {/* Patient + Referral info */}
        <CardBox>
          <SectionTitle icon="solar:user-id-bold-duotone" title="Patient Information" />
          <div className="grid grid-cols-12 gap-y-4 gap-x-6">
            <div className="lg:col-span-6 col-span-12">
              <Field
                label="Referring Hospital"
                value={referral.from_assignment_name}
                icon="solar:buildings-2-bold-duotone"
              />
            </div>
            <div className="lg:col-span-6 col-span-12">
              <Field
                label="Directed To (Our Dept.)"
                value={referral.to_assignment_name}
                icon="solar:hospital-bold-duotone"
              />
            </div>
            <div className="lg:col-span-6 col-span-12">
              <Field
                label="Patient Name"
                value={referral.patient_name}
                icon="solar:user-bold-duotone"
              />
            </div>
            <div className="lg:col-span-3 col-span-6">
              <Field label="Patient ID" value={referral.patient_profile} />
            </div>
            <div className="lg:col-span-3 col-span-6">
              <Field
                label="Date Received"
                value={format(new Date(referral.created_at), 'MMM dd, yyyy')}
                icon="solar:calendar-bold-duotone"
              />
            </div>
            <div className="col-span-12">
              <Field
                label="Patient Address"
                value={patientAddress}
                icon="solar:map-point-bold-duotone"
              />
            </div>
          </div>
        </CardBox>

        {info && (
          <>
            {/* Referral Info */}
            <CardBox>
              <SectionTitle
                icon="solar:document-medicine-bold-duotone"
                title="Referral Information"
              />
              <div className="grid grid-cols-12 gap-y-4 gap-x-6">
                <div className="col-span-12">
                  <Field
                    label="Reason for Referral"
                    value={info.reason_referral}
                    icon="solar:notes-minimalistic-bold-duotone"
                  />
                </div>
                <div className="col-span-12">
                  <Separator />
                </div>
                <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                  <Field
                    label="Referring Doctor"
                    value={info.referring_doctor}
                    icon="solar:stethoscope-bold-duotone"
                  />
                </div>
                <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                  <Field
                    label="Contact No."
                    value={info.contact_no}
                    icon="solar:phone-bold-duotone"
                  />
                </div>
              </div>
            </CardBox>

            {/* Chief Complaints */}
            <CardBox>
              <SectionTitle icon="solar:notes-bold-duotone" title="Chief Complaints" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                {info.chief_complaints ?? '—'}
              </p>
            </CardBox>

            <div className="grid grid-cols-12 gap-6">
              <div className="lg:col-span-6 col-span-12">
                <CardBox className="h-full">
                  <SectionTitle
                    icon="solar:medical-kit-bold-duotone"
                    title="History of Present Illness"
                  />
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {info.history_present_illness ?? '—'}
                  </p>
                </CardBox>
              </div>
              <div className="lg:col-span-6 col-span-12">
                <CardBox className="h-full">
                  <SectionTitle icon="solar:body-bold-duotone" title="Physical Examination" />
                  <p className="text-sm leading-relaxed text-muted-foreground">{info.pe ?? '—'}</p>
                </CardBox>
              </div>
            </div>

            {/* Vital Signs */}
            <CardBox>
              <SectionTitle icon="solar:heart-pulse-bold-duotone" title="Vital Signs" />
              <div className="grid grid-cols-12 gap-y-5 gap-x-6">
                <div className="lg:col-span-3 sm:col-span-4 col-span-6">
                  <Field label="Blood Pressure" value={info.blood_pressure} />
                </div>
                <div className="lg:col-span-3 sm:col-span-4 col-span-6">
                  <Field label="Temperature (°C)" value={info.temperature} />
                </div>
                <div className="lg:col-span-3 sm:col-span-4 col-span-6">
                  <Field label="Heart Rate" value={info.heart_rate} />
                </div>
                <div className="lg:col-span-3 sm:col-span-4 col-span-6">
                  <Field label="Respiratory Rate" value={info.respiratory_rate} />
                </div>
                <div className="lg:col-span-3 sm:col-span-4 col-span-6">
                  <Field label="O2 Sat" value={info.o2_sat} />
                </div>
                <div className="lg:col-span-3 sm:col-span-4 col-span-6">
                  <Field label="O2 Requirement" value={info.o2_requirement} />
                </div>
                <div className="col-span-12">
                  <Separator />
                </div>
                <div className="lg:col-span-3 sm:col-span-4 col-span-6">
                  <Field label="GCS" value={info.gcs} />
                </div>
                <div className="lg:col-span-3 sm:col-span-4 col-span-6">
                  <Field label="Eye" value={info.eye} />
                </div>
                <div className="lg:col-span-3 sm:col-span-4 col-span-6">
                  <Field label="Vision" value={info.vision} />
                </div>
                <div className="lg:col-span-3 sm:col-span-4 col-span-6">
                  <Field label="Motor" value={info.motor} />
                </div>
              </div>
            </CardBox>

            {/* Medications */}
            <CardBox>
              <SectionTitle icon="solar:pill-bold-duotone" title="Medications" />
              <p className="text-sm leading-relaxed text-muted-foreground">
                {info.medications ?? '—'}
              </p>
            </CardBox>

            {/* OB/GYNE conditional */}
            {(info.gravida || info.lmp || info.aog) && (
              <>
                {/* Obstetric History */}
                <CardBox>
                  <SectionTitle
                    icon="solar:heart-angle-bold-duotone"
                    title="OB/GYNE — Obstetric History"
                  />
                  <div className="grid grid-cols-12 gap-y-4 gap-x-6">
                    <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                      <Field label="Gravida" value={info.gravida} />
                    </div>
                    <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                      <Field label="Parity (TPAL)" value={info.parity} />
                    </div>
                    <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                      <Field label="Menarche" value={info.menarche} />
                    </div>
                    {info.comorbidity && (
                      <div className="col-span-12">
                        <Field label="Comorbidities" value={info.comorbidity} />
                      </div>
                    )}
                    {info.previous_surgeries && (
                      <div className="col-span-12">
                        <Field label="Previous Surgeries" value={info.previous_surgeries} />
                      </div>
                    )}
                    {info.previous_cs && (
                      <div className="col-span-12">
                        <Field
                          label="Previous CS (when / where / indication)"
                          value={info.previous_cs}
                        />
                      </div>
                    )}
                  </div>
                </CardBox>

                {/* Current Pregnancy */}
                <CardBox>
                  <SectionTitle
                    icon="solar:calendar-bold-duotone"
                    title="OB/GYNE — Current Pregnancy"
                  />
                  <div className="grid grid-cols-12 gap-y-4 gap-x-6">
                    <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                      <Field
                        label="LMP"
                        value={info.lmp ? format(new Date(info.lmp), 'MMM dd, yyyy') : info.lmp}
                      />
                    </div>
                    <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                      <Field label="AOG" value={info.aog} />
                    </div>
                    <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                      <Field
                        label="EDC"
                        value={info.edc ? format(new Date(info.edc), 'MMM dd, yyyy') : info.edc}
                      />
                    </div>
                    <div className="col-span-12">
                      <Separator />
                    </div>
                    <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                      <Field label="Fundal Height (FH)" value={info.fh} />
                    </div>
                    <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                      <Field label="Fetal Heart Tone (FHT)" value={info.fht} />
                    </div>
                    <div className="col-span-12">
                      <Separator />
                    </div>
                    <div className="col-span-12">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">
                        IE Findings
                      </p>
                    </div>
                    <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                      <Field label="IE" value={info.ie} />
                    </div>
                    <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                      <Field label="Dilatation" value={info.dilatation} />
                    </div>
                    <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                      <Field label="Effacement" value={info.effacement} />
                    </div>
                    <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                      <Field label="Station" value={info.station} />
                    </div>
                    <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                      <Field label="Presenting Part" value={info.presenting_part} />
                    </div>
                    <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                      <Field label="PROM (hours)" value={info.prom_hours} />
                    </div>
                  </div>
                </CardBox>

                {/* Ultrasound */}
                <CardBox>
                  <SectionTitle icon="solar:screencast-bold-duotone" title="OB/GYNE — Ultrasound" />
                  <div className="grid grid-cols-12 gap-y-4 gap-x-6">
                    <div className="col-span-12">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                        1st Ultrasound
                      </p>
                    </div>
                    <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                      <Field
                        label="Date"
                        value={
                          info.ultrasound_1st_date
                            ? format(new Date(info.ultrasound_1st_date), 'MMM dd, yyyy')
                            : info.ultrasound_1st_date
                        }
                      />
                    </div>
                    <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                      <Field label="AOG by US" value={info.ultrasound_1st_aog} />
                    </div>
                    <div className="col-span-12">
                      <Separator />
                    </div>
                    <div className="col-span-12">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                        Latest Ultrasound
                      </p>
                    </div>
                    <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                      <Field
                        label="Date"
                        value={
                          info.ultrasound_latest_date
                            ? format(new Date(info.ultrasound_latest_date), 'MMM dd, yyyy')
                            : info.ultrasound_latest_date
                        }
                      />
                    </div>
                    <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                      <Field label="EFW" value={info.ultrasound_efw} />
                    </div>
                    <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                      <Field label="Presentation" value={info.ultrasound_presentation} />
                    </div>
                    <div className="col-span-12">
                      <Field label="Impression" value={info.ultrasound_impression} />
                    </div>
                  </div>
                </CardBox>

                {/* OB/GYNE Additional Diagnostics */}
                {(info.lab_result || info.xray || info.other_diagnostics) && (
                  <CardBox>
                    <SectionTitle
                      icon="solar:test-tube-bold-duotone"
                      title="OB/GYNE — Diagnostics"
                    />
                    <div className="grid grid-cols-12 gap-y-4 gap-x-6">
                      {info.lab_result && (
                        <div className="col-span-12">
                          <Field label="Laboratory Results" value={info.lab_result} />
                        </div>
                      )}
                      {info.xray && (
                        <div className="col-span-12">
                          <Field label="X-Ray" value={info.xray} />
                        </div>
                      )}
                      {info.other_diagnostics && (
                        <div className="col-span-12">
                          <Field label="Other Diagnostics" value={info.other_diagnostics} />
                        </div>
                      )}
                    </div>
                  </CardBox>
                )}
              </>
            )}

            {/* Vaccinations */}
            {info.vaccinations && info.vaccinations.length > 0 && (
              <CardBox>
                <SectionTitle icon="solar:shield-check-bold-duotone" title="Vaccination Record" />
                <div className="flex flex-col gap-2">
                  {info.vaccinations.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 border border-border"
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          icon="solar:syringe-bold-duotone"
                          height={15}
                          className="text-primary flex-shrink-0"
                        />
                        <span className="text-sm font-medium">{v.description}</span>
                      </div>
                      {v.date && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(v.date), 'MMM dd, yyyy')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardBox>
            )}

            {/* COVID */}
            <CardBox>
              <SectionTitle icon="solar:virus-bold-duotone" title="COVID-19 Information" />
              <div className="grid grid-cols-12 gap-y-4 gap-x-6">
                <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                  <Field label="RT-PCR Result" value={info.rtpcr} />
                </div>
                <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                  <Field
                    label="RT-PCR Date"
                    value={
                      info.rtpcr_date ? format(new Date(info.rtpcr_date), 'MMM dd, yyyy') : null
                    }
                  />
                </div>
                <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                  <Field label="Antigen Result" value={info.antigen} />
                </div>
                <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                  <Field
                    label="Antigen Date"
                    value={
                      info.antigen_date ? format(new Date(info.antigen_date), 'MMM dd, yyyy') : null
                    }
                  />
                </div>
                <div className="col-span-12">
                  <Field label="COVID-19 Exposure" value={info.exposure_covid} />
                </div>
              </div>
            </CardBox>
          </>
        )}
      </div>

      {/* ── Right column ── */}
      <div className="lg:col-span-4 col-span-12 flex flex-col gap-6">
        {history.length > 0 && (
          <CardBox>
            <SectionTitle icon="solar:history-bold-duotone" title="Referral History" />
            <div className="relative">
              {history.map((h, idx) => (
                <div key={h.id} className="flex gap-x-3">
                  <div
                    className={`relative ${idx === history.length - 1 ? '' : 'after:absolute after:top-7 after:bottom-0 after:start-3.5 after:w-px after:-translate-x-[0.5px] after:bg-border'}`}
                  >
                    <div className="relative z-1 w-7 h-7 flex justify-center items-center">
                      <div
                        className={`h-3 w-3 rounded-full border-2 ${h.is_active ? 'bg-success border-success' : 'bg-transparent border-border'}`}
                      />
                    </div>
                  </div>
                  <div className="grow pt-0.5 pb-5">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-xs ${STATUS_STYLES[h.status_description ?? ''] ?? 'bg-lightprimary text-primary'} ${h.is_active ? '' : 'opacity-60'}`}
                        >
                          {h.status_description ?? '—'}
                        </Badge>
                        {h.is_active && (
                          <span className="text-xs text-success font-medium">● Active</span>
                        )}
                      </div>
                      {h.email && (
                        <div className="flex items-center gap-1 bg-lightprimary text-primary rounded-full px-2 py-0.5 flex-shrink-0">
                          <Icon
                            icon="solar:user-bold-duotone"
                            height={12}
                            className="flex-shrink-0"
                          />
                          <span className="text-xs font-medium max-w-[100px] truncate">
                            {h.email}
                          </span>
                        </div>
                      )}
                    </div>
                    {(() => {
                      const receiverSide = new Set([
                        'Seen',
                        'Accepted',
                        'Declined',
                        'Arrived',
                        'Admitted',
                        'Discharged',
                      ]);
                      const facility =
                        h.to_assignment_name ??
                        (receiverSide.has(h.status_description ?? '')
                          ? (referral.to_assignment_name ?? referral.from_assignment_name)
                          : referral.from_assignment_name);
                      return facility ? <p className="text-sm font-medium">{facility}</p> : null;
                    })()}
                    {h.details && (
                      <p className="text-xs text-muted-foreground mt-0.5">{h.details}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(h.created_at), 'MMM dd, yyyy · h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardBox>
        )}

        {/* Discharge notes — read from the Discharged history entry's details field */}
        {(() => {
          const dischargeEntry = [...(referral.history ?? [])]
            .reverse()
            .find((h) => h.status_description === 'Discharged' && h.details);
          return dischargeEntry ? (
            <CardBox>
              <SectionTitle icon="solar:exit-bold-duotone" title="Discharge Notes" />
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {dischargeEntry.details}
              </p>
            </CardBox>
          ) : null;
        })()}

        {/* ── Diagnostics CRUD ──────────────────────────────────────────────────────── */}
        {info && (
          <CardBox>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon icon="solar:test-tube-bold-duotone" height={16} className="text-primary" />
                </div>
                <h3 className="text-base font-semibold">Diagnostics</h3>
              </div>
              {canEditInfo && (
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
              <div className="mb-4 p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">
                    Finding / Test Result <span className="text-error">*</span>
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
                    onClick={handleAddDiagnostic}
                    disabled={!diagForm.diagnostics.trim()}
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {(info.diagnostics ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No diagnostics recorded.</p>
              ) : (
                (info.diagnostics ?? []).map((d) => (
                  <div
                    key={d.id}
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 border border-border"
                  >
                    <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon
                        icon="solar:document-text-bold-duotone"
                        height={13}
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
                              className="inline-flex items-center gap-1 bg-primary/10 rounded px-1.5 py-0.5 text-xs"
                            >
                              <button
                                type="button"
                                onClick={() => setPreviewUrl(url)}
                                className="inline-flex items-center gap-0.5 text-primary hover:underline"
                              >
                                <Icon
                                  icon={
                                    url.startsWith('data:image')
                                      ? 'solar:gallery-bold-duotone'
                                      : 'solar:file-text-bold-duotone'
                                  }
                                  height={11}
                                />
                                {url.startsWith('data:image') ? 'Image' : 'PDF'} {idx + 1}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveDiagAttachment(d.id, d.attachments ?? [], idx)
                                }
                                className="text-muted-foreground hover:text-error leading-none"
                                title="Remove"
                              >
                                <Icon icon="solar:close-circle-bold" height={11} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* File upload */}
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        multiple
                        className="hidden"
                        id={`att-${d.id}`}
                        onChange={(e) => handleDiagFileChange(d.id, d.attachments ?? [], e)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        title="Upload attachment"
                        onClick={() => document.getElementById(`att-${d.id}`)?.click()}
                      >
                        <Icon icon="solar:paperclip-bold" height={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-error"
                        title="Delete"
                        onClick={() => id && deleteDiagnostic(d.id, id)}
                      >
                        <Icon icon="solar:trash-bin-minimalistic-linear" height={13} />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardBox>
        )}

        {/* ── Vaccination CRUD ───────────────────────────────────────────────────────── */}
        {info && (
          <CardBox>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-success/10 flex items-center justify-center flex-shrink-0">
                  <Icon
                    icon="solar:shield-check-bold-duotone"
                    height={16}
                    className="text-success"
                  />
                </div>
                <h3 className="text-base font-semibold">Vaccination History</h3>
              </div>
              {canEditInfo && (
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
              <div className="mb-4 p-3 rounded-lg border border-border bg-muted/20 flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">
                    Vaccine / Description <span className="text-error">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. COVID-19 – Pfizer (2 doses)"
                    className="h-8 text-sm"
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
                    onClick={handleAddVaccination}
                    disabled={!vacForm.description.trim()}
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {(info.vaccinations ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No vaccinations recorded.</p>
              ) : (
                (info.vaccinations ?? []).map((v) => (
                  <div
                    key={v.id}
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/30 border border-border"
                  >
                    <div className="w-6 h-6 rounded-md bg-success/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon
                        icon="solar:syringe-bold-duotone"
                        height={13}
                        className="text-success"
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
                              className="inline-flex items-center gap-1 bg-success/10 rounded px-1.5 py-0.5 text-xs"
                            >
                              <button
                                type="button"
                                onClick={() => setPreviewUrl(url)}
                                className="inline-flex items-center gap-0.5 text-success hover:underline"
                              >
                                <Icon
                                  icon={
                                    url.startsWith('data:image')
                                      ? 'solar:gallery-bold-duotone'
                                      : 'solar:file-text-bold-duotone'
                                  }
                                  height={11}
                                />
                                {url.startsWith('data:image') ? 'Image' : 'PDF'} {idx + 1}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveVacAttachment(v.id, v.attachments ?? [], idx)
                                }
                                className="text-muted-foreground hover:text-error leading-none"
                                title="Remove"
                              >
                                <Icon icon="solar:close-circle-bold" height={11} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        multiple
                        className="hidden"
                        id={`vac-att-${v.id}`}
                        onChange={(e) => handleVacFileChange(v.id, v.attachments ?? [], e)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-success"
                        title="Upload attachment"
                        onClick={() => document.getElementById(`vac-att-${v.id}`)?.click()}
                      >
                        <Icon icon="solar:paperclip-bold" height={13} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-error flex-shrink-0"
                        title="Delete"
                        onClick={() => id && deleteVaccination(v.id, id)}
                      >
                        <Icon icon="solar:trash-bin-minimalistic-linear" height={13} />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardBox>
        )}
      </div>

      {/* Dialogs */}
      <AcceptDialog
        open={showAccept}
        patientName={referral.patient_name ?? undefined}
        onClose={() => setShowAccept(false)}
        onConfirm={(acceptedBy) => {
          if (id) acceptIncomingReferral(id, acceptedBy);
        }}
      />
      <RejectDialog
        open={showReject}
        patientName={referral.patient_name ?? undefined}
        onClose={() => setShowReject(false)}
        onConfirm={(reason, redirectHospital) => {
          if (id) declineIncomingReferral(id, reason, redirectHospital);
        }}
      />

      {/* Print Document */}
      {printOpen && (
        <ReferralPrintDocument referral={referral} onClose={() => setPrintOpen(false)} />
      )}

      {/* Edit Clinical Info Panel */}
      <EditClinicalInfoPanel
        open={showEditPanel}
        referral={referral}
        onClose={() => setShowEditPanel(false)}
        onConfirm={(updated) => {
          if (id) updateReferralInfo(id, updated);
        }}
        addDiag={(d) => id && addDiagnostic(id, d)}
        deleteDiag={(diagId) => id && deleteDiagnostic(diagId, id)}
        updateDiagAttachment={(diagId, atts) => id && updateDiagnosticAttachment(diagId, id, atts)}
        addVac={(v) => id && addVaccination(id, v)}
        deleteVac={(vacId) => id && deleteVaccination(vacId, id)}
        updateVacAttachment={(vacId, atts) => id && updateVaccinationAttachment(vacId, id, atts)}
      />

      {/* Attachment Preview Dialog */}
      <Dialog
        open={!!previewUrl}
        onOpenChange={(open) => {
          if (!open) setPreviewUrl(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5 pb-3 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Icon icon="solar:paperclip-bold" height={16} className="text-primary" />
              Attachment Preview
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            {previewUrl &&
              (previewUrl.startsWith('data:image') ? (
                <img
                  src={previewUrl}
                  alt="Attachment"
                  className="w-full rounded-lg object-contain max-h-[70vh]"
                />
              ) : (
                <iframe
                  src={previewUrl}
                  title="Attachment Preview"
                  className="w-full rounded-lg border"
                  style={{ height: '70vh' }}
                />
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IncomingReferralDetail;
