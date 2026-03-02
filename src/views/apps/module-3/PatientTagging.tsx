import { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { Separator } from 'src/components/ui/separator';
import { Alert, AlertDescription } from 'src/components/ui/alert';
import { Tabs, TabsContent } from 'src/components/ui/tabs';
import {
  Search,
  User,
  Activity,
  History as HistoryIcon,
  Link as LinkIcon,
  Database,
  Info,
  UserPlus,
  CheckCircle2,
  Edit,
  RefreshCw,
  Trash2,
  Plus,
  Users,
  Link2,
  Link2Off,
  CalendarDays,
  ArrowRight,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import patientService, { PatientHistory } from 'src/services/patientService';
import PatientSearchPanel, { PatientSearchResultProfile } from './components/PatientSearchPanel';
import PatientInfoCard from './components/PatientInfoCard';
import PatientHistoryTabs from './components/PatientHistoryTabs';
import PatientLinkingDialog from './components/PatientLinkingDialog';
import { PatientPDFModal } from './components/PatientPDFModal';
import { ConfirmDialog } from 'src/components/ui/confirm-dialog';
import {
  Module3PageHeader,
  StatsCard,
  PatientCardSkeleton,
  EmptyState,
  ProcessStepper,
  SearchInput,
  ModernTabs,
} from './components';
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

const VALID_TAB_VALUES = ['view', 'link', 'linked'] as const;
type TabValue = (typeof VALID_TAB_VALUES)[number];
const isValidTab = (value?: string): value is TabValue => VALID_TAB_VALUES.includes(value as TabValue);

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
  const [pendingAutoSelectHpercode, setPendingAutoSelectHpercode] = useState<string | null>(null);

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
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const selectedPatientHpercode = selectedPatient?.hpercode;
  const [searchParams] = useSearchParams();
  const viewTabParam = searchParams.get('tab');
  const hpercodeParam = searchParams.get('hpercode');

  /* ------------------------------------------------------------------ */
  /*  Effects                                                           */
  /* ------------------------------------------------------------------ */

  // Load linked patients when switching to linked tab
  useEffect(() => {
    if (activeTab === 'linked' && linkedPatients.length === 0 && !linkedSearchTerm) {
      loadAllLinkedPatients();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!selectedPatient) {
      setIsRecordModalOpen(false);
    }
  }, [selectedPatient]);

  useEffect(() => {
    if (!viewTabParam) return;
    if (isValidTab(viewTabParam)) {
      setActiveTab(viewTabParam);
    }
  }, [viewTabParam]);

  /* ------------------------------------------------------------------ */
  /*  Search Functions                                                  */
  /* ------------------------------------------------------------------ */

  // Search MySQL patients (hospital database)
  const executePatientSearch = useCallback(async (term: string) => {
    setIsSearching(true);
    try {
      const result = await patientService.searchPatients(term, { limit: 10 });
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
  }, []);

  const handleSearch = (term?: string) => {
    const query = (term ?? searchTerm).trim();
    if (!query) return;

    setSearchTerm(query);
    setPendingAutoSelectHpercode(null);
    void executePatientSearch(query);
  };

  useEffect(() => {
    const hpercode = hpercodeParam?.trim();
    if (!hpercode) return;
    setActiveTab('view');
    setSearchTerm(hpercode);
    setPendingAutoSelectHpercode(hpercode);
    void executePatientSearch(hpercode);
  }, [executePatientSearch, hpercodeParam]);

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

  /* ------------------------------------------------------------------ */
  /*  Data Loading Functions                                            */
  /* ------------------------------------------------------------------ */

  const loadPatientHistory = useCallback(async (hpercode: string, database?: string) => {
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
  }, []);

  const handleSelectPatient = useCallback(async (patient: PatientSearchResultProfile) => {
    setSelectedPatient(patient);
    setSearchResults([]);
    setSearchTerm('');
    setSearchMeta({ totalMatches: 0, databaseSummaries: [] });

    // Load patient history using hpercode
    if (patient.hpercode) {
      await loadPatientHistory(patient.hpercode, patient.sourceDatabase);
    }
  }, [loadPatientHistory]);

  useEffect(() => {
    if (!pendingAutoSelectHpercode) return;
    const match = searchResults.find((result) => result.hpercode === pendingAutoSelectHpercode);
    if (!match) return;

    void handleSelectPatient(match);
    setPendingAutoSelectHpercode(null);
  }, [pendingAutoSelectHpercode, searchResults, handleSelectPatient]);

  const handleOpenPatientRecords = () => {
    if (!selectedPatientHpercode) return;
    setIsRecordModalOpen(true);
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

  // Tab configuration for ModernTabs
  const tabConfig = [
    { value: 'link', label: 'Link Patient', icon: LinkIcon },
    { value: 'linked', label: 'Linked', icon: CheckCircle2, badge: linkedTotal },
    { value: 'view', label: 'View History', icon: Search },
  ];

  // Process steps configuration
  const linkingSteps = [
    { title: 'Search Patient', description: 'Find unlinked profile', color: 'blue' as const },
    { title: 'Click Link', description: 'Open linking dialog', color: 'purple' as const },
    { title: 'Match Record', description: 'Find hospital match', color: 'emerald' as const },
    { title: 'Complete', description: 'Full access enabled', color: 'amber' as const, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <Module3PageHeader
        icon={Activity}
        title="Patient Tagging"
        description="Link manually entered patients with hospital database records and manage patient connections."
      />

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          title="Total in Repository"
          value={linkedTotal + supabaseSearchResults.length}
          colorScheme="blue"
          description="All patient profiles"
        />
        <StatsCard
          icon={Link2}
          title="Linked Patients"
          value={linkedTotal}
          colorScheme="green"
          description="Successfully connected"
        />
        <StatsCard
          icon={Link2Off}
          title="Pending Links"
          value={supabaseSearchResults.length}
          colorScheme="amber"
          description="Awaiting connection"
        />
        <StatsCard
          icon={CalendarDays}
          title="Today's Links"
          value={linkedPatients.filter(p => {
            const today = new Date().toDateString();
            return p.patient_repository?.some((repo: any) => 
              new Date(repo.created_at).toDateString() === today
            );
          }).length}
          colorScheme="purple"
          description="Linked today"
        />
      </div>

      {/* Modern Tabs Navigation */}
      <ModernTabs
        tabs={tabConfig}
        activeTab={activeTab}
        onChange={(v) => setActiveTab(v as 'view' | 'link' | 'linked')}
        className="w-full sm:w-auto"
      />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'view' | 'link' | 'linked')}>
        {/* TAB 1: Link Patients */}
        <TabsContent value="link" className="mt-6 space-y-4">
          <Alert className="border-primary/30 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-foreground">
              Connect manually entered patient profiles with their hospital database records. Only unlinked patients will appear in search results.
            </AlertDescription>
          </Alert>

          {/* How it Works - Using ProcessStepper */}
          <ProcessStepper
            title="How to Link"
            steps={linkingSteps}
          />

          {/* Search Manually Entered Patients */}
          <Card className="border-2 shadow-sm">
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
              <SearchInput
                value={supabaseSearchTerm}
                onChange={setSupabaseSearchTerm}
                onSearch={handleSearchSupabase}
                onClear={() => {
                  setSupabaseSearchResults([]);
                  setSupabaseSearchTerm('');
                }}
                placeholder="Search by patient name..."
                isLoading={isSearchingSupabase}
              />

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
                        className="group relative overflow-hidden border-2 bg-card transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-0.5 hover:border-amber-400/50"
                      >
                        {/* Gradient glow on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <CardContent className="relative p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              {/* Avatar with ring */}
                              <div className="relative flex-shrink-0">
                                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/25 ring-4 ring-amber-500/20">
                                  <span className="text-lg font-bold">
                                    {patient.first_name?.[0]}{patient.last_name?.[0]}
                                  </span>
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-amber-400 rounded-full border-2 border-background flex items-center justify-center">
                                  <LinkIcon className="h-2 w-2 text-white" />
                                </span>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <p className="font-bold text-lg truncate">
                                    {patient.last_name}, {patient.first_name} {patient.middle_name}
                                  </p>
                                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                                    Pending Link
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                                  <span className="capitalize font-medium">{patient.sex}</span>
                                  <span className="text-muted-foreground/50">•</span>
                                  <span>{patient.birth_date}</span>
                                </div>
                                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                                  <Info className="h-3 w-3" />
                                  Ready to link with hospital database
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleOpenLinkDialog(patient)}
                              className="flex-shrink-0 gap-2 shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-shadow"
                            >
                              <LinkIcon className="h-4 w-4" />
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
                <PatientCardSkeleton count={3} />
              )}

              {/* Empty State */}
              {!isSearchingSupabase && supabaseSearchResults.length === 0 && supabaseSearchTerm && (
                <EmptyState
                  variant="search"
                  title="No Results Found"
                  description={`No unlinked patients matching "${supabaseSearchTerm}". The patient may not exist or is already linked.`}
                />
              )}

              {/* Initial Empty State */}
              {!supabaseSearchTerm && supabaseSearchResults.length === 0 && !isSearchingSupabase && (
                <EmptyState
                  icon={UserPlus}
                  variant="link"
                  title="Ready to Link Patients"
                  description="Search for manually created patients that need to be linked with the hospital database."
                />
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
          <Card className="border-2 shadow-sm">
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
                  className="gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${(isLoadingLinked || isSearchingLinked) ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <SearchInput
                value={linkedSearchTerm}
                onChange={setLinkedSearchTerm}
                onSearch={handleSearchLinked}
                onClear={() => {
                  setLinkedSearchTerm('');
                  loadAllLinkedPatients();
                }}
                placeholder="Search by name or HPERCODE..."
                isLoading={isSearchingLinked}
              />

              {/* Linked Patients Results */}
              {linkedPatients.length > 0 && !isLoadingLinked && (
                <div className="space-y-3">
                  {linkedSearchTerm && (
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                        Found {linkedPatients.length} linked patient{linkedPatients.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  )}
                  <Separator />
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {linkedPatients.map((patient) => (
                      <Card
                        key={patient.id}
                        className="group relative overflow-hidden border-2 bg-card transition-all duration-300 hover:shadow-xl hover:shadow-green-500/5 hover:-translate-y-0.5 hover:border-green-400/50"
                      >
                        {/* Gradient glow on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <CardContent className="relative p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                              {/* Avatar with status ring */}
                              <div className="relative flex-shrink-0">
                                <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg shadow-green-500/25 ring-4 ring-green-500/20">
                                  <span className="text-lg font-bold">
                                    {patient.first_name?.[0]}{patient.last_name?.[0]}
                                  </span>
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <p className="font-bold text-lg truncate">
                                    {patient.last_name}, {patient.first_name} {patient.middle_name}
                                  </p>
                                  <Badge className="bg-green-600 hover:bg-green-700 shadow-sm">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Linked ({patient.patient_repository?.length || 0})
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                                  <span className="capitalize font-medium">{patient.sex}</span>
                                  <span className="text-muted-foreground/50">•</span>
                                  <span>{patient.birth_date}</span>
                                </div>
                                
                                {/* Repository links */}
                                <div className="flex flex-col gap-2">
                                  {patient.patient_repository?.map((repo: any, index: number) => (
                                    <div key={repo.id || index} className="flex items-center gap-2 text-xs flex-wrap p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                                      <Badge variant="outline" className="font-mono bg-background">
                                        HPERCODE: {repo.hpercode}
                                      </Badge>
                                      {repo.facility_code && (
                                        <Badge variant="outline" className="font-mono bg-background">
                                          Facility: {repo.facility_code}
                                        </Badge>
                                      )}
                                      <div className="flex items-center gap-1 ml-auto">
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10"
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
                                          <Edit className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                          onClick={() => handleOpenUnlinkDialog(
                                            repo.id,
                                            repo.hpercode,
                                            `${patient.last_name}, ${patient.first_name}`
                                          )}
                                          title="Remove this link"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <p className="text-xs text-green-700 dark:text-green-400 font-medium mt-3 flex items-center gap-1.5">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
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
                                className="flex-shrink-0 gap-2 shadow-md shadow-primary/20"
                              >
                                <HistoryIcon className="h-4 w-4" />
                                View History
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAddLink(patient)}
                                className="flex-shrink-0 gap-2"
                              >
                                <Plus className="h-4 w-4" />
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
                <PatientCardSkeleton count={3} />
              )}

              {/* Empty State - No Search Results */}
              {!isSearchingLinked && !isLoadingLinked && linkedPatients.length === 0 && linkedSearchTerm && (
                <EmptyState
                  variant="search"
                  title="No Match Found"
                  description={`No linked patients match "${linkedSearchTerm}". Try a different search.`}
                />
              )}

              {/* Empty State - No Linked Patients */}
              {!linkedSearchTerm && linkedPatients.length === 0 && !isSearchingLinked && !isLoadingLinked && (
                <EmptyState
                  variant="link"
                  title="No Linked Patients"
                  description="Start linking patients to enable access to their hospital records and medical history."
                  action={{
                    label: 'Link Patients',
                    onClick: () => setActiveTab('link'),
                  }}
                />
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
              <div className="col-span-12 lg:col-span-8 space-y-3">
                
                <PatientHistoryTabs
                  history={filteredHistory}
                  isLoading={isLoadingHistory}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  typeFilter={typeFilter}
                  onTypeFilterChange={setTypeFilter}
                  onViewRecords={handleOpenPatientRecords}
                  viewRecordsDisabled={!selectedPatientHpercode}
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
      <PatientPDFModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        patient={selectedPatient}
        hpercode={selectedPatientHpercode}
      />
    </div>
  );
};

export default PatientTagging;