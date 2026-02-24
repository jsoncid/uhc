import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'src/components/ui/dialog';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select';
import { Card, CardContent } from 'src/components/ui/card';
import { Badge } from 'src/components/ui/badge';
import { Alert, AlertDescription } from 'src/components/ui/alert';
import { Separator } from 'src/components/ui/separator';
import {
  Search,
  User,
  Building2,
  Link as LinkIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import patientService, { PatientProfileWithLocations as PatientProfile, Facility } from 'src/services/patientService';

interface PatientLinkingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supabasePatient: {
    id: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    sex: string;
    birth_date: string;
  } | null;
  onLinkSuccess?: () => void;
}

export const PatientLinkingDialog = ({
  open,
  onOpenChange,
  supabasePatient,
  onLinkSuccess,
}: PatientLinkingDialogProps) => {
  // State
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [mysqlSearchResults, setMysqlSearchResults] = useState<PatientProfile[]>([]);
  const [selectedMysqlPatient, setSelectedMysqlPatient] = useState<PatientProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load facilities on mount
  useEffect(() => {
    if (open) {
      loadFacilities();
      // Reset state when dialog opens
      setSearchTerm('');
      setMysqlSearchResults([]);
      setSelectedMysqlPatient(null);
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  const loadFacilities = async () => {
    try {
      const result = await patientService.getFacilities();
      if (result.success) {
        // Combine facilities from both databases
        const allFacilities = [
          ...result.database1.data.map(f => ({ ...f, database: result.database1.name })),
          ...result.database2.data.map(f => ({ ...f, database: result.database2.name })),
        ];
        setFacilities(allFacilities);
      }
    } catch (err) {
      console.error('Error loading facilities:', err);
    }
  };

  const handleSearchMySQL = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a search term');
      return;
    }

    setIsSearching(true);
    setError(null);
    try {
      const result = await patientService.searchPatients(searchTerm, {
        facility: selectedFacility || undefined,
        limit: 10,
      });

      if (result.success && result.data) {
        setMysqlSearchResults(result.data);
        if (result.data.length === 0) {
          setError('No patients found in MySQL database with that search term');
        }
      } else {
        setError(result.message || 'Failed to search patients');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search patients');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLink = async () => {
    if (!supabasePatient || !selectedMysqlPatient) {
      setError('Please select a MySQL patient to link');
      return;
    }

    setIsLinking(true);
    setError(null);
    try {
      const result = await patientService.linkPatientToMySQL(
        supabasePatient.id,
        selectedMysqlPatient.hpercode!,
        selectedFacility || undefined
      );

      if (result.success) {
        setSuccess(true);
        // Wait a moment to show success message
        setTimeout(() => {
          onLinkSuccess?.();
          onOpenChange(false);
        }, 1500);
      } else {
        setError(result.message || 'Failed to link patient');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link patient');
    } finally {
      setIsLinking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSearching) {
      handleSearchMySQL();
    }
  };

  if (!supabasePatient) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-primary" />
            Link Patient to MySQL Database
          </DialogTitle>
          <DialogDescription>
            Connect this manually entered patient profile with an existing patient record in the MySQL
            database (Hospital Information System).
          </DialogDescription>
        </DialogHeader>

        {/* Success Message */}
        {success && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-900/10">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              Patient successfully linked! The profile now has access to hospital records.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && !success && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Supabase Patient Info */}
          <div>
            <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Manually Entered Patient (Supabase)
            </Label>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-lg">
                      {supabasePatient.last_name}, {supabasePatient.first_name}{' '}
                      {supabasePatient.middle_name}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="capitalize">{supabasePatient.sex}</span>
                      <span>•</span>
                      <span>{supabasePatient.birth_date}</span>
                    </div>
                  </div>
                  <Badge variant="outline">Supabase</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-center py-2">
            <ArrowRight className="h-8 w-8 text-muted-foreground" />
          </div>

          <Separator />

          {/* Facility Selection */}
          <div>
            <Label htmlFor="facility" className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4" />
              Facility (Optional)
            </Label>
            <div className="flex gap-2">
              <Select value={selectedFacility} onValueChange={setSelectedFacility}>
                <SelectTrigger id="facility">
                  <SelectValue placeholder="Select a facility to filter results" />
                </SelectTrigger>
                <SelectContent>
                  {facilities.map((facility) => (
                    <SelectItem key={facility.facility_code} value={facility.facility_code}>
                      {facility.facility_name} ({facility.patient_count} patients)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedFacility && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSelectedFacility('')}
                  title="Clear facility filter"
                >
                  ✕
                </Button>
              )}
            </div>
          </div>

          {/* MySQL Patient Search */}
          <div>
            <Label htmlFor="search" className="flex items-center gap-2 mb-2">
              <Search className="h-4 w-4" />
              Search Hospital Database (MySQL)
            </Label>
            <div className="flex gap-2">
              <Input
                id="search"
                placeholder="Enter patient name or HPERCODE..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button onClick={handleSearchMySQL} disabled={isSearching}>
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
          </div>

          {/* MySQL Search Results */}
          {mysqlSearchResults.length > 0 && (
            <div>
              <Label className="mb-2">Select Hospital Patient to Link</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {mysqlSearchResults.map((patient) => (
                  <Card
                    key={patient.hpercode}
                    className={`cursor-pointer transition-all ${
                      selectedMysqlPatient?.hpercode === patient.hpercode
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedMysqlPatient(patient)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">
                            {patient.last_name}, {patient.first_name} {patient.middle_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                              {patient.hpercode}
                            </span>
                            <span className="capitalize">{patient.sex}</span>
                            <span>•</span>
                            <span>{patient.birth_date}</span>
                          </div>
                          {patient.facility_code && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Facility: {patient.facility_code}
                            </p>
                          )}
                        </div>
                        {selectedMysqlPatient?.hpercode === patient.hpercode && (
                          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLinking}>
            Cancel
          </Button>
          <Button
            onClick={handleLink}
            disabled={!selectedMysqlPatient || isLinking || success}
          >
            {isLinking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Linking...
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Linked!
              </>
            ) : (
              <>
                <LinkIcon className="h-4 w-4 mr-2" />
                Link Patient
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PatientLinkingDialog;
