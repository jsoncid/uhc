import { Outlet } from 'react-router';
import { ReferralProvider } from '../context/ReferralContext';

/**
 * Shared layout that wraps all module-2 routes with a single ReferralProvider.
 * This keeps context state (referrals, incoming, history) alive across page
 * navigations within module-2, so an accept on the incoming page is instantly
 * visible on the outgoing listing without a re-fetch.
 */
const Module2Layout = () => (
  <ReferralProvider>
    <Outlet />
  </ReferralProvider>
);

export default Module2Layout;
