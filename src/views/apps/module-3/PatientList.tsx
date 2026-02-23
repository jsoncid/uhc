import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Badge } from 'src/components/ui/badge';
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
} from 'lucide-react';
import patientService, { PatientProfile } from 'src/services/patientService';
import { getFacilityName } from 'src/utils/facilityMapping';

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

  /* ------------------------------------------------------------------ */
  /*  Effects                                                           */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    loadPatients();
  }, [currentPage]);

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

  const handleViewPatient = (patientId: string) => {
    navigate(`/module-3/patient-details?id=${patientId}`);
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
            Patient Repository
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage and view all patient records in the system
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
                        className="cursor-pointer hover:bg-muted/50 transition-all duration-200 group border-b"
                        onClick={() => handleViewPatient(patient.id)}
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
    </div>
  );
};

export default PatientList;
