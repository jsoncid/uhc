import { Badge } from 'src/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'src/components/ui/table';
import { Loader2, History as HistoryIcon } from 'lucide-react';
import { PatientHistory } from 'src/services/patientService';
import { formatDateOnly } from '../utils/dateFormatters';
import { getEncounterType, getStatusBadge } from '../utils/patientHelpers';

interface PatientHistoryTableProps {
  history: PatientHistory[];
  isLoading: boolean;
}

const PatientHistoryTable = ({ history, isLoading }: PatientHistoryTableProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-sm text-muted-foreground">Loading patient history...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-lg">
        <div className="bg-muted rounded-full p-4 w-fit mx-auto mb-3">
          <HistoryIcon className="h-12 w-12 text-muted-foreground opacity-50" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No History Records Found</h3>
        <p className="text-sm text-muted-foreground">There are no medical records matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm">
      <div className="max-h-[600px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-bold">Encounter</TableHead>
              <TableHead className="font-bold">Admission</TableHead>
              <TableHead className="font-bold">Discharge</TableHead>
              <TableHead className="font-bold">Diagnosis</TableHead>
              <TableHead className="font-bold">Condition</TableHead>
              <TableHead className="font-bold">Disposition</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold">Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((record) => (
              <TableRow 
                key={record.enccode}
                className="hover:bg-muted/30 transition-colors"
              >
                <TableCell className="font-semibold">
                  <Badge variant="outline" className="font-semibold text-xs">
                    {getEncounterType(record)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {formatDateOnly(record.admdate)}
                </TableCell>
                <TableCell className="text-sm">
                  {record.disdate ? (
                    formatDateOnly(record.disdate)
                  ) : (
                    <Badge variant="default" className="bg-orange-500">
                      Active
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    {record.admtxt || record.diagfin || record.diagcode ? (
                      <div className="truncate" title={record.admtxt || record.diagfin || record.diagcode}>
                        {record.admtxt || record.diagfin || record.diagcode}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {record.condcode ? (
                    <Badge variant="outline" className="font-semibold">{record.condcode}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {record.dispcode ? (
                    <Badge variant="outline" className="font-semibold">{record.dispcode}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(record.admstat)}</TableCell>
                <TableCell>
                  <div className="max-w-xs">
                    {record.admnotes || record.disnotes ? (
                      <div className="truncate text-sm" title={record.admnotes || record.disnotes}>
                        {record.admnotes || record.disnotes}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PatientHistoryTable;
