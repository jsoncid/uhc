import { Facility, FacilityListResult } from 'src/services/patientService';

// Frontend consumers mirror the backend view of module3.db_informations, so we just flatten
// the facility buckets returned by `/api/patients/facilities/list`.
export const mapFacilityList = (payload: FacilityListResult): Facility[] => {
  const facilities: Facility[] = [];

  const pushBucket = (
    bucket?: {
      name?: string;
      data?: {
        facility_code: string;
        facility_name: string;
        patient_count: number;
      }[];
    }
  ) => {
    if (!bucket?.name) return;
    bucket.data?.forEach((entry) => {
      if (!entry.facility_code) {
        return;
      }
      facilities.push({
        facility_code: entry.facility_code,
        facility_name: entry.facility_name,
        patient_count: entry.patient_count,
        database: bucket.name,
      });
    });
  };

  if (Array.isArray(payload.databases)) {
    payload.databases.forEach((bucket) => pushBucket(bucket));
  }

  pushBucket(payload.database1);
  pushBucket(payload.database2);

  return facilities;
};
