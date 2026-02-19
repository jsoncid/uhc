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
  brgy: string;
  brgy_name?: string;
  street?: string;
  city_code?: string;
  city_name?: string;
  province_code?: string;
  province_name?: string;
  region_name?: string;
  zip_code?: string;
}

export interface PatientSearchResult {
  success: boolean;
  data: PatientProfile[];
  count: number;
  message?: string;
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
  data: {
    facility_code: string;
    facility_name: string;
    facility_type: string;
    patient_count: number;
  }[];
  message?: string;
}

export interface Facility {
  facility_code: string;
  facility_name: string;
  facility_type: string;
  patient_count: number;
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
    options?: { facility?: string; limit?: number }
  ): Promise<PatientSearchResult> {
    try {
      const params = new URLSearchParams({ name });
      if (options?.facility) params.append('facility', options.facility);
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
   * Get list of facilities
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
        data: [],
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
   */
  async findOrCreateBrgy(locationData: {
    brgy?: string;
    brgy_name?: string;
    city_name?: string;
    province_name?: string;
    region_name?: string;
  }): Promise<string | null> {
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
        brgy: locationData.brgy_name
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
              region: regionId
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
              province: provinceId
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
          return existingBrgy.id;
        } else {
          const { data: newBrgy, error } = await supabase
            .schema('module3')
            .from('brgy')
            .insert({
              description: locationData.brgy_name,
              city_municipality: cityId
            })
            .select('id')
            .single();

          if (error) {
            console.error('Error creating brgy:', error);
            console.error('Error details:', error.message);
            return null;
          }

          console.log('Created new brgy:', newBrgy.id);
          return newBrgy.id;
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
      city_code?: string;
      city_name?: string;
      province_code?: string;
      province_name?: string;
      region_name?: string;
      zip_code?: string;
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
        console.log(`Patient ID "${patientData.id}" is not a valid UUID. Supabase will generate a new one.`);
      }

      // Check if brgy is a valid UUID, if not, try to find/create one
      let brgyUuid: string | null = null;

      if (isValidUuid(patientData.brgy)) {
        brgyUuid = patientData.brgy!;
      } else if (patientData.brgy_name || patientData.brgy) {
        // Try to find or create brgy based on location data
        brgyUuid = await this.findOrCreateBrgy({
          brgy: patientData.brgy,
          brgy_name: patientData.brgy_name,
          city_name: patientData.city_name,
          province_name: patientData.province_name,
          region_name: patientData.region_name,
        });
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
        brgy: brgyUuid,
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
      if (!existingPatient && patientData.first_name && patientData.last_name && patientData.birth_date) {
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
   */
  private async savePatientRepository(data: {
    patient_profile_id: string;
    hpercode: string;
    facility_code?: string;
  }): Promise<void> {
    try {
      console.log('Saving patient repository record:', data);
      
      // Check if repository record exists for this patient_profile
      const { data: existingRepo } = await supabase
        .schema('module3')
        .from('patient_repository')
        .select('id')
        .eq('patient_profile', data.patient_profile_id)
        .maybeSingle();

      if (existingRepo) {
        // Update existing record
        const { error } = await supabase
          .schema('module3')
          .from('patient_repository')
          .update({
            hpercode: data.hpercode,
            facility_code: data.facility_code || null,
          })
          .eq('id', existingRepo.id);

        if (error) {
          console.error('Error updating patient_repository:', error);
        } else {
          console.log('Patient repository record updated');
        }
      } else {
        // Insert new record
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
}

export const patientService = new PatientService();
export default patientService;
