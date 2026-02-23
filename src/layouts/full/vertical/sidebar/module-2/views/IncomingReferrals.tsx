import { Link } from 'react-router';
import IncomingReferralPage from '../apps/referrals/IncomingReferralPage';

const BCrumb = [{ to: '/', title: 'Home' }, { title: 'Incoming Referrals' }];

const IncomingReferrals = () => {
  return (
    <>
      <div className="mb-6 py-4">
        <h4 className="font-semibold text-xl mb-3">Incoming Referrals</h4>
        <ol className="flex items-center whitespace-nowrap" aria-label="Breadcrumb">
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
      <IncomingReferralPage />
    </>
  );
};

export default IncomingReferrals;
