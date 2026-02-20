import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'src/components/ui/select';
import { Clock, FileText, Filter, History as HistoryIcon, Activity, CheckCircle2 } from 'lucide-react';
import { PatientHistory } from 'src/services/patientService';
import PatientHistoryTimeline from './PatientHistoryTimeline';
import PatientHistoryTable from './PatientHistoryTable';

interface PatientHistoryTabsProps {
  history: PatientHistory[];
  isLoading: boolean;
  viewMode: 'timeline' | 'table';
  onViewModeChange: (mode: 'timeline' | 'table') => void;
  typeFilter: string;
  onTypeFilterChange: (filter: string) => void;
}

const PatientHistoryTabs = ({
  history,
  isLoading,
  viewMode,
  onViewModeChange,
  typeFilter,
  onTypeFilterChange,
}: PatientHistoryTabsProps) => {
  const uniqueTypes = [
    { value: 'admission', label: 'Admission' },
    { value: 'discharge', label: 'Discharge' },
  ];

  return (
    <Card className="border shadow-md">
      <CardHeader className="pb-3 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-gradient-to-br from-primary to-primary/70 p-2.5 rounded-xl shadow-md">
            <HistoryIcon className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base mb-0.5">Patient History</CardTitle>
            <CardDescription>Medical records and encounters</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs value={viewMode} onValueChange={(v: string) => onViewModeChange(v as 'timeline' | 'table')} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="grid w-[300px] grid-cols-2">
              <TabsTrigger value="timeline" className="data-[state=active]:bg-primary">
                <Clock className="h-4 w-4 mr-2" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="table" className="data-[state=active]:bg-primary">
                <FileText className="h-4 w-4 mr-2" />
                Table
              </TabsTrigger>
            </TabsList>

            {/* Enhanced Filters */}
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={typeFilter} onValueChange={onTypeFilterChange}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <HistoryIcon className="h-4 w-4" />
                      All Records
                    </div>
                  </SelectItem>
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        {type.value === 'admission' && <Activity className="h-4 w-4" />}
                        {type.value === 'discharge' && <CheckCircle2 className="h-4 w-4" />}
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="timeline" className="mt-0">
            <PatientHistoryTimeline history={history} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="table" className="mt-0">
            <PatientHistoryTable history={history} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PatientHistoryTabs;
