import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import patientService, { PatientHistory } from 'src/services/patientService';
import { PatientSearchResultProfile } from '../PatientSearchPanel';
import {
  getPatientSearchBuckets,
  getPatientSearchSummaries,
  getPatientSearchTotalMatches,
} from '../../utils/patientSearchResultHelpers';
import {
  TabValue,
  isValidTab,
  SupabasePatient,
  PatientToLink,
  RepositoryToUnlink,
  SearchMeta,
  PatientStats,
} from './types';
import {
  FACILITY_NAME_BY_CODE,
  filterLinkedPatients,
  getActiveRepositories,
  searchInPatientName,
  searchInHpercodes,
} from './utils';

/* ------------------------------------------------------------------ */
/*  Hook Return Type                                                  */
/* ------------------------------------------------------------------ */

export interface UsePatientTaggingReturn {
  // Tab state
  activeTab: TabValue;
  setActiveTab: (tab: TabValue) => void;

  // MySQL Search state
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchResults: PatientSearchResultProfile[];
  isSearching: boolean;
  selectedPatient: PatientSearchResultProfile | null;
  searchMeta: SearchMeta;
  handleSearch: (term?: string) => void;
  handleSelectPatient: (patient: PatientSearchResultProfile) => Promise<void>;

  // Supabase Search state
  supabaseSearchTerm: string;
  setSupabaseSearchTerm: (term: string) => void;
  supabaseSearchResults: SupabasePatient[];
  isSearchingSupabase: boolean;
  handleSearchSupabase: () => Promise<void>;
  clearSupabaseResults: () => void;

  // Linked patients state
  linkedSearchTerm: string;
  setLinkedSearchTerm: (term: string) => void;
  linkedPatients: SupabasePatient[];
  isSearchingLinked: boolean;
  isLoadingLinked: boolean;
  linkedPage: number;
  linkedTotal: number;
  handleSearchLinked: () => Promise<void>;
  loadAllLinkedPatients: (page?: number) => Promise<void>;

  // Linking dialog state
  isLinkingDialogOpen: boolean;
  setIsLinkingDialogOpen: (open: boolean) => void;
  patientToLink: PatientToLink | null;
  handleOpenLinkDialog: (patient: SupabasePatient) => void;
  handleAddLink: (patient: SupabasePatient) => void;
  handleLinkSuccess: () => Promise<void>;

  // Unlink dialog state
  isUnlinkDialogOpen: boolean;
  repositoryToUnlink: RepositoryToUnlink | null;
  isUnlinking: boolean;
  handleOpenUnlinkDialog: (repositoryId: string, hpercode: string, patientName: string) => void;
  handleCloseUnlinkDialog: () => void;
  handleUnlink: () => Promise<void>;

  // Patient history state
  patientHistory: PatientHistory[];
  isLoadingHistory: boolean;
  filteredHistory: PatientHistory[];
  patientStats: PatientStats;

  // Filter state
  typeFilter: string;
  setTypeFilter: (filter: string) => void;
  viewMode: 'timeline' | 'table';
  setViewMode: (mode: 'timeline' | 'table') => void;

  // Record modal state
  isRecordModalOpen: boolean;
  setIsRecordModalOpen: (open: boolean) => void;
  selectedPatientHpercode: string | undefined;
  handleOpenPatientRecords: () => void;

  // Clear functions
  clearSearchResults: () => void;
}

/* ------------------------------------------------------------------ */
/*  Hook Implementation                                               */
/* ------------------------------------------------------------------ */

