import { useContext } from 'react';
import { Icon } from '@iconify/react';
import { ReferralContext, ReferralContextType } from '../../context/ReferralContext';
import { Badge } from 'src/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import ReferralSummaryCards from './ReferralSummaryCards';
import ReferralListing from './ReferralListing';
import IncomingReferralPage from './IncomingReferralPage';

const ReferralApp = () => {
  const { referrals, incomingReferrals }: ReferralContextType = useContext(ReferralContext);

  return (
    <div className="flex flex-col gap-6">
      {/* Unified overview cards */}
      <ReferralSummaryCards />

      {/* Primary navigation */}
      <Tabs defaultValue="sent" className="w-full">
        <TabsList className="h-10 p-1">
          <TabsTrigger value="sent" className="flex items-center gap-2 px-4">
            <Icon icon="solar:square-top-down-bold-duotone" height={16} />
            Sent Referrals
            <Badge variant="outline" className="ml-0.5 text-[10px] px-1.5 py-0 h-4 group-data-[state=active]:bg-white/20 group-data-[state=active]:border-white/40 group-data-[state=active]:text-white">
              {referrals.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="received" className="flex items-center gap-2 px-4">
            <Icon icon="solar:inbox-bold-duotone" height={16} />
            Received Referrals
            <Badge variant="outline" className="ml-0.5 text-[10px] px-1.5 py-0 h-4 group-data-[state=active]:bg-white/20 group-data-[state=active]:border-white/40 group-data-[state=active]:text-white">
              {incomingReferrals.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sent" className="mt-4">
          <ReferralListing />
        </TabsContent>

        <TabsContent value="received" className="mt-4">
          <IncomingReferralPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReferralApp;
