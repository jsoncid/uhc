/**
 * Patient Service - API calls for patient data from MySQL database
 */

import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/supabase';

type PatientProfileDB = Database['module3']['Tables']['patient_profile'];

// Get API URL from environment or use default backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://uhc-backend.180.232.187.222.sslip.io';

export interface PatientProfile {
  id: string;
  hpercode: string;
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
  // Fully relational location structure - uses only foreign keys
  brgy: string; // UUID foreign key to brgy table
  city_municipality?: string; // UUID foreign key to city_municipality table
  province?: string; // UUID foreign key to province table
  region?: string; // UUID foreign key to region table
  street?: string;
}

// Interface for the view that includes location names
// Use this when you need to display location names to users
export interface PatientProfileWithLocations extends PatientProfile {
  brgy_name?: string;
  city_name?: string;
  province_name?: string;
  region_name?: string;
}

export interface PatientSearchResult {
  success: boolean;
  data?: PatientProfile[]; // Legacy flat structure
  count?: number;
  message?: string;
  // New structure: backend returns both databases
  database1?: {
    name: string;
    data: PatientProfile[];
    count: number;
  };
  database2?: {
    name: string;
    data: PatientProfile[];
    count: number;
  };
  total_count?: number;
}

export interface PatientGetResult {
  success: boolean;
  data: PatientProfile;
  message?: string;
}

