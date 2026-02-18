import CreateObGyneReferralForm from '../apps/referrals/CreateObGyneReferralForm';
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
    title: 'Create OB/GYNE Referral',
  },
];

const CreateObGyneReferral = () => {
  return (
    <>
      <BreadcrumbComp title="Create OB/GYNE Referral" items={BCrumb} />
      <ReferralProvider>
        <CreateObGyneReferralForm />
      </ReferralProvider>
    </>
  );
};

export default CreateObGyneReferral;
