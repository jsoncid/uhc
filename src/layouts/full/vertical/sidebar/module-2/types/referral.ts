// ─── module2.status ───────────────────────────────────────────────────────────
export interface ReferralStatus {
  id: string; // uuid
  created_at: string;
  description: string | null;
}

// ─── module2.referral ─────────────────────────────────────────────────────────
export interface ReferralType {
  // ── Columns that exist in Supabase module2.referral ─────────────────────
  id: string; // uuid
  created_at: string;
  status: boolean | null; // active/inactive flag on the referral itself
  patient_profile: string | null; // uuid → module3.patient_profile.id
  from_assignment: string | null; // uuid → assignment.id (origin facility/dept)
  to_assignment: string | null; // uuid → assignment.id (destination facility/dept)
  deactivated_at?: string | null; // ISO string — when it was deactivated
  deactivated_by?: string | null; // name/identifier of who deactivated it
  rejection_reason?: string | null; // text — reason if incoming referral was declined
  accepted_by?: string | null; // varchar — receiving doctor who accepted (incoming)
  redirect_to?: string | null; // varchar — suggested redirect hospital when declined

  // ── Frontend-only / query-time fields (NOT stored in DB) ────────────────
  direction?: 'outgoing' | 'incoming'; // derived: 'incoming' if to_assignment = our facility
  patient_name?: string; // joined from module3.patient_profile
  from_assignment_name?: string; // joined from assignment table
  to_assignment_name?: string; // joined from assignment table
  latest_status?: ReferralStatus; // joined from latest active referral_history.status
  referral_info?: ReferralInfo; // joined from module2.referral_info
  history?: ReferralHistory[]; // joined from module2.referral_history
}

// ─── module2.referral_history ─────────────────────────────────────────────────
export interface ReferralHistory {
  id: string; // uuid
  created_at: string;
  details: string | null;
  referral: string | null; // uuid → module2.referral.id
  to_assignment: string | null; // uuid → assignment.id
  status: string | null; // uuid → module2.status.id
  is_active: boolean | null;
  user?: string | null; // uuid → auth.users.id (who triggered this event)
  // Joined
  to_assignment_name?: string;
  status_description?: string;
  user_name?: string | null; // resolved display name of auth.users record
}
// ─── module2.referral_info ────────────────────────────────────────────────────
export interface ReferralInfo {
  id: string; // uuid
  created_at: string;
  reason_referral: string | null;
  rtpcr: string | null;
  rtpcr_date: string | null; // date
  antigen: string | null;
  antigen_date: string | null; // date
  exposure_covid: string | null;
  history_present_illness: string | null;
  pe: string | null; // physical examination
  gcs: string | null;
  eye: string | null;
  vision: string | null;
  motor: string | null;
  blood_pressure: string | null;
  temperature: string | null;
  heart_rate: string | null;
  respiratory_rate: string | null;
  o2_sat: string | null;
  o2_requirement: string | null;
  referring_doctor: string | null;
  contact_no: string | null;
  chief_complaints: string | null;
  medications: string | null;

  // ── OB/GYNE fields — real nullable columns in module2.referral_info ──────
  // All are `null` for non-OB/GYNE referrals; populated only for OB/GYNE.
  lmp: string | null; // date — Last Menstrual Period
  aog: string | null; // varchar — Age of Gestation
  edc: string | null; // date — Expected Date of Confinement
  fh: string | null; // varchar — Fundal Height
  fht: string | null; // varchar — Fetal Heart Tone
  ie: string | null; // varchar — Internal Examination
  dilatation: string | null;
  effacement: string | null;
  station: string | null;
  presenting_part: string | null;
  prom_hours: string | null; // varchar — PROM hours
  ultrasound_1st_date: string | null; // date
  ultrasound_1st_aog: string | null; // varchar — AOG by 1st ultrasound
  ultrasound_latest_date: string | null; // date
  ultrasound_efw: string | null; // varchar — Estimated Fetal Weight
  ultrasound_presentation: string | null;
  ultrasound_impression: string | null;
  gravida: string | null;
  parity: string | null; // varchar — TPAL format
  menarche: string | null;
  comorbidity: string | null;
  previous_surgeries: string | null;
  previous_cs: string | null; // when, where, indication
  lab_result: string | null;
  xray: string | null;
  other_diagnostics: string | null;

  referral: string | null; // uuid → module2.referral.id
  // Joined
  diagnostics?: ReferralInfoDiagnostic[];
  vaccinations?: ReferralInfoVaccination[];
}

// ─── module2.referral_info_diagnostic ────────────────────────────────────────
export interface ReferralInfoDiagnostic {
  id: string; // uuid
  created_at: string;
  referral_info: string | null; // uuid → module2.referral_info.id
  diagnostics: string | null;
  date: string | null; // date
  attachments: string[]; // stored as JSON array in DB
  status: boolean | null;
}

// ─── module2.referral_info_vaccination ───────────────────────────────────────
export interface ReferralInfoVaccination {
  id: string; // uuid
  created_at: string;
  referral_info: string | null; // uuid → module2.referral_info.id
  description: string | null;
  date: string | null; // date
  attachments: string[]; // stored as JSON array in DB
  status: boolean | null;
}
