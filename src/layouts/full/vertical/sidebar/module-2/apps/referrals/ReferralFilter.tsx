import { useContext } from 'react';
import { Icon } from '@iconify/react';
import { ReferralContext, ReferralContextType } from '../../context/ReferralContext';

const ReferralFilter = () => {
  const { referrals, filter, setFilter }: ReferralContextType = useContext(ReferralContext);

  const count = (desc: string) =>
    referrals.filter((r) => r.latest_status?.description === desc).length;

  const cards = [
    { key: 'all', label: 'Total Referrals', value: referrals.length, icon: 'solar:clipboard-list-bold-duotone', text: 'text-primary', iconBg: 'bg-primary/10', bg: '' },
    { key: 'Pending', label: 'Pending', value: count('Pending'), icon: 'solar:clock-circle-bold-duotone', text: 'text-warning', iconBg: 'bg-warning/10', bg: '' },
    { key: 'Accepted', label: 'Accepted', value: count('Accepted'), icon: 'solar:check-circle-bold-duotone', text: 'text-success', iconBg: 'bg-success/10', bg: '' },
    { key: 'In Transit', label: 'In Transit', value: count('In Transit'), icon: 'solar:routing-bold-duotone', text: 'text-info', iconBg: 'bg-info/10', bg: '' },
    { key: 'Completed', label: 'Completed', value: count('Completed'), icon: 'solar:medal-ribbons-star-bold-duotone', text: 'text-secondary', iconBg: 'bg-secondary/10', bg: 'bg-lightsecondary' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <div key={card.key}>
          <div
            className={`${card.bg} rounded-lg p-5 cursor-pointer transition-all border border-ld hover:shadow-md h-full`}
            onClick={() => setFilter(card.key)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`${card.iconBg} rounded-full p-2.5`}>
                <Icon icon={card.icon} height={24} className={card.text} />
              </div>
              {filter === card.key && (
                <Icon icon="solar:check-read-linear" height={16} className={`${card.text} opacity-70`} />
              )}
            </div>
            <h3 className={`${card.text} text-3xl font-bold leading-none mb-1.5`}>{card.value}</h3>
            <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReferralFilter;
