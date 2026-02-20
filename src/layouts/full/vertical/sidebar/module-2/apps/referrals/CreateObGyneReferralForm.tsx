import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router';
import { Icon } from '@iconify/react';
import { ReferralContext, ReferralContextType } from '../../context/ReferralContext';
import { ReferralType, ReferralInfo } from '../../types/referral';
import { supabaseM3 } from 'src/lib/supabase';
import { useAuthStore } from 'src/stores/useAuthStore';
import { assignmentService } from 'src/services/assignmentService';
import { Database } from 'src/lib/supabase';
import CardBox from 'src/components/shared/CardBox';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Textarea } from 'src/components/ui/textarea';
import { Separator } from 'src/components/ui/separator';
import { Badge } from 'src/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from 'src/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select';

// ── Section title helper ──────────────────────────────────────────────────────
const SectionTitle = ({ icon, title }: { icon: string; title: string }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
      <Icon icon={icon} height={16} className="text-primary" />
    </div>
    <h3 className="text-base font-semibold">{title}</h3>
  </div>
);

// ── Read-only auto-filled field ───────────────────────────────────────────────
const AutoField = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <div className="h-9 px-3 flex items-center rounded-md bg-muted/50 border border-border text-sm font-medium">
      {value || <span className="text-muted-foreground italic">—</span>}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
type AssignmentRow = Database['public']['Tables']['assignment']['Row'];
type PatientRow = Database['module3']['Tables']['patient_profile']['Row'];

