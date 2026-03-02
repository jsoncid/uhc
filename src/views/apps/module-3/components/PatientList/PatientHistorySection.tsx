/**
 * PatientHistorySection - Displays selected patient's history and details
 */
import { Button } from 'src/components/ui/button';
import { Alert, AlertDescription } from 'src/components/ui/alert';
import { X, History as HistoryIcon, Info, LinkIcon, FileText } from 'lucide-react';
import { PatientHistory } from 'src/services/patientService';
import PatientHistoryTabs from '../PatientHistoryTabs';
import PatientInfoCard from '../PatientInfoCard';
import { PatientWithRepository, PatientStats, ViewMode, TypeFilter, PatientInfoForCard } from './types';

interface PatientHistorySectionProps {
  selectedPatient: PatientWithRepository;
  selectedPatientHpercode?: string;
  filteredHistory: PatientHistory[];
  isLoadingHistory: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  typeFilter: TypeFilter;
  setTypeFilter: (filter: TypeFilter) => void;
  patientStats: PatientStats;
  getPatientInfoForCard: (patient: PatientWithRepository) => PatientInfoForCard;
  handleClosePatientView: () => void;
  handleOpenPatientRecords: () => void;
}

export const PatientHistorySection = ({
  selectedPatient,
  selectedPatientHpercode,
  filteredHistory,
  isLoadingHistory,
  viewMode,
  setViewMode,
  typeFilter,
  setTypeFilter,
  patientStats,
  getPatientInfoForCard,
  handleClosePatientView,
  handleOpenPatientRecords,
}: PatientHistorySectionProps) => {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header with Close Button */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <HistoryIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">
              {selectedPatient.first_name} {selectedPatient.middle_name} {selectedPatient.last_name}
            </h2>
            <p className="text-sm text-muted-foreground">Patient Medical History</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleClosePatientView}>
          <X className="h-4 w-4 mr-2" />
          Close
        </Button>
      </div>

      {/* Check if patient is linked */}
      {!selectedPatientHpercode ? (
        <Alert className="border-amber-200 bg-amber-50">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              <span>
                This patient is not linked to the hospital database. Link the patient in{' '}
                <strong>Patient Tagging</strong> to view their medical history.
              </span>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-12 gap-4">
          {/* Patient Information Card */}
          <div className="col-span-12 lg:col-span-4">
            <PatientInfoCard
              patient={getPatientInfoForCard(selectedPatient) as any}
              recentVisit={patientStats.recentVisit}
            />
          </div>

          {/* Patient History */}
          <div className="col-span-12 lg:col-span-8 space-y-3">
            <div className="flex items-center justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenPatientRecords}
                disabled={!selectedPatientHpercode}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                View Records
              </Button>
            </div>
            <PatientHistoryTabs
              history={filteredHistory}
              isLoading={isLoadingHistory}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              typeFilter={typeFilter}
              onTypeFilterChange={(filter: string) => setTypeFilter(filter as TypeFilter)}
              rightActions={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenPatientRecords}
                  disabled={!selectedPatientHpercode}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  View Records
                </Button>
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientHistorySection;
