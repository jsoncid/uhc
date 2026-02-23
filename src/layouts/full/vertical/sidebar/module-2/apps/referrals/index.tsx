import ReferralFilter from './ReferralFilter';
import ReferralListing from './ReferralListing';

const ReferralApp = () => {
  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12">
        <ReferralFilter />
      </div>
      <div className="col-span-12">
        <ReferralListing />
      </div>
    </div>
  );
};

export default ReferralApp;
