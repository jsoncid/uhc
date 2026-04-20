import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'src/components/ui/card';
import { Alert, AlertDescription } from 'src/components/ui/alert';
import { Info, Database, Search, User, Activity, History as HistoryIcon, ArrowRight } from 'lucide-react';
import PatientSearchPanel, { PatientSearchResultProfile } from '../PatientSearchPanel';
import PatientInfoCard from '../PatientInfoCard';
import PatientHistoryTabs from '../PatientHistoryTabs';
import { PatientDatabaseSummary, PatientHistory, PatientStats } from './types';

interface ViewHistoryTabProps {
  // Search state
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onSearch: (term?: string) => void;
  isSearching: boolean;
  searchResults: PatientSearchResultProfile[];
  onSelectPatient: (patient: PatientSearchResultProfile) => Promise<void>;
  onClearResults: () => void;
  totalMatches: number;
  displayedCount: number;
  databaseSummaries: PatientDatabaseSummary[];
  
  // Selected patient state
  selectedPatient: PatientSearchResultProfile | null;
  patientStats: PatientStats;
  
  // History state
  filteredHistory: PatientHistory[];
  isLoadingHistory: boolean;
  viewMode: 'timeline' | 'table';
  onViewModeChange: (mode: 'timeline' | 'table') => void;
  typeFilter: string;
  onTypeFilterChange: (filter: string) => void;
  
  // Actions
  onViewRecords: () => void;
  viewRecordsDisabled: boolean;
}

export const ViewHistoryTab = ({
  searchTerm,
  onSearchTermChange,
  onSearch,
  isSearching,
  searchResults,
  onSelectPatient,
  onClearResults,
  totalMatches,
  displayedCount,
  databaseSummaries,
  selectedPatient,
  patientStats,
  filteredHistory,
  isLoadingHistory,
  viewMode,
  onViewModeChange,
  typeFilter,
  onTypeFilterChange,
  onViewRecords,
  viewRecordsDisabled,
}: ViewHistoryTabProps) => {
  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Search hospital database patients to view their complete medical history, admissions, and
          encounters.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5 text-primary" />
            Hospital Database Search
          </CardTitle>
          <CardDescription>Search by patient name or HPERCODE</CardDescription>
        </CardHeader>
        <CardContent>
          <PatientSearchPanel
            searchTerm={searchTerm}
            onSearchTermChange={onSearchTermChange}
            onSearch={onSearch}
            isSearching={isSearching}
            searchResults={searchResults}
            onSelectPatient={onSelectPatient}
            onClearResults={onClearResults}
            totalMatches={totalMatches}
            displayedCount={displayedCount}
            databaseSummaries={databaseSummaries}
          />
        </CardContent>
      </Card>

      {/* Selected Patient Details */}
      {selectedPatient && (
        <div className="grid grid-cols-12 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Patient Information Card */}
          <div className="col-span-12 lg:col-span-4">
            <PatientInfoCard patient={selectedPatient} recentVisit={patientStats.recentVisit} />
          </div>

          {/* Patient History */}
          <div className="col-span-12 lg:col-span-8 space-y-3">
            <PatientHistoryTabs
              history={filteredHistory}
              isLoading={isLoadingHistory}
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
              typeFilter={typeFilter}
              onTypeFilterChange={onTypeFilterChange}
              onViewRecords={onViewRecords}
              viewRecordsDisabled={viewRecordsDisabled}
            />
          </div>
        </div>
      )}

      {/* Empty State for View Tab */}
      {!selectedPatient && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl"></div>
              <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 rounded-full p-6">
                <Search className="h-14 w-14 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-2">No Patient Selected</h3>
            <p className="text-muted-foreground text-center max-w-lg mb-6">
              Search for a patient to view their medical history and hospital records.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <User className="h-5 w-5 text-blue-500" />
                </div>
                <span className="text-muted-foreground">Patient Info</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <HistoryIcon className="h-5 w-5 text-purple-500" />
                </div>
                <span className="text-muted-foreground">Medical History</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-emerald-500/10 rounded-lg">
                  <Activity className="h-5 w-5 text-emerald-500" />
                </div>
                <span className="text-muted-foreground">Timeline View</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ViewHistoryTab;
