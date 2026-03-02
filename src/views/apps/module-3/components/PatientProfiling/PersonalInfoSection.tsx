/**
 * PersonalInfoSection - Personal information form section
 */
import { forwardRef } from 'react';
import CardBox from 'src/components/shared/CardBox';
import { Separator } from 'src/components/ui/separator';
import { Input } from 'src/components/ui/input';
import { User } from 'lucide-react';
import SectionHeader from '../SectionHeader';
import FormField from '../FormField';
import type { PatientProfile } from './types';

interface PersonalInfoSectionProps {
  patient: PatientProfile;
  onInputChange: (key: keyof PatientProfile) => (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const PersonalInfoSection = forwardRef<HTMLDivElement, PersonalInfoSectionProps>(
  ({ patient, onInputChange }, ref) => {
    return (
      <div ref={ref} id="personal-section">
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
                onChange={onInputChange('first_name')}
                placeholder="Juan"
                className="capitalize"
              />
            </FormField>

            <FormField label="Middle Name" htmlFor="middle-name">
              <Input
                id="middle-name"
                value={patient.middle_name}
                onChange={onInputChange('middle_name')}
                placeholder="Santos"
                className="capitalize"
              />
            </FormField>

            <FormField label="Last Name" htmlFor="last-name" required>
              <Input
                id="last-name"
                value={patient.last_name}
                onChange={onInputChange('last_name')}
                placeholder="Dela Cruz"
                className="capitalize"
              />
            </FormField>

            <FormField label="Extension" htmlFor="ext-name" hint="Suffix such as Jr., Sr., III">
              <Input
                id="ext-name"
                value={patient.ext_name}
                onChange={onInputChange('ext_name')}
                placeholder="Jr., III"
              />
            </FormField>
          </div>
        </CardBox>
      </div>
    );
  }
);

PersonalInfoSection.displayName = 'PersonalInfoSection';

export default PersonalInfoSection;
