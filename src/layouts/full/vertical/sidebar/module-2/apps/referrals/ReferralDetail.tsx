import { useParams, useNavigate } from 'react-router';
import { format } from 'date-fns';
import { Icon } from '@iconify/react';
import { useContext, useEffect, useState } from 'react';
import { ReferralContext, ReferralContextType } from '../../context/ReferralContext';
import { patientService } from 'src/services/patientService';
import EditClinicalInfoPanel from './EditClinicalInfoPanel';

import CardBox from 'src/components/shared/CardBox';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { Separator } from 'src/components/ui/separator';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Textarea } from 'src/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from 'src/components/ui/dialog';

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

const ReferralDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    referrals,
    deactivatedReferrals,
    markOutgoingInTransit,
    addOutgoingDiagnostic,
    deleteOutgoingDiagnostic,
    updateOutgoingDiagnosticAttachment,
    addOutgoingVaccination,
    deleteOutgoingVaccination,
    updateOutgoingVaccinationAttachment,
    updateReferralStatus,
    updateReferralInfo,
    statuses,
  } = useContext<ReferralContextType>(ReferralContext);

  // Live context first (active), then check deactivated
  const referral =
    referrals.find((r) => r.id === id) ?? deactivatedReferrals.find((r) => r.id === id);
  const info = referral?.referral_info;
  const history = [...(referral?.history ?? [])].sort((a, b) => {
    const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (diff !== 0) return diff;
    // Tiebreaker: active entry (most recent) always last
    return (a.is_active ? 1 : 0) - (b.is_active ? 1 : 0);
  });

  // ── Patient address
  const [patientAddress, setPatientAddress] = useState<string | null>(null);
  useEffect(() => {
    if (!referral?.patient_profile) return;
    patientService.getPatientAddressById(referral.patient_profile).then((result) => {
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

  // ── Edit clinical info panel state
  const [showEditPanel, setShowEditPanel] = useState(false);
  // Editable when patient is still at the sending facility (Pending / Seen / In Transit)
  const canEdit =
    referral?.status !== false &&
    ['Pending', 'Seen', 'In Transit'].includes(referral?.latest_status?.description ?? '');

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
    addOutgoingDiagnostic(id, {
      diagnostics: diagForm.diagnostics.trim(),
      date: diagForm.date || null,
    });
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
      updateOutgoingDiagnosticAttachment(diagId, id, [...currentAttachments, ...newUrls]),
    );
    e.target.value = '';
  };

  const handleRemoveDiagAttachment = (
    diagId: string,
    currentAttachments: string[],
    idx: number,
  ) => {
    if (!id) return;
    updateOutgoingDiagnosticAttachment(
      diagId,
      id,
      currentAttachments.filter((_, i) => i !== idx),
    );
  };

  const handleAddVaccination = () => {
    if (!vacForm.description.trim() || !id) return;
    addOutgoingVaccination(id, {
      description: vacForm.description.trim(),
      date: vacForm.date || null,
    });
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
      updateOutgoingVaccinationAttachment(vacId, id, [...currentAttachments, ...newUrls]),
    );
    e.target.value = '';
  };

  const handleRemoveVacAttachment = (vacId: string, currentAttachments: string[], idx: number) => {
    if (!id) return;
    updateOutgoingVaccinationAttachment(
      vacId,
      id,
      currentAttachments.filter((_, i) => i !== idx),
    );
  };

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
            Back to List
          </Button>
        </div>
      </CardBox>
    );
  }

  return (
    <>
      <div className="grid grid-cols-12 gap-6">
        {/* ── Header banner ── */}
        <div className="col-span-12">
          <CardBox>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold">{referral.patient_name ?? 'Patient'}</h2>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap text-sm text-muted-foreground">
                    <span>{referral.from_assignment_name ?? '—'}</span>
                    {referral.to_assignment_name && (
                      <>
                        <Icon icon="solar:arrow-right-linear" height={12} />
                        <span>{referral.to_assignment_name}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>{format(new Date(referral.created_at), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge
                  variant="outline"
                  className={`text-sm px-3 py-1 font-semibold ${STATUS_STYLES[referral.latest_status?.description ?? ''] ?? 'bg-lightprimary text-primary'}`}
                >
                  {referral.latest_status?.description ?? 'No Status'}
                </Badge>
                {/* Sending facility dispatches the patient once receiver has accepted */}
                {referral.latest_status?.description === 'Accepted' && (
                  <Button
                    size="sm"
                    className="bg-info hover:bg-info/90 text-white gap-1.5"
                    onClick={() => id && markOutgoingInTransit(id)}
                  >
                    <Icon icon="solar:routing-bold-duotone" height={15} />
                    Mark as In Transit
                  </Button>
                )}
                {/* Override Status — allows admins to manually correct the workflow state */}
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={() => setShowEditPanel(true)}>
                    <Icon icon="solar:pen-bold-duotone" height={15} className="mr-1.5" />
                    Edit Clinical Info
                  </Button>
                )}
                {referral.status !== false && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Icon icon="solar:pen-bold-duotone" height={15} className="mr-1.5" />
                        Override Status
                        <Icon icon="solar:alt-arrow-down-bold" height={14} className="ml-1.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[160px]">
                      {statuses.map((s) => (
                        <DropdownMenuItem
                          key={s.id}
                          onClick={() => id && updateReferralStatus(id, s.id)}
                          disabled={referral.latest_status?.id === s.id}
                        >
                          {s.description}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button variant="outline" size="sm" onClick={() => navigate('/module-2/referrals')}>
                  <Icon icon="solar:arrow-left-linear" height={16} className="mr-1.5" />
                  Back
                </Button>
              </div>
            </div>

            {/* Accepted-by bar — shown when receiver has accepted */}
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
                      Receiving Dept.
                    </p>
                    <p className="text-sm font-semibold text-success">
                      {referral.to_assignment_name}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Decline info bar — shown to requesting hospital when their referral was declined */}
            {referral.latest_status?.description === 'Declined' && referral.rejection_reason && (
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

        {/* ── Left column: clinical info ── */}
        <div className="lg:col-span-8 col-span-12 flex flex-col gap-6">
          {/* Patient Profile */}
          <CardBox>
            <SectionTitle icon="solar:user-id-bold-duotone" title="Patient Information" />
            <div className="grid grid-cols-12 gap-y-4 gap-x-6">
              <div className="lg:col-span-6 col-span-12">
                <Field
                  label="Referring Facility"
                  value={referral.from_assignment_name}
                  icon="solar:buildings-2-bold-duotone"
                />
              </div>
              <div className="lg:col-span-6 col-span-12">
                <Field
                  label="Referring To"
                  value={referral.to_assignment_name}
                  icon="solar:hospital-bold-duotone"
                />
              </div>
              <div className="lg:col-span-6 col-span-12">
                <Field
                  label="Name of Patient"
                  value={referral.patient_name}
                  icon="solar:user-bold-duotone"
                />
              </div>
              <div className="lg:col-span-2 col-span-4">
                <Field label="Patient ID" value={referral.patient_profile} />
              </div>
              <div className="lg:col-span-4 col-span-8">
                <Field
                  label="Date Created"
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
                      label="Contact No"
                      value={info.contact_no}
                      icon="solar:phone-bold-duotone"
                    />
                  </div>
                </div>
              </CardBox>

              {/* Chief Complaints + HPI + PE */}
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
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {info.pe ?? '—'}
                    </p>
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

              {/* ── OB/GYNE Section (only shown when OB fields are present) ── */}
              {(info.gravida ||
                info.lmp ||
                info.ie ||
                info.ultrasound_latest_date ||
                info.comorbidity ||
                info.lab_result) && (
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
                    </div>
                  </CardBox>

                  {/* IE Findings */}
                  <CardBox>
                    <SectionTitle
                      icon="solar:stethoscope-bold-duotone"
                      title="OB/GYNE — IE Findings"
                    />
                    <div className="grid grid-cols-12 gap-y-4 gap-x-6">
                      {info.ie && (
                        <div className="col-span-12">
                          <Field label="Internal Examination" value={info.ie} />
                        </div>
                      )}
                      <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                        <Field label="Dilatation" value={info.dilatation} />
                      </div>
                      <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                        <Field label="Effacement" value={info.effacement} />
                      </div>
                      <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                        <Field label="Station" value={info.station} />
                      </div>
                      <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                        <Field label="Presenting Part" value={info.presenting_part} />
                      </div>
                      {info.prom_hours && (
                        <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                          <Field label="PROM (Hours)" value={info.prom_hours} />
                        </div>
                      )}
                    </div>
                  </CardBox>

                  {/* Ultrasound */}
                  <CardBox>
                    <SectionTitle
                      icon="solar:soundwave-bold-duotone"
                      title="OB/GYNE — Ultrasound"
                    />
                    <div className="grid grid-cols-12 gap-y-4 gap-x-6">
                      {(info.ultrasound_1st_date || info.ultrasound_1st_aog) && (
                        <>
                          <div className="col-span-12">
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                              1st Ultrasound
                            </p>
                          </div>
                          <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                            <Field
                              label="Date"
                              value={
                                info.ultrasound_1st_date
                                  ? format(new Date(info.ultrasound_1st_date), 'MMM dd, yyyy')
                                  : null
                              }
                            />
                          </div>
                          <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                            <Field label="AOG by Ultrasound" value={info.ultrasound_1st_aog} />
                          </div>
                          <div className="col-span-12">
                            <Separator />
                          </div>
                        </>
                      )}
                      <div className="col-span-12">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          Latest Ultrasound
                        </p>
                      </div>
                      <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                        <Field
                          label="Date"
                          value={
                            info.ultrasound_latest_date
                              ? format(new Date(info.ultrasound_latest_date), 'MMM dd, yyyy')
                              : null
                          }
                        />
                      </div>
                      <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                        <Field label="EFW" value={info.ultrasound_efw} />
                      </div>
                      <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                        <Field label="Presentation" value={info.ultrasound_presentation} />
                      </div>
                      {info.ultrasound_impression && (
                        <div className="col-span-12">
                          <Field label="Impression" value={info.ultrasound_impression} />
                        </div>
                      )}
                    </div>
                  </CardBox>

                  {/* Comorbidities & Surgical History */}
                  <CardBox>
                    <SectionTitle
                      icon="solar:hospital-bold-duotone"
                      title="OB/GYNE — Comorbidities & Surgical History"
                    />
                    <div className="flex flex-col gap-4">
                      <Field label="Comorbidities" value={info.comorbidity} />
                      <Field label="Previous Surgeries" value={info.previous_surgeries} />
                      <Field
                        label="Previous CS (When / Where / Indication)"
                        value={info.previous_cs}
                      />
                    </div>
                  </CardBox>

                  {/* Additional Diagnostics */}
                  <CardBox>
                    <SectionTitle
                      icon="solar:document-add-bold-duotone"
                      title="OB/GYNE — Additional Diagnostics"
                    />
                    <div className="flex flex-col gap-4">
                      <Field label="Lab Result" value={info.lab_result} />
                      <Field label="X-Ray" value={info.xray} />
                      <Field label="Other Diagnostics" value={info.other_diagnostics} />
                    </div>
                  </CardBox>
                </>
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
                        info.antigen_date
                          ? format(new Date(info.antigen_date), 'MMM dd, yyyy')
                          : null
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

        {/* ── Right column: sidebar ── */}
        <div className="lg:col-span-4 col-span-12 flex flex-col gap-6">
          {/* Referral History timeline */}
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

          {info && (
            <>
              {/* Diagnostics CRUD */}
              <CardBox>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon
                        icon="solar:test-tube-bold-duotone"
                        height={16}
                        className="text-primary"
                      />
                    </div>
                    <h3 className="text-base font-semibold">Diagnostics</h3>
                  </div>
                  {canEdit && (
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
                        onChange={(e) =>
                          setDiagForm((f) => ({ ...f, diagnostics: e.target.value }))
                        }
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
                            onClick={() => id && deleteOutgoingDiagnostic(d.id, id)}
                          >
                            <Icon icon="solar:trash-bin-minimalistic-linear" height={13} />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardBox>

              {/* Vaccination CRUD */}
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
                  {canEdit && (
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
                            onClick={() => id && deleteOutgoingVaccination(v.id, id)}
                          >
                            <Icon icon="solar:trash-bin-minimalistic-linear" height={13} />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardBox>
            </>
          )}
        </div>
      </div>

      {/* Edit Clinical Info Panel */}
      <EditClinicalInfoPanel
        open={showEditPanel}
        referral={referral}
        onClose={() => setShowEditPanel(false)}
        onConfirm={(updated) => {
          if (id) updateReferralInfo(id, updated);
        }}
        addDiag={(d) => id && addOutgoingDiagnostic(id, d)}
        deleteDiag={(diagId) => id && deleteOutgoingDiagnostic(diagId, id)}
        updateDiagAttachment={(diagId, atts) =>
          id && updateOutgoingDiagnosticAttachment(diagId, id, atts)
        }
        addVac={(v) => id && addOutgoingVaccination(id, v)}
        deleteVac={(vacId) => id && deleteOutgoingVaccination(vacId, id)}
        updateVacAttachment={(vacId, atts) =>
          id && updateOutgoingVaccinationAttachment(vacId, id, atts)
        }
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
    </>
  );
};

export default ReferralDetail;
