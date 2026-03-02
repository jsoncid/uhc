/**
 * SearchAndFilters - Search bar and filter controls for patient list
 */
import { RefObject } from 'react';
import { Card, CardContent } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select';
import {
  Search,
  User,
  Loader2,
  RefreshCw,
  LinkIcon,
  Link2,
  Link2Off,
} from 'lucide-react';
import { FilterChip } from './FilterChip';
import { ActiveFilter, PatientWithRepository } from './types';

interface SearchAndFiltersProps {
  searchInputRef: RefObject<HTMLInputElement | null>;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  isSearching: boolean;
  sexFilter: string;
  linkedFilter: string;
  activeFilters: ActiveFilter[];
  filteredAndSortedPatients: PatientWithRepository[];
  totalPatients: number;
  currentPage: number;
  totalPages: number;
  handleSexFilterChange: (value: string) => void;
  handleLinkedFilterChange: (value: string) => void;
  removeFilter: (id: string) => void;
  clearAllFilters: () => void;
  handleReset: () => void;
}

export const SearchAndFilters = ({
  searchInputRef,
  searchTerm,
  setSearchTerm,
  isSearching,
  sexFilter,
  linkedFilter,
  activeFilters,
  filteredAndSortedPatients,
  totalPatients,
  currentPage,
  totalPages,
  handleSexFilterChange,
  handleLinkedFilterChange,
  removeFilter,
  clearAllFilters,
  handleReset,
}: SearchAndFiltersProps) => {
  return (
    <Card className="border-2 overflow-hidden">
      <CardContent className="p-0">
        {/* Main Search Bar */}
        <div className="p-4 bg-muted/30 border-b">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search by patient name... (Press '/' to focus)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 pr-10 h-11 text-base bg-background"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
            </div>

            {/* Filter Dropdowns */}
            <Select value={sexFilter} onValueChange={handleSexFilterChange}>
              <SelectTrigger className="w-[130px] h-11">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Sex" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sexes</SelectItem>
                <SelectItem value="male">
                  <span className="flex items-center gap-2">♂ Male</span>
                </SelectItem>
                <SelectItem value="female">
                  <span className="flex items-center gap-2">♀ Female</span>
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={linkedFilter} onValueChange={handleLinkedFilterChange}>
              <SelectTrigger className="w-[150px] h-11">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Link Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="linked">
                  <span className="flex items-center gap-2">
                    <Link2 className="h-3.5 w-3.5 text-green-600" />
                    Linked
                  </span>
                </SelectItem>
                <SelectItem value="unlinked">
                  <span className="flex items-center gap-2">
                    <Link2Off className="h-3.5 w-3.5 text-amber-500" />
                    Not Linked
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>

            {(searchTerm || activeFilters.length > 0) && (
              <Button
                variant="outline"
                onClick={handleReset}
                size="lg"
                className="px-4 h-11"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Chips */}
        {activeFilters.length > 0 && (
          <div className="px-4 py-3 flex items-center gap-2 flex-wrap border-b bg-background">
            <span className="text-sm text-muted-foreground font-medium">Active Filters:</span>
            {activeFilters.map((filter) => (
              <FilterChip key={filter.id} filter={filter} onRemove={removeFilter} />
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground hover:text-foreground ml-2"
            >
              Clear All
            </Button>
          </div>
        )}

        {/* Results Summary Bar */}
        <div className="px-4 py-2 flex items-center justify-between text-sm bg-background border-b">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filteredAndSortedPatients.length}</span> of{' '}
              <span className="font-semibold text-foreground">{totalPatients}</span> patients
            </span>
            {linkedFilter === 'all' && (
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  {filteredAndSortedPatients.filter(p => p.patient_repository?.some(r => r.hpercode)).length} linked
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  {filteredAndSortedPatients.filter(p => !p.patient_repository?.some(r => r.hpercode)).length} unlinked
                </span>
              </div>
            )}
          </div>
          {!searchTerm && totalPages > 1 && (
            <span className="text-muted-foreground">
              Page <span className="font-medium text-foreground">{currentPage}</span> of{' '}
              <span className="font-medium text-foreground">{totalPages}</span>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchAndFilters;
