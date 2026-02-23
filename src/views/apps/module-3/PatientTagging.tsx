import { useState, useMemo } from 'react';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Badge } from 'src/components/ui/badge';
import { Separator } from 'src/components/ui/separator';
import { Alert, AlertDescription } from 'src/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import {
  Search,
  User,
  Activity,
  History as HistoryIcon,
  Link as LinkIcon,
  Database,
  Loader2,
  Info,
  UserPlus,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import patientService, { PatientProfile, PatientHistory } from 'src/services/patientService';
import PatientSearchPanel from './components/PatientSearchPanel';
import PatientInfoCard from './components/PatientInfoCard';
import PatientHistoryTabs from './components/PatientHistoryTabs';
import PatientLinkingDialog from './components/PatientLinkingDialog';

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
  // Active tab
  const [activeTab, setActiveTab] = useState<'view' | 'link'>('view');

  // MySQL Search state (existing patients from hospital database)
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PatientProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);

  // Supabase Search state (manually entered patients)
  const [supabaseSearchTerm, setSupabaseSearchTerm] = useState('');
  const [supabaseSearchResults, setSupabaseSearchResults] = useState<any[]>([]);
  const [isSearchingSupabase, setIsSearchingSupabase] = useState(false);
  
  // Linking dialog state
  const [isLinkingDialogOpen, setIsLinkingDialogOpen] = useState(false);
  const [patientToLink, setPatientToLink] = useState<any>(null);

  // Patient history state
  const [patientHistory, setPatientHistory] = useState<PatientHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Filter state
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');

  /* ------------------------------------------------------------------ */
  /*  Search Functions                                                  */
  /* ------------------------------------------------------------------ */

  // Search MySQL patients (hospital database)
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

  // Search Supabase patients (manually entered)
  const handleSearchSupabase = async () => {
    if (!supabaseSearchTerm.trim()) return;

    setIsSearchingSupabase(true);
    try {
      const result = await patientService.searchSupabasePatients(supabaseSearchTerm, { limit: 10 });
      if (result.success) {
        setSupabaseSearchResults(result.data);
      }
    } catch (error) {
      console.error('Error searching Supabase patients:', error);
    } finally {
      setIsSearchingSupabase(false);
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

  const handleOpenLinkDialog = (patient: any) => {
    setPatientToLink(patient);
    setIsLinkingDialogOpen(true);
  };

  const handleLinkSuccess = async () => {
    // Refresh the Supabase search results to show updated link status
    if (supabaseSearchTerm) {
      await handleSearchSupabase();
    }
    // Clear selected patient and refresh if they picked one
    if (patientToLink) {
      // Optionally reload the patient to show updated info
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

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */

  return (
    <div className="w-full">
      <BreadcrumbComp items={BCrumb} title="Patient Tagging" />

      {/* Overview Card */}
      <Card className="mt-4 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Patient Repository Management
          </CardTitle>
          <CardDescription className="text-base">
            View patient medical history from the hospital database or link manually entered patients
            with existing hospital records to access their complete medical history.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'view' | 'link')} className="mt-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="view" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            View Patient History
          </TabsTrigger>
          <TabsTrigger value="link" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Link Patients
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: View Patient History */}
        <TabsContent value="view" className="mt-6 space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Search for patients who are already in the hospital database (MySQL) to view their complete
              medical history, admissions, and encounters.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5 text-primary" />
                Search Hospital Database
              </CardTitle>
              <CardDescription>
                Enter patient name or HPERCODE to find existing hospital records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PatientSearchPanel
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                onSearch={handleSearch}
                isSearching={isSearching}
                searchResults={searchResults}
                onSelectPatient={handleSelectPatient}
                onClearResults={() => setSearchResults([])}
              />
            </CardContent>
          </Card>

          {/* Selected Patient Details */}
          {selectedPatient && (
            <div className="grid grid-cols-12 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Patient Information Card */}
              <div className="col-span-12 lg:col-span-4">
                <PatientInfoCard
                  patient={selectedPatient}
                  recentVisit={patientStats.recentVisit}
                />
              </div>

              {/* Patient History */}
              <div className="col-span-12 lg:col-span-8">
                <PatientHistoryTabs
                  history={filteredHistory}
                  isLoading={isLoadingHistory}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  typeFilter={typeFilter}
                  onTypeFilterChange={setTypeFilter}
                />
              </div>
            </div>
          )}

          {/* Empty State for View Tab */}
          {!selectedPatient && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl"></div>
                  <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 rounded-full p-6">
                    <Search className="h-14 w-14 text-primary" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2">No Patient Selected</h3>
                <p className="text-muted-foreground text-center max-w-lg mb-6">
                  Search for a patient above to view their complete medical history, admissions, and
                  hospital encounters.
                </p>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <User className="h-5 w-5 text-blue-500" />
                    </div>
                    <span className="text-muted-foreground">Patient Info</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-purple-500/10 rounded-lg">
                      <HistoryIcon className="h-5 w-5 text-purple-500" />
                    </div>
                    <span className="text-muted-foreground">Medical History</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-emerald-500/10 rounded-lg">
                      <Activity className="h-5 w-5 text-emerald-500" />
                    </div>
                    <span className="text-muted-foreground">Timeline View</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB 2: Link Patients */}
        <TabsContent value="link" className="mt-6 space-y-4">
          <Alert className="border-primary/30 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-foreground">
              <strong>Link manually entered patients with hospital records:</strong> If you created a
              patient profile manually and want to connect it with an existing hospital record, search
              for your manual entry below and click "Link" to connect it with the hospital database.
            </AlertDescription>
          </Alert>

          {/* How it Works */}
          <Card className="border-muted">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4" />
                How Patient Linking Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-blue-500">1</span>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm">Search Manual Entry</p>
                    <p className="text-xs text-muted-foreground">Find your manually entered patient</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground mt-3" />
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-purple-500">2</span>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm">Click Link Button</p>
                    <p className="text-xs text-muted-foreground">Open the linking dialog</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground mt-3" />
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-emerald-500">3</span>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm">Search & Connect</p>
                    <p className="text-xs text-muted-foreground">Find matching hospital record</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground mt-3" />
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-amber-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm">Done!</p>
                    <p className="text-xs text-muted-foreground">Patient now has full history access</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Manually Entered Patients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserPlus className="h-5 w-5 text-primary" />
                Search Manually Entered Patients
              </CardTitle>
              <CardDescription>
                Find patients that were created manually (not from hospital database)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter patient name to search..."
                    value={supabaseSearchTerm}
                    onChange={(e) => setSupabaseSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchSupabase()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearchSupabase} disabled={isSearchingSupabase} size="lg">
                  {isSearchingSupabase ? (
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

              {/* Supabase Search Results */}
              {supabaseSearchResults.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      Found {supabaseSearchResults.length} patient(s)
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSupabaseSearchResults([]);
                        setSupabaseSearchTerm('');
                      }}
                    >
                      Clear Results
                    </Button>
                  </div>
                  <Separator />
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {supabaseSearchResults.map((patient) => (
                      <Card
                        key={patient.id}
                        className={`border transition-all hover:shadow-md ${
                          patient.hpercode ? 'border-green-200 bg-green-50/50' : 'border-amber-200 bg-amber-50/50'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div
                                className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                                  patient.hpercode
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-amber-100 text-amber-600'
                                }`}
                              >
                                <User className="h-6 w-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <p className="font-semibold text-lg truncate">
                                    {patient.last_name}, {patient.first_name} {patient.middle_name}
                                  </p>
                                  {patient.hpercode ? (
                                    <Badge className="bg-green-500 hover:bg-green-600">
                                      <CheckCircle2 className="h-3 w-3 mr-1" />
                                      Linked
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="border-amber-500 text-amber-700">
                                      Not Linked
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                                  <span className="capitalize">{patient.sex}</span>
                                  <span>•</span>
                                  <span>{patient.birth_date}</span>
                                </div>
                                {patient.hpercode ? (
                                  <div className="flex items-center gap-2 text-xs">
                                    <Badge variant="secondary" className="font-mono">
                                      HPERCODE: {patient.hpercode}
                                    </Badge>
                                    {patient.facility_code && (
                                      <Badge variant="secondary" className="font-mono">
                                        Facility: {patient.facility_code}
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-xs text-muted-foreground italic">
                                    Not yet connected to hospital records
                                  </p>
                                )}
                              </div>
                            </div>
                            {!patient.hpercode && (
                              <Button
                                size="default"
                                onClick={() => handleOpenLinkDialog(patient)}
                                className="flex-shrink-0"
                              >
                                <LinkIcon className="h-4 w-4 mr-2" />
                                Link to Hospital
                              </Button>
                            )}
                            {patient.hpercode && (
                              <Button
                                size="default"
                                variant="outline"
                                onClick={() => {
                                  // Switch to view tab and search for this patient
                                  setActiveTab('view');
                                  setSearchTerm(patient.hpercode);
                                  setTimeout(() => handleSearch(), 100);
                                }}
                                className="flex-shrink-0"
                              >
                                <HistoryIcon className="h-4 w-4 mr-2" />
                                View History
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isSearchingSupabase && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                  <p className="text-sm text-muted-foreground">Searching for patients...</p>
                </div>
              )}

              {/* Empty State */}
              {!isSearchingSupabase && supabaseSearchResults.length === 0 && supabaseSearchTerm && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-semibold mb-1">No patients found</p>
                  <p className="text-sm text-muted-foreground">
                    Try searching with a different name or check the Patient Profiling page to create a new
                    patient.
                  </p>
                </div>
              )}

              {/* Initial Empty State */}
              {!supabaseSearchTerm && supabaseSearchResults.length === 0 && !isSearchingSupabase && (
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <UserPlus className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-semibold mb-1">Search for Manually Entered Patients</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Enter a patient name in the search box above to find patients that were manually entered
                    and link them with existing hospital records.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Patient Linking Dialog */}
      <PatientLinkingDialog
        open={isLinkingDialogOpen}
        onOpenChange={setIsLinkingDialogOpen}
        supabasePatient={patientToLink}
        onLinkSuccess={handleLinkSuccess}
      />
    </div>
  );
};

export default PatientTagging;