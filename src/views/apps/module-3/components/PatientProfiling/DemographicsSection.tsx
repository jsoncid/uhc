/**
 * DemographicsSection - Demographics form section (sex, birth date)
 */
import { forwardRef } from 'react';
import CardBox from 'src/components/shared/CardBox';
import { Separator } from 'src/components/ui/separator';
import { Input } from 'src/components/ui/input';
import { Badge } from 'src/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select';
import { Calendar } from 'lucide-react';
import SectionHeader from '../SectionHeader';
import FormField from '../FormField';
import type { PatientProfile } from './types';

interface DemographicsSectionProps {
  patient: PatientProfile;
  ageDisplay: string | null;
  onInputChange: (key: keyof PatientProfile) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSexChange: (value: string) => void;
}

export const DemographicsSection = forwardRef<HTMLDivElement, DemographicsSectionProps>(
  ({ patient, ageDisplay, onInputChange, onSexChange }, ref) => {
    return (
      <div ref={ref} id="demographics-section">
        <CardBox className="p-6">
          <SectionHeader
            icon={Calendar}
            title="Demographics"
            description="Biological and demographic information."
          />
          <Separator className="my-5" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField label="Sex" htmlFor="sex" required>
              <Select value={patient.sex} onValueChange={onSexChange}>
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
              <div className="space-y-2">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input
                    id="birth-date"
                    type="date"
                    value={patient.birth_date}
                    onChange={onInputChange('birth_date')}
                    className="pl-10"
                  />
                </div>
                {ageDisplay && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-xs font-normal">
                      {ageDisplay}
                    </Badge>
                  </div>
                )}
              </div>
            </FormField>
          </div>
        </CardBox>
      </div>
    );
  }
);

DemographicsSection.displayName = 'DemographicsSection';

export default DemographicsSection;
