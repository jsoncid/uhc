/**
 * RepositoryLookupModal - Dialog for searching and importing patient data from repository
 */
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Badge } from 'src/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'src/components/ui/dialog';
import {
  Database,
  Search,
  Building2,
  ChevronRight,
  Loader2,
  Users,
  User,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import FormField from '../FormField';
import { getFacilityIcon } from './utils';
import type { Facility, PatientProfileWithLocations } from 'src/services/patientService';
import type { BackendConnectionStatus } from './types';

type ModalStep = 1 | 2 | 3;

interface RepositoryLookupModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // Step state
  modalStep: ModalStep;
  setModalStep: (step: ModalStep) => void;
  // Facility state
  facilities: Facility[];
  isLoadingFacilities: boolean;
  facilityLoadError: string | null;
  repositoryAvailable: boolean;
  backendConnectionState: BackendConnectionStatus;
  // Selected facility
  modalFacilityId: string;
  modalFacilityDatabase: string;
  onSelectFacility: (facilityCode: string, database: string) => void;
  selectedFacility: Facility | undefined;
  // Search state
  modalSearchName: string;
  onSearchNameChange: (value: string) => void;
  searchError: string | null;
  isSearching: boolean;
  onSearch: () => void;
  // Results
  searchResults: PatientProfileWithLocations[];
  onSelectPatient: (patient: PatientProfileWithLocations) => void;
}

export const RepositoryLookupModal = ({
  isOpen,
  onOpenChange,
  modalStep,
  setModalStep,
  facilities,
  isLoadingFacilities,
  facilityLoadError,
  repositoryAvailable,
  backendConnectionState,
  modalFacilityId,
  modalFacilityDatabase,
  onSelectFacility,
  selectedFacility,
  modalSearchName,
  onSearchNameChange,
  searchError,
  isSearching,
  onSearch,
  searchResults,
  onSelectPatient,
}: RepositoryLookupModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden max-h-[90vh]">
        {/* Modal header with gradient */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 pt-6 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg">Repository Lookup</DialogTitle>
                <DialogDescription className="mt-0.5">
                  Search a facility's repository to pull existing patient data.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mt-5 overflow-x-auto">
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                modalStep >= 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              1. Facility
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                modalStep >= 2 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              2. Search
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                modalStep >= 3 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              3. Results
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          {/* Step 1: Select Facility */}
          {modalStep === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Choose a healthcare facility to search patient records from.
              </p>

              {facilityLoadError && (
                <p className="text-xs text-error">{facilityLoadError}</p>
              )}

              {isLoadingFacilities ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading facilities...</span>
                </div>
              ) : !repositoryAvailable ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Repository unavailable</p>
                  <p className="text-xs mt-1">
                    Backend server is currently offline. Please check the connection.
                  </p>
                </div>
              ) : facilities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No facilities found</p>
                  <p className="text-xs mt-1">
                    {backendConnectionState !== 'connected'
                      ? 'Backend server is offline'
                      : 'Check database connection'}
                  </p>
                </div>
              ) : (
                <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-1">
                  {facilities.map((facility) => {
                    const isSelected = modalFacilityId === facility.facility_code && modalFacilityDatabase === facility.database;
                    return (
                      <button
                        key={`${facility.facility_code}-${facility.database}`}
                        type="button"
                        onClick={() => {
                          onSelectFacility(facility.facility_code, facility.database || '');
                        }}
                        className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/30 hover:bg-muted/50'
                        }`}
                      >
                        <span className="text-xl">{getFacilityIcon(facility.facility_name)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {facility.facility_name}
                            </p>
                            <Badge
                              variant={facility.database === 'adnph_ihomis_plus' ? 'secondary' : 'warning'}
                              className="text-[9px] px-1.5 py-0 shrink-0"
                            >
                              {facility.database === 'adnph_ihomis_plus' ? 'ADNPH' : 'NDH'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {facility.patient_count.toLocaleString()} patients
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setModalStep(2)}
                  disabled={!modalFacilityId || !modalFacilityDatabase}
                  className="gap-2"
                >
                  Continue
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Search Patient */}
          {modalStep === 2 && (
            <div className="space-y-4">
              {/* Selected facility chip */}
              <div className="space-y-2">
                {selectedFacility && (
                  <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
                    <span className="text-base">{getFacilityIcon(selectedFacility.facility_name)}</span>
                    <span className="text-sm font-medium">{selectedFacility.facility_name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({selectedFacility.patient_count.toLocaleString()} patients)
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalStep(1)}
                      className="ml-auto text-xs text-primary hover:underline"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              <FormField
                label="Search Patient Name"
                htmlFor="modal-search-name"
                hint="Enter full or partial patient name (last name, first name, or hpercode)."
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    id="modal-search-name"
                    value={modalSearchName}
                    onChange={(e) => onSearchNameChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        onSearch();
                      }
                    }}
                    placeholder="e.g. Dela Cruz, Juan or HPERCODE"
                    className="pl-10"
                    autoFocus
                  />
                </div>
              </FormField>

              {/* Search error */}
              {searchError && (
                <div className="flex items-start gap-2 rounded-lg bg-lighterror px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 text-error shrink-0 mt-0.5" />
                  <p className="text-xs text-error">{searchError}</p>
                </div>
              )}

              {/* Quick info */}
              <div className="flex items-start gap-2 rounded-lg bg-lightinfo px-3 py-2.5">
                <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
                <p className="text-xs text-info">
                  {selectedFacility
                    ? `Search the ${selectedFacility.facility_name} repository for existing patient records.`
                    : 'Search the selected facility repository for existing patient records.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" size="sm" onClick={() => setModalStep(1)} className="gap-2">
                  Back
                </Button>
                <Button
                  onClick={onSearch}
                  disabled={isSearching || modalSearchName.trim().length < 2}
                  className="gap-2"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Search Database
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Search Results */}
          {modalStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Found <span className="font-semibold text-foreground">{searchResults.length}</span> patients
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModalStep(2)}
                  className="gap-2"
                >
                  <Search className="h-4 w-4" />
                  New Search
                </Button>
              </div>

              {/* Results list */}
              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                {searchResults.map((p) => (
                  <button
                    key={p.hpercode || p.id}
                    type="button"
                    onClick={() => onSelectPatient(p)}
                    className="w-full flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-left transition-all hover:border-primary hover:bg-primary/5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {p.last_name}, {p.first_name} {p.middle_name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{p.hpercode}</span>
                        {p.sex && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{p.sex}</span>
                          </>
                        )}
                        {p.birth_date && (
                          <>
                            <span>•</span>
                            <span>{p.birth_date}</span>
                          </>
                        )}
                      </div>
                      {p.brgy_name && (
                        <p className="text-xs text-muted-foreground mt-1">
                          📍 {p.brgy_name}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>

              {searchResults.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No patients found</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RepositoryLookupModal;
