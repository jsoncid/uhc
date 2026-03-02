import { Tabs, TabsContent } from 'src/components/ui/tabs';
import { Activity, CheckCircle2, Link as LinkIcon, Users, Link2, Link2Off, CalendarDays } from 'lucide-react';
import PatientLinkingDialog from './components/PatientLinkingDialog';
import { PatientPDFModal } from './components/PatientPDFModal';
import { ConfirmDialog } from 'src/components/ui/confirm-dialog';
import { Module3PageHeader, StatsCard, ModernTabs } from './components';
import {
  usePatientTagging,
  LinkTab,
  LinkedTab,
  ViewHistoryTab,
  PatientToLink,
  countLinkedToday,
} from './components/PatientTagging';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const PatientTagging = () => {
  const {
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
    filteredHistory,
    isLoadingHistory,
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
  } = usePatientTagging();

  /* ------------------------------------------------------------------ */
  /*  Tab Configuration                                                 */
  /* ------------------------------------------------------------------ */

  const tabConfig = [
    { value: 'link', label: 'Link Patient', icon: LinkIcon },
    { value: 'linked', label: 'Linked', icon: CheckCircle2, badge: linkedTotal },
    { value: 'view', label: 'View History', icon: Activity },
  ];

  /* ------------------------------------------------------------------ */
  /*  Handlers                                                          */
  /* ------------------------------------------------------------------ */

  const handleViewHistoryFromLinked = (patient: { patient_repository?: Array<{ hpercode?: string | null }> }) => {
    setActiveTab('view');
    const hpercode = patient.patient_repository?.[0]?.hpercode || '';
    setSearchTerm(hpercode);
    setTimeout(() => handleSearch(hpercode), 100);
  };

  const handleEditLink = (_patient: PatientToLink) => {
    setIsLinkingDialogOpen(true);
  };

  /* ------------------------------------------------------------------ */
  /*  Statistics                                                        */
  /* ------------------------------------------------------------------ */

  const totalInRepository = linkedTotal + supabaseSearchResults.length;
  const todaysLinks = countLinkedToday(linkedPatients);

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */

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
          value={totalInRepository}
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
          value={todaysLinks}
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
        <TabsContent value="link" className="mt-6">
          <LinkTab
            searchTerm={supabaseSearchTerm}
            onSearchTermChange={setSupabaseSearchTerm}
            onSearch={handleSearchSupabase}
            isSearching={isSearchingSupabase}
            searchResults={supabaseSearchResults}
            onClearResults={clearSupabaseResults}
            onLinkPatient={handleOpenLinkDialog}
          />
        </TabsContent>

        {/* TAB 2: Linked Patients */}
        <TabsContent value="linked" className="mt-6">
          <LinkedTab
            searchTerm={linkedSearchTerm}
            onSearchTermChange={setLinkedSearchTerm}
            onSearch={handleSearchLinked}
            isSearching={isSearchingLinked}
            isLoading={isLoadingLinked}
            linkedPatients={linkedPatients}
            linkedTotal={linkedTotal}
            onClearSearch={() => {
              setLinkedSearchTerm('');
              loadAllLinkedPatients();
            }}
            onRefresh={() =>
              linkedSearchTerm ? handleSearchLinked() : loadAllLinkedPatients(linkedPage)
            }
            onViewHistory={handleViewHistoryFromLinked}
            onAddLink={handleAddLink}
            onEditLink={handleEditLink}
            onUnlink={handleOpenUnlinkDialog}
            onSwitchToLinkTab={() => setActiveTab('link')}
          />
        </TabsContent>

        {/* TAB 3: View Patient History */}
        <TabsContent value="view" className="mt-6">
          <ViewHistoryTab
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            onSearch={handleSearch}
            isSearching={isSearching}
            searchResults={searchResults}
            onSelectPatient={handleSelectPatient}
            onClearResults={clearSearchResults}
            totalMatches={searchMeta.totalMatches}
            displayedCount={searchResults.length}
            databaseSummaries={searchMeta.databaseSummaries}
            selectedPatient={selectedPatient}
            patientStats={patientStats}
            filteredHistory={filteredHistory}
            isLoadingHistory={isLoadingHistory}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
            onViewRecords={handleOpenPatientRecords}
            viewRecordsDisabled={!selectedPatientHpercode}
          />
        </TabsContent>
      </Tabs>

      {/* Patient Linking Dialog */}
      <PatientLinkingDialog
        open={isLinkingDialogOpen}
        onOpenChange={setIsLinkingDialogOpen}
        supabasePatient={patientToLink as any}
        onLinkSuccess={handleLinkSuccess}
      />

      {/* Unlink Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isUnlinkDialogOpen}
        onClose={handleCloseUnlinkDialog}
        onConfirm={handleUnlink}
        title="Remove Patient Link"
        description={`Are you sure you want to remove the link for HPERCODE ${repositoryToUnlink?.hpercode} from ${repositoryToUnlink?.patientName}? This will disable access to the hospital history for this record.`}
        confirmText="Remove Link"
        cancelText="Cancel"
        isLoading={isUnlinking}
        variant="destructive"
      />

      {/* Patient PDF Modal */}
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