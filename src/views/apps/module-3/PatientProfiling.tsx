import { ChangeEvent, useEffect, useMemo, useState, useRef } from 'react';
import CardBox from 'src/components/shared/CardBox';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Badge } from 'src/components/ui/badge';
import { Separator } from 'src/components/ui/separator';
import { Card, CardContent } from 'src/components/ui/card';
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
  Server,
} from 'lucide-react';
import patientService, { PatientProfileWithLocations as APIPatientProfile, Facility } from 'src/services/patientService';
import psgcService, { PSGCRegion, PSGCEntity } from 'src/services/psgcService';
import {
  getPatientSearchBuckets,
  getPatientSearchSummaries,
  getPatientSearchTotalMatches,
  PatientDatabaseSummary,
} from './utils/patientSearchResultHelpers';
import { mapFacilityList } from './utils/facilityHelpers';

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
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  required?: boolean;
  isFilled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
          {label}
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
/*  Helper: Calculate Age from Birth Date                              */
/* ------------------------------------------------------------------ */

const calculateAge = (birthDate: string): { years: number; months: number } | null => {
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

/* ------------------------------------------------------------------ */
/*  Helper: Section Navigation Item                                    */
/* ------------------------------------------------------------------ */

interface NavSection {
  id: string;
  icon: React.ElementType;
  label: string;
  isComplete: boolean;
  isActive: boolean;
}

function SectionNavItem({ 
  section, 
  onClick 
}: { 
  section: NavSection; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200
        ${section.isActive 
          ? 'bg-primary text-primary-foreground shadow-sm' 
          : 'hover:bg-muted/80 text-muted-foreground hover:text-foreground'
        }
      `}
    >
      <section.icon className={`h-4 w-4 ${section.isActive ? '' : section.isComplete ? 'text-green-600' : ''}`} />
      <span className="text-sm font-medium flex-1">{section.label}</span>
      {section.isComplete && !section.isActive && (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: Completion Ring                                            */
/* ------------------------------------------------------------------ */

function CompletionRing({ percentage, filled, total }: { percentage: number; filled: number; total: number }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      <div className="relative h-12 w-12">
        <svg className="h-12 w-12 -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            className="stroke-muted"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r="14"
            fill="none"
            className={`transition-all duration-700 ease-out ${
              percentage >= 80 ? 'stroke-green-500' : percentage >= 50 ? 'stroke-amber-500' : 'stroke-primary'
            }`}
            strokeWidth="3"
            strokeDasharray={`${percentage * 0.88} 100`}
            strokeLinecap="round"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${
          percentage >= 80 ? 'text-green-600' : percentage >= 50 ? 'text-amber-600' : 'text-primary'
        }`}>
          {percentage}%
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Completion</p>
        <p className="text-xs text-muted-foreground">
          {filled} of {total} fields
        </p>
      </div>
    </div>
  );
}

