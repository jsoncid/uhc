import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import CardBox from 'src/components/shared/CardBox';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Badge } from 'src/components/ui/badge';
import { Separator } from 'src/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'src/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'src/components/ui/dialog';
import {
  User,
  Calendar,
  MapPin,
  Search,
  Building2,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  Info,
  Database,
  ChevronRight,
  X,
  Loader2,
  Users,
} from 'lucide-react';
import patientService, { PatientProfileWithLocations as APIPatientProfile, Facility } from 'src/services/patientService';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */



interface PatientProfile {
  id: string;
  created_at: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  ext_name: string;
  sex: string;
  birth_date: string;
  // Fully relational location structure - uses only foreign keys
  brgy: string; // UUID foreign key
  city_municipality?: string; // UUID foreign key
  province?: string; // UUID foreign key
  region?: string; // UUID foreign key
  street?: string;
  // Display fields for location names (used in form, sent to service for lookup)
  brgy_name?: string;
  city_name?: string;
  province_name?: string;
  region_name?: string;
  // Repository fields (from MySQL)
  hpercode?: string;
  facility_code?: string;
}

const INITIAL_PROFILE: PatientProfile = {
  id: '',
  created_at: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  ext_name: '',
  sex: '',
  birth_date: '',
  brgy: '',
  city_municipality: '',
  province: '',
  region: '',
  street: '',
  brgy_name: '',
  city_name: '',
  province_name: '',
  region_name: '',
  hpercode: '',
  facility_code: '',
};

// Facility icon based on type
const getFacilityIcon = (type: string): string => {
  const typeUpper = type?.toUpperCase() || '';
  if (typeUpper.includes('HOSPITAL')) return '🏥';
  if (typeUpper.includes('RURAL') || typeUpper.includes('RHU')) return '🌿';
  if (typeUpper.includes('BARANGAY') || typeUpper.includes('BHS')) return '🏘️';
  if (typeUpper.includes('CLINIC')) return '⚕️';
  if (typeUpper.includes('CENTER')) return '🏛️';
  return '🏥';
};

/* ------------------------------------------------------------------ */
/*  Helper: Section Header                                             */
/* ------------------------------------------------------------------ */

