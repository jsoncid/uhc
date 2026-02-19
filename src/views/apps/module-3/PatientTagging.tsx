import { useState } from 'react';
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
} from 'lucide-react';
import patientService, { PatientProfile, PatientHistory } from 'src/services/patientService';

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

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'A': 'default', // Active/Admitted
      'D': 'secondary', // Discharged
      'C': 'destructive', // Cancelled
      'I': 'default', // Inpatient
    };

    const labels: Record<string, string> = {
      'A': 'Admitted',
      'D': 'Discharged',
      'C': 'Cancelled',
      'I': 'Inpatient',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || status}
      </Badge>
    );
  };

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
        {/* Search Panel */}
        <div className="col-span-12">
          <CardBox>
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="search" className="mb-2 block">
                    Search Patient
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="search"
                      placeholder="Enter patient name or HPERCODE..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button onClick={handleSearch} disabled={isSearching}>
                      {isSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      <span className="ml-2">Search</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4 border rounded-lg">
                  <div className="h-[300px] overflow-y-auto">
                    {searchResults.map((patient) => (
                      <div
                        key={patient.id}
                        className="p-4 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onClick={() => handleSelectPatient(patient)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-full">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {patient.first_name} {patient.middle_name} {patient.last_name} {patient.ext_name}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {patient.birth_date}
                                </span>
                                <span>{patient.sex}</span>
                                {patient.hpercode && <span>HPERCODE: {patient.hpercode}</span>}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardBox>
        </div>

        {/* Selected Patient Details */}
        {selectedPatient && (
          <>
            {/* Patient Information Card */}
            <div className="col-span-12 lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Full Name</Label>
                    <p className="font-medium">
                      {selectedPatient.first_name} {selectedPatient.middle_name}{' '}
                      {selectedPatient.last_name} {selectedPatient.ext_name}
                    </p>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Birth Date</Label>
                      <p className="font-medium">{selectedPatient.birth_date}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Sex</Label>
                      <p className="font-medium">{selectedPatient.sex}</p>
                    </div>
                  </div>

                  {selectedPatient.hpercode && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-muted-foreground">HPERCODE</Label>
                        <p className="font-medium font-mono">{selectedPatient.hpercode}</p>
                      </div>
                    </>
                  )}

                  {selectedPatient.facility_code && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-muted-foreground">Facility</Label>
                        <p className="font-medium">{selectedPatient.facility_code}</p>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div>
                    <Label className="text-muted-foreground">Address</Label>
                    <p className="text-sm">
                      {selectedPatient.street && `${selectedPatient.street}, `}
                      {selectedPatient.brgy_name && `${selectedPatient.brgy_name}, `}
                      {selectedPatient.city_name && `${selectedPatient.city_name}, `}
                      {selectedPatient.province_name && `${selectedPatient.province_name}, `}
                      {selectedPatient.region_name}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Patient History */}
            <div className="col-span-12 lg:col-span-9">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HistoryIcon className="h-5 w-5" />
                    Complete Patient History
                  </CardTitle>
                  <CardDescription>All interactions, consultations, and medical records for this patient</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="timeline" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="timeline">Timeline View</TabsTrigger>
                      <TabsTrigger value="table">Table View</TabsTrigger>
                    </TabsList>

                    <TabsContent value="timeline" className="mt-4">
                      {/* Filters */}
                      <div className="flex gap-4 mb-4">
                        <div className="flex-1">
                          <Label htmlFor="type-filter" className="mb-2 block text-sm">
                            Filter by Type
                          </Label>
                          <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger id="type-filter">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Records</SelectItem>
                              {uniqueTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Timeline */}
                      {isLoadingHistory ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : filteredHistory.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <HistoryIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p>No history records found</p>
                        </div>
                      ) : (
                        <div className="h-[600px] overflow-y-auto">
                          <div className="space-y-4">
                            {filteredHistory.map((record, index) => (
                              <div key={record.enccode} className="flex gap-4">
                                {/* Timeline line */}
                                <div className="flex flex-col items-center">
                                  <div className="bg-primary p-2 rounded-full">
                                    {record.disdate ? <FileText className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                                  </div>
                                  {index < filteredHistory.length - 1 && (
                                    <div className="w-0.5 h-full bg-border mt-2" />
                                  )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 pb-8">
                                  <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <p className="font-medium">{getAdmissionType(record)}</p>
                                          {getStatusBadge(record.admstat)}
                                        </div>
                                        <div className="text-sm space-y-1 mt-2">
                                          <div className="flex gap-2">
                                            <span className="font-medium">Case #:</span>
                                            <span>{record.casenum || 'N/A'}</span>
                                          </div>
                                          <div className="flex gap-2">
                                            <span className="font-medium">Encounter Code:</span>
                                            <span className="font-mono text-xs">{record.enccode}</span>
                                          </div>
                                          {record.admtxt && (
                                            <div className="flex gap-2">
                                              <span className="font-medium">Admission Text:</span>
                                              <span className="whitespace-pre-wrap">{record.admtxt}</span>
                                            </div>
                                          )}
                                          {record.diagcode && (
                                            <div className="flex gap-2">
                                              <span className="font-medium">Diagnosis Code:</span>
                                              <span>{record.diagcode}</span>
                                            </div>
                                          )}
                                          {record.diagfin && (
                                            <div className="flex gap-2">
                                              <span className="font-medium">Final Diagnosis:</span>
                                              <span>{record.diagfin}</span>
                                            </div>
                                          )}
                                          {record.treatment && (
                                            <div className="flex gap-2">
                                              <span className="font-medium">Treatment:</span>
                                              <span>{record.treatment}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Encounter Information */}
                                    {(record.encounter_casetype || record.encounter_cf4attendprov || record.encounter_date || record.encounter_toecode) && (
                                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md">
                                        <p className="text-xs font-semibold mb-2 text-blue-700 dark:text-blue-400">Encounter Details</p>
                                        <div className="text-sm space-y-1">
                                          {record.encounter_date && (
                                            <div className="flex gap-2">
                                              <span className="font-medium text-xs">Encounter Date:</span>
                                              <span className="text-xs">{formatDateTime(record.encounter_date, record.encounter_time)}</span>
                                            </div>
                                          )}
                                          {record.encounter_casetype && (
                                            <div className="flex gap-2">
                                              <span className="font-medium text-xs">Case Type:</span>
                                              <span className="text-xs">{record.encounter_casetype}</span>
                                            </div>
                                          )}
                                          {record.encounter_toecode && (
                                            <div className="flex gap-2">
                                              <span className="font-medium text-xs">Encounter Type:</span>
                                              <span className="text-xs">{record.encounter_toecode}</span>
                                            </div>
                                          )}
                                          {record.encounter_cf4attendprov && (
                                            <div className="flex gap-2">
                                              <span className="font-medium text-xs">Attending Provider:</span>
                                              <span className="text-xs">{record.encounter_cf4attendprov}</span>
                                            </div>
                                          )}
                                          {(record.encounter_sopcode1 || record.encounter_sopcode2 || record.encounter_sopcode3) && (
                                            <div className="flex gap-2">
                                              <span className="font-medium text-xs">Service Codes:</span>
                                              <span className="text-xs">
                                                {[record.encounter_sopcode1, record.encounter_sopcode2, record.encounter_sopcode3]
                                                  .filter(Boolean)
                                                  .join(', ')}
                                              </span>
                                            </div>
                                          )}
                                          {record.encounter_patinform && (
                                            <div className="flex gap-2">
                                              <span className="font-medium text-xs">Informant:</span>
                                              <span className="text-xs">{record.encounter_patinform}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}

                                    {(record.admnotes || record.disnotes) && (
                                      <div className="mt-3 p-3 bg-muted rounded-md space-y-2">
                                        {record.admnotes && (
                                          <div>
                                            <p className="text-xs font-medium mb-1">Admission Notes:</p>
                                            <p className="text-sm">{record.admnotes}</p>
                                          </div>
                                        )}
                                        {record.disnotes && (
                                          <div>
                                            <p className="text-xs font-medium mb-1">Discharge Notes:</p>
                                            <p className="text-sm">{record.disnotes}</p>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                                      {record.admdate && (
                                        <>
                                          <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            Admitted: {formatDateTime(record.admdate, record.admtime)}
                                          </span>
                                        </>
                                      )}
                                      {record.disdate && (
                                        <>
                                          <span>•</span>
                                          <span className="flex items-center gap-1">
                                            Discharged: {formatDateTime(record.disdate, record.distime)}
                                          </span>
                                        </>
                                      )}
                                      {record.entryby && (
                                        <>
                                          <span>•</span>
                                          <span>By: {record.entryby}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="table" className="mt-4">
                      {/* Filters */}
                      <div className="flex gap-4 mb-4">
                        <div className="flex-1">
                          <Label htmlFor="type-filter-table" className="mb-2 block text-sm">
                            Filter by Type
                          </Label>
                          <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger id="type-filter-table">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Records</SelectItem>
                              {uniqueTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Table */}
                      {isLoadingHistory ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="border rounded-lg">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Case #</TableHead>
                                <TableHead>Admission Date</TableHead>
                                <TableHead>Discharge Date</TableHead>
                                <TableHead>Diagnosis</TableHead>
                                <TableHead>Case Type</TableHead>
                                <TableHead>Provider</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Notes</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredHistory.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    No history records found
                                  </TableCell>
                                </TableRow>
                              ) : (
                                filteredHistory.map((record) => (
                                  <TableRow key={record.enccode}>
                                    <TableCell className="font-medium">
                                      {record.casenum || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                      {formatDateTime(record.admdate, record.admtime)}
                                    </TableCell>
                                    <TableCell>
                                      {record.disdate ? formatDateTime(record.disdate, record.distime) : 'Active'}
                                    </TableCell>
                                    <TableCell>
                                      <div className="max-w-xs truncate" title={record.admtxt || record.diagfin || record.diagcode || 'N/A'}>
                                        {record.admtxt || record.diagfin || record.diagcode || 'N/A'}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="max-w-[120px] truncate" title={record.encounter_casetype || '-'}>
                                        {record.encounter_casetype || '-'}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="max-w-[120px] truncate" title={record.encounter_cf4attendprov || '-'}>
                                        {record.encounter_cf4attendprov || '-'}
                                      </div>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(record.admstat)}</TableCell>
                                    <TableCell>
                                      <div className="max-w-xs truncate" title={record.admnotes || record.disnotes || '-'}>
                                        {record.admnotes || record.disnotes || '-'}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Empty State */}
        {!selectedPatient && (
          <div className="col-span-12">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="bg-muted rounded-full p-6 mb-4">
                  <Search className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Patient Selected</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Search for a patient using the search bar above to view their complete medical history
                  and interactions
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientTagging;
