import { ChangeEvent, useState } from 'react';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import CardBox from 'src/components/shared/CardBox';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'src/components/ui/dialog';

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'Module 3 - Patient Repository',
  },
  {
    title: 'Patient Profiling',
  },
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
  { id: 'fac-metro-health', name: 'Metro Health Center' },
  { id: 'fac-rural-institute', name: 'Rural Health Institute' },
  { id: 'fac-urban-clinic', name: 'Urban Care Clinic' },
  { id: 'fac-specialty', name: 'Specialty Hospital' },
];

const PatientProfiling = () => {
  const [patient, setPatient] = useState<PatientProfile>({ ...INITIAL_PROFILE });
  const [isRepositoryModalOpen, setIsRepositoryModalOpen] = useState(false);
  const [modalFacilityId, setModalFacilityId] = useState('');
  const [modalSearchName, setModalSearchName] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleInputChange = (key: keyof PatientProfile) => (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setPatient((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateSex = (value: string) => {
    setPatient((prev) => ({ ...prev, sex: value }));
  };

  return (
    <>
      <BreadcrumbComp title="Patient Profiling" items={BCrumb} />
      <CardBox className="p-6">
        <div className="flex justify-end mb-6">
          <Button type="button" onClick={() => setIsRepositoryModalOpen(true)}>
            Get Repository
          </Button>
        </div>
        <form onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-6">
          <div>
            <h2 className="text-lg font-semibold">Patient Profile</h2>
            <p className="text-sm text-muted-foreground">
              Capture the identifying metadata for the patient record before saving.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="patient-id">ID</Label>
              <Input
                id="patient-id"
                value={patient.id}
                onChange={handleInputChange('id')}
                placeholder="uuid"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground">Use the stored UUID value for the patient.</p>
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="created-at">Created At</Label>
              <Input
                id="created-at"
                type="datetime-local"
                value={patient.created_at}
                onChange={handleInputChange('created_at')}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground">Timestamp with timezone for when the profile was created.</p>
            </div>

            <div>
              <Label htmlFor="first-name">First Name</Label>
              <Input
                id="first-name"
                value={patient.first_name}
                onChange={handleInputChange('first_name')}
                className="mt-2"
                placeholder="Juan"
              />
            </div>

            <div>
              <Label htmlFor="middle-name">Middle Name</Label>
              <Input
                id="middle-name"
                value={patient.middle_name}
                onChange={handleInputChange('middle_name')}
                className="mt-2"
                placeholder="Santos"
              />
            </div>

            <div>
              <Label htmlFor="last-name">Last Name</Label>
              <Input
                id="last-name"
                value={patient.last_name}
                onChange={handleInputChange('last_name')}
                className="mt-2"
                placeholder="Dela Cruz"
              />
            </div>

            <div>
              <Label htmlFor="ext-name">Extension</Label>
              <Input
                id="ext-name"
                value={patient.ext_name}
                onChange={handleInputChange('ext_name')}
                className="mt-2"
                placeholder="Jr., III"
              />
            </div>

            <div>
              <Label htmlFor="sex">Sex</Label>
              <Select value={patient.sex} onValueChange={updateSex}>
                <SelectTrigger className="mt-2 w-full" id="sex">
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="birth-date">Birth Date</Label>
              <Input
                id="birth-date"
                type="date"
                value={patient.birth_date}
                onChange={handleInputChange('birth_date')}
                className="mt-2"
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="brgy">Barangay ID</Label>
              <Input
                id="brgy"
                value={patient.brgy}
                onChange={handleInputChange('brgy')}
                className="mt-2"
                placeholder="uuid"
              />
              <p className="text-xs text-muted-foreground">Link this record to the barangay UUID.</p>
            </div>
          </div>

          {statusMessage && <p className="text-sm text-success">{statusMessage}</p>}
        </form>
      </CardBox>

      <Dialog open={isRepositoryModalOpen} onOpenChange={setIsRepositoryModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Repository Lookup</DialogTitle>
            <DialogDescription>
              Pick a facility and search for a patient name before pulling the repository data.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 mt-3">
            <div>
              <Label htmlFor="facility">Facility</Label>
              <Select value={modalFacilityId} onValueChange={setModalFacilityId}>
                <SelectTrigger className="mt-2 w-full" id="facility">
                  <SelectValue placeholder="Select facility" />
                </SelectTrigger>
                <SelectContent>
                  {FACILITY_OPTIONS.map((facility) => (
                    <SelectItem key={facility.id} value={facility.id}>
                      {facility.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="search-name">Search name</Label>
              <Input
                id="search-name"
                value={modalSearchName}
                onChange={(event) => setModalSearchName(event.target.value)}
                placeholder="Enter patient name"
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                const facilityLabel =
                  FACILITY_OPTIONS.find((facility) => facility.id === modalFacilityId)?.name ||
                  'the selected facility';
                const queryName = modalSearchName.trim() || 'patients';
                setStatusMessage(`Repository data requested for ${queryName} at ${facilityLabel}.`);
                setModalFacilityId('');
                setModalSearchName('');
                setIsRepositoryModalOpen(false);
              }}
            >
              Get Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PatientProfiling;
