import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Separator } from 'src/components/ui/separator';
import { Alert, AlertDescription } from 'src/components/ui/alert';
import { Info, UserPlus, CheckCircle2 } from 'lucide-react';
import {
  ProcessStepper,
  SearchInput,
  PatientCardSkeleton,
  EmptyState,
} from '../index';
import { UnlinkedPatientCard } from './UnlinkedPatientCard';
import { SupabasePatient } from './types';

interface LinkTabProps {
  // Search state
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onSearch: () => Promise<void>;
  isSearching: boolean;
  searchResults: SupabasePatient[];
  onClearResults: () => void;
  onLinkPatient: (patient: SupabasePatient) => void;
}

const LINKING_STEPS = [
  { title: 'Search Patient', description: 'Find unlinked profile', color: 'blue' as const },
  { title: 'Click Link', description: 'Open linking dialog', color: 'purple' as const },
  { title: 'Match Record', description: 'Find hospital match', color: 'emerald' as const },
  { title: 'Complete', description: 'Full access enabled', color: 'amber' as const, icon: CheckCircle2 },
];

export const LinkTab = ({
  searchTerm,
  onSearchTermChange,
  onSearch,
  isSearching,
  searchResults,
  onClearResults,
  onLinkPatient,
}: LinkTabProps) => {
  return (
    <div className="space-y-4">
      <Alert className="border-primary/30 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-foreground">
          Connect manually entered patient profiles with their hospital database records. Only
          unlinked patients will appear in search results.
        </AlertDescription>
      </Alert>

      {/* How it Works - Using ProcessStepper */}
      <ProcessStepper title="How to Link" steps={LINKING_STEPS} />

      {/* Search Manually Entered Patients */}
      <Card className="border-2 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserPlus className="h-5 w-5 text-primary" />
            Unlinked Patients
          </CardTitle>
          <CardDescription>Find and link manually created patient profiles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SearchInput
            value={searchTerm}
            onChange={onSearchTermChange}
            onSearch={onSearch}
            onClear={onClearResults}
            placeholder="Search by patient name..."
            isLoading={isSearching}
          />

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Found {searchResults.length} patient(s)</p>
                <Button variant="ghost" size="sm" onClick={onClearResults}>
                  Clear Results
                </Button>
              </div>
              <Separator />
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {searchResults.map((patient) => (
                  <UnlinkedPatientCard
                    key={patient.id}
                    patient={patient}
                    onLink={onLinkPatient}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isSearching && <PatientCardSkeleton count={3} />}

          {/* Empty State */}
          {!isSearching && searchResults.length === 0 && searchTerm && (
            <EmptyState
              variant="search"
              title="No Results Found"
              description={`No unlinked patients matching "${searchTerm}". The patient may not exist or is already linked.`}
            />
          )}

          {/* Initial Empty State */}
          {!searchTerm && searchResults.length === 0 && !isSearching && (
            <EmptyState
              icon={UserPlus}
              variant="link"
              title="Ready to Link Patients"
              description="Search for manually created patients that need to be linked with the hospital database."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LinkTab;
