/**
 * Utility functions for Patient List feature
 */
import { PatientWithRepository, PatientInfoForCard } from './types';
import { getFacilityName } from 'src/utils/facilityMapping';

/**
 * Calculate age from birth date
 */
export const calculateAge = (birthDate: string): string => {
  if (!birthDate) return '';
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return `${age}y`;
};

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Get location string from patient data
 */
export const getLocationString = (patient: PatientWithRepository): string => {
  // First try to use the joined location hierarchy
  if (patient.brgy?.city_municipality) {
    const brgy = patient.brgy.description || '';
    const city = patient.brgy.city_municipality.description || '';
    const province = patient.brgy.city_municipality.province?.description || '';
    const region = patient.brgy.city_municipality.province?.region?.description || '';

    // Build location string from most specific to general
    const parts = [brgy, city, province, region].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  }

  // Fallback to manual text fields
  const parts = [
    patient.brgy_name,
    patient.city_name,
    patient.province_name,
    patient.region_name
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : 'N/A';
};

/**
 * Get facility name from patient data
 */
export const getFacility = (patient: PatientWithRepository): string => {
  // Get facility_code from patient_repository array (first entry)
  const facilityCode = patient.patient_repository?.[0]?.facility_code;
  return getFacilityName(facilityCode);
};

/**
 * Check if patient is linked to hospital records
 */
export const isPatientLinked = (patient: PatientWithRepository): boolean => {
  return patient.patient_repository?.some((r) => r.hpercode) || false;
};

/**
 * Get link count for patient
 */
export const getPatientLinkCount = (patient: PatientWithRepository): number => {
  return patient.patient_repository?.filter((r) => r.hpercode).length || 0;
};

/**
 * Get patient initials for avatar
 */
export const getPatientInitials = (patient: PatientWithRepository): string => {
  return `${patient.first_name?.[0] || ''}${patient.last_name?.[0] || ''}`.toUpperCase();
};

/**
 * Convert patient data to format expected by PatientInfoCard
 */
export const getPatientInfoForCard = (patient: PatientWithRepository): PatientInfoForCard => {
  return {
    id: patient.id,
    hpercode: patient.patient_repository?.[0]?.hpercode || patient.id,
    first_name: patient.first_name,
    middle_name: patient.middle_name,
    last_name: patient.last_name,
    ext_name: patient.ext_name,
    sex: patient.sex,
    birth_date: patient.birth_date,
    facility_code: patient.patient_repository?.[0]?.facility_code,
    facility_display_name: getFacility(patient),
    brgy_name: patient.brgy?.description || patient.brgy_name,
    city_name: patient.brgy?.city_municipality?.description || patient.city_name,
    province_name: patient.brgy?.city_municipality?.province?.description || patient.province_name,
    region_name: patient.brgy?.city_municipality?.province?.region?.description || patient.region_name,
    street: patient.street,
    created_at: patient.created_at,
    brgy: patient.brgy,
  };
};
