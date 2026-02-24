'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { Input } from 'src/components/ui/input';
import { Button } from 'src/components/ui/button';
import { Card } from 'src/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import {
  Search, QrCode, FileText, Eye, Archive, ArchiveRestore, IdCard,
  Heart, Accessibility, Building2, Stethoscope, ClipboardList,
  ChevronDown, ChevronRight, AlertCircle, Loader2, Download, X,
  Printer, CheckCircle2, RefreshCw, ArchiveX, CreditCard, Lock,
  KeyRound, ShieldCheck, EyeOff, ShieldAlert, ShieldX, User,
} from 'lucide-react';
import { supabase } from 'src/lib/supabase';

// ─── QR Code data-url generator ───────────────────────────────────────────────
const generateQrDataUrl = (text: string): Promise<string> =>
  new Promise((resolve, reject) => {
    import('qrcode').then((mod) => {
      const QR = (mod as any).default ?? mod;
      QR.toDataURL(
        text,
        { width: 256, margin: 2, color: { dark: '#166534', light: '#FFFFFF' } },
        (err: Error | null, url: string) => { if (err) reject(err); else resolve(url); }
      );
    }).catch(reject);
  });

// ─── Types ────────────────────────────────────────────────────────────────────
interface RegionRecord           { id?: string; description?: string | null; }
interface ProvinceRecord         { id?: string; description?: string | null; region?: RegionRecord | null; }
interface CityMunicipalityRecord { id?: string; description?: string | null; province?: ProvinceRecord | null; }
interface BrgyRecord             { id?: string; description?: string | null; city_municipality?: CityMunicipalityRecord | null; }

interface PatientProfile {
  id: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  ext_name?: string | null;
  sex?: string | null;
  birth_date?: string | null;
  brgy?: BrgyRecord | null;
}

interface DocumentAttachment {
  id: string;
  attachment: string;
  category: string;
  status: boolean;
  archived?: boolean;
}

// ─── Folder Definitions ───────────────────────────────────────────────────────
const FOLDER_DEFS = [
  { key: 'basic_identification',   label: 'Basic Identification',   supabaseCategory: 'Basic Identification',   color: 'blue',   icon: <IdCard        className="w-5 h-5" /> },
  { key: 'philhealth',             label: 'PhilHealth',             supabaseCategory: 'PhilHealth',             color: 'red',    icon: <Heart         className="w-5 h-5" /> },
  { key: 'senior_pwd',             label: 'Senior / PWD',           supabaseCategory: 'Senior/PWD',             color: 'purple', icon: <Accessibility className="w-5 h-5" /> },
  { key: 'company_documents',      label: 'Company Employee',       supabaseCategory: 'Company Documents',      color: 'amber',  icon: <Building2     className="w-5 h-5" /> },
  { key: 'medical_documents',      label: 'Medical Documents',      supabaseCategory: 'Medical Documents',      color: 'green',  icon: <Stethoscope   className="w-5 h-5" /> },
  { key: 'admission_requirements', label: 'Admission Requirements', supabaseCategory: 'Admission Requirements', color: 'teal',   icon: <ClipboardList className="w-5 h-5" /> },
];

// Maps each folder key to the specific doc-type labels the operator can choose.
// A document's card_category may be stored as the specific type (e.g. "Valid ID")
// OR as the broad folder category (e.g. "Basic Identification"). We match both.
const FOLDER_DOC_TYPES: Record<string, string[]> = {
  basic_identification: [
    'Basic Identification', 'Birth Certificate', 'Barangay Certification', 'Barangay Clearance',
    'Certificate of Indigency', 'Valid ID', 'Government ID',
    'Marriage Certificate (if applicable)',
  ],
  philhealth: ['PhilHealth', 'PhilHealth ID', 'PhilHealth Member Data Record (MDR)'],
  senior_pwd: ['Senior/PWD', 'Senior Citizen ID', 'PWD ID', 'OSCA Booklet'],
  company_documents: ['Company Documents', 'Company ID', 'Certificate of Employment', 'Incident Report'],
  medical_documents: ['Medical Documents', "Doctor's Referral Slip", 'Laboratory Result', 'X-Ray Result / Ultrasound', 'Medical Certificate'],
  admission_requirements: ['Admission Requirements', 'Admission Form', 'Surgery Consent', 'Promissory Note'],
};

// Returns true if the document's category belongs to the given folder
const docMatchesFolder = (docCategory: string, folderKey: string): boolean => {
  const types = FOLDER_DOC_TYPES[folderKey];
  if (!types) return false;
  return types.some((t) => t.toLowerCase() === docCategory.toLowerCase());
};

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fullName = (p: PatientProfile) =>
  [p.first_name, p.middle_name, p.last_name, p.ext_name].filter(Boolean).join(' ');

const getFullAddress = (brgy: PatientProfile['brgy']): string => {
  if (!brgy) return 'N/A';
  const parts: string[] = [];
  if (brgy.description) parts.push(brgy.description);
  const city = brgy.city_municipality;
  if (city?.description) parts.push(city.description);
  const prov = city?.province;
  if (prov?.description) parts.push(prov.description);
  if (prov?.region?.description) parts.push(prov.region.description);
  return parts.join(', ') || 'N/A';
};

const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return dateStr; }
};

