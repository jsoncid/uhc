import { useState } from 'react';
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

interface PatientPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: any;
}

export const PatientPDFModal = ({ isOpen, onClose, patient }: PatientPDFModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [zoom, setZoom] = useState(100);

  // Sample PDF URL - Replace with actual patient medical records PDF URL
  const pdfUrl = '/sample-medical-record.pdf'; // This would come from your backend/storage

  const handlePrint = () => {
    // Open PDF in new window for printing
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleDownload = () => {
    // Create a temporary link element to trigger download
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
              disabled={zoom <= 50}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[60px] text-center">
              {zoom}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 200}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button onClick={handleDownload} className="gap-2">
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
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {/* PDF Viewer using iframe */}
              <iframe
                src={pdfUrl}
                className="w-full h-[600px] border rounded-md bg-white"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top center',
                }}
                title="Medical Records PDF"
                onLoad={() => setIsLoading(false)}
              />
              
              {/* Alternative: Display message if PDF is not available */}
              {/* <div className="text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Medical Record Preview</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Patient: {patient?.first_name} {patient?.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  PDF document would be displayed here
                </p>
                <div className="mt-6 p-4 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground">
                    Note: Replace the pdfUrl variable in PatientPDFModal.tsx with the actual URL
                    from your backend or file storage service (e.g., Supabase Storage, AWS S3)
                  </p>
                </div>
              </div> */}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-xs text-muted-foreground pt-2">
          <p>
            <strong>Patient ID:</strong> {patient?.id} | 
            <strong className="ml-2">Date Generated:</strong> {new Date().toLocaleDateString()}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
