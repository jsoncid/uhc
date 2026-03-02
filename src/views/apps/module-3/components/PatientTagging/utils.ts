import { SupabasePatient, PatientRepository } from './types';

/* ------------------------------------------------------------------ */
/*  Facility Mapping                                                  */
/* ------------------------------------------------------------------ */

export const FACILITY_NAME_BY_CODE: Record<string, string> = {
  '0005027': 'AGUSAN DEL NORTE PROVINCIAL HOSPITAL',
  '0005028': 'NASIPIT DISTRICT HOSPITAL',
};

export const getFacilityDisplayName = (
  facilityCode?: string,
  fallbackName?: string
): string => {
  if (facilityCode && FACILITY_NAME_BY_CODE[facilityCode]) {
    return FACILITY_NAME_BY_CODE[facilityCode];
  }
  return fallbackName || 'Unknown Facility';
};

/* ------------------------------------------------------------------ */
/*  Patient Name Helpers                                              */
/* ------------------------------------------------------------------ */

export const getPatientFullName = (patient: SupabasePatient): string => {
  const { last_name, first_name, middle_name } = patient;
  return `${last_name || ''}, ${first_name || ''} ${middle_name || ''}`.trim();
};

export const getPatientInitials = (patient: SupabasePatient): string => {
  const firstInitial = patient.first_name?.[0] || '';
  const lastInitial = patient.last_name?.[0] || '';
  return `${firstInitial}${lastInitial}`;
};

/* ------------------------------------------------------------------ */
/*  Repository Helpers                                                */
/* ------------------------------------------------------------------ */

export const isRepositoryActive = (repo: PatientRepository): boolean => {
  return (
    repo.hpercode != null &&
    (repo.status === true || repo.status === null || repo.status === undefined)
  );
};

export const getActiveRepositories = (
  patient: SupabasePatient
): PatientRepository[] => {
  return patient.patient_repository?.filter(isRepositoryActive) || [];
};

export const hasActiveRepositories = (patient: SupabasePatient): boolean => {
  return getActiveRepositories(patient).length > 0;
};

export const filterLinkedPatients = (patients: SupabasePatient[]): SupabasePatient[] => {
  return patients
    .filter(hasActiveRepositories)
    .map((patient) => ({
      ...patient,
      patient_repository: getActiveRepositories(patient),
    }));
};

/* ------------------------------------------------------------------ */
/*  Search Helpers                                                    */
/* ------------------------------------------------------------------ */

export const searchInPatientName = (
  patient: SupabasePatient,
  searchLower: string
): boolean => {
  const firstName = patient.first_name?.toLowerCase() || '';
  const middleName = patient.middle_name?.toLowerCase() || '';
  const lastName = patient.last_name?.toLowerCase() || '';
  const fullName = `${firstName} ${middleName} ${lastName}`.trim();
  return fullName.includes(searchLower);
};

export const searchInHpercodes = (
  patient: SupabasePatient,
  searchLower: string
): boolean => {
  const activeRepos = getActiveRepositories(patient);
  return activeRepos.some(
    (repo) => repo.hpercode?.toLowerCase().includes(searchLower)
  );
};

/* ------------------------------------------------------------------ */
/*  Date Helpers                                                      */
/* ------------------------------------------------------------------ */

export const isCreatedToday = (dateString?: string): boolean => {
  if (!dateString) return false;
  const today = new Date().toDateString();
  return new Date(dateString).toDateString() === today;
};

export const countLinkedToday = (patients: SupabasePatient[]): number => {
  return patients.filter((p) =>
    p.patient_repository?.some((repo) => isCreatedToday(repo.created_at))
  ).length;
};
