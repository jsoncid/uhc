/**
 * Facility Code to Name Mapping
 * Maps facility codes to their full facility names
 */

export const FACILITY_MAP: Record<string, string> = {
  '0005027': 'Agusan del Norte Provincial Hospital',
  '0005028': 'Butuan Medical Center',
  '0005029': 'Caraga Regional Hospital',
  // Add more facilities as needed
};

/**
 * Get facility name by code
 * @param code - Facility code
 * @returns Facility name or the code if not found
 */
export const getFacilityName = (code?: string): string => {
  if (!code) return 'N/A';
  return FACILITY_MAP[code] || code;
};

/**
 * Get all facility codes
 */
export const getAllFacilityCodes = (): string[] => {
  return Object.keys(FACILITY_MAP);
};

/**
 * Get all facility names
 */
export const getAllFacilityNames = (): string[] => {
  return Object.values(FACILITY_MAP);
};
