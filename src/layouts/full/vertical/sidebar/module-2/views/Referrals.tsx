import ReferralsApp from '../apps/referrals';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';

const BCrumb = [
  {
    to: '/',
    title: 'Home',
  },
  {
    to: '/module-2',
    title: 'Module 2',
  },
  {
    title: 'Referrals',
  },
];

const Referrals = () => {
  return (
    <>
      <BreadcrumbComp title="Referral Management System" items={BCrumb} />
      <ReferralsApp />
    </>
  );
};

export default Referrals;
