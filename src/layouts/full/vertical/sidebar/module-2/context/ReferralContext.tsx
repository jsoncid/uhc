import { createContext, useState, useEffect } from 'react';
import { ReferralType, ReferralStatus, ReferralHistory } from '../types/referral';
import {
  ReferralData,
  StatusData,
  ReferralInfoData,
  ReferralHistoryData,
} from '../data/referral-data';

export interface ReferralContextType {
  referrals: ReferralType[];
  deactivatedReferrals: ReferralType[];
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
}

export const ReferralContext = createContext<ReferralContextType>({} as ReferralContextType);

export const ReferralProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [referrals, setReferrals] = useState<ReferralType[]>([]);
  const [deactivatedReferrals, setDeactivatedReferrals] = useState<ReferralType[]>([]);
  const [statuses] = useState<ReferralStatus[]>(StatusData);
  const [referralSearch, setReferralSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | Error | null>(null);

  useEffect(() => {
    try {
      // Hydrate referrals with joined data from their related tables
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

      // Hydrate deactivated referrals (status === false)
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

  const searchReferrals = (term: string) => setReferralSearch(term);

  return (
    <ReferralContext.Provider
      value={{
        referrals,
        deactivatedReferrals,
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
      }}
    >
      {children}
    </ReferralContext.Provider>
  );
};
