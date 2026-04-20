/**
 * LocationSection - Location form section with PSGC cascading selects
 */
import { forwardRef } from 'react';
import CardBox from 'src/components/shared/CardBox';
import { Separator } from 'src/components/ui/separator';
import { Input } from 'src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select';
import { MapPin } from 'lucide-react';
import SectionHeader from '../SectionHeader';
import FormField from '../FormField';
import type { PSGCRegion, PSGCEntity } from 'src/services/psgcService';
import type { PatientProfile } from './types';

interface LocationSectionProps {
  patient: PatientProfile;
  onInputChange: (key: keyof PatientProfile) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  // PSGC data
  regions: PSGCRegion[];
  provinces: PSGCEntity[];
  cities: PSGCEntity[];
  barangays: PSGCEntity[];
  // Selected codes
  selectedRegionCode: string;
  selectedProvinceCode: string;
  selectedCityCode: string;
  selectedBrgyCode: string;
  // Loading states
  isLoadingRegions: boolean;
  isLoadingProvinces: boolean;
  isLoadingCities: boolean;
  isLoadingBarangays: boolean;
  // Handlers
  onRegionChange: (value: string) => void;
  onProvinceChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onBrgyChange: (value: string) => void;
}

export const LocationSection = forwardRef<HTMLDivElement, LocationSectionProps>(
  ({
    patient,
    onInputChange,
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
    onRegionChange,
    onProvinceChange,
    onCityChange,
    onBrgyChange,
  }, ref) => {
    return (
      <div ref={ref} id="location-section">
        <CardBox className="p-6">
          <SectionHeader
            icon={MapPin}
            title="Location"
            description="Geographic assignment and barangay link using PSGC."
          />
          <Separator className="my-5" />

          {/* Region and Province */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <FormField label="Region" htmlFor="region" required>
              <Select value={selectedRegionCode} onValueChange={onRegionChange}>
                <SelectTrigger id="region" className="w-full">
                  <SelectValue placeholder={isLoadingRegions ? "Loading regions..." : "Select Region"} />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region.code} value={region.code}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Province" htmlFor="province">
              <Select
                value={selectedProvinceCode}
                onValueChange={onProvinceChange}
                disabled={provinces.length === 0 && !isLoadingProvinces}
              >
                <SelectTrigger id="province" className="w-full">
                  <SelectValue placeholder={isLoadingProvinces ? "Loading provinces..." : "Select Province"} />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((province) => (
                    <SelectItem key={province.code} value={province.code}>
                      {province.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {/* City and Barangay */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <FormField label="City / Municipality" htmlFor="city" required>
              <Select
                value={selectedCityCode}
                onValueChange={onCityChange}
                disabled={cities.length === 0 && !isLoadingCities}
              >
                <SelectTrigger id="city" className="w-full">
                  <SelectValue placeholder={isLoadingCities ? "Loading cities..." : "Select City"} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.code} value={city.code}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Barangay" htmlFor="barangay" required>
              <Select
                value={selectedBrgyCode}
                onValueChange={onBrgyChange}
                disabled={barangays.length === 0 && !isLoadingBarangays}
              >
                <SelectTrigger id="barangay" className="w-full">
                  <SelectValue placeholder={isLoadingBarangays ? "Loading barangays..." : "Select Barangay"} />
                </SelectTrigger>
                <SelectContent>
                  {barangays.map((brgy) => (
                    <SelectItem key={brgy.code} value={brgy.code}>
                      {brgy.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          {/* Street Address */}
          <div>
            <FormField label="Street Address" htmlFor="street">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  id="street"
                  value={patient.street || ''}
                  onChange={onInputChange('street')}
                  placeholder="e.g. 123 Main St., Building A"
                  className="pl-10"
                />
              </div>
            </FormField>
          </div>
        </CardBox>
      </div>
    );
  }
);

LocationSection.displayName = 'LocationSection';

export default LocationSection;
