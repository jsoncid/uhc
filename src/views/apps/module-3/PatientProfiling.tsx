import { ChangeEvent, useMemo, useState } from 'react';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import CardBox from 'src/components/shared/CardBox';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Badge } from 'src/components/ui/badge';
import { Separator } from 'src/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'src/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'src/components/ui/dialog';
import {
  User,
  Calendar,
  MapPin,
  Fingerprint,
  Clock,
  Search,
  Building2,
  Download,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  Info,
  Database,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const BCrumb = [
  { to: '/', title: 'Home' },
  { title: 'Module 3 - Patient Repository' },
  { title: 'Patient Profiling' },
];

interface PatientProfile {
  id: string;
  created_at: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  ext_name: string;
  sex: string;
  birth_date: string;
  brgy: string;
}

const INITIAL_PROFILE: PatientProfile = {
  id: '',
  created_at: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  ext_name: '',
  sex: '',
  birth_date: '',
  brgy: '',
};

const FACILITY_OPTIONS = [
  { id: 'fac-metro-health', name: 'Metro Health Center', type: 'Primary', icon: '🏥' },
  { id: 'fac-rural-institute', name: 'Rural Health Institute', type: 'Rural', icon: '🌿' },
  { id: 'fac-urban-clinic', name: 'Urban Care Clinic', type: 'Urban', icon: '🏙️' },
  { id: 'fac-specialty', name: 'Specialty Hospital', type: 'Specialist', icon: '⚕️' },
];

/* ------------------------------------------------------------------ */
/*  Helper: Section Header                                             */
/* ------------------------------------------------------------------ */

function SectionHeader({
  icon: Icon,
  title,
  description,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: { label: string; variant: 'lightPrimary' | 'lightSuccess' | 'lightWarning' | 'lightInfo' };
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {badge && (
            <Badge variant={badge.variant} className="text-[10px] px-2 py-0.5 font-medium">
              {badge.label}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: Field with tooltip                                         */
/* ------------------------------------------------------------------ */

function FormField({
  label,
  htmlFor,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </Label>
        {hint && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{hint}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: Completion tracker                                         */
/* ------------------------------------------------------------------ */

function useProfileCompletion(profile: PatientProfile) {
  return useMemo(() => {
    const fields = Object.entries(profile);
    const filled = fields.filter(([, v]) => v.trim().length > 0).length;
    const total = fields.length;
    const pct = Math.round((filled / total) * 100);
    return { filled, total, pct };
  }, [profile]);
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

const PatientProfiling = () => {
  const [patient, setPatient] = useState<PatientProfile>({ ...INITIAL_PROFILE });
  const [isRepositoryModalOpen, setIsRepositoryModalOpen] = useState(false);
  const [modalFacilityId, setModalFacilityId] = useState('');
  const [modalSearchName, setModalSearchName] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2>(1);

  const completion = useProfileCompletion(patient);

  const handleInputChange =
    (key: keyof PatientProfile) => (event: ChangeEvent<HTMLInputElement>) => {
      setPatient((prev) => ({ ...prev, [key]: event.target.value }));
      // clear status when editing
      if (statusMessage) setStatusMessage(null);
    };

  const updateSex = (value: string) => {
    setPatient((prev) => ({ ...prev, sex: value }));
  };

  const handleReset = () => {
    setPatient({ ...INITIAL_PROFILE });
    setStatusMessage(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save delay
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
    setStatusMessage('Patient profile saved successfully.');
  };

  const isDirty = JSON.stringify(patient) !== JSON.stringify(INITIAL_PROFILE);

  const openModal = () => {
    setModalStep(1);
    setModalFacilityId('');
    setModalSearchName('');
    setIsRepositoryModalOpen(true);
  };

  const selectedFacility = FACILITY_OPTIONS.find((f) => f.id === modalFacilityId);

  return (
    <>
      <BreadcrumbComp title="Patient Profiling" items={BCrumb} />

      {/* ── Top Action Bar ── */}
      <CardBox className="p-4 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Left: status & completion */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="relative h-10 w-10">
                <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    className="stroke-muted"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15"
                    fill="none"
                    className="stroke-primary transition-all duration-500"
                    strokeWidth="3"
                    strokeDasharray={`${completion.pct * 0.94} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary">
                  {completion.pct}%
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Profile Completion</p>
                <p className="text-xs text-muted-foreground">
                  {completion.filled} of {completion.total} fields filled
                </p>
              </div>
            </div>

            {statusMessage && (
              <div className="flex items-center gap-2 rounded-lg bg-lightsuccess px-3 py-2 text-success">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">{statusMessage}</span>
                <button
                  onClick={() => setStatusMessage(null)}
                  className="ml-1 rounded-full p-0.5 hover:bg-success/10 transition-colors"
                  title="Dismiss"
                  aria-label="Dismiss notification"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openModal}
                  className="gap-2"
                >
                  <Database className="h-4 w-4" />
                  <span className="hidden sm:inline">Get Repository</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Look up patient data from a facility repository</TooltipContent>
            </Tooltip>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={!isDirty}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span className="hidden sm:inline">Reset</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear all fields and start fresh</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!isDirty || isSaving}
                  className="gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{isSaving ? 'Saving…' : 'Save Profile'}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save the patient profile</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardBox>

      {/* ── Form Sections ── */}
      <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
        {/* ─── Section 1: Record Information ─── */}
        <CardBox className="p-6">
          <SectionHeader
            icon={Fingerprint}
            title="Record Information"
            description="System-managed identifiers and timestamps for this patient record."
            badge={{ label: 'System', variant: 'lightInfo' }}
          />
          <Separator className="my-5" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <FormField
              label="Patient ID"
              htmlFor="patient-id"
              hint="Use the stored UUID value for the patient."
            >
              <div className="relative">
                <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  id="patient-id"
                  value={patient.id}
                  onChange={handleInputChange('id')}
                  placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                  className="pl-10 font-mono text-sm"
                />
              </div>
            </FormField>

            <FormField
              label="Created At"
              htmlFor="created-at"
              hint="Timestamp with timezone for when the profile was created."
            >
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  id="created-at"
                  type="datetime-local"
                  value={patient.created_at}
                  onChange={handleInputChange('created_at')}
                  className="pl-10"
                />
              </div>
            </FormField>
          </div>
        </CardBox>

        {/* ─── Section 2: Personal Information ─── */}
        <CardBox className="p-6">
          <SectionHeader
            icon={User}
            title="Personal Information"
            description="Core identity details — name and name extension."
            badge={{ label: 'Required', variant: 'lightWarning' }}
          />
          <Separator className="my-5" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="First Name" htmlFor="first-name" required>
              <Input
                id="first-name"
                value={patient.first_name}
                onChange={handleInputChange('first_name')}
                placeholder="Juan"
              />
            </FormField>

            <FormField label="Middle Name" htmlFor="middle-name">
              <Input
                id="middle-name"
                value={patient.middle_name}
                onChange={handleInputChange('middle_name')}
                placeholder="Santos"
              />
            </FormField>

            <FormField label="Last Name" htmlFor="last-name" required>
              <Input
                id="last-name"
                value={patient.last_name}
                onChange={handleInputChange('last_name')}
                placeholder="Dela Cruz"
              />
            </FormField>

            <FormField label="Extension" htmlFor="ext-name" hint="Suffix such as Jr., Sr., III">
              <Input
                id="ext-name"
                value={patient.ext_name}
                onChange={handleInputChange('ext_name')}
                placeholder="Jr., III"
              />
            </FormField>
          </div>
        </CardBox>

        {/* ─── Section 3: Demographics ─── */}
        <CardBox className="p-6">
          <SectionHeader
            icon={Calendar}
            title="Demographics"
            description="Biological and demographic information."
          />
          <Separator className="my-5" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField label="Sex" htmlFor="sex" required>
              <Select value={patient.sex} onValueChange={updateSex}>
                <SelectTrigger className="w-full" id="sex">
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">
                    <span className="flex items-center gap-2">♂ Male</span>
                  </SelectItem>
                  <SelectItem value="female">
                    <span className="flex items-center gap-2">♀ Female</span>
                  </SelectItem>
                  <SelectItem value="other">
                    <span className="flex items-center gap-2">⚧ Other</span>
                  </SelectItem>
                  <SelectItem value="unknown">
                    <span className="flex items-center gap-2">— Unknown</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Birth Date" htmlFor="birth-date" required>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  id="birth-date"
                  type="date"
                  value={patient.birth_date}
                  onChange={handleInputChange('birth_date')}
                  className="pl-10"
                />
              </div>
            </FormField>
          </div>
        </CardBox>

        {/* ─── Section 4: Location ─── */}
        <CardBox className="p-6">
          <SectionHeader
            icon={MapPin}
            title="Location"
            description="Geographic assignment and barangay link."
          />
          <Separator className="my-5" />
          <FormField
            label="Barangay ID"
            htmlFor="brgy"
            hint="Link this record to the barangay UUID."
          >
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <Input
                id="brgy"
                value={patient.brgy}
                onChange={handleInputChange('brgy')}
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                className="pl-10 font-mono text-sm"
              />
            </div>
          </FormField>
        </CardBox>
      </form>

      {/* ── Repository Lookup Modal ── */}
      <Dialog
        open={isRepositoryModalOpen}
        onOpenChange={(open) => {
          setIsRepositoryModalOpen(open);
          if (!open) {
            setModalStep(1);
            setModalFacilityId('');
            setModalSearchName('');
          }
        }}
      >
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden">
          {/* Modal header with gradient */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 pt-6 pb-4">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg">Repository Lookup</DialogTitle>
                  <DialogDescription className="mt-0.5">
                    Search a facility's repository to pull existing patient data.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mt-5">
              <div
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  modalStep >= 1
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                1. Select Facility
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <div
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  modalStep >= 2
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Search className="h-3.5 w-3.5" />
                2. Search Patient
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            {/* Step 1: Select Facility */}
            {modalStep === 1 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Choose the healthcare facility to search from.
                </p>
                <div className="grid gap-2">
                  {FACILITY_OPTIONS.map((facility) => {
                    const isSelected = modalFacilityId === facility.id;
                    return (
                      <button
                        key={facility.id}
                        type="button"
                        onClick={() => setModalFacilityId(facility.id)}
                        className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/30 hover:bg-muted/50'
                        }`}
                      >
                        <span className="text-xl">{facility.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{facility.name}</p>
                          <p className="text-xs text-muted-foreground">{facility.type} facility</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => setModalStep(2)}
                    disabled={!modalFacilityId}
                    className="gap-2"
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Search Patient */}
            {modalStep === 2 && (
              <div className="space-y-4">
                {/* Selected facility chip */}
                {selectedFacility && (
                  <div className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
                    <span className="text-base">{selectedFacility.icon}</span>
                    <span className="text-sm font-medium">{selectedFacility.name}</span>
                    <button
                      type="button"
                      onClick={() => setModalStep(1)}
                      className="ml-auto text-xs text-primary hover:underline"
                    >
                      Change
                    </button>
                  </div>
                )}

                <FormField
                  label="Search Patient Name"
                  htmlFor="modal-search-name"
                  hint="Enter full or partial patient name to search."
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <Input
                      id="modal-search-name"
                      value={modalSearchName}
                      onChange={(e) => setModalSearchName(e.target.value)}
                      placeholder="e.g. Dela Cruz, Juan"
                      className="pl-10"
                      autoFocus
                    />
                  </div>
                </FormField>

                {/* Quick info */}
                <div className="flex items-start gap-2 rounded-lg bg-lightinfo px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 text-info shrink-0 mt-0.5" />
                  <p className="text-xs text-info">
                    The search will query the selected facility's repository. Matching records will
                    populate the patient profile form automatically.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="outline" size="sm" onClick={() => setModalStep(1)} className="gap-2">
                    Back
                  </Button>
                  <Button
                    onClick={() => {
                      const facilityLabel = selectedFacility?.name || 'the selected facility';
                      const queryName = modalSearchName.trim() || 'all patients';
                      setStatusMessage(
                        `Repository data requested for "${queryName}" at ${facilityLabel}.`,
                      );
                      setModalFacilityId('');
                      setModalSearchName('');
                      setModalStep(1);
                      setIsRepositoryModalOpen(false);
                    }}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Pull Data
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PatientProfiling;
