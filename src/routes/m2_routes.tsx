// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { lazy } from 'react';
import Loadable from '../layouts/full/shared/loadable/Loadable';
import { ProtectedRoute } from '../components/ProtectedRoute';

// Referral Pages (Module 2) Components
const Referrals = Loadable(
  lazy(() => import('../layouts/full/vertical/sidebar/module-2/views/Referrals')),
);
const CreateReferral = Loadable(
  lazy(() => import('../layouts/full/vertical/sidebar/module-2/views/CreateReferral')),
);
const CreateObGyneReferral = Loadable(
  lazy(() => import('../layouts/full/vertical/sidebar/module-2/views/CreateObGyneReferral')),
);
const ReferralDetails = Loadable(
  lazy(() => import('../layouts/full/vertical/sidebar/module-2/views/ReferralDetails')),
);
const ReferralHistory = Loadable(
  lazy(() => import('../layouts/full/vertical/sidebar/module-2/views/ReferralHistory')),
);
const IncomingReferrals = Loadable(
  lazy(() => import('../layouts/full/vertical/sidebar/module-2/views/IncomingReferrals')),
);
const IncomingReferralDetails = Loadable(
  lazy(() => import('../layouts/full/vertical/sidebar/module-2/views/IncomingReferralDetails')),
);

export const module2Routes = [
  {
    path: '/module-2/referrals',
    element: (
      <ProtectedRoute>
        <Referrals />
      </ProtectedRoute>
    ),
  },
  {
    path: '/module-2/referrals/create',
    element: (
      <ProtectedRoute>
        <CreateReferral />
      </ProtectedRoute>
    ),
  },
  {
    path: '/module-2/referrals/create-obgyne',
    element: (
      <ProtectedRoute>
        <CreateObGyneReferral />
      </ProtectedRoute>
    ),
  },
  {
    path: '/module-2/referrals/detail/:id',
    element: (
      <ProtectedRoute>
        <ReferralDetails />
      </ProtectedRoute>
    ),
  },
  {
    path: '/module-2/referral-history',
    element: (
      <ProtectedRoute>
        <ReferralHistory />
      </ProtectedRoute>
    ),
  },
  {
    path: '/module-2/referrals/incoming',
    element: (
      <ProtectedRoute>
        <IncomingReferrals />
      </ProtectedRoute>
    ),
  },
  {
    path: '/module-2/referrals/incoming/detail/:id',
    element: (
      <ProtectedRoute>
        <IncomingReferralDetails />
      </ProtectedRoute>
    ),
  },
];
