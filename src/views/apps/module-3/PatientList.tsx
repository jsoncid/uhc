import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
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
} from 'lucide-react';
import patientService, { PatientProfile } from 'src/services/patientService';
import { getFacilityName } from 'src/utils/facilityMapping';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const BCrumb = [
  { to: '/', title: 'Home' },
  { title: 'Module 3 - Patient Repository' },
  { title: 'Patient List' },
];

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
    const variant = sex.toUpperCase() === 'M' ? 'default' : 'secondary';
    return (
      <Badge variant={variant} className="text-xs">
        {sex.toUpperCase() === 'M' ? 'Male' : sex.toUpperCase() === 'F' ? 'Female' : sex}
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
    <>
      <BreadcrumbComp items={BCrumb} title="Patient List" />
      
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Patient List</CardTitle>
            </div>
            <Badge variant="outline" className="text-sm">
              {totalPatients} Total Patients
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search Section */}
          <div className="mb-6 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, facility, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
            {searchTerm && (
              <Button variant="outline" onClick={handleReset}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            )}
          </div>

          {/* Table Section */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading patients...</span>
            </div>
          ) : patients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <User className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium text-muted-foreground">
                No patients found
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm
                  ? 'Try adjusting your search criteria'
                  : 'Start by adding patients to the system'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Facility</TableHead>
                      <TableHead className="w-[200px]">Name</TableHead>
                      <TableHead className="w-[80px]">Sex</TableHead>
                      <TableHead className="w-[120px]">Birth Date</TableHead>
                      <TableHead className="min-w-[250px]">Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((patient) => (
                      <TableRow 
                        key={patient.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleViewPatient(patient.id)}
                      >
                        <TableCell className="whitespace-normal">
                          <div className="flex items-start gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <span className="text-sm break-words">{getFacility(patient)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-normal">
                          <div className="flex items-start gap-2">
                            <UserCircle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="font-medium break-words">
                                {patient.first_name} {patient.middle_name?.[0] ? patient.middle_name[0] + '.' : ''} {patient.last_name}
                                {patient.ext_name ? ` ${patient.ext_name}` : ''}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getSexBadge(patient.sex)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm">{formatDate(patient.birth_date)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-normal">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <span className="text-sm break-words">
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
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages} ({totalPatients} total patients)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || isLoading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default PatientList;