export interface PaginatedPatientResult {
  success: boolean;
  data: PatientProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export interface FacilityListResult {
  success: boolean;
  database1: {
    name: string;
    data: {
      facility_code: string;
      facility_name: string;
      patient_count: number;
    }[];
    count: number;
  };
  database2: {
    name: string;
    data: {
      facility_code: string;
      facility_name: string;
      patient_count: number;
    }[];
    count: number;
  };
  message?: string;
}

export interface Facility {
  facility_code: string;
  facility_name: string;
  patient_count: number;
  database?: string; // Track which database this facility came from
}

export interface PatientTag {
  id: string;
  patient_id: string;
  tag_name: string;
  tag_category: string;
  tag_color: string;
  notes?: string;
  created_at: string;
  created_by: string;
  updated_at?: string;
}

export interface PatientHistory {
  // hadmlog fields
  enccode: string;
  hpercode: string;
  upicode?: string;
  casenum?: string;
  patage?: string;
  newold?: string;
  tacode?: string;
  tscode?: string;
  admdate: string;
  admtime?: string;
  diagcode?: string;
  admnotes?: string;
  licno?: string;
  diagfin?: string;
  disnotes?: string;
  admmode?: string;
  admpreg?: string;
  disdate?: string;
  distime?: string;
  dispcode?: string;
  condcode?: string;
  licnof?: string;
  licncons?: string;
  cbcode?: string;
  dcspinst?: string;
  admstat?: string;
  admlock?: string;
  datemod?: string;
  updsw?: string;
  confdl?: string;
  admtxt?: string;
  admclerk?: string;
  licno2?: string;
  licno3?: string;
  licno4?: string;
  licno5?: string;
  patagemo?: string;
  patagedy?: string;
  patagehr?: string;
  admphic?: string;
  disnotice?: string;
  treatment?: string;
  hsepriv?: string;
  licno6?: string;
  licno7?: string;
  licno8?: string;
  licno9?: string;
  licno10?: string;
  itisind?: string;
  entryby?: string;
  pexpireddate?: string;
  acis?: string;
  watchid?: string;
  lockby?: string;
  lockdte?: string;
  typadm?: string;
  pho_hospital_number?: string;
  nbind?: string;
  foradmcode?: string;
  is_smoker?: string;
  smoker_cigarette_pack?: string;
  deleted_at?: string;
  created_at?: string;
  discharge_by?: string;
  // henctr fields (encounter data)
  encounter_fhud?: string;
  encounter_hpercode?: string;
  encounter_date?: string;
  encounter_time?: string;
  encounter_toecode?: string;
  encounter_sopcode1?: string;
  encounter_sopcode2?: string;
  encounter_sopcode3?: string;
  encounter_patinform?: string;
  encounter_patinfadd?: string;
  encounter_patinftel?: string;
  encounter_lock?: string;
  encounter_datemod?: string;
  encounter_updsw?: string;
  encounter_confdl?: string;
  encounter_acctno?: string;
  encounter_entryby?: string;
  encounter_casetype?: string;
  encounter_tacode?: string;
  encounter_consentphie?: string;
  encounter_cf4attendprov?: string;
  // Source tracking (added by frontend)
  source_database?: string;
  source_facility_name?: string;
}

export interface PatientTagResult {
  success: boolean;
  data: PatientTag[];
  message?: string;
}

export interface PatientHistoryResult {
  success: boolean;
  data: PatientHistory[];
  message?: string;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

class PatientService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/patients`;
  }

  /**
   * Search patients by name
   */
  async searchPatients(
    name: string,
    options?: { facility?: string; database?: string; limit?: number }
  ): Promise<PatientSearchResult> {
    try {
      const params = new URLSearchParams({ name });
      if (options?.facility) params.append('facility', options.facility);
      if (options?.database) params.append('database', options.database);
      if (options?.limit) params.append('limit', String(options.limit));

      const response = await fetch(`${this.baseUrl}/search?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Patient search error:', error);
      return {
        success: false,
        data: [],
        count: 0,
        message: error instanceof Error ? error.message : 'Failed to search patients',
      };
    }
  }

  /**
   * Get single patient by hpercode
   */
  async getPatient(hpercode: string): Promise<PatientGetResult> {
    try {
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(hpercode)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get patient error:', error);
      return {
        success: false,
        data: {} as PatientProfile,
        message: error instanceof Error ? error.message : 'Failed to get patient',
      };
    }
  }

  /**
   * Get all patients (paginated)
   */
  async getPatients(page = 1, limit = 20): Promise<PaginatedPatientResult> {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get patients error:', error);
      return {
        success: false,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        message: error instanceof Error ? error.message : 'Failed to get patients',
      };
    }
  }

  /**
   * Get list of facilities from both databases
   */
  async getFacilities(): Promise<FacilityListResult> {
    try {
      const response = await fetch(`${this.baseUrl}/facilities/list`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get facilities error:', error);
      return {
        success: false,
        database1: { name: 'adnph_ihomis_plus', data: [], count: 0 },
        database2: { name: 'ndh_ihomis_plus', data: [], count: 0 },
        message: error instanceof Error ? error.message : 'Failed to get facilities',
      };
    }
  }

  /**
   * Check backend health
   */
  async checkHealth(): Promise<{
    status: string;
    databases?: { postgres?: string; mysql?: string };
    timestamp?: string;
    uptime?: number;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      return {
        status: 'error',
        databases: {},
      };
    }
  }

  /**
   * Find or create barangay and complete location hierarchy in Supabase
   * Creates: Region → Province → City/Municipality → Barangay
   * Returns all location UUIDs including brgy, city_municipality, province, and region
   */
  async findOrCreateBrgy(locationData: {
    brgy?: string;
    brgy_name?: string;
    city_name?: string;
    province_name?: string;
    region_name?: string;
  }): Promise<{
    brgy: string | null;
    city_municipality: string | null;
    province: string | null;
    region: string | null;
  } | null> {
    try {
      // If no location data provided, return null
      if (!locationData.brgy_name && !locationData.brgy) {
        console.log('No brgy data provided, skipping brgy lookup');
        return null;
      }

      console.log('Finding or creating location hierarchy:', {
        region: locationData.region_name,
        province: locationData.province_name,
        city: locationData.city_name,
        brgy: locationData.brgy_name,
      });

      // Step 1: Find or create Region
      let regionId: string | null = null;
      if (locationData.region_name) {
        const { data: existingRegion } = await supabase
          .schema('module3')
          .from('region')
          .select('id')
          .ilike('description', locationData.region_name)
          .maybeSingle();

        if (existingRegion) {
          regionId = existingRegion.id;
          console.log('Found existing region:', regionId);
        } else {
          const { data: newRegion, error } = await supabase
            .schema('module3')
            .from('region')
            .insert({ description: locationData.region_name })
            .select('id')
            .single();

          if (error) {
            console.error('Error creating region:', error);
          } else {
            regionId = newRegion.id;
            console.log('Created new region:', regionId);
          }
        }
      }

      // Step 2: Find or create Province
      let provinceId: string | null = null;
      if (locationData.province_name) {
        const { data: existingProvince } = await supabase
          .schema('module3')
          .from('province')
          .select('id')
          .ilike('description', locationData.province_name)
          .eq('region', regionId)
          .maybeSingle();

        if (existingProvince) {
          provinceId = existingProvince.id;
          console.log('Found existing province:', provinceId);
        } else {
          const { data: newProvince, error } = await supabase
            .schema('module3')
            .from('province')
            .insert({
              description: locationData.province_name,
              region: regionId,
            })
            .select('id')
            .single();

          if (error) {
            console.error('Error creating province:', error);
          } else {
            provinceId = newProvince.id;
            console.log('Created new province:', provinceId);
          }
        }
      }

      // Step 3: Find or create City/Municipality
      let cityId: string | null = null;
      if (locationData.city_name) {
        const { data: existingCity } = await supabase
          .schema('module3')
          .from('city_municipality')
          .select('id')
          .ilike('description', locationData.city_name)
          .eq('province', provinceId)
          .maybeSingle();

        if (existingCity) {
          cityId = existingCity.id;
          console.log('Found existing city:', cityId);
        } else {
          const { data: newCity, error } = await supabase
            .schema('module3')
            .from('city_municipality')
            .insert({
              description: locationData.city_name,
              province: provinceId,
            })
            .select('id')
            .single();

          if (error) {
            console.error('Error creating city:', error);
          } else {
            cityId = newCity.id;
            console.log('Created new city:', cityId);
          }
        }
      }

      // Step 4: Find or create Barangay
      if (locationData.brgy_name) {
        const { data: existingBrgy } = await supabase
          .schema('module3')
          .from('brgy')
          .select('id')
          .ilike('description', locationData.brgy_name)
          .eq('city_municipality', cityId)
          .maybeSingle();

        if (existingBrgy) {
          console.log('Found existing brgy:', existingBrgy.id);
          return {
            brgy: existingBrgy.id,
            city_municipality: cityId,
            province: provinceId,
            region: regionId,
          };
        } else {
          const { data: newBrgy, error } = await supabase
            .schema('module3')
            .from('brgy')
            .insert({
              description: locationData.brgy_name,
              city_municipality: cityId,
            })
            .select('id')
            .single();

          if (error) {
            console.error('Error creating brgy:', error);
            console.error('Error details:', error.message);
            return null;
          }

          console.log('Created new brgy:', newBrgy.id);
          return {
            brgy: newBrgy.id,
            city_municipality: cityId,
            province: provinceId,
            region: regionId,
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error in findOrCreateBrgy:', error);
      console.log('Continuing with null brgy value');
      return null;
    }
  }

  /**
   * Save patient profile to Supabase
   * Also creates/updates patient_repository record if hpercode is provided
   */
  async saveToSupabase(
    patientData: {
      id?: string;
      created_at?: string;
      first_name: string;
      middle_name?: string;
      last_name: string;
      ext_name?: string;
      sex: string;
      birth_date: string;
      brgy?: string;
      brgy_name?: string;
      street?: string;
      city_name?: string;
      province_name?: string;
      region_name?: string;
      hpercode?: string;
      facility_code?: string;
    }
  ): Promise<{ success: boolean; data?: PatientProfileDB['Row']; message?: string }> {
    try {
      // Helper function to convert empty strings to undefined
      const cleanValue = (value: string | undefined) => {
        return value && value.trim() !== '' ? value : undefined;
      };

      // Helper function to validate UUID format
      const isValidUuid = (value: string | undefined) => {
        if (!value) return false;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
      };

      // Check if patient ID is a valid UUID
      const patientIdToUse = isValidUuid(patientData.id) ? patientData.id : undefined;
      if (patientData.id && !patientIdToUse) {
        console.log(
          `Patient ID "${patientData.id}" is not a valid UUID. Supabase will generate a new one.`,
        );
      }

      // Check if brgy is a valid UUID, if not, try to find/create one
      let locationIds: {
        brgy: string | null;
        city_municipality: string | null;
        province: string | null;
        region: string | null;
      } = {
        brgy: null,
        city_municipality: null,
        province: null,
        region: null,
      };

      if (isValidUuid(patientData.brgy)) {
        locationIds.brgy = patientData.brgy!;
        // Note: If only brgy UUID is provided, the other location IDs will be null
        // They would need to be looked up from the brgy's relationships if needed
      } else if (patientData.brgy_name || patientData.brgy) {
        // Try to find or create brgy based on location data
        const result = await this.findOrCreateBrgy({
          brgy: patientData.brgy,
          brgy_name: patientData.brgy_name,
          city_name: patientData.city_name,
          province_name: patientData.province_name,
          region_name: patientData.region_name,
        });
        
        if (result) {
          locationIds = result;
        }
      }

      // Prepare data for Supabase - only include non-empty values
      const supabaseData: PatientProfileDB['Insert'] = {
        // Only include id if it's a valid UUID
        ...(patientIdToUse && { id: patientIdToUse }),
        first_name: patientData.first_name.trim(),
        middle_name: cleanValue(patientData.middle_name),
        last_name: patientData.last_name.trim(),
        ext_name: cleanValue(patientData.ext_name),
        sex: patientData.sex,
        birth_date: patientData.birth_date,
        brgy: locationIds.brgy,
        city_municipality: locationIds.city_municipality,
        province: locationIds.province,
        region: locationIds.region,
        street: cleanValue(patientData.street),
      };

      console.log('Attempting to save patient to Supabase:', supabaseData);

      // Check if patient already exists (by UUID if provided, or by name combination)
      let existingPatient = null;

      if (patientIdToUse) {
        console.log('Checking if patient exists by UUID:', patientIdToUse);
        const { data: checkById, error: checkError } = await supabase
          .schema('module3')
          .from('patient_profile')
          .select('*')
          .eq('id', patientIdToUse)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking patient by ID:', checkError);
        }

        existingPatient = checkById;
        if (existingPatient) {
          console.log('Found existing patient by UUID:', existingPatient.id);
        }
      }

      // If no UUID match, check by name and birth date combination
      if (
        !existingPatient &&
        patientData.first_name &&
        patientData.last_name &&
        patientData.birth_date
      ) {
        console.log('Checking if patient exists by name and birth date');
        const { data: checkByName, error: checkError } = await supabase
          .schema('module3')
          .from('patient_profile')
          .select('*')
          .eq('first_name', patientData.first_name.trim())
          .eq('last_name', patientData.last_name.trim())
          .eq('birth_date', patientData.birth_date)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking patient by name:', checkError);
        }

        existingPatient = checkByName;
        if (existingPatient) {
          console.log('Found existing patient by name/birthdate:', existingPatient.id);
        }
      }

      if (existingPatient) {
        console.log('Patient exists, updating:', existingPatient.id);
        // Update existing patient
        const { data, error } = await supabase
          .schema('module3')
          .from('patient_profile')
          .update(supabaseData)
          .eq('id', existingPatient.id)
          .select()
          .single();

        if (error) {
          console.error('Error updating patient in Supabase:');
          console.error('Full error object:', error);

          const err = error as any;
          const errorCode = error.code || err.error_code || err?.error?.code;
          const errorMessage = error.message || err.msg || err?.error?.message || 'Unknown error';
          const errorDetails = error.details || err.detail || err?.error?.details;
          const errorHint = error.hint || err?.error?.hint;

          console.error('Error code:', errorCode);
          console.error('Error message:', errorMessage);
          console.error('Error details:', errorDetails);
          console.error('Error hint:', errorHint);

          let errorMsg = `Failed to update patient: ${errorMessage}`;
          if (errorCode === '42P01') {
            errorMsg += ' - Table does not exist. Please run the SQL schema file first.';
          } else if (errorCode === '42501') {
            errorMsg += ' - Permission denied. Check RLS policies.';
          }
          throw new Error(errorMsg);
        }

        console.log('Patient updated successfully:', data);

        // If hpercode is provided, create/update patient_repository record
        if (patientData.hpercode && data.id) {
          await this.savePatientRepository({
            patient_profile_id: data.id,
            hpercode: patientData.hpercode,
            facility_code: patientData.facility_code,
          });
        }

        return {
          success: true,
          data,
          message: 'Patient profile updated successfully in Supabase',
        };
      } else {
        console.log('Patient does not exist, inserting new patient');
        console.log('Insert payload:', JSON.stringify(supabaseData, null, 2));

        // Insert new patient
        const { data, error } = await supabase
          .schema('module3')
          .from('patient_profile')
          .insert(supabaseData)
          .select()
          .single();

        if (error) {
          console.error('Error inserting patient into Supabase:');
          console.error('Full error object:', error);
          console.error('Error type:', typeof error);
          console.error('Error keys:', Object.keys(error));

          // Try different ways to access error properties
          const err = error as any;
          const errorCode = error.code || err.error_code || err?.error?.code;
          const errorMessage = error.message || err.msg || err?.error?.message || 'Unknown error';
          const errorDetails = error.details || err.detail || err?.error?.details;
          const errorHint = error.hint || err?.error?.hint;

          console.error('Error code:', errorCode);
          console.error('Error message:', errorMessage);
          console.error('Error details:', errorDetails);
          console.error('Error hint:', errorHint);
          console.error('Data being inserted:', JSON.stringify(supabaseData, null, 2));

          // Provide helpful error message
          let errorMsg = `Failed to insert patient: ${errorMessage}`;
          if (errorCode === '42P01') {
            errorMsg += ' - Table does not exist. Please run the SQL schema file first.';
          } else if (errorCode === '42501') {
            errorMsg += ' - Permission denied. Check RLS policies.';
          } else if (errorCode === '23505') {
            errorMsg += ' - Duplicate record. This patient may already exist.';
          }
          throw new Error(errorMsg);
        }

        console.log('Patient inserted successfully:', data);

        // If hpercode is provided, create/update patient_repository record
        if (patientData.hpercode && data.id) {
          await this.savePatientRepository({
            patient_profile_id: data.id,
            hpercode: patientData.hpercode,
            facility_code: patientData.facility_code,
          });
        }

        return {
          success: true,
          data,
          message: 'Patient profile saved successfully to Supabase',
        };
      }
    } catch (error) {
      console.error('Save to Supabase error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to save patient to Supabase',
      };
    }
  }

  /**
   * Save or update patient repository record
   * Links patient_profile with hpercode and facility
   * Supports multiple links per patient (multiple HPERCODEs)
   */
  private async savePatientRepository(data: {
    patient_profile_id: string;
    hpercode: string;
    facility_code?: string;
  }): Promise<void> {
    try {
      console.log('Saving patient repository record:', data);
      
      // Check if a record with this exact patient_profile + hpercode combination exists
      const { data: existingRepo } = await supabase
        .schema('module3')
        .from('patient_repository')
        .select('id')
        .eq('patient_profile', data.patient_profile_id)
        .eq('hpercode', data.hpercode)
        .maybeSingle();

      if (existingRepo) {
        // Update existing record (same patient_profile + hpercode combo)
        const { error } = await supabase
          .schema('module3')
          .from('patient_repository')
          .update({
            facility_code: data.facility_code || null,
          })
          .eq('id', existingRepo.id);

        if (error) {
          console.error('Error updating patient_repository:', error);
        } else {
          console.log('Patient repository record updated');
        }
      } else {
        // Insert new record (new hpercode for this patient)
        const { error } = await supabase
          .schema('module3')
          .from('patient_repository')
          .insert({
            patient_profile: data.patient_profile_id,
            hpercode: data.hpercode,
            facility_code: data.facility_code || null,
          });

        if (error) {
          console.error('Error creating patient_repository:', error);
        } else {
          console.log('Patient repository record created');
        }
      }
    } catch (error) {
      console.error('Error in savePatientRepository:', error);
      // Don't throw - repository link is optional
    }
  }

  /**
   * Search patients in Supabase (patient_profile with full location joins)
   * Searches by name, facility, and location (barangay, city, province, region)
   * For finding manually entered patients that may not have hpercode yet
   */
  async searchSupabasePatients(
    search: string,
    options?: { limit?: number }
  ): Promise<{
    success: boolean;
    data: any[];
    count: number;
    message?: string;
  }> {
    try {
      const limit = options?.limit || 100;
      const searchTerm = search.trim().toLowerCase();
      
      // Query with joins to get location hierarchy and facility info
      // Only get patients that DON'T have an hpercode yet (not linked to MySQL)
      const { data, error } = await supabase
        .schema('module3')
        .from('patient_profile')
        .select(`
          *,
          brgy:brgy(
            id,
            description,
            city_municipality:city_municipality(
              id,
              description,
              province:province(
                id,
                description,
                region:region(
                  id,
                  description
                )
              )
            )
          ),
          patient_repository!left(
            id,
            facility_code,
            hpercode,
            status
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(limit * 3); // Fetch more since we'll filter out linked patients

      if (error) {
        console.error('Error searching Supabase patients:', error);
        return {
          success: false,
          data: [],
          count: 0,
          message: error.message,
        };
      }

      // First filter: Only include patients WITHOUT hpercode (not linked yet)
      const unlinkedPatients = (data || []).filter((patient: any) => {
        // Check if patient has no repository entry OR repository has no hpercode
        const hasNoRepository = !patient.patient_repository || patient.patient_repository.length === 0;
        const hasNoHpercode = patient.patient_repository?.[0]?.hpercode == null;
        return hasNoRepository || hasNoHpercode;
      });

      // Second filter: Search client-side across name, location hierarchy, and facility
      const filteredData = unlinkedPatients.filter((patient: any) => {
        // Search in patient name fields
        const firstName = patient.first_name?.toLowerCase() || '';
        const middleName = patient.middle_name?.toLowerCase() || '';
        const lastName = patient.last_name?.toLowerCase() || '';
        const fullName = `${firstName} ${middleName} ${lastName}`.trim();
        
        // Search in location hierarchy
        const brgyDesc = patient.brgy?.description?.toLowerCase() || '';
        const brgyName = patient.brgy_name?.toLowerCase() || '';
        const cityDesc = patient.brgy?.city_municipality?.description?.toLowerCase() || '';
        const cityName = patient.city_name?.toLowerCase() || '';
        const provinceDesc = patient.brgy?.city_municipality?.province?.description?.toLowerCase() || '';
        const provinceName = patient.province_name?.toLowerCase() || '';
        const regionDesc = patient.brgy?.city_municipality?.province?.region?.description?.toLowerCase() || '';
        const regionName = patient.region_name?.toLowerCase() || '';
        
        // Search in facility
        const facilityCode = patient.patient_repository?.[0]?.facility_code?.toLowerCase() || '';
        
        // Check if search term matches any field
        return (
          firstName.includes(searchTerm) ||
          middleName.includes(searchTerm) ||
          lastName.includes(searchTerm) ||
          fullName.includes(searchTerm) ||
          brgyDesc.includes(searchTerm) ||
          brgyName.includes(searchTerm) ||
          cityDesc.includes(searchTerm) ||
          cityName.includes(searchTerm) ||
          provinceDesc.includes(searchTerm) ||
          provinceName.includes(searchTerm) ||
          regionDesc.includes(searchTerm) ||
          regionName.includes(searchTerm) ||
          facilityCode.includes(searchTerm)
        );
      });

      // Trim to requested limit
      const limitedData = filteredData.slice(0, limit);

      console.log(`Found ${unlinkedPatients.length} unlinked patients, ${filteredData.length} matching search, returning ${limitedData.length}`);

      return {
        success: true,
        data: limitedData,
        count: limitedData.length,
      };
    } catch (error) {
      console.error('Search Supabase patients error:', error);
      return {
        success: false,
        data: [],
        count: 0,
        message: error instanceof Error ? error.message : 'Failed to search Supabase patients',
      };
    }
  }

  /**
   * Get all patients from Supabase (paginated)
   * Includes location hierarchy and facility information
   */
  async getSupabasePatients(page = 1, limit = 20): Promise<{
    success: boolean;
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    message?: string;
  }> {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // Query with joins to get location hierarchy and facility info
      const { data, error, count } = await supabase
        .schema('module3')
        .from('patient_profile')
        .select(`
          *,
          brgy:brgy(
            id,
            description,
            city_municipality:city_municipality(
              id,
              description,
              province:province(
                id,
                description,
                region:region(
                  id,
                  description
                )
              )
            )
          ),
          patient_repository(
            id,
            facility_code,
            hpercode,
            status
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Error fetching Supabase patients:', error);
        return {
          success: false,
          data: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
          message: error.message,
        };
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: data || [],
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      console.error('Get Supabase patients error:', error);
      return {
        success: false,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        message: error instanceof Error ? error.message : 'Failed to get Supabase patients',
      };
    }
  }

  /**
   * Link a Supabase patient with a MySQL patient (by hpercode)
   * Updates the patient_repository table to create the connection
   */
  async linkPatientToMySQL(
    patientProfileId: string,
    hpercode: string,
    facilityCode?: string
  ): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      console.log('Linking patient:', { patientProfileId, hpercode, facilityCode });

      // First verify the MySQL patient exists
      const mysqlPatient = await this.getPatient(hpercode);
      if (!mysqlPatient.success) {
        return {
          success: false,
          message: 'MySQL patient not found with provided HPERCODE',
        };
      }

      // Now link them via patient_repository
      await this.savePatientRepository({
        patient_profile_id: patientProfileId,
        hpercode: hpercode,
        facility_code: facilityCode,
      });

      return {
        success: true,
        message: 'Patient successfully linked to MySQL record',
      };
    } catch (error) {
      console.error('Link patient error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to link patient',
      };
    }
  }

  /**
   * Unlink a patient repository entry by setting status to false (soft delete)
   * @param repositoryId - The UUID of the patient_repository record
   */
  async unlinkPatientRepository(repositoryId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      console.log('Unlinking patient repository:', repositoryId);

      const { error } = await supabase
        .schema('module3')
        .from('patient_repository')
        .update({ status: false })
        .eq('id', repositoryId);

      if (error) {
        console.error('Error unlinking patient repository:', error);
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: true,
        message: 'Patient link removed successfully',
      };
    } catch (error) {
      console.error('Unlink patient repository error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to unlink patient',
      };
    }
  }

  /**
   * Get patient tags from MySQL
   */
  async getPatientTags(hpercode: string): Promise<PatientTagResult> {
    try {
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(hpercode)}/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data || [],
      };
    } catch (error) {
      console.error('Get patient tags error:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Failed to get patient tags',
      };
    }
  }

  /**
   * Add patient tag to MySQL
   */
  async addPatientTag(
    hpercode: string,
    tag: Omit<PatientTag, 'id' | 'created_at' | 'patient_id' | 'hpercode'>,
  ): Promise<{
    success: boolean;
    data?: PatientTag;
    message?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(hpercode)}/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tag),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data,
        message: 'Tag added successfully',
      };
    } catch (error) {
      console.error('Add patient tag error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add patient tag',
      };
    }
  }

  /**
   * Remove patient tag from MySQL
   */
  async removePatientTag(
    hpercode: string,
    tagId: string,
  ): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${encodeURIComponent(hpercode)}/tags/${encodeURIComponent(tagId)}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error: ${response.status}`);
      }

      return {
        success: true,
        message: 'Tag removed successfully',
      };
    } catch (error) {
      console.error('Remove patient tag error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to remove patient tag',
      };
    }
  }

  /**
   * Get patient history from MySQL (hadmlog table)
   */
  async getPatientHistory(hpercode: string, options?: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
    database?: string;
  }): Promise<PatientHistoryResult> {
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', String(options.limit));
      if (options?.offset) params.append('offset', String(options.offset));
      if (options?.startDate) params.append('startDate', options.startDate);
      if (options?.endDate) params.append('endDate', options.endDate);
      if (options?.database) params.append('database', options.database);

      const queryString = params.toString();
      const url = `${this.baseUrl}/history/${encodeURIComponent(hpercode)}${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error: ${response.status}`);
      }

      const result = await response.json();
      
      // Helper to map database name to friendly facility name
      const getFacilityNameFromDb = (dbName: string): string => {
        if (dbName === 'adnph_ihomis_plus') return 'Agusan del Norte Provincial Hospital';
        if (dbName === 'ndh_ihomis_plus') return 'Nasipit District Hospital';
        return dbName;
      };
      
      // API returns database1 and database2 structure
      // Combine data from both databases, or use specific database if requested
      let historyData: PatientHistory[] = [];
      
      // Helper to tag records with source
      const tagRecords = (records: PatientHistory[], dbName: string): PatientHistory[] => {
        return records.map(record => ({
          ...record,
          source_database: dbName,
          source_facility_name: getFacilityNameFromDb(dbName),
        }));
      };
      
      if (options?.database) {
        // If specific database requested, try to match
        if (result.database1?.name === options.database) {
          historyData = tagRecords(result.database1?.data || [], result.database1.name);
        } else if (result.database2?.name === options.database) {
          historyData = tagRecords(result.database2?.data || [], result.database2.name);
        } else {
          // Fallback: check both databases
          historyData = [
            ...tagRecords(result.database1?.data || [], result.database1?.name || 'database1'),
            ...tagRecords(result.database2?.data || [], result.database2?.name || 'database2'),
          ];
        }
      } else {
        // No specific database, combine both
        historyData = [
          ...tagRecords(result.database1?.data || [], result.database1?.name || 'database1'),
          ...tagRecords(result.database2?.data || [], result.database2?.name || 'database2'),
        ];
      }
      
      // Also support legacy flat data structure
      if (historyData.length === 0 && result.data) {
        historyData = result.data;
      }
      
      return {
        success: true,
        data: historyData,
        pagination: result.pagination,
      };
    } catch (error) {
      console.error('Get patient history error:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Failed to get patient history',
      };
    }
  }

  /**
   * Add patient history record to MySQL
   */
  async addPatientHistory(
    hpercode: string,
    history: Omit<PatientHistory, 'id' | 'created_at' | 'patient_id' | 'hpercode'>,
  ): Promise<{
    success: boolean;
    data?: PatientHistory;
    message?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(hpercode)}/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(history),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data,
        message: 'History record added successfully',
      };
    } catch (error) {
      console.error('Add patient history error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to add patient history',
      };
    }
  }

  /**
   * Get location hierarchy details by UUID
   * Useful for looking up location names from their IDs
   */
  async getLocationDetails(locationIds: {
    brgyId?: string;
    cityId?: string;
    provinceId?: string;
    regionId?: string;
  }): Promise<{
    success: boolean;
    data?: {
      brgy_name?: string;
      city_name?: string;
      province_name?: string;
      region_name?: string;
    };
    message?: string;
  }> {
    try {
      const result: any = {};

      // Get brgy name
      if (locationIds.brgyId) {
        const { data: brgy } = await supabase
          .schema('module3')
          .from('brgy')
          .select('description')
          .eq('id', locationIds.brgyId)
          .maybeSingle();
        if (brgy) result.brgy_name = brgy.description;
      }

      // Get city name
      if (locationIds.cityId) {
        const { data: city } = await supabase
          .schema('module3')
          .from('city_municipality')
          .select('description')
          .eq('id', locationIds.cityId)
          .maybeSingle();
        if (city) result.city_name = city.description;
      }

      // Get province name
      if (locationIds.provinceId) {
        const { data: province } = await supabase
          .schema('module3')
          .from('province')
          .select('description')
          .eq('id', locationIds.provinceId)
          .maybeSingle();
        if (province) result.province_name = province.description;
      }

      // Get region name
      if (locationIds.regionId) {
        const { data: region } = await supabase
          .schema('module3')
          .from('region')
          .select('description')
          .eq('id', locationIds.regionId)
          .maybeSingle();
        if (region) result.region_name = region.description;
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('Get location details error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get location details',
      };
    }
  }

  /**
   * Search locations by name
   * Useful for autocomplete/typeahead functionality
   */
  async searchLocations(type: 'region' | 'province' | 'city' | 'brgy', searchTerm: string, parentId?: string): Promise<{
    success: boolean;
    data: Array<{ id: string; description: string }>;
    message?: string;
  }> {
    try {
      const tableName = type === 'city' ? 'city_municipality' : type;
      let query = supabase
        .schema('module3')
        .from(tableName)
        .select('id, description')
        .ilike('description', `%${searchTerm}%`)
        .order('description')
        .limit(20);

      // Add parent filter if provided
      if (parentId) {
        if (type === 'province') {
          query = query.eq('region', parentId);
        } else if (type === 'city') {
          query = query.eq('province', parentId);
        } else if (type === 'brgy') {
          query = query.eq('city_municipality', parentId);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Search locations error:', error);
        return {
          success: false,
          data: [],
          message: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (error) {
      console.error('Search locations error:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Failed to search locations',
      };
    }
  }
}

export const patientService = new PatientService();
export default patientService;