const computeAge = (dateStr?: string | null): string => {
  if (!dateStr) return '';
  const birth = new Date(dateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} yrs old`;
};

// Replaces the leading UUID + timestamp in a storage filename with the patient's last name
const displayFileName = (url: string, patient?: PatientProfile | null): string => {
  const raw = url.split('/').pop() ?? 'Document';
  if (!patient) return raw;
  // Storage filenames follow: <uuid>_<timestamp>_<label>.<ext>
  const prefixRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_\d+_/i;
  return raw.replace(prefixRe, `${patient.first_name}_${patient.last_name}_`);
};

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'My Health Card' }];

// ─── PDF Preview Modal ────────────────────────────────────────────────────────
const PdfPreviewModal = ({ url, name, onClose }: { url: string; name: string; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-red-400" />
          <h2 className="font-semibold text-gray-800 truncate max-w-xs">{name}</h2>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <iframe src={url} title={name} className="w-full h-full border-0" />
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
        <Button variant="outline" onClick={onClose} className="flex gap-2"><X className="w-4 h-4" /> Close</Button>
        <Button variant="outline" className="flex gap-2 border-green-300 text-green-700 hover:bg-green-50"
          onClick={() => {
            const iframe = document.querySelector<HTMLIFrameElement>(`iframe[title="${name}"]`);
            if (iframe?.contentWindow) { iframe.contentWindow.focus(); iframe.contentWindow.print(); }
            else window.print();
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

// ─── Archive Confirm Modal ────────────────────────────────────────────────────
const ArchiveConfirmModal = ({ doc, onConfirm, onCancel }: {
  doc: DocumentAttachment; onConfirm: () => void; onCancel: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
      <div className="px-6 py-5 bg-amber-50 border-b border-amber-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <Archive className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="font-bold text-amber-900">Archive Document?</h2>
            <p className="text-xs text-amber-600 mt-0.5">This can be undone from the Archive tab.</p>
          </div>
        </div>
      </div>
      <div className="px-6 py-5">
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-2">
          <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-gray-700 truncate font-medium">{displayFileName(doc.attachment)}</p>
        </div>
        <p className="text-xs text-gray-400 mt-3">Documents cannot be permanently deleted. Contact your health center if removal is needed.</p>
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
        <Button variant="outline" onClick={onCancel} className="flex gap-2"><X className="w-4 h-4" /> Cancel</Button>
        <Button onClick={onConfirm} className="flex gap-2 bg-amber-600 hover:bg-amber-700 text-white">
          <Archive className="w-4 h-4" /> Archive
        </Button>
      </div>
    </div>
  </div>
);

// ─── Health ID Card visual (Flip Card) ────────────────────────────────────────
const HealthIdCard = ({ patient, qrDataUrl, qrCodeValue, cardRef, profilePicUrl }: {
  patient: PatientProfile; qrDataUrl: string; qrCodeValue: string;
  cardRef?: React.RefObject<HTMLDivElement | null>;
  profilePicUrl?: string | null;
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const lastName = patient.last_name?.toUpperCase() || 'N/A';
  const givenNames = [patient.first_name, patient.middle_name].filter(Boolean).join(' ').toUpperCase();
  const sex = patient.sex?.toUpperCase() || 'N/A';
  const dateIssued = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();

  // Watermark SVG Component
  const WatermarkSVG = () => (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" fill="none" style={{ width: '100%', height: '100%' }}>
      <circle cx="100" cy="100" r="95" stroke="#0a3318" strokeWidth="4" fill="none"/>
      <circle cx="100" cy="100" r="87" stroke="#0a3318" strokeWidth="1.5" fill="none" strokeDasharray="4 3"/>
      <g stroke="#0a3318" strokeWidth="2.5">
        <line x1="100" y1="8" x2="100" y2="22"/><line x1="100" y1="178" x2="100" y2="192"/>
        <line x1="8" y1="100" x2="22" y2="100"/><line x1="178" y1="100" x2="192" y2="100"/>
        <line x1="34" y1="34" x2="44" y2="44"/><line x1="156" y1="156" x2="166" y2="166"/>
        <line x1="166" y1="34" x2="156" y2="44"/><line x1="44" y1="156" x2="34" y2="166"/>
        <line x1="17" y1="67" x2="29" y2="71"/><line x1="171" y1="129" x2="183" y2="133"/>
        <line x1="67" y1="17" x2="71" y2="29"/><line x1="129" y1="171" x2="133" y2="183"/>
        <line x1="183" y1="67" x2="171" y2="71"/><line x1="29" y1="129" x2="17" y2="133"/>
        <line x1="133" y1="17" x2="129" y2="29"/><line x1="71" y1="171" x2="67" y2="183"/>
      </g>
      <g fill="#0a3318">
        <polygon points="100,32 103,42 113,42 105,48 108,58 100,52 92,58 95,48 87,42 97,42" transform="scale(0.55) translate(82,30)"/>
        <polygon points="100,32 103,42 113,42 105,48 108,58 100,52 92,58 95,48 87,42 97,42" transform="scale(0.55) translate(-28,140)"/>
        <polygon points="100,32 103,42 113,42 105,48 108,58 100,52 92,58 95,48 87,42 97,42" transform="scale(0.55) translate(192,140)"/>
      </g>
      <g fill="#0a3318" opacity="0.9">
        <path d="M100 50 C70 50 55 65 55 85 C55 120 75 145 100 158 C125 145 145 120 145 85 C145 65 130 50 100 50Z" fill="none" stroke="#0a3318" strokeWidth="2.5"/>
        <rect x="93" y="68" width="14" height="52" rx="2" fill="#0a3318" opacity="0.7"/>
        <rect x="74" y="87" width="52" height="14" rx="2" fill="#0a3318" opacity="0.7"/>
      </g>
      <defs>
        <path id="arcTop" d="M 22,100 A 78,78 0 0,1 178,100"/>
        <path id="arcBot" d="M 30,110 A 70,70 0 0,0 170,110"/>
      </defs>
      <text fontFamily="serif" fontSize="10" fill="#0a3318" letterSpacing="2">
        <textPath href="#arcTop" startOffset="8%">REPUBLIKA NG PILIPINAS</textPath>
      </text>
      <text fontFamily="serif" fontSize="9" fill="#0a3318" letterSpacing="1.5">
        <textPath href="#arcBot" startOffset="14%">UNIVERSAL HEALTH CARE</textPath>
      </text>
    </svg>
  );

  // Card Background Component with patterns and blobs
  const CardBackground = () => (
    <>
      {/* Base background */}
      <div style={{ position: 'absolute', inset: 0, background: '#eef6ee' }} />
      {/* Pattern overlay */}
      <div style={{ 
        position: 'absolute', inset: 0, opacity: 0.09,
        backgroundImage: `
          repeating-radial-gradient(ellipse at 30% 40%, transparent 0, transparent 8px, rgba(0,120,50,0.5) 9px, transparent 10px),
          repeating-radial-gradient(ellipse at 70% 60%, transparent 0, transparent 12px, rgba(0,100,40,0.4) 13px, transparent 14px),
          repeating-linear-gradient(60deg, transparent 0, transparent 18px, rgba(0,120,50,0.15) 19px, transparent 20px)
        `
      }} />
      {/* Security grid */}
      <div style={{ 
        position: 'absolute', inset: 0, opacity: 0.037,
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,80,30,1) 3px, rgba(0,80,30,1) 4px),
          repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,80,30,1) 3px, rgba(0,80,30,1) 4px)
        `
      }} />
      {/* Blobs */}
      <div style={{ position: 'absolute', width: 300, height: 230, background: '#2d8a50', top: -55, left: 15, opacity: 0.17, borderRadius: '50%', filter: 'blur(46px)' }} />
      <div style={{ position: 'absolute', width: 260, height: 210, background: '#c8a018', top: 55, right: -15, opacity: 0.07, borderRadius: '50%', filter: 'blur(46px)' }} />
      <div style={{ position: 'absolute', width: 230, height: 190, background: '#1a6b3a', bottom: -28, right: 80, opacity: 0.13, borderRadius: '50%', filter: 'blur(46px)' }} />
    </>
  );

  // Gold border strips
  const GoldBorders = () => (
    <>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: 'linear-gradient(90deg, #7a5c10, #c8a018, #f0d44a, #c8a018, #7a5c10)', zIndex: 2 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, background: 'linear-gradient(90deg, #7a5c10, #c8a018, #f0d44a, #c8a018, #7a5c10)', zIndex: 2 }} />
    </>
  );

  // Front Side
  const FrontSide = () => (
    <div style={{ 
      width: '100%', height: '100%', position: 'absolute', 
      backfaceVisibility: 'hidden', borderRadius: 18, overflow: 'hidden', 
      boxShadow: '0 2px 0 rgba(255,255,255,0.9) inset, 0 28px 70px rgba(0,0,0,0.26), 0 0 0 1px rgba(0,100,40,0.16)'
    }}>
      <CardBackground />
      <GoldBorders />
      
      {/* Watermark */}
      <div style={{ position: 'absolute', right: '12%', top: '50%', transform: 'translateY(-50%)', width: 220, height: 220, opacity: 0.055, zIndex: 1, pointerEvents: 'none' }}>
        <WatermarkSVG />
      </div>

      {/* Front content */}
      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: '10px 20px 10px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 8, borderBottom: '1.5px solid rgba(0,100,40,0.25)', flexShrink: 0 }}>
          {/* Profile Pic or UHC Seal */}
          {profilePicUrl ? (
            <img src={profilePicUrl} alt="Profile" style={{ width: 50, height: 50, flexShrink: 0, borderRadius: '50%', border: '2px solid #c8a018', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 50, height: 50, flexShrink: 0, background: 'radial-gradient(circle at 35% 35%, #fef9c3, #fbbf24 60%, #d97706)', borderRadius: '50%', border: '2px solid #c8a018', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#14532d', letterSpacing: '0.05em' }}>UHC</div>
                <div style={{ width: 28, height: 1, background: '#166534', margin: '1px auto' }} />
                <div style={{ fontSize: 8, fontWeight: 700, color: '#166534' }}>2026</div>
              </div>
            </div>
          )}
          {/* Title */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: '"Cinzel", serif', fontSize: 9, fontWeight: 600, letterSpacing: 2, color: '#0d4422' }}>Republika ng Pilipinas</div>
            <div style={{ fontFamily: '"Noto Serif", serif', fontSize: 7.5, color: '#2d6b40', letterSpacing: 1, fontStyle: 'italic' }}>Republic of the Philippines</div>
            <div style={{ fontFamily: '"Cinzel", serif', fontSize: 17, fontWeight: 700, color: '#0a3318', letterSpacing: 1.5, lineHeight: 1.1 }}>UNIVERSAL HEALTH CARE</div>
            <div style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 9, fontWeight: 600, color: '#1a6b3a', letterSpacing: 3 }}>Member Identification Card</div>
          </div>
        </div>

        {/* ID Row */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid rgba(0,100,40,0.13)', flexShrink: 0 }}>
          <span style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 11, fontWeight: 700, color: '#0d4022', letterSpacing: 1 }}>UHC-ID</span>
          <span style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 13, fontWeight: 700, color: '#0a2e1a', letterSpacing: 1.5, marginLeft: 6 }}>{qrCodeValue.substring(4, 24).toUpperCase()}-NDC</span>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', gap: 0, paddingTop: 8, flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Photo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, width: 215 }}>
            <div style={{ 
              flex: 1, width: '100%', minHeight: 0,
              border: '3px solid #c8a018', borderRadius: 8, overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.22), 0 0 0 5px rgba(200,160,24,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(160deg, #fef9c3 0%, #fde68a 50%, #f59e0b 100%)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 60, height: 65, background: '#c4c4c4', borderRadius: '50% 50% 8px 8px' }} />
                <div style={{ width: 80, height: 40, background: '#c4c4c4', borderRadius: '8px 8px 50% 50%', marginTop: -10 }} />
              </div>
            </div>
            <div style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 7.5, fontWeight: 600, color: '#1a6b3a', letterSpacing: 1.5, textTransform: 'uppercase', flexShrink: 0 }}>Card Holder</div>
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, paddingLeft: 55, paddingRight: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 2, alignItems: 'baseline', marginBottom: 1 }}>
                <span style={{ fontFamily: '"Noto Serif", serif', fontSize: 7.5, fontStyle: 'italic', color: '#2d6b40', whiteSpace: 'nowrap' }}>Apelyido</span>
                <span style={{ fontSize: 7.5, color: '#2d6b40' }}>/</span>
                <span style={{ fontFamily: '"Noto Serif", serif', fontSize: 7.5, fontStyle: 'italic', color: '#666', whiteSpace: 'nowrap' }}>Last Name</span>
              </div>
              <div style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 20, fontWeight: 700, color: '#0a2e1a', letterSpacing: 0.5, lineHeight: 1.05, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lastName}</div>
              <div style={{ height: 1, background: 'rgba(0,100,40,0.18)', marginTop: 4 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 2, alignItems: 'baseline', marginBottom: 1 }}>
                <span style={{ fontFamily: '"Noto Serif", serif', fontSize: 7.5, fontStyle: 'italic', color: '#2d6b40', whiteSpace: 'nowrap' }}>Mga Pangalan</span>
                <span style={{ fontSize: 7.5, color: '#2d6b40' }}>/</span>
                <span style={{ fontFamily: '"Noto Serif", serif', fontSize: 7.5, fontStyle: 'italic', color: '#666', whiteSpace: 'nowrap' }}>Given Names</span>
              </div>
              <div style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 20, fontWeight: 700, color: '#0a2e1a', letterSpacing: 0.5, lineHeight: 1.05, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{givenNames}</div>
              <div style={{ height: 1, background: 'rgba(0,100,40,0.18)', marginTop: 4 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 2, alignItems: 'baseline', marginBottom: 1 }}>
                <span style={{ fontFamily: '"Noto Serif", serif', fontSize: 7.5, fontStyle: 'italic', color: '#2d6b40', whiteSpace: 'nowrap' }}>Petsa ng Kapanganakan</span>
                <span style={{ fontSize: 7.5, color: '#2d6b40' }}>/</span>
                <span style={{ fontFamily: '"Noto Serif", serif', fontSize: 7.5, fontStyle: 'italic', color: '#666', whiteSpace: 'nowrap' }}>Date of Birth</span>
              </div>
              <div style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 20, fontWeight: 700, color: '#0a2e1a', letterSpacing: 0.5, lineHeight: 1.05, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatDate(patient.birth_date).toUpperCase()}</div>
              <div style={{ height: 1, background: 'rgba(0,100,40,0.18)', marginTop: 4 }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 2, alignItems: 'baseline', marginBottom: 1 }}>
                <span style={{ fontFamily: '"Noto Serif", serif', fontSize: 7.5, fontStyle: 'italic', color: '#2d6b40', whiteSpace: 'nowrap' }}>Kasarian</span>
                <span style={{ fontSize: 7.5, color: '#2d6b40' }}>/</span>
                <span style={{ fontFamily: '"Noto Serif", serif', fontSize: 7.5, fontStyle: 'italic', color: '#666', whiteSpace: 'nowrap' }}>Sex</span>
              </div>
              <div style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 20, fontWeight: 700, color: '#0a2e1a', letterSpacing: 0.5, lineHeight: 1.05, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sex}</div>
              <div style={{ height: 1, background: 'rgba(0,100,40,0.18)', marginTop: 4 }} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid rgba(0,100,40,0.13)', flexShrink: 0, marginTop: 6 }}>
          <div style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 7.5, fontWeight: 500, color: '#1a6b3a', letterSpacing: 1.5, textTransform: 'uppercase' }}>DOH — UHC Act R.A. 11223</div>
          <div style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 10, fontWeight: 700, color: '#0a3318', letterSpacing: 1.5 }}>DATE ISSUED: {dateIssued}</div>
          <div style={{ fontFamily: '"Cinzel", serif', fontSize: 19, fontWeight: 700, color: '#1a6b3a', letterSpacing: 2, textShadow: '1px 1px 0 rgba(200,160,24,0.3)' }}>PHL</div>
        </div>
      </div>
    </div>
  );

  // Back Side
  const BackSide = () => (
    <div style={{ 
      width: '100%', height: '100%', position: 'absolute', 
      backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', 
      borderRadius: 18, overflow: 'hidden', 
      boxShadow: '0 2px 0 rgba(255,255,255,0.9) inset, 0 28px 70px rgba(0,0,0,0.26), 0 0 0 1px rgba(0,100,40,0.16)'
    }}>
      <CardBackground />
      <GoldBorders />
      
      {/* Magnetic strip */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 34, background: 'linear-gradient(135deg, #1a1a1a, #2d2d2d, #1a1a1a)', opacity: 0.88, zIndex: 5 }} />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 34, background: 'linear-gradient(180deg, rgba(255,255,255,0.07), transparent)', zIndex: 6 }} />

      {/* Watermark centered */}
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 220, height: 220, opacity: 0.045, zIndex: 1, pointerEvents: 'none' }}>
        <WatermarkSVG />
      </div>

      {/* Back content */}
      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: '42px 24px 10px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ paddingBottom: 7, borderBottom: '1.5px solid rgba(0,100,40,0.25)', flexShrink: 0 }}>
          <div style={{ fontFamily: '"Cinzel", serif', fontSize: 8, fontWeight: 600, letterSpacing: 2, color: '#0d4422' }}>Republika ng Pilipinas · Republic of the Philippines</div>
          <div style={{ fontFamily: '"Cinzel", serif', fontSize: 15, fontWeight: 700, color: '#0a3318', letterSpacing: 1.5 }}>UNIVERSAL HEALTH CARE</div>
          <div style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 8, color: '#1a6b3a', letterSpacing: 3 }}>Member Identification Card</div>
        </div>

        {/* QR Section */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{ 
              width: 215, height: 215, flexShrink: 0,
              border: '3px solid #c8a018', borderRadius: 9, padding: 7,
              background: 'white', position: 'relative',
              boxShadow: '0 5px 24px rgba(0,0,0,0.2), 0 0 0 5px rgba(200,160,24,0.13)'
            }}>
              <div style={{ position: 'absolute', inset: -7, border: '1.5px solid rgba(200,160,24,0.32)', borderRadius: 12, pointerEvents: 'none' }} />
              <img src={qrDataUrl} alt="QR Code" style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
            <div style={{ fontFamily: '"Cinzel", serif', fontSize: 10.5, fontWeight: 700, color: '#0a3318', letterSpacing: 4, textAlign: 'center' }}>Scan to Verify</div>
            <div style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 7.5, color: '#2d6b40', letterSpacing: 1.5, textAlign: 'center' }}>UHC Member Verification Portal</div>
            <div style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 6.5, color: 'rgba(0,60,20,0.38)', letterSpacing: 0.8, textAlign: 'center' }}>{qrCodeValue}</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid rgba(0,100,40,0.13)', flexShrink: 0 }}>
          <div style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 7, fontWeight: 500, color: '#1a6b3a', letterSpacing: 1.5, textTransform: 'uppercase' }}>DOH — UHC Act R.A. 11223</div>
          <div style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 8, fontWeight: 700, color: '#0a3318', letterSpacing: 1.5 }}>VALID WHILE MEMBERSHIP IS ACTIVE</div>
          <div style={{ fontFamily: '"Cinzel", serif', fontSize: 19, fontWeight: 700, color: '#1a6b3a', letterSpacing: 2, textShadow: '1px 1px 0 rgba(200,160,24,0.3)' }}>PHL</div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Card container with 3D perspective */}
      <div ref={cardRef} style={{ width: 700, height: 420, perspective: '1000px' }}>
        <div style={{
          width: '100%', height: '100%', position: 'relative',
          transformStyle: 'preserve-3d', transition: 'transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>
          <FrontSide />
          <BackSide />
        </div>
      </div>
      {/* Flip text link */}
      <button
        onClick={() => setIsFlipped(!isFlipped)}
        style={{
          marginTop: 16, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px',
          fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: 14, fontWeight: 500,
          color: '#2563eb', letterSpacing: 0.3, transition: 'all 0.2s ease',
        }}
        onMouseOver={(e) => { e.currentTarget.style.color = '#1d4ed8'; e.currentTarget.style.textDecoration = 'underline'; }}
        onMouseOut={(e) => { e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.textDecoration = 'none'; }}
      >
        {isFlipped ? '← Show Front' : 'Show Backside →'}
      </button>
    </div>
  );
};


