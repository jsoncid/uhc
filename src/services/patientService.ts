/**
 * Patient Service - API calls for patient data from MySQL database
 */

// Get API URL from environment or use default backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
  async checkHealth(): Promise<{ status: string; database: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
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
        status: 'unhealthy',
        database: 'unknown',
      };
    }
  }
}

export const patientService = new PatientService();
export default patientService;
