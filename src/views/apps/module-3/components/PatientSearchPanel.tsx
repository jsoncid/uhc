import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Badge } from 'src/components/ui/badge';
import { Search, Loader2, UserCircle, Calendar, User, Building2, ChevronRight, X } from 'lucide-react';
import { PatientProfileWithLocations as PatientProfile } from 'src/services/patientService';
import { cn } from 'src/lib/utils';
import { formatDate, calculateAge } from '../utils/dateFormatters';

interface PatientSearchPanelProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onSearch: () => void;
  isSearching: boolean;
  searchResults: PatientProfile[];
  onSelectPatient: (patient: PatientProfile) => void;
  onClearResults: () => void;
}

const PatientSearchPanel = ({
  searchTerm,
  onSearchTermChange,
  onSearch,
  isSearching,
  searchResults,
  onSelectPatient,
  onClearResults,
}: PatientSearchPanelProps) => {
  return (
    <Card className="border shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Search className="h-5 w-5 text-primary" />
          </div>
          Patient Search
        </CardTitle>
        <CardDescription>
          Search by patient name, HPERCODE, or other identifiers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label htmlFor="search" className="mb-2 block text-sm font-medium">
              Enter Search Term
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Type patient name or HPERCODE..."
                value={searchTerm}
                onChange={(e) => onSearchTermChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                className="pl-10 h-10"
              />
            </div>
          </div>
          <Button 
            onClick={onSearch} 
            disabled={isSearching || !searchTerm.trim()}
            className="h-10 px-6"
          >
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-xs text-muted-foreground">
                Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearResults}
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden shadow-sm">
              <div className="max-h-[350px] overflow-y-auto">
                {searchResults.map((patient) => (
                  <div
                    key={patient.id}
                    className={cn(
                      "p-3 hover:bg-primary/5 cursor-pointer transition-all duration-200 border-b last:border-b-0",
                      "hover:shadow-sm"
                    )}
                    onClick={() => onSelectPatient(patient)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="bg-gradient-to-br from-primary to-primary/70 p-2 rounded-lg shadow-sm">
                          <UserCircle className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-base mb-1">
                            {patient.first_name} {patient.middle_name} {patient.last_name} {patient.ext_name}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(patient.birth_date)}
                              <Badge variant="outline" className="ml-1">
                                {calculateAge(patient.birth_date)} yrs
                              </Badge>
                            </span>
                            <span className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5" />
                              {patient.sex === 'M' ? 'Male' : patient.sex === 'F' ? 'Female' : patient.sex}
                            </span>
                            {patient.hpercode && (
                              <Badge variant="secondary" className="font-mono">
                                {patient.hpercode}
                              </Badge>
                            )}
                            {patient.facility_code && (
                              <span className="flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5" />
                                {patient.facility_code}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientSearchPanel;