const capitalizeStatusLabel = (value?: string, fallback = 'Unknown'): string => {
  if (!value) return fallback;
  const parts = value.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (!parts.length) return fallback;
  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

const getStatusBadgeVariant = (status?: string): 'outline' | 'secondary' | 'success' | 'warning' | 'destructive' => {
  if (!status) return 'outline';
  const normalized = status.toLowerCase();
  if (['ok', 'healthy', 'connected', 'available'].includes(normalized)) return 'success';
  if (normalized.includes('warn') || normalized.includes('degrad')) return 'warning';
  if (normalized.includes('error') || normalized.includes('down') || normalized.includes('failed') || normalized.includes('disconnected')) return 'destructive';
  return 'secondary';
};

const formatUptime = (seconds?: number): string => {
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

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

type BackendConnectionStatus = 'unknown' | 'connected' | 'disconnected';

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

  // Section navigation state
  const [activeSection, setActiveSection] = useState<'personal' | 'demographics' | 'location'>('personal');
  const personalSectionRef = useRef<HTMLDivElement>(null);
  const demographicsSectionRef = useRef<HTMLDivElement>(null);
  const locationSectionRef = useRef<HTMLDivElement>(null);

  // Search state
  const [searchResults, setSearchResults] = useState<APIPatientProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [backendConnectionState, setBackendConnectionState] = useState<BackendConnectionStatus>('unknown');

  // Facilities state - loaded from MySQL database
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(false);
  const [facilityLoadError, setFacilityLoadError] = useState<string | null>(null);

  // PSGC State
  const [regions, setRegions] = useState<PSGCRegion[]>([]);
  const [provinces, setProvinces] = useState<PSGCEntity[]>([]);
  const [cities, setCities] = useState<PSGCEntity[]>([]);
  const [barangays, setBarangays] = useState<PSGCEntity[]>([]);

  const [selectedRegionCode, setSelectedRegionCode] = useState('');
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedCityCode, setSelectedCityCode] = useState('');
  const [selectedBrgyCode, setSelectedBrgyCode] = useState('');

  const [isLoadingRegions, setIsLoadingRegions] = useState(false);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingBarangays, setIsLoadingBarangays] = useState(false);

  const completion = useProfileCompletion(patient);

  // Section completion tracking
  const sectionCompletion = useMemo(() => {
    const personalFields = ['first_name', 'last_name', 'middle_name', 'ext_name'];
    const demographicsFields = ['sex', 'birth_date'];
    const locationFields = ['region_name', 'province_name', 'city_name', 'brgy_name', 'street'];

    const checkFields = (fields: string[]) => {
      const filled = fields.filter(f => (patient as any)[f]?.trim?.()?.length > 0).length;
      return { filled, total: fields.length, isComplete: filled >= fields.filter(f => ['first_name', 'last_name', 'sex', 'birth_date', 'city_name', 'brgy_name'].includes(f)).length };
    };

    return {
      personal: checkFields(personalFields),
      demographics: checkFields(demographicsFields),
      location: checkFields(locationFields),
    };
  }, [patient]);

  // Section navigation
  const sections: NavSection[] = [
    { id: 'personal', icon: User, label: 'Personal Info', isComplete: sectionCompletion.personal.isComplete, isActive: activeSection === 'personal' },
    { id: 'demographics', icon: Calendar, label: 'Demographics', isComplete: sectionCompletion.demographics.isComplete, isActive: activeSection === 'demographics' },
    { id: 'location', icon: MapPin, label: 'Location', isComplete: sectionCompletion.location.isComplete, isActive: activeSection === 'location' },
  ];

  const scrollToSection = (sectionId: 'personal' | 'demographics' | 'location') => {
    setActiveSection(sectionId);
    const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {
      personal: personalSectionRef,
      demographics: demographicsSectionRef,
      location: locationSectionRef,
    };
    refs[sectionId]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Calculate age display
  const ageDisplay = useMemo(() => {
    const age = calculateAge(patient.birth_date);
    if (!age) return null;
    if (age.years === 0) return `${age.months} month${age.months !== 1 ? 's' : ''} old`;
    return `${age.years} year${age.years !== 1 ? 's' : ''} old`;
  }, [patient.birth_date]);

  const loadFacilities = async () => {
    setIsLoadingFacilities(true);
    setFacilityLoadError(null);
    try {
      const response = await patientService.getFacilities();
      if (!response.success) {
        throw new Error(response.message || 'Unable to load repository metadata');
      }

      const normalized = mapFacilityList(response)
        .filter((facility) => (facility.patient_count ?? 0) > 0);
      if (!normalized.length) {
        setFacilityLoadError('No repository databases with patient records were returned from module3.db_informations.');
        setFacilities([]);
      } else {
        setFacilities(normalized);
      }
    } catch (error) {
      console.warn('Failed to load facilities:', error);
      setFacilities([]);
      setFacilityLoadError(error instanceof Error ? error.message : 'Failed to load facilities');
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
        setBackendConnectionState(connected ? 'connected' : 'disconnected');
      } catch (error) {
        console.error('Initialization error:', error);
        setBackendConnectionState('disconnected');
      }
    };
    initialize();
  }, []);

  const repositoryAvailable = backendConnectionState !== 'disconnected';

  // Use effect to load regions
  useEffect(() => {
    const loadRegions = async () => {
      setIsLoadingRegions(true);
      try {
        const data = await psgcService.getRegions();
        // Sort regions by name or as they come
        setRegions(data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error('Failed to load regions:', error);
      } finally {
        setIsLoadingRegions(false);
      }
    };
    loadRegions();
  }, []);

  // Use effect to load provinces when region changes
  useEffect(() => {
    if (!selectedRegionCode) {
      setProvinces([]);
      return;
    }

    const loadProvinces = async () => {
      setIsLoadingProvinces(true);
      try {
        // First, check for provinces
        const provData = await psgcService.getProvinces(selectedRegionCode);

        // Some areas (like NCR) don't have provinces but have cities directly
        if (provData.length === 0) {
          setProvinces([]);
          // If no provinces, try loading cities directly for this region
          const cityData = await psgcService.getCitiesByRegion(selectedRegionCode);
          setCities(cityData.sort((a, b) => a.name.localeCompare(b.name)));
          setSelectedProvinceCode(''); // Signal no province
        } else {
          setProvinces(provData.sort((a, b) => a.name.localeCompare(b.name)));
        }
      } catch (error) {
        console.error('Failed to load provinces:', error);
      } finally {
        setIsLoadingProvinces(false);
      }
    };
    loadProvinces();
  }, [selectedRegionCode]);

  // Use effect to load cities when province changes
  useEffect(() => {
    if (!selectedProvinceCode) {
      // If region is selected but no province, cities might have been loaded by region effect
      // But if province was selected and then cleared, we might want to clear cities
      // However, NCR case handles it differently.
      return;
    }

    const loadCities = async () => {
      setIsLoadingCities(true);
      try {
        const data = await psgcService.getCities(selectedProvinceCode);
        setCities(data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error('Failed to load cities:', error);
      } finally {
        setIsLoadingCities(false);
      }
    };
    loadCities();
  }, [selectedProvinceCode]);

  // Use effect to load barangays when city changes
  useEffect(() => {
    if (!selectedCityCode) {
      setBarangays([]);
      return;
    }

    const loadBarangays = async () => {
      setIsLoadingBarangays(true);
      try {
        const data = await psgcService.getBarangays(selectedCityCode);
        setBarangays(data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error('Failed to load barangays:', error);
      } finally {
        setIsLoadingBarangays(false);
      }
    };
    loadBarangays();
  }, [selectedCityCode]);

  const handleRegionChange = (value: string) => {
    setSelectedRegionCode(value);
    setSelectedProvinceCode('');
    setSelectedCityCode('');

    const regionName = regions.find(r => r.code === value)?.name || '';
    setPatient(prev => ({
      ...prev,
      region_name: regionName,
      province_name: '',
      city_name: '',
      brgy_name: ''
    }));
  };

  const handleProvinceChange = (value: string) => {
    setSelectedProvinceCode(value);
    setSelectedCityCode('');

    const provinceName = provinces.find(p => p.code === value)?.name || '';
    setPatient(prev => ({
      ...prev,
      province_name: provinceName,
      city_name: '',
      brgy_name: ''
    }));
  };

  const handleCityChange = (value: string) => {
    setSelectedCityCode(value);

    const cityName = cities.find(c => c.code === value)?.name || '';
    setPatient(prev => ({
      ...prev,
      city_name: cityName,
      brgy_name: ''
    }));
  };

  const handleBrgyChange = (value: string) => {
    setSelectedBrgyCode(value);
    const brgyName = barangays.find(b => b.code === value)?.name || '';
    setPatient(prev => ({
      ...prev,
      brgy_name: brgyName
    }));
  };

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
    setSelectedRegionCode('');
    setSelectedProvinceCode('');
    setSelectedCityCode('');
    setSelectedBrgyCode('');
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
        // Clear inputs first, then show success message (handleReset clears statusMessage)
        handleReset();
        setStatusMessage(result.message || 'Patient profile saved successfully!');
        setStatusType('success');
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
    if (repositoryAvailable) {
      void loadFacilities();
    } else {
      setFacilityLoadError('Repository database is not available right now.');
    }
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
      database: modalFacilityDatabase,
    });

    try {
      // Use the database from the selected facility
      // Note: Don't filter by facility_code as it may not match across databases
      const result = await patientService.searchPatients(modalSearchName.trim(), {
        database: modalFacilityDatabase,
        limit: 50,
      });

      console.log('Search result:', result);

      setIsSearching(false);

      if (result.success) {
        const buckets = getPatientSearchBuckets(result);
        const selectedBucket = buckets.find((bucket) => {
          const matchesDbName = bucket.metadata.db_name === modalFacilityDatabase;
          const matchesFacility = selectedFacility
            ? bucket.metadata.description?.toLowerCase() === selectedFacility.facility_name.toLowerCase()
            : false;
          return matchesDbName || matchesFacility;
        });
        const patients = selectedBucket?.data ?? [];

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

    // Reset PSGC codes as we don't have codes for repository patients yet
    setSelectedRegionCode('');
    setSelectedProvinceCode('');
    setSelectedCityCode('');
    setSelectedBrgyCode('');
  };

  // Find selected facility from loaded facilities
  const selectedFacility = facilities.find(
    (f) => f.facility_code === modalFacilityId && f.database === modalFacilityDatabase
  );

  return (
    <>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-7 w-7 text-primary" />
            </div>
            Patient Profiling
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and update detailed patient profiles
          </p>
        </div>

        {/* Status Message (floating) */}
        {statusMessage && (
          <div className={`flex items-center gap-2 rounded-lg px-4 py-2 shadow-lg animate-in slide-in-from-top-2 ${
            statusType === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
            statusType === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
            'bg-blue-50 border border-blue-200 text-blue-700'
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
              className="ml-2 rounded-full p-1 hover:bg-black/5 transition-colors"
              title="Dismiss"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* ── Split-Pane Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        
        {/* ── Sticky Side Navigation ── */}
        <aside className="lg:sticky lg:top-6 h-fit space-y-4">
          {/* Completion Ring */}
          <Card>
            <CardContent className="p-4">
              <CompletionRing 
                percentage={completion.pct} 
                filled={completion.filled} 
                total={completion.total} 
              />
            </CardContent>
          </Card>

          {/* Section Navigation */}
          <Card>
            <CardContent className="p-3 space-y-1">
              {sections.map((section) => (
                <SectionNavItem
                  key={section.id}
                  section={section}
                  onClick={() => scrollToSection(section.id as 'personal' | 'demographics' | 'location')}
                />
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    onClick={openModal}
                  >
                    <Database className="h-4 w-4" />
                    Get from Repository
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Look up patient data from hospital database</TooltipContent>
              </Tooltip>

              <Separator />

              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      disabled={!isDirty}
                      className="flex-1 gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear all fields</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={!isDirty || isSaving}
                      className="flex-1 gap-2"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {isSaving ? 'Saving…' : 'Save'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Save patient profile</TooltipContent>
                </Tooltip>
              </div>

              {isDirty && (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>You have unsaved changes</span>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>

        {/* ── Main Form Area ── */}
        <main>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            {/* ─── Section 1: Personal Information ─── */}
            <div ref={personalSectionRef} id="personal-section">
              <CardBox className="p-6">
                <SectionHeader
                  icon={User}
                  title="Personal Information"
                  description="Core identity details — name and name extension."
                  badge={{ label: 'Required', variant: 'lightWarning' }}
                />
                <Separator className="my-5" />
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <FormField label="First Name" htmlFor="first-name" required isFilled={!!patient.first_name}>
                    <Input
                      id="first-name"
                      value={patient.first_name}
                      onChange={handleInputChange('first_name')}
                      placeholder="Juan"
                      className="capitalize"
                    />
                  </FormField>

                  <FormField label="Middle Name" htmlFor="middle-name">
                    <Input
                      id="middle-name"
                      value={patient.middle_name}
                      onChange={handleInputChange('middle_name')}
                      placeholder="Santos"
                      className="capitalize"
                    />
                  </FormField>

                  <FormField label="Last Name" htmlFor="last-name" required isFilled={!!patient.last_name}>
                    <Input
                      id="last-name"
                      value={patient.last_name}
                      onChange={handleInputChange('last_name')}
                      placeholder="Dela Cruz"
                      className="capitalize"
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
            </div>

            {/* ─── Section 2: Demographics ─── */}
            <div ref={demographicsSectionRef} id="demographics-section">
              <CardBox className="p-6">
                <SectionHeader
                  icon={Calendar}
                  title="Demographics"
                  description="Biological and demographic information."
                />
                <Separator className="my-5" />
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <FormField label="Sex" htmlFor="sex" required isFilled={!!patient.sex}>
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

                  <FormField label="Birth Date" htmlFor="birth-date" required isFilled={!!patient.birth_date}>
                    <div className="space-y-2">
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
                      {ageDisplay && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs font-normal">
                            {ageDisplay}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </FormField>
                </div>
              </CardBox>
            </div>

            {/* ─── Section 3: Location ─── */}
            <div ref={locationSectionRef} id="location-section">
              <CardBox className="p-6">
                <SectionHeader
                  icon={MapPin}
                  title="Location"
                  description="Geographic assignment and barangay link using PSGC."
                />
                <Separator className="my-5" />

                {/* Region and Province */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <FormField label="Region" htmlFor="region" required isFilled={!!selectedRegionCode}>
                    <Select value={selectedRegionCode} onValueChange={handleRegionChange}>
                      <SelectTrigger id="region" className="w-full">
                        <SelectValue placeholder={isLoadingRegions ? "Loading regions..." : "Select Region"} />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map((region) => (
                          <SelectItem key={region.code} value={region.code}>
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Province" htmlFor="province">
                    <Select
                      value={selectedProvinceCode}
                      onValueChange={handleProvinceChange}
                      disabled={provinces.length === 0 && !isLoadingProvinces}
                    >
                      <SelectTrigger id="province" className="w-full">
                        <SelectValue placeholder={isLoadingProvinces ? "Loading provinces..." : "Select Province"} />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((province) => (
                          <SelectItem key={province.code} value={province.code}>
                            {province.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>

                {/* City and Barangay */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <FormField label="City / Municipality" htmlFor="city" required isFilled={!!selectedCityCode}>
                    <Select
                      value={selectedCityCode}
                      onValueChange={handleCityChange}
                      disabled={cities.length === 0 && !isLoadingCities}
                    >
                      <SelectTrigger id="city" className="w-full">
                        <SelectValue placeholder={isLoadingCities ? "Loading cities..." : "Select City"} />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.code} value={city.code}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Barangay" htmlFor="barangay" required isFilled={!!selectedBrgyCode}>
                    <Select
                      value={selectedBrgyCode}
                      onValueChange={handleBrgyChange}
                      disabled={barangays.length === 0 && !isLoadingBarangays}
                    >
                      <SelectTrigger id="barangay" className="w-full">
                        <SelectValue placeholder={isLoadingBarangays ? "Loading barangays..." : "Select Barangay"} />
                      </SelectTrigger>
                      <SelectContent>
                        {barangays.map((brgy) => (
                          <SelectItem key={brgy.code} value={brgy.code}>
                            {brgy.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>

                {/* Street Address */}
                <div>
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
              </CardBox>
            </div>
          </form>
        </main>
      </div>

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