export const usePatientTagging = (): UsePatientTaggingReturn => {
  const [searchParams] = useSearchParams();
  const viewTabParam = searchParams.get('tab');
  const hpercodeParam = searchParams.get('hpercode');

  // Active tab
  const [activeTab, setActiveTab] = useState<TabValue>('link');

  // MySQL Search state (existing patients from hospital database)
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<PatientSearchResultProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientSearchResultProfile | null>(null);
  const [searchMeta, setSearchMeta] = useState<SearchMeta>({
    totalMatches: 0,
    databaseSummaries: [],
  });
  const [pendingAutoSelectHpercode, setPendingAutoSelectHpercode] = useState<string | null>(null);

  // Supabase Search state (manually entered patients - unlinked)
  const [supabaseSearchTerm, setSupabaseSearchTerm] = useState('');
  const [supabaseSearchResults, setSupabaseSearchResults] = useState<SupabasePatient[]>([]);
  const [isSearchingSupabase, setIsSearchingSupabase] = useState(false);

  // Linked patients search state
  const [linkedSearchTerm, setLinkedSearchTerm] = useState('');
  const [linkedPatients, setLinkedPatients] = useState<SupabasePatient[]>([]);
  const [isSearchingLinked, setIsSearchingLinked] = useState(false);
  const [isLoadingLinked, setIsLoadingLinked] = useState(false);
  const [linkedPage, setLinkedPage] = useState(1);
  const [linkedTotal, setLinkedTotal] = useState(0);

  // Linking dialog state
  const [isLinkingDialogOpen, setIsLinkingDialogOpen] = useState(false);
  const [patientToLink, setPatientToLink] = useState<PatientToLink | null>(null);

  // Unlink confirmation dialog state
  const [isUnlinkDialogOpen, setIsUnlinkDialogOpen] = useState(false);
  const [repositoryToUnlink, setRepositoryToUnlink] = useState<RepositoryToUnlink | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);

  // Patient history state
  const [patientHistory, setPatientHistory] = useState<PatientHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Filter state
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const selectedPatientHpercode = selectedPatient?.hpercode;

  /* ------------------------------------------------------------------ */
  /*  Effects                                                           */
  /* ------------------------------------------------------------------ */

  // Load linked patients when switching to linked tab
  useEffect(() => {
    if (activeTab === 'linked' && linkedPatients.length === 0 && !linkedSearchTerm) {
      loadAllLinkedPatients();
    }
  }, [activeTab]);

  // Close record modal when patient deselected
  useEffect(() => {
    if (!selectedPatient) {
      setIsRecordModalOpen(false);
    }
  }, [selectedPatient]);

  // Handle tab from URL params
  useEffect(() => {
    if (!viewTabParam) return;
    if (isValidTab(viewTabParam)) {
      setActiveTab(viewTabParam);
    }
  }, [viewTabParam]);

  /* ------------------------------------------------------------------ */
  /*  Search Functions                                                  */
  /* ------------------------------------------------------------------ */

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

  const handleSearch = useCallback((term?: string) => {
    const query = (term ?? searchTerm).trim();
    if (!query) return;

    setSearchTerm(query);
    setPendingAutoSelectHpercode(null);
    void executePatientSearch(query);
  }, [searchTerm, executePatientSearch]);

  // Handle hpercode from URL params
  useEffect(() => {
    const hpercode = hpercodeParam?.trim();
    if (!hpercode) return;
    setActiveTab('view');
    setSearchTerm(hpercode);
    setPendingAutoSelectHpercode(hpercode);
    void executePatientSearch(hpercode);
  }, [executePatientSearch, hpercodeParam]);

  const handleSearchSupabase = useCallback(async () => {
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
  }, [supabaseSearchTerm]);

  const loadAllLinkedPatients = useCallback(async (page = 1) => {
    setIsLoadingLinked(true);
    try {
      const result = await patientService.getSupabasePatients(page, 20);
      if (result.success) {
        const linked = filterLinkedPatients(result.data);
        setLinkedPatients(linked);
        setLinkedPage(page);
        setLinkedTotal(linked.length);
      }
    } catch (error) {
      console.error('Error loading linked patients:', error);
    } finally {
      setIsLoadingLinked(false);
    }
  }, []);

  const handleSearchLinked = useCallback(async () => {
    if (!linkedSearchTerm.trim()) {
      loadAllLinkedPatients();
      return;
    }

    setIsSearchingLinked(true);
    try {
      const allPatientsResult = await patientService.getSupabasePatients(1, 200);
      if (allPatientsResult.success) {
        const searchLower = linkedSearchTerm.toLowerCase();
        const linked = allPatientsResult.data
          .filter((patient: SupabasePatient) => {
            const activeRepos = getActiveRepositories(patient);
            if (activeRepos.length === 0) return false;

            return (
              searchInPatientName(patient, searchLower) ||
              searchInHpercodes(patient, searchLower)
            );
          })
          .map((patient: SupabasePatient) => ({
            ...patient,
            patient_repository: getActiveRepositories(patient),
          }));

        setLinkedPatients(linked);
        setLinkedTotal(linked.length);
      }
    } catch (error) {
      console.error('Error searching linked patients:', error);
    } finally {
      setIsSearchingLinked(false);
    }
  }, [linkedSearchTerm, loadAllLinkedPatients]);

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

  const handleSelectPatient = useCallback(
    async (patient: PatientSearchResultProfile) => {
      setSelectedPatient(patient);
      setSearchResults([]);
      setSearchTerm('');
      setSearchMeta({ totalMatches: 0, databaseSummaries: [] });

      if (patient.hpercode) {
        await loadPatientHistory(patient.hpercode, patient.sourceDatabase);
      }
    },
    [loadPatientHistory]
  );

  // Auto-select patient from URL hpercode
  useEffect(() => {
    if (!pendingAutoSelectHpercode) return;
    const match = searchResults.find((result) => result.hpercode === pendingAutoSelectHpercode);
    if (!match) return;

    void handleSelectPatient(match);
    setPendingAutoSelectHpercode(null);
  }, [pendingAutoSelectHpercode, searchResults, handleSelectPatient]);

  /* ------------------------------------------------------------------ */
  /*  Linking Handlers                                                  */
  /* ------------------------------------------------------------------ */

  const handleOpenLinkDialog = useCallback((patient: SupabasePatient) => {
    setPatientToLink(patient as PatientToLink);
    setIsLinkingDialogOpen(true);
  }, []);

  const handleAddLink = useCallback((patient: SupabasePatient) => {
    setPatientToLink(patient as PatientToLink);
    setIsLinkingDialogOpen(true);
  }, []);

  const handleLinkSuccess = useCallback(async () => {
    if (supabaseSearchTerm) {
      await handleSearchSupabase();
    }
    if (activeTab === 'linked') {
      if (linkedSearchTerm) {
        await handleSearchLinked();
      } else {
        await loadAllLinkedPatients(linkedPage);
      }
    }
  }, [
    supabaseSearchTerm,
    activeTab,
    linkedSearchTerm,
    linkedPage,
    handleSearchSupabase,
    handleSearchLinked,
    loadAllLinkedPatients,
  ]);

  /* ------------------------------------------------------------------ */
  /*  Unlink Handlers                                                   */
  /* ------------------------------------------------------------------ */

  const handleOpenUnlinkDialog = useCallback(
    (repositoryId: string, hpercode: string, patientName: string) => {
      setRepositoryToUnlink({ id: repositoryId, hpercode, patientName });
      setIsUnlinkDialogOpen(true);
    },
    []
  );

  const handleCloseUnlinkDialog = useCallback(() => {
    setIsUnlinkDialogOpen(false);
    setRepositoryToUnlink(null);
  }, []);

  const handleUnlink = useCallback(async () => {
    if (!repositoryToUnlink) return;

    setIsUnlinking(true);
    try {
      const result = await patientService.unlinkPatientRepository(repositoryToUnlink.id);
      if (result.success) {
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
  }, [repositoryToUnlink, linkedSearchTerm, linkedPage, handleSearchLinked, loadAllLinkedPatients]);

  /* ------------------------------------------------------------------ */
  /*  Record Modal Handlers                                             */
  /* ------------------------------------------------------------------ */

  const handleOpenPatientRecords = useCallback(() => {
    if (!selectedPatientHpercode) return;
    setIsRecordModalOpen(true);
  }, [selectedPatientHpercode]);

  /* ------------------------------------------------------------------ */
  /*  Clear Functions                                                   */
  /* ------------------------------------------------------------------ */

  const clearSupabaseResults = useCallback(() => {
    setSupabaseSearchResults([]);
    setSupabaseSearchTerm('');
  }, []);

  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
    setSearchMeta({ totalMatches: 0, databaseSummaries: [] });
  }, []);

  /* ------------------------------------------------------------------ */
  /*  Statistics & Analytics                                            */
  /* ------------------------------------------------------------------ */

  const patientStats = useMemo<PatientStats>(() => {
    const totalVisits = patientHistory.length;
    const admissions = patientHistory.filter((h) => h.admdate && !h.disdate).length;
    const discharges = patientHistory.filter((h) => h.disdate).length;
    const activeAdmissions = patientHistory.filter((h) => h.admdate && !h.disdate).length;

    const recentVisit =
      patientHistory.length > 0
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

  const filteredHistory = useMemo(() => {
    return patientHistory.filter((item) => {
      const matchesType =
        typeFilter === 'all' ||
        (typeFilter === 'admission' && item.admdate && !item.disdate) ||
        (typeFilter === 'discharge' && item.disdate);
      return matchesType;
    });
  }, [patientHistory, typeFilter]);

  /* ------------------------------------------------------------------ */
  /*  Return                                                            */
  /* ------------------------------------------------------------------ */

  return {
    // Tab state
    activeTab,
    setActiveTab,

    // MySQL Search state
    searchTerm,
    setSearchTerm,
    searchResults,
    isSearching,
    selectedPatient,
    searchMeta,
    handleSearch,
    handleSelectPatient,

    // Supabase Search state
    supabaseSearchTerm,
    setSupabaseSearchTerm,
    supabaseSearchResults,
    isSearchingSupabase,
    handleSearchSupabase,
    clearSupabaseResults,

    // Linked patients state
    linkedSearchTerm,
    setLinkedSearchTerm,
    linkedPatients,
    isSearchingLinked,
    isLoadingLinked,
    linkedPage,
    linkedTotal,
    handleSearchLinked,
    loadAllLinkedPatients,

    // Linking dialog state
    isLinkingDialogOpen,
    setIsLinkingDialogOpen,
    patientToLink,
    handleOpenLinkDialog,
    handleAddLink,
    handleLinkSuccess,

    // Unlink dialog state
    isUnlinkDialogOpen,
    repositoryToUnlink,
    isUnlinking,
    handleOpenUnlinkDialog,
    handleCloseUnlinkDialog,
    handleUnlink,

    // Patient history state
    patientHistory,
    isLoadingHistory,
    filteredHistory,
    patientStats,

    // Filter state
    typeFilter,
    setTypeFilter,
    viewMode,
    setViewMode,

    // Record modal state
    isRecordModalOpen,
    setIsRecordModalOpen,
    selectedPatientHpercode,
    handleOpenPatientRecords,

    // Clear functions
    clearSearchResults,
  };
};

export default usePatientTagging;
