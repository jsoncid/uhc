import { useState, useMemo } from 'react';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { Card, CardContent } from 'src/components/ui/card';
import { Search, User, Activity, History as HistoryIcon } from 'lucide-react';
import patientService, { PatientProfile, PatientHistory } from 'src/services/patientService';
import PatientSearchPanel from './components/PatientSearchPanel';
import PatientInfoCard from './components/PatientInfoCard';
import PatientHistoryTabs from './components/PatientHistoryTabs';

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
        {/* Search Panel */}
        <div className="col-span-12">
          <PatientSearchPanel
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onSearch={handleSearch}
            isSearching={isSearching}
            searchResults={searchResults}
            onSelectPatient={handleSelectPatient}
            onClearResults={() => setSearchResults([])}
          />
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
    </div>
  );
};

export default PatientTagging;