/**
 * PatientProfiling - Main view for creating and updating patient profiles
 * 
 * This component has been refactored into modular sub-components:
 * - usePatientProfiling: Custom hook for all state and logic
 * - SidebarNavigation: Completion ring, section nav, and actions
 * - PersonalInfoSection: Name fields form section
 * - DemographicsSection: Sex and birth date form section
 * - LocationSection: PSGC cascading selects for location
 * - RepositoryLookupModal: Multi-step dialog for importing patient data
 * - StatusMessage: Floating notification component
 */
import { Users } from 'lucide-react';
import { Module3PageHeader } from './components';
import {
  usePatientProfiling,
  StatusMessage,
  SidebarNavigation,
  PersonalInfoSection,
  DemographicsSection,
  LocationSection,
  RepositoryLookupModal,
} from './components/PatientProfiling';

const PatientProfiling = () => {
  const {
    // Patient state
    patient,
    
    // Status
    statusMessage,
    statusType,
    setStatusMessage,
    
    // Saving
    isSaving,
    isDirty,
    
    // Section navigation
    personalSectionRef,
    demographicsSectionRef,
    locationSectionRef,
    sections,
    scrollToSection,
    
    // Completion
    completion,
    
    // Age display
    ageDisplay,
    
    // PSGC data
    regions,
    provinces,
    cities,
    barangays,
    selectedRegionCode,
    selectedProvinceCode,
    selectedCityCode,
    selectedBrgyCode,
    isLoadingRegions,
    isLoadingProvinces,
    isLoadingCities,
    isLoadingBarangays,
    
    // Repository modal state
    isRepositoryModalOpen,
    setIsRepositoryModalOpen,
    modalStep,
    setModalStep,
    modalFacilityId,
    modalFacilityDatabase,
    modalSearchName,
    setModalSearchName,
    facilities,
    isLoadingFacilities,
    facilityLoadError,
    repositoryAvailable,
    backendConnectionState,
    searchResults,
    isSearching,
    searchError,
    setSearchError,
    selectedFacility,
    
    // Handlers
    handleInputChange,
    updateSex,
    handleRegionChange,
    handleProvinceChange,
    handleCityChange,
    handleBrgyChange,
    handleReset,
    handleSave,
    openModal,
    handleSearch,
    handleSelectPatient,
    handleSelectFacility,
  } = usePatientProfiling();

  return (
    <>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <Module3PageHeader
          icon={Users}
          title="Patient Profiling"
          description="Create and update detailed patient profiles"
        />

        {/* Status Message (floating) */}
        {statusMessage && (
          <StatusMessage
            message={statusMessage}
            type={statusType}
            onDismiss={() => setStatusMessage(null)}
          />
        )}
      </div>

      {/* Split-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        
        {/* Sticky Side Navigation */}
        <SidebarNavigation
          completion={completion}
          sections={sections}
          onSectionClick={scrollToSection}
          onOpenRepository={openModal}
          onReset={handleReset}
          onSave={handleSave}
          isDirty={isDirty}
          isSaving={isSaving}
        />

        {/* Main Form Area */}
        <main>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            {/* Section 1: Personal Information */}
            <PersonalInfoSection
              ref={personalSectionRef}
              patient={patient}
              onInputChange={handleInputChange}
            />

            {/* Section 2: Demographics */}
            <DemographicsSection
              ref={demographicsSectionRef}
              patient={patient}
              ageDisplay={ageDisplay}
              onInputChange={handleInputChange}
              onSexChange={updateSex}
            />

            {/* Section 3: Location */}
            <LocationSection
              ref={locationSectionRef}
              patient={patient}
              onInputChange={handleInputChange}
              regions={regions}
              provinces={provinces}
              cities={cities}
              barangays={barangays}
              selectedRegionCode={selectedRegionCode}
              selectedProvinceCode={selectedProvinceCode}
              selectedCityCode={selectedCityCode}
              selectedBrgyCode={selectedBrgyCode}
              isLoadingRegions={isLoadingRegions}
              isLoadingProvinces={isLoadingProvinces}
              isLoadingCities={isLoadingCities}
              isLoadingBarangays={isLoadingBarangays}
              onRegionChange={handleRegionChange}
              onProvinceChange={handleProvinceChange}
              onCityChange={handleCityChange}
              onBrgyChange={handleBrgyChange}
            />
          </form>
        </main>
      </div>

      {/* Repository Lookup Modal */}
      <RepositoryLookupModal
        isOpen={isRepositoryModalOpen}
        onOpenChange={(open) => {
          setIsRepositoryModalOpen(open);
          if (!open) {
            setModalStep(1);
            setSearchError(null);
          }
        }}
        modalStep={modalStep}
        setModalStep={setModalStep}
        facilities={facilities}
        isLoadingFacilities={isLoadingFacilities}
        facilityLoadError={facilityLoadError}
        repositoryAvailable={repositoryAvailable}
        backendConnectionState={backendConnectionState}
        modalFacilityId={modalFacilityId}
        modalFacilityDatabase={modalFacilityDatabase}
        onSelectFacility={handleSelectFacility}
        selectedFacility={selectedFacility}
        modalSearchName={modalSearchName}
        onSearchNameChange={(value) => {
          setModalSearchName(value);
          setSearchError(null);
        }}
        searchError={searchError}
        isSearching={isSearching}
        onSearch={handleSearch}
        searchResults={searchResults}
        onSelectPatient={handleSelectPatient}
      />
    </>
  );
};

export default PatientProfiling;
