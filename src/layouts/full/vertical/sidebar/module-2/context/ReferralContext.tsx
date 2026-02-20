import { createContext, useState, useEffect } from 'react';
import {
  ReferralType,
  ReferralStatus,
  ReferralHistory,
  ReferralInfo,
  ReferralInfoDiagnostic,
  ReferralInfoVaccination,
} from '../types/referral';
import {
  ReferralData,
  StatusData,
  ReferralInfoData,
  ReferralHistoryData,
  IncomingReferralData,
} from '../data/referral-data';

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
  addReferral: (referral: ReferralType) => void;
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
  const [referrals, setReferrals] = useState<ReferralType[]>([]);
  const [deactivatedReferrals, setDeactivatedReferrals] = useState<ReferralType[]>([]);
  const [incomingReferrals, setIncomingReferrals] = useState<ReferralType[]>([]);
  const [statuses] = useState<ReferralStatus[]>(StatusData);
  const [referralSearch, setReferralSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | Error | null>(null);

  useEffect(() => {
    try {
      // Hydrate outgoing referrals
      const hydrated = ReferralData.filter((r) => r.status !== false).map((r) => ({
        ...r,
        referral_info: ReferralInfoData.find((ri) => ri.referral === r.id),
        history: ReferralHistoryData.filter((h) => h.referral === r.id),
        latest_status: StatusData.find(
          (s) =>
            s.id ===
            ReferralHistoryData.filter((h) => h.referral === r.id && h.is_active).slice(-1)[0]
              ?.status,
        ),
      }));
      setReferrals(hydrated);

      // Hydrate deactivated referrals
      const deactivated = ReferralData.filter((r) => r.status === false).map((r) => ({
        ...r,
        referral_info: ReferralInfoData.find((ri) => ri.referral === r.id),
        history: ReferralHistoryData.filter((h) => h.referral === r.id),
        latest_status: StatusData.find(
          (s) =>
            s.id === ReferralHistoryData.filter((h) => h.referral === r.id).slice(-1)[0]?.status,
        ),
      }));
      setDeactivatedReferrals(deactivated);

      // Hydrate incoming referrals (already have history/referral_info embedded)
      setIncomingReferrals([...IncomingReferralData]);
    } catch (err) {
      setError(err instanceof Error ? err : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const addReferral = (newReferral: ReferralType) => {
    const pendingStatus = StatusData.find((s) => s.description === 'Pending');
    const now = new Date().toISOString();

    const pendingHistory: ReferralHistory = {
      id: `rh-${Date.now()}`,
      created_at: now,
      referral: newReferral.id,
      to_assignment: null,
      status: pendingStatus?.id ?? 'st-0001',
      is_active: true,
      details: 'Referral created — status set to Pending.',
      status_description: 'Pending',
    };
    ReferralHistoryData.push(pendingHistory);

    const withJoins: ReferralType = {
      ...newReferral,
      history: [pendingHistory],
      latest_status: pendingStatus,
    };
    ReferralData.push(withJoins);
    setReferrals((prev) => [...prev, withJoins]);
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
      details: `Status updated to ${StatusData.find((s) => s.id === statusId)?.description ?? statusId}`,
      status_description: StatusData.find((s) => s.id === statusId)?.description ?? undefined,
    };
    // Mark previous history as inactive
    ReferralHistoryData.forEach((h) => {
      if (h.referral === id) h.is_active = false;
    });
    ReferralHistoryData.push(newHistoryEntry);

    setReferrals((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              latest_status: StatusData.find((s) => s.id === statusId),
              history: ReferralHistoryData.filter((h) => h.referral === id),
            }
          : r,
      ),
    );
  };

  const deactivateReferral = (id: string, deactivatedBy = 'Current User') => {
    const now = new Date().toISOString();
    const idx = ReferralData.findIndex((r) => r.id === id);
    if (idx !== -1) {
      ReferralData[idx].status = false;
      ReferralData[idx].deactivated_at = now;
      ReferralData[idx].deactivated_by = deactivatedBy;
    }
    const deactivated = referrals.find((r) => r.id === id);
    if (deactivated) {
      const deactivatedRecord: ReferralType = {
        ...deactivated,
        status: false,
        deactivated_at: now,
        deactivated_by: deactivatedBy,
      };
      setDeactivatedReferrals((prev) => [deactivatedRecord, ...prev]);
    }
    setReferrals((prev) => prev.filter((r) => r.id !== id));
  };

  // ── Incoming referral actions ───────────────────────────────────────────────
  const acceptIncomingReferral = (id: string, acceptedBy: string) => {
    const acceptedStatus = StatusData.find((s) => s.description === 'Accepted');
    const now = new Date().toISOString();
    const historyEntry: ReferralHistory = {
      id: `rh-${Date.now()}`,
      created_at: now,
      referral: id,
      to_assignment: null,
      status: acceptedStatus?.id ?? 'st-0002',
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
  };

  const declineIncomingReferral = (
    id: string,
    declineReason: string,
    redirectHospital?: string,
  ) => {
    const declinedStatus = StatusData.find((s) => s.description === 'Declined');
    const now = new Date().toISOString();
    const detailText = `Declined — ${declineReason}${redirectHospital ? ` Suggested redirect: ${redirectHospital}.` : ''}`;
    const historyEntry: ReferralHistory = {
      id: `rh-${Date.now()}`,
      created_at: now,
      referral: id,
      to_assignment: null,
      status: declinedStatus?.id ?? 'st-0005',
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
        status: declinedStatus?.id ?? 'st-0005',
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
  };

  // Sending facility marks their referral as In Transit, cross-syncs to incoming side
  const markOutgoingInTransit = (id: string) => {
    const inTransitStatus = StatusData.find((s) => s.description === 'In Transit');
    const now = new Date().toISOString();
    const historyEntry: ReferralHistory = {
      id: `rh-${Date.now()}`,
      created_at: now,
      referral: id,
      to_assignment: null,
      status: inTransitStatus?.id ?? 'st-0003',
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
  };

  const updateIncomingStatus = (id: string, statusId: string) => {
    const newStatus = StatusData.find((s) => s.id === statusId);
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
    const idx = ReferralInfoData.findIndex((ri) => ri.referral === id);
    if (idx !== -1) Object.assign(ReferralInfoData[idx], updated);
  };

  const saveDischargeNotes = (id: string, notes: string) => {
    const dischargedStatus = StatusData.find((s) => s.description === 'Discharged');
    const now = new Date().toISOString();
    const historyEntry: ReferralHistory = {
      id: `rh-${Date.now()}`,
      created_at: now,
      referral: id,
      to_assignment: null,
      status: dischargedStatus?.id ?? 'st-0004',
      is_active: true,
      details: notes, // stored in referral_history.details — no separate DB column needed
      status_description: 'Discharged',
    };
    setIncomingReferrals((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              latest_status: dischargedStatus,
              history: [
                ...(r.history ?? []).map((h) => ({ ...h, is_active: false })),
                historyEntry,
              ],
            }
          : r,
      ),
    );
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
