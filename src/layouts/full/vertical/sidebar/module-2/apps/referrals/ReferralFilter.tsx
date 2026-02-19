import { useContext } from 'react';
import { Icon } from '@iconify/react';
import { ReferralContext, ReferralContextType } from '../../context/ReferralContext';
import CardBox from 'src/components/shared/CardBox';

const ReferralFilter = () => {
  const { referrals, filter, setFilter }: ReferralContextType = useContext(ReferralContext);

  const total = referrals.length;
  const count = (desc: string) =>
    referrals.filter((r) => r.latest_status?.description === desc).length;

  const pct = (n: number) => (total === 0 ? 0 : Math.round((n / total) * 100));

  const cards = [
    {
      key: 'all',
      label: 'Total Referrals',
      value: total,
      pct: 100,
      icon: 'solar:clipboard-list-bold-duotone',
      color: 'primary',
      text: 'text-primary',
      iconBg: 'bg-lightprimary',
      bar: 'bg-primary',
      accent: 'border-t-primary',
      activeBg: 'bg-lightprimary',
    },
    {
      key: 'Pending',
      label: 'Pending',
      value: count('Pending'),
      pct: pct(count('Pending')),
      icon: 'solar:clock-circle-bold-duotone',
      color: 'warning',
      text: 'text-warning',
      iconBg: 'bg-lightwarning',
      bar: 'bg-warning',
      accent: 'border-t-warning',
      activeBg: 'bg-lightwarning',
    },
    {
      key: 'Accepted',
      label: 'Accepted',
      value: count('Accepted'),
      pct: pct(count('Accepted')),
      icon: 'solar:check-circle-bold-duotone',
      color: 'success',
      text: 'text-success',
      iconBg: 'bg-lightsuccess',
      bar: 'bg-success',
      accent: 'border-t-success',
      activeBg: 'bg-lightsuccess',
    },
    {
      key: 'In Transit',
      label: 'In Transit',
      value: count('In Transit'),
      pct: pct(count('In Transit')),
      icon: 'solar:routing-bold-duotone',
      color: 'info',
      text: 'text-info',
      iconBg: 'bg-lightinfo',
      bar: 'bg-info',
      accent: 'border-t-info',
      activeBg: 'bg-lightinfo',
    },
    {
      key: 'Discharged',
      label: 'Discharged',
      value: count('Discharged'),
      pct: pct(count('Discharged')),
      icon: 'solar:exit-bold-duotone',
      color: 'secondary',
      text: 'text-secondary',
      iconBg: 'bg-lightsecondary',
      bar: 'bg-secondary',
      accent: 'border-t-secondary',
      activeBg: 'bg-lightsecondary',
    },
    {
      key: 'Rejected',
      label: 'Rejected',
      value: count('Rejected'),
      pct: pct(count('Rejected')),
      icon: 'solar:close-circle-bold-duotone',
      color: 'error',
      text: 'text-error',
      iconBg: 'bg-lighterror',
      bar: 'bg-error',
      accent: 'border-t-error',
      activeBg: 'bg-lighterror',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => {
        const isActive = filter === card.key;
        return (
          <div key={card.key} onClick={() => setFilter(card.key)} className="cursor-pointer group">
            <CardBox
              className={`
                p-0 overflow-hidden transition-all duration-200 border-t-4 ${card.accent}
                ${isActive ? 'shadow-md ring-1 ring-border' : 'hover:shadow-md'}
              `}
            >
              <div
                className={`p-5 ${isActive ? card.activeBg : ''} transition-colors duration-200`}
              >
                {/* Top row: icon + active badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`${card.iconBg} rounded-xl p-3`}>
                    <Icon icon={card.icon} height={26} className={card.text} />
                  </div>
                  {isActive ? (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${card.iconBg} ${card.text}`}
                    >
                      Active
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground font-medium opacity-0 group-hover:opacity-60 transition-opacity">
                      {card.pct}%
                    </span>
                  )}
                </div>

                {/* Count */}
                <div className={`text-4xl font-extrabold leading-none mb-1 ${card.text}`}>
                  {card.value}
                </div>

                {/* Label */}
                <p className="text-sm font-medium text-muted-foreground mb-3">{card.label}</p>

                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${card.bar} transition-all duration-500`}
                    style={{ width: `${card.key === 'all' ? 100 : card.pct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {card.key === 'all' ? 'All active referrals' : `${card.pct}% of total`}
                </p>
              </div>
            </CardBox>
          </div>
        );
      })}
    </div>
  );
};

export default ReferralFilter;
