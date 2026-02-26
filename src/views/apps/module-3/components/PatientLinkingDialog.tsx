import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'src/components/ui/dialog';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select';
import { Card, CardContent } from 'src/components/ui/card';
import { Badge } from 'src/components/ui/badge';
import { Alert, AlertDescription } from 'src/components/ui/alert';
import { Separator } from 'src/components/ui/separator';
import { Checkbox } from 'src/components/ui/checkbox';
import {
  Search,
  User,
  Building2,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  CheckSquare,
  Square,
} from 'lucide-react';
import patientService, { PatientProfileWithLocations as PatientProfile, Facility } from 'src/services/patientService';
import { mapFacilityList } from '../utils/facilityHelpers';
import {
  getPatientSearchBuckets,
  getPatientSearchSummaries,
  PatientDatabaseSummary,
} from '../utils/patientSearchResultHelpers';

interface PatientLinkingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supabasePatient: {
    id: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    sex: string;
    birth_date: string;
  } | null;
  onLinkSuccess?: () => void;
}

export const PatientLinkingDialog = ({
  open,
  onOpenChange,
  supabasePatient,
  onLinkSuccess,
}: PatientLinkingDialogProps) => {
  // State
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedDatabase, setSelectedDatabase] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [mysqlSearchResults, setMysqlSearchResults] = useState<PatientProfile[]>([]);
  const [selectedMysqlPatients, setSelectedMysqlPatients] = useState<PatientProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [linkingProgress, setLinkingProgress] = useState({ current: 0, total: 0 });
  const [searchMeta, setSearchMeta] = useState<{ totalMatches: number; databaseSummaries: PatientDatabaseSummary[] }>({
    totalMatches: 0,
    databaseSummaries: [],
  });

  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
  const [facilityLoadError, setFacilityLoadError] = useState<string | null>(null);
  const validFacilities = facilities.filter((facility) => facility.facility_code);

  const loadFacilities = useCallback(async () => {
    setIsLoadingFacilities(true);
    setFacilityLoadError(null);
    try {
      const response = await patientService.getFacilities();
      if (!response.success) {
        throw new Error(response.message || 'Unable to load repository metadata');
      }

      const normalized = mapFacilityList(response);
      if (!normalized.length) {
        setFacilityLoadError('No repository databases are configured in module3.db_informations.');
      }

      setFacilities(normalized);
    } catch (error) {
      console.error('Failed to load facilities:', error);
      setFacilities([]);
      setFacilityLoadError(error instanceof Error ? error.message : 'Failed to load facilities');
    } finally {
      setIsLoadingFacilities(false);
    }
  }, []);

  // Load facilities on mount
  useEffect(() => {
    if (open) {
      void loadFacilities();
      // Reset state when dialog opens
      setSearchTerm('');
      setMysqlSearchResults([]);
      setSelectedMysqlPatients([]);
      setSelectedFacility('');
      setSelectedDatabase('');
      setError(null);
      setSuccess(false);
      setLinkingProgress({ current: 0, total: 0 });
      setFacilityLoadError(null);
    }
  }, [open, loadFacilities]);

  // Toggle single patient selection
  const togglePatientSelection = (patient: PatientProfile) => {
    setSelectedMysqlPatients(prev => {
      const isSelected = prev.some(p => p.hpercode === patient.hpercode);
      if (isSelected) {
        return prev.filter(p => p.hpercode !== patient.hpercode);
      } else {
        return [...prev, patient];
      }
    });
  };

  // Select all visible patients
  const selectAll = () => {
    setSelectedMysqlPatients(mysqlSearchResults);
  };

  // Deselect all patients
  const deselectAll = () => {
    setSelectedMysqlPatients([]);
  };

  // Check if a patient is selected
  const isPatientSelected = (patient: PatientProfile) => {
    return selectedMysqlPatients.some(p => p.hpercode === patient.hpercode);
  };

  const handleSearchMySQL = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a search term');
      return;
    }

    setIsSearching(true);
    setError(null);
    setMysqlSearchResults([]);
    setSearchMeta({ totalMatches: 0, databaseSummaries: [] });
    try {
      const result = await patientService.searchPatients(searchTerm, {
        database: selectedDatabase || undefined,
        limit: 20,
      });

      if (result.success) {
        const buckets = getPatientSearchBuckets(result);
        const filteredBuckets = buckets.map((bucket) => {
          const filteredData = selectedFacility
            ? bucket.data.filter((patient) => patient.facility_code === selectedFacility)
            : bucket.data;
          return {
            ...bucket,
            data: filteredData,
            pagination: {
              ...bucket.pagination,
              total: filteredData.length,
            },
          };
        });

        const allPatients = filteredBuckets.flatMap((bucket) => bucket.data);
        setMysqlSearchResults(allPatients);
        setSelectedMysqlPatients([]);
        setSearchMeta({
          totalMatches: allPatients.length,
          databaseSummaries: getPatientSearchSummaries(filteredBuckets),
        });

        if (allPatients.length === 0) {
          setError('No patients found in hospital database with that search term');
        }
      } else {
        setSearchMeta({ totalMatches: 0, databaseSummaries: [] });
        setError(result.message || 'Failed to search patients');
      }
    } catch (err) {
      setSearchMeta({ totalMatches: 0, databaseSummaries: [] });
      setError(err instanceof Error ? err.message : 'Failed to search patients');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLink = async () => {
    if (!supabasePatient || selectedMysqlPatients.length === 0) {
      setError('Please select at least one MySQL patient to link');
      return;
    }

    setIsLinking(true);
    setError(null);
    setLinkingProgress({ current: 0, total: selectedMysqlPatients.length });

    const errors: string[] = [];
    let successCount = 0;

    try {
      for (let i = 0; i < selectedMysqlPatients.length; i++) {
        const patient = selectedMysqlPatients[i];
        setLinkingProgress({ current: i + 1, total: selectedMysqlPatients.length });
        
        try {
          const result = await patientService.linkPatientToMySQL(
            supabasePatient.id,
            patient.hpercode!,
            patient.facility_code || selectedFacility || undefined
          );

          if (result.success) {
            successCount++;
          } else {
            errors.push(`${patient.last_name}, ${patient.first_name}: ${result.message || 'Failed'}`);
          }
        } catch (err) {
          errors.push(`${patient.last_name}, ${patient.first_name}: ${err instanceof Error ? err.message : 'Failed'}`);
        }
      }

      if (successCount === selectedMysqlPatients.length) {
        setSuccess(true);
        setTimeout(() => {
          onLinkSuccess?.();
          onOpenChange(false);
        }, 1500);
      } else if (successCount > 0) {
        setSuccess(true);
        setError(`Linked ${successCount} of ${selectedMysqlPatients.length} patients. Errors: ${errors.join('; ')}`);
        setTimeout(() => {
          onLinkSuccess?.();
          onOpenChange(false);
        }, 3000);
      } else {
        setError(`Failed to link patients: ${errors.join('; ')}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link patients');
    } finally {
      setIsLinking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearchMySQL();
    }
  };

  if (!supabasePatient) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-primary" />
            Link Patient to MySQL Database
          </DialogTitle>
          <DialogDescription>
            Connect this manually entered patient profile with an existing patient record in the MySQL
            database (Hospital Information System).
          </DialogDescription>
        </DialogHeader>

        {/* Success Message */}
        {success && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-900/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              Patient successfully linked! The profile now has access to hospital records.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && !success && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Supabase Patient Info */}
          <div>
            <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Manually Entered Patient (Supabase)
            </Label>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-lg">
                      {supabasePatient.last_name}, {supabasePatient.first_name}{' '}
                      {supabasePatient.middle_name}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="capitalize">{supabasePatient.sex}</span>
                      <span>•</span>
                      <span>{supabasePatient.birth_date}</span>
                    </div>
                  </div>
                  <Badge variant="outline">Supabase</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-center py-2">
            <ArrowRight className="h-8 w-8 text-muted-foreground" />
          </div>

          <Separator />

          {/* Facility Selection */}
          <div>
            <Label htmlFor="facility" className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4" />
              Facility (Optional)
            </Label>
            <div className="flex gap-2">
                <Select
                  value={selectedFacility}
                  onValueChange={(value) => {
                    setSelectedFacility(value);
                    const facility = facilities.find((f) => f.facility_code === value);
                    setSelectedDatabase(facility?.database || '');
                  }}
                  disabled={isLoadingFacilities}
                >
                <SelectTrigger id="facility">
                  <SelectValue placeholder="Select a facility to filter results" />
                </SelectTrigger>
                <SelectContent>
                  {validFacilities.length === 0 ? (
                    <SelectItem value="facility-placeholder" disabled>
                      {isLoadingFacilities
                        ? 'Loading repositories…'
                        : facilityLoadError || 'No repositories configured yet.'}
                    </SelectItem>
                  ) : (
                    validFacilities.map((facility) => (
                      <SelectItem key={facility.facility_code} value={facility.facility_code}>
                        {facility.facility_name} ({facility.patient_count.toLocaleString()} patients)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedFacility && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setSelectedFacility('');
                    setSelectedDatabase('');
                  }}
                  title="Clear facility filter"
                >
                  ✕
                </Button>
              )}
            </div>
          </div>

          {/* MySQL Patient Search */}
          <div>
            <Label htmlFor="search" className="flex items-center gap-2 mb-2">
              <Search className="h-4 w-4" />
              Search Hospital Database (MySQL)
            </Label>
            <div className="flex gap-2">
              <Input
                id="search"
                placeholder="Enter patient name or HPERCODE..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button onClick={handleSearchMySQL} disabled={isSearching}>
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* MySQL Search Results */}
          {mysqlSearchResults.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Select Hospital Patient(s) to Link</Label>
                <div className="flex items-center gap-2">
                  {selectedMysqlPatients.length > 0 && (
                    <Badge variant="secondary">
                      {selectedMysqlPatients.length} selected
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={selectAll}
                    disabled={selectedMysqlPatients.length === mysqlSearchResults.length}
                    className="h-7 px-2 text-xs"
                  >
                    <CheckSquare className="h-3 w-3 mr-1" />
                    Select All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={deselectAll}
                    disabled={selectedMysqlPatients.length === 0}
                    className="h-7 px-2 text-xs"
                  >
                    <Square className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>
              {searchMeta.totalMatches > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Showing {mysqlSearchResults.length} of {searchMeta.totalMatches} record{searchMeta.totalMatches === 1 ? '' : 's'}
                </p>
              )}
              {searchMeta.databaseSummaries.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {searchMeta.databaseSummaries.map((summary) => (
                    <Badge key={summary.dbName} variant="outline" className="text-[11px] font-medium">
                      <span className="font-semibold">{summary.description || summary.dbName}</span>
                      {`: ${summary.count.toLocaleString()} records`}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {mysqlSearchResults.map((patient) => {
                  const isSelected = isPatientSelected(patient);
                  return (
                    <Card
                      key={patient.hpercode}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => togglePatientSelection(patient)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => togglePatientSelection(patient)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">
                              {patient.last_name}, {patient.first_name} {patient.middle_name}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                                {patient.hpercode}
                              </span>
                              <span className="capitalize">{patient.sex}</span>
                              <span>•</span>
                              <span>{patient.birth_date}</span>
                            </div>
                            {patient.facility_code && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Facility: {patient.facility_code}
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLinking}>
            Cancel
          </Button>
          <Button
            onClick={handleLink}
            disabled={selectedMysqlPatients.length === 0 || isLinking || success}
          >
            {isLinking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Linking {linkingProgress.current} of {linkingProgress.total}...
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Linked!
              </>
            ) : (
              <>
                <LinkIcon className="h-4 w-4 mr-2" />
                {selectedMysqlPatients.length === 0 
                  ? 'Link Patient' 
                  : selectedMysqlPatients.length === 1 
                    ? 'Link Patient' 
                    : `Link ${selectedMysqlPatients.length} Patients`
                }
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PatientLinkingDialog;
