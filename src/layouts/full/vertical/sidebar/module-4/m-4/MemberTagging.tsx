'use client';


import { useState, useCallback, useRef } from 'react';
import { supabase } from 'src/lib/supabase';
import { Card } from 'src/components/ui/card';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import {
  Tag, Search, User, CheckCircle2, AlertCircle, Loader2,
  Link2, X, ChevronRight, UserCheck, ShieldCheck,
  Mail, Calendar, MapPin, ArrowRight, RefreshCw, Info,
} from 'lucide-react';
import defaultProfile from 'src/assets/images/profile/default_profile.jpg';

// Only Member role is used for tagging
const MEMBER_ROLE = 'Member' as const;

// Types
interface AuthUserRecord {
  id: string;           
  email: string;        
  is_active: boolean;
  created_at: string;
}

interface PatientProfile {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  ext_name?: string;
  sex?: string;
  birth_date?: string;
  brgy?: string | { description?: string; city_municipality?: { description?: string } };
}

interface TaggingState {
  status: 'idle' | 'linking' | 'success' | 'error';
  message: string;
}

// Helpers

const fullName = (p: PatientProfile) =>
  [p.first_name, p.middle_name, p.last_name, p.ext_name].filter(Boolean).join(' ');

const shortAddress = (brgy: PatientProfile['brgy']): string => {
  if (!brgy || typeof brgy === 'string') return '';
  const city = typeof brgy === 'object' ? brgy.city_municipality?.description : '';
  return [brgy.description, city].filter(Boolean).join(', ');
};

const initials = (name: string) =>
  name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

const generateUniqueQrCode = (patientId: string): string => {
  const frag = patientId.replace(/-/g, '').substring(0, 12).toUpperCase();
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `UHC-${frag}-${ts}-${rand}`;
};

// Sub-components

