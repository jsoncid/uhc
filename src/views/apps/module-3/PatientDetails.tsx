import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { Separator } from 'src/components/ui/separator';
import {
  ArrowLeft,
  User,
  Calendar,
  MapPin,
  Building2,
  FileText,
  Loader2,
  Users as UsersIcon,
} from 'lucide-react';
import patientService from 'src/services/patientService';
import { getFacilityName } from 'src/utils/facilityMapping';
import { PatientPDFModal } from 'src/views/apps/module-3/components/PatientPDFModal';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const BCrumb = [
  { to: '/', title: 'Home' },
  { title: 'Module 3 - Patient Repository' },
  { to: '/module-3/patient-list', title: 'Patient List' },
  { title: 'Patient Details' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const PatientDetails = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('id');

  // State
  const [patient, setPatient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);

  /* ------------------------------------------------------------------ */
  /*  Effects                                                           */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (patientId) {
      loadPatientDetails();
    }
  }, [patientId]);

  /* ------------------------------------------------------------------ */
  /*  Handlers                                                          */
  /* ------------------------------------------------------------------ */

  const loadPatientDetails = async () => {
    setIsLoading(true);
    try {
      // Fetch patient details with joins from Supabase
      const result = await patientService.getSupabasePatients(1, 1000);
      if (result.success) {
        const foundPatient = result.data.find((p: any) => p.id === patientId);
        if (foundPatient) {
          setPatient(foundPatient);
        }
      }
    } catch (error) {
      console.error('Error loading patient details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/module-3/patient-list');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getSexBadge = (sex: string) => {
    const variant = sex?.toUpperCase() === 'M' ? 'default' : 'secondary';
    return (
      <Badge variant={variant}>
        {sex?.toUpperCase() === 'M' ? 'Male' : sex?.toUpperCase() === 'F' ? 'Female' : sex}
      </Badge>
    );
  };

  const getLocationString = (patient: any) => {
    if (patient?.brgy?.city_municipality) {
      const brgy = patient.brgy.description || '';
      const city = patient.brgy.city_municipality.description || '';
      const province = patient.brgy.city_municipality.province?.description || '';
      const region = patient.brgy.city_municipality.province?.region?.description || '';
      
      const parts = [brgy, city, province, region].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : 'N/A';
    }
    
    const parts = [
      patient?.brgy_name,
      patient?.city_name,
      patient?.province_name,
      patient?.region_name
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const getFacility = (patient: any) => {
    const facilityCode = patient?.patient_repository?.[0]?.facility_code;
    return getFacilityName(facilityCode);
  };

  const getHpercode = (patient: any) => {
    return patient?.patient_repository?.[0]?.hpercode || 'N/A';
  };

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */

  if (isLoading) {
    return (
      <>
        <BreadcrumbComp items={BCrumb} title="Patient Details" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading patient details...</span>
        </div>
      </>
    );
  }

  if (!patient) {
    return (
      <>
        <BreadcrumbComp items={BCrumb} title="Patient Details" />
        <Card className="w-full">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <User className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium text-muted-foreground">
                Patient not found
              </p>
              <Button onClick={handleBack} variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Patient List
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <BreadcrumbComp items={BCrumb} title="Patient Details" />
      
      <div className="space-y-6">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Button onClick={handleBack} variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className="text-2xl">
                    {patient.first_name} {patient.middle_name} {patient.last_name}
                    {patient.ext_name ? ` ${patient.ext_name}` : ''}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Patient ID: {patient.id}
                  </p>
                </div>
              </div>
              <Button onClick={() => setIsPDFModalOpen(true)} className="gap-2">
                <FileText className="h-4 w-4" />
                View Medical Records
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Patient Information Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">First Name</p>
                  <p className="font-medium">{patient.first_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Middle Name</p>
                  <p className="font-medium">{patient.middle_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Name</p>
                  <p className="font-medium">{patient.last_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Suffix</p>
                  <p className="font-medium">{patient.ext_name || 'N/A'}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Sex</p>
                  <div className="mt-1">{getSexBadge(patient.sex)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Birth Date</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{formatDate(patient.birth_date)}</span>
                  </div>
                </div>
              </div>
              {patient.birth_place && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Birth Place</p>
                    <p className="font-medium">{patient.birth_place}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Complete Address</p>
                <p className="font-medium">{getLocationString(patient)}</p>
              </div>
              {patient.street && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Street Address</p>
                    <p className="font-medium">{patient.street}</p>
                  </div>
                </>
              )}
              {patient.zip_code && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">ZIP Code</p>
                    <p className="font-medium">{patient.zip_code}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Medical Facility Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Medical Facility Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Facility Name</p>
                <p className="font-medium">{getFacility(patient)}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Hospital Code (HPERCODE)</p>
                <p className="font-medium font-mono">{getHpercode(patient)}</p>
              </div>
              {patient.patient_repository?.[0]?.facility_code && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Facility Code</p>
                    <p className="font-medium font-mono">{patient.patient_repository[0].facility_code}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {patient.civil_status && (
                <div>
                  <p className="text-sm text-muted-foreground">Civil Status</p>
                  <p className="font-medium capitalize">{patient.civil_status}</p>
                </div>
              )}
              {patient.nationality && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Nationality</p>
                    <p className="font-medium">{patient.nationality}</p>
                  </div>
                </>
              )}
              {patient.religion && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Religion</p>
                    <p className="font-medium">{patient.religion}</p>
                  </div>
                </>
              )}
              {patient.philhealth_number && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">PhilHealth Number</p>
                    <p className="font-medium font-mono">{patient.philhealth_number}</p>
                  </div>
                </>
              )}
              {patient.employment_status && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Employment Status</p>
                    <p className="font-medium capitalize">{patient.employment_status}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* PDF Modal */}
      <PatientPDFModal
        isOpen={isPDFModalOpen}
        onClose={() => setIsPDFModalOpen(false)}
        patient={patient}
      />
    </>
  );
};

export default PatientDetails;
