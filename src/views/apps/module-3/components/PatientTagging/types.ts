import { PatientHistory } from 'src/services/patientService';
import { PatientSearchResultProfile } from '../PatientSearchPanel';

/* ------------------------------------------------------------------ */
/*  Tab Types                                                         */
/* ------------------------------------------------------------------ */

export const VALID_TAB_VALUES = ['view', 'link', 'linked'] as const;
export type TabValue = (typeof VALID_TAB_VALUES)[number];

export const isValidTab = (value?: string): value is TabValue =>
  VALID_TAB_VALUES.includes(value as TabValue);

/* ------------------------------------------------------------------ */
/*  Patient Types                                                     */
/* ------------------------------------------------------------------ */

export interface PatientRepository {
  id: string;
  hpercode: string | null;
  facility_code?: string;
  status?: boolean | null;
  created_at?: string;
}

export interface SupabasePatient {
  id: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  sex?: string;
  birth_date?: string;
  patient_repository?: PatientRepository[];
}

export interface PatientToLink extends SupabasePatient {
  editingRepositoryId?: string;
  editingHpercode?: string;
  editingFacilityCode?: string;
}

export interface RepositoryToUnlink {
  id: string;
  hpercode: string;
  patientName: string;
}

/* ------------------------------------------------------------------ */
/*  Search Meta Types                                                 */
/* ------------------------------------------------------------------ */

// Re-export PatientDatabaseSummary from the original source to avoid type conflicts
import { PatientDatabaseSummary as OriginalPatientDatabaseSummary } from '../../utils/patientSearchResultHelpers';
export type PatientDatabaseSummary = OriginalPatientDatabaseSummary;

export interface SearchMeta {
  totalMatches: number;
  databaseSummaries: PatientDatabaseSummary[];
}

/* ------------------------------------------------------------------ */
/*  Statistics Types                                                  */
/* ------------------------------------------------------------------ */

export interface PatientStats {
  totalVisits: number;
  admissions: number;
  discharges: number;
  activeAdmissions: number;
  recentVisit: PatientHistory | null;
}

/* ------------------------------------------------------------------ */
/*  Tab Configuration Types                                           */
/* ------------------------------------------------------------------ */

export interface TabConfig {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

/* ------------------------------------------------------------------ */
/*  Re-exports for convenience                                        */
/* ------------------------------------------------------------------ */

export type { PatientHistory, PatientSearchResultProfile };
