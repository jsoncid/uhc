import { createContext, useState, useEffect } from 'react';
import {
  ReferralType,
  ReferralStatus,
  ReferralHistory,
  ReferralInfo,
  ReferralInfoDiagnostic,
  ReferralInfoVaccination,
} from '../types/referral';
import { supabaseM2, supabaseM3 } from '@/lib/supabase';
import { useAuthStore } from '@/stores/useAuthStore';
import { assignmentService } from '@/services/assignmentService';

export interface ReferralContextType {
  referrals: ReferralType[];
  deactivatedReferrals: ReferralType[];
  incomingReferrals: ReferralType[];
  statuses: ReferralStatus[];
  loading: boolean;
  error: string | Error | null;
  referralSearch: string;
  filter: string;
  setFilter: (filter: string) => void;
  searchReferrals: (term: string) => void;
  setReferralSearch: (term: string) => void;
  addReferral: (referral: ReferralType) => Promise<void>;
  updateReferralStatus: (id: string, statusId: string) => void;
  deactivateReferral: (id: string, deactivatedBy?: string) => void;
  acceptIncomingReferral: (id: string, acceptedBy: string) => void;
  declineIncomingReferral: (id: string, declineReason: string, redirectHospital?: string) => void;
  updateIncomingStatus: (id: string, statusId: string) => void;
  markOutgoingInTransit: (id: string) => void;
  updateReferralInfo: (id: string, updated: Partial<ReferralInfo>) => void;
  saveDischargeNotes: (id: string, notes: string) => void;
  addDiagnostic: (
    referralId: string,
    diag: { diagnostics: string; date?: string | null; attachment?: string | null },
  ) => void;
  deleteDiagnostic: (diagId: string, referralId: string) => void;
  updateDiagnosticAttachment: (diagId: string, referralId: string, attachment: string) => void;
  addVaccination: (referralId: string, vac: { description: string; date?: string | null }) => void;
  deleteVaccination: (vacId: string, referralId: string) => void;
  addOutgoingDiagnostic: (
    referralId: string,
    diag: { diagnostics: string; date?: string | null; attachment?: string | null },
  ) => void;
  deleteOutgoingDiagnostic: (diagId: string, referralId: string) => void;
  updateOutgoingDiagnosticAttachment: (
    diagId: string,
    referralId: string,
    attachment: string,
  ) => void;
  addOutgoingVaccination: (
    referralId: string,
    vac: { description: string; date?: string | null },
  ) => void;
  deleteOutgoingVaccination: (vacId: string, referralId: string) => void;
}

export const ReferralContext = createContext<ReferralContextType>({} as ReferralContextType);

