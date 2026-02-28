import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Badge } from 'src/components/ui/badge';
import { Alert, AlertDescription } from 'src/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'src/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'src/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu';
import {
  Search,
  User,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  Calendar,
  MapPin,
  Loader2,
  Users,
  RefreshCw,
  Building2,
  Filter,
  ArrowUpDown,
  X,
  History as HistoryIcon,
  Info,
  LinkIcon,
  FileText,
  Eye,
  Tag,
  Plus,
  SlidersHorizontal,
  Link2,
  Link2Off,
} from 'lucide-react';
import patientService, { PatientProfile, PatientHistory } from 'src/services/patientService';
import { getFacilityName } from 'src/utils/facilityMapping';
import PatientHistoryTabs from './components/PatientHistoryTabs';
import PatientInfoCard from './components/PatientInfoCard';
import { PatientPDFModal } from './components/PatientPDFModal';
import {
  Module3PageHeader,
  StatsCard,
  TableRowSkeleton,
} from './components';

/* ------------------------------------------------------------------ */
/*  Types & Interfaces                                                 */
/* ------------------------------------------------------------------ */

interface ActiveFilter {
  id: string;
  type: 'sex' | 'linked' | 'facility';
  label: string;
  value: string;
}

/* ------------------------------------------------------------------ */
/*  Helper: Calculate Age                                              */
/* ------------------------------------------------------------------ */

const calculateAge = (birthDate: string): string => {
  if (!birthDate) return '';
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return `${age}y`;
};

/* ------------------------------------------------------------------ */
/*  Helper: Debounce Hook                                              */
/* ------------------------------------------------------------------ */

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/* ------------------------------------------------------------------ */
/*  Filter Chip Component                                              */
/* ------------------------------------------------------------------ */

const FilterChip = ({ 
  filter, 
  onRemove 
}: { 
  filter: ActiveFilter; 
  onRemove: (id: string) => void;
}) => (
  <Badge 
    variant="secondary" 
    className="px-3 py-1.5 gap-1.5 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-default"
  >
    {filter.label}
    <button
      onClick={(e) => {
        e.stopPropagation();
        onRemove(filter.id);
      }}
      className="ml-1 rounded-full p-0.5 hover:bg-primary/20 transition-colors"
      title={`Remove ${filter.label} filter`}
      aria-label={`Remove ${filter.label} filter`}
    >
      <X className="h-3 w-3" />
    </button>
  </Badge>
);

/* ------------------------------------------------------------------ */
/*  Quick Actions Component                                            */
/* ------------------------------------------------------------------ */

