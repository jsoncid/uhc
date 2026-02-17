'use client';

import { useState, useRef, ChangeEvent } from 'react';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { Card } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import { AlertCircle, Barcode, History } from 'lucide-react';

interface ScannedCard {
  id: string;
  qrData: string;
  scanTime: string;
  memberName: string;
}

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    title: 'UHC OPERATOR',
  },
];

const UhcOperator = () => {
  const [scanHistory, setScanHistory] = useState<ScannedCard[]>([]);
  const [currentScan, setCurrentScan] = useState<ScannedCard | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleQRUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      
      // Simulate QR code scanning (in real implementation, use qr-scanner library)
      try {
        const scannedData = `Health_Card_${Date.now()}`;
        const memberName = `Member_${Math.floor(Math.random() * 10000)}`;
        
        const newScan: ScannedCard = {
          id: Date.now().toString(),
          qrData: scannedData,
          scanTime: new Date().toLocaleString(),
          memberName: memberName,
        };

        setCurrentScan(newScan);
        setScanHistory([newScan, ...scanHistory]);
        setErrorMessage('');
      } catch (error) {
        setErrorMessage('Failed to scan QR code. Please try again.');
      }
    };

    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <BreadcrumbComp title="UHC Operator - QR Scanner" items={BCrumb} />

      <div className="flex flex-col gap-6">
        <Tabs defaultValue="scanner" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scanner">QR Scanner</TabsTrigger>
            <TabsTrigger value="history">Scan History</TabsTrigger>
          </TabsList>

          {/* Scanner Tab */}
          <TabsContent value="scanner">
            <Card className="p-6">
              <div className="flex flex-col gap-6">
                {/* Scanner Interface */}
                <div className="flex flex-col items-center gap-4">
                  <div className="w-full max-w-sm border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center gap-4 bg-gray-50">
                    <Barcode className="w-12 h-12 text-gray-400" />
                    <div className="text-center">
                      <p className="font-medium text-gray-700">Upload Health Card QR Code</p>
                      <p className="text-sm text-gray-500">
                        Take a photo or upload an image of the QR code
                      </p>
                    </div>
                    <Button onClick={triggerFileInput} className="flex gap-2">
                      <Barcode className="w-4 h-4" />
                      Scan QR Code
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleQRUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <div className="flex gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{errorMessage}</p>
                  </div>
                )}

                {/* Current Scan Display */}
                {currentScan && (
                  <div className="border rounded-lg p-6 bg-blue-50 border-blue-200">
                    <h3 className="font-semibold text-lg mb-4 text-blue-900">
                      Current Scan
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Member Name</p>
                        <p className="font-medium text-gray-900">{currentScan.memberName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">QR Data</p>
                        <p className="font-medium text-gray-900 truncate">
                          {currentScan.qrData}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">Scanned At</p>
                        <p className="font-medium text-gray-900">{currentScan.scanTime}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4 italic">
                      View Only - Operator cannot modify or delete scanned data
                    </p>
                  </div>
                )}

                {!currentScan && !errorMessage && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No scan yet</p>
                    <p className="text-sm">Click the button above to scan a health card QR code</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card className="p-6">
              <div className="flex flex-col gap-4">
                <h3 className="font-semibold text-lg">Scan History</h3>

                {scanHistory.length > 0 ? (
                  <div className="space-y-3">
                    {scanHistory.map((scan) => (
                      <div
                        key={scan.id}
                        className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-gray-600">Member</p>
                            <p className="font-medium text-gray-900">{scan.memberName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">QR Data</p>
                            <p className="font-medium text-gray-800 truncate">
                              {scan.qrData}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Scanned At</p>
                            <p className="font-medium text-gray-900">{scan.scanTime}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No scan history yet</p>
                    <p className="text-sm">Scanned QR codes will appear here</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default UhcOperator;
