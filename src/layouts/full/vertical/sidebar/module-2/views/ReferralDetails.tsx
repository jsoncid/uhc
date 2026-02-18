import ReferralDetail from '../apps/referrals/ReferralDetail';
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
    to: '/module-2/referrals',
    title: 'Referrals',
  },
  {
    title: 'Referral Details',
  },
];

const ReferralDetails = () => {
  return (
    <>
      <BreadcrumbComp title="Referral Details" items={BCrumb} />
      <ReferralDetail />
    </>
  );
};

export default ReferralDetails;