export const ReferralProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userAssignmentId } = useAuthStore();
  const [referrals, setReferrals] = useState<ReferralType[]>([]);
  const [deactivatedReferrals, setDeactivatedReferrals] = useState<ReferralType[]>([]);
  const [incomingReferrals, setIncomingReferrals] = useState<ReferralType[]>([]);
  const [statuses, setStatuses] = useState<ReferralStatus[]>([]);
  const [referralSearch, setReferralSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // ── Shared utilities ──────────────────────────────────────────────────────
  const isRealUuid = (v: string | null | undefined): v is string =>
    !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

  const persistHistoryEntry = (referralId: string, statusDescription: string, details: string) => {
    if (!isRealUuid(referralId)) return;
    const realStatus = statuses.find((s) => s.description === statusDescription);
    if (!realStatus || !isRealUuid(realStatus.id)) return;
    supabaseM2
      .from('referral_history')
      .update({ is_active: false })
      .eq('referral', referralId)
      .then(() =>
        supabaseM2
          .from('referral_history')
          .insert({ referral: referralId, status: realStatus.id, is_active: true, details })
          .then(({ error }) => {
            if (error) console.error('[persistHistoryEntry] INSERT failed:', error);
          }),
      );
  };

  // ── Map a raw Supabase row to ReferralType ────────────────────────────────
  const mapReferral = (row: any, resolvedStatuses: ReferralStatus[] = []): ReferralType => {
    // Use passed statuses first, fall back to current statuses state for description lookup
    const allStatuses = resolvedStatuses.length ? resolvedStatuses : statuses;
    const history: ReferralHistory[] = (row.referral_history ?? []).map(
      (h: any): ReferralHistory => ({
        id: h.id,
        created_at: h.created_at,
        details: h.details,
        referral: h.referral,
        to_assignment: h.to_assignment,
        status: h.status,
        is_active: h.is_active,
        status_description: allStatuses.find((s) => s.id === h.status)?.description ?? undefined,
      }),
    );

    const activeHistory = history.filter((h) => h.is_active);
    const latestH = activeHistory[activeHistory.length - 1];
    let latestStatus: ReferralStatus | undefined = latestH
      ? {
          id: latestH.status ?? '',
          created_at: latestH.created_at,
          description: latestH.status_description ?? null,
        }
      : undefined;

    // If description still couldn't be resolved, derive from the referral's own status flag
    if (!latestStatus?.description) {
      if (row.status === false) {
        latestStatus = {
          id: 'deactivated',
          created_at: row.deactivated_at ?? row.created_at,
          description: 'Deactivated',
        };
      } else {
        latestStatus = {
          id: latestH?.status ?? 'pending',
          created_at: latestH?.created_at ?? row.created_at,
          description: 'Pending',
        };
      }
    }

    const infoRaw = Array.isArray(row.referral_info) ? row.referral_info[0] : row.referral_info;
    const info: ReferralInfo | undefined = infoRaw
      ? {
          ...infoRaw,
          referral: row.id,
          diagnostics: (infoRaw.referral_info_diagnostic ?? []) as ReferralInfoDiagnostic[],
          vaccinations: (infoRaw.referral_info_vaccination ?? []) as ReferralInfoVaccination[],
        }
      : undefined;

    const profile = row.profile;
    const patientName = profile
      ? [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ')
      : undefined;

    // from_asgn / to_asgn are not fetched (cross-schema join not supported).
    // Names will be undefined; use assignmentService to resolve them separately if needed.
    return {
      id: row.id,
      created_at: row.created_at,
      status: row.status,
      patient_profile: row.patient_profile,
      from_assignment: row.from_assignment,
      to_assignment: row.to_assignment,
      deactivated_at: row.deactivated_at,
      deactivated_by: row.deactivated_by,
      rejection_reason: row.rejection_reason,
      accepted_by: row.accepted_by,
      redirect_to: row.redirect_to,
      from_assignment_name: undefined,
      to_assignment_name: undefined,
      latest_status: latestStatus,
      referral_info: info,
      history,
      patient_name: patientName,
    };
  };

  // Cross-schema joins (from_asgn, to_asgn, profile) are intentionally excluded —
  // PostgREST cannot resolve FK relationships across schemas in a single query.
  // Assignment names and patient names are resolved separately via assignmentService
  // or stored on the record itself.
  const REFERRAL_SELECT = `
    id, created_at, status, patient_profile,
    from_assignment, to_assignment,
    deactivated_at, deactivated_by, rejection_reason, accepted_by, redirect_to,
    referral_info(
      id, created_at, referral,
      reason_referral, rtpcr, rtpcr_date, antigen, antigen_date,
      exposure_covid, history_present_illness, pe, gcs, eye, vision, motor,
      blood_pressure, temperature, heart_rate, respiratory_rate, o2_sat, o2_requirement,
      referring_doctor, contact_no, chief_complaints, medications,
      lmp, aog, edc, fh, fht, ie, dilatation, effacement, station,
      presenting_part, prom_hours, ultrasound_1st_date, ultrasound_1st_aog,
      ultrasound_latest_date, ultrasound_efw, ultrasound_presentation, ultrasound_impression,
      gravida, parity, menarche, comorbidity, previous_surgeries, previous_cs,
      lab_result, xray, other_diagnostics,
      referral_info_diagnostic(id, created_at, referral_info, diagnostics, date, attachment, status),
      referral_info_vaccination(id, created_at, referral_info, description, date, status)
    ),
    referral_history(
      id, created_at, details, referral, to_assignment, status, is_active
    )
  `;

  useEffect(() => {
    if (!userAssignmentId) {
      // No session — show empty lists
      setReferrals([]);
      setDeactivatedReferrals([]);
      setIncomingReferrals([]);
      setLoading(false);
      return;
    }

    // ── Fetch from Supabase when the user's assignment is known ─────────────
    const fetchFromSupabase = async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      try {
        // Load real statuses from Supabase module2.status
        const { data: statusRows } = await supabaseM2.from('status').select('*');
        const loadedStatuses = (statusRows as ReferralStatus[]) ?? [];
        if (loadedStatuses.length) setStatuses(loadedStatuses);

        // Outgoing active — referrals sent by this facility
        const { data: outData, error: outError } = await supabaseM2
          .from('referral')
          .select(REFERRAL_SELECT)
          .eq('from_assignment', userAssignmentId)
          .eq('status', true);
        if (outError) throw outError;

        // Outgoing deactivated
        const { data: deactData, error: deactError } = await supabaseM2
          .from('referral')
          .select(REFERRAL_SELECT)
          .eq('from_assignment', userAssignmentId)
          .eq('status', false);
        if (deactError) throw deactError;

        // Incoming — referrals directed to this facility (exclude deactivated by sender)
        const { data: inData, error: inError } = await supabaseM2
          .from('referral')
          .select(REFERRAL_SELECT)
          .eq('to_assignment', userAssignmentId)
          .eq('status', true);
        if (inError) throw inError;

        // ── Batch-enrich: patient names + assignment names ───────────────────
        const allRows = [...(outData ?? []), ...(deactData ?? []), ...(inData ?? [])];
        const mappedAll = allRows.map((r) => mapReferral(r, loadedStatuses));

        // Patient names from module3
        const patientIds = [
          ...new Set(mappedAll.map((r) => r.patient_profile).filter(Boolean) as string[]),
        ];
        const patientNameMap = new Map<string, string>();
        if (patientIds.length) {
          const { data: patients } = await supabaseM3
            .from('patient_profile')
            .select('id, first_name, middle_name, last_name')
            .in('id', patientIds);
          (patients ?? []).forEach((p) => {
            const name = [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(' ');
            if (name) patientNameMap.set(p.id, name);
          });
        }

        // Assignment names from public.assignment
        const assignmentNameMap = new Map<string, string>();
        try {
          const allAssignments = await assignmentService.getAllAssignments();
          allAssignments.forEach((a) => {
            if (a.description) assignmentNameMap.set(a.id, a.description);
          });
        } catch {
          /* non-fatal */
        }

        const enrich = (r: ReferralType): ReferralType => ({
          ...r,
          patient_name: patientNameMap.get(r.patient_profile ?? '') || r.patient_name,
          from_assignment_name:
            assignmentNameMap.get(r.from_assignment ?? '') || r.from_assignment_name,
          to_assignment_name: assignmentNameMap.get(r.to_assignment ?? '') || r.to_assignment_name,
        });

        const outCount = (outData ?? []).length;
        const deactCount = (deactData ?? []).length;
        setReferrals(mappedAll.slice(0, outCount).map(enrich));
        setDeactivatedReferrals(mappedAll.slice(outCount, outCount + deactCount).map(enrich));
        setIncomingReferrals(mappedAll.slice(outCount + deactCount).map(enrich));
      } catch (err) {
        setError(err instanceof Error ? err : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchFromSupabase(refetchTrigger > 0);
  }, [userAssignmentId, refetchTrigger]);

  // ── Realtime subscriptions ────────────────────────────────────────────────
  useEffect(() => {
    if (!userAssignmentId) return;

    let debounce: ReturnType<typeof setTimeout>;
    const refetch = () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => setRefetchTrigger((t) => t + 1), 800);
    };

    const channel = supabaseM2
      .channel(`m2-realtime-${userAssignmentId}`)
      // Outgoing referrals changed (sender side)
      .on(
        'postgres_changes',
        { event: '*', schema: 'module2', table: 'referral', filter: `from_assignment=eq.${userAssignmentId}` },
        refetch,
      )
      // Incoming referrals changed (receiver side)
      .on(
        'postgres_changes',
        { event: '*', schema: 'module2', table: 'referral', filter: `to_assignment=eq.${userAssignmentId}` },
        refetch,
      )
      // Any history entry change (status updates from either party)
      .on(
        'postgres_changes',
        { event: '*', schema: 'module2', table: 'referral_history' },
        refetch,
      )
      .subscribe();

    return () => {
      clearTimeout(debounce);
      supabaseM2.removeChannel(channel);
    };
  }, [userAssignmentId]);

  const addReferral = async (newReferral: ReferralType) => {
    const pendingStatus = statuses.find((s) => s.description === 'Pending');
    const now = new Date().toISOString();

    const pendingHistory: ReferralHistory = {
      id: `rh-${Date.now()}`,
      created_at: now,
      referral: newReferral.id,
      to_assignment: null,
      status: pendingStatus?.id ?? 'pending',
      is_active: true,
      details: 'Referral created — status set to Pending.',
      status_description: 'Pending',
    };

    const withJoins: ReferralType = {
      ...newReferral,
      from_assignment: userAssignmentId ?? newReferral.from_assignment,
      history: [pendingHistory],
      latest_status: pendingStatus,
    };

    // ── Local state update (optimistic — use temp ID until Supabase returns) ─
    const tempId = newReferral.id;
    setReferrals((prev) => [...prev, withJoins]);

    // ── Supabase INSERT (when session is active AND patient_profile is a real UUID) ──
    if (userAssignmentId && isRealUuid(newReferral.patient_profile)) {
      try {
        const { data: refRow, error: refErr } = await supabaseM2
          .from('referral')
          .insert({
            status: true,
            patient_profile: newReferral.patient_profile,
            from_assignment: userAssignmentId,
            to_assignment: newReferral.to_assignment,
          })
          .select('id')
          .single();
        if (refErr) throw refErr;
        const referralId: string = refRow.id;

        // Replace the temp-ID record with the real Supabase UUID
        setReferrals((prev) =>
          prev.map((r) => (r.id === tempId ? { ...withJoins, id: referralId } : r)),
        );

        if (referralId) {
          await supabaseM2.from('referral_history').insert({
            referral: referralId,
            status: pendingStatus?.id,
            is_active: true,
            details: 'Referral created — status set to Pending.',
          });
        }

        if (newReferral.referral_info) {
          const ri = newReferral.referral_info;
          const { data: infoRow, error: infoErr } = await supabaseM2
            .from('referral_info')
            .insert({
              referral: referralId,
              reason_referral: ri.reason_referral,
              rtpcr: ri.rtpcr,
              rtpcr_date: ri.rtpcr_date,
              antigen: ri.antigen,
              antigen_date: ri.antigen_date,
              exposure_covid: ri.exposure_covid,
              history_present_illness: ri.history_present_illness,
              pe: ri.pe,
              gcs: ri.gcs,
              eye: ri.eye,
              vision: ri.vision,
              motor: ri.motor,
              blood_pressure: ri.blood_pressure,
              temperature: ri.temperature,
              heart_rate: ri.heart_rate,
              respiratory_rate: ri.respiratory_rate,
              o2_sat: ri.o2_sat,
              o2_requirement: ri.o2_requirement,
              referring_doctor: ri.referring_doctor,
              contact_no: ri.contact_no,
              chief_complaints: ri.chief_complaints,
              medications: ri.medications,
              lmp: ri.lmp,
              aog: ri.aog,
              edc: ri.edc,
              fh: ri.fh,
              fht: ri.fht,
              ie: ri.ie,
              dilatation: ri.dilatation,
              effacement: ri.effacement,
              station: ri.station,
              presenting_part: ri.presenting_part,
              prom_hours: ri.prom_hours,
              ultrasound_1st_date: ri.ultrasound_1st_date,
              ultrasound_1st_aog: ri.ultrasound_1st_aog,
              ultrasound_latest_date: ri.ultrasound_latest_date,
              ultrasound_efw: ri.ultrasound_efw,
              ultrasound_presentation: ri.ultrasound_presentation,
              ultrasound_impression: ri.ultrasound_impression,
              gravida: ri.gravida,
              parity: ri.parity,
              menarche: ri.menarche,
              comorbidity: ri.comorbidity,
              previous_surgeries: ri.previous_surgeries,
              previous_cs: ri.previous_cs,
              lab_result: ri.lab_result,
              xray: ri.xray,
              other_diagnostics: ri.other_diagnostics,
            })
            .select('id')
            .single();
          if (infoErr) throw infoErr;

          const vacs = (ri.vaccinations ?? []).filter((v) => v.description);
          if (vacs.length && infoRow) {
            await supabaseM2.from('referral_info_vaccination').insert(
              vacs.map((v) => ({
                referral_info: infoRow.id,
                description: v.description,
                date: v.date,
                status: true,
              })),
            );
          }
        }
      } catch (err) {
        console.error('[ReferralContext] Supabase INSERT failed:', err);
      }
    }
  };

  const updateReferralStatus = (id: string, statusId: string) => {
    // Add a new history record and update latest_status
    const newHistoryEntry: ReferralHistory = {
      id: `rh-${Date.now()}`,
      created_at: new Date().toISOString(),
      referral: id,
      to_assignment: null,
      status: statusId,
      is_active: true,
      details: `Status updated to ${statuses.find((s) => s.id === statusId)?.description ?? statusId}`,
      status_description: statuses.find((s) => s.id === statusId)?.description ?? undefined,
    };
    setReferrals((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              latest_status: statuses.find((s) => s.id === statusId),
              history: [
                ...(r.history ?? []).map((h) => ({ ...h, is_active: false })),
                newHistoryEntry,
              ],
            }
          : r,
      ),
    );
    // Persist to Supabase
    const desc = statuses.find((s) => s.id === statusId)?.description ?? statusId;
    persistHistoryEntry(id, desc, `Status updated to ${desc}`);
  };

  const deactivateReferral = (id: string, deactivatedBy = 'Current User') => {
    const now = new Date().toISOString();
    const deactivated = referrals.find((r) => r.id === id);
    if (deactivated) {
      const deactivatedRecord: ReferralType = {
        ...deactivated,
        status: false,
        deactivated_at: now,
        deactivated_by: deactivatedBy,
        latest_status: { id: 'deactivated', created_at: now, description: 'Deactivated' },
      };
      // ── Optimistic local update ────────────────────────────────────────────
      setDeactivatedReferrals((prev) => [deactivatedRecord, ...prev]);
    }
    setReferrals((prev) => prev.filter((r) => r.id !== id));

    // ── Persist to Supabase ────────────────────────────────────────────────

    if (isRealUuid(id)) {
      supabaseM2
        .from('referral')
        .update({
          status: false,
          deactivated_at: now,
          deactivated_by: deactivatedBy,
        })
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('[deactivateReferral] Supabase UPDATE failed:', error);
        });
    }
  };

  // ── Incoming referral actions ───────────────────────────────────────────────
  const acceptIncomingReferral = (id: string, acceptedBy: string) => {
    const acceptedStatus = statuses.find((s) => s.description === 'Accepted');
    const now = new Date().toISOString();
    const historyEntry: ReferralHistory = {
      id: `rh-${Date.now()}`,
      created_at: now,
      referral: id,
      to_assignment: null,
      status: acceptedStatus?.id ?? null,
      is_active: true,
      details: `Accepted by ${acceptedBy}.`,
      status_description: 'Accepted',
    };
    // Find the incoming referral before updating state (for cross-notification)
    const incomingRef = incomingReferrals.find((r) => r.id === id);
    setIncomingReferrals((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              accepted_by: acceptedBy,
              latest_status: acceptedStatus,
              history: [
                ...(r.history ?? []).map((h) => ({ ...h, is_active: false })),
                historyEntry,
              ],
            }
          : r,
      ),
    );
    // Cross-notify the requesting side — mirror accepted_by onto matching outgoing referral
    if (incomingRef?.patient_name) {
      setReferrals((prev) =>
        prev.map((r) =>
          r.patient_name === incomingRef.patient_name && r.latest_status?.description === 'Pending'
            ? { ...r, accepted_by: acceptedBy, latest_status: acceptedStatus }
            : r,
        ),
      );
    }
    // Persist to Supabase
    persistHistoryEntry(id, 'Accepted', `Accepted by ${acceptedBy}.`);
    if (isRealUuid(id)) {
      supabaseM2
        .from('referral')
        .update({ accepted_by: acceptedBy })
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('[acceptIncomingReferral] UPDATE failed:', error);
        });
    }
  };

  const declineIncomingReferral = (
    id: string,
    declineReason: string,
    redirectHospital?: string,
  ) => {
    const declinedStatus = statuses.find((s) => s.description === 'Declined');
    const now = new Date().toISOString();
    const detailText = `Declined — ${declineReason}${redirectHospital ? ` Suggested redirect: ${redirectHospital}.` : ''}`;
    const historyEntry: ReferralHistory = {
      id: `rh-${Date.now()}`,
      created_at: now,
      referral: id,
      to_assignment: null,
      status: declinedStatus?.id ?? null,
      is_active: true,
      details: detailText,
      status_description: 'Declined',
    };

    // Find the incoming referral before updating state (for cross-notification)
    const incomingRef = incomingReferrals.find((r) => r.id === id);

    setIncomingReferrals((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              rejection_reason: declineReason,
              redirect_to: redirectHospital ?? null,
              latest_status: declinedStatus,
              history: [
                ...(r.history ?? []).map((h) => ({ ...h, is_active: false })),
                historyEntry,
              ],
            }
          : r,
      ),
    );

    // Cross-notify the requesting side — find matching outgoing referral by patient name.
    // In real Supabase both parties query the same record; here we sync in local state.
    if (incomingRef?.patient_name) {
      const outgoingHistoryEntry: ReferralHistory = {
        id: `rh-${Date.now() + 1}`,
        created_at: now,
        referral: id,
        to_assignment: null,
        status: declinedStatus?.id ?? null,
        is_active: true,
        details: detailText,
        status_description: 'Declined',
      };
      setReferrals((prev) =>
        prev.map((r) => {
          if (
            r.patient_name === incomingRef.patient_name &&
            r.latest_status?.description === 'Pending'
          ) {
            return {
              ...r,
              rejection_reason: declineReason,
              redirect_to: redirectHospital ?? null,
              latest_status: declinedStatus,
              history: [
                ...(r.history ?? []).map((h) => ({ ...h, is_active: false })),
                outgoingHistoryEntry,
              ],
            };
          }
          return r;
        }),
      );
    }
    // Persist to Supabase
    persistHistoryEntry(id, 'Declined', detailText);
    if (isRealUuid(id)) {
      supabaseM2
        .from('referral')
        .update({ rejection_reason: declineReason, redirect_to: redirectHospital ?? null })
        .eq('id', id)
        .then(({ error }) => {
          if (error) console.error('[declineIncomingReferral] UPDATE failed:', error);
        });
    }
  };

  // Sending facility marks their referral as In Transit, cross-syncs to incoming side
  const markOutgoingInTransit = (id: string) => {
    const inTransitStatus = statuses.find((s) => s.description === 'In Transit');
    const now = new Date().toISOString();
    const historyEntry: ReferralHistory = {
      id: `rh-${Date.now()}`,
      created_at: now,
      referral: id,
      to_assignment: null,
      status: inTransitStatus?.id ?? null,
      is_active: true,
      details: 'Patient dispatched — In Transit',
      status_description: 'In Transit',
    };
    // Update outgoing referral
    const outgoingRef = referrals.find((r) => r.id === id);
    setReferrals((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              latest_status: inTransitStatus,
              history: [
                ...(r.history ?? []).map((h) => ({ ...h, is_active: false })),
                historyEntry,
              ],
            }
          : r,
      ),
    );
    // Cross-sync to the matching incoming referral on the receiving side
    if (outgoingRef?.patient_name) {
      const crossHistoryEntry: ReferralHistory = {
        ...historyEntry,
        id: `rh-${Date.now() + 1}`,
      };
      setIncomingReferrals((prev) =>
        prev.map((r) =>
          r.patient_name === outgoingRef.patient_name && r.latest_status?.description === 'Accepted'
            ? {
                ...r,
                latest_status: inTransitStatus,
                history: [
                  ...(r.history ?? []).map((h) => ({ ...h, is_active: false })),
                  crossHistoryEntry,
                ],
              }
            : r,
        ),
      );
    }
    // Persist to Supabase
    persistHistoryEntry(id, 'In Transit', 'Patient dispatched — In Transit');
  };

  const updateIncomingStatus = (id: string, statusId: string) => {
    const newStatus = statuses.find((s) => s.id === statusId);
    const now = new Date().toISOString();
    const historyEntry: ReferralHistory = {
      id: `rh-${Date.now()}`,
      created_at: now,
      referral: id,
      to_assignment: null,
      status: statusId,
      is_active: true,
      details: `Status updated to ${newStatus?.description ?? statusId}`,
      status_description: newStatus?.description ?? undefined,
    };
    setIncomingReferrals((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              latest_status: newStatus,
              history: [
                ...(r.history ?? []).map((h) => ({ ...h, is_active: false })),
                historyEntry,
              ],
            }
          : r,
      ),
    );
    // Persist to Supabase
    const inDesc = statuses.find((s) => s.id === statusId)?.description ?? statusId;
    persistHistoryEntry(id, inDesc, `Status updated to ${inDesc}`);
  };

  const updateReferralInfo = (id: string, updated: Partial<ReferralInfo>) => {
    setReferrals((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              referral_info: r.referral_info ? { ...r.referral_info, ...updated } : r.referral_info,
            }
          : r,
      ),
    );
    // Persist to Supabase — strip client-only / join fields before sending
    if (isRealUuid(id)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {
        diagnostics: _d,
        vaccinations: _v,
        id: _id,
        created_at: _ca,
        referral: _ref,
        ...dbFields
      } = updated as any;
      if (Object.keys(dbFields).length > 0) {
        supabaseM2
          .from('referral_info')
          .update(dbFields)
          .eq('referral', id)
          .then(({ error }) => {
            if (error) console.error('[updateReferralInfo] UPDATE failed:', error);
          });
      }
    }
  };

  const saveDischargeNotes = (id: string, notes: string) => {
    const dischargedStatus = statuses.find((s) => s.description === 'Discharged');
    const now = new Date().toISOString();
    const historyEntry: ReferralHistory = {
      id: `rh-${Date.now()}`,
      created_at: now,
      referral: id,
      to_assignment: null,
      status: dischargedStatus?.id ?? null,
      is_active: true,
      details: notes, // stored in referral_history.details — no separate DB column needed
      status_description: 'Discharged',
    };
    const applyDischarge = (r: ReferralType) =>
      r.id === id
        ? {
            ...r,
            latest_status: dischargedStatus,
            history: [
              ...(r.history ?? []).map((h) => ({ ...h, is_active: false })),
              historyEntry,
            ],
          }
        : r;

    setIncomingReferrals((prev) => prev.map(applyDischarge));
    // Cross-sync to the outgoing referral so the sender sees Discharged + notes too
    setReferrals((prev) => prev.map(applyDischarge));
    // Persist to Supabase
    persistHistoryEntry(id, 'Discharged', notes);
  };

  // ── Diagnostic CRUD ————————————————————————————————————————————————————
  const addDiagnostic = (
    referralId: string,
    diag: { diagnostics: string; date?: string | null; attachment?: string | null },
  ) => {
    const newDiag: ReferralInfoDiagnostic = {
      id: `diag-${Date.now()}`,
      created_at: new Date().toISOString(),
      referral_info: null,
      diagnostics: diag.diagnostics,
      date: diag.date ?? null,
      attachment: diag.attachment ?? null,
      status: true,
    };
    const riIdForDiag = incomingReferrals.find((r) => r.id === referralId)?.referral_info?.id;
    setIncomingReferrals((prev) =>
      prev.map((r) =>
        r.id === referralId && r.referral_info
          ? {
              ...r,
              referral_info: {
                ...r.referral_info,
                diagnostics: [...(r.referral_info.diagnostics ?? []), newDiag],
              },
            }
          : r,
      ),
    );
    if (isRealUuid(riIdForDiag)) {
      supabaseM2
        .from('referral_info_diagnostic')
        .insert({
          referral_info: riIdForDiag,
          diagnostics: diag.diagnostics,
          date: diag.date ?? null,
          attachment: diag.attachment ?? null,
          status: true,
        })
        .then(({ error }) => {
          if (error) console.error('[addDiagnostic] INSERT failed:', error);
        });
    }
  };

  const deleteDiagnostic = (diagId: string, referralId: string) => {
    setIncomingReferrals((prev) =>
      prev.map((r) =>
        r.id === referralId && r.referral_info
          ? {
              ...r,
              referral_info: {
                ...r.referral_info,
                diagnostics: (r.referral_info.diagnostics ?? []).filter((d) => d.id !== diagId),
              },
            }
          : r,
      ),
    );
    if (isRealUuid(diagId)) {
      supabaseM2
        .from('referral_info_diagnostic')
        .delete()
        .eq('id', diagId)
        .then(({ error }) => {
          if (error) console.error('[deleteDiagnostic] DELETE failed:', error);
        });
    }
  };

  const updateDiagnosticAttachment = (diagId: string, referralId: string, attachment: string) => {
    setIncomingReferrals((prev) =>
      prev.map((r) =>
        r.id === referralId && r.referral_info
          ? {
              ...r,
              referral_info: {
                ...r.referral_info,
                diagnostics: (r.referral_info.diagnostics ?? []).map((d) =>
                  d.id === diagId ? { ...d, attachment } : d,
                ),
              },
            }
          : r,
      ),
    );
    if (isRealUuid(diagId)) {
      supabaseM2
        .from('referral_info_diagnostic')
        .update({ attachment })
        .eq('id', diagId)
        .then(({ error }) => {
          if (error) console.error('[updateDiagnosticAttachment] UPDATE failed:', error);
        });
    }
  };

  // ── Vaccination CRUD ———————————————————————————————————————————————————
  const addVaccination = (
    referralId: string,
    vac: { description: string; date?: string | null },
  ) => {
    const newVac: ReferralInfoVaccination = {
      id: `vac-${Date.now()}`,
      created_at: new Date().toISOString(),
      referral_info: null,
      description: vac.description,
      date: vac.date ?? null,
      status: true,
    };
    const riIdForVac = incomingReferrals.find((r) => r.id === referralId)?.referral_info?.id;
    setIncomingReferrals((prev) =>
      prev.map((r) =>
        r.id === referralId && r.referral_info
          ? {
              ...r,
              referral_info: {
                ...r.referral_info,
                vaccinations: [...(r.referral_info.vaccinations ?? []), newVac],
              },
            }
          : r,
      ),
    );
    if (isRealUuid(riIdForVac)) {
      supabaseM2
        .from('referral_info_vaccination')
        .insert({
          referral_info: riIdForVac,
          description: vac.description,
          date: vac.date ?? null,
          status: true,
        })
        .then(({ error }) => {
          if (error) console.error('[addVaccination] INSERT failed:', error);
        });
    }
  };

  const deleteVaccination = (vacId: string, referralId: string) => {
    setIncomingReferrals((prev) =>
      prev.map((r) =>
        r.id === referralId && r.referral_info
          ? {
              ...r,
              referral_info: {
                ...r.referral_info,
                vaccinations: (r.referral_info.vaccinations ?? []).filter((v) => v.id !== vacId),
              },
            }
          : r,
      ),
    );
    if (isRealUuid(vacId)) {
      supabaseM2
        .from('referral_info_vaccination')
        .delete()
        .eq('id', vacId)
        .then(({ error }) => {
          if (error) console.error('[deleteVaccination] DELETE failed:', error);
        });
    }
  };

  const searchReferrals = (term: string) => setReferralSearch(term);

  // ── Outgoing Diagnostic CRUD ────────────────────────────────────────────────
  const addOutgoingDiagnostic = (
    referralId: string,
    diag: { diagnostics: string; date?: string | null; attachment?: string | null },
  ) => {
    const newDiag: ReferralInfoDiagnostic = {
      id: `diag-${Date.now()}`,
      created_at: new Date().toISOString(),
      referral_info: null,
      diagnostics: diag.diagnostics,
      date: diag.date ?? null,
      attachment: diag.attachment ?? null,
      status: true,
    };
    const riIdForOutDiag = referrals.find((r) => r.id === referralId)?.referral_info?.id;
    setReferrals((prev) =>
      prev.map((r) =>
        r.id === referralId && r.referral_info
          ? {
              ...r,
              referral_info: {
                ...r.referral_info,
                diagnostics: [...(r.referral_info.diagnostics ?? []), newDiag],
              },
            }
          : r,
      ),
    );
    if (isRealUuid(riIdForOutDiag)) {
      supabaseM2
        .from('referral_info_diagnostic')
        .insert({
          referral_info: riIdForOutDiag,
          diagnostics: diag.diagnostics,
          date: diag.date ?? null,
          attachment: diag.attachment ?? null,
          status: true,
        })
        .then(({ error }) => {
          if (error) console.error('[addOutgoingDiagnostic] INSERT failed:', error);
        });
    }
  };

  const deleteOutgoingDiagnostic = (diagId: string, referralId: string) => {
    setReferrals((prev) =>
      prev.map((r) =>
        r.id === referralId && r.referral_info
          ? {
              ...r,
              referral_info: {
                ...r.referral_info,
                diagnostics: (r.referral_info.diagnostics ?? []).filter((d) => d.id !== diagId),
              },
            }
          : r,
      ),
    );
    if (isRealUuid(diagId)) {
      supabaseM2
        .from('referral_info_diagnostic')
        .delete()
        .eq('id', diagId)
        .then(({ error }) => {
          if (error) console.error('[deleteOutgoingDiagnostic] DELETE failed:', error);
        });
    }
  };

  const updateOutgoingDiagnosticAttachment = (
    diagId: string,
    referralId: string,
    attachment: string,
  ) => {
    setReferrals((prev) =>
      prev.map((r) =>
        r.id === referralId && r.referral_info
          ? {
              ...r,
              referral_info: {
                ...r.referral_info,
                diagnostics: (r.referral_info.diagnostics ?? []).map((d) =>
                  d.id === diagId ? { ...d, attachment } : d,
                ),
              },
            }
          : r,
      ),
    );
    if (isRealUuid(diagId)) {
      supabaseM2
        .from('referral_info_diagnostic')
        .update({ attachment })
        .eq('id', diagId)
        .then(({ error }) => {
          if (error) console.error('[updateOutgoingDiagnosticAttachment] UPDATE failed:', error);
        });
    }
  };

  // ── Outgoing Vaccination CRUD ───────────────────────────────────────────────
  const addOutgoingVaccination = (
    referralId: string,
    vac: { description: string; date?: string | null },
  ) => {
    const newVac: ReferralInfoVaccination = {
      id: `vac-${Date.now()}`,
      created_at: new Date().toISOString(),
      referral_info: null,
      description: vac.description,
      date: vac.date ?? null,
      status: true,
    };
    const riIdForOutVac = referrals.find((r) => r.id === referralId)?.referral_info?.id;
    setReferrals((prev) =>
      prev.map((r) =>
        r.id === referralId && r.referral_info
          ? {
              ...r,
              referral_info: {
                ...r.referral_info,
                vaccinations: [...(r.referral_info.vaccinations ?? []), newVac],
              },
            }
          : r,
      ),
    );
    if (isRealUuid(riIdForOutVac)) {
      supabaseM2
        .from('referral_info_vaccination')
        .insert({
          referral_info: riIdForOutVac,
          description: vac.description,
          date: vac.date ?? null,
          status: true,
        })
        .then(({ error }) => {
          if (error) console.error('[addOutgoingVaccination] INSERT failed:', error);
        });
    }
  };

  const deleteOutgoingVaccination = (vacId: string, referralId: string) => {
    setReferrals((prev) =>
      prev.map((r) =>
        r.id === referralId && r.referral_info
          ? {
              ...r,
              referral_info: {
                ...r.referral_info,
                vaccinations: (r.referral_info.vaccinations ?? []).filter((v) => v.id !== vacId),
              },
            }
          : r,
      ),
    );
    if (isRealUuid(vacId)) {
      supabaseM2
        .from('referral_info_vaccination')
        .delete()
        .eq('id', vacId)
        .then(({ error }) => {
          if (error) console.error('[deleteOutgoingVaccination] DELETE failed:', error);
        });
    }
  };

  return (
    <ReferralContext.Provider
      value={{
        referrals,
        deactivatedReferrals,
        incomingReferrals,
        statuses,
        loading,
        error,
        referralSearch,
        setReferralSearch,
        filter,
        setFilter,
        searchReferrals,
        addReferral,
        updateReferralStatus,
        deactivateReferral,
        acceptIncomingReferral,
        declineIncomingReferral,
        updateIncomingStatus,
        markOutgoingInTransit,
        updateReferralInfo,
        saveDischargeNotes,
        addDiagnostic,
        deleteDiagnostic,
        updateDiagnosticAttachment,
        addVaccination,
        deleteVaccination,
        addOutgoingDiagnostic,
        deleteOutgoingDiagnostic,
        updateOutgoingDiagnosticAttachment,
        addOutgoingVaccination,
        deleteOutgoingVaccination,
      }}
    >
      {children}
    </ReferralContext.Provider>
  );
};
