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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from 'src/components/ui/tooltip';
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
  AlertTriangle,
  Check,
  X,
  Sparkles,
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

// ─────────────────────────────────────────────────────────────────────────────
// Match Confidence Calculator
// ─────────────────────────────────────────────────────────────────────────────

interface MatchResult {
  score: number; // 0-100
  level: 'high' | 'medium' | 'low';
  fields: {
    firstName: { match: boolean; similarity: number };
    lastName: { match: boolean; similarity: number };
    middleName: { match: boolean; similarity: number };
    sex: { match: boolean };
    birthDate: { match: boolean };
  };
}

const normalizeString = (str?: string | null): string => 
  (str || '').toLowerCase().trim().replace(/\s+/g, ' ');

const calculateSimilarity = (a: string, b: string): number => {
  const s1 = normalizeString(a);
  const s2 = normalizeString(b);
  if (s1 === s2) return 1;
  if (!s1 || !s2) return 0;
  
  // Simple Levenshtein-based similarity
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = [];
  
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  const maxLen = Math.max(len1, len2);
  return maxLen > 0 ? 1 - matrix[len1][len2] / maxLen : 1;
};

const calculateMatchConfidence = (
  supabasePatient: PatientLinkingDialogProps['supabasePatient'],
  mysqlPatient: PatientProfile
): MatchResult => {
  if (!supabasePatient) {
    return {
      score: 0,
      level: 'low',
      fields: {
        firstName: { match: false, similarity: 0 },
        lastName: { match: false, similarity: 0 },
        middleName: { match: false, similarity: 0 },
        sex: { match: false },
        birthDate: { match: false },
      },
    };
  }

  const firstNameSim = calculateSimilarity(supabasePatient.first_name, mysqlPatient.first_name || '');
  const lastNameSim = calculateSimilarity(supabasePatient.last_name, mysqlPatient.last_name || '');
  const middleNameSim = calculateSimilarity(supabasePatient.middle_name || '', mysqlPatient.middle_name || '');
  
  const sexMatch = normalizeString(supabasePatient.sex) === normalizeString(mysqlPatient.sex);
  const birthDateMatch = supabasePatient.birth_date === mysqlPatient.birth_date;

  // Weighted scoring
  const weights = { firstName: 25, lastName: 30, middleName: 10, sex: 15, birthDate: 20 };
  let score = 0;
  score += firstNameSim * weights.firstName;
  score += lastNameSim * weights.lastName;
  score += middleNameSim * weights.middleName;
  score += (sexMatch ? 1 : 0) * weights.sex;
  score += (birthDateMatch ? 1 : 0) * weights.birthDate;

  const level: MatchResult['level'] = score >= 85 ? 'high' : score >= 60 ? 'medium' : 'low';

  return {
    score: Math.round(score),
    level,
    fields: {
      firstName: { match: firstNameSim >= 0.9, similarity: firstNameSim },
      lastName: { match: lastNameSim >= 0.9, similarity: lastNameSim },
      middleName: { match: middleNameSim >= 0.9, similarity: middleNameSim },
      sex: { match: sexMatch },
      birthDate: { match: birthDateMatch },
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Match Confidence Badge Component
// ─────────────────────────────────────────────────────────────────────────────

const MatchConfidenceBadge = ({ match }: { match: MatchResult }) => {
  const colors = {
    high: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
    medium: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    low: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  };

  const icons = {
    high: <Sparkles className="h-3 w-3" />,
    medium: <AlertTriangle className="h-3 w-3" />,
    low: <AlertCircle className="h-3 w-3" />,
  };

  const labels = {
    high: 'High Match',
    medium: 'Partial Match',
    low: 'Low Match',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={`gap-1 cursor-help border ${colors[match.level]}`}>
            {icons[match.level]}
            {match.score}% {labels[match.level]}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1.5 text-xs">
            <p className="font-semibold">Match Breakdown:</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <span>First Name:</span>
              <span className={match.fields.firstName.match ? 'text-green-500' : 'text-red-500'}>
                {Math.round(match.fields.firstName.similarity * 100)}%
              </span>
              <span>Last Name:</span>
              <span className={match.fields.lastName.match ? 'text-green-500' : 'text-red-500'}>
                {Math.round(match.fields.lastName.similarity * 100)}%
              </span>
              <span>Middle Name:</span>
              <span className={match.fields.middleName.match ? 'text-green-500' : 'text-red-500'}>
                {Math.round(match.fields.middleName.similarity * 100)}%
              </span>
              <span>Sex:</span>
              <span className={match.fields.sex.match ? 'text-green-500' : 'text-red-500'}>
                {match.fields.sex.match ? 'Match' : 'Mismatch'}
              </span>
              <span>Birth Date:</span>
              <span className={match.fields.birthDate.match ? 'text-green-500' : 'text-red-500'}>
                {match.fields.birthDate.match ? 'Match' : 'Mismatch'}
              </span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Field Match Indicator
// ─────────────────────────────────────────────────────────────────────────────

const FieldMatchIndicator = ({ match, similarity }: { match: boolean; similarity?: number }) => (
  <span className={`inline-flex items-center gap-0.5 text-xs ${match ? 'text-green-600' : 'text-red-500'}`}>
    {match ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
    {similarity !== undefined && <span className="opacity-70">{Math.round(similarity * 100)}%</span>}
  </span>
);

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
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {mysqlSearchResults.map((patient) => {
                  const isSelected = isPatientSelected(patient);
                  const match = calculateMatchConfidence(supabasePatient, patient);
                  
                  return (
                    <Card
                      key={patient.hpercode}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'hover:border-primary/50 hover:shadow-sm'
                      }`}
                      onClick={() => togglePatientSelection(patient)}
                    >
                      <CardContent className="p-4">
                        {/* Match confidence header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => togglePatientSelection(patient)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                              {patient.hpercode}
                            </span>
                          </div>
                          <MatchConfidenceBadge match={match} />
                        </div>
                        
                        {/* Side-by-side comparison */}
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-3 text-sm">
                          {/* Source (Supabase) column */}
                          <div className="space-y-2 p-2 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg">
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                              Source Patient
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-muted-foreground text-xs">Name:</span>
                                <span className="font-medium text-right truncate">
                                  {supabasePatient?.last_name}, {supabasePatient?.first_name}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-muted-foreground text-xs">Middle:</span>
                                <span className="text-right truncate">{supabasePatient?.middle_name || '—'}</span>
                              </div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-muted-foreground text-xs">Sex:</span>
                                <span className="capitalize">{supabasePatient?.sex}</span>
                              </div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-muted-foreground text-xs">DOB:</span>
                                <span>{supabasePatient?.birth_date}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Match indicators column */}
                          <div className="flex flex-col justify-center items-center gap-1.5 px-1">
                            <FieldMatchIndicator match={match.fields.lastName.match} similarity={match.fields.lastName.similarity} />
                            <FieldMatchIndicator match={match.fields.middleName.match} similarity={match.fields.middleName.similarity} />
                            <FieldMatchIndicator match={match.fields.sex.match} />
                            <FieldMatchIndicator match={match.fields.birthDate.match} />
                          </div>
                          
                          {/* Target (MySQL) column */}
                          <div className="space-y-2 p-2 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg">
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                              Hospital Record
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-medium truncate">
                                  {patient.last_name}, {patient.first_name}
                                </span>
                                <span className="text-muted-foreground text-xs">:Name</span>
                              </div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="truncate">{patient.middle_name || '—'}</span>
                                <span className="text-muted-foreground text-xs">:Middle</span>
                              </div>
                              <div className="flex items-center justify-between gap-1">
                                <span className="capitalize">{patient.sex}</span>
                                <span className="text-muted-foreground text-xs">:Sex</span>
                              </div>
                              <div className="flex items-center justify-between gap-1">
                                <span>{patient.birth_date}</span>
                                <span className="text-muted-foreground text-xs">:DOB</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Facility info */}
                        {patient.facility_code && (
                          <div className="mt-3 pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {patient.facility_code}
                            </span>
                            {isSelected && (
                              <span className="flex items-center gap-1 text-primary font-medium">
                                <CheckCircle2 className="h-3 w-3" />
                                Selected for linking
                              </span>
                            )}
                          </div>
                        )}
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
