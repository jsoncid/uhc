/**
 * Patient helper utilities for Module 3
 */
import { Activity, CheckCircle2, XCircle, Heart, FileText, Stethoscope } from 'lucide-react';
import { Badge } from 'src/components/ui/badge';
import { cn } from 'src/lib/utils';
import { PatientHistory } from 'src/services/patientService';

/**
 * Get encounter type label
 */
export const getEncounterType = (record: PatientHistory) => {
  const type = record.encounter_toecode?.toString() || '';
  const typeMap: Record<string, string> = {
    '1': 'Outpatient',
    '2': 'Emergency',
    '3': 'Inpatient',
    '4': 'Referral',
  };
  return typeMap[type] || type || 'Unknown';
};

/**
 * Get admission type based on record data
 */
export const getAdmissionType = (record: PatientHistory) => {
  if (record.disdate) return 'Discharge';
  if (record.admdate) return 'Admission';
  return 'Record';
};

/**
 * Get icon for record type
 */
export const getRecordTypeIcon = (record: PatientHistory) => {
  if (record.disdate) return <FileText className="h-4 w-4 text-white" />;
  if (record.admdate) return <Activity className="h-4 w-4 text-white" />;
  return <Stethoscope className="h-4 w-4 text-white" />;
};

/**
 * Get color class for record type
 */
export const getRecordTypeColor = (record: PatientHistory) => {
  if (record.disdate) return 'bg-emerald-500';
  if (record.admdate) return 'bg-blue-500';
  return 'bg-purple-500';
};

/**
 * Get status badge component
 */
export const getStatusBadge = (status?: string) => {
  if (!status) return null;

  const statusConfig: Record<string, { 
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    label: string;
    icon: React.ReactNode;
    className?: string;
  }> = {
    'A': { 
      variant: 'default', 
      label: 'Admitted', 
      icon: <Activity className="h-3 w-3 mr-1" />,
      className: 'bg-blue-500 hover:bg-blue-600'
    },
    'D': { 
      variant: 'secondary', 
      label: 'Discharged', 
      icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
      className: 'bg-emerald-500 hover:bg-emerald-600 text-white'
    },
    'C': { 
      variant: 'destructive', 
      label: 'Cancelled', 
      icon: <XCircle className="h-3 w-3 mr-1" />
    },
    'I': { 
      variant: 'default', 
      label: 'Inpatient', 
      icon: <Heart className="h-3 w-3 mr-1" />,
      className: 'bg-purple-500 hover:bg-purple-600'
    },
  };

  const config = statusConfig[status] || { 
    variant: 'outline' as const, 
    label: status, 
    icon: null 
  };

  return (
    <Badge variant={config.variant} className={cn('flex items-center gap-1', config.className)}>
      {config.icon}
      {config.label}
    </Badge>
  );
};

/**
 * Get facility icon based on type
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
