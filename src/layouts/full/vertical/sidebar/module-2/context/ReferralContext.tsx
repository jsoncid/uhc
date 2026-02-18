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
  deactivateReferral: (id: string) => void;
}

export const ReferralContext = createContext<ReferralContextType>({} as ReferralContextType);

export const ReferralProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [referrals, setReferrals] = useState<ReferralType[]>([]);
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
    } catch (err) {
      setError(err instanceof Error ? err : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const addReferral = (newReferral: ReferralType) => {
    // Attach empty related records
    const withJoins: ReferralType = {
      ...newReferral,
      history: [],
      latest_status: StatusData.find((s) => s.id === 'st-0001'),
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

  const deactivateReferral = (id: string) => {
    const idx = ReferralData.findIndex((r) => r.id === id);
    if (idx !== -1) ReferralData[idx].status = false;
    setReferrals((prev) => prev.filter((r) => r.id !== id));
  };

  const searchReferrals = (term: string) => setReferralSearch(term);

  return (
    <ReferralContext.Provider
      value={{
        referrals,
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
