/**
 * PatientList - Main component for viewing and managing all patient records
 * 
 * This component has been refactored into modular pieces:
 * - usePatientList hook: All state and business logic
 * - SearchAndFilters: Search bar and filter controls
 * - PatientTable: Patient data table with sorting and pagination
 * - PatientHistorySection: Selected patient details and history
 */
import { Users, Building2, Link2, Link2Off } from 'lucide-react';
import { PatientPDFModal } from './components/PatientPDFModal';
import {
  Module3PageHeader,
  StatsCard,
} from './components';
import {
  usePatientList,
  SearchAndFilters,
  PatientTable,
  PatientHistorySection,
} from './components/PatientList';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const PatientList = () => {
  const {
    // Refs
    searchInputRef,
    
    // State
    filteredAndSortedPatients,
    isLoading,
    searchTerm,
    setSearchTerm,
    isSearching,
    
    // Filters
    activeFilters,
    sexFilter,
    linkedFilter,
    sortColumn,
    
    // Pagination
    currentPage,
    totalPages,
    totalPatients,
    
    // Selected patient
    selectedPatient,
    selectedPatientHpercode,
    filteredHistory,
    isLoadingHistory,
    typeFilter,
    setTypeFilter,
    viewMode,
    setViewMode,
    isRecordModalOpen,
    setIsRecordModalOpen,
    patientStats,
    
    // Stats
    linkedPatientsCount,
    unlinkedPatientsCount,
    
    // Handlers
    handleSexFilterChange,
    handleLinkedFilterChange,
    removeFilter,
    clearAllFilters,
    toggleSort,
    handleReset,
    handleQuickView,
    handleQuickTag,
    handleQuickViewRecords,
    handleSelectPatient,
    handleClosePatientView,
    handleOpenPatientRecords,
    handlePreviousPage,
    handleNextPage,
    
    // Utilities
    getPatientInfoForCard,
  } = usePatientList();

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <Module3PageHeader
        icon={Users}
        title="Patient List"
        description="View and manage all patient records in the system"
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          title="Total Patients"
          value={totalPatients}
          colorScheme="blue"
          description="All registered patients"
        />
        <StatsCard
          icon={Link2}
          title="Linked Patients"
          value={linkedPatientsCount}
          colorScheme="green"
          description="Connected to hospital"
        />
        <StatsCard
          icon={Link2Off}
          title="Unlinked Patients"
          value={unlinkedPatientsCount}
          colorScheme="amber"
          description="Pending connection"
        />
        <StatsCard
          icon={Building2}
          title="Current Page"
          value={currentPage}
          colorScheme="purple"
          description={`of ${totalPages} total pages`}
          animate={false}
        />
      </div>

      {/* Search and Filters */}
      <SearchAndFilters
        searchInputRef={searchInputRef}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        isSearching={isSearching}
        sexFilter={sexFilter}
        linkedFilter={linkedFilter}
        activeFilters={activeFilters}
        filteredAndSortedPatients={filteredAndSortedPatients}
        totalPatients={totalPatients}
        currentPage={currentPage}
        totalPages={totalPages}
        handleSexFilterChange={handleSexFilterChange}
        handleLinkedFilterChange={handleLinkedFilterChange}
        removeFilter={removeFilter}
        clearAllFilters={clearAllFilters}
        handleReset={handleReset}
      />

      {/* Patient Table */}
      <PatientTable
        patients={filteredAndSortedPatients}
        isLoading={isLoading}
        searchTerm={searchTerm}
        activeFiltersLength={activeFilters.length}
        selectedPatientId={selectedPatient?.id}
        sortColumn={sortColumn}
        currentPage={currentPage}
        totalPages={totalPages}
        totalPatients={totalPatients}
        toggleSort={toggleSort}
        handleSelectPatient={handleSelectPatient}
        handleQuickView={handleQuickView}
        handleQuickTag={handleQuickTag}
        handleQuickViewRecords={handleQuickViewRecords}
        handlePreviousPage={handlePreviousPage}
        handleNextPage={handleNextPage}
        clearAllFilters={clearAllFilters}
      />

      {/* Selected Patient History Section */}
      {selectedPatient && (
        <PatientHistorySection
          selectedPatient={selectedPatient}
          selectedPatientHpercode={selectedPatientHpercode}
          filteredHistory={filteredHistory}
          isLoadingHistory={isLoadingHistory}
          viewMode={viewMode}
          setViewMode={setViewMode}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          patientStats={patientStats}
          getPatientInfoForCard={getPatientInfoForCard}
          handleClosePatientView={handleClosePatientView}
          handleOpenPatientRecords={handleOpenPatientRecords}
        />
      )}

      {/* PDF Modal */}
      <PatientPDFModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        patient={selectedPatient}
        hpercode={selectedPatientHpercode}
      />
    </div>
  );
};

export default PatientList;
