import { Card, CardContent } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { CheckCircle2, Edit, Trash2, History as HistoryIcon, Plus } from 'lucide-react';
import { SupabasePatient, PatientRepository, PatientToLink } from './types';
import { getPatientInitials } from './utils';

interface LinkedPatientCardProps {
  patient: SupabasePatient;
  onViewHistory: (patient: SupabasePatient) => void;
  onAddLink: (patient: SupabasePatient) => void;
  onEditLink: (patient: PatientToLink) => void;
  onUnlink: (repositoryId: string, hpercode: string, patientName: string) => void;
}

export const LinkedPatientCard = ({
  patient,
  onViewHistory,
  onAddLink,
  onEditLink,
  onUnlink,
}: LinkedPatientCardProps) => {
  const initials = getPatientInitials(patient);
  const patientFullName = `${patient.last_name}, ${patient.first_name}`;
  const repositoryCount = patient.patient_repository?.length || 0;

  const handleEditLink = (repo: PatientRepository) => {
    onEditLink({
      ...patient,
      editingRepositoryId: repo.id,
      editingHpercode: repo.hpercode || undefined,
      editingFacilityCode: repo.facility_code,
    });
  };

  return (
    <Card className="group relative overflow-hidden border-2 bg-card transition-all duration-300 hover:shadow-xl hover:shadow-green-500/5 hover:-translate-y-0.5 hover:border-green-400/50">
      {/* Gradient glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Avatar with status ring */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg shadow-green-500/25 ring-4 ring-green-500/20">
                <span className="text-lg font-bold">{initials}</span>
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
                  Linked ({repositoryCount})
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                <span className="capitalize font-medium">{patient.sex}</span>
                <span className="text-muted-foreground/50">•</span>
                <span>{patient.birth_date}</span>
              </div>

              {/* Repository links */}
              <div className="flex flex-col gap-2">
                {patient.patient_repository?.map((repo, index) => (
                  <div
                    key={repo.id || index}
                    className="flex items-center gap-2 text-xs flex-wrap p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
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
                        onClick={() => handleEditLink(repo)}
                        title="Edit this link"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() =>
                          onUnlink(repo.id, repo.hpercode || '', patientFullName)
                        }
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
              onClick={() => onViewHistory(patient)}
              className="flex-shrink-0 gap-2 shadow-md shadow-primary/20"
            >
              <HistoryIcon className="h-4 w-4" />
              View History
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAddLink(patient)}
              className="flex-shrink-0 gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Link
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LinkedPatientCard;
