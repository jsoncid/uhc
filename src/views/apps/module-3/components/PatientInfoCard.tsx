import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card';
import { Label } from 'src/components/ui/label';
import { Badge } from 'src/components/ui/badge';
import { Separator } from 'src/components/ui/separator';
import { UserCircle, Calendar, User, Building2, MapPin, Clock } from 'lucide-react';
import { PatientProfile, PatientHistory } from 'src/services/patientService';
import { formatDate, calculateAge, formatDateTime } from '../utils/dateFormatters';

interface PatientInfoCardProps {
  patient: PatientProfile;
  recentVisit?: PatientHistory | null;
}

const PatientInfoCard = ({ patient, recentVisit }: PatientInfoCardProps) => {
  return (
    <Card className="border shadow-md sticky top-4">
      <CardHeader className="pb-3 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-gradient-to-br from-primary to-primary/70 p-2.5 rounded-xl shadow-md">
            <UserCircle className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base mb-0.5">Patient Information</CardTitle>
            <CardDescription>Demographics and Contact</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <div className="bg-gradient-to-br from-primary/5 to-transparent p-3 rounded-lg border">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">Full Name</Label>
          <p className="font-bold text-base mt-1 text-primary">
            {patient.first_name} {patient.middle_name} {patient.last_name} {patient.ext_name}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Birth Date
            </Label>
            <p className="font-semibold text-sm">{formatDate(patient.birth_date)}</p>
            <Badge variant="outline" className="mt-1">
              {calculateAge(patient.birth_date)} years old
            </Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" />
              Sex
            </Label>
            <p className="font-semibold text-sm">
              {patient.sex === 'M' ? 'Male' : patient.sex === 'F' ? 'Female' : patient.sex}
            </p>
          </div>
        </div>

        {patient.facility_code && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              Facility
            </Label>
            <p className="font-semibold text-sm">{patient.facility_code}</p>
          </div>
        )}

        {(patient.civil_status || patient.religion || patient.nationality) && (
          <>
            <Separator />
            <div className="grid grid-cols-1 gap-3">
              {patient.civil_status && (
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-muted-foreground">Civil Status</Label>
                  <Badge variant="secondary">{patient.civil_status}</Badge>
                </div>
              )}
              {patient.religion && (
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-muted-foreground">Religion</Label>
                  <Badge variant="secondary">{patient.religion}</Badge>
                </div>
              )}
              {patient.nationality && (
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-muted-foreground">Nationality</Label>
                  <Badge variant="secondary">{patient.nationality}</Badge>
                </div>
              )}
            </div>
          </>
        )}

        {(patient.street || patient.brgy_name || patient.city_name) && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5 font-semibold uppercase tracking-wide">
                <MapPin className="h-4 w-4" />
                Address
              </Label>
              <div className="bg-gradient-to-br from-muted/50 to-muted/30 p-4 rounded-xl border shadow-sm">
                <div className="space-y-2 text-sm">
                  {patient.street && (
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground font-medium min-w-[70px]">Street:</span>
                      <span className="font-semibold flex-1">{patient.street}</span>
                    </div>
                  )}
                  {patient.brgy_name && (
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground font-medium min-w-[70px]">Barangay:</span>
                      <span className="font-semibold flex-1">{patient.brgy_name}</span>
                    </div>
                  )}
                  {patient.city_name && (
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground font-medium min-w-[70px]">City:</span>
                      <span className="font-semibold flex-1">{patient.city_name}</span>
                    </div>
                  )}
                  {patient.province_name && (
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground font-medium min-w-[70px]">Province:</span>
                      <span className="font-semibold flex-1">{patient.province_name}</span>
                    </div>
                  )}
                  {patient.region_name && (
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground font-medium min-w-[70px]">Region:</span>
                      <span className="font-semibold flex-1">{patient.region_name}</span>
                    </div>
                  )}
                  {patient.zip_code && (
                    <div className="flex items-start gap-2">
                      <span className="text-muted-foreground font-medium min-w-[70px]">Zip Code:</span>
                      <Badge variant="outline" className="font-mono font-semibold">{patient.zip_code}</Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {recentVisit && (
          <>
            <Separator />
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800">
              <Label className="text-xs text-blue-700 dark:text-blue-400 uppercase tracking-wide flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last Visit
              </Label>
              <p className="font-semibold mt-1">
                {formatDateTime(
                  recentVisit.encounter_date || recentVisit.admdate,
                  recentVisit.encounter_time || recentVisit.admtime
                )}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientInfoCard;
