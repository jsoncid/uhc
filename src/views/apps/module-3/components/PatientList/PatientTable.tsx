/**
 * PatientTable - Table displaying the list of patients with sorting and pagination
 */
import { Card, CardContent } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'src/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'src/components/ui/tooltip';
import {
  User,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  Calendar,
  MapPin,
  Loader2,
  Building2,
  ArrowUpDown,
  RefreshCw,
  LinkIcon,
} from 'lucide-react';
import { PatientWithRepository, SortColumn } from './types';
import { PatientAvatar } from './PatientAvatar';
import { LinkStatusIndicator } from './LinkStatusIndicator';
import { QuickActions } from './QuickActions';
import { calculateAge, formatDate, getLocationString, getFacility } from './utils';

interface PatientTableProps {
  patients: PatientWithRepository[];
  isLoading: boolean;
  searchTerm: string;
  activeFiltersLength: number;
  selectedPatientId?: string;
  sortColumn: SortColumn;
  currentPage: number;
  totalPages: number;
  totalPatients: number;
  toggleSort: (column: SortColumn) => void;
  handleSelectPatient: (patient: PatientWithRepository) => void;
  handleQuickView: (patient: PatientWithRepository) => void;
  handleQuickTag: (patient: PatientWithRepository) => void;
  handleQuickViewRecords: (patient: PatientWithRepository) => void;
  handlePreviousPage: () => void;
  handleNextPage: () => void;
  clearAllFilters: () => void;
}

const getSexBadge = (sex: string) => {
  const sexUpper = sex?.toUpperCase() || '';
  const isMale = sexUpper === 'M' || sexUpper === 'MALE';
  const isFemale = sexUpper === 'F' || sexUpper === 'FEMALE';

  return (
    <Badge
      variant={isMale ? 'default' : isFemale ? 'secondary' : 'outline'}
      className="text-xs font-medium"
    >
      {isMale ? 'male' : isFemale ? 'female' : sex}
    </Badge>
  );
};

export const PatientTable = ({
  patients,
  isLoading,
  searchTerm,
  activeFiltersLength,
  selectedPatientId,
  sortColumn,
  currentPage,
  totalPages,
  totalPatients,
  toggleSort,
  handleSelectPatient,
  handleQuickView,
  handleQuickTag,
  handleQuickViewRecords,
  handlePreviousPage,
  handleNextPage,
  clearAllFilters,
}: PatientTableProps) => {
  return (
    <Card className="border-2">
      <CardContent className="p-0">
        {/* Table Section */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <span className="mt-4 text-base text-muted-foreground font-medium">Loading patient records...</span>
          </div>
        ) : patients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="p-4 bg-muted/50 rounded-full mb-4">
              <User className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <p className="text-xl font-semibold text-foreground">
              No patients found
            </p>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              {searchTerm || activeFiltersLength > 0
                ? 'No patients match your search criteria. Try adjusting your search terms or clear the filters.'
                : 'There are no patient records in the system yet. Patients will appear here once they are added.'}
            </p>
            {(searchTerm || activeFiltersLength > 0) && (
              <Button variant="outline" onClick={clearAllFilters} className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b-2 bg-muted/30">
                    <TableHead className="font-semibold text-foreground h-12 w-10">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center justify-center">
                            <LinkIcon className="h-4 w-4" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>Link Status</TooltipContent>
                      </Tooltip>
                    </TableHead>
                    <TableHead className="font-semibold text-foreground h-12">
                      <button 
                        onClick={() => toggleSort('name')}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        <UserCircle className="h-4 w-4" />
                        Patient Name
                        <ArrowUpDown className={`h-3 w-3 ${sortColumn === 'name' ? 'text-primary' : 'text-muted-foreground'}`} />
                      </button>
                    </TableHead>
                    <TableHead className="font-semibold text-foreground h-12">Sex</TableHead>
                    <TableHead className="font-semibold text-foreground h-12">
                      <button 
                        onClick={() => toggleSort('birth_date')}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        <Calendar className="h-4 w-4" />
                        Date of Birth
                        <ArrowUpDown className={`h-3 w-3 ${sortColumn === 'birth_date' ? 'text-primary' : 'text-muted-foreground'}`} />
                      </button>
                    </TableHead>
                    <TableHead className="font-semibold text-foreground h-12">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Facility
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-foreground h-12">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-foreground h-12 w-28 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => {
                    const isLinked = patient.patient_repository?.some(r => r.hpercode) || false;
                    const linkCount = patient.patient_repository?.filter(r => r.hpercode).length || 0;
                    const age = calculateAge(patient.birth_date);
                    
                    return (
                      <TableRow
                        key={patient.id}
                        className={`cursor-pointer hover:bg-muted/50 transition-all duration-200 group border-b ${selectedPatientId === patient.id ? 'bg-primary/10 hover:bg-primary/15' : ''}`}
                        onClick={() => handleSelectPatient(patient)}
                      >
                        {/* Link Status */}
                        <TableCell className="py-3">
                          <LinkStatusIndicator isLinked={isLinked} linkCount={linkCount} />
                        </TableCell>
                        
                        {/* Patient Name with Avatar */}
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <PatientAvatar patient={patient} />
                            <div className="min-w-0">
                              <div className="font-semibold text-foreground truncate">
                                {patient.last_name}, {patient.first_name} {patient.middle_name?.[0] ? patient.middle_name[0] + '.' : ''}
                                {patient.ext_name ? ` ${patient.ext_name}` : ''}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ID: {patient.id?.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        
                        {/* Sex Badge */}
                        <TableCell className="py-3">
                          {getSexBadge(patient.sex)}
                        </TableCell>
                        
                        {/* Date of Birth with Age */}
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-foreground">
                              {formatDate(patient.birth_date)}
                            </span>
                            {age && (
                              <Badge variant="outline" className="text-xs font-normal">
                                {age}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        
                        {/* Facility */}
                        <TableCell className="py-3">
                          <div className="flex items-start gap-2 max-w-[180px]">
                            <span className="text-sm font-medium text-foreground leading-relaxed block whitespace-normal break-words">
                              {getFacility(patient)}
                            </span>
                          </div>
                        </TableCell>
                        
                        {/* Location */}
                        <TableCell className="py-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-start gap-2 max-w-[200px]">
                                <span className="text-sm text-muted-foreground leading-relaxed truncate">
                                  {getLocationString(patient)}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-xs">
                              {getLocationString(patient)}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        
                        {/* Quick Actions */}
                        <TableCell className="py-3 text-right">
                          <QuickActions
                            onView={() => handleQuickView(patient)}
                            onTag={() => handleQuickTag(patient)}
                            onViewRecords={() => handleQuickViewRecords(patient)}
                            isLinked={isLinked}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {!searchTerm && totalPages > 1 && (
              <div className="border-t bg-muted/30 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground font-medium">
                    Showing page <span className="font-semibold text-foreground">{currentPage}</span> of <span className="font-semibold text-foreground">{totalPages}</span> ({totalPatients.toLocaleString()} total {totalPatients === 1 ? 'patient' : 'patients'})
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="default"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="default"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PatientTable;
