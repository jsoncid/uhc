import { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import patientService, { PatientProfile, PatientHistory } from 'src/services/patientService';
import { getFacilityName } from 'src/utils/facilityMapping';
import PatientHistoryTabs from './components/PatientHistoryTabs';
import PatientInfoCard from './components/PatientInfoCard';
import { PatientPDFModal } from './components/PatientPDFModal';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const PatientList = () => {
  const navigate = useNavigate();

  // State
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

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
  /*  Effects                                                           */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    loadPatients();
  }, [currentPage]);

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
    loadPatients();
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
    navigate(`/module-3/patient-tagging${hpercode ? `?hpercode=${encodeURIComponent(hpercode)}` : ''}`);
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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-7 w-7 text-primary" />
            </div>
            Patient List
          </h1>
          <p className="text-muted-foreground mt-2">
            View and manage all patient records in the system
          </p>
        </div>
        <Badge variant="outline" className="text-base px-4 py-2 font-semibold">
          <Users className="h-4 w-4 mr-2" />
          {totalPatients} {totalPatients === 1 ? 'Patient' : 'Patients'}
        </Badge>
      </div>

      {/* Search and Filters Card */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by patient name, facility, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-11 h-11 text-base"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              size="lg"
              className="px-6"
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Search
                </>
              )}
            </Button>
            {searchTerm && (
              <Button
                variant="outline"
                onClick={handleReset}
                size="lg"
                className="px-6"
              >
                <RefreshCw className="mr-2 h-5 w-5" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patient List Card */}
      <Card className="border-2">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Patient Records</h2>
            {!searchTerm && totalPages > 1 && (
              <div className="text-sm text-muted-foreground font-medium">
                Page {currentPage} of {totalPages}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Table Section */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="mt-4 text-base text-muted-foreground font-medium">Loading patient records...</span>
            </div>
          ) : patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="p-4 bg-muted/50 rounded-full mb-4">
                <User className="h-12 w-12 text-muted-foreground/50" />
              </div>
              <p className="text-xl font-semibold text-foreground">
                No patients found
              </p>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                {searchTerm
                  ? 'No patients match your search criteria. Try adjusting your search terms or clear the filters.'
                  : 'There are no patient records in the system yet. Patients will appear here once they are added.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b-2">
                      <TableHead className="font-semibold text-foreground h-12">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Facility
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground h-12">
                        <div className="flex items-center gap-2">
                          <UserCircle className="h-4 w-4" />
                          Patient Name
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground h-12">Sex</TableHead>
                      <TableHead className="font-semibold text-foreground h-12">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Date of Birth
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground h-12">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Location
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((patient, index) => (
                      <TableRow
                        key={patient.id}
                        className={`cursor-pointer hover:bg-muted/50 transition-all duration-200 group border-b ${selectedPatient?.id === patient.id ? 'bg-primary/10 hover:bg-primary/15' : ''
                          }`}
                        onClick={() => handleSelectPatient(patient)}
                      >
                        <TableCell className="py-4">
                          <div className="flex items-start gap-2 max-w-[200px]">
                            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1 group-hover:text-primary transition-colors" />
                            <span className="text-sm font-medium text-foreground break-words leading-relaxed">
                              {getFacility(patient)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-start gap-2">
                            <UserCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1 group-hover:text-primary transition-colors" />
                            <div className="font-medium text-foreground break-words leading-relaxed">
                              {patient.first_name} {patient.middle_name?.[0] ? patient.middle_name[0] + '.' : ''} {patient.last_name}
                              {patient.ext_name ? ` ${patient.ext_name}` : ''}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          {getSexBadge(patient.sex)}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground font-medium">
                              {formatDate(patient.birth_date)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-start gap-2 max-w-[300px]">
                            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                            <span className="text-sm text-muted-foreground break-words leading-relaxed">
                              {getLocationString(patient)}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
