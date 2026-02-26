import { PatientProfile, PatientSearchResult, SearchPagination } from 'src/services/patientService';

export interface PatientDatabaseBucket {
  metadata: {
    db_name: string;
    description?: string;
  };
  data: PatientProfile[];
  pagination?: SearchPagination;
}

export interface PatientDatabaseSummary {
  dbName: string;
  description?: string;
  count: number;
}

const LEGACY_DB_FRIENDLY_NAMES: Record<string, string> = {
  adnph_ihomis_plus: 'AGUSAN DEL NORTE PROVINCIAL HOSPITAL',
  ndh_ihomis_plus: 'NASIPIT DISTRICT HOSPITAL',
};

const normalizeMetadata = (name?: string, description?: string) => ({
  db_name: name || 'unknown',
  description: description || (name ? LEGACY_DB_FRIENDLY_NAMES[name] : undefined) || name,
});

export const getPatientSearchBuckets = (result: PatientSearchResult): PatientDatabaseBucket[] => {
  if (Array.isArray(result.databases) && result.databases.length > 0) {
    return result.databases
      .filter(Boolean)
      .map((bucket) => {
        const metadataSource = bucket.metadata ?? { db_name: bucket.name, description: bucket.description };
        return {
          metadata: normalizeMetadata(metadataSource.db_name, metadataSource.description),
          data: bucket.data || [],
          pagination: bucket.pagination,
        };
      });
  }

  const buckets: PatientDatabaseBucket[] = [];

  const pushLegacy = (legacy?: { name: string; data: PatientProfile[]; count: number }) => {
    if (!legacy || !legacy.data) return;
    buckets.push({
      metadata: normalizeMetadata(legacy.name),
      data: legacy.data,
      pagination: {
        total: legacy.count,
        limit: legacy.count,
        page: 1,
        totalPages: 1,
      },
    });
  };

  pushLegacy(result.database1);
  pushLegacy(result.database2);

  if (buckets.length === 0 && result.data) {
    buckets.push({
      metadata: normalizeMetadata('legacy', 'Hospital Repository'),
      data: result.data,
      pagination: {
        total: result.count ?? result.data.length,
        limit: result.data.length,
        page: 1,
        totalPages: 1,
      },
    });
  }

  return buckets;
};

export const getPatientSearchTotalMatches = (
  result: PatientSearchResult,
  buckets: PatientDatabaseBucket[]
): number => {
  if (typeof result.total_count === 'number') {
    return result.total_count;
  }
  return buckets.reduce((sum, bucket) => sum + (bucket.pagination?.total ?? bucket.data.length), 0);
};

export const getPatientSearchSummaries = (buckets: PatientDatabaseBucket[]): PatientDatabaseSummary[] => {
  return buckets.map((bucket) => ({
    dbName: bucket.metadata.db_name,
    description: bucket.metadata.description,
    count: bucket.pagination?.total ?? bucket.data.length,
  }));
};
