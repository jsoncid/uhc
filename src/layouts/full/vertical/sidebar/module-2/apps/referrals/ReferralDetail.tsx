import { useParams, useNavigate } from 'react-router';
import { format } from 'date-fns';
import { Icon } from '@iconify/react';
import { getReferralById } from '../../data/referral-data';
import CardBox from 'src/components/shared/CardBox';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { Separator } from 'src/components/ui/separator';

const STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-lightwarning text-warning',
  Accepted: 'bg-lightsuccess text-success',
  'In Transit': 'bg-lightinfo text-info',
  Arrived: 'bg-lightprimary text-primary',
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
  const referral = getReferralById(id ?? '');
  const info = referral?.referral_info;
  const history = referral?.history ?? [];

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
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={`text-sm px-3 py-1 font-semibold ${STATUS_STYLES[referral.latest_status?.description ?? ''] ?? 'bg-lightprimary text-primary'}`}
              >
                {referral.latest_status?.description ?? 'No Status'}
              </Badge>
              <Button variant="outline" size="sm" onClick={() => navigate('/module-2/referrals')}>
                <Icon icon="solar:arrow-left-linear" height={16} className="mr-1.5" />
                Back
              </Button>
            </div>
          </div>
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
                  <SectionTitle icon="solar:soundwave-bold-duotone" title="OB/GYNE — Ultrasound" />
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
                    <Field label="Comorbidity" value={info.comorbidity} />
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
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
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
                    {h.to_assignment_name && (
                      <p className="text-sm font-medium">{h.to_assignment_name}</p>
                    )}
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
            {/* Diagnostics */}
            {info.diagnostics && info.diagnostics.filter((d) => d.status).length > 0 && (
              <CardBox>
                <SectionTitle icon="solar:test-tube-bold-duotone" title="Diagnostics" />
                <div className="flex flex-col gap-3">
                  {info.diagnostics
                    .filter((d) => d.status)
                    .map((d) => (
                      <div key={d.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon
                            icon="solar:document-text-bold-duotone"
                            height={15}
                            className="text-primary"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{d.diagnostics}</p>
                          {d.date && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(new Date(d.date), 'MMM dd, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardBox>
            )}

            {/* Vaccinations */}
            {info.vaccinations && info.vaccinations.filter((v) => v.status).length > 0 && (
              <CardBox>
                <SectionTitle icon="solar:shield-check-bold-duotone" title="Vaccination History" />
                <div className="flex flex-col gap-3">
                  {info.vaccinations
                    .filter((v) => v.status)
                    .map((v) => (
                      <div key={v.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="w-7 h-7 rounded-md bg-success/10 flex items-center justify-center flex-shrink-0">
                          <Icon
                            icon="solar:shield-check-bold-duotone"
                            height={15}
                            className="text-success"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{v.description}</p>
                          {v.date && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(new Date(v.date), 'MMM dd, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardBox>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReferralDetail;
