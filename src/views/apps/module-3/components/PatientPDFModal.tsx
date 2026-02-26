import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'src/components/ui/dialog';
import { Button } from 'src/components/ui/button';
import { Separator } from 'src/components/ui/separator';
import {
  Download,
  Printer,
  FileText,
  ZoomIn,
  ZoomOut,
  Loader2,
} from 'lucide-react';
import patientService from 'src/services/patientService';

interface PatientPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
  hpercode?: string;
}

export const PatientPDFModal = ({ isOpen, onClose, patient, hpercode }: PatientPDFModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPdfUrl(null);
      setErrorMessage(null);
      setZoom(100);
      setIsLoading(false);
      return;
    }

    if (!hpercode) {
      setErrorMessage('HPERCODE is required to fetch the electronic patient record.');
      setPdfUrl(null);
      setIsLoading(false);
      return;
    }

    let isActive = true;
    let objectUrl: string | null = null;

    const fetchPdf = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setPdfUrl(null);

      try {
        const result = await patientService.getPatientRecordPdf(hpercode);
        if (!isActive) {
          return;
        }

        if (result.success && result.pdfBlob) {
          objectUrl = URL.createObjectURL(result.pdfBlob);
          setPdfUrl(objectUrl);
        } else {
          setErrorMessage(
            result.message || 'Unable to load the electronic patient record for this patient.',
          );
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Something went wrong while loading the patient record.',
          );
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    fetchPdf();

    return () => {
      isActive = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [isOpen, hpercode]);

  const handlePrint = () => {
    if (!pdfUrl) return;

    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;

    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `medical-record-${patient?.first_name}-${patient?.last_name}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Medical Records - {patient?.first_name} {patient?.last_name}
          </DialogTitle>
          <DialogDescription>
            View, print, or download the patient's medical records
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 py-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 50 || !pdfUrl}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[60px] text-center">{zoom}%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 200 || !pdfUrl}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint} className="gap-2" disabled={!pdfUrl || isLoading}>
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button onClick={handleDownload} className="gap-2" disabled={!pdfUrl || isLoading}>
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>

        <Separator />

        {/* PDF Viewer */}
        <div className="flex-1 overflow-auto bg-muted/20 rounded-md p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading document...</span>
            </div>
          ) : errorMessage ? (
            <div className="flex flex-col items-center justify-center gap-3 h-full text-center">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground max-w-[420px]">
                {errorMessage}
              </p>
            </div>
          ) : pdfUrl ? (
            <div className="w-full h-full flex items-center justify-center">
              <iframe
                src={pdfUrl}
                className="w-full h-[600px] border rounded-md bg-white"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top center',
                }}
                title="Medical Records PDF"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No electronic patient record is available yet.
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-xs text-muted-foreground pt-2">
          <p>
            <strong>Patient ID:</strong> {patient?.id} |{' '}
            <strong>HPERCODE:</strong> {hpercode ?? 'N/A'} |{' '}
            <strong>Date Generated:</strong> {new Date().toLocaleDateString()}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};