const StepBadge = ({ n, active, done }: { n: number; active: boolean; done: boolean }) => (
  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
    done    ? 'bg-green-600 text-white shadow-md shadow-green-200 dark:shadow-green-900'
    : active ? 'bg-amber-500 text-white shadow-md shadow-amber-200 dark:shadow-amber-900 ring-4 ring-amber-100 dark:ring-amber-900/50'
    :          'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
  }`}>
    {done ? <CheckCircle2 className="w-4 h-4" /> : n}
  </div>
);

// Main Component
const MemberTagging = () => {
  // Step 1: select registered auth user
  const [userQuery,       setUserQuery]       = useState('');
  const [userResults,     setUserResults]     = useState<AuthUserRecord[]>([]);
  const [selectedUser,    setSelectedUser]    = useState<AuthUserRecord | null>(null);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [userError,       setUserError]       = useState('');

  // Step 2: select patient profile
  const [patientQuery,       setPatientQuery]       = useState('');
  const [patientResults,     setPatientResults]     = useState<PatientProfile[]>([]);
  const [selectedPatient,    setSelectedPatient]    = useState<PatientProfile | null>(null);
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);
  const [patientError,       setPatientError]       = useState('');

  // Role is always Member
  const selectedRole = MEMBER_ROLE;

  // Step 4: confirm & tag
  const [tagging,       setTagging]       = useState<TaggingState>({ status: 'idle', message: '' });
  const [cachedRoleIds, setCachedRoleIds] = useState<Record<string, string>>({});

  const userInputRef    = useRef<HTMLInputElement>(null);
  const patientInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Search registered users from public.user_status
  const searchUsers = useCallback(async () => {
    const q = userQuery.trim();
    if (!q) return;
    setIsSearchingUser(true);
    setUserError('');
    setUserResults([]);

    try {
      // user_status stores: id (= auth.users.id), email, is_active, created_at
      const { data, error } = await supabase
        .from('user_status')
        .select('id, email, is_active, created_at')
        .ilike('email', `%${q}%`)
        .eq('is_active', true)
        .limit(10);

      if (error) throw error;
      if (!data || data.length === 0) {
        setUserError('No active registered users found with that email. The person must have a confirmed account first.');
        return;
      }
      setUserResults(data as AuthUserRecord[]);
    } catch (err) {
      console.error(err);
      setUserError('Failed to search users. Please try again.');
    } finally {
      setIsSearchingUser(false);
    }
  }, [userQuery]);

  // Step 2: Search patient profiles from module3
  const searchPatients = useCallback(async () => {
    const q = patientQuery.trim();
    if (!q) return;
    setIsSearchingPatient(true);
    setPatientError('');
    setPatientResults([]);

    try {
      const { data: profiles, error } = await supabase
        .schema('module3')
        .from('patient_profile')
        .select('id, first_name, middle_name, last_name, ext_name, sex, birth_date, brgy')
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
        .limit(10);

      if (error) throw error;
      if (!profiles || profiles.length === 0) {
        setPatientError('No patient profiles found. Make sure the patient is registered in module 3 first.');
        return;
      }

      // Fetch brgy descriptions
      const brgyIds = [...new Set(profiles.map((p: any) => p.brgy).filter(Boolean))];
      let brgyMap: Record<string, any> = {};
      if (brgyIds.length > 0) {
        const { data: brgys } = await supabase
          .schema('module3')
          .from('brgy')
          .select('id, description, city_municipality')
          .in('id', brgyIds);
        const cityIds = [...new Set((brgys ?? []).map((b: any) => b.city_municipality).filter(Boolean))];
        let cityMap: Record<string, any> = {};
        if (cityIds.length > 0) {
          const { data: cities } = await supabase
            .schema('module3')
            .from('city_municipality')
            .select('id, description')
            .in('id', cityIds);
          (cities ?? []).forEach((c: any) => { cityMap[c.id] = c; });
        }
        (brgys ?? []).forEach((b: any) => {
          brgyMap[b.id] = { ...b, city_municipality: cityMap[b.city_municipality] ?? null };
        });
      }

      const assembled: PatientProfile[] = profiles.map((p: any) => ({
        ...p,
        brgy: brgyMap[p.brgy] ?? null,
      }));
      setPatientResults(assembled);
    } catch (err) {
      console.error(err);
      setPatientError('Failed to search patients. Please try again.');
    } finally {
      setIsSearchingPatient(false);
    }
  }, [patientQuery]);

  // Step 3: Tag — link auth user → patient → health card + role
  const handleTag = async () => {
    if (!selectedUser || !selectedPatient) return;
    setTagging({ status: 'linking', message: 'Linking records…' });

    try {
      // 0a. Guard: check if this user is already linked to a DIFFERENT patient
      const { data: userCards, error: userCardErr } = await supabase
        .schema('module4')
        .from('health_card')
        .select('id, patient_profile')
        .eq('user', selectedUser.id);

      if (userCardErr) throw userCardErr;

      const conflictingUserCard = (userCards ?? []).find(
        (c: any) => c.patient_profile && c.patient_profile !== selectedPatient.id
      );

      if (conflictingUserCard) {
        // Resolve the already-linked patient's name for a clear error message
        const { data: linkedPatient } = await supabase
          .schema('module3')
          .from('patient_profile')
          .select('first_name, middle_name, last_name, ext_name')
          .eq('id', conflictingUserCard.patient_profile)
          .single();

        const linkedName = linkedPatient
          ? [linkedPatient.first_name, linkedPatient.middle_name, linkedPatient.last_name, linkedPatient.ext_name].filter(Boolean).join(' ')
          : conflictingUserCard.patient_profile;

        throw new Error(
          `This email (${selectedUser.email}) is already linked to another patient profile: ${linkedName}. ` +
          `Each user account can only be linked to one patient. Please unlink the existing record first, or use a different account.`
        );
      }

      // 0b. Guard: check if this patient is already linked to a DIFFERENT user
      const { data: patientCards, error: patientCardErr } = await supabase
        .schema('module4')
        .from('health_card')
        .select('id, user')
        .eq('patient_profile', selectedPatient.id)
        .not('user', 'is', null);

      if (patientCardErr) throw patientCardErr;

      const conflictingPatientCard = (patientCards ?? []).find(
        (c: any) => c.user !== selectedUser.id
      );

      if (conflictingPatientCard) {
        // Resolve the already-linked user's email for a clear error message
        const { data: linkedUser } = await supabase
          .from('user_status')
          .select('email')
          .eq('id', conflictingPatientCard.user)
          .single();

        const linkedEmail = linkedUser?.email ?? conflictingPatientCard.user;

        throw new Error(
          `This patient (${fullName(selectedPatient)}) is already linked to another account: ${linkedEmail}. ` +
          `Each patient can only be linked to one user. Please unlink the existing record first, or select a different patient.`
        );
      }

      // A. Get role ID from public.role based on selected role
      let roleId = cachedRoleIds[selectedRole] ?? null;
      if (!roleId) {
        const searchTerm = selectedRole.toLowerCase();
        const { data: roleData, error: roleError } = await supabase
          .from('role')
          .select('id')
          .ilike('description', `%${searchTerm}%`)
          .eq('is_active', true)
          .single();

        if (roleError || !roleData) {
          throw new Error(`Could not find "${selectedRole}" role. Please ensure a role named "${selectedRole}" exists in the system.`);
        }
        roleId = roleData.id;
        setCachedRoleIds((prev) => ({ ...prev, [selectedRole]: roleId! }));
      }

      // B. Assign selected role in public.user_role (if not already)
      const { data: existingRole } = await supabase
        .from('user_role')
        .select('id')
        .eq('user', selectedUser.id)
        .eq('role', roleId!)
        .maybeSingle();

      if (!existingRole) {
        const { error: roleInsertError } = await supabase
          .from('user_role')
          .insert({ user: selectedUser.id, role: roleId });

        if (roleInsertError) throw roleInsertError;
      }

      //    C. Create or update module4.health_card
      //    Link: user (auth.users.id) + patient_profile (module3.patient_profile.id)
      //    Check by BOTH user and patient to avoid creating duplicate rows.
      const { data: cardByPatient } = await supabase
        .schema('module4')
        .from('health_card')
        .select('id')
        .eq('patient_profile', selectedPatient.id)
        .maybeSingle();

      const { data: cardByUser } = await supabase
        .schema('module4')
        .from('health_card')
        .select('id')
        .eq('user', selectedUser.id)
        .maybeSingle();

      // Prefer updating an existing card (by patient or by user) over creating a new one
      const existingCardId = cardByPatient?.id ?? cardByUser?.id;

      // Auto-generate a unique QR code for this health card
      const qrCode = generateUniqueQrCode(selectedPatient.id);

      if (existingCardId) {
        // Update existing card to ensure both fields are set correctly
        const { error: updateError } = await supabase
          .schema('module4')
          .from('health_card')
          .update({ user: selectedUser.id, patient_profile: selectedPatient.id, qr_code: qrCode })
          .eq('id', existingCardId);

        if (updateError) throw updateError;
      } else {
        // Create new health card with auto-generated QR code
        const { error: insertError } = await supabase
          .schema('module4')
          .from('health_card')
          .insert({
            user: selectedUser.id,
            patient_profile: selectedPatient.id,
            qr_code: qrCode,
          });

        if (insertError) throw insertError;
      }

      //    D. Also create user_assignment if applicable
      //    (optional — links user to their "assignment" in public schema)
      //    Skipped here since assignment depends on facility context.

      setTagging({
        status: 'success',
        message: `${fullName(selectedPatient)} has been successfully tagged as ${selectedRole} and linked to ${selectedUser.email}.`,
      });
    } catch (err: any) {
      console.error('Tagging error:', err);
      setTagging({
        status: 'error',
        message: err?.message ?? 'Tagging failed. Please try again.',
      });
    }
  };

  const resetAll = () => {
    setSelectedUser(null);
    setSelectedPatient(null);
    setUserQuery('');
    setPatientQuery('');
    setUserResults([]);
    setPatientResults([]);
    setUserError('');
    setPatientError('');
    setTagging({ status: 'idle', message: '' });
  };

  const step1Done = !!selectedUser;
  const step2Done = !!selectedPatient;
  const step3Active = step1Done && step2Done;

  // Render
  return (
    <div className="flex flex-col gap-5">

      {/* Header Card */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
            <Tag className="w-6 h-6 text-amber-700 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100">Health Card Tagging</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Link a registered system user to their patient profile and assign the Member role.
            </p>
          </div>
          {(step1Done || step2Done) && (
            <Button variant="outline" onClick={resetAll} className="flex gap-2 text-sm">
              <RefreshCw className="w-4 h-4" /> Start Over
            </Button>
          )}
        </div>
      </Card>

      {/* ── STEP 1: Find Registered User ─────────────────────────────────── */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <StepBadge n={1} active={!step1Done} done={step1Done} />
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200">Find Registered User</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Search by email address — user must already have an account</p>
          </div>
        </div>

        {!selectedUser ? (
          <>
            <div className="flex gap-2">
              <Input
                ref={userInputRef}
                placeholder="Search by email (e.g. juan@example.com)"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                className="flex-1"
              />
              <Button
                onClick={searchUsers}
                disabled={isSearchingUser || !userQuery.trim()}
                className="flex gap-2 bg-green-700 hover:bg-green-800 text-white"
              >
                {isSearchingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
              </Button>
            </div>

            <div className="mt-2 flex items-start gap-2 text-xs text-gray-400 dark:text-gray-500">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <p>Only active, verified accounts will appear. The user must have registered and confirmed their email first.</p>
            </div>

            {userError && (
              <div className="mt-3 flex gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><p>{userError}</p>
              </div>
            )}

            {userResults.length > 0 && (
              <div className="mt-3 border dark:border-gray-700 rounded-xl overflow-hidden divide-y dark:divide-gray-700">
                {userResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => { setSelectedUser(u); setUserResults([]); setUserQuery(''); }}
                    className="w-full text-left px-4 py-3 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-700 dark:text-green-400 font-bold text-xs flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{u.email}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Registered {new Date(u.created_at).toLocaleDateString()} ·{' '}
                        <span className={u.is_active ? 'text-green-600' : 'text-red-500'}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-green-900 dark:text-green-300 truncate">{selectedUser.email}</p>
              <p className="text-xs text-green-600 dark:text-green-400">
                Registered {new Date(selectedUser.created_at).toLocaleDateString()} · Active account
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> Selected
              </span>
              <button
                onClick={() => { setSelectedUser(null); setUserQuery(''); }}
                className="p-1.5 rounded-lg hover:bg-green-200 transition-colors"
              >
                <X className="w-4 h-4 text-green-600" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* ── STEP 2: Find Patient Profile ──────────────────────────────────── */}
      <Card className={`p-6 transition-all ${!step1Done ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-3 mb-4">
          <StepBadge n={2} active={step1Done && !step2Done} done={step2Done} />
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200">Find Patient Profile</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Search the patient record in module 3</p>
          </div>
        </div>

        {!selectedPatient ? (
          <>
            <div className="flex gap-2">
              <Input
                ref={patientInputRef}
                placeholder="Search by first or last name"
                value={patientQuery}
                onChange={(e) => setPatientQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchPatients()}
                className="flex-1"
                disabled={!step1Done}
              />
              <Button
                onClick={searchPatients}
                disabled={isSearchingPatient || !patientQuery.trim() || !step1Done}
                className="flex gap-2 bg-green-700 hover:bg-green-800 text-white"
              >
                {isSearchingPatient ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
              </Button>
            </div>

            {patientError && (
              <div className="mt-3 flex gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><p>{patientError}</p>
              </div>
            )}

            {patientResults.length > 0 && (
              <div className="mt-3 border dark:border-gray-700 rounded-xl overflow-hidden divide-y dark:divide-gray-700">
                {patientResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelectedPatient(p); setPatientResults([]); setPatientQuery(''); }}
                    className="w-full text-left px-4 py-3 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-700 dark:text-green-400 font-bold text-xs flex-shrink-0">
                      {initials(fullName(p))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100">{fullName(p)}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {p.sex} · DOB: {p.birth_date} · {shortAddress(p.brgy)}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
              <img src={defaultProfile} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-green-900 dark:text-green-300">{fullName(selectedPatient)}</p>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {selectedPatient.sex && (
                  <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <User className="w-3 h-3" />{selectedPatient.sex}
                  </span>
                )}
                {selectedPatient.birth_date && (
                  <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <Calendar className="w-3 h-3" />{selectedPatient.birth_date}
                  </span>
                )}
                {shortAddress(selectedPatient.brgy) && (
                  <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <MapPin className="w-3 h-3" />{shortAddress(selectedPatient.brgy)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-200 px-2 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> Selected
              </span>
              {tagging.status === 'idle' && (
                <button
                  onClick={() => { setSelectedPatient(null); setPatientQuery(''); }}
                  className="p-1.5 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <X className="w-4 h-4 text-green-700" />
                </button>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* ── STEP 3: Confirm & Tag ─────────────────────────────────────────── */}
      <Card className={`p-6 transition-all ${!step3Active ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-3 mb-4">
          <StepBadge n={3} active={step3Active && tagging.status === 'idle'} done={tagging.status === 'success'} />
          <div>
            <p className="font-semibold text-gray-800 dark:text-gray-200">Confirm & Tag as Member</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Review the link and assign role</p>
          </div>
        </div>

        {step3Active && tagging.status === 'idle' && (
          <>
            {/* Summary linking card */}
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-5">
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-semibold mb-3">Linking Summary</p>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                {/* Auth user side */}
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-800 p-3 text-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-2">
                    <Mail className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Registered User</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate mt-0.5">{selectedUser?.email}</p>
                </div>

                <div className="flex items-center gap-1 text-amber-500">
                  <Link2 className="w-5 h-5" />
                  <ArrowRight className="w-4 h-4" />
                </div>

                {/* Patient side */}
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-green-200 dark:border-green-800 p-3 text-center">
                  <div className="w-10 h-10 rounded-full overflow-hidden mx-auto mb-2">
                    <img src={defaultProfile} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Patient Profile</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm truncate mt-0.5">{selectedPatient ? fullName(selectedPatient) : ''}</p>
                </div>
              </div>

              {/* What will happen */}
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide font-semibold">Actions that will be performed:</p>
                {[
                  { icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />, text: 'Assign "Member" role in public.user_role', color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' },
                  { icon: <UserCheck  className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400"  />, text: 'Link auth user to patient_profile in module4.health_card', color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' },
                  { icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />, text: 'Create health card if one doesn\'t exist yet', color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs text-gray-700 dark:text-gray-300 ${item.color}`}>
                    {item.icon}
                    {item.text}
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleTag}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold flex items-center justify-center gap-2 h-11"
            >
              <Tag className="w-4 h-4" />
              Confirm Tagging
            </Button>
          </>
        )}

        {/* Linking in progress */}
        {tagging.status === 'linking' && (
          <div className="flex flex-col items-center py-10 gap-4">
            <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-amber-600 dark:text-amber-400 animate-spin" />
            </div>
            <p className="font-semibold text-gray-700 dark:text-gray-300">Linking Records…</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Assigning role and creating health card</p>
          </div>
        )}

        {/* Success */}
        {tagging.status === 'success' && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center">
              <p className="font-bold text-green-800 dark:text-green-400 text-lg">Tagging Successful!</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">{tagging.message}</p>
            </div>

            {/* Summary chips */}
            <div className="flex flex-wrap gap-2 justify-center mt-1">
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-full">
                <Mail className="w-3.5 h-3.5" />{selectedUser?.email}
              </span>
              <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500 self-center" />
              <span className="flex items-center gap-1.5 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full">
                <UserCheck className="w-3.5 h-3.5" />{selectedPatient ? fullName(selectedPatient) : ''}
              </span>
            </div>

            <div className="w-full mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex gap-2">
              <Info className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-green-700 dark:text-green-400">
                The user can now log in and access the system as <strong>Member</strong>.
                {' Remind them to set a PIN for security.'}
              </p>
            </div>

            <Button onClick={resetAll} className="flex gap-2 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white mt-2">
              <Tag className="w-4 h-4" /> Tag Another Member
            </Button>
          </div>
        )}

        {/* Error */}
        {tagging.status === 'error' && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div className="text-center">
              <p className="font-bold text-red-800 dark:text-red-400">Tagging Failed</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">{tagging.message}</p>
            </div>
            <Button
              onClick={() => setTagging({ status: 'idle', message: '' })}
              className="flex gap-2 bg-red-600 hover:bg-red-700 text-white"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default MemberTagging;