const QuickActions = ({ 
  patient, 
  onView, 
  onTag,
  onViewRecords,
  isLinked
}: { 
  patient: any; 
  onView: () => void;
  onTag: () => void;
  onViewRecords: () => void;
  isLinked: boolean;
}) => (
  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
          onClick={(e) => { e.stopPropagation(); onView(); }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>View Details</TooltipContent>
    </Tooltip>
    
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0 hover:bg-amber-500/10 hover:text-amber-600"
          onClick={(e) => { e.stopPropagation(); onTag(); }}
        >
          <Tag className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isLinked ? 'Manage Links' : 'Link to Hospital'}</TooltipContent>
    </Tooltip>
    
    {isLinked && (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-blue-500/10 hover:text-blue-600"
            onClick={(e) => { e.stopPropagation(); onViewRecords(); }}
          >
            <FileText className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>View Records</TooltipContent>
      </Tooltip>
    )}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Patient Avatar Component                                           */
/* ------------------------------------------------------------------ */

const PatientAvatar = ({ patient }: { patient: any }) => {
  const initials = `${patient.first_name?.[0] || ''}${patient.last_name?.[0] || ''}`.toUpperCase();
  const sexUpper = patient.sex?.toUpperCase() || '';
  const isMale = sexUpper === 'M' || sexUpper === 'MALE';
  const isFemale = sexUpper === 'F' || sexUpper === 'FEMALE';
  
  const bgColor = isMale 
    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
    : isFemale 
    ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' 
    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';

  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${bgColor}`}>
      {initials}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Link Status Indicator                                              */
/* ------------------------------------------------------------------ */

const LinkStatusIndicator = ({ isLinked, linkCount }: { isLinked: boolean; linkCount: number }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div className={`flex items-center gap-1 ${isLinked ? 'text-green-600' : 'text-amber-500'}`}>
        {isLinked ? (
          <>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {linkCount > 1 && (
              <span className="text-xs font-medium">{linkCount}</span>
            )}
          </>
        ) : (
          <div className="w-2 h-2 rounded-full bg-amber-400" />
        )}
      </div>
    </TooltipTrigger>
    <TooltipContent>
      {isLinked 
        ? linkCount > 1 
          ? `Linked to ${linkCount} hospital records` 
          : 'Linked to hospital record'
        : 'Not linked - Click to tag'}
    </TooltipContent>
  </Tooltip>
);

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const PatientList = () => {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // State
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Filter state
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [sexFilter, setSexFilter] = useState<string>('all');
  const [linkedFilter, setLinkedFilter] = useState<string>('all');
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Debounced search
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [limit] = useState(20);

  // Selected patient and history state
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientHistory, setPatientHistory] = useState<PatientHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const selectedPatientHpercode = selectedPatient?.patient_repository?.[0]?.hpercode;

  /* ------------------------------------------------------------------ */
  /*  Filter Logic                                                      */
  /* ------------------------------------------------------------------ */

  const addFilter = (type: ActiveFilter['type'], value: string, label: string) => {
    // Remove existing filter of same type
    const filtered = activeFilters.filter(f => f.type !== type);
    if (value !== 'all') {
      filtered.push({ id: `${type}-${value}`, type, value, label });
    }
    setActiveFilters(filtered);
  };

  const removeFilter = (id: string) => {
    const filter = activeFilters.find(f => f.id === id);
    if (filter) {
      if (filter.type === 'sex') setSexFilter('all');
      if (filter.type === 'linked') setLinkedFilter('all');
    }
    setActiveFilters(prev => prev.filter(f => f.id !== id));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
    setSexFilter('all');
    setLinkedFilter('all');
    setSearchTerm('');
  };

  const handleSexFilterChange = (value: string) => {
    setSexFilter(value);
    const labelMap: Record<string, string> = {
      'male': 'Male',
      'female': 'Female',
    };
    addFilter('sex', value, labelMap[value] || value);
  };

  const handleLinkedFilterChange = (value: string) => {
    setLinkedFilter(value);
    const labelMap: Record<string, string> = {
      'linked': 'Linked',
      'unlinked': 'Not Linked',
    };
    addFilter('linked', value, labelMap[value] || value);
  };

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
      result = result.filter((p: any) => {
        const isLinked = p.patient_repository?.some((r: any) => r.hpercode);
        return linkedFilter === 'linked' ? isLinked : !isLinked;
      });
    }

    // Apply sorting
    result.sort((a: any, b: any) => {
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

  const toggleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

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
  /*  Effects                                                           */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    loadPatients();
  }, [currentPage]);

  // Auto-search when debounced term changes
  useEffect(() => {
    if (debouncedSearchTerm) {
      handleSearch();
    } else if (debouncedSearchTerm === '' && searchTerm === '') {
      loadPatients();
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    setIsRecordModalOpen(false);
  }, [selectedPatient?.id]);

  /* ------------------------------------------------------------------ */
  /*  Handlers                                                          */
  /* ------------------------------------------------------------------ */

  const loadPatients = async () => {
    setIsLoading(true);
    try {
      const result = await patientService.getSupabasePatients(currentPage, limit);
      if (result.success) {
        setPatients(result.data as any);
        setTotalPages(result.pagination.totalPages);
        setTotalPatients(result.pagination.total);
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadPatients();
      return;
    }

    setIsSearching(true);
    try {
      const result = await patientService.searchSupabasePatients(searchTerm, { limit: 100 });
      if (result.success) {
        setPatients(result.data as any);
        setTotalPatients(result.count);
        setTotalPages(1); // Search results are not paginated
      }
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setCurrentPage(1);
    clearAllFilters();
    loadPatients();
  };

  // Quick action handlers
  const handleQuickView = (patient: any) => {
    navigate(`/module-3/patient-details?id=${patient.id}`);
  };

  const handleQuickTag = (patient: any) => {
    const hpercode = patient.patient_repository?.[0]?.hpercode;
    const params = new URLSearchParams();
    params.set('tab', hpercode ? 'linked' : 'link');
    if (hpercode) {
      params.set('hpercode', hpercode);
    }
    navigate(`/module-3/patient-tagging?patientId=${patient.id}&${params.toString()}`);
  };

  const handleQuickViewRecords = (patient: any) => {
    setSelectedPatient(patient);
    setIsRecordModalOpen(true);
  };

  const handleSelectPatient = async (patient: any) => {
    setSelectedPatient(patient);

    // Check if patient is linked (has hpercode from patient_repository)
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
  };

  const loadPatientHistory = async (hpercode: string) => {
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
  };

  const handleClosePatientView = () => {
    setSelectedPatient(null);
    setPatientHistory([]);
    setTypeFilter('all');
    setIsRecordModalOpen(false);
  };

  const handleViewPatient = (patientId: string) => {
    navigate(`/module-3/patient-details?id=${patientId}`);
  };

  const handleOpenPatientRecords = () => {
    if (!selectedPatientHpercode) return;
    setIsRecordModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getSexBadge = (sex: string) => {
    const sexUpper = sex.toUpperCase();
    const isMale = sexUpper === 'M' || sexUpper === 'MALE';
    const isFemale = sexUpper === 'F' || sexUpper === 'FEMALE';

    return (
      <Badge
        variant={isMale ? 'default' : isFemale ? 'secondary' : 'outline'}
        className="text-xs font-medium"
      >
        {isMale ? 'male' : isFemale ? 'female' : sex}
      </Badge>
    );
  };

  const getLocationString = (patient: any) => {
    // First try to use the joined location hierarchy
    if (patient.brgy?.city_municipality) {
      const brgy = patient.brgy.description || '';
      const city = patient.brgy.city_municipality.description || '';
      const province = patient.brgy.city_municipality.province?.description || '';
      const region = patient.brgy.city_municipality.province?.region?.description || '';

      // Build location string from most specific to general
      const parts = [brgy, city, province, region].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : 'N/A';
    }

    // Fallback to manual text fields
    const parts = [
      patient.brgy_name,
      patient.city_name,
      patient.province_name,
      patient.region_name
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const getFacility = (patient: any) => {
    // Get facility_code from patient_repository array (first entry)
    const facilityCode = patient.patient_repository?.[0]?.facility_code;
    return getFacilityName(facilityCode);
  };

  // Filtered history based on type filter
  const filteredHistory = patientHistory.filter(item => {
    const matchesType = typeFilter === 'all' ||
      (typeFilter === 'admission' && item.admdate && !item.disdate) ||
      (typeFilter === 'discharge' && item.disdate);
    return matchesType;
  });

  // Patient stats for selected patient
  const patientStats = useMemo(() => {
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

  // Helper to convert Supabase patient to the format expected by PatientInfoCard
  const getPatientInfoForCard = (patient: any) => {
    return {
      id: patient.id,
      hpercode: patient.patient_repository?.[0]?.hpercode || patient.id,
      first_name: patient.first_name,
      middle_name: patient.middle_name,
      last_name: patient.last_name,
      ext_name: patient.ext_name,
      sex: patient.sex,
      birth_date: patient.birth_date,
      facility_code: patient.patient_repository?.[0]?.facility_code,
      facility_display_name: getFacility(patient),
      brgy_name: patient.brgy?.description || patient.brgy_name,
      city_name: patient.brgy?.city_municipality?.description || patient.city_name,
      province_name: patient.brgy?.city_municipality?.province?.description || patient.province_name,
      region_name: patient.brgy?.city_municipality?.province?.region?.description || patient.region_name,
      street: patient.street,
      created_at: patient.created_at,
      brgy: patient.brgy,
    };
  };

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */

  // Calculate statistics
  const linkedPatientsCount = patients.filter((p: any) => 
    p.patient_repository?.some((r: any) => r.hpercode)
  ).length;
  const unlinkedPatientsCount = patients.length - linkedPatientsCount;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <Module3PageHeader
        icon={Users}
        title="Patient List"
        description="View and manage all patient records in the system"
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          title="Total Patients"
          value={totalPatients}
          colorScheme="blue"
          description="All registered patients"
        />
        <StatsCard
          icon={Link2}
          title="Linked Patients"
          value={linkedPatientsCount}
          colorScheme="green"
          description="Connected to hospital"
        />
        <StatsCard
          icon={Link2Off}
          title="Unlinked Patients"
          value={unlinkedPatientsCount}
          colorScheme="amber"
          description="Pending connection"
        />
        <StatsCard
          icon={Building2}
          title="Current Page"
          value={currentPage}
          colorScheme="purple"
          description={`of ${totalPages} total pages`}
          animate={false}
        />
      </div>

      {/* Search and Filters Card */}
      <Card className="border-2 overflow-hidden">
        <CardContent className="p-0">
          {/* Main Search Bar */}
          <div className="p-4 bg-muted/30 border-b">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search by patient name... (Press '/' to focus)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 pr-10 h-11 text-base bg-background"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Filter Dropdowns */}
              <Select value={sexFilter} onValueChange={handleSexFilterChange}>
                <SelectTrigger className="w-[130px] h-11">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Sex" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sexes</SelectItem>
                  <SelectItem value="male">
                    <span className="flex items-center gap-2">♂ Male</span>
                  </SelectItem>
                  <SelectItem value="female">
                    <span className="flex items-center gap-2">♀ Female</span>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={linkedFilter} onValueChange={handleLinkedFilterChange}>
                <SelectTrigger className="w-[150px] h-11">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Link Status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="linked">
                    <span className="flex items-center gap-2">
                      <Link2 className="h-3.5 w-3.5 text-green-600" />
                      Linked
                    </span>
                  </SelectItem>
                  <SelectItem value="unlinked">
                    <span className="flex items-center gap-2">
                      <Link2Off className="h-3.5 w-3.5 text-amber-500" />
                      Not Linked
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              {(searchTerm || activeFilters.length > 0) && (
                <Button
                  variant="outline"
                  onClick={handleReset}
                  size="lg"
                  className="px-4 h-11"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters Chips */}
          {activeFilters.length > 0 && (
            <div className="px-4 py-3 flex items-center gap-2 flex-wrap border-b bg-background">
              <span className="text-sm text-muted-foreground font-medium">Active Filters:</span>
              {activeFilters.map((filter) => (
                <FilterChip key={filter.id} filter={filter} onRemove={removeFilter} />
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-muted-foreground hover:text-foreground ml-2"
              >
                Clear All
              </Button>
            </div>
          )}

          {/* Results Summary Bar */}
          <div className="px-4 py-2 flex items-center justify-between text-sm bg-background border-b">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{filteredAndSortedPatients.length}</span> of{' '}
                <span className="font-semibold text-foreground">{totalPatients}</span> patients
              </span>
              {linkedFilter === 'all' && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    {filteredAndSortedPatients.filter((p: any) => p.patient_repository?.some((r: any) => r.hpercode)).length} linked
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    {filteredAndSortedPatients.filter((p: any) => !p.patient_repository?.some((r: any) => r.hpercode)).length} unlinked
                  </span>
                </div>
              )}
            </div>
            {!searchTerm && totalPages > 1 && (
              <span className="text-muted-foreground">
                Page <span className="font-medium text-foreground">{currentPage}</span> of{' '}
                <span className="font-medium text-foreground">{totalPages}</span>
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patient List Card */}
      <Card className="border-2">
        <CardContent className="p-0">
          {/* Table Section */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="mt-4 text-base text-muted-foreground font-medium">Loading patient records...</span>
            </div>
          ) : filteredAndSortedPatients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="p-4 bg-muted/50 rounded-full mb-4">
                <User className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <p className="text-xl font-semibold text-foreground">
                No patients found
              </p>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                {searchTerm || activeFilters.length > 0
                  ? 'No patients match your search criteria. Try adjusting your search terms or clear the filters.'
                  : 'There are no patient records in the system yet. Patients will appear here once they are added.'}
              </p>
              {(searchTerm || activeFilters.length > 0) && (
                <Button variant="outline" onClick={clearAllFilters} className="mt-4">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b-2 bg-muted/30">
                      <TableHead className="font-semibold text-foreground h-12 w-10">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-center">
                              <LinkIcon className="h-4 w-4" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Link Status</TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground h-12">
                        <button 
                          onClick={() => toggleSort('name')}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          <UserCircle className="h-4 w-4" />
                          Patient Name
                          <ArrowUpDown className={`h-3 w-3 ${sortColumn === 'name' ? 'text-primary' : 'text-muted-foreground'}`} />
                        </button>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground h-12">Sex</TableHead>
                      <TableHead className="font-semibold text-foreground h-12">
                        <button 
                          onClick={() => toggleSort('birth_date')}
                          className="flex items-center gap-2 hover:text-primary transition-colors"
                        >
                          <Calendar className="h-4 w-4" />
                          Date of Birth
                          <ArrowUpDown className={`h-3 w-3 ${sortColumn === 'birth_date' ? 'text-primary' : 'text-muted-foreground'}`} />
                        </button>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground h-12">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Facility
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground h-12">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Location
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground h-12 w-28 text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedPatients.map((patient: any) => {
                      const isLinked = patient.patient_repository?.some((r: any) => r.hpercode);
                      const linkCount = patient.patient_repository?.filter((r: any) => r.hpercode).length || 0;
                      const age = calculateAge(patient.birth_date);
                      
                      return (
                        <TableRow
                          key={patient.id}
                          className={`cursor-pointer hover:bg-muted/50 transition-all duration-200 group border-b ${selectedPatient?.id === patient.id ? 'bg-primary/10 hover:bg-primary/15' : ''}`}
                          onClick={() => handleSelectPatient(patient)}
                        >
                          {/* Link Status */}
                          <TableCell className="py-3">
                            <LinkStatusIndicator isLinked={isLinked} linkCount={linkCount} />
                          </TableCell>
                          
                          {/* Patient Name with Avatar */}
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <PatientAvatar patient={patient} />
                              <div className="min-w-0">
                                <div className="font-semibold text-foreground truncate">
                                  {patient.last_name}, {patient.first_name} {patient.middle_name?.[0] ? patient.middle_name[0] + '.' : ''}
                                  {patient.ext_name ? ` ${patient.ext_name}` : ''}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  ID: {patient.id?.substring(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          
                          {/* Sex Badge */}
                          <TableCell className="py-3">
                            {getSexBadge(patient.sex)}
                          </TableCell>
                          
                          {/* Date of Birth with Age */}
                          <TableCell className="py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-foreground">
                                {formatDate(patient.birth_date)}
                              </span>
                              {age && (
                                <Badge variant="outline" className="text-xs font-normal">
                                  {age}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          
                          {/* Facility */}
                          <TableCell className="py-3">
                            <div className="flex items-start gap-2 max-w-[180px]">
                              <span className="text-sm font-medium text-foreground leading-relaxed block whitespace-normal break-words">
                                {getFacility(patient)}
                              </span>
                            </div>
                          </TableCell>
                          
                          {/* Location */}
                          <TableCell className="py-3">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-start gap-2 max-w-[200px]">
                                  <span className="text-sm text-muted-foreground leading-relaxed truncate">
                                    {getLocationString(patient)}
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-xs">
                                {getLocationString(patient)}
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          
                          {/* Quick Actions */}
                          <TableCell className="py-3 text-right">
                            <QuickActions
                              patient={patient}
                              onView={() => handleQuickView(patient)}
                              onTag={() => handleQuickTag(patient)}
                              onViewRecords={() => handleQuickViewRecords(patient)}
                              isLinked={isLinked}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {!searchTerm && totalPages > 1 && (
                <div className="border-t bg-muted/30 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground font-medium">
                      Showing page <span className="font-semibold text-foreground">{currentPage}</span> of <span className="font-semibold text-foreground">{totalPages}</span> ({totalPatients.toLocaleString()} total {totalPatients === 1 ? 'patient' : 'patients'})
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="default"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || isLoading}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="default"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || isLoading}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Selected Patient History Section */}
      {selectedPatient && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header with Close Button */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <HistoryIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {selectedPatient.first_name} {selectedPatient.middle_name} {selectedPatient.last_name}
                </h2>
                <p className="text-sm text-muted-foreground">Patient Medical History</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleClosePatientView}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>

          {/* Check if patient is linked */}
          {!selectedPatient.patient_repository?.[0]?.hpercode ? (
            <Alert className="border-amber-200 bg-amber-50">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  <span>
                    This patient is not linked to the hospital database. Link the patient in{' '}
                    <strong>Patient Tagging</strong> to view their medical history.
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-12 gap-4">
              {/* Patient Information Card */}
              <div className="col-span-12 lg:col-span-4">
                <PatientInfoCard
                  patient={getPatientInfoForCard(selectedPatient)}
                  recentVisit={patientStats.recentVisit}
                />
              </div>

              {/* Patient History */}
              <div className="col-span-12 lg:col-span-8 space-y-3">
                <div className="flex items-center justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenPatientRecords}
                    disabled={!selectedPatientHpercode}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    View Records
                  </Button>
                </div>
                <PatientHistoryTabs
                  history={filteredHistory}
                  isLoading={isLoadingHistory}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  typeFilter={typeFilter}
                  onTypeFilterChange={setTypeFilter}
                  rightActions={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenPatientRecords}
                      disabled={!selectedPatientHpercode}
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      View Records
                    </Button>
                  }
                />
              </div>
            </div>
          )}
        </div>
      )}
      <PatientPDFModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        patient={selectedPatient}
        hpercode={selectedPatientHpercode}
      />
    </div>
  );
};

export default PatientList;
