import { createContext, useState, useEffect } from 'react';
import { ReferralType, ReferralStatus, ReferralHistory } from '../types/referral';
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
  declineIncomingReferral: (id: string, declineReason: string) => void;
  updateIncomingStatus: (id: string, statusId: string) => void;
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
  };

  const declineIncomingReferral = (id: string, declineReason: string) => {
    const declinedStatus = StatusData.find((s) => s.description === 'Declined');
    const now = new Date().toISOString();
    const historyEntry: ReferralHistory = {
      id: `rh-${Date.now()}`,
      created_at: now,
      referral: id,
      to_assignment: null,
      status: declinedStatus?.id ?? 'st-0005',
      is_active: true,
      details: `Declined — ${declineReason}`,
      status_description: 'Declined',
    };
    setIncomingReferrals((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              rejection_reason: declineReason,
              latest_status: declinedStatus,
              history: [
                ...(r.history ?? []).map((h) => ({ ...h, is_active: false })),
                historyEntry,
              ],
            }
          : r,
      ),
    );
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

  const searchReferrals = (term: string) => setReferralSearch(term);

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
      }}
    >
      {children}
    </ReferralContext.Provider>
  );
};
