import { ReferralProvider } from '../../context/ReferralContext';
import ReferralFilter from './ReferralFilter';
import ReferralListing from './ReferralListing';

const ReferralApp = () => {
  return (
    <ReferralProvider>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12">
          <ReferralFilter />
        </div>
        <div className="col-span-12">
          <ReferralListing />
        </div>
      </div>
    </ReferralProvider>
  );
};

export default ReferralApp;
