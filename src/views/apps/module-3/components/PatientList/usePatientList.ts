/**
 * usePatientList - Custom hook for Patient List state and logic
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import patientService, { PatientHistory } from 'src/services/patientService';
import { useDebounce } from './useDebounce';
import { 
  ActiveFilter, 
  SortColumn, 
  SortDirection, 
  ViewMode, 
  TypeFilter, 
  PatientWithRepository,
  PatientStats 
} from './types';
import { getFacility, getPatientInfoForCard } from './utils';

export const usePatientList = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // State
  const [patients, setPatients] = useState<PatientWithRepository[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Filter state
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [sexFilter, setSexFilter] = useState<string>('all');
  const [linkedFilter, setLinkedFilter] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Debounced search
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [limit] = useState(20);

  // Selected patient and history state
  const [selectedPatient, setSelectedPatient] = useState<PatientWithRepository | null>(null);
  const [patientHistory, setPatientHistory] = useState<PatientHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const selectedPatientHpercode = selectedPatient?.patient_repository?.[0]?.hpercode;

  /* ------------------------------------------------------------------ */
  /*  Filter Logic                                                      */
  /* ------------------------------------------------------------------ */

  const addFilter = useCallback((type: ActiveFilter['type'], value: string, label: string) => {
    setActiveFilters(prev => {
      // Remove existing filter of same type
      const filtered = prev.filter(f => f.type !== type);
      if (value !== 'all') {
        filtered.push({ id: `${type}-${value}`, type, value, label });
      }
      return filtered;
    });
  }, []);

  const removeFilter = useCallback((id: string) => {
    setActiveFilters(prev => {
      const filter = prev.find(f => f.id === id);
      if (filter) {
        if (filter.type === 'sex') setSexFilter('all');
        if (filter.type === 'linked') setLinkedFilter('all');
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveFilters([]);
    setSexFilter('all');
    setLinkedFilter('all');
    setSearchTerm('');
  }, []);

  const handleSexFilterChange = useCallback((value: string) => {
    setSexFilter(value);
    const labelMap: Record<string, string> = {
      'male': 'Male',
      'female': 'Female',
    };
    addFilter('sex', value, labelMap[value] || value);
  }, [addFilter]);

  const handleLinkedFilterChange = useCallback((value: string) => {
    setLinkedFilter(value);
    const labelMap: Record<string, string> = {
      'linked': 'Linked',
      'unlinked': 'Not Linked',
    };
    addFilter('linked', value, labelMap[value] || value);
  }, [addFilter]);

  // Apply client-side filters and sort
  const filteredAndSortedPatients = useMemo(() => {
    let result = [...patients];

    // Apply sex filter
    if (sexFilter !== 'all') {
      result = result.filter(p => {
        const sex = p.sex?.toLowerCase();
        if (sexFilter === 'male') return sex === 'm' || sex === 'male';
        if (sexFilter === 'female') return sex === 'f' || sex === 'female';
        return true;
      });
    }

    // Apply linked filter
    if (linkedFilter !== 'all') {
      result = result.filter(p => {
        const isLinked = p.patient_repository?.some(r => r.hpercode);
        return linkedFilter === 'linked' ? isLinked : !isLinked;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case 'name':
          comparison = `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`);
          break;
        case 'birth_date':
          comparison = new Date(a.birth_date || 0).getTime() - new Date(b.birth_date || 0).getTime();
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [patients, sexFilter, linkedFilter, sortColumn, sortDirection]);

  const toggleSort = useCallback((column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn]);

  /* ------------------------------------------------------------------ */
  /*  Keyboard Navigation                                               */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Data Loading                                                       */
  /* ------------------------------------------------------------------ */

  const loadPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await patientService.getSupabasePatients(currentPage, limit);
      if (result.success) {
        setPatients(result.data as PatientWithRepository[]);
        setTotalPages(result.pagination.totalPages);
        setTotalPatients(result.pagination.total);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit]);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      loadPatients();
      return;
    }

    setIsSearching(true);
    try {
      const result = await patientService.searchSupabasePatients(searchTerm, { limit: 100 });
      if (result.success) {
        setPatients(result.data as PatientWithRepository[]);
        setTotalPatients(result.count);
        setTotalPages(1); // Search results are not paginated
      }
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, loadPatients]);

  const loadPatientHistory = useCallback(async (hpercode: string) => {
    setIsLoadingHistory(true);
    try {
      const result = await patientService.getPatientHistory(hpercode);
      if (result.success) {
        setPatientHistory(result.data);
      } else {
        console.error('Failed to load history:', result.message);
        setPatientHistory([]);
      }
    } catch (error) {
      console.error('Error loading patient history:', error);
      setPatientHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Effects                                                           */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  // Auto-search when debounced term changes
  useEffect(() => {
    if (debouncedSearchTerm) {
      handleSearch();
    } else if (debouncedSearchTerm === '' && searchTerm === '') {
      loadPatients();
    }
  }, [debouncedSearchTerm, handleSearch, loadPatients, searchTerm]);

  useEffect(() => {
    setIsRecordModalOpen(false);
  }, [selectedPatient?.id]);

  /* ------------------------------------------------------------------ */
  /*  Handlers                                                          */
  /* ------------------------------------------------------------------ */

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  const handleReset = useCallback(() => {
    setSearchTerm('');
    setCurrentPage(1);
    clearAllFilters();
    loadPatients();
  }, [clearAllFilters, loadPatients]);

  const handleQuickView = useCallback((patient: PatientWithRepository) => {
    navigate(`/module-3/patient-details?id=${patient.id}`);
  }, [navigate]);

  const handleQuickTag = useCallback((patient: PatientWithRepository) => {
    const hpercode = patient.patient_repository?.[0]?.hpercode;
    const params = new URLSearchParams();
    params.set('tab', hpercode ? 'linked' : 'link');
    if (hpercode) {
      params.set('hpercode', hpercode);
    }
    navigate(`/module-3/patient-tagging?patientId=${patient.id}&${params.toString()}`);
  }, [navigate]);

  const handleQuickViewRecords = useCallback((patient: PatientWithRepository) => {
    setSelectedPatient(patient);
    setIsRecordModalOpen(true);
  }, []);

  const handleSelectPatient = useCallback(async (patient: PatientWithRepository) => {
    setSelectedPatient(patient);

    const hpercode = patient.patient_repository?.[0]?.hpercode;

    if (hpercode) {
      await loadPatientHistory(hpercode);
    } else {
      setPatientHistory([]);
    }
    const params = new URLSearchParams();
    params.set('tab', 'view');
    if (hpercode) {
      params.set('hpercode', hpercode);
    }
    navigate(`/module-3/patient-tagging?${params.toString()}`);
  }, [loadPatientHistory, navigate]);

  const handleClosePatientView = useCallback(() => {
    setSelectedPatient(null);
    setPatientHistory([]);
    setTypeFilter('all');
    setIsRecordModalOpen(false);
  }, []);

  const handleViewPatient = useCallback((patientId: string) => {
    navigate(`/module-3/patient-details?id=${patientId}`);
  }, [navigate]);

  const handleOpenPatientRecords = useCallback(() => {
    if (!selectedPatientHpercode) return;
    setIsRecordModalOpen(true);
  }, [selectedPatientHpercode]);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  /* ------------------------------------------------------------------ */
  /*  Computed Values                                                    */
  /* ------------------------------------------------------------------ */

  // Filtered history based on type filter
  const filteredHistory = useMemo(() => {
    return patientHistory.filter(item => {
      const matchesType = typeFilter === 'all' ||
        (typeFilter === 'admission' && item.admdate && !item.disdate) ||
        (typeFilter === 'discharge' && item.disdate);
      return matchesType;
    });
  }, [patientHistory, typeFilter]);

  // Patient stats for selected patient
  const patientStats = useMemo<PatientStats>(() => {
    const totalVisits = patientHistory.length;
    const admissions = patientHistory.filter(h => h.admdate && !h.disdate).length;
    const discharges = patientHistory.filter(h => h.disdate).length;

    const recentVisit = patientHistory.length > 0
      ? patientHistory.sort((a, b) => {
        const dateA = new Date(a.encounter_date || a.admdate || '');
        const dateB = new Date(b.encounter_date || b.admdate || '');
        return dateB.getTime() - dateA.getTime();
      })[0]
      : null;

    return {
      totalVisits,
      admissions,
      discharges,
      recentVisit,
    };
  }, [patientHistory]);

  // Calculate statistics
  const linkedPatientsCount = useMemo(() => {
    return patients.filter(p => p.patient_repository?.some(r => r.hpercode)).length;
  }, [patients]);

  const unlinkedPatientsCount = useMemo(() => {
    return patients.length - linkedPatientsCount;
  }, [patients.length, linkedPatientsCount]);

  return {
    // Refs
    searchInputRef,
    
    // State
    patients,
    filteredAndSortedPatients,
    isLoading,
    searchTerm,
    setSearchTerm,
    isSearching,
    
    // Filters
    activeFilters,
    sexFilter,
    linkedFilter,
    sortColumn,
    sortDirection,
    
    // Pagination
    currentPage,
    totalPages,
    totalPatients,
    
    // Selected patient
    selectedPatient,
    selectedPatientHpercode,
    patientHistory,
    filteredHistory,
    isLoadingHistory,
    typeFilter,
    setTypeFilter,
    viewMode,
    setViewMode,
    isRecordModalOpen,
    setIsRecordModalOpen,
    patientStats,
    
    // Stats
    linkedPatientsCount,
    unlinkedPatientsCount,
    
    // Handlers
    handleSexFilterChange,
    handleLinkedFilterChange,
    removeFilter,
    clearAllFilters,
    toggleSort,
    handleKeyPress,
    handleReset,
    handleQuickView,
    handleQuickTag,
    handleQuickViewRecords,
    handleSelectPatient,
    handleClosePatientView,
    handleViewPatient,
    handleOpenPatientRecords,
    handlePreviousPage,
    handleNextPage,
    
    // Utilities
    getPatientInfoForCard,
    getFacility,
  };
};

export default usePatientList;