// ─── Member PIN Gate Modal ────────────────────────────────────────────────────
// Shown after patient search selection:
//   hasPin=true  → user must enter their PIN to access records
//   hasPin=false → user must set a PIN before proceeding
const MemberPinGateModal = ({
  patientName, hasPin, healthCardId,
  onVerified, onPinSet, onClose,
}: {
  patientName: string;
  hasPin: boolean;
  healthCardId: string | null;
  onVerified: () => void;
  onPinSet: () => void;
  onClose: () => void;
}) => {
  const [entered,      setEntered]      = useState('');
  const [showDigits,   setShowDigits]   = useState(false);
  const [status,       setStatus]       = useState<'idle' | 'checking' | 'verified' | 'failed'>('idle');
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [isLocked,     setIsLocked]     = useState(false);
  const [shakeKey,     setShakeKey]     = useState(0);

  // --- Set PIN states ---
  const [setPinStep,    setSetPinStep]    = useState<'new' | 'confirm'>('new');
  const [newPin,        setNewPin]        = useState('');
  const [confirmPin,    setConfirmPin]    = useState('');
  const [setPinShow,    setSetPinShow]    = useState(false);
  const [setPinErr,     setSetPinErr]     = useState('');
  const [isSavingPin,   setIsSavingPin]   = useState(false);

  const prevStatus = useRef(status);
  useEffect(() => {
    if (status === 'failed' && prevStatus.current !== 'failed') setShakeKey((k) => k + 1);
    prevStatus.current = status;
  }, [status]);

  // ── Keyboard support ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!hasPin) {
        // Set-PIN mode
        if (/^[0-9]$/.test(e.key)) { handleSetDigit(e.key); e.preventDefault(); }
        else if (e.key === 'Backspace') { handleSetBack(); e.preventDefault(); }
        else if (e.key === 'Enter') { handleSetNext(); e.preventDefault(); }
      } else {
        // Verify-PIN mode
        if (/^[0-9]$/.test(e.key)) { handleDigit(e.key); e.preventDefault(); }
        else if (e.key === 'Backspace') { handleBack(); e.preventDefault(); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ── Verify PIN handler ──
  const handleDigit = (d: string) => {
    if (entered.length >= 4 || status === 'checking' || isLocked || status === 'verified') return;
    const next = entered + d;
    setEntered(next);
    if (next.length === 4) {
      setTimeout(async () => {
        setStatus('checking');
        try {
          const { data, error } = await supabase
            .schema('module4').from('health_card').select('pin').eq('id', healthCardId).single();
          if (error) throw error;
          if (data?.pin === next) {
            setStatus('verified');
            setTimeout(() => onVerified(), 1200);
          } else {
            const left = attemptsLeft - 1;
            setAttemptsLeft(left);
            if (left <= 0) setIsLocked(true);
            setStatus('failed');
            setEntered('');
          }
        } catch {
          setStatus('failed');
          setEntered('');
        }
      }, 120);
    }
  };
  const handleBack = () => { if (status !== 'checking' && !isLocked) setEntered((p) => p.slice(0, -1)); };

  // ── Set PIN handler ──
  const setPinActiveVal = setPinStep === 'new' ? newPin : confirmPin;
  const setPinSetActive = setPinStep === 'new' ? setNewPin : setConfirmPin;
  const handleSetDigit = (d: string) => { if (setPinActiveVal.length < 4 && !isSavingPin) setPinSetActive(setPinActiveVal + d); };
  const handleSetBack  = () => { if (!isSavingPin) setPinSetActive(setPinActiveVal.slice(0, -1)); };
  const handleSetNext  = async () => {
    setSetPinErr('');
    if (setPinStep === 'new') {
      if (newPin.length < 4) { setSetPinErr('PIN must be exactly 4 digits.'); return; }
      setSetPinStep('confirm');
    } else {
      if (confirmPin !== newPin) { setSetPinErr('PINs do not match. Please try again.'); setConfirmPin(''); return; }
      setIsSavingPin(true);
      try {
        const { error } = await supabase
          .schema('module4').from('health_card').update({ pin: newPin }).eq('id', healthCardId);
        if (error) throw error;
        onPinSet();
      } catch {
        setSetPinErr('Failed to save PIN. Please try again.');
      } finally { setIsSavingPin(false); }
    }
  };

  // ══ No PIN → Force set PIN ══
  if (!hasPin) {
    const stepLabel = setPinStep === 'new' ? 'Choose Your PIN' : 'Confirm PIN';
    const stepHint  = setPinStep === 'new'
      ? 'Choose a 4-digit PIN to protect your health records.'
      : 'Re-enter the PIN to confirm.';
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
          <div className="bg-gradient-to-br from-amber-500 to-amber-700 px-7 py-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-white text-lg leading-none">Set Your PIN First</h2>
              <p className="text-amber-100 text-xs mt-1 truncate">{patientName}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 px-7 pt-5">
            {(['new', 'confirm'] as const).map((s, i) => (
              <div key={i} className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                s === setPinStep ? 'bg-amber-500' : (setPinStep === 'confirm' && i === 0) ? 'bg-amber-400' : 'bg-gray-200'
              }`} />
            ))}
          </div>
          <div className="px-7 pt-5 pb-6">
            <div className="text-center mb-4">
              <p className="font-semibold text-gray-800 text-sm">{stepLabel}</p>
              <p className="text-xs text-gray-400 mt-1">{stepHint}</p>
            </div>
            <div className="flex justify-center gap-4 mb-3">
              {[0,1,2,3].map((i) => (
                <div key={i} className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${
                  setPinActiveVal.length > i ? 'border-amber-500 bg-amber-50'
                  : setPinActiveVal.length === i ? 'border-amber-400 bg-white shadow-sm ring-2 ring-amber-200'
                  : 'border-gray-200 bg-gray-50'
                }`}>
                  {setPinActiveVal.length > i && (
                    setPinShow ? <span className="font-bold text-amber-700 text-lg">{setPinActiveVal[i]}</span>
                    : <div className="w-3 h-3 rounded-full bg-amber-500" />
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setSetPinShow(!setPinShow)} className="flex items-center gap-1.5 mx-auto mb-4 text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
              {setPinShow ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {setPinShow ? 'Hide' : 'Show'} digits
            </button>
            {setPinErr && (
              <div className="mb-3 flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
                <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600">{setPinErr}</p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d) => (
                <button key={d} disabled={d === '' || isSavingPin}
                  onClick={() => d === '⌫' ? handleSetBack() : d !== '' ? handleSetDigit(d) : undefined}
                  className={`h-12 rounded-xl font-semibold text-lg transition-all active:scale-95 select-none ${
                    d === '' ? 'cursor-default' : d === '⌫' ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    : 'bg-gray-50 hover:bg-amber-50 hover:text-amber-700 border border-gray-200 hover:border-amber-300 text-gray-800'
                  }`}>{d}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1" disabled={isSavingPin}>Cancel</Button>
              <Button onClick={handleSetNext} disabled={isSavingPin || setPinActiveVal.length < 4}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white flex gap-2">
                {isSavingPin ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  : <><KeyRound className="w-4 h-4" />{setPinStep === 'confirm' ? 'Save PIN' : 'Next'}</>}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══ Has PIN → Verify PIN ══
  const headerGradient = status === 'verified' ? 'from-green-600 to-green-800'
    : isLocked ? 'from-red-700 to-red-900' : 'from-green-700 to-green-900';
  const headerTitle = status === 'verified' ? 'Access Granted'
    : isLocked ? 'Access Locked' : 'Enter Your PIN';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4">
      <style>{`
        @keyframes pinGateIn { from { opacity:0; transform:scale(0.92) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes pinShake  { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        .pin-gate-enter { animation: pinGateIn 0.22s cubic-bezier(0.34,1.56,0.64,1); }
        .pin-dots-shake { animation: pinShake 0.38s ease; }
      `}</style>
      <div className="pin-gate-enter bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className={`bg-gradient-to-br ${headerGradient} px-7 py-6 flex items-center gap-4`}>
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            {status === 'verified' ? <ShieldCheck className="w-6 h-6 text-white" />
              : isLocked ? <ShieldX className="w-6 h-6 text-white" />
              : <Lock className="w-6 h-6 text-white" />}
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

        {isLocked && (
          <div className="px-7 py-6 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center"><ShieldX className="w-8 h-8 text-red-600" /></div>
            <div><p className="font-bold text-red-800 text-base">Access Locked</p>
              <p className="text-sm text-gray-600 mt-2">3 incorrect PIN attempts. Please try again later or contact your health center.</p></div>
            <Button onClick={onClose} className="w-full text-sm bg-gray-800 hover:bg-gray-900 text-white"><X className="w-4 h-4 mr-1.5" /> Close</Button>
          </div>
        )}

        {status === 'verified' && (
          <div className="px-7 py-10 flex flex-col items-center text-center gap-3">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle2 className="w-10 h-10 text-green-600" /></div>
            <p className="font-bold text-gray-800 text-lg">PIN Verified!</p>
            <p className="text-sm text-gray-400">Loading your records…</p>
          </div>
        )}

        {status !== 'verified' && !isLocked && (
          <div className="px-7 pt-5 pb-7">
            <p className="text-sm text-gray-500 text-center mb-5">Enter your <strong className="text-gray-700">4-digit PIN</strong> to access your records.</p>
            <div key={shakeKey} className={`flex justify-center gap-4 mb-3 ${shakeKey > 0 ? 'pin-dots-shake' : ''}`}>
              {[0,1,2,3].map((i) => (
                <div key={i} className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all duration-150 ${
                  entered.length > i ? (status === 'failed' ? 'border-red-400 bg-red-50' : 'border-green-500 bg-green-50')
                  : entered.length === i ? 'border-green-400 bg-white shadow-sm ring-2 ring-green-200'
                  : 'border-gray-200 bg-gray-50'
                }`}>
                  {entered.length > i && (
                    showDigits ? <span className={`font-bold text-lg ${status === 'failed' ? 'text-red-600' : 'text-green-700'}`}>{entered[i]}</span>
                    : <div className={`w-3 h-3 rounded-full ${status === 'failed' ? 'bg-red-500' : 'bg-green-600'}`} />
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setShowDigits(!showDigits)} className="flex items-center gap-1.5 mx-auto mb-4 text-[11px] text-gray-400 hover:text-gray-600 transition-colors">
              {showDigits ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showDigits ? 'Hide' : 'Show'} digits
            </button>
            {status === 'failed' && (
              <div className="mb-4 flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
                <ShieldX className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600">Incorrect PIN. <strong>{attemptsLeft}</strong> attempt{attemptsLeft !== 1 ? 's' : ''} remaining.</p>
              </div>
            )}
            {status === 'checking' && (
              <div className="mb-4 flex items-center justify-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
                <Loader2 className="w-4 h-4 text-green-600 animate-spin" />
                <p className="text-xs text-green-700">Verifying PIN…</p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d) => (
                <button key={d} disabled={d === '' || status === 'checking'}
                  onClick={() => d === '⌫' ? handleBack() : d !== '' ? handleDigit(d) : undefined}
                  className={`h-12 rounded-xl font-semibold text-lg transition-all active:scale-95 select-none ${
                    d === '' ? 'cursor-default' : d === '⌫' ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    : 'bg-gray-50 hover:bg-green-50 hover:text-green-700 border border-gray-200 hover:border-green-300 text-gray-800 active:bg-green-100'
                  }`}>{status === 'checking' && d === '⌫' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : d}</button>
              ))}
            </div>
            <Button variant="outline" onClick={onClose} className="w-full text-sm border-gray-300 text-gray-600"><X className="w-4 h-4 mr-1.5" /> Cancel</Button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── PIN Modal ────────────────────────────────────────────────────────────────
// mode='set'    → 2 steps: new → confirm
// mode='change' → 3 steps: old → new → confirm
const PinModal = ({ mode, onConfirm, onCancel, isLoading, error }: {
  mode: 'set' | 'change';
  onConfirm: (newPin: string, oldPin?: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  error: string;
}) => {
  const [step,     setStep]     = useState<'old' | 'new' | 'confirm'>(mode === 'change' ? 'old' : 'new');
  const [oldPin,   setOldPin]   = useState('');
  const [newPin,   setNewPin]   = useState('');
  const [conf,     setConf]     = useState('');
  const [showPin,  setShowPin]  = useState(false);
  const [localErr, setLocalErr] = useState('');

  const activeVal = step === 'old' ? oldPin : step === 'new' ? newPin : conf;
  const setActive = step === 'old' ? setOldPin : step === 'new' ? setNewPin : setConf;

  const handleDigit = (d: string) => { if (activeVal.length < 4) setActive(activeVal + d); };
  const handleBack  = () => setActive(activeVal.slice(0, -1));

  // ── Keyboard support ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) { handleDigit(e.key); e.preventDefault(); }
      else if (e.key === 'Backspace') { handleBack(); e.preventDefault(); }
      else if (e.key === 'Enter') { handleNext(); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const handleNext = () => {
    setLocalErr('');
    if (step === 'old') {
      if (oldPin.length < 4) { setLocalErr('Please enter your current 4-digit PIN.'); return; }
      setStep('new');
    } else if (step === 'new') {
      if (newPin.length < 4) { setLocalErr('PIN must be exactly 4 digits.'); return; }
      setStep('confirm');
    } else {
      if (conf !== newPin) { setLocalErr('PINs do not match. Please try again.'); setConf(''); return; }
      onConfirm(newPin, mode === 'change' ? oldPin : undefined);
    }
  };

  const allSteps = (['old', 'new', 'confirm'] as const);
  const stepIdx  = allSteps.indexOf(step);
  // For 'set' mode we skip the 'old' step, so only show 2 progress bars
  const visibleSteps = mode === 'set' ? (['new', 'confirm'] as const) : allSteps;
  const visibleIdx   = mode === 'set' ? stepIdx - 1 : stepIdx;

  const stepLabel = step === 'old' ? 'Enter Current PIN'
    : step === 'new' ? (mode === 'set' ? 'Choose Your PIN' : 'Enter New PIN')
    : 'Confirm PIN';
  const stepHint  = step === 'old' ? 'Enter your existing 4-digit PIN to continue.'
    : step === 'new' ? 'Choose a 4-digit PIN. Never share it by phone or text.'
    : 'Re-enter the PIN to confirm.';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-700 to-green-900 px-7 py-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white text-lg leading-none">{mode === 'set' ? 'Set Your PIN' : 'Change PIN'}</h2>
            <p className="text-green-200 text-xs mt-1">{mode === 'set' ? 'Protect your health records' : 'Update your security PIN'}</p>
          </div>
        </div>

        {/* Step progress */}
        <div className="flex items-center gap-1.5 px-7 pt-5">
          {visibleSteps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
              i < visibleIdx ? 'bg-green-400' : i === visibleIdx ? 'bg-green-600' : 'bg-gray-200'
            }`} />
          ))}
        </div>

        <div className="px-7 pt-5 pb-6">
          {/* Step label */}
          <div className="text-center mb-5">
            <p className="font-semibold text-gray-800 text-sm">{stepLabel}</p>
            <p className="text-xs text-gray-400 mt-1">{stepHint}</p>
          </div>

          {/* PIN dot display */}
          <div className="flex justify-center gap-4 mb-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${
                activeVal.length > i
                  ? 'border-green-600 bg-green-50'
                  : activeVal.length === i
                  ? 'border-green-400 bg-white shadow-sm ring-2 ring-green-100'
                  : 'border-gray-200 bg-gray-50'
              }`}>
                {activeVal.length > i && (
                  showPin
                    ? <span className="font-bold text-green-700 text-lg">{activeVal[i]}</span>
                    : <div className="w-3 h-3 rounded-full bg-green-600" />
                )}
              </div>
            ))}
          </div>

          {/* Show/hide toggle */}
          <button
            onClick={() => setShowPin(!showPin)}
            className="flex items-center gap-1.5 mx-auto mb-4 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showPin ? 'Hide digits' : 'Show digits'}
          </button>

          {/* Error */}
          {(localErr || error) && (
            <div className="mb-4 flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
              <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600">{localErr || error}</p>
            </div>
          )}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d) => (
              <button
                key={d}
                disabled={d === '' || isLoading}
                onClick={() => d === '⌫' ? handleBack() : d !== '' ? handleDigit(d) : undefined}
                className={`h-12 rounded-xl font-semibold text-lg transition-all active:scale-95 select-none ${
                  d === ''   ? 'cursor-default'
                  : d === '⌫' ? 'bg-gray-100 hover:bg-gray-200 text-gray-600 active:bg-gray-300'
                  : 'bg-gray-50 hover:bg-green-50 hover:text-green-700 border border-gray-200 hover:border-green-300 text-gray-800 active:bg-green-100'
                }`}
              >{d}</button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} className="flex-1" disabled={isLoading}>Cancel</Button>
            <Button
              onClick={handleNext}
              disabled={isLoading || activeVal.length < 4}
              className="flex-1 bg-green-700 hover:bg-green-800 text-white flex gap-2"
            >
              {isLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                : <><KeyRound className="w-4 h-4" />{step === 'confirm' ? 'Save PIN' : 'Next'}</>
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Print Modal ──────────────────────────────────────────────────────────────
const PrintModal = ({ imgUrl, patientName, onClose, onDownload, isCapturing }: {
  imgUrl: string; patientName: string; onClose: () => void;
  onDownload: () => void; isCapturing: boolean;
}) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-7 py-5 border-b bg-gradient-to-r from-gray-800 to-gray-900">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <Printer className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white text-lg leading-none">Print Health ID Card</h2>
            <p className="text-gray-400 text-xs mt-1">{patientName}</p>
          </div>
        </div>
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
      <div className="flex justify-center items-center bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 px-10 py-10 relative overflow-auto">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage:'radial-gradient(circle,#d1d5db 1px,transparent 1px)',backgroundSize:'24px 24px' }} />
        <div className="relative z-10" style={{ filter:'drop-shadow(0 20px 40px rgba(0,0,0,0.3))',minWidth:'fit-content' }}>
          <img src={imgUrl} alt="Health Card Print Preview" style={{ width:'100%',maxWidth:780,height:'auto',borderRadius:12,display:'block' }} />
        </div>
      </div>
      <div className="px-7 py-5 border-t bg-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs font-semibold text-gray-600">Print Tips</p>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed max-w-sm ml-6">
            Select <strong>Landscape</strong> orientation, margins to <strong>None</strong>. Ask for <strong>CR80 laminated ID</strong> printing.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="flex gap-2 text-sm"><X className="w-4 h-4" /> Close</Button>
          <Button
            onClick={() => {
              const w = window.open('', '_blank');
              if (!w) return;
              w.document.write(`<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box;}body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff;}img{max-width:100%;height:auto;display:block;}@page{size:landscape;margin:0;}@media print{body{background:transparent;}}</style></head><body><img src="${imgUrl}" /></body></html>`);
              w.document.close();
              w.onload = () => { w.focus(); w.print(); w.close(); };
            }}
            className="flex gap-2 text-sm bg-gray-800 hover:bg-gray-900 text-white"
          >
            <Printer className="w-4 h-4" /> Send to Printer
          </Button>
          <Button onClick={onDownload} disabled={isCapturing} className="flex gap-2 text-sm bg-green-700 hover:bg-green-800 text-white">
            {isCapturing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download Instead
          </Button>
        </div>
      </div>
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const UhcMember = () => {
  // ── Search / patient selection ─────────────────────────────────────────────
  const [searchQuery,     setSearchQuery]     = useState('');
  const [searchResults,   setSearchResults]   = useState<PatientProfile[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [isSearching,     setIsSearching]     = useState(false);
  const [errorMessage,    setErrorMessage]    = useState('');

  // ── Profile picture ─────────────────────────────────────────────────────────
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);

  // ── module4 health card data ───────────────────────────────────────────────
  const [healthCardId, setHealthCardId] = useState<string | null>(null);
  const [qrCodeValue,  setQrCodeValue]  = useState<string | null>(null);
  const [qrDataUrl,    setQrDataUrl]    = useState<string | null>(null);
  const [isLoadingQr,  setIsLoadingQr]  = useState(false);

  // ── Documents (module4.card_attachment) ───────────────────────────────────
  const [documents,      setDocuments]      = useState<DocumentAttachment[]>([]);
  const [isLoadingDocs,  setIsLoadingDocs]  = useState(false);
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);
  const [filterQuery,    setFilterQuery]    = useState('');
  const [previewDoc,     setPreviewDoc]     = useState<DocumentAttachment | null>(null);
  const [archiveTarget,  setArchiveTarget]  = useState<DocumentAttachment | null>(null);

  // ── PIN (module4.health_card.pin) ──────────────────────────────────────────
  const [hasPin,       setHasPin]       = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'set' | 'change' | null>(null);
  const [isPinLoading, setIsPinLoading] = useState(false);
  const [pinError,     setPinError]     = useState('');
  const [pinSuccess,   setPinSuccess]   = useState('');

  // ── PIN gate (on patient select) ──────────────────────────────────────────
  const [pendingPatient,  setPendingPatient]  = useState<PatientProfile | null>(null);
  const [pendingCardId,   setPendingCardId]   = useState<string | null>(null);
  const [pendingHasPin,   setPendingHasPin]   = useState(false);
  const [showPinGate,     setShowPinGate]     = useState(false);
  const [isCheckingPin,   setIsCheckingPin]   = useState(false);

  // ── Card download / print ──────────────────────────────────────────────────
  const [isCapturing,   setIsCapturing]   = useState(false);
  const [printModalImg, setPrintModalImg] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // ── Active tab ─────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('documents');

  // ─── Canvas card builder (dual format - front & back) ─────────────────────
  const buildCardCanvas = useCallback(async (
    patient: PatientProfile, qrUrl: string, qrValue: string, picUrl?: string | null,
  ): Promise<HTMLCanvasElement> => {
    const SCALE = 3, W = 700, H = 420;
    const LABEL_H = 30, GAP = 20;
    const TOTAL_H = LABEL_H + H + GAP + LABEL_H + H; // 920px
    const canvas = document.createElement('canvas');
    canvas.width = W * SCALE; canvas.height = TOTAL_H * SCALE;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(SCALE, SCALE);

    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    // Helper: draw card base (background, blobs, gold borders)
    const drawCardBase = (offsetY: number) => {
      ctx.save();
      ctx.translate(0, offsetY);
      
      // Card background
      rr(0, 0, W, H, 18);
      ctx.fillStyle = '#eef6ee';
      ctx.fill();

      // Clip for blobs
      ctx.save();
      rr(0, 0, W, H, 18);
      ctx.clip();
      
      // Blob 1 - greenish top left
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#2d8a50';
      ctx.beginPath();
      ctx.ellipse(165, 60, 150, 115, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Blob 2 - gold top right
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = '#c8a018';
      ctx.beginPath();
      ctx.ellipse(W + 15, 160, 130, 105, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Blob 3 - dark green bottom right
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = '#1a6b3a';
      ctx.beginPath();
      ctx.ellipse(W - 195, H + 28, 115, 95, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
      ctx.globalAlpha = 1;

      // Gold borders
      const goldGrad = ctx.createLinearGradient(0, 0, W, 0);
      goldGrad.addColorStop(0, '#7a5c10');
      goldGrad.addColorStop(0.25, '#c8a018');
      goldGrad.addColorStop(0.5, '#f0d44a');
      goldGrad.addColorStop(0.75, '#c8a018');
      goldGrad.addColorStop(1, '#7a5c10');
      ctx.fillStyle = goldGrad;
      ctx.fillRect(0, 0, W, 5);
      ctx.fillRect(0, H - 5, W, 5);
      
      ctx.restore();
    };

    // ══════════════════════════════════════════════════════════════════════════
    // FRONT SIDE
    // ══════════════════════════════════════════════════════════════════════════
    
    // "FRONT" label
    ctx.fillStyle = '#0d4422';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('— FRONT —', W / 2, 20);
    
    const frontY = LABEL_H;
    drawCardBase(frontY);
    
    ctx.save();
    ctx.translate(0, frontY);

    // Header section
    const headerH = 75;
    
    // Header border bottom
    ctx.strokeStyle = 'rgba(0,100,40,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20, headerH);
    ctx.lineTo(W - 20, headerH);
    ctx.stroke();

    // Profile pic circle or UHC seal
    if (picUrl) {
      await new Promise<void>((resolve) => {
        const profImg = new Image();
        profImg.crossOrigin = 'anonymous';
        profImg.src = picUrl;
        profImg.onload = () => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(40, 38, 25, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(profImg, 15, 13, 50, 50);
          ctx.restore();
          // Gold border
          ctx.strokeStyle = '#c8a018';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(40, 38, 25, 0, Math.PI * 2);
          ctx.stroke();
          resolve();
        };
        profImg.onerror = () => resolve();
      });
    } else {
      // Fallback: gold gradient circle with "UHC / 2026" text
      const cx = 40, cy = 38, r = 25;
      const sealGrad = ctx.createRadialGradient(cx - 5, cy - 5, 2, cx, cy, r);
      sealGrad.addColorStop(0, '#fef9c3');
      sealGrad.addColorStop(0.6, '#fbbf24');
      sealGrad.addColorStop(1, '#d97706');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = sealGrad;
      ctx.fill();
      ctx.strokeStyle = '#c8a018';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#14532d';
      ctx.fillText('UHC', cx, cy - 1);
      ctx.fillStyle = '#166534';
      ctx.fillRect(cx - 14, cy + 2, 28, 1);
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('2026', cx, cy + 12);
    }

    // Header titles (centered)
    const titleX = W / 2;
    ctx.textAlign = 'center';
    ctx.font = '600 9px serif';
    ctx.fillStyle = '#0d4422';
    ctx.fillText('Republika ng Pilipinas', titleX, 20);
    ctx.font = 'italic 7.5px serif';
    ctx.fillStyle = '#2d6b40';
    ctx.fillText('Republic of the Philippines', titleX, 30);
    ctx.font = 'bold 17px serif';
    ctx.fillStyle = '#0a3318';
    ctx.fillText('UNIVERSAL HEALTH CARE', titleX, 48);
    ctx.font = '600 9px sans-serif';
    ctx.fillStyle = '#1a6b3a';
    ctx.fillText('Member Identification Card', titleX, 62);

    // UHC-ID row
    ctx.textAlign = 'left';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#0d4022';
    ctx.fillText('UHC-ID', 20, headerH + 18);
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#0a2e1a';
    ctx.fillText(qrValue.substring(4, 24).toUpperCase() + '-NDC', 68, headerH + 18);
    
    // ID row border
    ctx.strokeStyle = 'rgba(0,100,40,0.13)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, headerH + 26);
    ctx.lineTo(W - 20, headerH + 26);
    ctx.stroke();

    // Watermark seal (faint)
    ctx.save();
    ctx.globalAlpha = 0.055;
    ctx.strokeStyle = '#0a3318';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(W - 180, H / 2, 100, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(W - 180, H / 2, 87, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Photo placeholder
    const photoX = 20, photoY = headerH + 36, photoW = 195, photoH = 210;
    const photoGrad = ctx.createLinearGradient(photoX, photoY, photoX + photoW, photoY + photoH);
    photoGrad.addColorStop(0, '#fef9c3');
    photoGrad.addColorStop(0.5, '#fde68a');
    photoGrad.addColorStop(1, '#f59e0b');
    rr(photoX, photoY, photoW, photoH, 8);
    ctx.fillStyle = photoGrad;
    ctx.fill();
    ctx.strokeStyle = '#c8a018';
    ctx.lineWidth = 3;
    rr(photoX, photoY, photoW, photoH, 8);
    ctx.stroke();
    // Person silhouette
    ctx.fillStyle = '#c4c4c4';
    ctx.beginPath();
    ctx.ellipse(photoX + photoW / 2, photoY + 75, 30, 33, 0, 0, Math.PI * 2);
    ctx.fill();
    rr(photoX + photoW / 2 - 40, photoY + 115, 80, 45, 8);
    ctx.fill();
    // CARD HOLDER label
    ctx.fillStyle = '#1a6b3a';
    ctx.font = '600 7.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CARD HOLDER', photoX + photoW / 2, photoY + photoH + 14);

    // Info fields (positioned to the right with padding)
    const infoX = 280, infoY = headerH + 60;
    ctx.textAlign = 'left';

    // Last Name
    ctx.font = 'italic 7.5px serif';
    ctx.fillStyle = '#2d6b40';
    ctx.fillText('Apelyido', infoX, infoY);
    ctx.fillStyle = '#2d6b40';
    ctx.fillText('/', infoX + 42, infoY);
    ctx.fillStyle = '#666';
    ctx.fillText('Last Name', infoX + 50, infoY);
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#0a2e1a';
    ctx.fillText((patient.last_name || 'N/A').toUpperCase(), infoX, infoY + 18);
    // Underline
    ctx.strokeStyle = 'rgba(0,100,40,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(infoX, infoY + 24);
    ctx.lineTo(W - 30, infoY + 24);
    ctx.stroke();

    // Given Names
    ctx.font = 'italic 7.5px serif';
    ctx.fillStyle = '#2d6b40';
    ctx.fillText('Mga Pangalan', infoX, infoY + 42);
    ctx.fillStyle = '#2d6b40';
    ctx.fillText('/', infoX + 64, infoY + 42);
    ctx.fillStyle = '#666';
    ctx.fillText('Given Names', infoX + 72, infoY + 42);
    const givenNames = [patient.first_name, patient.middle_name].filter(Boolean).join(' ').toUpperCase();
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#0a2e1a';
    ctx.fillText(givenNames || 'N/A', infoX, infoY + 60);
    // Underline
    ctx.beginPath();
    ctx.moveTo(infoX, infoY + 66);
    ctx.lineTo(W - 30, infoY + 66);
    ctx.stroke();

    // Date of Birth
    ctx.font = 'italic 7.5px serif';
    ctx.fillStyle = '#2d6b40';
    ctx.fillText('Petsa ng Kapanganakan', infoX, infoY + 84);
    ctx.fillStyle = '#2d6b40';
    ctx.fillText('/', infoX + 100, infoY + 84);
    ctx.fillStyle = '#666';
    ctx.fillText('Date of Birth', infoX + 108, infoY + 84);
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#0a2e1a';
    ctx.fillText(formatDate(patient.birth_date).toUpperCase(), infoX, infoY + 102);
    // Underline
    ctx.beginPath();
    ctx.moveTo(infoX, infoY + 108);
    ctx.lineTo(W - 30, infoY + 108);
    ctx.stroke();

    // Sex
    ctx.font = 'italic 7.5px serif';
    ctx.fillStyle = '#2d6b40';
    ctx.fillText('Kasarian', infoX, infoY + 126);
    ctx.fillStyle = '#2d6b40';
    ctx.fillText('/', infoX + 40, infoY + 126);
    ctx.fillStyle = '#666';
    ctx.fillText('Sex', infoX + 48, infoY + 126);
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#0a2e1a';
    ctx.fillText((patient.sex || 'N/A').toUpperCase(), infoX, infoY + 144);
    // Underline
    ctx.beginPath();
    ctx.moveTo(infoX, infoY + 150);
    ctx.lineTo(W - 30, infoY + 150);
    ctx.stroke();

    // Footer
    const footerY = H - 40;
    // Footer border top
    ctx.strokeStyle = 'rgba(0,100,40,0.13)';
    ctx.beginPath();
    ctx.moveTo(20, footerY);
    ctx.lineTo(W - 20, footerY);
    ctx.stroke();

    // DOH text
    ctx.fillStyle = '#1a6b3a';
    ctx.font = '500 7.5px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('DOH — UHC Act R.A. 11223', 20, footerY + 22);

    // Date issued
    const dateIssued = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
    ctx.fillStyle = '#0a3318';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DATE ISSUED: ' + dateIssued, W / 2 - 20, footerY + 22);

    // PHL text
    ctx.font = 'bold 19px serif';
    ctx.fillStyle = '#1a6b3a';
    ctx.textAlign = 'right';
    ctx.fillText('PHL', W - 60, footerY + 22);

    // DOH-UHC badge (circular)
    ctx.beginPath();
    ctx.arc(W - 30, footerY + 16, 15, 0, Math.PI * 2);
    const badgeGrad = ctx.createLinearGradient(W - 45, footerY + 1, W - 15, footerY + 31);
    badgeGrad.addColorStop(0, '#1a6b3a');
    badgeGrad.addColorStop(1, '#0d4422');
    ctx.fillStyle = badgeGrad;
    ctx.fill();
    ctx.strokeStyle = '#c8a018';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#e8c830';
    ctx.font = 'bold 6px serif';
    ctx.textAlign = 'center';
    ctx.fillText('DOH', W - 30, footerY + 14);
    ctx.fillText('UHC', W - 30, footerY + 22);

    ctx.restore(); // End front side translation

    // ══════════════════════════════════════════════════════════════════════════
    // BACK SIDE
    // ══════════════════════════════════════════════════════════════════════════
    
    const backLabelY = LABEL_H + H + GAP;
    ctx.fillStyle = '#0d4422';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('— BACK —', W / 2, backLabelY + 20);
    
    const backY = backLabelY + LABEL_H;
    drawCardBase(backY);
    
    ctx.save();
    ctx.translate(0, backY);

    // Magnetic strip
    ctx.save();
    rr(0, 0, W, H, 18);
    ctx.clip();
    const stripGrad = ctx.createLinearGradient(0, 0, W, 0);
    stripGrad.addColorStop(0, '#1a1a1a');
    stripGrad.addColorStop(0.5, '#2d2d2d');
    stripGrad.addColorStop(1, '#1a1a1a');
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = stripGrad;
    ctx.fillRect(0, 0, W, 34);
    ctx.globalAlpha = 1;
    // Shine on strip
    const shineGrad = ctx.createLinearGradient(0, 0, 0, 34);
    shineGrad.addColorStop(0, 'rgba(255,255,255,0.07)');
    shineGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = shineGrad;
    ctx.fillRect(0, 0, W, 34);
    ctx.restore();

    // Watermark seal (faint, centered)
    ctx.save();
    ctx.globalAlpha = 0.045;
    ctx.strokeStyle = '#0a3318';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 100, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 87, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Back header
    ctx.fillStyle = '#0d4422';
    ctx.font = '600 8px serif';
    ctx.textAlign = 'center';
    ctx.fillText('Republika ng Pilipinas · Republic of the Philippines', W / 2, 52);
    ctx.fillStyle = '#0a3318';
    ctx.font = 'bold 15px serif';
    ctx.fillText('UNIVERSAL HEALTH CARE', W / 2, 70);
    ctx.fillStyle = '#1a6b3a';
    ctx.font = '600 8px sans-serif';
    ctx.fillText('Member Identification Card', W / 2, 84);

    // Header border
    ctx.strokeStyle = 'rgba(0,100,40,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20, 92);
    ctx.lineTo(W - 20, 92);
    ctx.stroke();

    // QR Code section
    const qrSize = 180;
    const qrX = (W - qrSize) / 2;
    const qrY = 110;

    // QR border (gold)
    ctx.strokeStyle = '#c8a018';
    ctx.lineWidth = 3;
    rr(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 9);
    ctx.stroke();
    // Outer glow
    ctx.strokeStyle = 'rgba(200,160,24,0.32)';
    ctx.lineWidth = 1.5;
    rr(qrX - 14, qrY - 14, qrSize + 28, qrSize + 28, 12);
    ctx.stroke();
    // White background
    ctx.fillStyle = '#ffffff';
    rr(qrX, qrY, qrSize, qrSize, 4);
    ctx.fill();

    // Load and draw QR image
    const qrImg = new Image();
    qrImg.src = qrUrl;
    await new Promise<void>((resolve) => {
      qrImg.onload = () => {
        ctx.drawImage(qrImg, qrX + 4, qrY + 4, qrSize - 8, qrSize - 8);
        resolve();
      };
      qrImg.onerror = () => resolve();
    });

    // Scan to Verify text
    ctx.fillStyle = '#0a3318';
    ctx.font = 'bold 11px serif';
    ctx.textAlign = 'center';
    ctx.fillText('Scan to Verify', W / 2, qrY + qrSize + 20);
    ctx.fillStyle = '#2d6b40';
    ctx.font = '600 8px sans-serif';
    ctx.fillText('UHC Member Verification Portal', W / 2, qrY + qrSize + 34);
    ctx.fillStyle = 'rgba(0,60,20,0.38)';
    ctx.font = '6px sans-serif';
    ctx.fillText(qrValue, W / 2, qrY + qrSize + 46);

    // Back footer
    const backFooterY = H - 40;
    ctx.strokeStyle = 'rgba(0,100,40,0.13)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(20, backFooterY);
    ctx.lineTo(W - 20, backFooterY);
    ctx.stroke();

    ctx.fillStyle = '#1a6b3a';
    ctx.font = '500 7.5px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('DOH — UHC Act R.A. 11223', 20, backFooterY + 22);

    ctx.fillStyle = '#0a3318';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VALID WHILE MEMBERSHIP IS ACTIVE', W / 2, backFooterY + 22);

    ctx.font = 'bold 19px serif';
    ctx.fillStyle = '#1a6b3a';
    ctx.textAlign = 'right';
    ctx.fillText('PHL', W - 20, backFooterY + 22);

    ctx.restore(); // End back side translation

    return canvas;
  }, []);

  // ─── Search: module3 — flat sequential fetches ────────────────────────────
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
    } finally { setIsSearching(false); }
  };

  // ── Select patient: check PIN first before proceeding ──────────────────────
  const selectPatient = async (p: PatientProfile) => {
    setSearchResults([]);
    setSearchQuery(`${p.first_name} ${p.last_name}`);
    setErrorMessage('');
    setIsCheckingPin(true);

    try {
      // Check if patient has a health_card and PIN in module4
      let { data: card } = await supabase
        .schema('module4').from('health_card')
        .select('id, pin')
        .eq('patient_profile', p.id)
        .maybeSingle();

      // Auto-create health_card if it doesn't exist
      if (!card) {
        const { data: newCard } = await supabase
          .schema('module4').from('health_card')
          .insert({ patient_profile: p.id })
          .select('id, pin')
          .single();
        card = newCard;
      }

      const cardId = card?.id ?? null;
      const cardHasPin = Boolean(card?.pin);

      // Show PIN gate modal
      setPendingPatient(p);
      setPendingCardId(cardId);
      setPendingHasPin(cardHasPin);
      setShowPinGate(true);
    } catch (err) {
      console.error('PIN check error:', err);
      setErrorMessage('Failed to check PIN status. Please try again.');
    } finally {
      setIsCheckingPin(false);
    }
  };

  // Called after PIN verified or set successfully
  const commitPatientSelect = useCallback(async (p: PatientProfile) => {
    setShowPinGate(false);
    setPendingPatient(null);
    setSelectedPatient(p);
    setDocuments([]);
    setQrCodeValue(null);
    setQrDataUrl(null);
    setExpandedFolder(null);
    setHealthCardId(null);
    setHasPin(false);
    setPinSuccess('');
    setProfilePicUrl(null);
    await loadPatientData(p);
  }, []);

  const closePinGate = useCallback(() => {
    setShowPinGate(false);
    setPendingPatient(null);
    setSearchQuery('');
  }, []);

  // ─── Load patient data ─────────────────────────────────────────────────────
  // All health card data lives in module4.
  // patient.id (UUID from module3) is stored in module4.health_card.patient_profile.
  const loadPatientData = async (patient: PatientProfile) => {
    setIsLoadingDocs(true);
    setIsLoadingQr(true);
    setErrorMessage('');
    try {
      // Step 1: find existing health_card in module4
      let { data: card, error: cardErr } = await supabase
        .schema('module4')               // ← always module4 for health_card
        .from('health_card')
        .select('id, qr_code, pin')
        .eq('patient_profile', patient.id) // patient.id = UUID from module3
        .maybeSingle();                  // no error if row doesn't exist

      if (cardErr) { console.error('health_card fetch error:', cardErr); throw cardErr; }

      // Step 2: auto-create health_card row so member can set PIN immediately,
      // even before the operator has generated a QR code.
      if (!card) {
        const { data: newCard, error: insertErr } = await supabase
          .schema('module4')
          .from('health_card')
          .insert({ patient_profile: patient.id }) // link to module3 patient UUID
          .select('id, qr_code, pin')
          .single();

        if (insertErr) {
          // Race condition — try fetching again before giving up
          console.warn('health_card auto-create failed, retrying:', insertErr.message);
          const { data: retry } = await supabase
            .schema('module4').from('health_card')
            .select('id, qr_code, pin')
            .eq('patient_profile', patient.id)
            .maybeSingle();
          card = retry;
        } else {
          card = newCard;
        }
      }

      if (!card) {
        // Couldn't get or create a card — stop loading, show nothing
        setIsLoadingQr(false);
        console.warn('Could not obtain health_card for patient:', patient.id);
        return;
      }

      // Step 3: populate state from health_card row
      setHealthCardId(card.id);
      // hasPin = true only if pin column is a non-empty string (not null, not '')
      setHasPin(typeof card.pin === 'string' && card.pin.trim().length > 0);

      if (card.qr_code) {
        setQrCodeValue(card.qr_code);
        const du = await generateQrDataUrl(card.qr_code);
        setQrDataUrl(du);
      }
      setIsLoadingQr(false);

      // Step 4: fetch attached documents from module4.card_attachment
      const { data: attachments, error: attachErr } = await supabase
        .schema('module4')               // ← module4 for attachments
        .from('card_attachment')
        .select('id, attachment, status, card_category:card_category(id, description)')
        .eq('health_card', card.id)      // FK to module4.health_card.id
        .eq('status', true);

      if (attachErr) { console.error('card_attachment fetch error:', attachErr); throw attachErr; }

      const docs: DocumentAttachment[] = (attachments ?? []).map((a: any) => {
        const cat = Array.isArray(a.card_category) ? a.card_category[0] : a.card_category;
        return { id: a.id, attachment: a.attachment, status: a.status, category: cat?.description ?? 'Uncategorized', archived: false };
      });
      setDocuments(docs);

      // Step 5: load profile picture from card-user-picture bucket
      try {
        const { data: picFiles } = await supabase.storage.from('card-user-picture').list('', { search: patient.id });
        const picMatch = picFiles?.find((f) => f.name.startsWith(patient.id));
        if (picMatch) {
          const { data: pub } = supabase.storage.from('card-user-picture').getPublicUrl(picMatch.name);
          setProfilePicUrl(pub.publicUrl + '?t=' + Date.now());
        }
      } catch { /* profile pic is optional */ }
    } catch (err) {
      console.error('loadPatientData error:', err);
      setErrorMessage('Failed to load patient data. Please try again.');
      setIsLoadingQr(false);
    } finally { setIsLoadingDocs(false); }
  };

  // ─── Save PIN ──────────────────────────────────────────────────────────────
  // Writes to module4.health_card.pin (varchar column).
  // If mode='change', first verifies the current PIN from DB.
  const handleSavePin = async (newPin: string, oldPin?: string) => {
    if (!healthCardId) {
      setPinError('Health card not found. Please reload the page and try again.');
      return;
    }
    setIsPinLoading(true);
    setPinError('');
    try {
      // Verify old PIN against DB (not local state) when changing
      if (oldPin !== undefined) {
        const { data: current, error: fetchErr } = await supabase
          .schema('module4')             // ← module4
          .from('health_card')
          .select('pin')
          .eq('id', healthCardId)
          .single();

        if (fetchErr) throw fetchErr;

        if (current?.pin !== oldPin) {
          setPinError('Current PIN is incorrect. Please try again.');
          setIsPinLoading(false);
          return;
        }
      }

      // Write new PIN to module4.health_card.pin
      const { error: updateErr } = await supabase
        .schema('module4')               // ← module4
        .from('health_card')
        .update({ pin: newPin })
        .eq('id', healthCardId);

      if (updateErr) throw updateErr;

      setHasPin(true);
      setPinModalMode(null);
      setPinSuccess(
        oldPin !== undefined
          ? 'PIN changed successfully!'
          : 'PIN set! Share it with your operator only when you are physically present.'
      );
      setTimeout(() => setPinSuccess(''), 6000);
    } catch (e) {
      console.error('handleSavePin error:', e);
      setPinError('Failed to save PIN. Please try again.');
    } finally { setIsPinLoading(false); }
  };

  // ─── Card download ─────────────────────────────────────────────────────────
  const handleDownloadCard = useCallback(async () => {
    if (!selectedPatient || !qrDataUrl || !qrCodeValue) return;
    setIsCapturing(true);
    try {
      const canvas = await buildCardCanvas(selectedPatient, qrDataUrl, qrCodeValue, profilePicUrl);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `UHC_HealthCard_FrontBack_${selectedPatient.last_name}_${selectedPatient.first_name}.png`;
      a.click();
    } catch (e) { console.error('Download error:', e); }
    finally { setIsCapturing(false); }
  }, [selectedPatient, qrDataUrl, qrCodeValue, profilePicUrl, buildCardCanvas]);

  // ─── Print card ────────────────────────────────────────────────────────────
  const handlePrintCard = useCallback(async () => {
    if (!selectedPatient || !qrDataUrl || !qrCodeValue) return;
    setIsCapturing(true);
    try {
      const canvas = await buildCardCanvas(selectedPatient, qrDataUrl, qrCodeValue, profilePicUrl);
      setPrintModalImg(canvas.toDataURL('image/png'));
    } catch (e) { console.error('Print error:', e); }
    finally { setIsCapturing(false); }
  }, [selectedPatient, qrDataUrl, qrCodeValue, profilePicUrl, buildCardCanvas]);

  // ─── Archive helpers ───────────────────────────────────────────────────────
  const handleArchive  = () => {
    if (!archiveTarget) return;
    setDocuments((prev) => prev.map((d) => d.id === archiveTarget.id ? { ...d, archived: true } : d));
    setArchiveTarget(null);
  };
  const handleRestore = (id: string) =>
    setDocuments((prev) => prev.map((d) => d.id === id ? { ...d, archived: false } : d));

  const getDocsForFolder = (folderKey: string, archived = false) =>
    documents.filter((d) =>
      docMatchesFolder(d.category, folderKey) && d.archived === archived &&
      (!filterQuery || d.attachment.toLowerCase().includes(filterQuery.toLowerCase()) || d.category.toLowerCase().includes(filterQuery.toLowerCase()))
    );

  const totalActive   = documents.filter((d) => !d.archived).length;
  const totalArchived = documents.filter((d) =>  d.archived).length;

  // When a filter is active, determine which folders have matches so we can auto-expand them
  const filterMatchedFolderKeys = filterQuery
    ? FOLDER_DEFS.map((f) => f.key).filter((key) => getDocsForFolder(key, false).length > 0)
    : [];
  const totalFilterMatches = filterQuery
    ? filterMatchedFolderKeys.reduce((sum, key) => sum + getDocsForFolder(key, false).length, 0)
    : 0;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <BreadcrumbComp title="My Health Card" items={BCrumb} />

      {/* ── Modals ── */}
      {previewDoc && (
        <PdfPreviewModal
          url={previewDoc.attachment}
          name={displayFileName(previewDoc.attachment, selectedPatient)}
          onClose={() => setPreviewDoc(null)}
        />
      )}
      {archiveTarget && (
        <ArchiveConfirmModal doc={archiveTarget} onConfirm={handleArchive} onCancel={() => setArchiveTarget(null)} />
      )}
      {pinModalMode && (
        <PinModal
          mode={pinModalMode}
          onConfirm={handleSavePin}
          onCancel={() => { setPinModalMode(null); setPinError(''); }}
          isLoading={isPinLoading}
          error={pinError}
        />
      )}
      {showPinGate && pendingPatient && (
        <MemberPinGateModal
          patientName={fullName(pendingPatient)}
          hasPin={pendingHasPin}
          healthCardId={pendingCardId}
          onVerified={() => commitPatientSelect(pendingPatient)}
          onPinSet={() => {
            // PIN was just set → mark hasPin and proceed
            setPendingHasPin(true);
            commitPatientSelect(pendingPatient);
          }}
          onClose={closePinGate}
        />
      )}
      {printModalImg && selectedPatient && (
        <PrintModal
          imgUrl={printModalImg}
          patientName={fullName(selectedPatient)}
          onClose={() => setPrintModalImg(null)}
          onDownload={handleDownloadCard}
          isCapturing={isCapturing}
        />
      )}

      <div className="flex flex-col gap-6">

        {/* ── Search ── */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
            <Search className="w-5 h-5 text-green-600" /> Find My Records
          </h3>
          <p className="text-xs text-gray-400 mb-2">Search by your first or last name to view your profile and documents.</p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter your name…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching} className="flex gap-2 bg-green-700 hover:bg-green-800">
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Search
            </Button>
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="mt-3 border rounded-lg overflow-hidden divide-y shadow-sm">
              {searchResults.map((p) => (
                <button key={p.id} onClick={() => selectPatient(p)}
                  disabled={isCheckingPin}
                  className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors flex items-center gap-3 disabled:opacity-60">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs flex-shrink-0">
                    {p.first_name[0]}{p.last_name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{fullName(p)}</p>
                    <p className="text-xs text-gray-500">{p.sex} · DOB: {formatDate(p.birth_date)} · {getFullAddress(p.brgy)}</p>
                  </div>
                  {isCheckingPin
                    ? <Loader2 className="w-4 h-4 text-green-600 animate-spin flex-shrink-0" />
                    : <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  }
                </button>
              ))}
            </div>
          )}

          {/* Error */}
          {errorMessage && !selectedPatient && (
            <div className="mt-3 flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><p>{errorMessage}</p>
            </div>
          )}

          {/* Selected patient banner */}
          {selectedPatient && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {profilePicUrl ? (
                  <img src={profilePicUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-green-300" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-sm">
                    {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-green-900">{fullName(selectedPatient)}</p>
                  <p className="text-xs text-green-600">
                    {selectedPatient.sex} · {formatDate(selectedPatient.birth_date)} · {computeAge(selectedPatient.birth_date)} · {getFullAddress(selectedPatient.brgy)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium">
                <span className="flex items-center gap-1 text-green-700"><CheckCircle2 className="w-3.5 h-3.5" />{totalActive} active documents</span>
                {totalArchived > 0 && <span className="flex items-center gap-1 text-amber-600"><Archive className="w-3.5 h-3.5" />{totalArchived} archived</span>}
              </div>
            </div>
          )}
        </Card>

        {/* ── Tabs (patient selected) ── */}
        {selectedPatient && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="documents">My Documents</TabsTrigger>
              <TabsTrigger value="qrcode">My Health Card</TabsTrigger>
              <TabsTrigger value="archive">
                Archive
                {totalArchived > 0 && (
                  <span className="ml-1.5 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{totalArchived}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="pin" className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> My PIN
                {hasPin && <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />}
              </TabsTrigger>
            </TabsList>

            {/* ════ DOCUMENTS ════ */}
            <TabsContent value="documents">
              <Card className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" /> My Documents
                  </h3>
                  <div className="flex gap-2 items-center">
                    <Input placeholder="Search documents…" value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)} className="w-48 text-sm" />
                    {filterQuery && (
                      <Button size="sm" variant="outline" onClick={() => setFilterQuery('')} className="flex gap-1 text-xs">
                        <RefreshCw className="w-3.5 h-3.5" /> Clear
                      </Button>
                    )}
                  </div>
                </div>

                {isLoadingDocs ? (
                  <div className="flex flex-col items-center py-12 gap-3 text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                    <p className="text-sm">Loading your documents…</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {FOLDER_DEFS.map((folder) => {
                      const colors   = COLOR_MAP[folder.color as ColorKey];
                      const docs     = getDocsForFolder(folder.key, false);
                      const allCount = documents.filter((d) => docMatchesFolder(d.category, folder.key) && !d.archived).length;
                      // Auto-expand folders that have search matches; otherwise use manual toggle
                      const isExp    = filterQuery
                        ? filterMatchedFolderKeys.includes(folder.key)
                        : expandedFolder === folder.key;
                      return (
                        <div key={folder.key} className={`border rounded-xl overflow-hidden ${colors.border}`}>
                          <button
                            className={`w-full flex items-center gap-4 px-5 py-4 ${colors.bg} transition-colors hover:opacity-90`}
                            onClick={() => setExpandedFolder(isExp ? null : folder.key)}
                          >
                            <span className={colors.text}>{folder.icon}</span>
                            <div className="flex-1 text-left">
                              <p className={`font-semibold ${colors.text}`}>{folder.label}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              {allCount > 0 && (
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>
                                  {allCount} file{allCount > 1 ? 's' : ''}
                                </span>
                              )}
                              {isExp ? <ChevronDown className={`w-4 h-4 ${colors.text}`} /> : <ChevronRight className={`w-4 h-4 ${colors.text}`} />}
                            </div>
                          </button>
                          {isExp && (
                            <div className="p-4 border-t bg-white">
                              {docs.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                  <p className="text-sm">No documents in this folder yet.</p>
                                  <p className="text-xs mt-1">Your health center operator will upload documents here.</p>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-2">
                                  {docs.map((doc) => (
                                    <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors">
                                      <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">{displayFileName(doc.attachment, selectedPatient)}</p>
                                        <p className="text-xs text-gray-400">{doc.category}</p>
                                      </div>
                                      <Button size="sm" variant="outline" className="flex gap-1.5 text-xs border-green-300 text-green-700 hover:bg-green-50 flex-shrink-0" onClick={() => setPreviewDoc(doc)}>
                                        <Eye className="w-3.5 h-3.5" /> View
                                      </Button>
                                      <Button size="sm" variant="outline" className="flex gap-1.5 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 flex-shrink-0" onClick={() => setArchiveTarget(doc)}>
                                        <Archive className="w-3.5 h-3.5" /> Archive
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* No results message when filter is active */}
                    {filterQuery && totalFilterMatches === 0 && (
                      <div className="text-center py-10 text-gray-400">
                        <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="font-medium text-gray-500">No documents found</p>
                        <p className="text-sm mt-1">No documents matching "<span className="font-semibold text-gray-600">{filterQuery}</span>" were found.</p>
                        <Button size="sm" variant="outline" onClick={() => setFilterQuery('')} className="mt-4 flex gap-1.5 text-xs mx-auto">
                          <RefreshCw className="w-3.5 h-3.5" /> Clear search
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* ════ HEALTH CARD ════ */}
            <TabsContent value="qrcode">
              {isLoadingQr ? (
                <Card className="p-6">
                  <div className="flex flex-col items-center py-12 gap-3 text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                    <p className="text-sm">Loading your health card…</p>
                  </div>
                </Card>
              ) : qrDataUrl && qrCodeValue ? (
                <div className="flex flex-col gap-4">
                  <Card className="p-5">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-green-600" /> My Health ID Card
                        </h3>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm">Download or print your card and bring it to a print shop for a physical ID.</p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" onClick={handlePrintCard} disabled={isCapturing} className="flex gap-2 border-gray-300 text-gray-700 hover:bg-gray-50">
                          {isCapturing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />} Print Card
                        </Button>
                        <Button onClick={handleDownloadCard} disabled={isCapturing} className="flex gap-2 bg-green-700 hover:bg-green-800 text-white">
                          {isCapturing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Download Card
                        </Button>
                        <a href={qrDataUrl} download={`QR_${selectedPatient?.last_name}_${selectedPatient?.first_name}.png`}
                          className="inline-flex items-center gap-2 text-sm border border-blue-300 text-blue-700 hover:bg-blue-50 rounded-md px-3 py-2 transition-colors font-medium">
                          <QrCode className="w-4 h-4" /> QR Only
                        </a>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-6">
                    <div className="overflow-x-auto flex justify-center">
                      <HealthIdCard patient={selectedPatient!} qrDataUrl={qrDataUrl} qrCodeValue={qrCodeValue} cardRef={cardRef} profilePicUrl={profilePicUrl} />
                    </div>
                  </Card>
                </div>
              ) : (
                <Card className="p-6">
                  <div className="flex flex-col items-center py-12 gap-3 text-gray-400">
                    <QrCode className="w-16 h-16 opacity-20" />
                    <p className="font-medium text-gray-500">No Health Card Generated Yet</p>
                    <p className="text-sm text-center max-w-xs">Your health center operator has not generated a health card for your profile yet. Please contact your health center to request one.</p>
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* ════ ARCHIVE ════ */}
            <TabsContent value="archive">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Archive className="w-5 h-5 text-amber-600" /> Archived Documents
                  </h3>
                  <span className="text-xs text-gray-400">{totalArchived} archived</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2 mb-5">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">Archived documents are hidden from your main view but not deleted. Restore them anytime. For permanent removal, contact your health center administrator.</p>
                </div>
                {totalArchived === 0 ? (
                  <div className="flex flex-col items-center py-12 gap-3 text-gray-400">
                    <ArchiveX className="w-12 h-12 opacity-20" />
                    <p className="font-medium">No Archived Documents</p>
                    <p className="text-sm">Documents you archive will appear here.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {FOLDER_DEFS.map((folder) => {
                      const archivedDocs = documents.filter((d) => docMatchesFolder(d.category, folder.key) && d.archived);
                      if (!archivedDocs.length) return null;
                      const colors = COLOR_MAP[folder.color as ColorKey];
                      return (
                        <div key={folder.key} className={`border rounded-xl overflow-hidden ${colors.border}`}>
                          <div className={`flex items-center gap-3 px-5 py-3 ${colors.bg}`}>
                            <span className={colors.text}>{folder.icon}</span>
                            <p className={`font-semibold text-sm ${colors.text}`}>{folder.label}</p>
                            <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>{archivedDocs.length}</span>
                          </div>
                          <div className="p-4 bg-white border-t flex flex-col gap-2">
                            {archivedDocs.map((doc) => (
                              <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-amber-100 bg-amber-50">
                                <FileText className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-700 truncate">{displayFileName(doc.attachment, selectedPatient)}</p>
                                  <p className="text-xs text-gray-400">{doc.category}</p>
                                </div>
                                <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex-shrink-0">Archived</span>
                                <Button size="sm" variant="outline" className="flex gap-1.5 text-xs border-green-300 text-green-700 hover:bg-green-50 flex-shrink-0" onClick={() => setPreviewDoc(doc)}>
                                  <Eye className="w-3.5 h-3.5" /> View
                                </Button>
                                <Button size="sm" variant="outline" className="flex gap-1.5 text-xs border-blue-300 text-blue-700 hover:bg-blue-50 flex-shrink-0" onClick={() => handleRestore(doc.id)}>
                                  <ArchiveRestore className="w-3.5 h-3.5" /> Restore
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* ════ PIN TAB ════ */}
            <TabsContent value="pin">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">My Security PIN</h3>
                    <p className="text-xs text-gray-400">Your 4-digit PIN protects your health records from unauthorized access.</p>
                  </div>
                </div>

                {/* Success */}
                {pinSuccess && (
                  <div className="mb-5 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-700 font-medium">{pinSuccess}</p>
                  </div>
                )}

                {/* No health card yet — still show the card but disable the button */}
                {!healthCardId && (
                  <div className="mb-5 flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-700">
                      Your health card record is being set up. Once ready, you can set your PIN here. This usually happens automatically when you search your name.
                    </p>
                  </div>
                )}

                {/* PIN status block */}
                <div className={`rounded-2xl border-2 p-6 mb-5 ${
                  hasPin ? 'border-green-200 bg-green-50' : 'border-dashed border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${hasPin ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {hasPin
                          ? <ShieldCheck className="w-7 h-7 text-green-600" />
                          : <ShieldAlert className="w-7 h-7 text-gray-400" />}
                      </div>
                      <div>
                        <p className={`font-bold text-base ${hasPin ? 'text-green-800' : 'text-gray-600'}`}>
                          {hasPin ? 'PIN is Active' : 'No PIN Set'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 max-w-xs leading-relaxed">
                          {hasPin
                            ? 'Your records are protected. Give your PIN to the operator only when you are present.'
                            : 'Set a PIN so operators must ask for it before accessing your records.'}
                        </p>
                      </div>
                    </div>

                    {/* Button — shown when healthCardId is ready */}
                    {healthCardId ? (
                      <Button
                        onClick={() => { setPinError(''); setPinModalMode(hasPin ? 'change' : 'set'); }}
                        className={hasPin
                          ? 'flex gap-2 border border-green-300 text-green-700 bg-white hover:bg-green-50'
                          : 'flex gap-2 bg-green-700 hover:bg-green-800 text-white'}
                        variant={hasPin ? 'outline' : 'default'}
                      >
                        <KeyRound className="w-4 h-4" />
                        {hasPin ? 'Change PIN' : 'Set PIN'}
                      </Button>
                    ) : (
                      <Button disabled className="flex gap-2 bg-gray-200 text-gray-400 cursor-not-allowed">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                      </Button>
                    )}
                  </div>
                </div>

                {/* How it works */}
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">How the PIN works</p>
                  <div className="flex flex-col gap-3">
                    {[
                      { icon: <Lock        className="w-4 h-4 text-green-600" />, text: 'You set a 4-digit PIN that only you know.' },
                      { icon: <ShieldCheck className="w-4 h-4 text-blue-600" />,  text: 'Operators must ask you for your PIN before accessing your records.' },
                      { icon: <KeyRound    className="w-4 h-4 text-amber-600" />, text: 'Only give your PIN when you are physically at the health center.' },
                      { icon: <ShieldAlert className="w-4 h-4 text-red-500" />,   text: 'Never share your PIN over phone, text, or with anyone outside the health center.' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {item.icon}
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* ── Empty state ── */}
        {!selectedPatient && (
          <div className="flex flex-col items-center py-16 text-gray-400 gap-3">
            <IdCard className="w-16 h-16 opacity-20" />
            <p className="font-medium text-gray-500">Search your name to view your health card</p>
            <p className="text-sm">Your documents, QR code, and printable health ID card will appear here.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default UhcMember;