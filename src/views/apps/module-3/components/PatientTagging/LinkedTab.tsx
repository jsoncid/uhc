import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Separator } from 'src/components/ui/separator';
import { Alert, AlertDescription } from 'src/components/ui/alert';
import { CheckCircle2, Database, RefreshCw } from 'lucide-react';
import { SearchInput, PatientCardSkeleton, EmptyState } from '../index';
import { LinkedPatientCard } from './LinkedPatientCard';
import { SupabasePatient, PatientToLink } from './types';

interface LinkedTabProps {
  // Search state
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onSearch: () => Promise<void>;
  isSearching: boolean;
  isLoading: boolean;
  linkedPatients: SupabasePatient[];
  linkedTotal: number;
  onClearSearch: () => void;
  onRefresh: () => Promise<void>;
  
  // Actions
  onViewHistory: (patient: SupabasePatient) => void;
  onAddLink: (patient: SupabasePatient) => void;
  onEditLink: (patient: PatientToLink) => void;
  onUnlink: (repositoryId: string, hpercode: string, patientName: string) => void;
  onSwitchToLinkTab: () => void;
}

export const LinkedTab = ({
  searchTerm,
  onSearchTermChange,
  onSearch,
  isSearching,
  isLoading,
  linkedPatients,
  linkedTotal,
  onClearSearch,
  onRefresh,
  onViewHistory,
  onAddLink,
  onEditLink,
  onUnlink,
  onSwitchToLinkTab,
}: LinkedTabProps) => {
  const isLoadingOrSearching = isSearching || isLoading;

  return (
    <div className="space-y-4">
      <Alert className="border-green-500/30 bg-green-50/50 dark:bg-green-900/10">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-foreground">
          View and manage successfully linked patients. These patients have full access to their
          hospital medical history.
        </AlertDescription>
      </Alert>

      {/* Search Linked Patients */}
      <Card className="border-2 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5 text-green-600" />
                Linked Patients
              </CardTitle>
              <CardDescription>
                {linkedTotal > 0
                  ? `${linkedTotal} patient${linkedTotal === 1 ? '' : 's'} successfully linked`
                  : 'No patients linked yet'}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoadingOrSearching}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingOrSearching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchInput
            value={searchTerm}
            onChange={onSearchTermChange}
            onSearch={onSearch}
            onClear={onClearSearch}
            placeholder="Search by name or HPERCODE..."
            isLoading={isSearching}
          />

          {/* Linked Patients Results */}
          {linkedPatients.length > 0 && !isLoading && (
            <div className="space-y-3">
              {searchTerm && (
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                    Found {linkedPatients.length} linked patient
                    {linkedPatients.length === 1 ? '' : 's'}
                  </p>
                </div>
              )}
              <Separator />
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {linkedPatients.map((patient) => (
                  <LinkedPatientCard
                    key={patient.id}
                    patient={patient}
                    onViewHistory={onViewHistory}
                    onAddLink={onAddLink}
                    onEditLink={onEditLink}
                    onUnlink={onUnlink}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoadingOrSearching && <PatientCardSkeleton count={3} />}

          {/* Empty State - No Search Results */}
          {!isLoadingOrSearching && linkedPatients.length === 0 && searchTerm && (
            <EmptyState
              variant="search"
              title="No Match Found"
              description={`No linked patients match "${searchTerm}". Try a different search.`}
            />
          )}

          {/* Empty State - No Linked Patients */}
          {!searchTerm && linkedPatients.length === 0 && !isLoadingOrSearching && (
            <EmptyState
              variant="link"
              title="No Linked Patients"
              description="Start linking patients to enable access to their hospital records and medical history."
              action={{
                label: 'Link Patients',
                onClick: onSwitchToLinkTab,
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LinkedTab;
