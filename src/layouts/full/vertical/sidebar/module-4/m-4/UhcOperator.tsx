'use client';

import { useEffect, useRef, useState, useCallback, ChangeEvent } from 'react';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { Card } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import {
  AlertCircle, History, X, QrCode, Search, Upload, FileText,
  ChevronDown, ChevronRight, CheckCircle2, User, Building2, Heart,
  Accessibility, ClipboardList, IdCard, Loader2, Eye, Calendar, Clock,
  Download, Printer, Save, Stethoscope, Camera, CameraOff, RefreshCw,
  Lock, EyeOff, ShieldCheck, ShieldX, ArrowLeft, Tag,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import QRCodeLib from 'qrcode';
import jsPDF from 'jspdf';
import { supabase } from 'src/lib/supabase';

// ─── Document Type Options per Folder ────────────────────────────────────────
const FOLDER_DOC_TYPES: Record<string, string[]> = {
  basic_identification: [
    'Birth Certificate', 'Barangay Certification', 'Barangay Clearance',
    'Certificate of Indigency', 'Valid ID', 'Government ID',
    'Marriage Certificate (if applicable)', 'Others',
  ],
  philhealth: ['PhilHealth ID', 'PhilHealth Member Data Record (MDR)', 'Others'],
  senior_pwd: ['Senior Citizen ID', 'PWD ID', 'OSCA Booklet', 'Others'],
  company_documents: ['Company ID', 'Certificate of Employment', 'Incident Report', 'Others'],
  medical_documents: ["Doctor's Referral Slip", 'Laboratory Result', 'X-Ray Result / Ultrasound', 'Medical Certificate', 'Others'],
  admission_requirements: ['Admission Form', 'Surgery Consent', 'Promissory Note', 'Others'],
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface RegionRecord           { id?: string; description?: string; }
interface ProvinceRecord         { id?: string; description?: string; region?: RegionRecord; }
interface CityMunicipalityRecord { id?: string; description?: string; province?: ProvinceRecord; }
interface BrgyRecord             { id?: string; description?: string; city_municipality?: CityMunicipalityRecord; }

interface PatientProfile {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  ext_name?: string;
  sex?: string;
  birth_date?: string;
  brgy?: BrgyRecord | string;
}

interface UploadedFile {
  name: string;
  url: string;
  pdfUrl: string;
  type: string;
  uploadedAt: string;
  saved: boolean;
  saving: boolean;
  folderKey: string;
  docType: string;
  localFile?: File;
}

interface DocumentFolder {
  id: string;
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  supabaseCategory: string;
  bucketFolder: string;
  files: UploadedFile[];
}

interface ScannedCard {
  id: string;
  qrData: string;
  scanTime: string;
  memberName: string;
  patient?: PatientProfile;
  qrCodeDataUrl?: string;
}

interface PendingUpload {
  file: File;
  folderKey: string;
  folderLabel: string;
}

interface DocumentAttachment {
  id: string;
  attachment: string;
  category: string;
  status: boolean;
}

interface ScanResult {
  qrValue: string;
  scanTime: string;
  patient: PatientProfile;
  documents: DocumentAttachment[];
  qrCodeDataUrl?: string;
  healthCardId?: string;
  fromHistory?: boolean;
}

// ─── PIN Types ────────────────────────────────────────────────────────────────
type PinVerifyStatus = 'idle' | 'checking' | 'verified' | 'failed' | 'no_pin';

interface PinVerifyState {
  status: PinVerifyStatus;
  attemptsLeft: number;
  isLocked: boolean;
}

interface PendingPatientPin {
  patient: PatientProfile;
  healthCardId: string | null;
  hasPin: boolean;
}



// ─── Folder Definitions ───────────────────────────────────────────────────────
const FOLDER_DEFS = [
  { key: 'basic_identification',   label: 'Basic Identification',   description: 'Government-issued IDs, birth certificate, and personal identification documents.', color: 'blue',   supabaseCategory: 'Basic Identification',   bucketFolder: 'Basic Identification',   icon: <IdCard        className="w-5 h-5" /> },
  { key: 'philhealth',             label: 'PhilHealth',             description: 'PhilHealth membership documents, MDR, and contribution records.',                   color: 'red',    supabaseCategory: 'PhilHealth',             bucketFolder: 'PhilHealth',             icon: <Heart         className="w-5 h-5" /> },
  { key: 'senior_pwd',             label: 'Senior / PWD',           description: 'Senior citizen ID, PWD ID, and OSCA booklet.',                                      color: 'purple', supabaseCategory: 'Senior/PWD',             bucketFolder: 'Senior or PWD',          icon: <Accessibility className="w-5 h-5" /> },
  { key: 'company_documents',      label: 'Company Employee',       description: 'Company ID, Certificate of Employment, and Incident Report.',                       color: 'amber',  supabaseCategory: 'Company Documents',      bucketFolder: 'Company Documents',      icon: <Building2     className="w-5 h-5" /> },
  { key: 'medical_documents',      label: 'Medical Documents',      description: "Doctor's referral, laboratory results, X-ray, and medical certificates.",           color: 'green',  supabaseCategory: 'Medical Documents',      bucketFolder: 'Medical Documents',      icon: <Stethoscope   className="w-5 h-5" /> },
  { key: 'admission_requirements', label: 'Admission Requirements', description: 'Admission form, surgery consent, and promissory note.',                             color: 'teal',   supabaseCategory: 'Admission Requirements', bucketFolder: 'Admission Requirements', icon: <ClipboardList className="w-5 h-5" /> },
];

type ColorKey = 'blue' | 'red' | 'purple' | 'amber' | 'green' | 'teal' | 'gray';
const COLOR_MAP: Record<ColorKey, { bg: string; border: string; text: string; badge: string }> = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700'    },
  red:    { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700'      },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  amber:  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700'  },
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700'  },
  teal:   { bg: 'bg-teal-50',   border: 'border-teal-200',   text: 'text-teal-700',   badge: 'bg-teal-100 text-teal-700'   },
  gray:   { bg: 'bg-gray-50',   border: 'border-gray-200',   text: 'text-gray-700',   badge: 'bg-gray-100 text-gray-700'   },
};

const CATEGORY_COLORS: Record<string, ColorKey> = {
  'Basic Identification':   'blue',
  'PhilHealth':             'red',
  'Senior/PWD':             'purple',
  'Company Documents':      'amber',
  'Medical Documents':      'green',
  'Admission Requirements': 'teal',
};

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'QR Scanner' }];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fullName = (p: PatientProfile) =>
  [p.first_name, p.middle_name, p.last_name, p.ext_name].filter(Boolean).join(' ');

const generateUniqueQrCode = (patientId: string): string => {
  const frag = patientId.replace(/-/g, '').substring(0, 12).toUpperCase();
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `UHC-${frag}-${ts}-${rand}`;
};

const getFullAddress = (brgy: PatientProfile['brgy']): string => {
  if (!brgy) return '';
  if (typeof brgy === 'string') return brgy;
  const parts: string[] = [];
  if (brgy.description) parts.push(brgy.description);
  const city = brgy.city_municipality;
  if (city?.description) parts.push(city.description);
  const prov = city?.province;
  if (prov?.description) parts.push(prov.description);
  if (prov?.region?.description) parts.push(prov.region.description);
  return parts.join(', ');
};



// ─── Image → PDF ──────────────────────────────────────────────────────────────
const imageToPdfBlobUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const dataUrl = ev.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const pdf     = new jsPDF({ orientation: img.width > img.height ? 'landscape' : 'portrait', unit: 'px', format: 'a4' });
          const pageW   = pdf.internal.pageSize.getWidth();
          const pageH   = pdf.internal.pageSize.getHeight();
          const ratio   = Math.min(pageW / img.width, pageH / img.height);
          const drawW   = img.width * ratio;
          const drawH   = img.height * ratio;
          const offsetX = (pageW - drawW) / 2;
          const offsetY = (pageH - drawH) / 2;
          const ext     = (file.type === 'image/png' ? 'PNG' : 'JPEG') as 'PNG' | 'JPEG';
          pdf.addImage(dataUrl, ext, offsetX, offsetY, drawW, drawH);
          resolve(URL.createObjectURL(pdf.output('blob')));
        };
        img.onerror = reject;
        img.src = dataUrl;
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// ─── PDF Preview Modal ────────────────────────────────────────────────────────
const PdfPreviewModal = ({ url, name, onClose }: { url: string; name: string; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-green-600" />
          <p className="font-semibold text-gray-900 text-sm">{name}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <div className="flex-1 overflow-hidden bg-gray-100">
        <iframe src={url} className="w-full h-full border-0" title={name} />
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
        <Button variant="outline" onClick={onClose} className="flex gap-2"><X className="w-4 h-4" /> Close</Button>
        <Button variant="outline" className="flex gap-2 border-green-300 text-green-700 hover:bg-green-50"
          onClick={() => {
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none'; iframe.src = url;
            document.body.appendChild(iframe);
            iframe.onload = () => { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); };
          }}>
          <Printer className="w-4 h-4" /> Print
        </Button>
        <Button className="flex gap-2 bg-green-700 hover:bg-green-800"
          onClick={() => { const a = document.createElement('a'); a.href = url; a.download = name; a.click(); }}>
          <Download className="w-4 h-4" /> Download
        </Button>
      </div>
    </div>
  </div>
);

