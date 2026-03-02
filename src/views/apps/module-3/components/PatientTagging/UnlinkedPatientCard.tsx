import { Card, CardContent } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { Link as LinkIcon, Info } from 'lucide-react';
import { SupabasePatient } from './types';
import { getPatientInitials } from './utils';

interface UnlinkedPatientCardProps {
  patient: SupabasePatient;
  onLink: (patient: SupabasePatient) => void;
}

export const UnlinkedPatientCard = ({ patient, onLink }: UnlinkedPatientCardProps) => {
  const initials = getPatientInitials(patient);

  return (
    <Card className="group relative overflow-hidden border-2 bg-card transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-0.5 hover:border-amber-400/50">
      {/* Gradient glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <CardContent className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Avatar with ring */}
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/25 ring-4 ring-amber-500/20">
                <span className="text-lg font-bold">{initials}</span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-amber-400 rounded-full border-2 border-background flex items-center justify-center">
                <LinkIcon className="h-2 w-2 text-white" />
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <p className="font-bold text-lg truncate">
                  {patient.last_name}, {patient.first_name} {patient.middle_name}
                </p>
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                  Pending Link
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                <span className="capitalize font-medium">{patient.sex}</span>
                <span className="text-muted-foreground/50">•</span>
                <span>{patient.birth_date}</span>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                <Info className="h-3 w-3" />
                Ready to link with hospital database
              </p>
            </div>
          </div>
          <Button
            onClick={() => onLink(patient)}
            className="flex-shrink-0 gap-2 shadow-lg shadow-primary/20 group-hover:shadow-primary/30 transition-shadow"
          >
            <LinkIcon className="h-4 w-4" />
            Link to Hospital
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnlinkedPatientCard;
