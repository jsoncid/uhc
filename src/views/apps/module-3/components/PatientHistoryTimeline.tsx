import { Badge } from 'src/components/ui/badge';
import { Clock, FileText, Activity, ArrowRight, Stethoscope, Pill, UserCircle, Loader2, History as HistoryIcon } from 'lucide-react';
import { PatientHistory } from 'src/services/patientService';
import { cn } from 'src/lib/utils';
import { formatDateTime } from '../utils/dateFormatters';
import { getAdmissionType, getRecordTypeIcon, getRecordTypeColor, getStatusBadge } from '../utils/patientHelpers';

interface PatientHistoryTimelineProps {
  history: PatientHistory[];
  isLoading: boolean;
}

const PatientHistoryTimeline = ({ history, isLoading }: PatientHistoryTimelineProps) => {
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
    <div className="relative">
      <div className="absolute left-5 top-6 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 via-primary/30 to-transparent" />
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
        {history.map((record) => (
          <div key={record.enccode} className="relative flex gap-4 group">
            {/* Timeline Dot */}
            <div className="relative z-10 flex-shrink-0">
              <div className={cn(
                "p-2 rounded-xl shadow-md transition-all duration-200",
                "group-hover:scale-105 group-hover:shadow-lg",
                getRecordTypeColor(record)
              )}>
                {getRecordTypeIcon(record)}
              </div>
            </div>

            {/* Content Card */}
            <div className="flex-1 pb-3">
              <div className={cn(
                "border rounded-xl p-4 transition-all duration-200 bg-card",
                "hover:shadow-lg hover:border-primary/50"
              )}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h4 className="font-bold text-base">{getAdmissionType(record)}</h4>
                      {getStatusBadge(record.admstat)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {record.admdate && (
                        <span>Admitted: {formatDateTime(record.admdate, record.admtime)}</span>
                      )}
                      {record.disdate && (
                        <>
                          <ArrowRight className="h-3 w-3" />
                          <span>Discharged: {formatDateTime(record.disdate, record.distime)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Details */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Case Number</p>
                        <p className="font-semibold truncate">{record.casenum || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Encounter Code</p>
                        <p className="font-mono text-xs font-semibold truncate">{record.enccode}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Diagnosis & Treatment */}
                {(record.admtxt || record.diagfin || record.diagcode) && (
                  <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-start gap-2 mb-2">
                      <Stethoscope className="h-4 w-4 text-amber-700 dark:text-amber-400 mt-0.5" />
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                        Diagnosis Information
                      </p>
                    </div>
                    {record.admtxt && (
                      <div className="mb-2">
                        <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">Admission Text:</p>
                        <p className="text-sm text-amber-900 dark:text-amber-200">{record.admtxt}</p>
                      </div>
                    )}
                    {record.diagcode && (
                      <div className="mb-2">
                        <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">Diagnosis Code:</p>
                        <Badge variant="outline" className="font-mono">{record.diagcode}</Badge>
                      </div>
                    )}
                    {record.diagfin && (
                      <div>
                        <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">Final Diagnosis:</p>
                        <p className="text-sm text-amber-900 dark:text-amber-200">{record.diagfin}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Treatment */}
                {record.treatment && (
                  <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <div className="flex items-start gap-2 mb-2">
                      <Pill className="h-4 w-4 text-purple-700 dark:text-purple-400 mt-0.5" />
                      <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase tracking-wide">
                        Treatment
                      </p>
                    </div>
                    <p className="text-sm text-purple-900 dark:text-purple-200">{record.treatment}</p>
                  </div>
                )}

                {/* Condition & Disposition */}
                {(record.condcode || record.dispcode) && (
                  <div className="mb-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-start gap-2 mb-3">
                      <Activity className="h-4 w-4 text-green-700 dark:text-green-400 mt-0.5" />
                      <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">
                        Condition & Disposition
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {record.condcode && (
                        <div>
                          <p className="text-xs text-green-600 dark:text-green-500 font-medium">Condition</p>
                          <Badge variant="secondary" className="font-semibold">{record.condcode}</Badge>
                        </div>
                      )}
                      {record.dispcode && (
                        <div>
                          <p className="text-xs text-green-600 dark:text-green-500 font-medium">Disposition</p>
                          <Badge variant="secondary" className="font-semibold">{record.dispcode}</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Encounter Details */}
                {(record.encounter_casetype || record.encounter_cf4attendprov || record.encounter_date || record.encounter_toecode) && (
                  <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-start gap-2 mb-3">
                      <Activity className="h-4 w-4 text-blue-700 dark:text-blue-400 mt-0.5" />
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                        Encounter Details
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {record.encounter_date && (
                        <div>
                          <p className="text-xs text-blue-600 dark:text-blue-500 font-medium">Date & Time</p>
                          <p className="text-sm font-semibold">{formatDateTime(record.encounter_date, record.encounter_time)}</p>
                        </div>
                      )}
                      {record.encounter_casetype && (
                        <div>
                          <p className="text-xs text-blue-600 dark:text-blue-500 font-medium">Case Type</p>
                          <Badge variant="secondary">{record.encounter_casetype}</Badge>
                        </div>
                      )}
                      {record.encounter_toecode && (
                        <div>
                          <p className="text-xs text-blue-600 dark:text-blue-500 font-medium">Type</p>
                          <Badge variant="secondary">{record.encounter_toecode}</Badge>
                        </div>
                      )}
                      {record.encounter_cf4attendprov && (
                        <div>
                          <p className="text-xs text-blue-600 dark:text-blue-500 font-medium">Provider</p>
                          <p className="text-sm font-semibold">{record.encounter_cf4attendprov}</p>
                        </div>
                      )}
                    </div>
                    {(record.encounter_sopcode1 || record.encounter_sopcode2 || record.encounter_sopcode3) && (
                      <div className="mt-3">
                        <p className="text-xs text-blue-600 dark:text-blue-500 font-medium mb-1">Service Codes</p>
                        <div className="flex flex-wrap gap-1">
                          {[record.encounter_sopcode1, record.encounter_sopcode2, record.encounter_sopcode3]
                            .filter(Boolean)
                            .map((code, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{code}</Badge>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes */}
                {(record.admnotes || record.disnotes) && (
                  <div className="p-3 bg-muted/50 border rounded-lg space-y-2">
                    {record.admnotes && (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Admission Notes
                          </p>
                        </div>
                        <p className="text-sm leading-relaxed">{record.admnotes}</p>
                      </div>
                    )}
                    {record.disnotes && (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Discharge Notes
                          </p>
                        </div>
                        <p className="text-sm leading-relaxed">{record.disnotes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer */}
                {record.entryby && (
                  <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" />
                      <span>Recorded by: <span className="font-semibold">{record.entryby}</span></span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientHistoryTimeline;
