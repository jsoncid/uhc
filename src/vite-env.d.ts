/// <reference types="vite/client" />

interface PrinterInfo {
  name: string;
  description?: string;
  paperSize?: string;
}

interface PrinterProvider {
  query(): Promise<PrinterInfo[]>;
}

interface Navigator {
  printerProvider?: PrinterProvider;
}
