import { useContext } from 'react';
import { Icon } from '@iconify/react';
import { ReferralContext, ReferralContextType } from '../../context/ReferralContext';

const ReferralFilter = () => {
  const { referrals, filter, setFilter }: ReferralContextType = useContext(ReferralContext);

  const count = (desc: string) =>
    referrals.filter((r) => r.latest_status?.description === desc).length;

  const cards = [
    { key: 'all', label: 'Total Referrals', value: referrals.length, icon: 'solar:clipboard-list-bold-duotone', bg: 'bg-lightprimary dark:bg-lightprimary', text: 'text-primary', iconBg: 'bg-primary/10' },
    { key: 'Pending', label: 'Pending', value: count('Pending'), icon: 'solar:clock-circle-bold-duotone', bg: 'bg-lightwarning dark:bg-lightwarning', text: 'text-warning', iconBg: 'bg-warning/10' },
    { key: 'Accepted', label: 'Accepted', value: count('Accepted'), icon: 'solar:check-circle-bold-duotone', bg: 'bg-lightsuccess dark:bg-lightsuccess', text: 'text-success', iconBg: 'bg-success/10' },
    { key: 'In Transit', label: 'In Transit', value: count('In Transit'), icon: 'solar:routing-bold-duotone', bg: 'bg-lightinfo dark:bg-lightinfo', text: 'text-info', iconBg: 'bg-info/10' },
    { key: 'Completed', label: 'Completed', value: count('Completed'), icon: 'solar:medal-ribbons-star-bold-duotone', bg: 'bg-lightsecondary dark:bg-lightsecondary', text: 'text-secondary', iconBg: 'bg-secondary/10' },
    { key: 'Rejected', label: 'Rejected', value: count('Rejected'), icon: 'solar:close-circle-bold-duotone', bg: 'bg-lighterror dark:bg-lighterror', text: 'text-error', iconBg: 'bg-error/10' },
  ];

  return (
    <div className="grid grid-cols-12 gap-6">
      {cards.map((card) => (
        <div key={card.key} className="lg:col-span-2 md:col-span-4 col-span-6">
          <div
            className={`${card.bg} rounded-lg p-5 cursor-pointer transition-all hover:shadow-md ${filter === card.key ? 'ring-2 ring-offset-2 ring-current ' + card.text : ''}`}
            onClick={() => setFilter(card.key)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`${card.iconBg} rounded-full p-2.5`}>
                <Icon icon={card.icon} height={22} className={card.text} />
              </div>
              {filter === card.key && (
                <Icon icon="solar:check-read-linear" height={16} className={`${card.text} opacity-70`} />
              )}
            </div>
            <h3 className={`${card.text} text-3xl font-bold leading-none mb-1.5`}>{card.value}</h3>
            <p className={`${card.text} text-sm font-medium opacity-80`}>{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReferralFilter;
