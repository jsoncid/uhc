import { useState, useMemo } from 'react';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import CardBox from 'src/components/shared/CardBox';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Badge } from 'src/components/ui/badge';
import { Separator } from 'src/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'src/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import {
  User,
  Search,
  Calendar,
  Clock,
  FileText,
  Activity,
  Loader2,
  ChevronRight,
  History as HistoryIcon,
  MapPin,
  Phone,
  Mail,
  Building2,
  Heart,
  Stethoscope,
  Pill,
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserCircle,
  Filter,
  X,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import patientService, { PatientProfile, PatientHistory } from 'src/services/patientService';
import { cn } from 'src/lib/utils';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const BCrumb = [
  { to: '/', title: 'Home' },
  { title: 'Module 3 - Patient Repository' },
  { title: 'Patient Tagging' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const PatientTagging = () => {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PatientProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);

  // Patient history state
  const [patientHistory, setPatientHistory] = useState<PatientHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Filter state
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');

  /* ------------------------------------------------------------------ */
  /*  Search Functions                                                  */
  /* ------------------------------------------------------------------ */

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      const result = await patientService.searchPatients(searchTerm, { limit: 10 });
      if (result.success) {
        setSearchResults(result.data);
      }
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPatient = async (patient: PatientProfile) => {
    setSelectedPatient(patient);
    setSearchResults([]);
    setSearchTerm('');

    // Load patient history using hpercode
    if (patient.hpercode) {
      await loadPatientHistory(patient.hpercode);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Data Loading Functions                                            */
  /* ------------------------------------------------------------------ */

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

  /* ------------------------------------------------------------------ */
  /*  Utility Functions                                                 */
  /* ------------------------------------------------------------------ */

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString?: string, timeString?: string) => {
    if (!dateString) return 'N/A';
    let formatted = formatDate(dateString);
    if (timeString) {
      formatted += ` ${timeString}`;
    }
    return formatted;
  };

  const getAdmissionType = (record: PatientHistory) => {
    // Determine admission type based on available data
    if (record.disdate) return 'Discharge';
    if (record.admdate) return 'Admission';
    return 'Record';
  };

  const getRecordTypeIcon = (record: PatientHistory) => {
    if (record.disdate) return <FileText className="h-4 w-4 text-white" />;
    if (record.admdate) return <Activity className="h-4 w-4 text-white" />;
    return <Stethoscope className="h-4 w-4 text-white" />;
  };

  const getRecordTypeColor = (record: PatientHistory) => {
    if (record.disdate) return 'bg-emerald-500';
    if (record.admdate) return 'bg-blue-500';
    return 'bg-purple-500';
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    const statusConfig: Record<string, { 
      variant: 'default' | 'secondary' | 'destructive' | 'outline';
      label: string;
      icon: React.ReactNode;
      className?: string;
    }> = {
      'A': { 
        variant: 'default', 
        label: 'Admitted', 
        icon: <Activity className="h-3 w-3 mr-1" />,
        className: 'bg-blue-500 hover:bg-blue-600'
      },
      'D': { 
        variant: 'secondary', 
        label: 'Discharged', 
        icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
        className: 'bg-emerald-500 hover:bg-emerald-600 text-white'
      },
      'C': { 
        variant: 'destructive', 
        label: 'Cancelled', 
        icon: <XCircle className="h-3 w-3 mr-1" />
      },
      'I': { 
        variant: 'default', 
        label: 'Inpatient', 
        icon: <Heart className="h-3 w-3 mr-1" />,
        className: 'bg-purple-500 hover:bg-purple-600'
      },
    };

    const config = statusConfig[status] || { 
      variant: 'outline' as const, 
      label: status, 
      icon: null 
    };

    return (
      <Badge variant={config.variant} className={cn('flex items-center gap-1', config.className)}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  /* ------------------------------------------------------------------ */
  /*  Statistics & Analytics                                            */
  /* ------------------------------------------------------------------ */

  const patientStats = useMemo(() => {
    const totalVisits = patientHistory.length;
    const admissions = patientHistory.filter(h => h.admdate && !h.disdate).length;
    const discharges = patientHistory.filter(h => h.disdate).length;
    const activeAdmissions = patientHistory.filter(h => h.admdate && !h.disdate).length;
    
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
      activeAdmissions,
      recentVisit,
    };
  }, [patientHistory]);

  /* ------------------------------------------------------------------ */
  /*  Filtered Data                                                     */
  /* ------------------------------------------------------------------ */

  const filteredHistory = patientHistory.filter(item => {
    const matchesType = typeFilter === 'all' || 
      (typeFilter === 'admission' && item.admdate && !item.disdate) ||
      (typeFilter === 'discharge' && item.disdate);
    return matchesType;
  });

  const uniqueTypes = [
    { value: 'admission', label: 'Admission' },
    { value: 'discharge', label: 'Discharge' },
  ];

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */

  return (
    <div className="w-full">
      <BreadcrumbComp items={BCrumb} title="Patient Tagging" />

      <div className="grid grid-cols-12 gap-4 mt-4">
        {/* Enhanced Search Panel */}
        <div className="col-span-12">
          <Card className="border shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                Patient Search
              </CardTitle>
              <CardDescription>
                Search by patient name, HPERCODE, or other identifiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor="search" className="mb-2 block text-sm font-medium">
                    Enter Search Term
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Type patient name or HPERCODE..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10 h-10"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleSearch} 
                  disabled={isSearching || !searchTerm.trim()}
                  className="h-10 px-6"
                >
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

              {/* Enhanced Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-xs text-muted-foreground">
                      Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchResults([])}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                  <div className="border rounded-lg overflow-hidden shadow-sm">
                    <div className="max-h-[350px] overflow-y-auto">
                      {searchResults.map((patient, index) => (
                        <div
                          key={patient.id}
                          className={cn(
                            "p-3 hover:bg-primary/5 cursor-pointer transition-all duration-200 border-b last:border-b-0",
                            "hover:shadow-sm"
                          )}
                          onClick={() => handleSelectPatient(patient)}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="bg-gradient-to-br from-primary to-primary/70 p-2 rounded-lg shadow-sm">
                                <UserCircle className="h-5 w-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-base mb-1">
                                  {patient.first_name} {patient.middle_name} {patient.last_name} {patient.ext_name}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {formatDate(patient.birth_date)}
                                    <Badge variant="outline" className="ml-1">
                                      {calculateAge(patient.birth_date)} yrs
                                    </Badge>
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5" />
                                    {patient.sex === 'M' ? 'Male' : patient.sex === 'F' ? 'Female' : patient.sex}
                                  </span>
                                  {patient.hpercode && (
                                    <Badge variant="secondary" className="font-mono">
                                      {patient.hpercode}
                                    </Badge>
                                  )}
                                  {patient.facility_code && (
                                    <span className="flex items-center gap-1.5">
                                      <Building2 className="h-3.5 w-3.5" />
                                      {patient.facility_code}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Selected Patient Details */}
        {selectedPatient && (
          <>
            {/* Enhanced Patient Information Card */}
            <div className="col-span-12 lg:col-span-4">
              <Card className="border shadow-md sticky top-4">
                <CardHeader className="pb-3 bg-gradient-to-br from-primary/5 to-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-gradient-to-br from-primary to-primary/70 p-2.5 rounded-xl shadow-md">
                      <UserCircle className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base mb-0.5">Patient Information</CardTitle>
                      <CardDescription>Demographics and Contact</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  <div className="bg-gradient-to-br from-primary/5 to-transparent p-3 rounded-lg border">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Full Name</Label>
                    <p className="font-bold text-base mt-1 text-primary">
                      {selectedPatient.first_name} {selectedPatient.middle_name}{' '}
                      {selectedPatient.last_name} {selectedPatient.ext_name}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Birth Date
                      </Label>
                      <p className="font-semibold text-sm">{formatDate(selectedPatient.birth_date)}</p>
                      <Badge variant="outline" className="mt-1">
                        {calculateAge(selectedPatient.birth_date)} years old
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Sex
                      </Label>
                      <p className="font-semibold text-sm">
                        {selectedPatient.sex === 'M' ? 'Male' : selectedPatient.sex === 'F' ? 'Female' : selectedPatient.sex}
                      </p>
                    </div>
                  </div>

                  {selectedPatient.hpercode && (
                    <div className="bg-muted/50 p-3 rounded-lg border">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">HPERCODE</Label>
                      <p className="font-mono font-bold text-sm mt-1 tracking-wider">{selectedPatient.hpercode}</p>
                    </div>
                  )}

                  {selectedPatient.facility_code && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        Facility
                      </Label>
                      <p className="font-semibold text-sm">{selectedPatient.facility_code}</p>
                    </div>
                  )}

                  {(selectedPatient.civil_status || selectedPatient.religion || selectedPatient.nationality) && (
                    <>
                      <Separator />
                      <div className="grid grid-cols-1 gap-3">
                        {selectedPatient.civil_status && (
                          <div className="flex justify-between items-center">
                            <Label className="text-xs text-muted-foreground">Civil Status</Label>
                            <Badge variant="secondary">{selectedPatient.civil_status}</Badge>
                          </div>
                        )}
                        {selectedPatient.religion && (
                          <div className="flex justify-between items-center">
                            <Label className="text-xs text-muted-foreground">Religion</Label>
                            <Badge variant="secondary">{selectedPatient.religion}</Badge>
                          </div>
                        )}
                        {selectedPatient.nationality && (
                          <div className="flex justify-between items-center">
                            <Label className="text-xs text-muted-foreground">Nationality</Label>
                            <Badge variant="secondary">{selectedPatient.nationality}</Badge>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {(selectedPatient.street || selectedPatient.brgy_name || selectedPatient.city_name) && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Address
                        </Label>
                        <div className="bg-muted/50 p-3 rounded-lg text-sm leading-relaxed">
                          {selectedPatient.street && <p>{selectedPatient.street}</p>}
                          {selectedPatient.brgy_name && <p>{selectedPatient.brgy_name}</p>}
                          {selectedPatient.city_name && <p>{selectedPatient.city_name}</p>}
                          {selectedPatient.province_name && <p>{selectedPatient.province_name}</p>}
                          {selectedPatient.region_name && <p>{selectedPatient.region_name}</p>}
                          {selectedPatient.zip_code && <p className="font-mono">{selectedPatient.zip_code}</p>}
                        </div>
                      </div>
                    </>
                  )}

                  {patientStats.recentVisit && (
                    <>
                      <Separator />
                      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                        <Label className="text-xs text-blue-700 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last Visit
                        </Label>
                        <p className="font-semibold mt-1">
                          {formatDateTime(
                            patientStats.recentVisit.encounter_date || patientStats.recentVisit.admdate,
                            patientStats.recentVisit.encounter_time || patientStats.recentVisit.admtime
                          )}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Patient History */}
            <div className="col-span-12 lg:col-span-8">
              <Card className="border shadow-md">
                <CardHeader className="pb-3 bg-gradient-to-br from-primary/5 to-primary/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="p-1.5 bg-primary/20 rounded-lg">
                          <HistoryIcon className="h-5 w-5 text-primary" />
                        </div>
                        Complete Patient History
                      </CardTitle>
                      <CardDescription className="mt-2">
                        All interactions, consultations, and medical records for this patient
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'timeline' | 'table')} className="w-full">
                    <div className="flex items-center justify-between mb-4">
                      <TabsList className="grid w-[300px] grid-cols-2">
                        <TabsTrigger value="timeline" className="data-[state=active]:bg-primary">
                          <Clock className="h-4 w-4 mr-2" />
                          Timeline
                        </TabsTrigger>
                        <TabsTrigger value="table" className="data-[state=active]:bg-primary">
                          <FileText className="h-4 w-4 mr-2" />
                          Table
                        </TabsTrigger>
                      </TabsList>

                      {/* Enhanced Filters */}
                      <div className="flex items-center gap-3">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              <div className="flex items-center gap-2">
                                <HistoryIcon className="h-4 w-4" />
                                All Records
                              </div>
                            </SelectItem>
                            {uniqueTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  {type.value === 'admission' && <Activity className="h-4 w-4" />}
                                  {type.value === 'discharge' && <CheckCircle2 className="h-4 w-4" />}
                                  {type.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <TabsContent value="timeline" className="mt-0">
                      {/* Timeline */}
                      {isLoadingHistory ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                          <p className="text-sm text-muted-foreground">Loading patient history...</p>
                        </div>
                      ) : filteredHistory.length === 0 ? (
                        <div className="text-center py-12 border border-dashed rounded-lg">
                          <div className="bg-muted rounded-full p-4 w-fit mx-auto mb-3">
                            <HistoryIcon className="h-12 w-12 text-muted-foreground opacity-50" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2">No History Records Found</h3>
                          <p className="text-sm text-muted-foreground">There are no medical records matching your filters.</p>
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="absolute left-5 top-6 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 via-primary/30 to-transparent" />
                          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                            {filteredHistory.map((record, index) => (
                              <div key={record.enccode} className="relative flex gap-4 group">
                                {/* Enhanced Timeline Dot */}
                                <div className="relative z-10 flex-shrink-0">
                                  <div className={cn(
                                    "p-2 rounded-xl shadow-md transition-all duration-200",
                                    "group-hover:scale-105 group-hover:shadow-lg",
                                    getRecordTypeColor(record)
                                  )}>
                                    {getRecordTypeIcon(record)}
                                  </div>
                                </div>

                                {/* Enhanced Content Card */}
                                <div className="flex-1 pb-3">
                                  <div className={cn(
                                    "border rounded-xl p-4 transition-all duration-200 bg-card",
                                    "hover:shadow-lg hover:border-primary/50"
                                  )}>
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1.5">
                                          <h4 className="font-bold text-base">{getAdmissionType(record)}</h4>
                                          {getStatusBadge(record.admstat)}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                          <Clock className="h-4 w-4" />
                                          {record.admdate && (
                                            <span>Admitted: {formatDateTime(record.admdate, record.admtime)}</span>
                                          )}
                                          {record.disdate && (
                                            <>
                                              <ArrowRight className="h-3 w-3" />
                                              <span>Discharged: {formatDateTime(record.disdate, record.distime)}</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Main Details */}
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                      <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                          <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs text-muted-foreground">Case Number</p>
                                            <p className="font-semibold truncate">{record.casenum || 'N/A'}</p>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                          <Activity className="h-4 w-4 text-muted-foreground mt-0.5" />
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs text-muted-foreground">Encounter Code</p>
                                            <p className="font-mono text-xs font-semibold truncate">{record.enccode}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Diagnosis & Treatment */}
                                    {(record.admtxt || record.diagfin || record.diagcode) && (
                                      <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                        <div className="flex items-start gap-2 mb-2">
                                          <Stethoscope className="h-4 w-4 text-amber-700 dark:text-amber-400 mt-0.5" />
                                          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                                            Diagnosis Information
                                          </p>
                                        </div>
                                        {record.admtxt && (
                                          <div className="mb-2">
                                            <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">Admission Text:</p>
                                            <p className="text-sm text-amber-900 dark:text-amber-200">{record.admtxt}</p>
                                          </div>
                                        )}
                                        {record.diagcode && (
                                          <div className="mb-2">
                                            <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">Diagnosis Code:</p>
                                            <Badge variant="outline" className="font-mono">{record.diagcode}</Badge>
                                          </div>
                                        )}
                                        {record.diagfin && (
                                          <div>
                                            <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">Final Diagnosis:</p>
                                            <p className="text-sm text-amber-900 dark:text-amber-200">{record.diagfin}</p>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Treatment */}
                                    {record.treatment && (
                                      <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                                        <div className="flex items-start gap-2 mb-2">
                                          <Pill className="h-4 w-4 text-purple-700 dark:text-purple-400 mt-0.5" />
                                          <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                                            Treatment
                                          </p>
                                        </div>
                                        <p className="text-sm text-purple-900 dark:text-purple-200">{record.treatment}</p>
                                      </div>
                                    )}

                                    {/* Encounter Details */}
                                    {(record.encounter_casetype || record.encounter_cf4attendprov || record.encounter_date || record.encounter_toecode) && (
                                      <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                        <div className="flex items-start gap-2 mb-3">
                                          <Activity className="h-4 w-4 text-blue-700 dark:text-blue-400 mt-0.5" />
                                          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                                            Encounter Details
                                          </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                          {record.encounter_date && (
                                            <div>
                                              <p className="text-xs text-blue-600 dark:text-blue-500 font-medium">Date & Time</p>
                                              <p className="text-sm font-semibold">{formatDateTime(record.encounter_date, record.encounter_time)}</p>
                                            </div>
                                          )}
                                          {record.encounter_casetype && (
                                            <div>
                                              <p className="text-xs text-blue-600 dark:text-blue-500 font-medium">Case Type</p>
                                              <Badge variant="secondary">{record.encounter_casetype}</Badge>
                                            </div>
                                          )}
                                          {record.encounter_toecode && (
                                            <div>
                                              <p className="text-xs text-blue-600 dark:text-blue-500 font-medium">Type</p>
                                              <Badge variant="secondary">{record.encounter_toecode}</Badge>
                                            </div>
                                          )}
                                          {record.encounter_cf4attendprov && (
                                            <div>
                                              <p className="text-xs text-blue-600 dark:text-blue-500 font-medium">Provider</p>
                                              <p className="text-sm font-semibold">{record.encounter_cf4attendprov}</p>
                                            </div>
                                          )}
                                        </div>
                                        {(record.encounter_sopcode1 || record.encounter_sopcode2 || record.encounter_sopcode3) && (
                                          <div className="mt-3">
                                            <p className="text-xs text-blue-600 dark:text-blue-500 font-medium mb-1">Service Codes</p>
                                            <div className="flex flex-wrap gap-1">
                                              {[record.encounter_sopcode1, record.encounter_sopcode2, record.encounter_sopcode3]
                                                .filter(Boolean)
                                                .map((code, i) => (
                                                  <Badge key={i} variant="outline" className="text-xs">{code}</Badge>
                                                ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Notes */}
                                    {(record.admnotes || record.disnotes) && (
                                      <div className="p-3 bg-muted/50 border rounded-lg space-y-2">
                                        {record.admnotes && (
                                          <div>
                                            <div className="flex items-center gap-2 mb-1">
                                              <FileText className="h-3 w-3 text-muted-foreground" />
                                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                Admission Notes
                                              </p>
                                            </div>
                                            <p className="text-sm leading-relaxed">{record.admnotes}</p>
                                          </div>
                                        )}
                                        {record.disnotes && (
                                          <div>
                                            <div className="flex items-center gap-2 mb-1">
                                              <FileText className="h-3 w-3 text-muted-foreground" />
                                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                                Discharge Notes
                                              </p>
                                            </div>
                                            <p className="text-sm leading-relaxed">{record.disnotes}</p>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Footer */}
                                    {record.entryby && (
                                      <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                          <UserCircle className="h-4 w-4" />
                                          <span>Recorded by: <span className="font-semibold">{record.entryby}</span></span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="table" className="mt-0">
                      {/* Table */}
                      {isLoadingHistory ? (
                        <div className="flex flex-col items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                          <p className="text-sm text-muted-foreground">Loading patient history...</p>
                        </div>
                      ) : filteredHistory.length === 0 ? (
                        <div className="text-center py-12 border border-dashed rounded-lg">
                          <div className="bg-muted rounded-full p-4 w-fit mx-auto mb-3">
                            <HistoryIcon className="h-12 w-12 text-muted-foreground opacity-50" />
                          </div>
                          <h3 className="text-lg font-semibold mb-2">No History Records Found</h3>
                          <p className="text-sm text-muted-foreground">There are no medical records matching your filters.</p>
                        </div>
                      ) : (
                        <div className="border rounded-lg overflow-hidden shadow-sm">
                          <div className="max-h-[600px] overflow-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/50">
                                  <TableHead className="font-bold">Case #</TableHead>
                                  <TableHead className="font-bold">Admission</TableHead>
                                  <TableHead className="font-bold">Discharge</TableHead>
                                  <TableHead className="font-bold">Diagnosis</TableHead>
                                  <TableHead className="font-bold">Case Type</TableHead>
                                  <TableHead className="font-bold">Provider</TableHead>
                                  <TableHead className="font-bold">Status</TableHead>
                                  <TableHead className="font-bold">Notes</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredHistory.map((record) => (
                                  <TableRow 
                                    key={record.enccode}
                                    className="hover:bg-muted/30 transition-colors"
                                  >
                                    <TableCell className="font-semibold">
                                      {record.casenum || <span className="text-muted-foreground">N/A</span>}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {formatDateTime(record.admdate, record.admtime)}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {record.disdate ? (
                                        formatDateTime(record.disdate, record.distime)
                                      ) : (
                                        <Badge variant="default" className="bg-orange-500">
                                          Active
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="max-w-xs">
                                        {record.admtxt || record.diagfin || record.diagcode ? (
                                          <div className="truncate" title={record.admtxt || record.diagfin || record.diagcode}>
                                            {record.admtxt || record.diagfin || record.diagcode}
                                          </div>
                                        ) : (
                                          <span className="text-muted-foreground">N/A</span>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {record.encounter_casetype ? (
                                        <Badge variant="outline">{record.encounter_casetype}</Badge>
                                      ) : (
                                        <span className="text-muted-foreground text-sm">-</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="max-w-[150px] truncate text-sm" title={record.encounter_cf4attendprov || '-'}>
                                        {record.encounter_cf4attendprov || <span className="text-muted-foreground">-</span>}
                                      </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(record.admstat)}</TableCell>
                                    <TableCell>
                                      <div className="max-w-xs">
                                        {record.admnotes || record.disnotes ? (
                                          <div className="truncate text-sm" title={record.admnotes || record.disnotes}>
                                            {record.admnotes || record.disnotes}
                                          </div>
                                        ) : (
                                          <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Enhanced Empty State */}
        {!selectedPatient && (
          <div className="col-span-12">
            <Card className="border border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl"></div>
                  <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 rounded-full p-6">
                    <Search className="h-14 w-14 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2">No Patient Selected</h3>
                <p className="text-muted-foreground text-center max-w-lg mb-4">
                  Search for a patient using the search bar above to view their complete medical history,
                  interactions, and tagging information.
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <User className="h-4 w-4 text-blue-500" />
                    </div>
                    <span>Patient Info</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <HistoryIcon className="h-4 w-4 text-purple-500" />
                    </div>
                    <span>Medical History</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Activity className="h-4 w-4 text-emerald-500" />
                    </div>
                    <span>Timeline View</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientTagging;
