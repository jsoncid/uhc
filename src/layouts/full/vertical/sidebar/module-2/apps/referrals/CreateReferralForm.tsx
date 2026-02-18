import { useState, useContext } from 'react';
import { useNavigate } from 'react-router';
import { ReferralContext, ReferralContextType } from '../../context/ReferralContext';
import { ReferralType, ReferralInfo } from '../../types/referral';
import CardBox from 'src/components/shared/CardBox';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Textarea } from 'src/components/ui/textarea';

const CreateReferralForm = () => {
  const { addReferral }: ReferralContextType = useContext(ReferralContext);
  const navigate = useNavigate();

  // ── referral fields ──────────────────────────────────────────────────────
  const [patientName, setPatientName] = useState('');
  const [fromAssignmentName, setFromAssignmentName] = useState('');

  // ── referral_info fields ─────────────────────────────────────────────────
  const [reasonReferral, setReasonReferral] = useState('');
  const [referringDoctor, setReferringDoctor] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [hpi, setHpi] = useState('');
  const [pe, setPe] = useState('');

  // Vitals
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

  // COVID
  const [rtpcr, setRtpcr] = useState('');
  const [rtpcrDate, setRtpcrDate] = useState('');
  const [antigen, setAntigen] = useState('');
  const [antigenDate, setAntigenDate] = useState('');
  const [exposureCovid, setExposureCovid] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !reasonReferral || !referringDoctor) {
      alert('Please fill in all required fields.');
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
      vaccinations: [],
    };

    const newReferral: ReferralType = {
      id: newId,
      created_at: now,
      status: true,
      patient_profile: null,
      patient_name: patientName,
      from_assignment: null,
      from_assignment_name: fromAssignmentName || undefined,
      referral_info: newInfo,
      history: [],
    };

    addReferral(newReferral);
    navigate('/module-2/referrals');
  };

  const resetForm = () => {
    setPatientName('');
    setFromAssignmentName('');
    setReasonReferral('');
    setReferringDoctor('');
    setContactNo('');
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
    setRtpcr('');
    setRtpcrDate('');
    setAntigen('');
    setAntigenDate('');
    setExposureCovid('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* ── Patient / Assignment ── */}
        <CardBox>
          <h3 className="text-lg font-semibold mb-4">Referral Details</h3>
          <div className="grid grid-cols-12 gap-4">
            <div className="lg:col-span-6 col-span-12">
              <Label htmlFor="patientName">Patient Name *</Label>
              <Input
                id="patientName"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Enter patient name"
                required
              />
            </div>
            <div className="lg:col-span-6 col-span-12">
              <Label htmlFor="fromAssignment">From Assignment</Label>
              <Input
                id="fromAssignment"
                value={fromAssignmentName}
                onChange={(e) => setFromAssignmentName(e.target.value)}
                placeholder="e.g. Cardiology – Manila General"
              />
            </div>
            <div className="col-span-12">
              <Label htmlFor="reasonReferral">Reason for Referral *</Label>
              <Textarea
                id="reasonReferral"
                value={reasonReferral}
                onChange={(e) => setReasonReferral(e.target.value)}
                placeholder="Enter reason for referral"
                rows={3}
                required
              />
            </div>
            <div className="lg:col-span-6 col-span-12">
              <Label htmlFor="referringDoctor">Referring Doctor *</Label>
              <Input
                id="referringDoctor"
                value={referringDoctor}
                onChange={(e) => setReferringDoctor(e.target.value)}
                placeholder="e.g. Dr. Santos"
                required
              />
            </div>
            <div className="lg:col-span-6 col-span-12">
              <Label htmlFor="contactNo">Contact No</Label>
              <Input
                id="contactNo"
                value={contactNo}
                onChange={(e) => setContactNo(e.target.value)}
                placeholder="+63 9XX XXX XXXX"
              />
            </div>
          </div>
        </CardBox>

        {/* ── Clinical Notes ── */}
        <CardBox>
          <h3 className="text-lg font-semibold mb-4">Clinical Notes</h3>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12">
              <Label htmlFor="hpi">History of Present Illness</Label>
              <Textarea
                id="hpi"
                value={hpi}
                onChange={(e) => setHpi(e.target.value)}
                placeholder="Enter HPI"
                rows={3}
              />
            </div>
            <div className="col-span-12">
              <Label htmlFor="pe">Physical Examination</Label>
              <Textarea
                id="pe"
                value={pe}
                onChange={(e) => setPe(e.target.value)}
                placeholder="Enter PE findings"
                rows={3}
              />
            </div>
          </div>
        </CardBox>

        {/* ── Vital Signs ── */}
        <CardBox>
          <h3 className="text-lg font-semibold mb-4">Vital Signs</h3>
          <div className="grid grid-cols-12 gap-4">
            <div className="lg:col-span-3 col-span-6">
              <Label>Blood Pressure</Label>
              <Input value={bp} onChange={(e) => setBp(e.target.value)} placeholder="e.g. 120/80" />
            </div>
            <div className="lg:col-span-3 col-span-6">
              <Label>Temperature (°C)</Label>
              <Input
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                placeholder="e.g. 36.5"
              />
            </div>
            <div className="lg:col-span-3 col-span-6">
              <Label>Heart Rate</Label>
              <Input value={hr} onChange={(e) => setHr(e.target.value)} placeholder="e.g. 80 bpm" />
            </div>
            <div className="lg:col-span-3 col-span-6">
              <Label>Respiratory Rate</Label>
              <Input value={rr} onChange={(e) => setRr(e.target.value)} placeholder="e.g. 18" />
            </div>
            <div className="lg:col-span-3 col-span-6">
              <Label>O2 Sat</Label>
              <Input
                value={o2Sat}
                onChange={(e) => setO2Sat(e.target.value)}
                placeholder="e.g. 98%"
              />
            </div>
            <div className="lg:col-span-3 col-span-6">
              <Label>O2 Requirement</Label>
              <Input
                value={o2Req}
                onChange={(e) => setO2Req(e.target.value)}
                placeholder="e.g. Room air"
              />
            </div>
            <div className="lg:col-span-3 col-span-6">
              <Label>GCS</Label>
              <Input value={gcs} onChange={(e) => setGcs(e.target.value)} placeholder="e.g. 15" />
            </div>
            <div className="lg:col-span-3 col-span-6">
              <Label>Eye</Label>
              <Input value={eye} onChange={(e) => setEye(e.target.value)} placeholder="e.g. 4" />
            </div>
            <div className="lg:col-span-3 col-span-6">
              <Label>Vision</Label>
              <Input
                value={vision}
                onChange={(e) => setVision(e.target.value)}
                placeholder="e.g. Clear"
              />
            </div>
            <div className="lg:col-span-3 col-span-6">
              <Label>Motor</Label>
              <Input
                value={motor}
                onChange={(e) => setMotor(e.target.value)}
                placeholder="e.g. 6"
              />
            </div>
          </div>
        </CardBox>

        {/* ── COVID-19 ── */}
        <CardBox>
          <h3 className="text-lg font-semibold mb-4">COVID-19 Information</h3>
          <div className="grid grid-cols-12 gap-4">
            <div className="lg:col-span-3 col-span-6">
              <Label>RT-PCR Result</Label>
              <Input
                value={rtpcr}
                onChange={(e) => setRtpcr(e.target.value)}
                placeholder="Positive / Negative"
              />
            </div>
            <div className="lg:col-span-3 col-span-6">
              <Label>RT-PCR Date</Label>
              <Input type="date" value={rtpcrDate} onChange={(e) => setRtpcrDate(e.target.value)} />
            </div>
            <div className="lg:col-span-3 col-span-6">
              <Label>Antigen Result</Label>
              <Input
                value={antigen}
                onChange={(e) => setAntigen(e.target.value)}
                placeholder="Positive / Negative"
              />
            </div>
            <div className="lg:col-span-3 col-span-6">
              <Label>Antigen Date</Label>
              <Input
                type="date"
                value={antigenDate}
                onChange={(e) => setAntigenDate(e.target.value)}
              />
            </div>
            <div className="col-span-12">
              <Label>COVID-19 Exposure</Label>
              <Input
                value={exposureCovid}
                onChange={(e) => setExposureCovid(e.target.value)}
                placeholder="e.g. None, Household contact..."
              />
            </div>
          </div>
        </CardBox>

        {/* ── Actions ── */}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={resetForm}>
            Reset
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/module-2/referrals')}>
            Cancel
          </Button>
          <Button type="submit">Create Referral</Button>
        </div>
      </div>
    </form>
  );
};

export default CreateReferralForm;
