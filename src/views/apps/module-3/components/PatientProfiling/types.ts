/**
 * Types and constants for Patient Profiling feature
 */

export interface PatientProfile {
  id: string;
  created_at: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  ext_name: string;
  sex: string;
  birth_date: string;
  // Fully relational location structure - uses only foreign keys
  brgy: string; // UUID foreign key
  city_municipality?: string; // UUID foreign key
  province?: string; // UUID foreign key
  region?: string; // UUID foreign key
  street?: string;
  // Display fields for location names (used in form, sent to service for lookup)
  brgy_name?: string;
  city_name?: string;
  province_name?: string;
  region_name?: string;
  // Repository fields (from MySQL)
  hpercode?: string;
  facility_code?: string;
}

export const INITIAL_PROFILE: PatientProfile = {
  id: '',
  created_at: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  ext_name: '',
  sex: '',
  birth_date: '',
  brgy: '',
  city_municipality: '',
  province: '',
  region: '',
  street: '',
  brgy_name: '',
  city_name: '',
  province_name: '',
  region_name: '',
  hpercode: '',
  facility_code: '',
};

export type BackendConnectionStatus = 'unknown' | 'connected' | 'disconnected';

export type StatusType = 'success' | 'error' | 'info';

export type SectionId = 'personal' | 'demographics' | 'location';

export interface NavSection {
  id: string;
  icon: React.ElementType;
  label: string;
  isComplete: boolean;
  isActive: boolean;
}

export interface SectionCompletion {
  filled: number;
  total: number;
  isComplete: boolean;
}

export interface ProfileCompletion {
  filled: number;
  total: number;
  pct: number;
}
