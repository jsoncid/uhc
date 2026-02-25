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
  Camera, Upload, ImagePlus, SwitchCamera, CircleDot,
} from 'lucide-react';
import { supabase } from 'src/lib/supabase';
import Threads from 'src/components/ui/Threads';
import { Renderer, Program, Mesh, Triangle, Color } from 'ogl';
import darkLogo from 'src/assets/images/logos/uhc-logo.png';
import adnSeal from 'src/assets/images/logos/adn-seal.png';
import defaultProfile from 'src/assets/images/profile/default_profile.jpg';

// Offscreen Threads renderer (single frame capture for print)
const _vtxSrc = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
`;
const _frgSrc = `
precision highp float;
uniform float iTime; uniform vec3 iResolution; uniform vec3 uColor;
uniform float uAmplitude; uniform float uDistance; uniform vec2 uMouse;
#define PI 3.1415926538
const int u_line_count = 40;
const float u_line_width = 7.0;
const float u_line_blur = 10.0;
float Perlin2D(vec2 P){vec2 Pi=floor(P);vec4 Pf=P.xyxy-vec4(Pi,Pi+1.0);vec4 Pt=vec4(Pi.xy,Pi.xy+1.0);Pt=Pt-floor(Pt*(1.0/71.0))*71.0;Pt+=vec2(26.0,161.0).xyxy;Pt*=Pt;Pt=Pt.xzxz*Pt.yyww;vec4 hx=fract(Pt*(1.0/951.135664));vec4 hy=fract(Pt*(1.0/642.949883));vec4 gx=hx-0.49999;vec4 gy=hy-0.49999;vec4 gr=inversesqrt(gx*gx+gy*gy)*(gx*Pf.xzxz+gy*Pf.yyww);gr*=1.4142135623730950;vec2 bl=Pf.xy*Pf.xy*Pf.xy*(Pf.xy*(Pf.xy*6.0-15.0)+10.0);vec4 b2=vec4(bl,vec2(1.0-bl));return dot(gr,b2.zxzx*b2.wwyy);}
float pixel(float c,vec2 r){return(1.0/max(r.x,r.y))*c;}
float lineFn(vec2 st,float w,float perc,float off,vec2 mo,float t,float amp,float dist){
float so=perc*0.4;float sp=0.1+so;
float an=smoothstep(sp,0.7,st.x)*0.5*amp*(1.0+(mo.y-0.5)*0.2);
float ts=t/10.0+(mo.x-0.5)*1.0;
float bl=smoothstep(sp,sp+0.05,st.x)*perc;
float xn=mix(Perlin2D(vec2(ts,st.x+perc)*2.5),Perlin2D(vec2(ts,st.x+ts)*3.5)/1.5,st.x*0.3);
float y=0.5+(perc-0.5)*dist+xn/2.0*an;
float ls=smoothstep(y+(w/2.0)+(u_line_blur*pixel(1.0,iResolution.xy)*bl),y,st.y);
float le=smoothstep(y,y-(w/2.0)-(u_line_blur*pixel(1.0,iResolution.xy)*bl),st.y);
return clamp((ls-le)*(1.0-smoothstep(0.0,1.0,pow(perc,0.3))),0.0,1.0);}
void mainImage(out vec4 f,in vec2 fc){
vec2 uv=fc/iResolution.xy;float s=1.0;
for(int i=0;i<u_line_count;i++){float p=float(i)/float(u_line_count);s*=(1.0-lineFn(uv,u_line_width*pixel(1.0,iResolution.xy)*(1.0-p),p,(PI*1.0)*p,uMouse,iTime,uAmplitude,uDistance));}
float c=1.0-s;f=vec4(uColor*c,c);}
void main(){mainImage(gl_FragColor,gl_FragCoord.xy);}
`;
const renderThreadsFrame = (w: number, h: number): HTMLCanvasElement | null => {
  try {
    const r = new Renderer({ width: w, height: h, alpha: true });
    const gl = r.gl; gl.clearColor(0,0,0,0); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const g = new Triangle(gl);
    const p = new Program(gl, { vertex: _vtxSrc, fragment: _frgSrc, uniforms: {
      iTime:{value:2.5}, iResolution:{value:new Color(w,h,w/h)},
      uColor:{value:new Color(0.18,0.72,0.36)}, uAmplitude:{value:1.4},
      uDistance:{value:0}, uMouse:{value:new Float32Array([0.5,0.5])},
    }});
    const m = new Mesh(gl, { geometry: g, program: p });
    r.render({ scene: m });
    return gl.canvas as HTMLCanvasElement;
  } catch { return null; }
};

import { useAuthStore } from 'src/stores/useAuthStore';

// QR Code data-url generator
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

// Types
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

// Folder Definitions
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
// OR as the broad folder category (e.g. "Basic Identification").
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

// Helpers
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

const BCrumb = [{ to: '/', title: 'Home' }];

// PDF Preview Modal
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

// Archive Confirm Modal
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

// Health ID Card visual (Flip Card)
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

   // Watermark Logo Component
  const WatermarkLogo = () => (
    <img src={darkLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'grayscale(100%) brightness(0.4)' }} />
  );

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

 const CardBackground = () => (
    <>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #e8f5e9 0%, #eef6ee 40%, #e0f2e1 100%)' }} />
      <div style={{ position: 'absolute', inset: 0, opacity: 0.18, zIndex: 0, pointerEvents: 'none' }}>
        <Threads color={[0.18, 0.72, 0.36]} amplitude={1.4} distance={0} enableMouseInteraction={false} />
      </div>
      <div style={{ 
        position: 'absolute', inset: 0, opacity: 0.03, zIndex: 0,
        backgroundImage: `
          repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,80,30,1) 3px, rgba(0,80,30,1) 4px),
          repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(0,80,30,1) 3px, rgba(0,80,30,1) 4px)
        `
      }} />
      <div style={{ position: 'absolute', width: 300, height: 230, background: '#2d8a50', top: -55, left: 15, opacity: 0.10, borderRadius: '50%', filter: 'blur(46px)' }} />
      <div style={{ position: 'absolute', width: 260, height: 210, background: '#c8a018', top: 55, right: -15, opacity: 0.05, borderRadius: '50%', filter: 'blur(46px)' }} />
      <div style={{ position: 'absolute', width: 230, height: 190, background: '#1a6b3a', bottom: -28, right: 80, opacity: 0.08, borderRadius: '50%', filter: 'blur(46px)' }} />
    </>
  );
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
      
      <div style={{ position: 'absolute', right: '8%', top: '50%', transform: 'translateY(-50%)', width: 260, height: 260, opacity: 0.06, zIndex: 1, pointerEvents: 'none' }}>
        <img src={darkLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>

      {/* Front content */}
      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: '10px 20px 10px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 8, borderBottom: '1.5px solid rgba(0,100,40,0.25)', flexShrink: 0 }}>
          {/* ADN Seal */}
          <img src={adnSeal} alt="ADN Seal" style={{ width: 50, height: 50, flexShrink: 0, borderRadius: '50%', objectFit: 'contain' }} />
          {/* Title */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontFamily: '"Cinzel", serif', fontSize: 9, fontWeight: 600, letterSpacing: 2, color: '#0d4422' }}>Republika ng Pilipinas</div>
            <div style={{ fontFamily: '"Cinzel", serif', fontSize: 13, fontWeight: 700, color: '#0a3318', letterSpacing: 1.5, lineHeight: 1.2 }}>AGUSAN DEL NORTE</div>
            <div style={{ fontFamily: '"Cinzel", serif', fontSize: 17, fontWeight: 700, color: '#0a3318', letterSpacing: 1.5, lineHeight: 1.1 }}>UNIVERSAL HEALTH CARE</div>
            <div style={{ fontFamily: '"Rajdhani", sans-serif', fontSize: 9, fontWeight: 600, color: '#1a6b3a', letterSpacing: 3 }}>Member Identification Card</div>
          </div>
          {/* UHC Logo */}
          <img src={darkLogo} alt="UHC Logo" style={{ width: 55, height: 55, flexShrink: 0, objectFit: 'contain' }} />
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
              <img src={profilePicUrl || defaultProfile} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ fontFamily: '"Cinzel", serif', fontSize: 19, fontWeight: 700, color: '#1a6b3a', letterSpacing: 2, textShadow: '1px 1px 0 rgba(200,160,24,0.3)' }}>PHL</div>
          </div>
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

        {/* Watermark Logo centered */}
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 200, height: 200, opacity: 0.05, zIndex: 1, pointerEvents: 'none' }}>
        <WatermarkLogo />
      </div>

      {/* Back content */}
      <div style={{ position: 'relative', zIndex: 10, height: '100%', display: 'flex', flexDirection: 'column', padding: '42px 24px 10px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ paddingBottom: 7, borderBottom: '1.5px solid rgba(0,100,40,0.25)', flexShrink: 0 }}>
          <div style={{ fontFamily: '"Cinzel", serif', fontSize: 8, fontWeight: 600, letterSpacing: 2, color: '#0d4422' }}>Republika ng Pilipinas</div>
          <div style={{ fontFamily: '"Cinzel", serif', fontSize: 11, fontWeight: 700, color: '#0a3318', letterSpacing: 1.5, lineHeight: 1.2 }}>AGUSAN DEL NORTE</div>
          <div style={{ fontFamily: '"Cinzel", serif', fontSize: 14, fontWeight: 700, color: '#0a3318', letterSpacing: 1.5 }}>UNIVERSAL HEALTH CARE</div>
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
          color: '#16a34a', letterSpacing: 0.3, transition: 'all 0.2s ease',
        }}
        onMouseOver={(e) => { e.currentTarget.style.color = '#15803d'; e.currentTarget.style.textDecoration = 'underline'; }}
        onMouseOut={(e) => { e.currentTarget.style.color = '#16a34a'; e.currentTarget.style.textDecoration = 'none'; }}
      >
        {isFlipped ? '← Show Front' : 'Show Backside →'}
      </button>
    </div>
  );
};


// Member PIN Gate Modal
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

  // Set PIN states
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

  // Keyboard support
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

  // Verify PIN handler
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

  // Set PIN handler
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

  // No PIN → Force set PIN
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

  // Has PIN → Verify PIN
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

// PIN Modal
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

  // Keyboard support for PIN entry
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

// Print Modal
const PrintModal = ({ imgUrl, patientName, onClose, onDownload, isCapturing }: {
  imgUrl: string; patientName: string; onClose: () => void;
  onDownload: () => void; isCapturing: boolean;
}) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4">
    <div className="bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-green-700 bg-gradient-to-r from-green-800 to-green-900 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
            <Printer className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm sm:text-base leading-none">Print Health ID Card</h2>
            <p className="text-green-200 text-[11px] mt-0.5">{patientName}</p>
          </div>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors">
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Card preview - scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-850 dark:to-gray-800 relative">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage:'radial-gradient(circle,#d1d5db 1px,transparent 1px)',backgroundSize:'20px 20px' }} />
        <div className="relative z-10 flex justify-center px-4 sm:px-8 py-6 sm:py-8">
          <div style={{ filter:'drop-shadow(0 12px 32px rgba(0,0,0,0.25))' }} className="w-full max-w-md sm:max-w-lg">
            <img
              src={imgUrl}
              alt="Health Card Print Preview"
              className="w-full h-auto rounded-lg sm:rounded-xl block"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex-shrink-0">
        <div className="flex flex-col gap-3">
          {/* Print tips */}
          <div className="flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
              Select <strong>Landscape</strong> orientation, margins to <strong>None</strong>. Ask for <strong>CR80 laminated ID</strong> printing.
            </p>
          </div>
          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap justify-end">
            <Button variant="outline" onClick={onClose} className="flex gap-1.5 text-xs sm:text-sm h-8 sm:h-9 px-3">
              <X className="w-3.5 h-3.5" /> Close
            </Button>
            <Button
              onClick={() => {
                const w = window.open('', '_blank');
                if (!w) return;
                w.document.write(`<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box;}body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#fff;padding:10px;}img{max-width:100%;max-height:95vh;height:auto;display:block;object-fit:contain;}@page{size:portrait;margin:5mm;}@media print{body{background:transparent;padding:0;}}</style></head><body><img src="${imgUrl}" /></body></html>`);
                w.document.close();
                w.onload = () => { w.focus(); w.print(); w.close(); };
              }}
              className="flex gap-1.5 text-xs sm:text-sm h-8 sm:h-9 px-3 bg-gray-800 hover:bg-gray-900 text-white"
            >
              <Printer className="w-3.5 h-3.5" /> Send to Printer
            </Button>
            <Button onClick={onDownload} disabled={isCapturing} className="flex gap-1.5 text-xs sm:text-sm h-8 sm:h-9 px-3 bg-green-700 hover:bg-green-800 text-white">
              {isCapturing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Download
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// MAIN COMPONENT
const UhcMember = () => {
  // Patient selection
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [errorMessage,    setErrorMessage]    = useState('');

  // Tagged-member guard
  // When a member is tagged to a patient (via MemberTagging), only their own
  // profile is accessible. Manual search for other patients is blocked.
  const [taggedPatientId, setTaggedPatientId] = useState<string | null>(null);
  const [isAutoLoading,   setIsAutoLoading]   = useState(true);

  // Profile picture
  const [profilePicUrl,   setProfilePicUrl]   = useState<string | null>(null);
  const [isUploadingPic,  setIsUploadingPic]  = useState(false);
  const [profilePicError, setProfilePicError] = useState('');
  const profilePicInputRef = useRef<HTMLInputElement>(null);

  // Camera capture
  const [showCamera,      setShowCamera]      = useState(false);
  const [cameraStream,    setCameraStream]    = useState<MediaStream | null>(null);
  const [cameraError,     setCameraError]     = useState('');
  const [facingMode,      setFacingMode]      = useState<'user' | 'environment'>('user');
  const [capturedImage,   setCapturedImage]   = useState<string | null>(null);
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);

  // module4 health card data 
  const [healthCardId, setHealthCardId] = useState<string | null>(null);
  const [qrCodeValue,  setQrCodeValue]  = useState<string | null>(null);
  const [qrDataUrl,    setQrDataUrl]    = useState<string | null>(null);
  const [isLoadingQr,  setIsLoadingQr]  = useState(false);

  // Documents (module4.card_attachment)
  const [documents,      setDocuments]      = useState<DocumentAttachment[]>([]);
  const [isLoadingDocs,  setIsLoadingDocs]  = useState(false);
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);
  const [filterQuery,    setFilterQuery]    = useState('');
  const [previewDoc,     setPreviewDoc]     = useState<DocumentAttachment | null>(null);
  const [archiveTarget,  setArchiveTarget]  = useState<DocumentAttachment | null>(null);

  // PIN (module4.health_card.pin) 
  const [hasPin,       setHasPin]       = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'set' | 'change' | null>(null);
  const [isPinLoading, setIsPinLoading] = useState(false);
  const [pinError,     setPinError]     = useState('');
  const [pinSuccess,   setPinSuccess]   = useState('');

  // PIN gate (on patient select)
  const [pendingPatient,  setPendingPatient]  = useState<PatientProfile | null>(null);
  const [pendingCardId,                 ]   = useState<string | null>(null);
  const [pendingHasPin,   setPendingHasPin]   = useState(false);
  const [showPinGate,     setShowPinGate]     = useState(false);

  // Card download / print
  const [isCapturing,   setIsCapturing]   = useState(false);
  const [printModalImg, setPrintModalImg] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState('documents');

  // Canvas card builder (dual format - front & back)
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

    // Rounded-rectangle path helper
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

    // Capture a single Threads frame for print background
    let threadsFrame: HTMLCanvasElement | null = null;
    try { threadsFrame = renderThreadsFrame(W, H); } catch {}

    // Load logo image for watermarks
    const logoImg = new Image();
    logoImg.src = darkLogo;
    await new Promise<void>((resolve) => { logoImg.onload = () => resolve(); logoImg.onerror = () => resolve(); });

    const drawCardBase = (offsetY: number) => {
      ctx.save();
      ctx.translate(0, offsetY);
      
      // Card background gradient
      rr(0, 0, W, H, 18);
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, '#e8f5e9');
      bgGrad.addColorStop(0.4, '#eef6ee');
      bgGrad.addColorStop(1, '#e0f2e1');
      ctx.fillStyle = bgGrad;
      ctx.fill();

      // Clip for overlays
      ctx.save();
      rr(0, 0, W, H, 18);
      ctx.clip();

      // Threads animation frame overlay
      if (threadsFrame) {
        ctx.globalAlpha = 0.18;
        ctx.drawImage(threadsFrame, 0, 0, W, H);
        ctx.globalAlpha = 1;
      }

      // Security grid
      ctx.globalAlpha = 0.03;
      ctx.strokeStyle = 'rgba(0,80,30,1)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= W; x += 4) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y <= H; y += 4) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.globalAlpha = 1;
      
      // Blob 1 - greenish top left (toned down)
      ctx.globalAlpha = 0.10;
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
      
      // Blob 3 - dark green bottom right (toned down)
      ctx.globalAlpha = 0.08;
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

    // FRONT SIDE
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

    // ADN Seal (left) + UHC Logo (right) in header – preserve aspect ratios
    const sealMaxH = 50;
    const sealImg = new Image();
    sealImg.src = adnSeal;
    await new Promise<void>((resolve) => {
      sealImg.onload = () => {
        const ratio = sealImg.naturalWidth / sealImg.naturalHeight;
        const sh = sealMaxH;
        const sw = sh * ratio;
        const sy = (headerH - sh) / 2;
        ctx.drawImage(sealImg, 12, Math.max(4, sy), sw, sh);
        resolve();
      };
      sealImg.onerror = () => resolve();
    });
    // Load UHC logo (right side) – larger for visibility, preserve aspect ratio
    const uhcMaxH = 60;
    const uhcImg = new Image();
    uhcImg.src = darkLogo;
    await new Promise<void>((resolve) => {
      uhcImg.onload = () => {
        const ratio = uhcImg.naturalWidth / uhcImg.naturalHeight;
        const uh = uhcMaxH;
        const uw = uh * ratio;
        const ux = W - 8 - uw;
        const uy = (headerH - uh) / 2;
        ctx.drawImage(uhcImg, ux, Math.max(4, uy), uw, uh);
        resolve();
      };
      uhcImg.onerror = () => resolve();
    });

    // Header titles (centered) – no "Republic of the Philippines"
    const titleX = W / 2;
    ctx.textAlign = 'center';
    ctx.font = '600 9px serif';
    ctx.fillStyle = '#0d4422';
    ctx.fillText('Republika ng Pilipinas', titleX, 18);
    ctx.font = 'bold 12px serif';
    ctx.fillStyle = '#0a3318';
    ctx.fillText('AGUSAN DEL NORTE', titleX, 32);
    ctx.font = 'bold 15px serif';
    ctx.fillStyle = '#0a3318';
    ctx.fillText('UNIVERSAL HEALTH CARE', titleX, 50);
    ctx.font = '600 9px sans-serif';
    ctx.fillStyle = '#1a6b3a';
    ctx.fillText('Member Identification Card', titleX, 64);

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

    // Watermark logo (faint)
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      ctx.save();
      ctx.globalAlpha = 0.06;
      ctx.filter = 'grayscale(100%) brightness(0.4)';
      ctx.drawImage(logoImg, W - 280, H / 2 - 100, 200, 200);
      ctx.filter = 'none';
      ctx.restore();
    }

    // Photo placeholder with clean single gold border
    const photoX = 20, photoY = headerH + 36, photoW = 195, photoH = 210;
    const photoGrad = ctx.createLinearGradient(photoX, photoY, photoX + photoW, photoY + photoH);
    photoGrad.addColorStop(0, '#fef9c3');
    photoGrad.addColorStop(0.5, '#fde68a');
    photoGrad.addColorStop(1, '#f59e0b');
    rr(photoX, photoY, photoW, photoH, 8);
    ctx.fillStyle = photoGrad;
    ctx.fill();
    // Single gold border
    ctx.strokeStyle = '#c8a018';
    ctx.lineWidth = 2.5;
    rr(photoX, photoY, photoW, photoH, 8);
    ctx.stroke();
    // Profile picture or silhouette fallback
    if (picUrl) {
      await new Promise<void>((resolve) => {
        const picImg = new Image();
        picImg.crossOrigin = 'anonymous';
        picImg.src = picUrl;
        picImg.onload = () => {
          ctx.save();
          rr(photoX + 3, photoY + 3, photoW - 6, photoH - 6, 6);
          ctx.clip();
          // Cover-fit: fill the frame, crop excess
          const imgRatio = picImg.width / picImg.height;
          const frameRatio = (photoW - 6) / (photoH - 6);
          let sx = 0, sy = 0, sw = picImg.width, sh = picImg.height;
          if (imgRatio > frameRatio) {
            sw = picImg.height * frameRatio;
            sx = (picImg.width - sw) / 2;
          } else {
            sh = picImg.width / frameRatio;
            // Bias toward top of image (face area)
          }
          ctx.drawImage(picImg, sx, sy, sw, sh, photoX + 3, photoY + 3, photoW - 6, photoH - 6);
          ctx.restore();
          resolve();
        };
        picImg.onerror = () => resolve();
      });
    } else {
      // Default profile image fallback
      await new Promise<void>((resolve) => {
        const defImg = new Image();
        defImg.crossOrigin = 'anonymous';
        defImg.src = defaultProfile;
        defImg.onload = () => {
          ctx.save();
          rr(photoX + 3, photoY + 3, photoW - 6, photoH - 6, 6);
          ctx.clip();
          const scale = Math.max((photoW - 6) / defImg.width, (photoH - 6) / defImg.height);
          const sw = defImg.width * scale;
          const sh = defImg.height * scale;
          const sx = photoX + 3 + ((photoW - 6) - sw) / 2;
          const sy = photoY + 3 + ((photoH - 6) - sh) / 2;
          ctx.drawImage(defImg, sx, sy, sw, sh);
          ctx.restore();
          resolve();
        };
        defImg.onerror = () => resolve();
      });
    }


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

   

    ctx.restore(); // End front side translation

    // BACK SIDE 
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

    // Watermark logo (faint, centered)
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      ctx.save();
      ctx.globalAlpha = 0.05;
      ctx.filter = 'grayscale(100%) brightness(0.4)';
      ctx.drawImage(logoImg, W / 2 - 100, H / 2 - 100, 200, 200);
      ctx.filter = 'none';
      ctx.restore();
    }

    // Back header – left-aligned to match UI
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0d4422';
    ctx.font = '600 8px serif';
    ctx.fillText('Republika ng Pilipinas', 24, 50);
    ctx.font = 'bold 11px serif';
    ctx.fillStyle = '#0a3318';
    ctx.fillText('AGUSAN DEL NORTE', 24, 63);
    ctx.fillStyle = '#0a3318';
    ctx.font = 'bold 14px serif';
    ctx.fillText('UNIVERSAL HEALTH CARE', 24, 78);
    ctx.fillStyle = '#1a6b3a';
    ctx.font = '600 8px sans-serif';
    ctx.fillText('Member Identification Card', 24, 90);

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
  }, []);

  // Load patient data
  // All health card data lives in module4.
  // patient.id (UUID from module3) is stored in module4.health_card.patient_profile.
  const loadPatientData = async (patient: PatientProfile) => {
    setIsLoadingDocs(true);
    setIsLoadingQr(true);
    setErrorMessage('');
    try {
      // Step 1: find existing health_card in module4
      // Use .limit(1) instead of .maybeSingle() — multiple cards may exist.
      const { data: cards, error: cardErr } = await supabase
        .schema('module4')               // ← always module4 for health_card
        .from('health_card')
        .select('id, qr_code, pin')
        .eq('patient_profile', patient.id) // patient.id = UUID from module3
        .limit(1);

      if (cardErr) { console.error('health_card fetch error:', cardErr); throw cardErr; }
      let card: { id: any; qr_code: any; pin: any } | null = cards?.[0] ?? null;

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
          const { data: retryCards } = await supabase
            .schema('module4').from('health_card')
            .select('id, qr_code, pin')
            .eq('patient_profile', patient.id)
            .limit(1);
          card = retryCards?.[0] ?? null;
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

      // Step 5: load profile picture from card-attachments/Profile Picture/ bucket
      try {
        const { data: picFiles } = await supabase.storage.from('card-attachments').list('Profile Picture', { search: patient.id });
        const picMatch = picFiles?.find((f) => f.name.startsWith(patient.id));
        if (picMatch) {
          const { data: pub } = supabase.storage.from('card-attachments').getPublicUrl(`Profile Picture/${picMatch.name}`);
          setProfilePicUrl(pub.publicUrl + '?t=' + Date.now());
        }
      } catch { /* profile pic is optional */ }
    } catch (err) {
      console.error('loadPatientData error:', err);
      setErrorMessage('Failed to load patient data. Please try again.');
      setIsLoadingQr(false);
    } finally { setIsLoadingDocs(false); }
  };

  // Camera functions
  const openCamera = async () => {
    setProfilePicError('');
    setCameraError('');
    setCapturedImage(null);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      setCameraStream(stream);
      // Attach stream to video element once it mounts
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera access denied. Please allow camera permissions in your browser settings.'
          : err.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : 'Could not access camera. Please try uploading a photo instead.'
      );
    }
  };

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, [cameraStream]);

  const closeCamera = useCallback(() => {
    stopCamera();
    setShowCamera(false);
    setCameraError('');
    setCapturedImage(null);
  }, [stopCamera]);

  const switchCamera = async () => {
    stopCamera();
    const next = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(next);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: next, width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      setCameraError('Could not switch camera.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    // Ensure the video has actual dimensions (stream is live)
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError('Camera not ready yet. Please wait a moment and try again.');
      return;
    }
    // Square crop from center
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    if (!dataUrl || dataUrl === 'data:,') {
      setCameraError('Failed to capture photo. Please try again.');
      return;
    }
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const retakePhoto = async () => {
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      setCameraError('Could not restart camera.');
    }
  };

  const useCapturedPhoto = async () => {
    if (!capturedImage || !selectedPatient) return;
    setIsUploadingPic(true);
    setProfilePicError('');
    try {
      // Convert data URL to Blob reliably (fetch-based approach can fail on some browsers)
      const parts = capturedImage.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] ?? 'image/jpeg';
      const bstr = atob(parts[1]);
      const u8arr = new Uint8Array(bstr.length);
      for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
      const blob = new Blob([u8arr], { type: mime });

      const pid = selectedPatient.id;
      const path = `Profile Picture/${pid}_${Date.now()}.jpg`;

      // Remove ALL existing profile pictures for this patient (any extension)
      const { data: existing } = await supabase.storage.from('card-attachments').list('Profile Picture', { search: pid });
      const toRemove = (existing ?? []).filter((f) => f.name.startsWith(pid)).map((f) => `Profile Picture/${f.name}`);
      if (toRemove.length > 0) await supabase.storage.from('card-attachments').remove(toRemove);

      // Upload new photo with unique name to bypass CDN cache
      const { error: upErr } = await supabase.storage
        .from('card-attachments')
        .upload(path, blob, { contentType: 'image/jpeg' });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage
        .from('card-attachments')
        .getPublicUrl(path);
      setProfilePicUrl(pub.publicUrl + '?t=' + Date.now());
      closeCamera();
    } catch (err: any) {
      console.error('Camera upload error:', err);
      setProfilePicError(err.message ?? 'Upload failed. Please try again.');
    } finally {
      setIsUploadingPic(false);
    }
  };

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      cameraStream?.getTracks().forEach((t) => t.stop());
    };
  }, [cameraStream]);

  // Upload profile picture to card-attachments bucket (Profile Picture folder)
  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPatient) return;
    if (!file.type.startsWith('image/')) { setProfilePicError('Please select an image file (JPG, PNG, etc.).'); return; }
    if (file.size > 5 * 1024 * 1024) { setProfilePicError('File size must be under 5 MB.'); return; }
    setIsUploadingPic(true);
    setProfilePicError('');
    try {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const pid = selectedPatient.id;
      const path = `Profile Picture/${pid}_${Date.now()}.${ext}`;

      // Remove ALL existing profile pictures for this patient (any extension)
      const { data: existing } = await supabase.storage.from('card-attachments').list('Profile Picture', { search: pid });
      const toRemove = (existing ?? []).filter((f) => f.name.startsWith(pid)).map((f) => `Profile Picture/${f.name}`);
      if (toRemove.length > 0) await supabase.storage.from('card-attachments').remove(toRemove);

      // Upload new file with unique name to bypass CDN cache
      const { error: upErr } = await supabase.storage.from('card-attachments').upload(path, file);
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('card-attachments').getPublicUrl(path);
      setProfilePicUrl(pub.publicUrl + '?t=' + Date.now());
    } catch (err: any) {
      console.error('Profile pic upload error:', err);
      setProfilePicError(err.message ?? 'Upload failed.');
    } finally {
      setIsUploadingPic(false);
      // Reset the input so the same file can be re-selected
      if (profilePicInputRef.current) profilePicInputRef.current.value = '';
    }
  };

  // Auto-load tagged patient on mount
  // If the logged-in user has been tagged to a patient profile (via MemberTagging),
  // automatically load that patient so the member doesn't need to search.
  const authUser = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!authUser?.id) {
      setIsAutoLoading(false);
      return;
    }

    let cancelled = false;
    setIsAutoLoading(true);
    (async () => {
      try {
        // 1. Find health_card linked to the logged-in user
        //    Use .select() + limit(1) instead of .maybeSingle() because
        //    multiple cards may exist (from old auto-create logic), which
        //    causes .maybeSingle() to silently return null.
        const { data: cards } = await supabase
          .schema('module4')
          .from('health_card')
          .select('id, patient_profile')
          .eq('user', authUser.id)
          .not('patient_profile', 'is', null)
          .limit(1);

        const card = cards?.[0] ?? null;

        if (cancelled) return;

        if (!card?.patient_profile) {
          // No tagged patient — member is not linked yet
          setIsAutoLoading(false);
          return;
        }

        // Mark this member as tagged (locks out search for other patients)
        setTaggedPatientId(card.patient_profile);

        // 2. Fetch the linked patient profile from module3 (with brgy/city joins)
        const { data: profile } = await supabase
          .schema('module3')
          .from('patient_profile')
          .select('id, first_name, middle_name, last_name, ext_name, sex, birth_date, brgy')
          .eq('id', card.patient_profile)
          .maybeSingle();

        if (!profile || cancelled) return;

        // 3. Resolve brgy → city → province → region (same logic as handleSearch)
        let brgyData: any = null;
        if (profile.brgy) {
          const { data: brgy } = await supabase.schema('module3').from('brgy')
            .select('id, description, city_municipality').eq('id', profile.brgy).maybeSingle();
          if (brgy) {
            brgyData = { ...brgy };
            if (brgy.city_municipality) {
              const { data: city } = await supabase.schema('module3').from('city_municipality')
                .select('id, description, province').eq('id', brgy.city_municipality).maybeSingle();
              if (city) {
                brgyData.city_municipality = { ...city };
                if (city.province) {
                  const { data: prov } = await supabase.schema('module3').from('province')
                    .select('id, description, region').eq('id', city.province).maybeSingle();
                  if (prov) {
                    brgyData.city_municipality.province = { ...prov };
                    if (prov.region) {
                      const { data: region } = await supabase.schema('module3').from('region')
                        .select('id, description').eq('id', prov.region).maybeSingle();
                      brgyData.city_municipality.province.region = region ?? null;
                    }
                  }
                }
              }
            }
          }
        }

        const assembled: PatientProfile = { ...profile, brgy: brgyData };

        if (!cancelled) {
          // Skip PIN gate for the member's own profile — they already authenticated
          setSelectedPatient(assembled);
          await loadPatientData(assembled);
        }
      } catch (err) {
        console.error('Auto-load tagged patient error:', err);
      } finally {
        if (!cancelled) setIsAutoLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [authUser?.id]);

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

  // Card download
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

  // Print card
  const handlePrintCard = useCallback(async () => {
    if (!selectedPatient || !qrDataUrl || !qrCodeValue) return;
    setIsCapturing(true);
    try {
      const canvas = await buildCardCanvas(selectedPatient, qrDataUrl, qrCodeValue, profilePicUrl);
      setPrintModalImg(canvas.toDataURL('image/png'));
    } catch (e) { console.error('Print error:', e); }
    finally { setIsCapturing(false); }
  }, [selectedPatient, qrDataUrl, qrCodeValue, profilePicUrl, buildCardCanvas]);

  // Archive helpers
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

  // Render
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

      {/* ══ Camera Capture Modal ══ */}
      {showCamera && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Take Profile Photo</h3>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500">Position your face in the frame</p>
                </div>
              </div>
              <button onClick={closeCamera} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </button>
            </div>

            {/* Camera view */}
            <div className="relative bg-black aspect-square">
              {cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertCircle className="w-7 h-7 text-red-500 dark:text-red-400" />
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed">{cameraError}</p>
                  <button
                    onClick={() => { closeCamera(); profilePicInputRef.current?.click(); }}
                    className="mt-2 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" /> Upload Photo Instead
                  </button>
                </div>
              ) : capturedImage ? (
                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                  />
                  {/* Circular guide overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[70%] h-[70%] rounded-full border-2 border-white/30 shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]" />
                  </div>
                  {/* Loading indicator when stream not yet ready */}
                  {!cameraStream && !cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </>
              )}
              {/* Hidden canvas for capture */}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Controls */}
            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700">
              {cameraError ? null : capturedImage ? (
                /* Captured — Use / Retake */
                <div className="flex items-center gap-3">
                  <button
                    onClick={retakePhoto}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" /> Retake
                  </button>
                  <button
                    onClick={useCapturedPhoto}
                    disabled={isUploadingPic}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
                  >
                    {isUploadingPic ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    ) : (
                      <><CheckCircle2 className="w-4 h-4" /> Use Photo</>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={switchCamera}
                    className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Switch camera"
                  >
                    <SwitchCamera className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={capturePhoto}
                    disabled={!cameraStream}
                    className="w-16 h-16 rounded-full bg-white border-4 border-green-500 flex items-center justify-center hover:border-green-600 disabled:opacity-40 transition-all active:scale-95 shadow-lg"
                    title="Capture photo"
                  >
                    <div className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 transition-colors" />
                  </button>
                  <button
                    onClick={closeCamera}
                    className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Cancel"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6">

        {/* ── Search / Profile ── */}
        <Card className="p-6 dark:bg-gray-900 dark:border-gray-700">
          {isAutoLoading ? (
            /* Loading state while checking for tagged patient */
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="w-8 h-8 text-green-600 dark:text-green-400 animate-spin" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading your profile…</p>
            </div>
          ) : taggedPatientId ? (
            /* ── Tagged member: elegant profile with picture upload ── */
            <>
              {selectedPatient ? (
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  {/* ── Profile Picture Section ── */}
                  <div className="flex flex-col items-center gap-3 sm:min-w-[180px]">
                    {/* Large profile picture with camera overlay */}
                    <div className="relative group">
                      <div className="w-28 h-28 rounded-2xl overflow-hidden ring-4 ring-green-100 dark:ring-green-900/40 shadow-lg">
                        <img
                          src={profilePicUrl || defaultProfile}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Hover overlay */}
                      <button
                        onClick={() => profilePicInputRef.current?.click()}
                        className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center cursor-pointer gap-1"
                        title="Upload profile picture"
                      >
                        <Camera className="w-6 h-6 text-white drop-shadow" />
                        <span className="text-[10px] font-semibold text-white drop-shadow">
                          {profilePicUrl ? 'Change' : 'Upload'}
                        </span>
                      </button>
                      {/* Uploading spinner */}
                      {isUploadingPic && (
                        <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-white animate-spin" />
                        </div>
                      )}
                      {/* Hidden file input */}
                      <input
                        ref={profilePicInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfilePicUpload}
                      />
                      {/* Small camera badge */}
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-600 dark:bg-green-500 flex items-center justify-center shadow-md border-2 border-white dark:border-gray-800">
                        <Camera className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={openCamera}
                        className="text-xs font-medium text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        Take Photo
                      </button>
                      <span className="text-gray-300 dark:text-gray-600 text-xs">|</span>
                      <button
                        onClick={() => profilePicInputRef.current?.click()}
                        className="text-xs font-medium text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Upload
                      </button>
                    </div>
                    {profilePicError && (
                      <p className="text-[11px] text-red-500 dark:text-red-400 text-center max-w-[180px]">{profilePicError}</p>
                    )}
                  </div>

                  {/* ── Profile Details Section ── */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100 truncate">
                        {fullName(selectedPatient)}
                      </h3>
                      <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-[10px] font-semibold uppercase tracking-wide">
                        Member
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">My Health Profile</p>

                    {/* Info grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                        <User className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Sex</p>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{selectedPatient.sex}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                        <IdCard className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Date of Birth</p>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{formatDate(selectedPatient.birth_date)} ({computeAge(selectedPatient.birth_date)})</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 sm:col-span-2">
                        <Building2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Address</p>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{getFullAddress(selectedPatient.brgy)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Document stats */}
                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                      <span className="flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />{totalActive} active documents
                      </span>
                      {totalArchived > 0 && (
                        <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                          <Archive className="w-3.5 h-3.5" />{totalArchived} archived
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Loading / error when patient not yet loaded */
                <>
                  <h3 className="font-semibold text-lg mb-1 flex items-center gap-2 dark:text-gray-100">
                    <User className="w-5 h-5 text-green-600 dark:text-green-400" /> My Profile
                  </h3>
                  {errorMessage && (
                    <div className="mt-3 flex gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><p>{errorMessage}</p>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            /* ── Not tagged: show message instead of open search ── */
            <>
              <h3 className="font-semibold text-lg mb-1 flex items-center gap-2 dark:text-gray-100">
                <Search className="w-5 h-5 text-green-600 dark:text-green-400" /> Find My Records
              </h3>
              <div className="mt-3 flex gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <p className="font-semibold">Account Not Linked</p>
                  <p className="mt-1">Your account has not been linked to a patient profile yet. Please contact a Health Card Operator to tag your account to your patient record.</p>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* ── Tabs (patient selected) ── */}
        {selectedPatient && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="qrcode">Health Card</TabsTrigger>
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
            <p className="text-sm">Your documents, QR code, and printable health ID card will appear here.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default UhcMember;