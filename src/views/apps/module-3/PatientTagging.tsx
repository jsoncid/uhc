import { useState, useMemo } from 'react';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Badge } from 'src/components/ui/badge';
import { Separator } from 'src/components/ui/separator';
import {
  Search,
  User,
  Activity,
  History as HistoryIcon,
  Link as LinkIcon,
  Database,
  Loader2,
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

      <div className="grid grid-cols-12 gap-4 mt-4">
        {/* MySQL Search Panel (Hospital Database) */}
        <div className="col-span-12 lg:col-span-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5 text-primary" />
                Search Hospital Database (MySQL)
              </CardTitle>
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
        </div>

        {/* Supabase Search Panel (Manually Entered Patients) */}
        <div className="col-span-12 lg:col-span-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Search Manually Entered Patients
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by patient name..."
                  value={supabaseSearchTerm}
                  onChange={(e) => setSupabaseSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchSupabase()}
                />
                <Button onClick={handleSearchSupabase} disabled={isSearchingSupabase}>
                  {isSearchingSupabase ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Supabase Search Results */}
              {supabaseSearchResults.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">
                      {supabaseSearchResults.length} patient(s) found
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSupabaseSearchResults([])}
                    >
                      Clear
                    </Button>
                  </div>
                  {supabaseSearchResults.map((patient) => (
                    <Card key={patient.id} className="border-muted">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold truncate">
                                {patient.last_name}, {patient.first_name} {patient.middle_name}
                              </p>
                              {patient.hpercode ? (
                                <Badge variant="default" className="text-xs">
                                  <Database className="h-3 w-3 mr-1" />
                                  Linked
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Not Linked
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="capitalize">{patient.sex}</span>
                              <span>•</span>
                              <span>{patient.birth_date}</span>
                            </div>
                            {patient.hpercode && (
                              <p className="text-xs text-muted-foreground mt-1 font-mono">
                                HPERCODE: {patient.hpercode}
                              </p>
                            )}
                          </div>
                          {!patient.hpercode && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenLinkDialog(patient)}
                            >
                              <LinkIcon className="h-4 w-4 mr-1" />
                              Link
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {isSearchingSupabase && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12">
          <Separator />
        </div>

        {/* Selected Patient Details */}
        {selectedPatient && (
          <>
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
          </>
        )}

        {/* Empty State */}
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