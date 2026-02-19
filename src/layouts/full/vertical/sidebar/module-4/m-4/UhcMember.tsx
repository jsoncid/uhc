'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { Input } from 'src/components/ui/input';
import { Button } from 'src/components/ui/button';
import { Card } from 'src/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import {
  Search, QrCode, FileText, Eye, Archive, ArchiveRestore,
  IdCard, Heart, Accessibility, Building2, Stethoscope, ClipboardList,
  ChevronDown, ChevronRight, AlertCircle, Loader2, Download, X,
  Printer, CheckCircle2, RefreshCw, ArchiveX, CreditCard,
  Lock, KeyRound, ShieldCheck, EyeOff, ShieldAlert,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import QRCodeLib from 'qrcode';
import { useUserProfile } from 'src/hooks/useUserProfile';
// Canvas-based card rendering (no html2canvas needed)

// ─── Supabase Client ───────────────────────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ?? '',
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
);

// ─── Types ─────────────────────────────────────────────────────────────────────
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

interface DocumentAttachment {
  id: string;
  attachment: string;
  category: string;
  status: boolean;
  archived?: boolean;
}

// ─── Folder Definitions (mirrors Operator) ────────────────────────────────────
const FOLDER_DEFS = [
  { key: 'basic_identification',   label: 'Basic Identification',   supabaseCategory: 'Basic Identification',   color: 'blue',   icon: <IdCard        className="w-5 h-5" /> },
  { key: 'philhealth',             label: 'PhilHealth',             supabaseCategory: 'PhilHealth',             color: 'red',    icon: <Heart         className="w-5 h-5" /> },
  { key: 'senior_pwd',             label: 'Senior / PWD',           supabaseCategory: 'Senior/PWD',             color: 'purple', icon: <Accessibility className="w-5 h-5" /> },
  { key: 'company_documents',      label: 'Company Employee',       supabaseCategory: 'Company Documents',      color: 'amber',  icon: <Building2     className="w-5 h-5" /> },
  { key: 'medical_documents',      label: 'Medical Documents',      supabaseCategory: 'Medical Documents',      color: 'green',  icon: <Stethoscope   className="w-5 h-5" /> },
  { key: 'admission_requirements', label: 'Admission Requirements', supabaseCategory: 'Admission Requirements', color: 'teal',   icon: <ClipboardList className="w-5 h-5" /> },
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

// ─── Mock Patients ─────────────────────────────────────────────────────────────
const MOCK_PATIENTS: PatientProfile[] = [
  { id: 'mock-0001', first_name: 'Maria',     middle_name: 'Santos',      last_name: 'Dela Cruz',  sex: 'Female', birth_date: '1990-03-15', brgy: { description: 'Barangay 1',  city_municipality: { description: 'Quezon City',  province: { description: 'Metro Manila', region: { description: 'NCR' } } } } },
  { id: 'mock-0002', first_name: 'Juan',      middle_name: 'Reyes',       last_name: 'Bautista',   sex: 'Male',   birth_date: '1985-07-22', brgy: { description: 'Barangay 5',  city_municipality: { description: 'Marikina',    province: { description: 'Metro Manila', region: { description: 'NCR' } } } } },
  { id: 'mock-0003', first_name: 'Ana',       middle_name: 'Lim',         last_name: 'Garcia',     sex: 'Female', birth_date: '1998-11-05', brgy: { description: 'Barangay 12', city_municipality: { description: 'Pasig',      province: { description: 'Metro Manila', region: { description: 'NCR' } } } } },
  { id: 'mock-0004', first_name: 'Pedro',     middle_name: 'Cruz',        last_name: 'Mendoza',    ext_name: 'Jr.', sex: 'Male', birth_date: '1972-01-30', brgy: { description: 'Barangay 8',  city_municipality: { description: 'Caloocan',   province: { description: 'Metro Manila', region: { description: 'NCR' } } } } },
  { id: 'mock-0005', first_name: 'Liza',      middle_name: 'Ramos',       last_name: 'Torres',     sex: 'Female', birth_date: '2001-06-18', brgy: { description: 'Barangay 3',  city_municipality: { description: 'Mandaluyong', province: { description: 'Metro Manila', region: { description: 'NCR' } } } } },
  { id: 'mock-0006', first_name: 'Carlo',     middle_name: 'Delos Reyes', last_name: 'Villanueva', sex: 'Male',   birth_date: '1995-09-10', brgy: { description: 'Barangay 7',  city_municipality: { description: 'Taguig',     province: { description: 'Metro Manila', region: { description: 'NCR' } } } } },
  { id: 'mock-0007', first_name: 'Christine', middle_name: 'Joy',         last_name: 'Bersano',    sex: 'Female', birth_date: '1993-12-25', brgy: { description: 'Barangay 2',  city_municipality: { description: 'Muntinlupa', province: { description: 'Metro Manila', region: { description: 'NCR' } } } } },
];

const MOCK_QR_CODES: Record<string, string> = {
  'mock-0001': 'UHC-4D41524941532D30-MOCK001-MARIA',
  'mock-0002': 'UHC-4A55414E532D3030-MOCK002-JUAN',
  'mock-0003': 'UHC-414E41532D303030-MOCK003-ANA',
  'mock-0004': 'UHC-504544524F532D30-MOCK004-PEDRO',
  'mock-0005': 'UHC-4C495A41532D3030-MOCK005-LIZA',
  'mock-0006': 'UHC-4341524C4F532D30-MOCK006-CARLO',
  'mock-0007': 'UHC-43485249535430-MOCK007-CHRISTINE',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fullName = (p: PatientProfile) =>
  [p.first_name, p.middle_name, p.last_name, p.ext_name].filter(Boolean).join(' ');

const getFullAddress = (brgy: PatientProfile['brgy']): string => {
  if (!brgy) return 'N/A';
  if (typeof brgy === 'string') return brgy;
  const parts: string[] = [];
  if (brgy.description) parts.push(brgy.description);
  const city = brgy.city_municipality;
  if (city?.description) parts.push(city.description);
  const prov = city?.province;
  if (prov?.description) parts.push(prov.description);
  if (prov?.region?.description) parts.push(prov.region.description);
  return parts.join(', ') || 'N/A';
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return dateStr; }
};

const computeAge = (dateStr?: string): string => {
  if (!dateStr) return '';
  const birth = new Date(dateStr);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} yrs old`;
};

const filterMock = (q: string) =>
  MOCK_PATIENTS.filter((p) =>
    p.first_name.toLowerCase().includes(q.toLowerCase().trim()) ||
    p.last_name.toLowerCase().includes(q.toLowerCase().trim())
  );

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'My Health Card' }];

// ─── PDF Preview Modal ─────────────────────────────────────────────────────────
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
            const iframe = document.querySelector<HTMLIFrameElement>(`iframe[title="${name}"]`);
            if (iframe?.contentWindow) {
              iframe.contentWindow.focus();
              iframe.contentWindow.print();
            } else {
              window.print();
            }
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

// ─── Archive Confirm Modal ─────────────────────────────────────────────────────
const ArchiveConfirmModal = ({
  doc, onConfirm, onCancel,
}: { doc: DocumentAttachment; onConfirm: () => void; onCancel: () => void }) => (
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
          <p className="text-sm text-gray-700 truncate font-medium">{doc.attachment.split('/').pop() ?? 'Document'}</p>
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

// ─── Health ID Card (DOM preview only — download/print use canvas API) ───────
const HealthIdCard = ({
  patient, qrDataUrl, qrCodeValue, cardRef,
}: {
  patient: PatientProfile;
  qrDataUrl: string;
  qrCodeValue: string;
  cardRef?: React.RefObject<HTMLDivElement | null>;
}) => {
  const isMock    = patient.id.startsWith('mock-');
  const address   = getFullAddress(patient.brgy);
  const dob       = formatDate(patient.birth_date);
  const age       = computeAge(patient.birth_date);
  const name      = fullName(patient).toUpperCase();

  return (
    <div
      ref={cardRef}
      style={{
        width: 640,
        background: 'linear-gradient(135deg, #15803d 0%, #166534 45%, #14532d 100%)',
        borderRadius: 20,
        fontFamily: '"Georgia", "Times New Roman", serif',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 25px 70px rgba(0,0,0,0.45)',
        userSelect: 'none',
      }}
    >
      {/* Subtle diagonal pattern overlay */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.035, zIndex: 1,
        backgroundImage: 'repeating-linear-gradient(45deg, #ffffff 0, #ffffff 1px, transparent 0, transparent 14px)',
      }} />

      {/* Gold top stripe */}
      <div style={{ height: 7, background: 'linear-gradient(90deg, #d97706, #fbbf24, #f59e0b, #fbbf24, #d97706)', position: 'relative', zIndex: 2 }} />

      {/* Card body */}
      <div style={{ padding: '22px 28px 20px', position: 'relative', zIndex: 2 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          {/* Seal */}
          <div style={{
            width: 68, height: 68, flexShrink: 0,
            background: 'radial-gradient(circle at 35% 35%, #fef9c3, #fbbf24 60%, #d97706)',
            borderRadius: '50%',
            border: '3px solid #fbbf24',
            boxShadow: '0 3px 14px rgba(251,191,36,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#14532d', letterSpacing: '0.05em' }}>UHC</div>
              <div style={{ width: 36, height: 1, background: '#166534', margin: '2px auto' }} />
              <div style={{ fontSize: 10, fontWeight: 700, color: '#166534' }}>2026</div>
            </div>
          </div>

          {/* Title block */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, color: '#86efac', letterSpacing: '0.25em', marginBottom: 3, fontFamily: 'Arial, sans-serif' }}>
              REPUBLIC OF THE PHILIPPINES
            </div>
            <div style={{ fontSize: 21, fontWeight: 900, color: '#fbbf24', letterSpacing: '0.04em', lineHeight: 1 }}>
              UNIVERSAL HEALTH CARE
            </div>
            <div style={{ fontSize: 10, color: '#bbf7d0', letterSpacing: '0.18em', marginTop: 4, fontFamily: 'Arial, sans-serif' }}>
              MEMBER IDENTIFICATION CARD
            </div>
          </div>

          {isMock && (
            <div style={{ background: '#fef3c7', color: '#92400e', fontSize: 8, fontWeight: 800, padding: '3px 8px', borderRadius: 4, letterSpacing: '0.1em', flexShrink: 0 }}>
              DEMO
            </div>
          )}
        </div>

        {/* ── Gold divider ── */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #fbbf24 20%, #fbbf24 80%, transparent)', marginBottom: 18 }} />

        {/* ── Card body row ── */}
        <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>

          {/* LEFT: Patient Details */}
          <div style={{ flex: 1 }}>
            {/* Name */}
            <div style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(251,191,36,0.35)',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 10,
            }}>
              <div style={{ fontSize: 8, color: '#86efac', letterSpacing: '0.2em', marginBottom: 4, fontFamily: 'Arial, sans-serif' }}>
                MEMBER NAME
              </div>
              <div style={{ fontSize: name.length > 30 ? 15 : 18, fontWeight: 900, color: '#ffffff', lineHeight: 1.2, letterSpacing: '0.02em' }}>
                {name}
              </div>
            </div>

            {/* Details grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
              {/* Date of Birth */}
              <div style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 13px' }}>
                <div style={{ fontSize: 8, color: '#86efac', letterSpacing: '0.18em', marginBottom: 4, fontFamily: 'Arial, sans-serif' }}>DATE OF BIRTH</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{dob}</div>
              </div>
              {/* Address */}
              <div style={{ background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '9px 13px' }}>
                <div style={{ fontSize: 8, color: '#86efac', letterSpacing: '0.18em', marginBottom: 4, fontFamily: 'Arial, sans-serif' }}>ADDRESS</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>{address}</div>
              </div>
            </div>
          </div>

          {/* RIGHT: QR Code */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{
              background: '#fff',
              padding: 8,
              borderRadius: 14,
              border: '3.5px solid #fbbf24',
              boxShadow: '0 5px 22px rgba(0,0,0,0.35)',
            }}>
              <img src={qrDataUrl} alt="QR Code" style={{ width: 116, height: 116, display: 'block', borderRadius: 4 }} />
            </div>
            <div style={{
              fontSize: 7, color: '#86efac', textAlign: 'center',
              lineHeight: 1.5, maxWidth: 134, wordBreak: 'break-all',
              fontFamily: 'monospace',
            }}>
              {qrCodeValue.substring(0, 24)}…
            </div>
          </div>
        </div>

        {/* ── Footer divider + text ── */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #fbbf24 20%, #fbbf24 80%, transparent)', margin: '16px 0 10px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 8, color: '#86efac', letterSpacing: '0.1em', fontFamily: 'Arial, sans-serif' }}>
            VALID WHILE MEMBERSHIP IS ACTIVE
          </div>
          <div style={{ fontSize: 8, color: '#fbbf24', letterSpacing: '0.1em', fontWeight: 700, fontFamily: 'Arial, sans-serif' }}>
            DOH – UHC ACT R.A. 11223
          </div>
        </div>
      </div>

      {/* Gold bottom stripe */}
      <div style={{ height: 5, background: 'linear-gradient(90deg, #d97706, #fbbf24, #f59e0b, #fbbf24, #d97706)', position: 'relative', zIndex: 2 }} />
    </div>
  );
};

// ─── Card Preview Modal ────────────────────────────────────────────────────────
const CardPreviewModal = ({
  patient,
  qrDataUrl,
  qrCodeValue,
  cardRef,
  isCapturing,
  onClose,
  onDownload,
  onPrint,
}: {
  patient: PatientProfile;
  qrDataUrl: string;
  qrCodeValue: string;
  cardRef: React.RefObject<HTMLDivElement | null>;
  isCapturing: boolean;
  onClose: () => void;
  onDownload: () => void;
  onPrint: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col">

      {/* Modal Header */}
      <div className="flex items-center justify-between px-7 py-5 border-b bg-gradient-to-r from-green-700 to-green-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white text-lg leading-none">Health ID Card Preview</h2>
            <p className="text-green-200 text-xs mt-1">This is exactly what will be downloaded or printed</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Card display area */}
      <div className="flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 px-8 py-10 relative overflow-hidden">
        {/* Decorative background dots */}
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Floating label */}
        <div className="relative z-10 mb-6 flex items-center gap-2 bg-white border border-gray-200 shadow-sm rounded-full px-4 py-1.5">
          <Eye className="w-3.5 h-3.5 text-green-600" />
          <span className="text-xs font-medium text-gray-500">Live Preview</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        </div>

        {/* The actual card */}
        <div className="relative z-10 overflow-x-auto w-full flex justify-center">
          <div
            style={{
              filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.35))',
              transform: 'scale(1)',
              transition: 'transform 0.2s ease',
            }}
          >
            <HealthIdCard
              patient={patient}
              qrDataUrl={qrDataUrl}
              qrCodeValue={qrCodeValue}
              cardRef={cardRef}
            />
          </div>
        </div>

        {/* QR value */}
        <div className="relative z-10 mt-6 px-5 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl max-w-xl w-full">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">QR Code Value</p>
          <p className="font-mono text-xs text-gray-600 break-all leading-relaxed">{qrCodeValue}</p>
        </div>
      </div>

      {/* Footer actions */}
      <div className="px-7 py-5 border-t bg-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Print shop tip */}
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
            Download the card image and bring it to a print shop. Ask for <strong>CR80 laminated ID card</strong> printing for standard wallet size.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2 flex-wrap flex-shrink-0">
          <Button variant="outline" onClick={onClose} className="flex gap-2 text-sm">
            <X className="w-4 h-4" /> Close
          </Button>
          <Button
            variant="outline"
            onClick={onPrint}
            disabled={isCapturing}
            className="flex gap-2 text-sm border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            {isCapturing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            Print Card
          </Button>
          <Button
            onClick={onDownload}
            disabled={isCapturing}
            className="flex gap-2 text-sm bg-green-700 hover:bg-green-800 text-white"
          >
            {isCapturing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download Card
          </Button>
        </div>
      </div>
    </div>
  </div>
);

// ─── PIN Authentication Modal (for verifying PIN on entry) ──────────────────
const PinAuthModal = ({
  onConfirm,
  isLoading,
  error,
  hasExistingPin,
}: {
  onConfirm: (pin: string) => void;
  isLoading: boolean;
  error: string;
  hasExistingPin: boolean;
}) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [localErr, setLocalErr] = useState(error);

  const handleDigit = (d: string) => {
    if (pin.length < 4) setPin(pin + d);
  };

  const handleBack = () => {
    if (pin.length > 0) setPin(pin.slice(0, -1));
  };

  const handleSubmit = () => {
    setLocalErr('');
    if (pin.length < 4) {
      setLocalErr('Please enter your 4-digit PIN.');
      return;
    }
    onConfirm(pin);
  };

  const handleClear = () => {
    setPin('');
    setLocalErr('');
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-700 to-green-900 px-7 py-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white text-lg leading-none">
              {hasExistingPin ? 'Verify PIN' : 'Set Your PIN'}
            </h2>
            <p className="text-green-100 text-xs mt-1">Health Card Authentication</p>
          </div>
        </div>

        {/* Content */}
        <div className="px-7 py-8">
          <p className="text-gray-700 text-sm mb-6 leading-relaxed">
            {hasExistingPin
              ? 'Enter your 4-digit PIN to access your health card information.'
              : 'Create a 4-digit PIN to secure your health card. Share this PIN only with your health center operator when needed.'}
          </p>

          {/* PIN Display */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mb-6 border border-gray-200">
            <div className="flex items-center justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-14 h-14 rounded-2xl border-2 border-gray-300 flex items-center justify-center text-2xl font-bold transition-all"
                  style={{
                    borderColor: pin.length > i ? '#15803d' : '#d1d5db',
                    backgroundColor: pin.length > i ? '#f0fdf4' : '#f3f4f6',
                  }}
                >
                  {showPin ? pin[i] || '' : pin[i] ? '•' : ''}
                </div>
              ))}
            </div>
          </div>

          {/* Show/Hide PIN toggle */}
          <button
            type="button"
            onClick={() => setShowPin(!showPin)}
            className="flex items-center justify-center gap-2 mx-auto text-sm text-green-700 hover:text-green-900 mb-6 transition-colors"
          >
            {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPin ? 'Hide PIN' : 'Show PIN'}
          </button>

          {/* Error */}
          {(localErr || error) && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{localErr || error}</p>
            </div>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'Back'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => {
                  if (digit === 'Back') handleBack();
                  else if (digit !== '') handleDigit(String(digit));
                }}
                disabled={isLoading}
                className={`py-3 rounded-xl font-semibold transition-all ${
                  digit === ''
                    ? ''
                    : isLoading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-100 active:bg-gray-200'
                } ${
                  digit === 'Back'
                    ? 'col-span-1 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                    : 'bg-gray-100 text-gray-900 border border-gray-200'
                }`}
              >
                {digit === 'Back' ? '←' : digit}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading || pin.length === 0}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || pin.length < 4}
              className="flex-1 px-4 py-3 rounded-xl bg-green-700 text-white font-semibold hover:bg-green-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Verify
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── PIN Modal ────────────────────────────────────────────────────────────────
const PinModal = ({
  mode,
  onConfirm,
  onCancel,
  isLoading,
  error,
}: {
  mode: 'set' | 'change';
  onConfirm: (pin: string, oldPin?: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  error: string;
}) => {
  const [step,   setStep]   = useState<'old' | 'new' | 'confirm'>(mode === 'change' ? 'old' : 'new');
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [conf,   setConf]   = useState('');
  const [showPin, setShowPin] = useState(false);
  const [localErr, setLocalErr] = useState('');

  const activeVal = step === 'old' ? oldPin : step === 'new' ? newPin : conf;
  const setActive = step === 'old' ? setOldPin : step === 'new' ? setNewPin : setConf;

  const handleDigit = (d: string) => {
    if (activeVal.length < 4) setActive(activeVal + d);
  };
  const handleBack = () => {
    if (activeVal.length > 0) setActive(activeVal.slice(0, -1));
  };

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

  const stepLabel = step === 'old' ? 'Enter Current PIN' : step === 'new' ? 'Enter New PIN' : 'Confirm New PIN';
  const stepDesc  = step === 'old'
    ? 'Enter your existing PIN to continue.'
    : step === 'new'
    ? 'Choose a 4-digit PIN. Share this only with your health center operator.'
    : 'Re-enter the new PIN to confirm.';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-700 to-green-900 px-7 py-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white text-lg leading-none">
              {mode === 'set' ? 'Set Your PIN' : 'Change PIN'}
            </h2>
            <p className="text-green-200 text-xs mt-1">
              {mode === 'set' ? 'Protect your health records' : 'Update your security PIN'}
            </p>
          </div>
        </div>

        {/* Step indicator */}
        {mode === 'change' && (
          <div className="flex items-center gap-1 px-7 pt-5">
            {(['old', 'new', 'confirm'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-1 flex-1">
                <div className={`h-1.5 rounded-full flex-1 transition-colors ${
                  step === s ? 'bg-green-600' :
                  (i < (['old','new','confirm'] as const).indexOf(step)) ? 'bg-green-300' : 'bg-gray-200'
                }`} />
              </div>
            ))}
          </div>
        )}

        <div className="px-7 pt-5 pb-6">
          {/* Step label */}
          <div className="text-center mb-5">
            <p className="font-semibold text-gray-800 text-sm">{stepLabel}</p>
            <p className="text-xs text-gray-400 mt-1">{stepDesc}</p>
          </div>

          {/* PIN dots */}
          <div className="flex justify-center gap-4 mb-5">
            {[0,1,2,3].map((i) => (
              <div key={i} className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${
                activeVal.length > i
                  ? 'border-green-600 bg-green-50'
                  : activeVal.length === i
                  ? 'border-green-400 bg-white shadow-sm'
                  : 'border-gray-200 bg-gray-50'
              }`}>
                {activeVal.length > i
                  ? (showPin
                    ? <span className="font-bold text-green-700 text-lg">{activeVal[i]}</span>
                    : <div className="w-3 h-3 rounded-full bg-green-600" />)
                  : null}
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
                disabled={d === ''}
                onClick={() => d === '⌫' ? handleBack() : d !== '' ? handleDigit(d) : undefined}
                className={`h-12 rounded-xl font-semibold text-lg transition-all
                  ${d === '' ? 'cursor-default' :
                    d === '⌫' ? 'bg-gray-100 hover:bg-gray-200 text-gray-600' :
                    'bg-gray-50 hover:bg-green-50 hover:text-green-700 border border-gray-200 hover:border-green-300 text-gray-800'
                  }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleNext}
              disabled={isLoading || activeVal.length < 4}
              className="flex-1 bg-green-700 hover:bg-green-800 text-white flex gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              {step === 'confirm' ? (isLoading ? 'Saving…' : 'Save PIN') : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
const UhcMember = () => {
  const userProfile = useUserProfile();
  
  const [activeTab,       setActiveTab]       = useState('documents');
  const [searchQuery,     setSearchQuery]     = useState('');
  const [searchResults,   setSearchResults]   = useState<PatientProfile[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [isSearching,     setIsSearching]     = useState(false);
  const [usingMock,       setUsingMock]       = useState(false);
  const [errorMessage,    setErrorMessage]    = useState('');
  const [isLoadingDocs,   setIsLoadingDocs]   = useState(false);
  const [isLoadingQr,     setIsLoadingQr]     = useState(false);

  const [documents,      setDocuments]      = useState<DocumentAttachment[]>([]);
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);
  const [filterQuery,    setFilterQuery]    = useState('');
  const [previewDoc,     setPreviewDoc]     = useState<DocumentAttachment | null>(null);
  const [archiveTarget,  setArchiveTarget]  = useState<DocumentAttachment | null>(null);

  const [qrCodeValue,    setQrCodeValue]    = useState<string | null>(null);
  const [qrDataUrl,      setQrDataUrl]      = useState<string | null>(null);
  const [isCapturing,    setIsCapturing]    = useState(false);
  const [showCardModal,  setShowCardModal]  = useState(false);
  const [printModalImg,  setPrintModalImg]  = useState<string | null>(null);

  // ── PIN states ─────────────────────────────────────────────────────────────
  const [healthCardId,           setHealthCardId]           = useState<string | null>(null);
  const [hasPin,                 setHasPin]                 = useState(false);
  const [pinModalMode,           setPinModalMode]           = useState<'set' | 'change' | null>(null);
  const [isPinLoading,           setIsPinLoading]           = useState(false);
  const [pinError,               setPinError]               = useState('');
  const [pinSuccess,             setPinSuccess]             = useState('');
  const [isAuthenticated,        setIsAuthenticated]        = useState(false);
  const [showPinAuthModal,       setShowPinAuthModal]       = useState(false);
  const [isCheckingHealth,       setIsCheckingHealth]       = useState(true);
  const [pinAuthError,           setPinAuthError]           = useState('');
  const [isPinAuthLoading,       setIsPinAuthLoading]       = useState(false);
  const [currentUserPatient,     setCurrentUserPatient]     = useState<PatientProfile | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);

  // ── Build card canvas (pure Canvas API — no html2canvas needed) ────────────
  const buildCardCanvas = useCallback(async (
    patient: PatientProfile,
    qrDataUrl: string,
    qrCodeValue: string,
  ): Promise<HTMLCanvasElement> => {
    const SCALE  = 3;
    const W      = 640;
    const H      = 380;
    const CW     = W * SCALE;
    const CH     = H * SCALE;

    const canvas  = document.createElement('canvas');
    canvas.width  = CW;
    canvas.height = CH;
    const ctx     = canvas.getContext('2d')!;
    ctx.scale(SCALE, SCALE);

    // ── Background gradient ──
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0,    '#15803d');
    bg.addColorStop(0.45, '#166534');
    bg.addColorStop(1,    '#14532d');
    ctx.fillStyle = bg;
    const r = 20;
    ctx.beginPath();
    ctx.moveTo(r, 0); ctx.lineTo(W - r, 0);
    ctx.quadraticCurveTo(W, 0, W, r);
    ctx.lineTo(W, H - r); ctx.quadraticCurveTo(W, H, W - r, H);
    ctx.lineTo(r, H); ctx.quadraticCurveTo(0, H, 0, H - r);
    ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();

    // ── Diagonal pattern ──
    ctx.save();
    ctx.clip();
    ctx.globalAlpha = 0.035;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 1;
    for (let i = -H; i < W + H; i += 14) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    // ── Gold top stripe ──
    const goldTop = ctx.createLinearGradient(0, 0, W, 0);
    goldTop.addColorStop(0,    '#d97706');
    goldTop.addColorStop(0.25, '#fbbf24');
    goldTop.addColorStop(0.5,  '#f59e0b');
    goldTop.addColorStop(0.75, '#fbbf24');
    goldTop.addColorStop(1,    '#d97706');
    ctx.fillStyle = goldTop;
    ctx.fillRect(0, 0, W, 7);

    // ── Gold bottom stripe ──
    ctx.fillStyle = goldTop;
    ctx.fillRect(0, H - 5, W, 5);

    // Padding origin
    const PX = 28;
    const PY = 22;

    // ── Seal circle ──
    const sealX = PX + 34;
    const sealY = PY + 34;
    const sealGrad = ctx.createRadialGradient(sealX - 10, sealY - 10, 4, sealX, sealY, 34);
    sealGrad.addColorStop(0, '#fef9c3');
    sealGrad.addColorStop(0.6, '#fbbf24');
    sealGrad.addColorStop(1, '#d97706');
    ctx.beginPath(); ctx.arc(sealX, sealY, 34, 0, Math.PI * 2);
    ctx.fillStyle = sealGrad; ctx.fill();
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3; ctx.stroke();
    ctx.fillStyle = '#14532d';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('UHC', sealX, sealY - 4);
    ctx.fillStyle = '#fbbf24'; ctx.fillRect(sealX - 18, sealY + 1, 36, 1);
    ctx.fillStyle = '#166534';
    ctx.font = 'bold 10px Arial';
    ctx.fillText('2026', sealX, sealY + 14);

    // ── Header text ──
    ctx.textAlign = 'left';
    const textX = PX + 68 + 16;
    ctx.fillStyle = '#86efac';
    ctx.font = '9px Arial';
    ctx.fillText('REPUBLIC OF THE PHILIPPINES', textX, PY + 14);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 21px Georgia';
    ctx.fillText('UNIVERSAL HEALTH CARE', textX, PY + 36);
    ctx.fillStyle = '#bbf7d0';
    ctx.font = '10px Arial';
    ctx.fillText('MEMBER IDENTIFICATION CARD', textX, PY + 52);

    // ── Gold divider line ──
    const divY = PY + 68;
    const divGrad = ctx.createLinearGradient(0, 0, W, 0);
    divGrad.addColorStop(0, 'transparent');
    divGrad.addColorStop(0.2, '#fbbf24');
    divGrad.addColorStop(0.8, '#fbbf24');
    divGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = divGrad;
    ctx.fillRect(PX, divY, W - PX * 2, 1);

    // ── Helper: draw rounded rect ──
    const roundRect = (x: number, y: number, w: number, h: number, rad: number) => {
      ctx.beginPath();
      ctx.moveTo(x + rad, y);
      ctx.lineTo(x + w - rad, y); ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
      ctx.lineTo(x + w, y + h - rad); ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
      ctx.lineTo(x + rad, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
      ctx.lineTo(x, y + rad); ctx.quadraticCurveTo(x, y, x + rad, y);
      ctx.closePath();
    };

    const bodyY  = divY + 12;
    const leftW  = 380;
    const rightX = PX + leftW + 16;
    const rightW = W - PX - rightX;

    // ── Name block ──
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    roundRect(PX, bodyY, leftW, 48, 10); ctx.fill();
    ctx.strokeStyle = 'rgba(251,191,36,0.35)'; ctx.lineWidth = 1;
    roundRect(PX, bodyY, leftW, 48, 10); ctx.stroke();
    ctx.fillStyle = '#86efac'; ctx.font = '8px Arial';
    ctx.fillText('MEMBER NAME', PX + 14, bodyY + 14);
    const name = fullName(patient).toUpperCase();
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${name.length > 30 ? 15 : 18}px Georgia`;
    ctx.fillText(name, PX + 14, bodyY + 36);

    // ── Detail boxes ──
    const detailY = bodyY + 56;

    const drawDetailBox = (x: number, y: number, w: number, h: number, label: string, value: string, fontSize = 14) => {
      ctx.fillStyle = 'rgba(255,255,255,0.09)';
      roundRect(x, y, w, h, 8); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
      roundRect(x, y, w, h, 8); ctx.stroke();
      ctx.fillStyle = '#86efac'; ctx.font = '8px Arial';
      ctx.fillText(label, x + 13, y + 16);
      ctx.fillStyle = '#ffffff'; ctx.font = `bold ${fontSize}px Georgia`;
      ctx.fillText(value, x + 13, y + 34);
    };

    drawDetailBox(PX, detailY,      leftW, 44, 'DATE OF BIRTH', formatDate(patient.birth_date));

    // Address (multi-line)
    const addrY = detailY + 52;
    ctx.fillStyle = 'rgba(255,255,255,0.09)';
    roundRect(PX, addrY, leftW, 52, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1;
    roundRect(PX, addrY, leftW, 52, 8); ctx.stroke();
    ctx.fillStyle = '#86efac'; ctx.font = '8px Arial';
    ctx.fillText('ADDRESS', PX + 13, addrY + 16);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 11px Georgia';
    const addr = getFullAddress(patient.brgy);
    // word-wrap address
    const words = addr.split(' ');
    let line = ''; let lineY = addrY + 32;
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > leftW - 26 && line) {
        ctx.fillText(line, PX + 13, lineY);
        line = word; lineY += 14;
      } else { line = test; }
    }
    if (line) ctx.fillText(line, PX + 13, lineY);

    // ── QR Code image ──
    const qrImg = new Image();
    await new Promise<void>((resolve, reject) => {
      qrImg.onload  = () => resolve();
      qrImg.onerror = reject;
      qrImg.src     = qrDataUrl;
    });
    const qrSize = 116;
    const qrX    = rightX;
    const qrY    = bodyY;
    // QR white box
    ctx.fillStyle = '#ffffff';
    roundRect(qrX - 8, qrY - 8, qrSize + 19, qrSize + 19, 14); ctx.fill();
    ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3.5;
    roundRect(qrX - 8, qrY - 8, qrSize + 19, qrSize + 19, 14); ctx.stroke();
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    // QR code tiny text
    ctx.fillStyle = '#86efac'; ctx.font = '7px monospace'; ctx.textAlign = 'center';
    const qrLabel = qrCodeValue.substring(0, 22) + '…';
    ctx.fillText(qrLabel, qrX + qrSize / 2, qrY + qrSize + 26);

    // ── Footer divider ──
    const footerDivY = H - 30;
    ctx.fillStyle = divGrad;
    ctx.fillRect(PX, footerDivY, W - PX * 2, 1);
    ctx.fillStyle = '#86efac'; ctx.font = '8px Arial'; ctx.textAlign = 'left';
    ctx.fillText('VALID WHILE MEMBERSHIP IS ACTIVE', PX, footerDivY + 14);
    ctx.fillStyle = '#fbbf24'; ctx.font = 'bold 8px Arial'; ctx.textAlign = 'right';
    ctx.fillText('DOH – UHC ACT R.A. 11223', W - PX, footerDivY + 14);

    return canvas;
  }, []);

  // ── Search ─────────────────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true); setErrorMessage(''); setUsingMock(false);
    try {
      // Step 1: Search module4.patient_repository for matching members
      const { data: repoData, error: repoError } = await supabase
        .schema('module4')
        .from('patient_repository')
        .select('id, patient_profile, facility_code, hpercode')
        .limit(50);

      if (repoError) throw repoError;

      if (!repoData?.length) throw new Error('No repository data');

      // Step 2: Get the patient_profile UUIDs from module4
      const profileIds = repoData.map((r: { patient_profile: string }) => r.patient_profile).filter(Boolean);

      // Step 3: Fetch matching patient profiles from module3
      const { data, error } = await supabase
        .schema('module3')
        .from('patient_profile')
        .select(`
          id, first_name, middle_name, last_name, ext_name, sex, birth_date,
          brgy (
            id, description,
            city_municipality (
              id, description,
              province (
                id, description,
                region ( id, description )
              )
            )
          )
        `)
        .in('id', profileIds)
        .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;
      if (data?.length) {
        setSearchResults(data as unknown as PatientProfile[]);
      } else {
        const m = filterMock(searchQuery);
        setSearchResults(m); setUsingMock(true);
        if (!m.length) setErrorMessage('No patients found.');
      }
    } catch {
      const m = filterMock(searchQuery);
      setSearchResults(m); setUsingMock(true);
      if (!m.length) setErrorMessage('No patients found.');
    } finally { setIsSearching(false); }
  };

  const selectPatient = async (p: PatientProfile) => {
    setSelectedPatient(p);
    setSearchResults([]);
    setSearchQuery(`${p.first_name} ${p.last_name}`);
    setErrorMessage('');
    setDocuments([]);
    setQrCodeValue(null);
    setQrDataUrl(null);
    setExpandedFolder(null);
    await loadPatientData(p);
  };

  const loadPatientData = async (patient: PatientProfile) => {
    const isMock = patient.id.startsWith('mock-');
    setIsLoadingDocs(true); setIsLoadingQr(true);

    if (isMock) {
      await new Promise((r) => setTimeout(r, 500));
      const mockQr = MOCK_QR_CODES[patient.id] ?? null;
      if (mockQr) {
        setQrCodeValue(mockQr);
        const du = await QRCodeLib.toDataURL(mockQr, {
          width: 256, margin: 2,
          color: { dark: '#166534', light: '#FFFFFF' },
        });
        setQrDataUrl(du);
      }
      setIsLoadingQr(false);
      setDocuments([]);
      setIsLoadingDocs(false);
      return;
    }

    try {
      // patient.id = module3.patient_profile.id — health_card references this same id
      const { data: cardData } = await supabase
        .from('health_card')
        .select('id, qr_code, pin')
        .eq('patient_profile', patient.id)
        .single();

      if (cardData?.id)      setHealthCardId(cardData.id);
      if (cardData?.pin)     setHasPin(true);

      if (cardData?.qr_code) {
        setQrCodeValue(cardData.qr_code);
        const du = await QRCodeLib.toDataURL(cardData.qr_code, {
          width: 256, margin: 2,
          color: { dark: '#166534', light: '#FFFFFF' },
        });
        setQrDataUrl(du);
      }
      setIsLoadingQr(false);

      if (cardData?.id) {
        const { data: attachments } = await supabase
          .from('card_attachment')
          .select('id, attachment, status, card_category ( description )')
          .eq('health_card', cardData.id)
          .eq('status', true);

        const docs: DocumentAttachment[] = (attachments ?? []).map((a) => {
          const raw = a as {
            id: string; attachment: string; status: boolean;
            card_category: { description?: string } | { description?: string }[] | null;
          };
          const cat = Array.isArray(raw.card_category) ? raw.card_category[0] : raw.card_category;
          return { id: raw.id, attachment: raw.attachment, status: raw.status, category: cat?.description ?? 'Uncategorized', archived: false };
        });
        setDocuments(docs);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to load patient data.');
    } finally {
      setIsLoadingQr(false);
      setIsLoadingDocs(false);
    }
  };

  // ── Card Download ──────────────────────────────────────────────────────────
  const handleDownloadCard = useCallback(async () => {
    if (!selectedPatient || !qrDataUrl || !qrCodeValue) return;
    setIsCapturing(true);
    try {
      const canvas = await buildCardCanvas(selectedPatient, qrDataUrl, qrCodeValue);
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `HealthCard_${selectedPatient.last_name}_${selectedPatient.first_name}.png`;
      a.click();
    } catch (e) { console.error('Download error:', e); }
    finally { setIsCapturing(false); }
  }, [selectedPatient, qrDataUrl, qrCodeValue, buildCardCanvas]);

  // ── Card Print (shows in modal — no redirect) ──────────────────────────────
  const handlePrintCard = useCallback(async () => {
    if (!selectedPatient || !qrDataUrl || !qrCodeValue) return;
    setIsCapturing(true);
    try {
      const canvas = await buildCardCanvas(selectedPatient, qrDataUrl, qrCodeValue);
      setPrintModalImg(canvas.toDataURL('image/png'));
    } catch (e) { console.error('Print error:', e); }
    finally { setIsCapturing(false); }
  }, [selectedPatient, qrDataUrl, qrCodeValue, buildCardCanvas]);

  // ── Save PIN ───────────────────────────────────────────────────────────────
  const handleSavePin = async (newPin: string, oldPin?: string) => {
    if (!healthCardId) { setPinError('No health card found.'); return; }
    setIsPinLoading(true); setPinError('');
    try {
      // If changing, verify old pin first
      if (oldPin) {
        const { data: card } = await supabase
          .from('health_card')
          .select('pin')
          .eq('id', healthCardId)
          .single();
        if (card?.pin !== oldPin) {
          setPinError('Current PIN is incorrect. Please try again.');
          setIsPinLoading(false);
          return;
        }
      }
      const { error } = await supabase
        .from('health_card')
        .update({ pin: newPin })
        .eq('id', healthCardId);
      if (error) throw error;
      setHasPin(true);
      setPinModalMode(null);
      setPinSuccess(oldPin ? 'PIN changed successfully!' : 'PIN set successfully! Share it with your operator when needed.');
      setTimeout(() => setPinSuccess(''), 5000);
    } catch (e) {
      setPinError('Failed to save PIN. Please try again.');
      console.error(e);
    } finally {
      setIsPinLoading(false);
    }
  };

  // ── Archive / Restore ──────────────────────────────────────────────────────
  const handleArchive = () => {
    if (!archiveTarget) return;
    setDocuments((prev) => prev.map((d) => d.id === archiveTarget.id ? { ...d, archived: true } : d));
    setArchiveTarget(null);
  };
  const handleRestore = (id: string) =>
    setDocuments((prev) => prev.map((d) => d.id === id ? { ...d, archived: false } : d));

  const getDocsForFolder = (supabaseCategory: string, archived = false) =>
    documents.filter((d) =>
      d.category === supabaseCategory &&
      d.archived === archived &&
      (!filterQuery || d.attachment.toLowerCase().includes(filterQuery.toLowerCase()))
    );

  const totalActive   = documents.filter((d) => !d.archived).length;
  const totalArchived = documents.filter((d) => d.archived).length;

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <BreadcrumbComp title="My Health Card" items={BCrumb} />

      {previewDoc    && <PdfPreviewModal url={previewDoc.attachment} name={previewDoc.attachment.split('/').pop() ?? 'Document'} onClose={() => setPreviewDoc(null)} />}
      {archiveTarget && <ArchiveConfirmModal doc={archiveTarget} onConfirm={handleArchive} onCancel={() => setArchiveTarget(null)} />}
      {showCardModal && selectedPatient && qrDataUrl && qrCodeValue && (
        <CardPreviewModal
          patient={selectedPatient}
          qrDataUrl={qrDataUrl}
          qrCodeValue={qrCodeValue}
          cardRef={cardRef}
          isCapturing={isCapturing}
          onClose={() => setShowCardModal(false)}
          onDownload={handleDownloadCard}
          onPrint={handlePrintCard}
        />
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

      {/* ── Print Preview Modal ─────────────────────────────────────────────── */}
      {printModalImg && selectedPatient && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b bg-gradient-to-r from-gray-800 to-gray-900">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <Printer className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-lg leading-none">Print Health ID Card</h2>
                  <p className="text-gray-400 text-xs mt-1">{fullName(selectedPatient)}</p>
                </div>
              </div>
              <button
                onClick={() => setPrintModalImg(null)}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Card preview */}
            <div className="flex justify-center items-center bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 px-10 py-10 relative overflow-auto">
              <div className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
              <div className="relative z-10" style={{ filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))', minWidth: 'fit-content' }}>
                <img
                  src={printModalImg}
                  alt="Health Card Print Preview"
                  style={{ width: '100%', maxWidth: 780, height: 'auto', borderRadius: 12, display: 'block' }}
                />
              </div>
            </div>

            {/* Tips + actions */}
            <div className="px-7 py-5 border-t bg-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <p className="text-xs font-semibold text-gray-600">Print Tips</p>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed max-w-sm ml-6">
                  Select <strong>Landscape</strong> orientation and set margins to <strong>None</strong> for best results.
                  Ask your print shop for <strong>CR80 laminated ID card</strong> printing (standard wallet size).
                </p>
              </div>
              <div className="flex gap-2 flex-wrap flex-shrink-0">
                <Button variant="outline" onClick={() => setPrintModalImg(null)} className="flex gap-2 text-sm">
                  <X className="w-4 h-4" /> Close
                </Button>
                <Button
                  onClick={() => {
                    const printWin = window.open('', '_blank');
                    if (!printWin) return;
                    printWin.document.write(`<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box;}body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff;}img{max-width:100%;height:auto;display:block;}@page{size:landscape;margin:0;}@media print{body{background:transparent;}}</style></head><body><img src="${printModalImg}" /></body></html>`);
                    printWin.document.close();
                    printWin.onload = () => { printWin.focus(); printWin.print(); printWin.close(); };
                  }}
                  className="flex gap-2 text-sm bg-gray-800 hover:bg-gray-900 text-white"
                >
                  <Printer className="w-4 h-4" /> Send to Printer
                </Button>
                <Button
                  onClick={handleDownloadCard}
                  disabled={isCapturing}
                  className="flex gap-2 text-sm bg-green-700 hover:bg-green-800 text-white"
                >
                  <Download className="w-4 h-4" /> Download Instead
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6">

        {/* ── Search ─────────────────────────────────────────────────────── */}
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
            <Search className="w-5 h-5 text-green-600" /> Find My Records
          </h3>
          <p className="text-xs text-gray-400 mb-4">Search by your first or last name to view your health card, QR code, and documents.</p>
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

          {searchResults.length > 0 && (
            <div className="mt-3 border rounded-lg overflow-hidden divide-y">
              {usingMock && (
                <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <p className="text-xs text-amber-700">Showing demo profiles — database not connected</p>
                </div>
              )}
              {searchResults.map((p) => (
                <button key={p.id} onClick={() => selectPatient(p)} className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xs flex-shrink-0">
                    {p.first_name[0]}{p.last_name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{fullName(p)}</p>
                    <p className="text-xs text-gray-500">{p.sex} · DOB: {formatDate(p.birth_date)} · {getFullAddress(p.brgy)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {errorMessage && !selectedPatient && (
            <div className="mt-3 flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><p>{errorMessage}</p>
            </div>
          )}

          {selectedPatient && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white font-bold text-sm">
                  {selectedPatient.first_name[0]}{selectedPatient.last_name[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-green-900">{fullName(selectedPatient)}</p>
                    {selectedPatient.id.startsWith('mock-') && (
                      <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">DEMO</span>
                    )}
                  </div>
                  <p className="text-xs text-green-600">
                    {selectedPatient.sex} · {formatDate(selectedPatient.birth_date)} · {getFullAddress(selectedPatient.brgy)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium">
                <span className="flex items-center gap-1 text-green-700"><CheckCircle2 className="w-3.5 h-3.5" />{totalActive} active</span>
                {totalArchived > 0 && <span className="flex items-center gap-1 text-amber-600"><Archive className="w-3.5 h-3.5" />{totalArchived} archived</span>}
              </div>
            </div>
          )}
        </Card>

        {/* ── Main Content ────────────────────────────────────────────────── */}
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
                <Lock className="w-3.5 h-3.5" />
                My PIN
                {hasPin && <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />}
              </TabsTrigger>
            </TabsList>

            {/* ══ DOCUMENTS TAB ══ */}
            <TabsContent value="documents">
              <Card className="p-6">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" /> My Documents
                  </h3>
                  <div className="flex gap-2 items-center">
                    <Input placeholder="Search documents…" value={filterQuery} onChange={(e) => setFilterQuery(e.target.value)} className="w-48 text-sm" />
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
                      const docs     = getDocsForFolder(folder.supabaseCategory, false);
                      const allCount = documents.filter((d) => d.category === folder.supabaseCategory && !d.archived).length;
                      const isExp    = expandedFolder === folder.key;
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
                                        <p className="text-sm font-medium text-gray-800 truncate">{doc.attachment.split('/').pop() ?? 'Document'}</p>
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
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* ══ MY HEALTH CARD TAB ══ */}
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
                  {/* Action bar */}
                  <Card className="p-5">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                      <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-green-600" /> My Health ID Card
                        </h3>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm">
                          Download or print your card and bring it to a print shop to have it made into a physical ID.
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          onClick={handlePrintCard}
                          disabled={isCapturing}
                          className="flex gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          {isCapturing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                          Print Card
                        </Button>
                        <Button
                          onClick={handleDownloadCard}
                          disabled={isCapturing}
                          className="flex gap-2 bg-green-700 hover:bg-green-800 text-white"
                        >
                          {isCapturing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                          Download Card
                        </Button>
                        <a
                          href={qrDataUrl}
                          download={`QR_${selectedPatient?.last_name}_${selectedPatient?.first_name}.png`}
                          className="inline-flex items-center gap-2 text-sm border border-blue-300 text-blue-700 hover:bg-blue-50 rounded-md px-3 py-2 transition-colors font-medium"
                        >
                          <QrCode className="w-4 h-4" /> QR Only
                        </a>
                      </div>
                    </div>
                  </Card>

                  {/* Inline Card Display */}
                  <Card className="p-6">
                    <div className="overflow-x-auto flex justify-center">
                      <HealthIdCard
                        patient={selectedPatient!}
                        qrDataUrl={qrDataUrl}
                        qrCodeValue={qrCodeValue}
                        cardRef={cardRef}
                      />
                    </div>
                  </Card>
                </div>
              ) : (
                <Card className="p-6">
                  <div className="flex flex-col items-center py-12 gap-3 text-gray-400">
                    <QrCode className="w-16 h-16 opacity-20" />
                    <p className="font-medium text-gray-500">No QR Code Generated Yet</p>
                    <p className="text-sm text-center max-w-xs">
                      Your health center operator has not generated a QR code for your profile yet.
                      Please contact your health center to request one.
                    </p>
                  </div>
                </Card>
              )}
            </TabsContent>

            {/* ══ ARCHIVE TAB ══ */}
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
                  <p className="text-xs text-amber-700">
                    Archived documents are hidden from your main view but are not deleted. You can restore them at any time.
                    For permanent removal, contact your health center administrator.
                  </p>
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
                      const archivedInFolder = documents.filter((d) => d.category === folder.supabaseCategory && d.archived);
                      if (archivedInFolder.length === 0) return null;
                      const colors = COLOR_MAP[folder.color as ColorKey];
                      return (
                        <div key={folder.key} className={`border rounded-xl overflow-hidden ${colors.border}`}>
                          <div className={`flex items-center gap-3 px-5 py-3 ${colors.bg}`}>
                            <span className={colors.text}>{folder.icon}</span>
                            <p className={`font-semibold text-sm ${colors.text}`}>{folder.label}</p>
                            <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}>{archivedInFolder.length}</span>
                          </div>
                          <div className="p-4 bg-white border-t flex flex-col gap-2">
                            {archivedInFolder.map((doc) => (
                              <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-amber-100 bg-amber-50">
                                <FileText className="w-4 h-4 text-amber-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-700 truncate">{doc.attachment.split('/').pop() ?? 'Document'}</p>
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

            {/* ══ PIN TAB ══ */}
            <TabsContent value="pin">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">My Security PIN</h3>
                    <p className="text-xs text-gray-400">Your PIN protects your health records from unauthorized access.</p>
                  </div>
                </div>

                {/* Success banner */}
                {pinSuccess && (
                  <div className="mb-5 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-700 font-medium">{pinSuccess}</p>
                  </div>
                )}

                {/* PIN status card */}
                <div className={`rounded-2xl border-2 p-6 mb-5 ${hasPin ? 'border-green-200 bg-green-50' : 'border-dashed border-gray-200 bg-gray-50'}`}>
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
                        <p className="text-xs text-gray-500 mt-0.5 max-w-xs">
                          {hasPin
                            ? 'Your records are protected. Give your PIN to the operator only when you are present.'
                            : 'Set a PIN so operators must ask you before accessing your records.'}
                        </p>
                      </div>
                    </div>
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
                  </div>
                </div>

                {/* How it works */}
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">How the PIN works</p>
                  <div className="flex flex-col gap-3">
                    {[
                      { icon: <Lock className="w-4 h-4 text-green-600" />, text: 'You set a 4-digit PIN that only you know.' },
                      { icon: <ShieldCheck className="w-4 h-4 text-blue-600" />, text: 'When an operator needs to access your records, they must ask you for your PIN first.' },
                      { icon: <KeyRound className="w-4 h-4 text-amber-600" />, text: 'Only share your PIN when you are physically present at the health center.' },
                      { icon: <ShieldAlert className="w-4 h-4 text-red-500" />, text: 'Never share your PIN over phone, text, or with anyone outside the health center.' },
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