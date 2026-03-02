/**
 * Utility functions for Patient Profiling feature
 */

/**
 * Get facility icon based on facility type
 */
export const getFacilityIcon = (type: string): string => {
  const typeUpper = type?.toUpperCase() || '';
  if (typeUpper.includes('HOSPITAL')) return '🏥';
  if (typeUpper.includes('RURAL') || typeUpper.includes('RHU')) return '🌿';
  if (typeUpper.includes('BARANGAY') || typeUpper.includes('BHS')) return '🏘️';
  if (typeUpper.includes('CLINIC')) return '⚕️';
  if (typeUpper.includes('CENTER')) return '🏛️';
  return '🏥';
};

/**
 * Calculate age from birth date
 */
export const calculateAge = (birthDate: string): { years: number; months: number } | null => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();
  if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
    years--;
    months += 12;
  }
  if (today.getDate() < birth.getDate()) {
    months--;
    if (months < 0) months += 12;
  }
  return { years, months };
};

/**
 * Format age for display
 */
export const formatAgeDisplay = (birthDate: string): string | null => {
  const age = calculateAge(birthDate);
  if (!age) return null;
  if (age.years === 0) return `${age.months} month${age.months !== 1 ? 's' : ''} old`;
  return `${age.years} year${age.years !== 1 ? 's' : ''} old`;
};

/**
 * Capitalize status label
 */
export const capitalizeStatusLabel = (value?: string, fallback = 'Unknown'): string => {
  if (!value) return fallback;
  const parts = value.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (!parts.length) return fallback;
  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Get status badge variant
 */
export const getStatusBadgeVariant = (status?: string): 'outline' | 'secondary' | 'success' | 'warning' | 'destructive' => {
  if (!status) return 'outline';
  const normalized = status.toLowerCase();
  if (['ok', 'healthy', 'connected', 'available'].includes(normalized)) return 'success';
  if (normalized.includes('warn') || normalized.includes('degrad')) return 'warning';
  if (normalized.includes('error') || normalized.includes('down') || normalized.includes('failed') || normalized.includes('disconnected')) return 'destructive';
  return 'secondary';
};

/**
 * Format uptime from seconds
 */
export const formatUptime = (seconds?: number): string => {
  if (seconds == null || Number.isNaN(seconds)) return '—';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const parts = [];
  if (hrs) parts.push(`${hrs}h`);
  if (mins) parts.push(`${mins}m`);
  if (secs || !parts.length) parts.push(`${secs}s`);
  return parts.join(' ');
};
