'use client';

import { useContext } from 'react';
import { Icon } from '@iconify/react';
import { ReferralContext, ReferralContextType } from '../../context/ReferralContext';
import CardBox from 'src/components/shared/CardBox';

const ReferralSummaryCards = () => {
  const { referrals, incomingReferrals } = useContext<ReferralContextType>(ReferralContext);

  const outCount = (desc: string) =>
    referrals.filter((r) => r.latest_status?.description === desc).length;
  const inCount = (desc: string) =>
    incomingReferrals.filter((r) => r.latest_status?.description === desc).length;

  const totalOut = referrals.length;
  const totalIn = incomingReferrals.length;

  // Outgoing cards —————————————————
  const outPending = outCount('Pending');
  const outDeclined = outCount('Declined');
  const outDischarged = outCount('Discharged');

  // Incoming cards —————————————————
  const inAwaitingReview = inCount('Pending');
  const inActive = inCount('Accepted') + inCount('In Transit') + inCount('Arrived');
  const inDischarged = inCount('Discharged');

  const totalPending = outPending + inAwaitingReview;
  const totalActive = inActive;
  const totalDischarged = outDischarged + inDischarged;
  const totalDeclined = outDeclined + inCount('Declined');

  const cards = [
    {
      label: 'Outgoing Referrals',
      sub: 'Sent by this facility',
      value: totalOut,
      pct: totalOut + totalIn === 0 ? 0 : Math.round((totalOut / (totalOut + totalIn)) * 100),
      icon: 'solar:square-top-down-bold-duotone',
      text: 'text-primary',
      iconBg: 'bg-lightprimary',
      bar: 'bg-primary',
      accent: 'border-t-primary',
    },
    {
      label: 'Incoming Referrals',
      sub: 'Received from others',
      value: totalIn,
      pct: totalOut + totalIn === 0 ? 0 : Math.round((totalIn / (totalOut + totalIn)) * 100),
      icon: 'solar:inbox-bold-duotone',
      text: 'text-secondary',
      iconBg: 'bg-lightsecondary',
      bar: 'bg-secondary',
      accent: 'border-t-secondary',
    },
    {
      label: 'Pending Response',
      sub: 'Awaiting action (both sides)',
      value: totalPending,
      pct: totalOut + totalIn === 0 ? 0 : Math.round((totalPending / (totalOut + totalIn)) * 100),
      icon: 'solar:clock-circle-bold-duotone',
      text: 'text-warning',
      iconBg: 'bg-lightwarning',
      bar: 'bg-warning',
      accent: 'border-t-warning',
    },
    {
      label: 'Active Patients',
      sub: 'Accepted · In Transit · Arrived',
      value: totalActive,
      pct: totalIn === 0 ? 0 : Math.round((totalActive / totalIn) * 100),
      icon: 'solar:hospital-bold-duotone',
      text: 'text-success',
      iconBg: 'bg-lightsuccess',
      bar: 'bg-success',
      accent: 'border-t-success',
    },
    {
      label: 'Discharged',
      sub: 'Patient journey complete',
      value: totalDischarged,
      pct:
        totalOut + totalIn === 0 ? 0 : Math.round((totalDischarged / (totalOut + totalIn)) * 100),
      icon: 'solar:exit-bold-duotone',
      text: 'text-info',
      iconBg: 'bg-lightinfo',
      bar: 'bg-info',
      accent: 'border-t-info',
    },
    {
      label: 'Declined',
      sub: 'Rejected referrals',
      value: totalDeclined,
      pct: totalOut + totalIn === 0 ? 0 : Math.round((totalDeclined / (totalOut + totalIn)) * 100),
      icon: 'solar:close-circle-bold-duotone',
      text: 'text-error',
      iconBg: 'bg-lighterror',
      bar: 'bg-error',
      accent: 'border-t-error',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {cards.map((card) => (
        <CardBox key={card.label} className={`p-0 overflow-hidden border-t-4 ${card.accent}`}>
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className={`${card.iconBg} rounded-xl p-2.5`}>
                <Icon icon={card.icon} height={22} className={card.text} />
              </div>
              <span
                className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${card.iconBg} ${card.text}`}
              >
                {card.pct}%
              </span>
            </div>
            <div className={`text-3xl font-extrabold leading-none mb-1 ${card.text}`}>
              {card.value}
            </div>
            <p className="text-sm font-semibold text-foreground leading-tight">{card.label}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{card.sub}</p>
            <div className="h-1 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden mt-3">
              <div
                className={`h-full rounded-full ${card.bar} transition-all duration-500`}
                style={{ width: `${card.pct}%` }}
              />
            </div>
          </div>
        </CardBox>
      ))}
    </div>
  );
};

export default ReferralSummaryCards;