// ─── Display filename: strip UUID + timestamp, use patient name ──────────────
const displayFileName = (rawUrl: string, patientName?: string): string => {
  const base = rawUrl.split('/').pop() ?? 'Document';
  // Pattern: uuid_timestamp_DocType.ext  →  lastname_firstname_DocType.ext
  const match = base.match(/^[0-9a-f-]{36}_\d+_(.+)$/i);
  if (match) {
    const docPart = match[1]; // e.g. Valid_ID.pdf
    if (patientName) return `${patientName}_${docPart}`;
    return docPart;
  }
  return base;
};

// ─── Document List ────────────────────────────────────────────────────────────
const DocumentList = ({ documents, patientName }: { documents: DocumentAttachment[]; patientName?: string }) => {
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [previewDoc,  setPreviewDoc]  = useState<DocumentAttachment | null>(null);

  const grouped = documents.reduce<Record<string, DocumentAttachment[]>>((acc, doc) => {
    const cat = doc.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {});

  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No documents uploaded for this patient yet.</p>
      </div>
    );
  }

  return (
    <>
      {previewDoc && (
        <PdfPreviewModal url={previewDoc.attachment} name={previewDoc.category} onClose={() => setPreviewDoc(null)} />
      )}
      <div className="flex flex-col gap-2 mt-4">
        {Object.entries(grouped).map(([cat, docs]) => {
          const colorKey = CATEGORY_COLORS[cat] ?? 'gray';
          const colors   = COLOR_MAP[colorKey];
          const isOpen   = expandedCat === cat;
          return (
            <div key={cat} className={`border rounded-xl overflow-hidden ${colors.border}`}>
              <button
                className={`w-full flex items-center justify-between px-4 py-3 ${colors.bg} transition-colors hover:opacity-90`}
                onClick={() => setExpandedCat(isOpen ? null : cat)}
              >
                <div className="flex items-center gap-2">
                  <FileText className={`w-4 h-4 ${colors.text}`} />
                  <span className={`font-semibold text-sm ${colors.text}`}>{cat}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors.badge}`}>
                    {docs.length} file{docs.length > 1 ? 's' : ''}
                  </span>
                </div>
                {isOpen ? <ChevronDown className={`w-4 h-4 ${colors.text}`} /> : <ChevronRight className={`w-4 h-4 ${colors.text}`} />}
              </button>
              {isOpen && (
                <div className="bg-white p-3 border-t flex flex-col gap-2">
                  {docs.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
                      <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{displayFileName(doc.attachment, patientName)}</p>
                        <p className="text-xs text-gray-400">{cat}</p>
                      </div>
                      <Button size="sm" variant="outline" className="flex gap-1.5 text-xs border-green-300 text-green-700 hover:bg-green-50" onClick={() => setPreviewDoc(doc)}>
                        <Eye className="w-3.5 h-3.5" /> View
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// PIN VERIFY MODAL
// Logic:
//  - hasPin=false  → operator CANNOT proceed; member must set PIN first
//  - hasPin=true   → operator must enter correct PIN (hard block, max 3 attempts)
// ══════════════════════════════════════════════════════════════════════════════
interface PinVerifyModalProps {
  patientName: string;
  hasPin: boolean;
  pinState: PinVerifyState;
  onDigitEntry: (pin: string) => void;
  onProceedNoPin?: () => void;   // no longer used — kept for compatibility
  onClose: () => void;
}

const PinVerifyModal = ({
  patientName,
  hasPin,
  pinState,
  onDigitEntry,
  onProceedNoPin: _unused,
  onClose,
}: PinVerifyModalProps) => {
  const [entered,    setEntered]    = useState('');
  const [showDigits, setShowDigits] = useState(false);
  const [shakeKey,   setShakeKey]   = useState(0);

  const { status, attemptsLeft, isLocked } = pinState;

  const handleDigit = (d: string) => {
    if (entered.length >= 4 || status === 'checking' || isLocked || status === 'verified') return;
    const next = entered + d;
    setEntered(next);
    if (next.length === 4) {
      setTimeout(() => { onDigitEntry(next); setEntered(''); }, 120);
    }
  };

  const handleBack = () => {
    if (status === 'checking' || isLocked) return;
    setEntered((p) => p.slice(0, -1));
  };

  // ── Keyboard support ──
  useEffect(() => {
    if (!hasPin) return; // no-pin screen has no entry
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) { handleDigit(e.key); e.preventDefault(); }
      else if (e.key === 'Backspace') { handleBack(); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const prevStatus = useRef<PinVerifyStatus>('idle');
  useEffect(() => {
    if (pinState.status === 'failed' && prevStatus.current !== 'failed') {
      setShakeKey((k) => k + 1);
    }
    prevStatus.current = pinState.status;
  }, [pinState.status]);

  // ── No PIN case: operator CANNOT proceed — member must set PIN first ──────
  if (!hasPin) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
        <style>{`@keyframes pinModalIn{from{opacity:0;transform:scale(0.92) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}.pin-modal-enter{animation:pinModalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)}`}</style>
        <div className="pin-modal-enter bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
          <div className="bg-gradient-to-br from-red-600 to-red-800 px-7 py-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <ShieldX className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-white text-lg leading-none">Access Denied</h2>
              <p className="text-red-200 text-xs mt-1 truncate">{patientName}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="px-7 py-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                <ShieldX className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <p className="font-bold text-red-800 text-base">Member Has No PIN</p>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                  <strong>{patientName.split(' ')[0]}</strong> has not set up a security PIN yet.
                  You cannot access their records until they create one.
                </p>
              </div>
              <div className="w-full p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2 text-left">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700 leading-relaxed">
                  Ask the member to open <strong>My Health Card → My PIN</strong> on their device to set their PIN before you can proceed.
                </p>
              </div>
            </div>
            <Button onClick={onClose} className="w-full mt-6 text-sm bg-gray-800 hover:bg-gray-900 text-white">
              <X className="w-4 h-4 mr-1.5" /> Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Has PIN: hard gate ────────────────────────────────────────────────────
  const headerGradient =
    status === 'verified' ? 'from-green-600 to-green-800' :
    isLocked             ? 'from-red-700 to-red-900'      :
                           'from-green-700 to-green-900';

  const headerTitle =
    status === 'verified' ? 'Access Granted' :
    isLocked             ? 'Access Locked'   :
                           'Member PIN Required';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
      <style>{`
        @keyframes pinModalIn { from { opacity:0; transform:scale(0.92) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes pinShake   { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        .pin-modal-enter { animation: pinModalIn 0.22s cubic-bezier(0.34,1.56,0.64,1); }
        .pin-dots-shake  { animation: pinShake 0.38s ease; }
      `}</style>

      <div className="pin-modal-enter bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-br ${headerGradient} px-7 py-6 flex items-center gap-4`}>
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            {status === 'verified' ? <ShieldCheck className="w-6 h-6 text-white" />
             : isLocked            ? <ShieldX     className="w-6 h-6 text-white" />
             :                       <Lock        className="w-6 h-6 text-white" />}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-white text-lg leading-none">{headerTitle}</h2>
            <p className="text-green-200 text-xs mt-1 truncate">{patientName}</p>
          </div>
          {status !== 'verified' && !isLocked && (
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
          )}
        </div>

        {/* Locked */}
        {isLocked && (
          <div className="px-7 py-6 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
              <ShieldX className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <p className="font-bold text-red-800 text-base">Access Locked</p>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                3 incorrect PIN attempts. Access to this member's records is blocked for this session.
              </p>
            </div>
            <div className="w-full p-3 bg-red-50 border border-red-200 rounded-xl flex gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">Ask the member to verify their PIN and try again.</p>
            </div>
            <Button onClick={onClose} className="w-full text-sm bg-gray-800 hover:bg-gray-900 text-white">
              <X className="w-4 h-4 mr-1.5" /> Close
            </Button>
          </div>
        )}

        {/* Verified */}
        {status === 'verified' && (
          <div className="px-7 py-10 flex flex-col items-center text-center gap-3">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <p className="font-bold text-gray-800 text-lg">PIN Verified!</p>
            <p className="text-sm text-gray-400">Opening member records…</p>
            <div className="flex gap-1.5 mt-1">
              {[0,1,2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-green-500" style={{ animation: `pinModalIn 0.4s ease ${i * 0.12}s both` }} />
              ))}
            </div>
          </div>
        )}

        {/* PIN Entry */}
        {status !== 'verified' && !isLocked && (
          <div className="px-7 pt-5 pb-7">
            <p className="text-sm text-gray-500 text-center mb-5 leading-relaxed">
              Ask <strong className="text-gray-700">{patientName.split(' ')[0]}</strong> for their{' '}
              <strong className="text-gray-700">4-digit PIN</strong> and enter it below.
            </p>

            {/* PIN Dots */}
            <div
              key={shakeKey}
              className={`flex justify-center gap-4 mb-3 ${shakeKey > 0 ? 'pin-dots-shake' : ''}`}
            >
              {[0,1,2,3].map((i) => (
                <div
                  key={i}
                  className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all duration-150 ${
                    entered.length > i
                      ? status === 'failed' ? 'border-red-400 bg-red-50' : 'border-green-500 bg-green-50'
                      : entered.length === i ? 'border-green-400 bg-white shadow-sm ring-2 ring-green-200'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {entered.length > i && (
                    showDigits
                      ? <span className={`font-bold text-lg ${status === 'failed' ? 'text-red-600' : 'text-green-700'}`}>{entered[i]}</span>
                      : <div className={`w-3 h-3 rounded-full ${status === 'failed' ? 'bg-red-500' : 'bg-green-600'}`} />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowDigits(!showDigits)}
              className="flex items-center gap-1.5 mx-auto mb-4 text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showDigits ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showDigits ? 'Hide' : 'Show'} digits
            </button>

            {status === 'failed' && (
              <div className="mb-4 flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
                <ShieldX className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600">
                  Incorrect PIN. <strong>{attemptsLeft}</strong> attempt{attemptsLeft !== 1 ? 's' : ''} remaining.
                </p>
              </div>
            )}

            {status === 'checking' && (
              <div className="mb-4 flex items-center justify-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
                <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
                <p className="text-xs text-green-700">Verifying PIN…</p>
              </div>
            )}

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d) => (
                <button
                  key={d}
                  disabled={d === '' || status === 'checking'}
                  onClick={() => d === '⌫' ? handleBack() : d !== '' ? handleDigit(d) : undefined}
                  className={`h-12 rounded-xl font-semibold text-lg transition-all active:scale-95 select-none ${
                    d === '' ? 'cursor-default' :
                    d === '⌫' ? 'bg-gray-100 hover:bg-gray-200 text-gray-600 active:bg-gray-300' :
                    'bg-gray-50 hover:bg-green-50 hover:text-green-700 border border-gray-200 hover:border-green-300 text-gray-800 active:bg-green-100'
                  }`}
                >
                  {status === 'checking' && d === '⌫' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : d}
                </button>
              ))}
            </div>

            <Button variant="outline" onClick={onClose} className="w-full text-sm border-gray-300 text-gray-600">
              <X className="w-4 h-4 mr-1.5" /> Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};


const UhcOperator = () => {
  const getCurrentUserAndRole = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { userId: null, roleId: null };

    const { data: userRole } = await supabase
      .from('user_role')
      .select('role')
      .eq('user', user.id)
      .single();

    return {
      userId: user.id,
      roleId: userRole?.role ?? null,
    };
  }, []);
  // ── Document Manager ──────────────────────────────────────────────────────
  const [searchQuery,     setSearchQuery]     = useState('');
  const [searchResults,   setSearchResults]   = useState<PatientProfile[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [isSearching,     setIsSearching]     = useState(false);
  const [folders,         setFolders]         = useState<DocumentFolder[]>(FOLDER_DEFS.map((f, i) => ({ ...f, id: String(i + 1), files: [] })));
  const [expandedFolder,  setExpandedFolder]  = useState<string | null>(null);
  const [generatedQr,     setGeneratedQr]     = useState<string | null>(null);
  const [qrDataUrl,       setQrDataUrl]       = useState<string | null>(null);
  const [isGenerating,    setIsGenerating]    = useState(false);
  const [scanHistory,     setScanHistory]     = useState<ScannedCard[]>([]);
  const [errorMessage,    setErrorMessage]    = useState('');

  const [previewFile,     setPreviewFile]     = useState<UploadedFile | null>(null);
  const [pendingUpload,   setPendingUpload]   = useState<PendingUpload | null>(null);
  const [selectedDocType, setSelectedDocType] = useState('');
  const [customDocType,   setCustomDocType]   = useState('');
  const [isProcessing,    setIsProcessing]    = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // ── Profile picture ────────────────────────────────────────────────────────
  const [profilePicUrl,       setProfilePicUrl]       = useState<string | null>(null);
  const [isUploadingPic,      setIsUploadingPic]      = useState(false);
  const [profilePicError,     setProfilePicError]     = useState('');
  const profilePicInputRef = useRef<HTMLInputElement | null>(null);

  // ── Scanner ───────────────────────────────────────────────────────────────
  const [activeTab,    setActiveTab]    = useState('documents');
  const [cameraActive, setCameraActive] = useState(false);

  // ── Operator mode selection ────────────────────────────────────────────────
  const [operatorMode, setOperatorMode] = useState<'documents' | 'scanner' | 'tagging' | null>(null);
  const [scanLookup,   setScanLookup]   = useState(false);
  const [scanResult,   setScanResult]   = useState<ScanResult | null>(null);
  const [cameraError,  setCameraError]  = useState('');
  const [scanError,    setScanError]    = useState('');

  // ── PIN: QR scanner gate ──────────────────────────────────────────────────
  const [pendingScanResult, setPendingScanResult] = useState<ScanResult | null>(null);
  const [showScanPinModal,  setShowScanPinModal]  = useState(false);
  const [scanPinHasPin,     setScanPinHasPin]     = useState(false);
  const [scanPinState,      setScanPinState]      = useState<PinVerifyState>({
    status: 'idle', attemptsLeft: 3, isLocked: false,
  });

  // ── PIN: patient-select gate ──────────────────────────────────────────────
  const [pendingPatientPin,   setPendingPatientPin]   = useState<PendingPatientPin | null>(null);
  const [showPatientPinModal, setShowPatientPinModal] = useState(false);
  const [patientPinState,     setPatientPinState]     = useState<PinVerifyState>({
    status: 'idle', attemptsLeft: 3, isLocked: false,
  });
  const [isLoadingPatientPin, setIsLoadingPatientPin] = useState(false);

  // ── Scan History (from DB) ───────────────────────────────────────────────
  const [dbScanHistory, setDbScanHistory] = useState<{
    id: string;
    created_at: string;
    qr_code: string;
    patient_name: string;
    health_card: string;
    scanned_by_user?: string | null;
    scanned_by_role?: string | null;
    role_name?: string;
  }[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // ── Scanner instance ──────────────────────────────────────────────────────
  const SCANNER_DIV_ID = 'uhc-qr-camera-root';
  const scannerRef     = useRef<Html5Qrcode | null>(null);
  const qrSuccessRef   = useRef<((text: string) => Promise<void>) | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!scannerRef.current) {
        try { scannerRef.current = new Html5Qrcode(SCANNER_DIV_ID); }
        catch (e) { console.warn('Html5Qrcode init:', e); }
      }
    }, 50);
    return () => clearTimeout(t);
  }, []);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const s = (scannerRef.current as unknown as { _state?: number })._state;
        if (s === 2 || s === 3) await scannerRef.current.stop();
      } catch (e) { console.warn('stopCamera:', e); }
    }
    setCameraActive(false);
  }, []);

  useEffect(() => { if (activeTab !== 'scanner') stopCamera(); }, [activeTab, stopCamera]);
  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  // ── Fetch scan history from DB when tab changes ──────────────────────────
  useEffect(() => {
    if (activeTab !== 'history') return;
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const { data } = await supabase
          .schema('module4')
          .from('scan_history')
          .select(`
            id,
            created_at,
            qr_code,
            patient_name,
            health_card,
            scanned_by_user,
            scanned_by_role
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        // Fetch role descriptions
        const roleIds = [...new Set((data ?? [])
          .map((s: any) => s.scanned_by_role)
          .filter(Boolean))]
          .filter((id): id is string => typeof id === 'string');

        let roleMap: Record<string, string> = {};
        if (roleIds.length > 0) {
          const { data: roles } = await supabase
            .from('role')
            .select('id, description')
            .in('id', roleIds);
          (roles ?? []).forEach((r: any) => { roleMap[r.id] = r.description; });
        }

        // De-duplicate: keep only the latest entry per health_card
        const seen = new Set<string>();
        const unique = (data ?? []).filter((s: any) => {
          const key = s.health_card;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // Map into display-friendly shape
        const mapped = unique.map((s: any) => ({
          ...s,
          role_name: roleMap[s.scanned_by_role] ?? 'Unknown Role',
        }));
        setDbScanHistory(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [activeTab]);


  // ── QR PIN verify ─────────────────────────────────────────────────────────
  const handleScanPinDigitEntry = useCallback(async (enteredPin: string) => {
    if (!pendingScanResult?.healthCardId) return;

    setScanPinState((prev) => ({ ...prev, status: 'checking' }));
    try {
      const { data, error } = await supabase
        .schema('module4')
        .from('health_card')
        .select('pin')
        .eq('id', pendingScanResult.healthCardId)
        .single();

      if (error) throw error;

      if (!data?.pin) {
        // No PIN — proceed directly
        setShowScanPinModal(false);
        setScanResult(pendingScanResult);
        setPendingScanResult(null);
        return;
      }

      if (data.pin === enteredPin) {
        setScanPinState({ status: 'verified', attemptsLeft: 3, isLocked: false });
        setTimeout(() => {
          setShowScanPinModal(false);
          setScanResult(pendingScanResult);
          setPendingScanResult(null);
        }, 1300);
        return;
      }

      // Wrong PIN
      setScanPinState((prev) => {
        const newAttempts = prev.attemptsLeft - 1;
        return { status: 'failed', attemptsLeft: newAttempts, isLocked: newAttempts <= 0 };
      });
    } catch (err) {
      console.error(err);
      setScanPinState((prev) => ({ ...prev, status: 'failed' }));
    }
  }, [pendingScanResult]);

  const handleScanPinProceedNoPin = useCallback(() => {
    if (!pendingScanResult) return;
    setShowScanPinModal(false);
    setScanResult(pendingScanResult);
    setPendingScanResult(null);
  }, [pendingScanResult]);

  const handleCloseScanPinModal = useCallback(() => {
    setShowScanPinModal(false);
    setPendingScanResult(null);
    setScanPinState({ status: 'idle', attemptsLeft: 3, isLocked: false });
  }, []);

  const scanningRef = useRef(false);
  // ── QR success handler ────────────────────────────────────────────────────
  qrSuccessRef.current = async (decodedText: string) => {
    // ── GUARD: prevent duplicate fires ──────────────────────
    if (scanningRef.current) return;
    scanningRef.current = true;
    // ────────────────────────────────────────────────────────

    await stopCamera();
    setScanLookup(true);
    setScanError('');
    setScanResult(null);

    try {
      const qrValue  = decodedText.trim();
      const scanTime = new Date().toLocaleString();

      let patient:      PatientProfile | null = null;
      let documents:    DocumentAttachment[]  = [];
      let healthCardId: string | undefined;
      let cardHasPin:   boolean               = false;

      // Step 1: fetch health_card from module4
      const { data: cardData, error: cardErr } = await supabase
        .schema('module4')
        .from('health_card')
        .select('id, qr_code, pin, patient_profile')
        .eq('qr_code', qrValue)
        .single();

      if (cardErr || !cardData) {
        setScanError(`QR code not found: "${qrValue}". Make sure this QR was generated for an existing patient.`);
        setScanLookup(false);
        return;
      }

      healthCardId = cardData.id as string;
      cardHasPin   = Boolean(cardData.pin);

      // Step 2: fetch patient profile from module3 using the UUID FK
      const patientProfileId = cardData.patient_profile as string;
      const { data: profileData, error: profileErr } = await supabase
        .schema('module3')
        .from('patient_profile')
        .select('id, first_name, middle_name, last_name, ext_name, sex, birth_date')
        .eq('id', patientProfileId)
        .single();

      if (profileErr || !profileData) {
        setScanError('Patient profile not found for this QR code.');
        setScanLookup(false);
        return;
      }

      patient = profileData as unknown as PatientProfile;

      // Step 3: fetch attachments from module4
      const { data: attachments } = await supabase
        .schema('module4')
        .from('card_attachment')
        .select('id, attachment, status, card_category ( description )')
        .eq('health_card', cardData.id)
        .eq('status', true);

      documents = (attachments ?? []).map((a) => {
        const raw = a as {
          id: string; attachment: string; status: boolean;
          card_category: { description?: string } | { description?: string }[] | null;
        };
        const cat = Array.isArray(raw.card_category) ? raw.card_category[0] : raw.card_category;
        return { id: raw.id, attachment: raw.attachment, status: raw.status, category: cat?.description ?? 'Uncategorized' };
      });

      setScanHistory((prev) => [{
        id: Date.now().toString(), qrData: qrValue, scanTime, memberName: fullName(patient!), patient,
      }, ...prev]);

      // Save scan to module4.scan_history
      try {
        const { userId, roleId } = await getCurrentUserAndRole();
        await supabase
          .schema('module4')
          .from('scan_history')
          .insert({
            health_card: healthCardId,
            qr_code: qrValue,
            patient_name: fullName(patient!),
            scanned_by_user: userId,
            scanned_by_role: roleId,
          });
      } catch (histErr) { console.warn('Failed to save scan history:', histErr); }

      const pending: ScanResult = { qrValue, scanTime, patient, documents, healthCardId };
      setPendingScanResult(pending);
      setScanPinHasPin(cardHasPin);
      setScanPinState({ status: 'idle', attemptsLeft: 3, isLocked: false });
      setShowScanPinModal(true);

    } catch (err) {
      console.error(err);
      setScanError('Error looking up QR code. Please try again.');
    } finally {
      setScanLookup(false);
      // NOTE: do NOT reset scanningRef here — the QR scanner fires its
      // callback many times per second.  We only reset it when the user
      // explicitly starts a new scan (startCamera / resetScan).
    }
  };

  const startCamera = useCallback(async () => {
    scanningRef.current = false;          // allow a fresh scan
    setScanError(''); setCameraError('');
    if (!scannerRef.current) {
      try { scannerRef.current = new Html5Qrcode(SCANNER_DIV_ID); }
      catch { setCameraError('Could not initialise scanner. Please refresh the page.'); return; }
    }
    try {
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => { qrSuccessRef.current?.(text); },
        () => {}
      );
      setCameraActive(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCameraError(
        msg.toLowerCase().includes('permission')
          ? 'Camera permission denied. Allow camera access in your browser settings, then try again.'
          : `Could not open camera: ${msg}`
      );
    }
  }, []);

  const resetScan = () => { scanningRef.current = false; setScanResult(null); setScanError(''); setCameraError(''); };

  // ── Search (module3) — flat sequential fetches ────────────────────────────
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true); setErrorMessage(''); setSearchResults([]);
    try {
      // 1. Patient profiles from module3
      const { data: profiles, error: profileError } = await supabase
        .schema('module3').from('patient_profile')
        .select('id, first_name, middle_name, last_name, ext_name, sex, birth_date, brgy')
        .or(`first_name.ilike.%${searchQuery.trim()}%,last_name.ilike.%${searchQuery.trim()}%`)
        .limit(10);
      if (profileError) throw profileError;
      if (!profiles || profiles.length === 0) { setErrorMessage('No patients found. Please check the name and try again.'); return; }

      // 2. Brgy (module3)
      const brgyIds = [...new Set(profiles.map((p: any) => p.brgy).filter(Boolean))];
      let brgyMap: Record<string, any> = {};
      if (brgyIds.length > 0) {
        const { data: brgys } = await supabase.schema('module3').from('brgy')
          .select('id, description, city_municipality').in('id', brgyIds);
        const cityIds = [...new Set((brgys ?? []).map((b: any) => b.city_municipality).filter(Boolean))];
        let cityMap: Record<string, any> = {};
        if (cityIds.length > 0) {
          const { data: cities } = await supabase.schema('module3').from('city_municipality')
            .select('id, description, province').in('id', cityIds);
          const provIds = [...new Set((cities ?? []).map((c: any) => c.province).filter(Boolean))];
          let provMap: Record<string, any> = {};
          if (provIds.length > 0) {
            const { data: provinces } = await supabase.schema('module3').from('province')
              .select('id, description, region').in('id', provIds);
            const regionIds = [...new Set((provinces ?? []).map((p: any) => p.region).filter(Boolean))];
            let regionMap: Record<string, any> = {};
            if (regionIds.length > 0) {
              const { data: regions } = await supabase.schema('module3').from('region')
                .select('id, description').in('id', regionIds);
              (regions ?? []).forEach((r: any) => { regionMap[r.id] = r; });
            }
            (provinces ?? []).forEach((p: any) => { provMap[p.id] = { ...p, region: regionMap[p.region] ?? null }; });
          }
          (cities ?? []).forEach((c: any) => { cityMap[c.id] = { ...c, province: provMap[c.province] ?? null }; });
        }
        (brgys ?? []).forEach((b: any) => { brgyMap[b.id] = { ...b, city_municipality: cityMap[b.city_municipality] ?? null }; });
      }
      const assembled: PatientProfile[] = profiles.map((p: any) => ({ ...p, brgy: brgyMap[p.brgy] ?? null }));
      setSearchResults(assembled);
    } catch (err) {
      console.error('Search error:', err);
      setErrorMessage('Failed to search patients. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // ── Patient select: check module4.health_card for PIN ────────────────────
  // KEY LOGIC:
  //   - If no health_card row exists yet → hasPin=false → operator proceeds freely
  //   - If health_card exists but pin is null/empty → hasPin=false → operator proceeds freely
  //   - If health_card exists and pin is set → hasPin=true → PIN gate (hard block)
  const selectPatient = async (p: PatientProfile) => {
    setSearchResults([]);
    setSearchQuery(`${p.first_name} ${p.last_name}`);
    setErrorMessage('');

    setIsLoadingPatientPin(true);
    try {
      // Query module4.health_card using the patient UUID from module3
      const { data: cardData } = await supabase
        .schema('module4')
        .from('health_card')
        .select('id, pin')
        .eq('patient_profile', p.id)
        .maybeSingle(); // maybeSingle so no error if row doesn't exist

      const healthCardId = cardData?.id ?? null;
      const hasPin       = Boolean(cardData?.pin);

      setPendingPatientPin({ patient: p, healthCardId, hasPin });
      setPatientPinState({ status: 'idle', attemptsLeft: 3, isLocked: false });
      setShowPatientPinModal(true);
    } catch {
      // On error, assume no PIN so operator isn't blocked
      setPendingPatientPin({ patient: p, healthCardId: null, hasPin: false });
      setPatientPinState({ status: 'idle', attemptsLeft: 3, isLocked: false });
      setShowPatientPinModal(true);
    } finally {
      setIsLoadingPatientPin(false);
    }
  };

  // ── Commit patient after PIN cleared ──────────────────────────────────────
  // Load profile pic when patient is selected
  const loadProfilePic = useCallback(async (patientId: string) => {
    setProfilePicUrl(null);
    try {
      const { data: files } = await supabase.storage.from('card-user-picture').list('', { search: patientId });
      const match = files?.find((f) => f.name.startsWith(patientId));
      if (match) {
        const { data: pub } = supabase.storage.from('card-user-picture').getPublicUrl(match.name);
        setProfilePicUrl(pub.publicUrl + '?t=' + Date.now());
      }
    } catch { /* ignore */ }
  }, []);

  const commitPatientSelect = useCallback((p: PatientProfile) => {
    setSelectedPatient(p);
    setGeneratedQr(null);
    setQrDataUrl(null);
    setFolders((prev) => prev.map((f) => ({ ...f, files: [] })));
    setShowPatientPinModal(false);
    setPendingPatientPin(null);
    setPatientPinState({ status: 'idle', attemptsLeft: 3, isLocked: false });
    loadProfilePic(p.id);
  }, [loadProfilePic]);

  // ── Patient PIN digit handler ─────────────────────────────────────────────
  const handlePatientPinDigitEntry = useCallback(async (enteredPin: string) => {
    if (!pendingPatientPin?.healthCardId) return;

    setPatientPinState((prev) => ({ ...prev, status: 'checking' }));
    try {
      const { data, error } = await supabase
        .schema('module4')
        .from('health_card')
        .select('pin')
        .eq('id', pendingPatientPin.healthCardId)
        .single();

      if (error) throw error;

      if (!data?.pin) {
        // No PIN in DB — proceed freely
        commitPatientSelect(pendingPatientPin.patient);
        return;
      }

      if (data.pin === enteredPin) {
        setPatientPinState({ status: 'verified', attemptsLeft: 3, isLocked: false });
        setTimeout(() => commitPatientSelect(pendingPatientPin.patient), 1300);
        return;
      }

      setPatientPinState((prev) => {
        const newAttempts = prev.attemptsLeft - 1;
        return { status: 'failed', attemptsLeft: newAttempts, isLocked: newAttempts <= 0 };
      });
    } catch {
      setPatientPinState((prev) => ({ ...prev, status: 'failed' }));
    }
  }, [pendingPatientPin, commitPatientSelect]);

  // ── Patient PIN: no-PIN proceed ───────────────────────────────────────────
  const handlePatientPinProceedNoPin = useCallback(() => {
    if (!pendingPatientPin) return;
    commitPatientSelect(pendingPatientPin.patient);
  }, [pendingPatientPin, commitPatientSelect]);

  const handleClosePatientPinModal = useCallback(() => {
    setShowPatientPinModal(false);
    setPendingPatientPin(null);
    setPatientPinState({ status: 'idle', attemptsLeft: 3, isLocked: false });
    setSearchQuery('');
  }, []);

  // ── File handling ─────────────────────────────────────────────────────────
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, folderKey: string) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPatient) return;
    const folder = FOLDER_DEFS.find((f) => f.key === folderKey)!;
    setPendingUpload({ file, folderKey, folderLabel: folder.label });
    setSelectedDocType(''); setCustomDocType('');
    if (fileInputRefs.current[folderKey]) fileInputRefs.current[folderKey]!.value = '';
  };

  const handleDocTypeConfirm = async () => {
    if (!pendingUpload || !selectedPatient) return;
    const label = selectedDocType === 'Others' && customDocType.trim() ? customDocType.trim() : selectedDocType;
    if (!label) return;
    const { file, folderKey } = pendingUpload;
    setIsProcessing(true);
    try {
      const isImg  = file.type.startsWith('image/');
      const pdfUrl = isImg ? await imageToPdfBlobUrl(file) : URL.createObjectURL(file);
      const safe   = label.replace(/[^a-zA-Z0-9 _()/-]/g, '').replace(/\s+/g, '_');
      const ext    = isImg ? 'pdf' : (file.name.split('.').pop() ?? 'pdf');
      const nf: UploadedFile = {
        name: `${safe}.${ext}`, url: URL.createObjectURL(file), pdfUrl, type: file.type,
        uploadedAt: new Date().toLocaleString(), saved: false, saving: false, folderKey, docType: label, localFile: file,
      };
      setFolders((prev) => prev.map((f) => f.key === folderKey ? { ...f, files: [...f.files, nf] } : f));
      setPendingUpload(null);
    } catch { setErrorMessage('Failed to process file.'); }
    finally { setIsProcessing(false); }
  };

  const handleDocTypeCancel = () => { setPendingUpload(null); setSelectedDocType(''); setCustomDocType(''); };

  // ── Save file to Supabase (module4) ───────────────────────────────────────
  const handleSaveFile = async (folderKey: string, fileIdx: number) => {
    if (!selectedPatient) return;
    setFolders((prev) => prev.map((f) => f.key === folderKey
      ? { ...f, files: f.files.map((fi, i) => i === fileIdx ? { ...fi, saving: true } : fi) }
      : f
    ));
    try {
      const folder = folders.find((f) => f.key === folderKey)!;
      const entry  = folder.files[fileIdx];

      // Get or create card_category in module4 using the specific doc type (e.g. "Valid ID")
      const categoryLabel = entry.docType;
      let catId: string;
      const { data: ec } = await supabase
        .schema('module4')
        .from('card_category')
        .select('id')
        .eq('description', categoryLabel)
        .single();
      if (ec) {
        catId = ec.id;
      } else {
        const { data: nc, error: ce } = await supabase
          .schema('module4')
          .from('card_category')
          .insert({ description: categoryLabel })
          .select('id')
          .single();
        if (ce) throw ce;
        catId = nc!.id;
      }

      // Get or create health_card in module4 (using patient UUID from module3)
      let hcId: string;
      const { data: ehc } = await supabase
        .schema('module4')
        .from('health_card')
        .select('id')
        .eq('patient_profile', selectedPatient.id)
        .maybeSingle();
      if (ehc) {
        hcId = ehc.id;
      } else {
        const { data: nhc, error: he } = await supabase
          .schema('module4')
          .from('health_card')
          .insert({ patient_profile: selectedPatient.id })
          .select('id')
          .single();
        if (he) throw he;
        hcId = nhc!.id;
      }

      // Upload file to storage
      const blob = await fetch(entry.pdfUrl).then((r) => r.blob());
      const path = `${folder.bucketFolder}/${selectedPatient.id}_${Date.now()}_${entry.name}`;
      const { error: ue } = await supabase.storage
        .from('card-attachments')
        .upload(path, blob, { contentType: 'application/pdf' });
      if (ue) throw ue;

      const { data: pub } = supabase.storage.from('card-attachments').getPublicUrl(path);

      // Insert card_attachment in module4
      await supabase
        .schema('module4')
        .from('card_attachment')
        .insert({ health_card: hcId, attachment: pub.publicUrl, card_category: catId, status: true });

      setFolders((prev) => prev.map((f) => f.key === folderKey
        ? { ...f, files: f.files.map((fi, i) => i === fileIdx
            ? { ...fi, saved: true, saving: false, url: pub.publicUrl, pdfUrl: pub.publicUrl, localFile: undefined }
            : fi)
        }
        : f
      ));
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to save. Please try again.');
      setFolders((prev) => prev.map((f) => f.key === folderKey
        ? { ...f, files: f.files.map((fi, i) => i === fileIdx ? { ...fi, saving: false } : fi) }
        : f
      ));
    }
  };

  // ── Generate QR code (module4) ────────────────────────────────────────────
  const handleGenerateQr = async () => {
    if (!selectedPatient) return;
    setIsGenerating(true); setErrorMessage('');
    try {
      const code = generateUniqueQrCode(selectedPatient.id);
      // Get or create health_card in module4
      const { data: ec } = await supabase
        .schema('module4')
        .from('health_card')
        .select('id')
        .eq('patient_profile', selectedPatient.id)
        .maybeSingle();
      if (ec) {
        await supabase.schema('module4').from('health_card').update({ qr_code: code }).eq('id', ec.id);
      } else {
        await supabase.schema('module4').from('health_card').insert({ patient_profile: selectedPatient.id, qr_code: code });
      }
      const du = await QRCodeLib.toDataURL(code, { width: 256, margin: 2, color: { dark: '#166534', light: '#FFFFFF' } });
      setGeneratedQr(code);
      setQrDataUrl(du);
    } catch { setErrorMessage('Failed to generate QR code.'); }
    finally { setIsGenerating(false); }
  };

  // ── Upload profile picture to card-user-picture bucket ────────────────────
  const handleProfilePicUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPatient) return;
    if (!file.type.startsWith('image/')) { setProfilePicError('Please select an image file (JPG, PNG, etc.).'); return; }
    setIsUploadingPic(true);
    setProfilePicError('');
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${selectedPatient.id}.${ext}`;
      // Remove old picture first (ignore errors — might not exist)
      await supabase.storage.from('card-user-picture').remove([path]);
      const { error: upErr } = await supabase.storage.from('card-user-picture').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('card-user-picture').getPublicUrl(path);
      setProfilePicUrl(pub.publicUrl + '?t=' + Date.now());
    } catch (err: any) {
      console.error('Profile pic upload error:', err);
      setProfilePicError(err.message ?? 'Upload failed.');
    } finally { setIsUploadingPic(false); }
  };

  const totalFiles    = folders.reduce((s, f) => s + f.files.length, 0);
  const pendingFolder = pendingUpload ? FOLDER_DEFS.find((f) => f.key === pendingUpload.folderKey) : null;
  const pendingColors = pendingFolder ? COLOR_MAP[pendingFolder.color as ColorKey] : COLOR_MAP.blue;
  const pendingOptions = pendingUpload ? (FOLDER_DOC_TYPES[pendingUpload.folderKey] ?? []) : [];

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <BreadcrumbComp title="Health Card Operator" items={BCrumb} />

      {/* Floating camera div (never unmounted) */}
      <div
        style={{
          position: 'fixed',
          bottom: cameraActive ? 24 : -9999,
          right: cameraActive ? 24 : -9999,
          width: 320, zIndex: 9998, borderRadius: 16, overflow: 'hidden',
          boxShadow: cameraActive ? '0 8px 40px rgba(0,0,0,0.4)' : 'none',
          border: '3px solid #16a34a', background: '#000',
          transition: 'bottom 0.35s ease, right 0.35s ease',
        }}
        aria-hidden={!cameraActive}
      >
        {cameraActive && (
          <div style={{ background: '#16a34a', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#bbf7d0', display: 'inline-block' }} />
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>Hold QR code in frame…</span>
            </div>
            <button onClick={stopCamera} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', lineHeight: 1, padding: 2 }}>✕</button>
          </div>
        )}
        <div id={SCANNER_DIV_ID} />
      </div>

      {/* Patient-Select PIN Modal */}
      {showPatientPinModal && pendingPatientPin && (
        <PinVerifyModal
          patientName={fullName(pendingPatientPin.patient)}
          hasPin={pendingPatientPin.hasPin}
          pinState={patientPinState}
          onDigitEntry={handlePatientPinDigitEntry}
          onProceedNoPin={handlePatientPinProceedNoPin}
          onClose={handleClosePatientPinModal}
        />
      )}

      {/* QR Scan PIN Modal */}
      {showScanPinModal && pendingScanResult && (
        <PinVerifyModal
          patientName={fullName(pendingScanResult.patient)}
          hasPin={scanPinHasPin}
          pinState={scanPinState}
          onDigitEntry={handleScanPinDigitEntry}
          onProceedNoPin={handleScanPinProceedNoPin}
          onClose={handleCloseScanPinModal}
        />
      )}

      {/* Document type selection modal */}
      {pendingUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className={`px-6 py-5 ${pendingColors.bg} border-b ${pendingColors.border}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`font-bold text-lg ${pendingColors.text}`}>Select Document Type</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Category: <span className="font-semibold">{pendingUpload.folderLabel}</span></p>
                </div>
                <button onClick={handleDocTypeCancel} className="p-1.5 rounded-lg hover:bg-black/10"><X className="w-4 h-4 text-gray-500" /></button>
              </div>
              <div className="mt-3 flex items-center gap-2 bg-white/70 rounded-lg px-3 py-2 border border-white">
                <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-700 truncate">{pendingUpload.file.name}</p>
                  <p className="text-[10px] text-gray-400">{pendingUpload.file.type.startsWith('image/') ? 'Image — will be converted to PDF' : 'PDF document'}</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">What type of document is this?</p>
              <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                {pendingOptions.map((option) => {
                  const sel = selectedDocType === option;
                  return (
                    <button key={option} onClick={() => { setSelectedDocType(option); setCustomDocType(''); }}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium flex items-center gap-3 ${sel ? `${pendingColors.bg} ${pendingColors.border} ${pendingColors.text}` : 'bg-gray-50 border-gray-100 text-gray-700 hover:border-gray-300'}`}>
                      <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${sel ? pendingColors.border : 'border-gray-300'}`}>
                        {sel && <span className={`w-2 h-2 rounded-full ${pendingColors.text.replace('text-', 'bg-')}`} />}
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>
              {selectedDocType === 'Others' && (
                <Input className="mt-3 text-sm" placeholder="Specify document type…" value={customDocType} onChange={(e) => setCustomDocType(e.target.value)} autoFocus />
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <Button variant="outline" onClick={handleDocTypeCancel} className="flex gap-2"><X className="w-4 h-4" /> Cancel</Button>
              <Button disabled={!selectedDocType || (selectedDocType === 'Others' && !customDocType.trim()) || isProcessing}
                onClick={handleDocTypeConfirm} className="flex gap-2 bg-green-700 hover:bg-green-800 text-white">
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isProcessing ? 'Processing…' : 'Confirm & Add'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {previewFile && <PdfPreviewModal url={previewFile.pdfUrl} name={previewFile.name} onClose={() => setPreviewFile(null)} />}

      {scanLookup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-green-600 animate-spin" />
            <p className="font-semibold text-gray-700">Looking up QR code…</p>
            <p className="text-sm text-gray-400">Fetching patient info and documents</p>
          </div>
        </div>
      )}

      {/* ── Main Tabs ── */}
      <div className="flex flex-col gap-6">

        {/* ── Mode selection cards ── */}
        {!operatorMode && (
          <div className="flex flex-col items-center gap-8 py-10">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800">What would you like to do?</h2>
              <p className="text-sm text-gray-500 mt-1">Choose an action to get started</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl">
              {/* Upload Documents Card */}
              <button
                onClick={() => { setOperatorMode('documents'); setActiveTab('documents'); }}
                className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-gray-200 bg-white hover:border-green-500 hover:shadow-xl transition-all duration-200 text-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-green-100 group-hover:bg-green-200 flex items-center justify-center transition-colors">
                  <Upload className="w-10 h-10 text-green-700" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800 group-hover:text-green-700 transition-colors">Upload Documents</p>
                  <p className="text-sm text-gray-500 mt-1">Search for a patient and manage their documents</p>
                </div>
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-green-50 group-hover:bg-green-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <ChevronRight className="w-4 h-4 text-green-600" />
                </div>
              </button>

              {/* Scan QR Code Card */}
              <button
                onClick={() => { setOperatorMode('scanner'); setActiveTab('scanner'); }}
                className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-gray-200 bg-white hover:border-blue-500 hover:shadow-xl transition-all duration-200 text-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
                  <QrCode className="w-10 h-10 text-blue-700" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800 group-hover:text-blue-700 transition-colors">Scan QR Code</p>
                  <p className="text-sm text-gray-500 mt-1">Scan a member's health card QR code</p>
                </div>
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <ChevronRight className="w-4 h-4 text-blue-600" />
                </div>
              </button>

              {/* Member Tagging Card */}
              <button
                onClick={() => { setOperatorMode('tagging'); setActiveTab('tagging'); }}
                className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-gray-200 bg-white hover:border-amber-500 hover:shadow-xl transition-all duration-200 text-center"
              >
                <div className="w-20 h-20 rounded-2xl bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center transition-colors">
                  <Tag className="w-10 h-10 text-amber-700" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800 group-hover:text-amber-700 transition-colors">Member Tagging</p>
                  <p className="text-sm text-gray-500 mt-1">Tag and categorize health card members</p>
                </div>
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <ChevronRight className="w-4 h-4 text-amber-600" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── Tabs (shown after mode selected) ── */}
        {operatorMode && (
        <>
        <button
          onClick={() => { setOperatorMode(null); stopCamera(); }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors w-fit mb-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to menu
        </button>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {operatorMode === 'documents' ? (
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="documents">Document Manager</TabsTrigger>
            </TabsList>
          ) : operatorMode === 'tagging' ? (
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="tagging">Member Tagging</TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scanner">QR Scanner</TabsTrigger>
              <TabsTrigger value="history">Scan History</TabsTrigger>
            </TabsList>
          )}

          {/* ═══ DOCUMENT MANAGER ═══ */}
          <TabsContent value="documents">
            <div className="flex flex-col gap-5">
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                  <Search className="w-5 h-5 text-green-600" /> Search Patient
                </h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by first or last name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch} disabled={isSearching} className="flex gap-2 bg-green-700 hover:bg-green-800">
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Search
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-3 border rounded-lg overflow-hidden divide-y">
                    {searchResults.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => selectPatient(p)}
                        disabled={isLoadingPatientPin}
                        className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors flex items-center gap-3 disabled:opacity-60"
                      >
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs flex-shrink-0">
                          {p.first_name[0]}{p.last_name[0]}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{fullName(p)}</p>
                          <p className="text-xs text-gray-500">{p.sex} · DOB: {p.birth_date} · {getFullAddress(p.brgy)}</p>
                        </div>
                        {isLoadingPatientPin
                          ? <Loader2 className="w-4 h-4 text-green-600 animate-spin flex-shrink-0" />
                          : <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        }
                      </button>
                    ))}
                  </div>
                )}

                {selectedPatient && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {profilePicUrl ? (
                        <img src={profilePicUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-green-300" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-sm">
                          {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-green-900">{fullName(selectedPatient)}</p>
                        </div>
                        <p className="text-xs text-green-600">{selectedPatient.sex} · {selectedPatient.birth_date} · {getFullAddress(selectedPatient.brgy)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <CheckCircle2 className="w-4 h-4" />{totalFiles} file{totalFiles !== 1 ? 's' : ''} added
                    </div>
                  </div>
                )}

                {errorMessage && !selectedPatient && (
                  <div className="mt-3 flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><p>{errorMessage}</p>
                  </div>
                )}
              </Card>

              {/* ── Profile Picture Upload ── */}
              {selectedPatient && (
                <Card className="p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-green-600" /> Profile Picture
                  </h3>
                  <div className="flex items-center gap-6">
                    <div className="relative flex-shrink-0">
                      {profilePicUrl ? (
                        <img src={profilePicUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-green-200 shadow-md" />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-100 border-4 border-dashed border-gray-300 flex items-center justify-center">
                          <User className="w-10 h-10 text-gray-300" />
                        </div>
                      )}
                      {isUploadingPic && (
                        <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-3">
                        Upload a profile photo for <strong>{fullName(selectedPatient)}</strong>. This will appear on their Health ID Card.
                      </p>
                      <Button variant="outline" disabled={isUploadingPic}
                        onClick={() => profilePicInputRef.current?.click()}
                        className="flex gap-2 border-green-300 text-green-700 hover:bg-green-50">
                        <Upload className="w-4 h-4" />
                        {profilePicUrl ? 'Change Photo' : 'Upload Photo'}
                      </Button>
                      <input ref={profilePicInputRef} type="file" accept="image/*" className="hidden"
                        onChange={handleProfilePicUpload} />
                      {profilePicError && (
                        <p className="text-xs text-red-600 mt-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{profilePicError}</p>
                      )}
                    </div>
                  </div>
                </Card>
              )}

              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" /> Document Folders
                </h3>
                {!selectedPatient ? (
                  <div className="text-center py-10 text-gray-400">
                    <User className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>Search and select a patient to manage their documents.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {folders.map((folder) => {
                      const colors = COLOR_MAP[folder.color as ColorKey];
                      const isExp  = expandedFolder === folder.key;
                      return (
                        <div key={folder.key} className={`border rounded-xl overflow-hidden ${colors.border}`}>
                          <button
                            className={`w-full flex items-center gap-4 px-5 py-4 ${colors.bg} transition-colors hover:opacity-90`}
                            onClick={() => setExpandedFolder(isExp ? null : folder.key)}
                          >
                            <span className={colors.text}>{folder.icon}</span>
                            <div className="flex-1 text-left">
                              <p className={`font-semibold ${colors.text}`}>{folder.label}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{folder.description}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              {folder.files.length > 0 && (
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
                                  {folder.files.length} file{folder.files.length > 1 ? 's' : ''}
                                </span>
                              )}
                              {isExp
                                ? <ChevronDown className={`w-4 h-4 ${colors.text}`} />
                                : <ChevronRight className={`w-4 h-4 ${colors.text}`} />}
                            </div>
                          </button>
                          {isExp && (
                            <div className="p-5 border-t bg-white">
                              <p className="text-xs text-gray-400 mb-3 italic">
                                Select a file — you will be asked to identify the document type. Files saved to <strong>{folder.bucketFolder}</strong>.
                              </p>
                              <div
                                className={`border-2 border-dashed ${colors.border} rounded-lg p-6 flex flex-col items-center gap-3 cursor-pointer hover:opacity-80`}
                                onClick={() => fileInputRefs.current[folder.key]?.click()}
                              >
                                <Upload className={`w-8 h-8 ${colors.text} opacity-60`} />
                                <div className="text-center">
                                  <p className={`font-medium text-sm ${colors.text}`}>Click to upload PDF or Image</p>
                                  <p className="text-xs text-gray-400 mt-0.5">PDF, JPG, PNG — images auto-converted to PDF</p>
                                </div>
                                <input
                                  ref={(el) => { fileInputRefs.current[folder.key] = el; }}
                                  type="file" accept=".pdf,image/*" className="hidden"
                                  onChange={(e) => handleFileChange(e, folder.key)}
                                />
                              </div>
                              {folder.files.length > 0 && (
                                <div className="mt-4 flex flex-col gap-2">
                                  {folder.files.map((file, idx) => (
                                    <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg border ${file.saved ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                                      <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-800 truncate">{file.docType}</p>
                                        <p className="text-xs text-gray-400">{file.uploadedAt}</p>
                                      </div>
                                      {file.saved && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex-shrink-0">
                                          <CheckCircle2 className="w-3 h-3" /> Saved
                                        </span>
                                      )}
                                      <button onClick={() => setPreviewFile(file)} className="p-1 rounded hover:bg-gray-200 flex-shrink-0">
                                        <Eye className="w-4 h-4 text-gray-400 hover:text-green-600" />
                                      </button>
                                      {!file.saved && (
                                        <Button size="sm" disabled={file.saving}
                                          className="bg-green-700 hover:bg-green-800 text-white text-xs flex gap-1.5 px-3 min-w-[72px] flex-shrink-0"
                                          onClick={() => handleSaveFile(folder.key, idx)}>
                                          {file.saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                          {file.saving ? 'Saving…' : 'Save'}
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {errorMessage && (
                                <div className="mt-3 flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><p>{errorMessage}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {selectedPatient && (
                <Card className="p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-green-600" /> Generate QR Code
                  </h3>
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 mb-4">
                        Generate a unique, permanent QR code for <strong>{fullName(selectedPatient)}</strong>.
                      </p>
                      <Button onClick={handleGenerateQr} disabled={isGenerating} className="bg-green-700 hover:bg-green-800 flex gap-2">
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                        {isGenerating ? 'Generating…' : generatedQr ? 'Regenerate QR Code' : 'Generate QR Code'}
                      </Button>
                      {generatedQr && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border text-xs font-mono text-gray-700 break-all">
                          <p className="text-xs text-gray-400 mb-1">QR Code Value:</p>{generatedQr}
                        </div>
                      )}
                      {errorMessage && selectedPatient && (
                        <div className="mt-3 flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" /><p>{errorMessage}</p>
                        </div>
                      )}
                    </div>
                    {qrDataUrl && (
                      <div className="flex flex-col items-center gap-3">
                        <div className="p-4 bg-white border-4 border-green-700 rounded-2xl shadow-lg">
                          <img src={qrDataUrl} alt="Generated QR Code" className="w-40 h-40" />
                        </div>
                        <a
                          href={qrDataUrl}
                          download={`QR_${selectedPatient.last_name}_${selectedPatient.first_name}.png`}
                          className="flex items-center gap-1 text-sm text-green-700 hover:underline font-medium"
                        >
                          <Download className="w-4 h-4" /> Download QR
                        </a>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ═══ SCANNER TAB ═══ */}
          <TabsContent value="scanner">
            <div className="flex flex-col gap-5">
              {!scanResult ? (
                <Card className="p-6">
                  <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-green-600" /> QR Code Scanner
                  </h3>
                  <div className="mb-5 flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <Lock className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-800">PIN verification</p>
                      <p className="text-xs text-green-600 mt-0.5 leading-relaxed">
                        If the member has set a PIN, you must ask them for it before viewing their records.
                        If no PIN is set yet, you can still proceed — but remind them to set one.
                      </p>
                    </div>
                  </div>

                  <div className={`w-full max-w-md mx-auto rounded-xl border-2 transition-all ${cameraActive ? 'border-green-500 bg-green-50' : 'border-dashed border-gray-300 bg-gray-50'}`} style={{ minHeight: 180 }}>
                    <div className="flex flex-col items-center justify-center h-44 gap-3">
                      {cameraActive ? (
                        <>
                          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                            <Camera className="w-7 h-7 text-green-600" />
                          </div>
                          <p className="font-semibold text-green-700 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse inline-block" />
                            Camera is active
                          </p>
                          <p className="text-xs text-gray-500 text-center max-w-xs">See the floating window (bottom-right). Hold the QR code steady.</p>
                        </>
                      ) : (
                        <>
                          <CameraOff className="w-12 h-12 text-gray-300" />
                          <p className="text-sm text-gray-400">Camera is off</p>
                        </>
                      )}
                    </div>
                  </div>

                  {cameraError && (
                    <div className="mt-4 flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><p>{cameraError}</p>
                    </div>
                  )}
                  {scanError && (
                    <div className="mt-4 flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><p>{scanError}</p>
                    </div>
                  )}

                  <div className="mt-5 flex justify-center gap-3">
                    {!cameraActive ? (
                      <Button onClick={startCamera} className="flex gap-2 bg-green-700 hover:bg-green-800 text-white">
                        <Camera className="w-4 h-4" /> Open Camera &amp; Scan
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={stopCamera} className="flex gap-2 border-red-300 text-red-600 hover:bg-red-50">
                        <CameraOff className="w-4 h-4" /> Stop Camera
                      </Button>
                    )}
                  </div>
                </Card>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" />Scanned: {scanResult.scanTime}</div>
                      <span className="flex items-center gap-1 bg-green-100 text-green-700 border border-green-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5" /> Access Granted
                      </span>
                    </div>
                    <Button variant="outline" onClick={resetScan} className="flex gap-2">
                      <RefreshCw className="w-4 h-4" /> Scan Another
                    </Button>
                  </div>

                  {/* Health ID Card */}
                  <div className="max-w-2xl mx-auto w-full">
                    <div className="bg-yellow-400 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-24">
                        <svg className="absolute bottom-0 w-full" viewBox="0 0 1200 80" preserveAspectRatio="none">
                          <path d="M0,40 Q300,10 600,40 T1200,40 L1200,80 L0,80 Z" fill="#16a34a" />
                        </svg>
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8 pt-4">
                          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-green-700 flex-shrink-0">
                            <div className="text-center">
                              <p className="text-xs font-bold text-green-700 leading-none">UHC</p>
                              <p className="text-xs font-bold text-green-700 leading-none">2026</p>
                            </div>
                          </div>
                          <h1 className="text-3xl font-bold text-green-700">HEALTH ID CARD</h1>
                          <span className="ml-auto flex items-center gap-1 bg-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-5 items-start">
                          <div className="col-span-2 space-y-3">
                            <div className="bg-green-600 text-white px-5 py-3 rounded-xl">
                              <p className="text-xs uppercase tracking-wide opacity-80 mb-0.5">First Name</p>
                              <h2 className="text-2xl font-bold leading-tight">{scanResult.patient.first_name}</h2>
                            </div>
                            <div className="bg-green-600 text-white px-5 py-3 rounded-xl">
                              <p className="text-xs uppercase tracking-wide opacity-80 mb-0.5">Last Name</p>
                              <h2 className="text-2xl font-bold leading-tight">{scanResult.patient.last_name}</h2>
                            </div>
                            {scanResult.patient.ext_name && (
                              <div className="bg-green-500 text-white px-5 py-3 rounded-xl flex items-center gap-3">
                                <User className="w-5 h-5 opacity-80 flex-shrink-0" />
                                <div>
                                  <p className="text-xs uppercase tracking-wide opacity-80">Extension Name</p>
                                  <p className="font-bold">{scanResult.patient.ext_name}</p>
                                </div>
                              </div>
                            )}
                            {scanResult.patient.sex && (
                              <div className="bg-green-500 text-white px-5 py-3 rounded-xl flex items-center gap-3">
                                <User className="w-5 h-5 opacity-80 flex-shrink-0" />
                                <div>
                                  <p className="text-xs uppercase tracking-wide opacity-80">Sex</p>
                                  <p className="font-bold">{scanResult.patient.sex}</p>
                                </div>
                              </div>
                            )}
                            {scanResult.patient.birth_date && (
                              <div className="bg-green-500 text-white px-5 py-3 rounded-xl flex items-center gap-3">
                                <Calendar className="w-5 h-5 opacity-80 flex-shrink-0" />
                                <div>
                                  <p className="text-xs uppercase tracking-wide opacity-80">Date of Birth</p>
                                  <p className="font-bold">{scanResult.patient.birth_date}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col items-center gap-3">
                            <div className="bg-white p-3 rounded-2xl border-4 border-green-700 shadow-lg">
                              {scanResult.qrCodeDataUrl
                                ? <img src={scanResult.qrCodeDataUrl} alt="QR" className="w-28 h-28 rounded" />
                                : <div className="w-28 h-28 flex flex-col items-center justify-center bg-gray-50 rounded p-1">
                                    <QrCode className="w-16 h-16 text-green-700 opacity-60" />
                                    <p className="text-[7px] font-mono text-gray-400 break-all text-center mt-1">{scanResult.qrValue.substring(0, 24)}</p>
                                  </div>
                              }
                            </div>
                            <p className="text-[10px] font-mono text-green-800 text-center opacity-70 leading-tight max-w-[7rem] break-all">
                              {scanResult.qrValue.substring(0, 20)}…
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-green-600" /> Uploaded Documents
                      </h3>
                      <span className="text-xs text-gray-400">
                        {scanResult.documents.length} document{scanResult.documents.length !== 1 ? 's' : ''} found
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">Click a category to expand and view its files.</p>
                    <DocumentList documents={scanResult.documents} patientName={`${scanResult.patient.last_name}_${scanResult.patient.first_name}`} />
                  </Card>
                </div>
              )}

              {!scanResult && scanHistory.length > 0 && (
                <Card className="p-6">
                  <h3 className="font-semibold text-base mb-3 flex items-center gap-2 text-gray-700">
                    <Clock className="w-4 h-4 text-green-600" /> Recent Scans
                  </h3>
                  <div className="flex flex-col gap-2">
                    {scanHistory.slice(0, 5).map((e) => (
                      <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs flex-shrink-0">
                          {e.memberName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{e.memberName}</p>
                          <p className="text-xs text-gray-400 truncate">{e.qrData}</p>
                        </div>
                        <p className="text-xs text-gray-400 flex-shrink-0">{e.scanTime}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ═══ HISTORY TAB ═══ */}
          <TabsContent value="history">
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-green-600" /> Scan History
              </h3>
              {isLoadingHistory ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                </div>
              ) : dbScanHistory.length > 0 ? (
                <div className="space-y-3">
                {dbScanHistory.map((scan) => (
                <div
                  key={scan.id}
                  className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">

                    <div className="flex flex-col items-center">
                      <p className="text-xs text-gray-500">Member</p>
                      <p className="font-medium text-gray-900">
                        {scan.patient_name}
                      </p>
                    </div>

                    <div className="flex flex-col items-center">
                      <p className="text-xs text-gray-500">QR Code</p>
                      <p className="font-medium text-gray-800 text-xs break-all">
                        {scan.qr_code}
                      </p>
                    </div>

                    <div className="flex flex-col items-center">
                      <p className="text-xs text-gray-500">Scanned By</p>
                      <span className="inline-flex items-center justify-center gap-1 text-xs font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        {scan.role_name || 'Unknown Role'}
                      </span>
                    </div>

                    <div className="flex flex-col items-center">
                      <p className="text-xs text-gray-500">Scanned At</p>
                      <p className="font-medium text-gray-900 flex items-center justify-center gap-1 text-sm w-full">
                        <Clock className="w-3 h-3" />
                        {new Date(scan.created_at).toLocaleString()}
                      </p>
                    </div>
                    </div>
                  </div>
                ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No scan history yet</p>
                  <p className="text-sm mt-1">Use the QR Scanner tab to scan a health card</p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ═══ MEMBER TAGGING ═══ */}
          <TabsContent value="tagging">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">Health Card Member Tagging</h3>
                  <p className="text-xs text-gray-400">Tag and categorize health card members.</p>
                </div>
              </div>

              <div className="flex flex-col items-center py-16 text-gray-400">
                <Tag className="w-16 h-16 opacity-20 mb-4" />
                <p className="font-medium text-gray-500">Coming Soon</p>
                <p className="text-sm mt-1 text-center max-w-sm">
                  This section will allow you to tag and categorize health card members for better organization and tracking.
                </p>
              </div>
            </Card>
          </TabsContent>

        </Tabs>
        </>
        )}
      </div>
    </>
  );
};

export default UhcOperator;