const CreateObGyneReferralForm = () => {
  const { addReferral }: ReferralContextType = useContext(ReferralContext);
  const navigate = useNavigate();
  const { userAssignmentId, userAssignmentName } = useAuthStore();

  // ── Assignment dropdown ───────────────────────────────────────────────────
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [toAssignmentId, setToAssignmentId] = useState('');
  const [toAssignmentName, setToAssignmentName] = useState('');

  useEffect(() => {
    assignmentService
      .getAllAssignments()
      .then((rows) => setAssignments(rows.filter((a) => a.id !== userAssignmentId)))
      .catch(console.error);
  }, [userAssignmentId]);

  // ── Patient picker ────────────────────────────────────────────────────────
  const [confirmedPatientId, setConfirmedPatientId] = useState('');
  const [patientPickerOpen, setPatientPickerOpen] = useState(false);
  const [patientList, setPatientList] = useState<PatientRow[]>([]);
  const [patientListLoading, setPatientListLoading] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');

  // ── Auto-filled patient details (locked after confirm) ───────────────────
  const [facilityAddress, setFacilityAddress] = useState('');
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [completeAddress, setCompleteAddress] = useState('');

  // ── Standard referral fields ──────────────────────────────────────────────
  const [reasonReferral, setReasonReferral] = useState('');
  const [rtpcr, setRtpcr] = useState('');
  const [rtpcrDate, setRtpcrDate] = useState('');
  const [antigen, setAntigen] = useState('');
  const [antigenDate, setAntigenDate] = useState('');
  const [exposureCovid, setExposureCovid] = useState('');
  const [chiefComplaints, setChiefComplaints] = useState('');
  const [hpi, setHpi] = useState('');
  const [pe, setPe] = useState('');
  const [bp, setBp] = useState('');
  const [temp, setTemp] = useState('');
  const [hr, setHr] = useState('');
  const [rr, setRr] = useState('');
  const [o2Sat, setO2Sat] = useState('');
  const [o2Req, setO2Req] = useState('');
  const [gcs, setGcs] = useState('');
  const [eye, setEye] = useState('');
  const [vision, setVision] = useState('');
  const [motor, setMotor] = useState('');
  const [medications, setMedications] = useState('');
  const [referringDoctor, setReferringDoctor] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [vaccinations, setVaccinations] = useState([{ description: '', date: '' }]);

  // ── OB/GYNE fields ────────────────────────────────────────────────────────
  // Obstetric History
  const [gravida, setGravida] = useState('');
  const [parity, setParity] = useState('');
  const [menarche, setMenarche] = useState('');
  // Current Pregnancy
  const [lmp, setLmp] = useState('');
  const [aog, setAog] = useState('');
  const [edc, setEdc] = useState('');
  const [fh, setFh] = useState('');
  const [fht, setFht] = useState('');
  // IE Findings
  const [ie, setIe] = useState('');
  const [dilatation, setDilatation] = useState('');
  const [effacement, setEffacement] = useState('');
  const [station, setStation] = useState('');
  const [presentingPart, setPresentingPart] = useState('');
  const [promHours, setPromHours] = useState('');
  // Ultrasound — 1st
  const [us1Date, setUs1Date] = useState('');
  const [us1Aog, setUs1Aog] = useState('');
  // Ultrasound — Latest
  const [usLatestDate, setUsLatestDate] = useState('');
  const [usLatestEfw, setUsLatestEfw] = useState('');
  const [usLatestPresentation, setUsLatestPresentation] = useState('');
  const [usLatestImpression, setUsLatestImpression] = useState('');
  // Comorbidities & Surgical History
  const [comorbidity, setComorbidity] = useState('');
  const [previousSurgeries, setPreviousSurgeries] = useState('');
  const [previousCs, setPreviousCs] = useState('');
  // Additional Diagnostics
  const [labResult, setLabResult] = useState('');
  const [xray, setXray] = useState('');
  const [otherDiagnostics, setOtherDiagnostics] = useState('');

  // ── Vaccination helpers ───────────────────────────────────────────────────
  const addVaccinationRow = () => setVaccinations((p) => [...p, { description: '', date: '' }]);
  const removeVaccinationRow = (i: number) => setVaccinations((p) => p.filter((_, x) => x !== i));
  const updateVaccination = (i: number, field: 'description' | 'date', val: string) =>
    setVaccinations((p) => p.map((v, x) => (x === i ? { ...v, [field]: val } : v)));

  // ── Patient picker handlers ───────────────────────────────────────────────
  const openPatientPicker = async () => {
    setPatientPickerOpen(true);
    setPatientSearch('');
    setPatientListLoading(true);
    try {
      const { data } = await supabaseM3
        .from('patient_profile')
        .select('id, first_name, middle_name, last_name, sex, birth_date')
        .order('last_name', { ascending: true });
      setPatientList((data as PatientRow[]) ?? []);
    } finally {
      setPatientListLoading(false);
    }
  };

  const selectPatient = (p: PatientRow) => {
    const fullName = [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(' ');
    const birthYear = p.birth_date ? new Date(p.birth_date).getFullYear() : null;
    const computedAge = birthYear ? new Date().getFullYear() - birthYear : '';
    setConfirmedPatientId(p.id);
    setPatientName(fullName);
    setAge(String(computedAge));
    setSex(p.sex ?? '');
    setBirthDate(p.birth_date ?? '');
    setCompleteAddress('');
    setPatientPickerOpen(false);
  };

  const handleClearPatient = () => {
    setConfirmedPatientId('');
    setFacilityAddress('');
    setPatientName('');
    setAge('');
    setSex('');
    setBirthDate('');
    setCompleteAddress('');
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedPatientId) {
      alert('Please confirm a Patient ID first.');
      return;
    }
    if (!reasonReferral || !referringDoctor) {
      alert('Reason for Referral and Referring Doctor are required.');
      return;
    }

    const newId = `ref-${Date.now()}`;
    const infoId = `ri-${Date.now()}`;
    const now = new Date().toISOString();

    const newInfo: ReferralInfo = {
      id: infoId,
      created_at: now,
      referral: newId,
      reason_referral: reasonReferral,
      referring_doctor: referringDoctor,
      contact_no: contactNo || null,
      chief_complaints: chiefComplaints || null,
      medications: medications || null,
      history_present_illness: hpi || null,
      pe: pe || null,
      blood_pressure: bp || null,
      temperature: temp || null,
      heart_rate: hr || null,
      respiratory_rate: rr || null,
      o2_sat: o2Sat || null,
      o2_requirement: o2Req || null,
      gcs: gcs || null,
      eye: eye || null,
      vision: vision || null,
      motor: motor || null,
      rtpcr: rtpcr || null,
      rtpcr_date: rtpcrDate || null,
      antigen: antigen || null,
      antigen_date: antigenDate || null,
      exposure_covid: exposureCovid || null,
      // OB/GYNE
      gravida: gravida || null,
      parity: parity || null,
      menarche: menarche || null,
      lmp: lmp || null,
      aog: aog || null,
      edc: edc || null,
      fh: fh || null,
      fht: fht || null,
      ie: ie || null,
      dilatation: dilatation || null,
      effacement: effacement || null,
      station: station || null,
      presenting_part: presentingPart || null,
      prom_hours: promHours || null,
      ultrasound_1st_date: us1Date || null,
      ultrasound_1st_aog: us1Aog || null,
      ultrasound_latest_date: usLatestDate || null,
      ultrasound_efw: usLatestEfw || null,
      ultrasound_presentation: usLatestPresentation || null,
      ultrasound_impression: usLatestImpression || null,
      comorbidity: comorbidity || null,
      previous_surgeries: previousSurgeries || null,
      previous_cs: previousCs || null,
      lab_result: labResult || null,
      xray: xray || null,
      other_diagnostics: otherDiagnostics || null,
      diagnostics: [],
      vaccinations: vaccinations
        .filter((v) => v.description)
        .map((v, i) => ({
          id: `vac-${Date.now()}-${i}`,
          created_at: now,
          referral_info: infoId,
          description: v.description,
          date: v.date || null,
          status: true,
        })),
    };

    const newReferral: ReferralType = {
      id: newId,
      created_at: now,
      status: true,
      patient_profile: confirmedPatientId,
      patient_name: patientName,
      from_assignment: userAssignmentId,
      from_assignment_name: userAssignmentName || undefined,
      to_assignment: toAssignmentId || null,
      to_assignment_name: toAssignmentName || undefined,
      latest_status: undefined,
      referral_info: newInfo,
      history: [],
    };

    await addReferral(newReferral);
    navigate('/module-2/referrals');
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetForm = () => {
    handleClearPatient();
    setReasonReferral('');
    setRtpcr('');
    setRtpcrDate('');
    setAntigen('');
    setAntigenDate('');
    setExposureCovid('');
    setChiefComplaints('');
    setHpi('');
    setPe('');
    setBp('');
    setTemp('');
    setHr('');
    setRr('');
    setO2Sat('');
    setO2Req('');
    setGcs('');
    setEye('');
    setVision('');
    setMotor('');
    setToAssignmentId('');
    setToAssignmentName('');
    setMedications('');
    setReferringDoctor('');
    setContactNo('');
    setVaccinations([{ description: '', date: '' }]);
    // OB/GYNE
    setGravida('');
    setParity('');
    setMenarche('');
    setLmp('');
    setAog('');
    setEdc('');
    setFh('');
    setFht('');
    setIe('');
    setDilatation('');
    setEffacement('');
    setStation('');
    setPresentingPart('');
    setPromHours('');
    setUs1Date('');
    setUs1Aog('');
    setUsLatestDate('');
    setUsLatestEfw('');
    setUsLatestPresentation('');
    setUsLatestImpression('');
    setComorbidity('');
    setPreviousSurgeries('');
    setPreviousCs('');
    setLabResult('');
    setXray('');
    setOtherDiagnostics('');
  };

  const patientConfirmed = !!confirmedPatientId;
  const filteredPatients = patientList.filter((p) => {
    if (!patientSearch.trim()) return true;
    const q = patientSearch.toLowerCase();
    const name = [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(' ').toLowerCase();
    return name.includes(q);
  });

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-12 gap-6">
        {/* ── Section 1: Patient Information ───────────────────────────────── */}
        <div className="col-span-12">
          <CardBox>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle icon="solar:user-id-bold-duotone" title="Patient Information" />
              <Badge
                variant="outline"
                className={
                  patientConfirmed
                    ? 'bg-lightsuccess text-success text-xs'
                    : 'bg-lightwarning text-warning text-xs'
                }
              >
                <Icon
                  icon={
                    patientConfirmed
                      ? 'solar:check-circle-bold-duotone'
                      : 'solar:database-bold-duotone'
                  }
                  height={12}
                  className="mr-1"
                />
                {patientConfirmed
                  ? `Patient Confirmed: ${patientName}`
                  : 'Select a Patient to Auto-fill'}
              </Badge>
            </div>

            {/* Patient picker */}
            <div className="flex gap-3 items-end mb-6">
              {!patientConfirmed ? (
                <Button type="button" onClick={openPatientPicker}>
                  <Icon
                    icon="solar:users-group-rounded-bold-duotone"
                    height={15}
                    className="mr-1.5"
                  />
                  Select Patient
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={handleClearPatient}>
                  <Icon icon="solar:close-circle-linear" height={15} className="mr-1.5" />
                  Change Patient
                </Button>
              )}
            </div>

            {/* Patient picker dialog */}
            <Dialog open={patientPickerOpen} onOpenChange={setPatientPickerOpen}>
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Select Patient</DialogTitle>
                  <DialogDescription>
                    Choose a patient from the list. Their details will be auto-filled into the form.
                  </DialogDescription>
                </DialogHeader>
                <div className="relative mb-2">
                  <Icon
                    icon="solar:magnifer-linear"
                    height={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    placeholder="Search by name..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-border rounded-md border border-border">
                  {patientListLoading ? (
                    <div className="flex justify-center items-center py-10 gap-2 text-muted-foreground">
                      <Icon
                        icon="solar:spinner-bold-duotone"
                        height={20}
                        className="animate-spin"
                      />
                      <span className="text-sm">Loading patients...</span>
                    </div>
                  ) : filteredPatients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                      <Icon icon="solar:user-cross-bold-duotone" height={28} className="mb-2" />
                      <p className="text-sm">No patients found.</p>
                    </div>
                  ) : (
                    filteredPatients.map((p) => {
                      const name = [p.first_name, p.middle_name, p.last_name]
                        .filter(Boolean)
                        .join(' ');
                      const birthYear = p.birth_date ? new Date(p.birth_date).getFullYear() : null;
                      const rowAge = birthYear ? new Date().getFullYear() - birthYear : '—';
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => selectPatient(p)}
                          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                        >
                          <div>
                            <p className="text-sm font-medium">{name}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.sex} · Age {rowAge} · Born {p.birth_date}
                            </p>
                          </div>
                          <Icon
                            icon="solar:arrow-right-linear"
                            height={14}
                            className="text-muted-foreground"
                          />
                        </button>
                      );
                    })
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Auto-filled patient details */}
            {patientConfirmed ? (
              <div className="grid grid-cols-12 gap-4">
                <div className="lg:col-span-6 col-span-12">
                  <AutoField label="Referring Facility" value={userAssignmentName || ''} />
                </div>
                <div className="lg:col-span-6 col-span-12">
                  <AutoField label="Address" value={facilityAddress} />
                </div>
                <div className="lg:col-span-6 col-span-12">
                  <AutoField label="Name of Patient" value={patientName} />
                </div>
                <div className="lg:col-span-2 col-span-4">
                  <AutoField label="Age" value={age} />
                </div>
                <div className="lg:col-span-2 col-span-4">
                  <AutoField label="Sex" value={sex} />
                </div>
                <div className="lg:col-span-2 col-span-4">
                  <AutoField label="Birth Date" value={birthDate} />
                </div>
                <div className="col-span-12">
                  <AutoField label="Complete Address" value={completeAddress} />
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
                <Icon
                  icon="solar:user-search-bold-duotone"
                  height={32}
                  className="text-muted-foreground mx-auto mb-2"
                />
                <p className="text-sm text-muted-foreground">
                  Click <strong>Select Patient</strong> above to browse and choose a patient. Their
                  details will be auto-filled into the form.
                </p>
              </div>
            )}
          </CardBox>
        </div>

        {/* All remaining sections shown only after patient is confirmed */}
        {patientConfirmed && (
          <>
            {/* ── Section 2: Referral Information & COVID ──────────────────── */}
            <div className="col-span-12">
              <CardBox>
                <SectionTitle
                  icon="solar:document-medicine-bold-duotone"
                  title="Referral Information"
                />
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12">
                    <Label htmlFor="referringTo">Referring To (Destination Facility)</Label>
                    <Select
                      value={toAssignmentId}
                      onValueChange={(val) => {
                        setToAssignmentId(val);
                        setToAssignmentName(
                          assignments.find((a) => a.id === val)?.description ?? '',
                        );
                      }}
                    >
                      <SelectTrigger id="referringTo">
                        <SelectValue placeholder="Select destination facility..." />
                      </SelectTrigger>
                      <SelectContent>
                        {assignments.length === 0 ? (
                          <SelectItem value="__none" disabled>
                            No facilities available
                          </SelectItem>
                        ) : (
                          assignments.map((a) => (
                            <SelectItem key={a.id} value={a.id}>
                              {a.description}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-12">
                    <Label htmlFor="reasonReferral">
                      Reason for Referral (specify) <span className="text-error">*</span>
                    </Label>
                    <Textarea
                      id="reasonReferral"
                      value={reasonReferral}
                      onChange={(e) => setReasonReferral(e.target.value)}
                      placeholder="Specify the reason for referral"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="col-span-12">
                    <Separator />
                  </div>
                  <div className="lg:col-span-4 col-span-6">
                    <Label>RTPCR</Label>
                    <Input
                      value={rtpcr}
                      onChange={(e) => setRtpcr(e.target.value)}
                      placeholder="Positive / Negative / N/A"
                    />
                  </div>
                  <div className="lg:col-span-2 col-span-6">
                    <Label>Date Taken</Label>
                    <Input
                      type="date"
                      value={rtpcrDate}
                      onChange={(e) => setRtpcrDate(e.target.value)}
                    />
                  </div>
                  <div className="lg:col-span-4 col-span-6">
                    <Label>Antigen</Label>
                    <Input
                      value={antigen}
                      onChange={(e) => setAntigen(e.target.value)}
                      placeholder="Positive / Negative / N/A"
                    />
                  </div>
                  <div className="lg:col-span-2 col-span-6">
                    <Label>Date Taken</Label>
                    <Input
                      type="date"
                      value={antigenDate}
                      onChange={(e) => setAntigenDate(e.target.value)}
                    />
                  </div>
                  <div className="col-span-12">
                    <Label>Exposure to COVID</Label>
                    <Input
                      value={exposureCovid}
                      onChange={(e) => setExposureCovid(e.target.value)}
                      placeholder="e.g. None, Household contact, Community exposure..."
                    />
                  </div>
                </div>
              </CardBox>
            </div>

            {/* ── Section 3: Vaccination Record ────────────────────────────── */}
            <div className="col-span-12">
              <CardBox>
                <div className="flex items-center justify-between mb-4">
                  <SectionTitle
                    icon="solar:shield-check-bold-duotone"
                    title="Vaccination Record with Dates"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addVaccinationRow}>
                    <Icon icon="solar:add-circle-outline" height={15} className="mr-1.5" />
                    Add Row
                  </Button>
                </div>
                <div className="flex flex-col gap-3">
                  {vaccinations.map((vac, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-3 items-end">
                      <div className="lg:col-span-7 col-span-12">
                        <Label className="text-xs text-muted-foreground mb-1 block">
                          Vaccine / Description
                        </Label>
                        <Input
                          value={vac.description}
                          onChange={(e) => updateVaccination(idx, 'description', e.target.value)}
                          placeholder="e.g. COVID-19 – Pfizer (2 doses), Influenza..."
                        />
                      </div>
                      <div className="lg:col-span-4 col-span-10">
                        <Label className="text-xs text-muted-foreground mb-1 block">Date</Label>
                        <Input
                          type="date"
                          value={vac.date}
                          onChange={(e) => updateVaccination(idx, 'date', e.target.value)}
                        />
                      </div>
                      <div className="col-span-1 flex items-end pb-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-error hover:bg-error/10"
                          onClick={() => removeVaccinationRow(idx)}
                          disabled={vaccinations.length === 1}
                        >
                          <Icon icon="solar:trash-bin-minimalistic-linear" height={15} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBox>
            </div>

            {/* ── Section 4: Chief Complaints / HPI / PE ───────────────────── */}
            <div className="lg:col-span-6 col-span-12">
              <CardBox className="h-full">
                <SectionTitle icon="solar:notes-bold-duotone" title="Chief Complaints" />
                <Textarea
                  value={chiefComplaints}
                  onChange={(e) => setChiefComplaints(e.target.value)}
                  placeholder="Enter chief complaints"
                  rows={4}
                />
              </CardBox>
            </div>
            <div className="lg:col-span-6 col-span-12">
              <CardBox className="h-full">
                <SectionTitle
                  icon="solar:medical-kit-bold-duotone"
                  title="History of Present Illness (HPI)"
                />
                <Textarea
                  value={hpi}
                  onChange={(e) => setHpi(e.target.value)}
                  placeholder="Enter history of present illness"
                  rows={4}
                />
              </CardBox>
            </div>
            <div className="col-span-12">
              <CardBox>
                <SectionTitle icon="solar:body-bold-duotone" title="Physical Examination (PE)" />
                <Textarea
                  value={pe}
                  onChange={(e) => setPe(e.target.value)}
                  placeholder="Enter physical examination findings"
                  rows={4}
                />
              </CardBox>
            </div>

            {/* ── Section 5: Vital Signs & GCS ─────────────────────────────── */}
            <div className="col-span-12">
              <CardBox>
                <SectionTitle
                  icon="solar:heart-pulse-bold-duotone"
                  title="General Survey: Vital Signs & GCS"
                />
                <div className="grid grid-cols-12 gap-4">
                  <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                    <Label>BP (Blood Pressure)</Label>
                    <Input
                      value={bp}
                      onChange={(e) => setBp(e.target.value)}
                      placeholder="e.g. 120/80 mmHg"
                    />
                  </div>
                  <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                    <Label>Temp (Temperature)</Label>
                    <Input
                      value={temp}
                      onChange={(e) => setTemp(e.target.value)}
                      placeholder="e.g. 36.5 °C"
                    />
                  </div>
                  <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                    <Label>HR (Heart Rate)</Label>
                    <Input
                      value={hr}
                      onChange={(e) => setHr(e.target.value)}
                      placeholder="e.g. 80 bpm"
                    />
                  </div>
                  <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                    <Label>RR (Respiratory Rate)</Label>
                    <Input
                      value={rr}
                      onChange={(e) => setRr(e.target.value)}
                      placeholder="e.g. 18 breaths/min"
                    />
                  </div>
                  <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                    <Label>O2 Sat</Label>
                    <Input
                      value={o2Sat}
                      onChange={(e) => setO2Sat(e.target.value)}
                      placeholder="e.g. 98%"
                    />
                  </div>
                  <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                    <Label>O2 Requiring</Label>
                    <Input
                      value={o2Req}
                      onChange={(e) => setO2Req(e.target.value)}
                      placeholder="e.g. Room air, 2 LPM NC"
                    />
                  </div>
                  <div className="col-span-12">
                    <Separator />
                  </div>
                  <div className="col-span-12">
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      GCS (Glasgow Coma Scale)
                    </p>
                  </div>
                  <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                    <Label>GCS Total</Label>
                    <Input
                      value={gcs}
                      onChange={(e) => setGcs(e.target.value)}
                      placeholder="e.g. 15"
                    />
                  </div>
                  <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                    <Label>Eyes</Label>
                    <Input
                      value={eye}
                      onChange={(e) => setEye(e.target.value)}
                      placeholder="e.g. 4"
                    />
                  </div>
                  <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                    <Label>Vision / Verbal</Label>
                    <Input
                      value={vision}
                      onChange={(e) => setVision(e.target.value)}
                      placeholder="e.g. 5"
                    />
                  </div>
                  <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                    <Label>Motor</Label>
                    <Input
                      value={motor}
                      onChange={(e) => setMotor(e.target.value)}
                      placeholder="e.g. 6"
                    />
                  </div>
                </div>
              </CardBox>
            </div>

            {/* ── Section 6: Diagnostics & Medications ─────────────────────── */}
            <div className="lg:col-span-6 col-span-12">
              <CardBox className="h-full">
                <SectionTitle icon="solar:test-tube-bold-duotone" title="Recent Diagnostic Tests" />
                <Textarea
                  readOnly
                  className="text-muted-foreground text-sm bg-muted/30"
                  placeholder="Recent diagnostic results will appear here after upload (e.g., CBC, ECG, X-Ray)."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  * Upload attachments via the referral detail page after creation.
                </p>
              </CardBox>
            </div>
            <div className="lg:col-span-6 col-span-12">
              <CardBox className="h-full">
                <SectionTitle icon="solar:pill-bold-duotone" title="Medications" />
                <Textarea
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  placeholder="e.g. Aspirin 80mg OD, Amlodipine 5mg OD, Metformin 500mg BID..."
                  rows={4}
                />
              </CardBox>
            </div>

            {/* ════════════════════════════════════════════════════════════════
                OB/GYNE SECTION
            ════════════════════════════════════════════════════════════════ */}

            {/* ── OB Section 1: Obstetric History ──────────────────────────── */}
            <div className="col-span-12">
              <CardBox>
                <SectionTitle
                  icon="solar:heart-angle-bold-duotone"
                  title="OB/GYNE — Obstetric History"
                />
                <div className="grid grid-cols-12 gap-4">
                  <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                    <Label htmlFor="gravida">Gravida</Label>
                    <Input
                      id="gravida"
                      value={gravida}
                      onChange={(e) => setGravida(e.target.value)}
                      placeholder="e.g. G3"
                    />
                  </div>
                  <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                    <Label htmlFor="parity">Parity (TPAL)</Label>
                    <Input
                      id="parity"
                      value={parity}
                      onChange={(e) => setParity(e.target.value)}
                      placeholder="e.g. P2 (2-0-0-2)"
                    />
                  </div>
                  <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                    <Label htmlFor="menarche">Menarche</Label>
                    <Input
                      id="menarche"
                      value={menarche}
                      onChange={(e) => setMenarche(e.target.value)}
                      placeholder="e.g. 12 years old, regular"
                    />
                  </div>
                </div>
              </CardBox>
            </div>

            {/* ── OB Section 2: Current Pregnancy ──────────────────────────── */}
            <div className="col-span-12">
              <CardBox>
                <SectionTitle
                  icon="solar:calendar-bold-duotone"
                  title="OB/GYNE — Current Pregnancy"
                />
                <div className="grid grid-cols-12 gap-4">
                  <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                    <Label htmlFor="lmp">LMP (Last Menstrual Period)</Label>
                    <Input
                      id="lmp"
                      type="date"
                      value={lmp}
                      onChange={(e) => setLmp(e.target.value)}
                    />
                  </div>
                  <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                    <Label htmlFor="aog">AOG (Age of Gestation)</Label>
                    <Input
                      id="aog"
                      value={aog}
                      onChange={(e) => setAog(e.target.value)}
                      placeholder="e.g. 36 weeks + 2 days"
                    />
                  </div>
                  <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                    <Label htmlFor="edc">EDC (Expected Date of Confinement)</Label>
                    <Input
                      id="edc"
                      type="date"
                      value={edc}
                      onChange={(e) => setEdc(e.target.value)}
                    />
                  </div>
                  <div className="col-span-12">
                    <Separator />
                  </div>
                  <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                    <Label htmlFor="fh">FH (Fundal Height)</Label>
                    <Input
                      id="fh"
                      value={fh}
                      onChange={(e) => setFh(e.target.value)}
                      placeholder="e.g. 34 cm"
                    />
                  </div>
                  <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                    <Label htmlFor="fht">FHT (Fetal Heart Tone)</Label>
                    <Input
                      id="fht"
                      value={fht}
                      onChange={(e) => setFht(e.target.value)}
                      placeholder="e.g. 148 bpm"
                    />
                  </div>
                </div>
              </CardBox>
            </div>

            {/* ── OB Section 3: Internal Examination (IE) Findings ─────────── */}
            <div className="col-span-12">
              <CardBox>
                <SectionTitle
                  icon="solar:stethoscope-bold-duotone"
                  title="OB/GYNE — Internal Examination (IE) Findings"
                />
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12">
                    <Label htmlFor="ie">IE (Internal Examination)</Label>
                    <Textarea
                      id="ie"
                      value={ie}
                      onChange={(e) => setIe(e.target.value)}
                      placeholder="Describe internal examination findings"
                      rows={3}
                    />
                  </div>
                  <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                    <Label htmlFor="dilatation">Dilatation</Label>
                    <Input
                      id="dilatation"
                      value={dilatation}
                      onChange={(e) => setDilatation(e.target.value)}
                      placeholder="e.g. 4 cm"
                    />
                  </div>
                  <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                    <Label htmlFor="effacement">Effacement</Label>
                    <Input
                      id="effacement"
                      value={effacement}
                      onChange={(e) => setEffacement(e.target.value)}
                      placeholder="e.g. 80%"
                    />
                  </div>
                  <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                    <Label htmlFor="station">Station</Label>
                    <Input
                      id="station"
                      value={station}
                      onChange={(e) => setStation(e.target.value)}
                      placeholder="e.g. -1"
                    />
                  </div>
                  <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                    <Label htmlFor="presentingPart">Presenting Part</Label>
                    <Input
                      id="presentingPart"
                      value={presentingPart}
                      onChange={(e) => setPresentingPart(e.target.value)}
                      placeholder="e.g. Cephalic, Breech..."
                    />
                  </div>
                  <div className="col-span-12">
                    <Separator />
                  </div>
                  <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                    <Label htmlFor="promHours">PROM — How Many Hours</Label>
                    <Input
                      id="promHours"
                      value={promHours}
                      onChange={(e) => setPromHours(e.target.value)}
                      placeholder="e.g. 6 hours (if applicable)"
                    />
                  </div>
                </div>
              </CardBox>
            </div>

            {/* ── OB Section 4: Ultrasound ──────────────────────────────────── */}
            <div className="col-span-12">
              <CardBox>
                <SectionTitle icon="solar:soundwave-bold-duotone" title="OB/GYNE — Ultrasound" />
                <div className="grid grid-cols-12 gap-4">
                  {/* 1st Ultrasound */}
                  <div className="col-span-12">
                    <p className="text-sm font-semibold text-muted-foreground mb-2">
                      1st Ultrasound
                    </p>
                  </div>
                  <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                    <Label htmlFor="us1Date">Date</Label>
                    <Input
                      id="us1Date"
                      type="date"
                      value={us1Date}
                      onChange={(e) => setUs1Date(e.target.value)}
                    />
                  </div>
                  <div className="lg:col-span-4 sm:col-span-6 col-span-12">
                    <Label htmlFor="us1Aog">AOG by Ultrasound</Label>
                    <Input
                      id="us1Aog"
                      value={us1Aog}
                      onChange={(e) => setUs1Aog(e.target.value)}
                      placeholder="e.g. 8 weeks + 3 days"
                    />
                  </div>
                  <div className="col-span-12">
                    <Separator />
                  </div>
                  {/* Latest Ultrasound */}
                  <div className="col-span-12">
                    <p className="text-sm font-semibold text-muted-foreground mb-2">
                      Latest Ultrasound
                    </p>
                  </div>
                  <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                    <Label htmlFor="usLatestDate">Date</Label>
                    <Input
                      id="usLatestDate"
                      type="date"
                      value={usLatestDate}
                      onChange={(e) => setUsLatestDate(e.target.value)}
                    />
                  </div>
                  <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                    <Label htmlFor="usLatestEfw">EFW (Estimated Fetal Weight)</Label>
                    <Input
                      id="usLatestEfw"
                      value={usLatestEfw}
                      onChange={(e) => setUsLatestEfw(e.target.value)}
                      placeholder="e.g. 2.8 kg"
                    />
                  </div>
                  <div className="lg:col-span-3 sm:col-span-6 col-span-12">
                    <Label htmlFor="usLatestPresentation">Presentation</Label>
                    <Input
                      id="usLatestPresentation"
                      value={usLatestPresentation}
                      onChange={(e) => setUsLatestPresentation(e.target.value)}
                      placeholder="e.g. Cephalic, Breech..."
                    />
                  </div>
                  <div className="col-span-12">
                    <Label htmlFor="usLatestImpression">Impression</Label>
                    <Textarea
                      id="usLatestImpression"
                      value={usLatestImpression}
                      onChange={(e) => setUsLatestImpression(e.target.value)}
                      placeholder="Enter ultrasound impression"
                      rows={3}
                    />
                  </div>
                </div>
              </CardBox>
            </div>

            {/* ── OB Section 5: Comorbidities & Surgical History ───────────── */}
            <div className="col-span-12">
              <CardBox>
                <SectionTitle
                  icon="solar:hospital-bold-duotone"
                  title="OB/GYNE — Comorbidities & Surgical History"
                />
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12">
                    <Label htmlFor="comorbidity">Comorbidity</Label>
                    <Textarea
                      id="comorbidity"
                      value={comorbidity}
                      onChange={(e) => setComorbidity(e.target.value)}
                      placeholder="e.g. Gestational DM, PIH, Anemia..."
                      rows={3}
                    />
                  </div>
                  <div className="col-span-12">
                    <Label htmlFor="previousSurgeries">Previous Surgeries</Label>
                    <Textarea
                      id="previousSurgeries"
                      value={previousSurgeries}
                      onChange={(e) => setPreviousSurgeries(e.target.value)}
                      placeholder="List previous surgeries with approximate year and hospital"
                      rows={3}
                    />
                  </div>
                  <div className="col-span-12">
                    <Label htmlFor="previousCs">Previous CS (When / Where / Indication)</Label>
                    <Textarea
                      id="previousCs"
                      value={previousCs}
                      onChange={(e) => setPreviousCs(e.target.value)}
                      placeholder="e.g. 2020 — Pasig General Hospital — Fetal Distress"
                      rows={3}
                    />
                  </div>
                </div>
              </CardBox>
            </div>

            {/* ── OB Section 6: Additional Diagnostics ─────────────────────── */}
            <div className="col-span-12">
              <CardBox>
                <SectionTitle
                  icon="solar:document-add-bold-duotone"
                  title="OB/GYNE — Additional Diagnostics"
                />
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-12">
                    <Label htmlFor="labResult">Lab Result</Label>
                    <Textarea
                      id="labResult"
                      value={labResult}
                      onChange={(e) => setLabResult(e.target.value)}
                      placeholder="e.g. CBC: Hgb 98 g/L, HCT 30%; Blood type: A+; Urinalysis: pus cells 5-10/hpf..."
                      rows={4}
                    />
                  </div>
                  <div className="col-span-12">
                    <Label htmlFor="xray">X-Ray</Label>
                    <Textarea
                      id="xray"
                      value={xray}
                      onChange={(e) => setXray(e.target.value)}
                      placeholder="Enter X-ray findings or indicate N/A"
                      rows={3}
                    />
                  </div>
                  <div className="col-span-12">
                    <Label htmlFor="otherDiagnostics">Other Diagnostics</Label>
                    <Textarea
                      id="otherDiagnostics"
                      value={otherDiagnostics}
                      onChange={(e) => setOtherDiagnostics(e.target.value)}
                      placeholder="Any other diagnostic results (ECG, 2D Echo, etc.)"
                      rows={3}
                    />
                  </div>
                </div>
              </CardBox>
            </div>

            {/* ── Section 7: Referring Physician ───────────────────────────── */}
            <div className="col-span-12">
              <CardBox>
                <SectionTitle icon="solar:stethoscope-bold-duotone" title="Referring Physician" />
                <div className="grid grid-cols-12 gap-4">
                  <div className="lg:col-span-6 col-span-12">
                    <Label htmlFor="referringDoctor">
                      Referring Doctor <span className="text-error">*</span>
                    </Label>
                    <Input
                      id="referringDoctor"
                      value={referringDoctor}
                      onChange={(e) => setReferringDoctor(e.target.value)}
                      placeholder="e.g. Dr. Juan Santos"
                      required
                    />
                  </div>
                  <div className="lg:col-span-6 col-span-12">
                    <Label htmlFor="contactNo">Contact No.</Label>
                    <Input
                      id="contactNo"
                      value={contactNo}
                      onChange={(e) => setContactNo(e.target.value)}
                      placeholder="+63 9XX XXX XXXX"
                    />
                  </div>
                </div>
              </CardBox>
            </div>
          </>
        )}

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <div className="col-span-12 flex gap-3 justify-end pb-2">
          <Button type="button" variant="outline" onClick={resetForm}>
            <Icon icon="solar:restart-bold-duotone" height={15} className="mr-1.5" />
            Reset
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/module-2/referrals')}>
            Cancel
          </Button>
          <Button type="submit" disabled={!patientConfirmed}>
            <Icon icon="solar:check-circle-bold-duotone" height={15} className="mr-1.5" />
            Create OB/GYNE Referral
          </Button>
        </div>
      </div>
    </form>
  );
};

export default CreateObGyneReferralForm;
