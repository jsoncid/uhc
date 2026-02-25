import { useState, useMemo, useEffect } from 'react';
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
  Edit,
  RefreshCw,
  Trash2,
  Plus,
} from 'lucide-react';
import patientService, { PatientProfileWithLocations as PatientProfile, PatientHistory } from 'src/services/patientService';
import PatientSearchPanel, { PatientSearchResultProfile } from './components/PatientSearchPanel';
import PatientInfoCard from './components/PatientInfoCard';
import PatientHistoryTabs from './components/PatientHistoryTabs';
import PatientLinkingDialog from './components/PatientLinkingDialog';
import { ConfirmDialog } from 'src/components/ui/confirm-dialog';
import {
  getPatientSearchBuckets,
  getPatientSearchSummaries,
  getPatientSearchTotalMatches,
  PatientDatabaseSummary,
} from './utils/patientSearchResultHelpers';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const FACILITY_NAME_BY_CODE: Record<string, string> = {
  '0005027': 'AGUSAN DEL NORTE PROVINCIAL HOSPITAL',
  '0005028': 'NASIPIT DISTRICT HOSPITAL',
};

const PatientTagging = () => {
  // Active tab
  const [activeTab, setActiveTab] = useState<'view' | 'link' | 'linked'>('link');

  // MySQL Search state (existing patients from hospital database)
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PatientSearchResultProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResultProfile | null>(null);
  const [searchMeta, setSearchMeta] = useState<{
    totalMatches: number;
    databaseSummaries: PatientDatabaseSummary[];
  }>({
    totalMatches: 0,
    databaseSummaries: [],
  });

  // Supabase Search state (manually entered patients - unlinked)
  const [supabaseSearchTerm, setSupabaseSearchTerm] = useState('');
  const [supabaseSearchResults, setSupabaseSearchResults] = useState<any[]>([]);
  const [isSearchingSupabase, setIsSearchingSupabase] = useState(false);

  // Linked patients search state
  const [linkedSearchTerm, setLinkedSearchTerm] = useState('');
  const [linkedPatients, setLinkedPatients] = useState<any[]>([]);
  const [isSearchingLinked, setIsSearchingLinked] = useState(false);
  const [isLoadingLinked, setIsLoadingLinked] = useState(false);
  const [linkedPage, setLinkedPage] = useState(1);
  const [linkedTotal, setLinkedTotal] = useState(0);

  // Linking dialog state
  const [isLinkingDialogOpen, setIsLinkingDialogOpen] = useState(false);
  const [patientToLink, setPatientToLink] = useState<any>(null);

  // Unlink confirmation dialog state
  const [isUnlinkDialogOpen, setIsUnlinkDialogOpen] = useState(false);
  const [repositoryToUnlink, setRepositoryToUnlink] = useState<{ id: string; hpercode: string; patientName: string } | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);

  // Patient history state
  const [patientHistory, setPatientHistory] = useState<PatientHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Filter state
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');

  /* ------------------------------------------------------------------ */
  /*  Effects                                                           */
  /* ------------------------------------------------------------------ */

  // Load linked patients when switching to linked tab
  useEffect(() => {
    if (activeTab === 'linked' && linkedPatients.length === 0 && !linkedSearchTerm) {
      loadAllLinkedPatients();
    }
  }, [activeTab]);

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
        const buckets = getPatientSearchBuckets(result);
        const combined: PatientSearchResultProfile[] = buckets.flatMap((bucket) => {
          const displayName = bucket.metadata.description || bucket.metadata.db_name;
          return bucket.data.map((patient) => ({
            ...patient,
            facility_display_name:
              FACILITY_NAME_BY_CODE[patient.facility_code || ''] || displayName,
            sourceDatabase: bucket.metadata.db_name,
          }));
        });

        setSearchResults(combined);
        setSearchMeta({
          totalMatches: getPatientSearchTotalMatches(result, buckets),
          databaseSummaries: getPatientSearchSummaries(buckets),
        });
      } else {
        setSearchMeta({ totalMatches: 0, databaseSummaries: [] });
      }
    } catch (error) {
      console.error('Error searching patients:', error);
      setSearchMeta({ totalMatches: 0, databaseSummaries: [] });
    } finally {
      setIsSearching(false);
    }
  };

  // Search Supabase patients (manually entered - unlinked)
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

  // Load all linked patients (paginated)
  const loadAllLinkedPatients = async (page = 1) => {
    setIsLoadingLinked(true);
    try {
      const result = await patientService.getSupabasePatients(page, 20);
      if (result.success) {
        // Filter only linked patients with active status (true or null for backwards compatibility)
        const linked = result.data.filter((patient: any) => {
          const activeRepos = patient.patient_repository?.filter(
            (repo: any) => repo.hpercode != null && (repo.status === true || repo.status === null || repo.status === undefined)
          );
          return activeRepos && activeRepos.length > 0;
        }).map((patient: any) => ({
          ...patient,
          // Filter patient_repository to only include active ones
          patient_repository: patient.patient_repository?.filter(
            (repo: any) => repo.hpercode != null && (repo.status === true || repo.status === null || repo.status === undefined)
          ) || []
        }));
        setLinkedPatients(linked);
        setLinkedPage(page);

        // Calculate total linked patients
        const totalLinked = linked.length;
        setLinkedTotal(totalLinked);
      }
    } catch (error) {
      console.error('Error loading linked patients:', error);
    } finally {
      setIsLoadingLinked(false);
    }
  };

  // Search linked patients
  const handleSearchLinked = async () => {
    if (!linkedSearchTerm.trim()) {
      // If search is empty, load all linked patients
      loadAllLinkedPatients();
      return;
    }

    setIsSearchingLinked(true);
    try {
      // Load more patients to search through
      const allPatientsResult = await patientService.getSupabasePatients(1, 200);
      if (allPatientsResult.success) {
        const searchLower = linkedSearchTerm.toLowerCase();
        const linked = allPatientsResult.data.filter((patient: any) => {
          // Filter only active repositories
          const activeRepos = patient.patient_repository?.filter(
            (repo: any) => repo.hpercode != null && (repo.status === true || repo.status === null || repo.status === undefined)
          );
          if (!activeRepos || activeRepos.length === 0) return false;
          
          // Search in name
          const firstName = patient.first_name?.toLowerCase() || '';
          const middleName = patient.middle_name?.toLowerCase() || '';
          const lastName = patient.last_name?.toLowerCase() || '';
          const fullName = `${firstName} ${middleName} ${lastName}`.trim();
          
          // Search in any hpercode
          const hpercodeMatch = activeRepos.some(
            (repo: any) => repo.hpercode?.toLowerCase().includes(searchLower)
          );
          
          return fullName.includes(searchLower) || hpercodeMatch;
        }).map((patient: any) => ({
          ...patient,
          // Filter patient_repository to only include active ones
          patient_repository: patient.patient_repository?.filter(
            (repo: any) => repo.hpercode != null && (repo.status === true || repo.status === null || repo.status === undefined)
          ) || []
        }));
        setLinkedPatients(linked);
        setLinkedTotal(linked.length);
      }
    } catch (error) {
      console.error('Error searching linked patients:', error);
    } finally {
      setIsSearchingLinked(false);
    }
  };

  const handleSelectPatient = async (patient: PatientSearchResultProfile) => {
    setSelectedPatient(patient);
    setSearchResults([]);
    setSearchTerm('');
    setSearchMeta({ totalMatches: 0, databaseSummaries: [] });

    // Load patient history using hpercode
    if (patient.hpercode) {
      await loadPatientHistory(patient.hpercode, patient.sourceDatabase);
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
    // Refresh linked patients
    if (activeTab === 'linked') {
      if (linkedSearchTerm) {
        await handleSearchLinked();
      } else {
        await loadAllLinkedPatients(linkedPage);
      }
    }
  };

  const handleAddLink = (patient: any) => {
    // Open the linking dialog with the patient to add a new link
    setPatientToLink(patient);
    setIsLinkingDialogOpen(true);
  };

  const handleOpenUnlinkDialog = (repositoryId: string, hpercode: string, patientName: string) => {
    setRepositoryToUnlink({ id: repositoryId, hpercode, patientName });
    setIsUnlinkDialogOpen(true);
  };

  const handleUnlink = async () => {
    if (!repositoryToUnlink) return;

    setIsUnlinking(true);
    try {
      const result = await patientService.unlinkPatientRepository(repositoryToUnlink.id);
      if (result.success) {
        // Refresh the linked patients list
        if (linkedSearchTerm) {
          await handleSearchLinked();
        } else {
          await loadAllLinkedPatients(linkedPage);
        }
      } else {
        console.error('Failed to unlink:', result.message);
      }
    } catch (error) {
      console.error('Error unlinking patient:', error);
    } finally {
      setIsUnlinking(false);
      setIsUnlinkDialogOpen(false);
      setRepositoryToUnlink(null);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Data Loading Functions                                            */
  /* ------------------------------------------------------------------ */

  const loadPatientHistory = async (hpercode: string, database?: string) => {
    setIsLoadingHistory(true);
    try {
      const result = await patientService.getPatientHistory(hpercode, { database });
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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Activity className="h-7 w-7 text-primary" />
            </div>
            Patient Repository
          </h1>
          <p className="text-muted-foreground mt-2">
            View patient medical records, link manually entered patients with hospital database, and manage patient connections.
          </p>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'view' | 'link' | 'linked')} className="mt-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="link" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Link Patient
          </TabsTrigger>
          <TabsTrigger value="linked" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Linked
          </TabsTrigger>
          <TabsTrigger value="view" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            View History
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Link Patients */}
        <TabsContent value="link" className="mt-6 space-y-4">
          <Alert className="border-primary/30 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-foreground">
              Connect manually entered patient profiles with their hospital database records. Only unlinked patients will appear in search results.
            </AlertDescription>
          </Alert>

          {/* How it Works */}
          <Card className="border-muted">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4" />
                How to Link
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-blue-500">1</span>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm">Search Patient</p>
                    <p className="text-xs text-muted-foreground">Find unlinked profile</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground mt-3" />
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-purple-500">2</span>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm">Click Link</p>
                    <p className="text-xs text-muted-foreground">Open linking dialog</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground mt-3" />
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-emerald-500">3</span>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm">Match Record</p>
                    <p className="text-xs text-muted-foreground">Find hospital match</p>
                  </div>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground mt-3" />
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-amber-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm">Complete</p>
                    <p className="text-xs text-muted-foreground">Full access enabled</p>
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
                Unlinked Patients
              </CardTitle>
              <CardDescription>
                Find and link manually created patient profiles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by patient name..."
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
                        className="border-amber-200 bg-amber-50/50 border transition-all hover:shadow-md"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-amber-100 text-amber-600">
                                <User className="h-6 w-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <p className="font-semibold text-lg truncate">
                                    {patient.last_name}, {patient.first_name} {patient.middle_name}
                                  </p>
                                  <Badge variant="outline" className="border-amber-500 text-amber-700">
                                    Not Linked
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                                  <span className="capitalize">{patient.sex}</span>
                                  <span>•</span>
                                  <span>{patient.birth_date}</span>
                                </div>
                                <p className="text-xs text-muted-foreground italic">
                                  Ready to link with hospital database
                                </p>
                              </div>
                            </div>
                            <Button
                              size="default"
                              onClick={() => handleOpenLinkDialog(patient)}
                              className="flex-shrink-0"
                            >
                              <LinkIcon className="h-4 w-4 mr-2" />
                              Link to Hospital
                            </Button>
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
                  <p className="font-semibold mb-1">No Results Found</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    No unlinked patients matching "{supabaseSearchTerm}". The patient may not exist or is already linked.
                  </p>
                </div>
              )}

              {/* Initial Empty State */}
              {!supabaseSearchTerm && supabaseSearchResults.length === 0 && !isSearchingSupabase && (
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <UserPlus className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-semibold mb-1">Ready to Link Patients</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Search for manually created patients that need to be linked with the hospital database.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Linked Patients */}
        <TabsContent value="linked" className="mt-6 space-y-4">
          <Alert className="border-green-500/30 bg-green-50/50 dark:bg-green-900/10">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-foreground">
              View and manage successfully linked patients. These patients have full access to their hospital medical history.
            </AlertDescription>
          </Alert>

          {/* Search Linked Patients */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Database className="h-5 w-5 text-green-600" />
                    Linked Patients
                  </CardTitle>
                  <CardDescription>
                    {linkedTotal > 0 ? `${linkedTotal} patient${linkedTotal === 1 ? '' : 's'} successfully linked` : 'No patients linked yet'}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => linkedSearchTerm ? handleSearchLinked() : loadAllLinkedPatients(linkedPage)}
                  disabled={isLoadingLinked || isSearchingLinked}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${(isLoadingLinked || isSearchingLinked) ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or HPERCODE..."
                    value={linkedSearchTerm}
                    onChange={(e) => setLinkedSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchLinked()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearchLinked} disabled={isSearchingLinked} size="lg">
                  {isSearchingLinked ? (
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
                {linkedSearchTerm && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      setLinkedSearchTerm('');
                      loadAllLinkedPatients();
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>

              {/* Linked Patients Results */}
              {linkedPatients.length > 0 && !isLoadingLinked && (
                <div className="space-y-3">
                  {linkedSearchTerm && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-green-700">
                        Found {linkedPatients.length} linked patient{linkedPatients.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  )}
                  <Separator />
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {linkedPatients.map((patient) => (
                      <Card
                        key={patient.id}
                        className="border-green-200 bg-green-50/50 border-2 transition-all hover:shadow-md"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-green-100 text-green-600">
                                <User className="h-6 w-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <p className="font-semibold text-lg truncate">
                                    {patient.last_name}, {patient.first_name} {patient.middle_name}
                                  </p>
                                  <Badge className="bg-green-600 hover:bg-green-700">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Linked ({patient.patient_repository?.length || 0})
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                                  <span className="capitalize">{patient.sex}</span>
                                  <span>•</span>
                                  <span>{patient.birth_date}</span>
                                </div>
                                <div className="flex flex-col gap-2">
                                  {patient.patient_repository?.map((repo: any, index: number) => (
                                    <div key={repo.id || index} className="flex items-center gap-2 text-xs flex-wrap">
                                      <Badge variant="secondary" className="font-mono">
                                        HPERCODE: {repo.hpercode}
                                      </Badge>
                                      {repo.facility_code && (
                                        <Badge variant="secondary" className="font-mono">
                                          Facility: {repo.facility_code}
                                        </Badge>
                                      )}
                                      <div className="flex items-center gap-1 ml-1">
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-6 w-6 text-muted-foreground hover:text-primary"
                                          onClick={() => {
                                            // Pre-fill the linking dialog for editing this specific link
                                            setPatientToLink({
                                              ...patient,
                                              editingRepositoryId: repo.id,
                                              editingHpercode: repo.hpercode,
                                              editingFacilityCode: repo.facility_code
                                            });
                                            setIsLinkingDialogOpen(true);
                                          }}
                                          title="Edit this link"
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                          onClick={() => handleOpenUnlinkDialog(
                                            repo.id,
                                            repo.hpercode,
                                            `${patient.last_name}, ${patient.first_name}`
                                          )}
                                          title="Remove this link"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <p className="text-xs text-green-700 dark:text-green-400 italic mt-2 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Full hospital history access enabled
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  // Switch to view tab and search for this patient (use first hpercode)
                                  setActiveTab('view');
                                  setSearchTerm(patient.patient_repository?.[0]?.hpercode || '');
                                  setTimeout(() => handleSearch(), 100);
                                }}
                                className="flex-shrink-0"
                              >
                                <HistoryIcon className="h-4 w-4 mr-2" />
                                View History
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddLink(patient)}
                                className="flex-shrink-0"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Link
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading State */}
              {(isSearchingLinked || isLoadingLinked) && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {isSearchingLinked ? 'Searching for linked patients...' : 'Loading linked patients...'}
                  </p>
                </div>
              )}

              {/* Empty State - No Search Results */}
              {!isSearchingLinked && !isLoadingLinked && linkedPatients.length === 0 && linkedSearchTerm && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-semibold mb-1">No Match Found</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    No linked patients match "{linkedSearchTerm}". Try a different search.
                  </p>
                </div>
              )}

              {/* Empty State - No Linked Patients */}
              {!linkedSearchTerm && linkedPatients.length === 0 && !isSearchingLinked && !isLoadingLinked && (
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                    <LinkIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-semibold mb-1">No Linked Patients</p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Start linking patients to enable access to their hospital records and medical history.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => setActiveTab('link')}
                  >
                    Link Patients
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: View Patient History */}
        <TabsContent value="view" className="mt-6 space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Search hospital database patients to view their complete medical history, admissions, and encounters.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5 text-primary" />
                Hospital Database Search
              </CardTitle>
              <CardDescription>
                Search by patient name or HPERCODE
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
                onClearResults={() => {
                  setSearchResults([]);
                  setSearchMeta({ totalMatches: 0, databaseSummaries: [] });
                }}
                totalMatches={searchMeta.totalMatches}
                displayedCount={searchResults.length}
                databaseSummaries={searchMeta.databaseSummaries}
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
                  Search for a patient to view their medical history and hospital records.
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
      </Tabs>

      {/* Patient Linking Dialog */}
      <PatientLinkingDialog
        open={isLinkingDialogOpen}
        onOpenChange={setIsLinkingDialogOpen}
        supabasePatient={patientToLink}
        onLinkSuccess={handleLinkSuccess}
      />

      {/* Unlink Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isUnlinkDialogOpen}
        onClose={() => {
          setIsUnlinkDialogOpen(false);
          setRepositoryToUnlink(null);
        }}
        onConfirm={handleUnlink}
        title="Remove Patient Link"
        description={`Are you sure you want to remove the link for HPERCODE ${repositoryToUnlink?.hpercode} from ${repositoryToUnlink?.patientName}? This will disable access to the hospital history for this record.`}
        confirmText="Remove Link"
        cancelText="Cancel"
        isLoading={isUnlinking}
        variant="destructive"
      />
    </div>
  );
};

export default PatientTagging;