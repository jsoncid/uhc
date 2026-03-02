/**
 * Types and constants for Patient List feature
 */
import { PatientHistory } from 'src/services/patientService';

export interface ActiveFilter {
  id: string;
  type: 'sex' | 'linked' | 'facility';
  label: string;
  value: string;
}

export type SortColumn = 'name' | 'birth_date';
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'timeline' | 'table';
export type TypeFilter = 'all' | 'admission' | 'discharge';

/**
 * Extended patient interface that includes the nested brgy object 
 * returned from Supabase with joined location data
 */
export interface PatientWithRepository {
  id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  ext_name: string;
  sex: string;
  birth_date: string;
  birth_place?: string;
  civil_status?: string;
  religion?: string;
  nationality?: string;
  employment_status?: string;
  philhealth_number?: string;
  facility_code?: string;
  created_at: string;
  street?: string;
  // Fallback text fields for location
  brgy_name?: string;
  city_name?: string;
  province_name?: string;
  region_name?: string;
  // Repository link data
  patient_repository?: Array<{
    hpercode?: string;
    facility_code?: string;
  }>;
  // Nested brgy object from joined location query
  brgy?: {
    description?: string;
    city_municipality?: {
      description?: string;
      province?: {
        description?: string;
        region?: {
          description?: string;
        };
      };
    };
  };
}

export interface PatientStats {
  totalVisits: number;
  admissions: number;
  discharges: number;
  recentVisit: PatientHistory | null;
}

export interface PatientInfoForCard {
  id: string;
  hpercode: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  ext_name: string;
  sex: string;
  birth_date: string;
  facility_code?: string;
  facility_display_name: string;
  brgy_name?: string;
  city_name?: string;
  province_name?: string;
  region_name?: string;
  street?: string;
  created_at: string;
  brgy?: PatientWithRepository['brgy'];
}