function SectionHeader({
  icon: Icon,
  title,
  description,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: { label: string; variant: 'lightPrimary' | 'lightSuccess' | 'lightWarning' | 'lightInfo' };
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {badge && (
            <Badge variant={badge.variant} className="text-[10px] px-2 py-0.5 font-medium">
              {badge.label}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: Field with tooltip                                         */
/* ------------------------------------------------------------------ */

function FormField({
  label,
  htmlFor,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </Label>
        {hint && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{hint}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: Completion tracker                                         */
/* ------------------------------------------------------------------ */

function useProfileCompletion(profile: PatientProfile) {
  return useMemo(() => {
    const fields = Object.entries(profile);
    const filled = fields.filter(([, v]) => v.trim().length > 0).length;
    const total = fields.length;
    const pct = Math.round((filled / total) * 100);
    return { filled, total, pct };
  }, [profile]);
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

const PatientProfiling = () => {
  const [patient, setPatient] = useState<PatientProfile>({ ...INITIAL_PROFILE });
  const [isRepositoryModalOpen, setIsRepositoryModalOpen] = useState(false);
  const [modalFacilityId, setModalFacilityId] = useState('');
  const [modalFacilityDatabase, setModalFacilityDatabase] = useState(''); // Track selected facility's database
  const [modalSearchName, setModalSearchName] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('success');
  const [isSaving, setIsSaving] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2 | 3>(1);

  // Search state
  const [searchResults, setSearchResults] = useState<APIPatientProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);

  // Facilities state - loaded from MySQL database
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
  const [facilityLoadError, setFacilityLoadError] = useState<string | null>(null);

  const completion = useProfileCompletion(patient);

  // The only 2 supported facilities for patient linking/history
  const SUPPORTED_FACILITIES: Facility[] = [
    {
      facility_code: '0005027',
      facility_name: 'AGUSAN DEL NORTE PROVINCIAL HOSPITAL',
      patient_count: 17468,
      database: 'adnph_ihomis_plus',
    },
    {
      facility_code: '0005028',
      facility_name: 'NASIPIT DISTRICT HOSPITAL',
      patient_count: 17468,
      database: 'ndh_ihomis_plus',
    },
  ];

  const loadFacilities = async () => {
    setIsLoadingFacilities(true);
    setFacilityLoadError(null);
    try {
      // Use only the 2 supported facilities instead of loading all
      setFacilities(SUPPORTED_FACILITIES);
    } catch (error) {
      console.warn(`Failed to load facilities:`, error);
      setFacilities([]);
      setFacilityLoadError('Failed to load facilities');
    } finally {
      setIsLoadingFacilities(false);
    }
  };

  // Check backend connection and load facilities on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Check connection
        const health = await patientService.checkHealth();
        const connected = health.status === 'ok' && health.databases?.mysql === 'connected';
        setIsBackendConnected(connected);
      } catch (error) {
        console.error('Initialization error:', error);
        setIsBackendConnected(false);
      }
    };
    initialize();
  }, []);

  const handleInputChange =
    (key: keyof PatientProfile) => (event: ChangeEvent<HTMLInputElement>) => {
      setPatient((prev) => ({ ...prev, [key]: event.target.value }));
      // clear status when editing
      if (statusMessage) setStatusMessage(null);
    };

  const updateSex = (value: string) => {
    setPatient((prev) => ({ ...prev, sex: value }));
  };

  const handleReset = () => {
    setPatient({ ...INITIAL_PROFILE });
    setStatusMessage(null);
  };

  const handleSave = async () => {
    // Validate required fields
    if (!patient.first_name || !patient.last_name || !patient.sex || !patient.birth_date) {
      setStatusMessage('Please fill in all required fields (First Name, Last Name, Sex, Birth Date)');
      setStatusType('error');
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      // Save patient data to Supabase (location fields are used to find/create brgy UUID)
      const result = await patientService.saveToSupabase(patient);

      if (result.success) {
        setStatusMessage(result.message || 'Patient profile saved successfully to Supabase');
        setStatusType('success');

        // Clear inputs after successful save
        setPatient({ ...INITIAL_PROFILE });
      } else {
        setStatusMessage(result.message || 'Failed to save patient profile');
        setStatusType('error');
      }
    } catch (error) {
      console.error('Save error:', error);
      setStatusMessage(error instanceof Error ? error.message : 'An error occurred while saving');
      setStatusType('error');
    } finally {
      setIsSaving(false);
    }
  };

  const isDirty = JSON.stringify(patient) !== JSON.stringify(INITIAL_PROFILE);

  const openModal = () => {
    setModalStep(1);
    setModalFacilityId('');
    setModalFacilityDatabase('');
    setModalSearchName('');
    setSearchResults([]);
    setSearchError(null);
    setFacilities([]);
    setFacilityLoadError(null);
    void loadFacilities();
    setIsRepositoryModalOpen(true);
  };

  // Search patients from MySQL database
  const handleSearch = async () => {
    if (!modalSearchName.trim() || modalSearchName.trim().length < 2) {
      setSearchError('Please enter at least 2 characters to search');
      return;
    }

    if (!modalFacilityDatabase) {
      setSearchError('Please select a facility first');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);

    console.log('Searching with:', {
      name: modalSearchName.trim(),
      facility: modalFacilityId,
      database: modalFacilityDatabase,
    });

    try {
      // Use the database from the selected facility
      const result = await patientService.searchPatients(modalSearchName.trim(), {
        facility: modalFacilityId || undefined,
        database: modalFacilityDatabase,
        limit: 50,
      });

      console.log('Search result:', result);

      setIsSearching(false);

      if (result.success) {
        // Backend returns database1 and database2 structure
        // Extract data based on selected database
        let patients: APIPatientProfile[] = [];

        if (result.database1 && modalFacilityDatabase === result.database1.name) {
          patients = result.database1.data;
        } else if (result.database2 && modalFacilityDatabase === result.database2.name) {
          patients = result.database2.data;
        } else if (result.data) {
          // Fallback: if backend returns old structure with flat data array
          patients = result.data;
        }

        setSearchResults(patients);

        if (patients.length === 0) {
          setSearchError('No patients found matching your search criteria');
        } else {
          setModalStep(3); // Move to results step
        }
      } else {
        setSearchError(result.message || 'Failed to search patients');
      }
    } catch (error) {
      console.error('Search error:', error);
      setIsSearching(false);
      setSearchError(error instanceof Error ? error.message : 'Failed to search patients');
    }
  };

  // Select a patient from search results
  const handleSelectPatient = (selectedPatient: APIPatientProfile) => {
    setPatient({
      id: '', // Will be set by Supabase when saving
      created_at: selectedPatient.created_at || '',
      first_name: selectedPatient.first_name || '',
      middle_name: selectedPatient.middle_name || '',
      last_name: selectedPatient.last_name || '',
      ext_name: selectedPatient.ext_name || '',
      sex: selectedPatient.sex || '',
      birth_date: selectedPatient.birth_date || '',
      brgy: selectedPatient.brgy || '',
      city_municipality: selectedPatient.city_municipality || '',
      province: selectedPatient.province || '',
      region: selectedPatient.region || '',
      street: selectedPatient.street || '',
      brgy_name: selectedPatient.brgy_name || '',
      city_name: selectedPatient.city_name || '',
      province_name: selectedPatient.province_name || '',
      region_name: selectedPatient.region_name || '',
      // Store repository data from MySQL
      hpercode: selectedPatient.hpercode || '',
      facility_code: selectedPatient.facility_code || modalFacilityId,
    });

    setIsRepositoryModalOpen(false);
    setStatusMessage(`Patient data loaded: ${selectedPatient.first_name} ${selectedPatient.last_name}`);
    setStatusType('success');
    setModalStep(1);
    setSearchResults([]);
    setModalSearchName('');
  };

  // Find selected facility from loaded facilities
  const selectedFacility = facilities.find(
    (f) => f.facility_code === modalFacilityId && f.database === modalFacilityDatabase
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-7 w-7 text-primary" />
            </div>
            Patient Profiling
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and update detailed patient profiles, including personal information, demographics, and contact details.
          </p>
        </div>
      </div>

      {/* ── Top Action Bar ── */}
      <CardBox className="p-4 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Left: status & completion */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="relative h-10 w-10">
                <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    className="stroke-muted"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    className="stroke-primary transition-all duration-500"
                    strokeWidth="3"
                    strokeDasharray={`${completion.pct * 0.94} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary">
                  {completion.pct}%
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Profile Completion</p>
                <p className="text-xs text-muted-foreground">
                  {completion.filled} of {completion.total} fields filled
                </p>
              </div>
            </div>

            {statusMessage && (
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${statusType === 'success' ? 'bg-lightsuccess text-success' :
                statusType === 'error' ? 'bg-lighterror text-error' :
                  'bg-lightinfo text-info'
                }`}>
                {statusType === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : statusType === 'error' ? (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                ) : (
                  <Info className="h-4 w-4 shrink-0" />
                )}
                <span className="text-sm font-medium">{statusMessage}</span>
                <button
                  onClick={() => setStatusMessage(null)}
                  className={`ml-1 rounded-full p-0.5 transition-colors ${statusType === 'success' ? 'hover:bg-success/10' :
                    statusType === 'error' ? 'hover:bg-error/10' :
                      'hover:bg-info/10'
                    }`}
                  title="Dismiss"
                  aria-label="Dismiss notification"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openModal}
                  className="gap-2"
                >
                  <Database className="h-4 w-4" />
                  <span className="hidden sm:inline">Get Repository</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Look up patient data from a facility repository</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={!isDirty}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Reset</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear all fields and start fresh</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!isDirty || isSaving}
                  className="gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{isSaving ? 'Saving…' : 'Save Profile'}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save the patient profile</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardBox>

      {/* ── Form Sections ── */}
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
        {/* ─── Section 1: Personal Information ─── */}
        <CardBox className="p-6">
          <SectionHeader
            icon={User}
            title="Personal Information"
            description="Core identity details — name and name extension."
            badge={{ label: 'Required', variant: 'lightWarning' }}
          />
          <Separator className="my-5" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="First Name" htmlFor="first-name" required>
              <Input
                id="first-name"
                value={patient.first_name}
                onChange={handleInputChange('first_name')}
                placeholder="Juan"
              />
            </FormField>

            <FormField label="Middle Name" htmlFor="middle-name">
              <Input
                id="middle-name"
                value={patient.middle_name}
                onChange={handleInputChange('middle_name')}
                placeholder="Santos"
              />
            </FormField>

            <FormField label="Last Name" htmlFor="last-name" required>
              <Input
                id="last-name"
                value={patient.last_name}
                onChange={handleInputChange('last_name')}
                placeholder="Dela Cruz"
              />
            </FormField>

            <FormField label="Extension" htmlFor="ext-name" hint="Suffix such as Jr., Sr., III">
              <Input
                id="ext-name"
                value={patient.ext_name}
                onChange={handleInputChange('ext_name')}
                placeholder="Jr., III"
              />
            </FormField>
          </div>
        </CardBox>

        {/* ─── Section 3: Demographics ─── */}
        <CardBox className="p-6">
          <SectionHeader
            icon={Calendar}
            title="Demographics"
            description="Biological and demographic information."
          />
          <Separator className="my-5" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField label="Sex" htmlFor="sex" required>
              <Select value={patient.sex} onValueChange={updateSex}>
                <SelectTrigger className="w-full" id="sex">
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">
                    <span className="flex items-center gap-2">♂ Male</span>
                  </SelectItem>
                  <SelectItem value="female">
                    <span className="flex items-center gap-2">♀ Female</span>
                  </SelectItem>
                  <SelectItem value="other">
                    <span className="flex items-center gap-2">⚧ Other</span>
                  </SelectItem>
                  <SelectItem value="unknown">
                    <span className="flex items-center gap-2">— Unknown</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Birth Date" htmlFor="birth-date" required>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  id="birth-date"
                  type="date"
                  value={patient.birth_date}
                  onChange={handleInputChange('birth_date')}
                  className="pl-10"
                />
              </div>
            </FormField>
          </div>
        </CardBox>

        {/* ─── Section 4: Location ─── */}
        <CardBox className="p-6">
          <SectionHeader
            icon={MapPin}
            title="Location"
            description="Geographic assignment and barangay link."
          />
          <Separator className="my-5" />

          {/* Street Address */}
          <div className="mb-6">
            <FormField label="Street Address" htmlFor="street">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  id="street"
                  value={patient.street || ''}
                  onChange={handleInputChange('street')}
                  placeholder="e.g. 123 Main St., Building A"
                  className="pl-10"
                />
              </div>
            </FormField>
          </div>

          {/* Barangay and City */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Barangay"
              htmlFor="brgy_name"
              hint="Enter the barangay name."
            >
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  id="brgy_name"
                  value={patient.brgy_name || ''}
                  onChange={handleInputChange('brgy_name')}
                  placeholder="e.g. Barangay Poblacion"
                  className="pl-10"
                />
              </div>
            </FormField>
            <FormField
              label="City / Municipality"
              htmlFor="city_name"
              hint="Enter the city or municipality name."
            >
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  id="city_name"
                  value={patient.city_name || ''}
                  onChange={handleInputChange('city_name')}
                  placeholder="e.g. Manila City"
                  className="pl-10"
                />
              </div>
            </FormField>
          </div>

          {/* Province and Region */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <FormField
              label="Province"
              htmlFor="province_name"
              hint="Enter the province name."
            >
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  id="province_name"
                  value={patient.province_name || ''}
                  onChange={handleInputChange('province_name')}
                  placeholder="e.g. Metro Manila"
                  className="pl-10"
                />
              </div>
            </FormField>
            <FormField
              label="Region"
              htmlFor="region_name"
              hint="Enter the region name."
            >
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  id="region_name"
                  value={patient.region_name || ''}
                  onChange={handleInputChange('region_name')}
                  placeholder="e.g. NCR - National Capital Region"
                  className="pl-10"
                />
              </div>
            </FormField>
          </div>
        </CardBox>
      </form>

      {/* ── Repository Lookup Modal ── */}
      <Dialog
        open={isRepositoryModalOpen}
        onOpenChange={(open) => {
          setIsRepositoryModalOpen(open);
          if (!open) {
            setModalStep(1);
            setModalFacilityId('');
            setModalFacilityDatabase('');
            setModalSearchName('');
            setSearchResults([]);
            setSearchError(null);
            setFacilities([]);
            setFacilityLoadError(null);
          }
        }}
      >
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
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${modalStep >= 1
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground'
                  }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                1. Facility
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${modalStep >= 2
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground'
                  }`}
              >
                <Search className="h-3.5 w-3.5" />
                2. Search
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${modalStep >= 3
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground'
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
                ) : facilities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No facilities found</p>
                    <p className="text-xs mt-1">
                      {isBackendConnected === false
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
                            setModalFacilityId(facility.facility_code);
                            setModalFacilityDatabase(facility.database || '');
                          }}
                          className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all ${isSelected
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
                                {facility.database === 'adnph_ihomis_plus' ? 'Primary' : 'NDH'}
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
                      onChange={(e) => {
                        setModalSearchName(e.target.value);
                        setSearchError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSearch();
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
                    onClick={handleSearch}
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
                      onClick={() => handleSelectPatient(p)}
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
    </>
  );
};

export default PatientProfiling;
