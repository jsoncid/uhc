/**
 * usePatientProfiling - Custom hook for Patient Profiling state and logic
 */
import { ChangeEvent, useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { User, Calendar, MapPin } from 'lucide-react';
import patientService, { PatientProfileWithLocations as APIPatientProfile, Facility } from 'src/services/patientService';
import psgcService, { PSGCRegion, PSGCEntity } from 'src/services/psgcService';
import { getPatientSearchBuckets } from '../../utils/patientSearchResultHelpers';
import { mapFacilityList } from '../../utils/facilityHelpers';
import {
  PatientProfile,
  INITIAL_PROFILE,
  BackendConnectionStatus,
  StatusType,
  SectionId,
  NavSection,
  ProfileCompletion,
  SectionCompletion,
} from './types';
import { formatAgeDisplay } from './utils';

interface UsePatientProfilingReturn {
  // Patient state
  patient: PatientProfile;
  setPatient: React.Dispatch<React.SetStateAction<PatientProfile>>;
  
  // Status
  statusMessage: string | null;
  statusType: StatusType;
  setStatusMessage: (message: string | null) => void;
  
  // Saving
  isSaving: boolean;
  isDirty: boolean;
  
  // Section navigation
  activeSection: SectionId;
  setActiveSection: React.Dispatch<React.SetStateAction<SectionId>>;
  personalSectionRef: React.RefObject<HTMLDivElement | null>;
  demographicsSectionRef: React.RefObject<HTMLDivElement | null>;
  locationSectionRef: React.RefObject<HTMLDivElement | null>;
  sections: NavSection[];
  scrollToSection: (sectionId: SectionId) => void;
  
  // Completion
  completion: ProfileCompletion;
  sectionCompletion: Record<SectionId, SectionCompletion>;
  
  // Age display
  ageDisplay: string | null;
  
  // PSGC data
  regions: PSGCRegion[];
  provinces: PSGCEntity[];
  cities: PSGCEntity[];
  barangays: PSGCEntity[];
  selectedRegionCode: string;
  selectedProvinceCode: string;
  selectedCityCode: string;
  selectedBrgyCode: string;
  isLoadingRegions: boolean;
  isLoadingProvinces: boolean;
  isLoadingCities: boolean;
  isLoadingBarangays: boolean;
  
  // Repository modal state
  isRepositoryModalOpen: boolean;
  setIsRepositoryModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  modalStep: 1 | 2 | 3;
  setModalStep: React.Dispatch<React.SetStateAction<1 | 2 | 3>>;
  modalFacilityId: string;
  modalFacilityDatabase: string;
  modalSearchName: string;
  setModalSearchName: (name: string) => void;
  facilities: Facility[];
  isLoadingFacilities: boolean;
  facilityLoadError: string | null;
  repositoryAvailable: boolean;
  backendConnectionState: BackendConnectionStatus;
  searchResults: APIPatientProfile[];
  isSearching: boolean;
  searchError: string | null;
  setSearchError: (error: string | null) => void;
  selectedFacility: Facility | undefined;
  
  // Handlers
  handleInputChange: (key: keyof PatientProfile) => (event: ChangeEvent<HTMLInputElement>) => void;
  updateSex: (value: string) => void;
  handleRegionChange: (value: string) => void;
  handleProvinceChange: (value: string) => void;
  handleCityChange: (value: string) => void;
  handleBrgyChange: (value: string) => void;
  handleReset: () => void;
  handleSave: () => Promise<void>;
  openModal: () => void;
  handleSearch: () => Promise<void>;
  handleSelectPatient: (selectedPatient: APIPatientProfile) => void;
  handleSelectFacility: (facilityCode: string, database: string) => void;
}

function useProfileCompletion(profile: PatientProfile): ProfileCompletion {
  return useMemo(() => {
    const fields = Object.entries(profile);
    const filled = fields.filter(([, v]) => v?.trim?.()?.length > 0).length;
    const total = fields.length;
    const pct = Math.round((filled / total) * 100);
    return { filled, total, pct };
  }, [profile]);
}

export function usePatientProfiling(): UsePatientProfilingReturn {
  // Patient state
  const [patient, setPatient] = useState<PatientProfile>({ ...INITIAL_PROFILE });
  
  // Status
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<StatusType>('success');
  const [isSaving, setIsSaving] = useState(false);
  
  // Section navigation
  const [activeSection, setActiveSection] = useState<SectionId>('personal');
  const personalSectionRef = useRef<HTMLDivElement>(null);
  const demographicsSectionRef = useRef<HTMLDivElement>(null);
  const locationSectionRef = useRef<HTMLDivElement>(null);
  
  // Repository modal state
  const [isRepositoryModalOpen, setIsRepositoryModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2 | 3>(1);
  const [modalFacilityId, setModalFacilityId] = useState('');
  const [modalFacilityDatabase, setModalFacilityDatabase] = useState('');
  const [modalSearchName, setModalSearchName] = useState('');
  
  // Search state
  const [searchResults, setSearchResults] = useState<APIPatientProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [backendConnectionState, setBackendConnectionState] = useState<BackendConnectionStatus>('unknown');
  
  // Facilities state
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
  
  // Computed values
  const completion = useProfileCompletion(patient);
  const isDirty = JSON.stringify(patient) !== JSON.stringify(INITIAL_PROFILE);
  const repositoryAvailable = backendConnectionState !== 'disconnected';
  
  // Section completion tracking
  const sectionCompletion = useMemo(() => {
    const personalFields: (keyof PatientProfile)[] = ['first_name', 'last_name', 'middle_name', 'ext_name'];
    const demographicsFields: (keyof PatientProfile)[] = ['sex', 'birth_date'];
    const locationFields: (keyof PatientProfile)[] = ['region_name', 'province_name', 'city_name', 'brgy_name', 'street'];
    const requiredFields: (keyof PatientProfile)[] = ['first_name', 'last_name', 'sex', 'birth_date', 'city_name', 'brgy_name'];

    const checkFields = (fields: (keyof PatientProfile)[]): SectionCompletion => {
      const filled = fields.filter(f => {
        const value = patient[f];
        return typeof value === 'string' && value.trim().length > 0;
      }).length;
      return {
        filled,
        total: fields.length,
        isComplete: filled >= fields.filter(f => requiredFields.includes(f)).length,
      };
    };

    return {
      personal: checkFields(personalFields),
      demographics: checkFields(demographicsFields),
      location: checkFields(locationFields),
    };
  }, [patient]);
  
  // Section navigation config
  const sections: NavSection[] = [
    { id: 'personal', icon: User, label: 'Personal Info', isComplete: sectionCompletion.personal.isComplete, isActive: activeSection === 'personal' },
    { id: 'demographics', icon: Calendar, label: 'Demographics', isComplete: sectionCompletion.demographics.isComplete, isActive: activeSection === 'demographics' },
    { id: 'location', icon: MapPin, label: 'Location', isComplete: sectionCompletion.location.isComplete, isActive: activeSection === 'location' },
  ];
  
  // Age display
  const ageDisplay = useMemo(() => formatAgeDisplay(patient.birth_date), [patient.birth_date]);
  
  // Selected facility
  const selectedFacility = facilities.find(
    (f) => f.facility_code === modalFacilityId && f.database === modalFacilityDatabase
  );
  
  // Scroll to section
  const scrollToSection = useCallback((sectionId: SectionId) => {
    setActiveSection(sectionId);
    const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {
      personal: personalSectionRef,
      demographics: demographicsSectionRef,
      location: locationSectionRef,
    };
    refs[sectionId]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);
  
  // Load facilities
  const loadFacilities = useCallback(async () => {
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
  }, []);
  
  // Check backend connection on mount
  useEffect(() => {
    const initialize = async () => {
      try {
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
  
  // Load regions
  useEffect(() => {
    const loadRegions = async () => {
      setIsLoadingRegions(true);
      try {
        const data = await psgcService.getRegions();
        setRegions(data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error('Failed to load regions:', error);
      } finally {
        setIsLoadingRegions(false);
      }
    };
    loadRegions();
  }, []);
  
  // Load provinces when region changes
  useEffect(() => {
    if (!selectedRegionCode) {
      setProvinces([]);
      return;
    }

    const loadProvinces = async () => {
      setIsLoadingProvinces(true);
      try {
        const provData = await psgcService.getProvinces(selectedRegionCode);

        if (provData.length === 0) {
          setProvinces([]);
          const cityData = await psgcService.getCitiesByRegion(selectedRegionCode);
          setCities(cityData.sort((a, b) => a.name.localeCompare(b.name)));
          setSelectedProvinceCode('');
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
  
  // Load cities when province changes
  useEffect(() => {
    if (!selectedProvinceCode) {
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
  
  // Load barangays when city changes
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
  
  // Handlers
  const handleRegionChange = useCallback((value: string) => {
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
  }, [regions]);
  
  const handleProvinceChange = useCallback((value: string) => {
    setSelectedProvinceCode(value);
    setSelectedCityCode('');

    const provinceName = provinces.find(p => p.code === value)?.name || '';
    setPatient(prev => ({
      ...prev,
      province_name: provinceName,
      city_name: '',
      brgy_name: ''
    }));
  }, [provinces]);
  
  const handleCityChange = useCallback((value: string) => {
    setSelectedCityCode(value);

    const cityName = cities.find(c => c.code === value)?.name || '';
    setPatient(prev => ({
      ...prev,
      city_name: cityName,
      brgy_name: ''
    }));
  }, [cities]);
  
  const handleBrgyChange = useCallback((value: string) => {
    setSelectedBrgyCode(value);
    const brgyName = barangays.find(b => b.code === value)?.name || '';
    setPatient(prev => ({
      ...prev,
      brgy_name: brgyName
    }));
  }, [barangays]);
  
  const handleInputChange = useCallback(
    (key: keyof PatientProfile) => (event: ChangeEvent<HTMLInputElement>) => {
      setPatient((prev) => ({ ...prev, [key]: event.target.value }));
      if (statusMessage) setStatusMessage(null);
    },
    [statusMessage]
  );
  
  const updateSex = useCallback((value: string) => {
    setPatient((prev) => ({ ...prev, sex: value }));
  }, []);
  
  const handleReset = useCallback(() => {
    setPatient({ ...INITIAL_PROFILE });
    setStatusMessage(null);
    setSelectedRegionCode('');
    setSelectedProvinceCode('');
    setSelectedCityCode('');
    setSelectedBrgyCode('');
  }, []);
  
  const handleSave = useCallback(async () => {
    if (!patient.first_name || !patient.last_name || !patient.sex || !patient.birth_date) {
      setStatusMessage('Please fill in all required fields (First Name, Last Name, Sex, Birth Date)');
      setStatusType('error');
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const result = await patientService.saveToSupabase(patient);

      if (result.success) {
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
  }, [patient, handleReset]);
  
  const openModal = useCallback(() => {
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
  }, [repositoryAvailable, loadFacilities]);
  
  const handleSearch = useCallback(async () => {
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

    try {
      const result = await patientService.searchPatients(modalSearchName.trim(), {
        database: modalFacilityDatabase,
        limit: 50,
      });

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
          setModalStep(3);
        }
      } else {
        setSearchError(result.message || 'Failed to search patients');
      }
    } catch (error) {
      console.error('Search error:', error);
      setIsSearching(false);
      setSearchError(error instanceof Error ? error.message : 'Failed to search patients');
    }
  }, [modalSearchName, modalFacilityDatabase, selectedFacility]);
  
  const handleSelectPatient = useCallback((selectedPatient: APIPatientProfile) => {
    setPatient({
      id: '',
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
      hpercode: selectedPatient.hpercode || '',
      facility_code: selectedPatient.facility_code || modalFacilityId,
    });

    setIsRepositoryModalOpen(false);
    setStatusMessage(`Patient data loaded: ${selectedPatient.first_name} ${selectedPatient.last_name}`);
    setStatusType('success');
    setModalStep(1);
    setSearchResults([]);
    setModalSearchName('');

    setSelectedRegionCode('');
    setSelectedProvinceCode('');
    setSelectedCityCode('');
    setSelectedBrgyCode('');
  }, [modalFacilityId]);
  
  const handleSelectFacility = useCallback((facilityCode: string, database: string) => {
    setModalFacilityId(facilityCode);
    setModalFacilityDatabase(database);
  }, []);
  
  return {
    // Patient state
    patient,
    setPatient,
    
    // Status
    statusMessage,
    statusType,
    setStatusMessage,
    
    // Saving
    isSaving,
    isDirty,
    
    // Section navigation
    activeSection,
    setActiveSection,
    personalSectionRef,
    demographicsSectionRef,
    locationSectionRef,
    sections,
    scrollToSection,
    
    // Completion
    completion,
    sectionCompletion,
    
    // Age display
    ageDisplay,
    
    // PSGC data
    regions,
    provinces,
    cities,
    barangays,
    selectedRegionCode,
    selectedProvinceCode,
    selectedCityCode,
    selectedBrgyCode,
    isLoadingRegions,
    isLoadingProvinces,
    isLoadingCities,
    isLoadingBarangays,
    
    // Repository modal state
    isRepositoryModalOpen,
    setIsRepositoryModalOpen,
    modalStep,
    setModalStep,
    modalFacilityId,
    modalFacilityDatabase,
    modalSearchName,
    setModalSearchName,
    facilities,
    isLoadingFacilities,
    facilityLoadError,
    repositoryAvailable,
    backendConnectionState,
    searchResults,
    isSearching,
    searchError,
    setSearchError,
    selectedFacility,
    
    // Handlers
    handleInputChange,
    updateSex,
    handleRegionChange,
    handleProvinceChange,
    handleCityChange,
    handleBrgyChange,
    handleReset,
    handleSave,
    openModal,
    handleSearch,
    handleSelectPatient,
    handleSelectFacility,
  };
}

export default usePatientProfiling;
