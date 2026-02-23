import { Link } from 'react-router';
import ReferralDetail from '../apps/referrals/ReferralDetail';
import { ReferralProvider } from '../context/ReferralContext';

const BCrumb = [
  { to: '/', title: 'Home' },
  { to: '/module-2/referrals', title: 'Referrals' },
  { title: 'Referral Details' },
];

const ReferralDetails = () => {
  return (
    <ReferralProvider>
      {/* Header without background */}
      <div className="mb-6 py-4">
        <h4 className="font-semibold text-xl mb-3">Referral Details</h4>
        <ol className="flex items-center whitespace-nowrap flex-wrap" aria-label="Breadcrumb">
          {BCrumb.map((item, index) => {
            const isLast = index === BCrumb.length - 1;
            return (
              <li key={index} className="flex items-center">
                {item.to && !isLast ? (
                  <Link
                    to={item.to}
                    className="opacity-80 text-sm text-muted-foreground leading-none hover:underline"
                  >
                    {item.title}
                  </Link>
                ) : (
                  <span
                    className="text-sm text-muted-foreground leading-none"
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.title}
                  </span>
                )}
                {!isLast && <span className="mx-2.5 p-0.5 rounded-full bg-muted-foreground" />}
              </li>
            );
          })}
        </ol>
      </div>
      <ReferralDetail />
    </ReferralProvider>
  );
};

export default ReferralDetails;
