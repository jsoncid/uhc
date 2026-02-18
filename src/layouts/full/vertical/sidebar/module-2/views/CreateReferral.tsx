import CreateReferralForm from '../apps/referrals/CreateReferralForm';
import BreadcrumbComp from 'src/layouts/full/shared/breadcrumb/BreadcrumbComp';
import { ReferralProvider } from '../context/ReferralContext';

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
    title: 'Create Referral',
  },
];

const CreateReferral = () => {
  return (
    <>
      <BreadcrumbComp title="Create New Referral" items={BCrumb} />
      <ReferralProvider>
        <CreateReferralForm />
      </ReferralProvider>
    </>
  );
};

export default CreateReferral;
