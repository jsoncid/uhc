// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { lazy } from 'react';
import Loadable from '../layouts/full/shared/loadable/Loadable';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { ModuleRoute } from '../components/ModuleRoute';
import { PAGE_MODULES } from '../constants/moduleAccess';

// Shared layout — mounts one ReferralProvider for all module-2 routes so context
// state persists across page navigations (accept on Incoming instantly visible on
// Outgoing listing, etc.).
const Module2Layout = Loadable(
  lazy(() => import('../layouts/full/vertical/sidebar/module-2/views/Module2Layout')),
);

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
    // Pathless layout route — provides ONE shared ReferralProvider across all
    // module-2 pages while still rendering at the correct absolute paths.
    element: <Module2Layout />,
    children: [
      {
        path: '/module-2/referrals',
        element: (
          <ProtectedRoute>
            <ModuleRoute moduleName={PAGE_MODULES.MODULE_2_REFERRAL_MANAGEMENT}>
              <Referrals />
            </ModuleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/module-2/referrals/create',
        element: (
          <ProtectedRoute>
            <ModuleRoute moduleName={PAGE_MODULES.MODULE_2_REFERRAL_MANAGEMENT} action="insert">
              <CreateReferral />
            </ModuleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/module-2/referrals/create-obgyne',
        element: (
          <ProtectedRoute>
            <ModuleRoute moduleName={PAGE_MODULES.MODULE_2_REFERRAL_MANAGEMENT} action="insert">
              <CreateObGyneReferral />
            </ModuleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/module-2/referrals/detail/:id',
        element: (
          <ProtectedRoute>
            <ModuleRoute moduleName={PAGE_MODULES.MODULE_2_REFERRAL_MANAGEMENT}>
              <ReferralDetails />
            </ModuleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/module-2/referral-history',
        element: (
          <ProtectedRoute>
            <ModuleRoute moduleName={PAGE_MODULES.MODULE_2_REFERRAL_HISTORY}>
              <ReferralHistory />
            </ModuleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/module-2/referrals/incoming',
        element: (
          <ProtectedRoute>
            <ModuleRoute moduleName={PAGE_MODULES.MODULE_2_INCOMING_REFERRALS}>
              <IncomingReferrals />
            </ModuleRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: '/module-2/referrals/incoming/detail/:id',
        element: (
          <ProtectedRoute>
            <ModuleRoute moduleName={PAGE_MODULES.MODULE_2_INCOMING_REFERRALS}>
              <IncomingReferralDetails />
            </ModuleRoute>
          </ProtectedRoute>
        ),
      },
    ],
  },
];
