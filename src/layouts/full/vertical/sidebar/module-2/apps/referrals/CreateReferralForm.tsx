import { useState, useContext } from 'react';
import { useNavigate } from 'react-router';
import { Icon } from '@iconify/react';
import { ReferralContext, ReferralContextType } from '../../context/ReferralContext';
import { ReferralType, ReferralInfo } from '../../types/referral';
import { StatusData } from '../../data/referral-data';
import CardBox from 'src/components/shared/CardBox';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Textarea } from 'src/components/ui/textarea';
import { Separator } from 'src/components/ui/separator';
import { Badge } from 'src/components/ui/badge';

// ── Mock patient registry (simulates module3.patient_profile lookup) ──────────
// Replace with: supabase.from('patient_profile').select('*').eq('id', id).single()
const MOCK_PATIENT_DB: Record<
  string,
  {
    id: string;
    name: string;
    age: number;
    sex: string;
    birth_date: string;
    complete_address: string;
    referring_facility: string;
    facility_address: string;
  }
> = {
  'pp-0001': {
    id: 'pp-0001',
    name: 'Juan dela Cruz',
    age: 45,
    sex: 'Male',
    birth_date: '1979-03-15',
    complete_address: '123 Rizal St., Diliman, Quezon City',
    referring_facility: 'Quezon City General Hospital',
    facility_address: 'Seminary Rd., Diliman, Quezon City',
  },
  'pp-0002': {
    id: 'pp-0002',
    name: 'Maria Santos',
    age: 32,
    sex: 'Female',
    birth_date: '1992-07-22',
    complete_address: '456 Mabini Ave., Pasig City',
    referring_facility: 'Pasig General Hospital',
    facility_address: 'Caruncho Ave., San Nicolas, Pasig City',
  },
  'pp-0003': {
    id: 'pp-0003',
    name: 'Pedro Reyes',
    age: 58,
    sex: 'Male',
    birth_date: '1966-11-05',
    complete_address: '789 Luna Rd., Marikina City',
    referring_facility: 'Marikina Valley Medical Center',
    facility_address: 'J.P. Rizal St., Marikina City',
  },
  'pp-0004': {
    id: 'pp-0004',
    name: 'Ana Torres',
    age: 27,
    sex: 'Female',
    birth_date: '1997-01-30',
    complete_address: '321 Bonifacio St., Mandaluyong City',
    referring_facility: 'Mandaluyong City Medical Center',
    facility_address: 'Maysilo Circle, Mandaluyong City',
  },
};

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
const CreateReferralForm = () => {
  const { addReferral }: ReferralContextType = useContext(ReferralContext);
  const navigate = useNavigate();

  // ── Patient ID lookup ─────────────────────────────────────────────────────
  const [patientIdInput, setPatientIdInput] = useState('');
  const [patientIdError, setPatientIdError] = useState('');
  const [confirmedPatientId, setConfirmedPatientId] = useState('');

  // ── Auto-filled patient details (locked after confirm) ───────────────────
  const [referringFacility, setReferringFacility] = useState('');
  const [facilityAddress, setFacilityAddress] = useState('');
  const [patientName, setPatientName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [completeAddress, setCompleteAddress] = useState('');

  // ── Manual fields ─────────────────────────────────────────────────────────
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
  const [referringTo, setReferringTo] = useState('');
  const [referringDoctor, setReferringDoctor] = useState('');
  const [contactNo, setContactNo] = useState('');

  // ── Vaccination dynamic rows ──────────────────────────────────────────────
  const [vaccinations, setVaccinations] = useState([{ description: '', date: '' }]);
  const addVaccinationRow = () => setVaccinations((p) => [...p, { description: '', date: '' }]);
  const removeVaccinationRow = (i: number) => setVaccinations((p) => p.filter((_, x) => x !== i));
  const updateVaccination = (i: number, field: 'description' | 'date', val: string) =>
    setVaccinations((p) => p.map((v, x) => (x === i ? { ...v, [field]: val } : v)));

  // ── Patient ID confirm ────────────────────────────────────────────────────
  const handleConfirmPatient = () => {
    const trimmed = patientIdInput.trim();
    if (!trimmed) {
      setPatientIdError('Please enter a Patient ID.');
      return;
    }
    const found = MOCK_PATIENT_DB[trimmed];
    if (!found) {
      setPatientIdError(`No patient found with ID "${trimmed}". Try pp-0001 to pp-0004.`);
      return;
    }
    setPatientIdError('');
    setConfirmedPatientId(found.id);
    setReferringFacility(found.referring_facility);
    setFacilityAddress(found.facility_address);
    setPatientName(found.name);
    setAge(String(found.age));
    setSex(found.sex);
    setBirthDate(found.birth_date);
    setCompleteAddress(found.complete_address);
  };

  const handleClearPatient = () => {
    setPatientIdInput('');
    setPatientIdError('');
    setConfirmedPatientId('');
    setReferringFacility('');
    setFacilityAddress('');
    setPatientName('');
    setAge('');
    setSex('');
    setBirthDate('');
    setCompleteAddress('');
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
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
      from_assignment: null,
      from_assignment_name: referringFacility || undefined,
      to_assignment: null,
      to_assignment_name: referringTo || undefined,
      latest_status: StatusData.find((s) => s.description === 'Pending'),
      referral_info: newInfo,
      history: [],
    };

    addReferral(newReferral);
    navigate('/module-2/referrals');
  };

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
    setReferringTo('');
    setMedications('');
    setReferringDoctor('');
    setContactNo('');
    setVaccinations([{ description: '', date: '' }]);
  };

  const patientConfirmed = !!confirmedPatientId;

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
                  ? `Patient Confirmed: ${confirmedPatientId}`
                  : 'Auto-fill from Patient Profile'}
              </Badge>
            </div>

            {/* Patient ID lookup row */}
            <div className="flex gap-3 items-end mb-6">
              <div className="flex-1 max-w-xs">
                <Label htmlFor="patientIdInput">
                  Patient ID <span className="text-error">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="patientIdInput"
                    value={patientIdInput}
                    onChange={(e) => {
                      setPatientIdInput(e.target.value);
                      setPatientIdError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleConfirmPatient();
                      }
                    }}
                    placeholder="e.g. pp-0001"
                    disabled={patientConfirmed}
                    className={patientIdError ? 'border-error' : ''}
                  />
                  {patientIdError && (
                    <p className="absolute top-full left-0 mt-1 text-xs text-error flex items-center gap-1 whitespace-nowrap">
                      <Icon icon="solar:danger-circle-linear" height={12} />
                      {patientIdError}
                    </p>
                  )}
                </div>
              </div>
              {!patientConfirmed ? (
                <Button type="button" onClick={handleConfirmPatient}>
                  <Icon icon="solar:magnifer-bold-duotone" height={15} className="mr-1.5" />
                  Find &amp; Confirm Patient
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={handleClearPatient}>
                  <Icon icon="solar:close-circle-linear" height={15} className="mr-1.5" />
                  Change Patient
                </Button>
              )}
            </div>

            {/* Auto-filled patient details */}
            {patientConfirmed ? (
              <div className="grid grid-cols-12 gap-4">
                <div className="lg:col-span-6 col-span-12">
                  <AutoField label="Referring Facility" value={referringFacility} />
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
                  Enter a Patient ID above and click <strong>Find &amp; Confirm Patient</strong> to
                  auto-fill their details.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Demo IDs: <code className="bg-muted px-1 rounded">pp-0001</code>,{' '}
                  <code className="bg-muted px-1 rounded">pp-0002</code>,{' '}
                  <code className="bg-muted px-1 rounded">pp-0003</code>,{' '}
                  <code className="bg-muted px-1 rounded">pp-0004</code>
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
                    <Input
                      id="referringTo"
                      value={referringTo}
                      onChange={(e) => setReferringTo(e.target.value)}
                      placeholder="e.g. Philippine General Hospital, Lung Center of the Philippines..."
                    />
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
            Create Referral
          </Button>
        </div>
      </div>
    </form>
  );
};

export default CreateReferralForm;
