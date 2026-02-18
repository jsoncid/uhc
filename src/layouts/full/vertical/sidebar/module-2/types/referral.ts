// ─── module2.status ───────────────────────────────────────────────────────────
export interface ReferralStatus {
  id: string; // uuid
  created_at: string;
  description: string | null;
}

// ─── module2.referral ─────────────────────────────────────────────────────────
export interface ReferralType {
  id: string; // uuid
  created_at: string;
  status: boolean | null; // active/inactive flag on the referral itself
  patient_profile: string | null; // uuid → module3.patient_profile.id
  from_assignment: string | null; // uuid → assignment.id

  // Joined / denormalized fields for display (populated from related tables)
  patient_name?: string; // from module3.patient_profile
  from_assignment_name?: string; // from assignment description
  latest_status?: ReferralStatus; // latest active referral_history.status
  referral_info?: ReferralInfo;
  history?: ReferralHistory[];
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
  // Joined
  to_assignment_name?: string;
  status_description?: string;
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
  attachment: string | null;
  status: boolean | null;
}

// ─── module2.referral_info_vaccination ───────────────────────────────────────
export interface ReferralInfoVaccination {
  id: string; // uuid
  created_at: string;
  referral_info: string | null; // uuid → module2.referral_info.id
  description: string | null;
  date: string | null; // date
  status: boolean | null;
}
