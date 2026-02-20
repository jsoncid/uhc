// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { lazy } from 'react';
import Loadable from '../layouts/full/shared/loadable/Loadable';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { ModuleRoute } from '../components/ModuleRoute';

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

const MODULE_NAME = 'Module 2 - REFERRAL';

export const module2Routes = [
  {
    path: '/module-2/referrals',
    element: (
      <ProtectedRoute>
        <ModuleRoute moduleName={MODULE_NAME}>
          <Referrals />
        </ModuleRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: '/module-2/referrals/create',
    element: (
      <ProtectedRoute>
        <ModuleRoute moduleName={MODULE_NAME} action="insert">
          <CreateReferral />
        </ModuleRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: '/module-2/referrals/create-obgyne',
    element: (
      <ProtectedRoute>
        <ModuleRoute moduleName={MODULE_NAME} action="insert">
          <CreateObGyneReferral />
        </ModuleRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: '/module-2/referrals/detail/:id',
    element: (
      <ProtectedRoute>
        <ModuleRoute moduleName={MODULE_NAME}>
          <ReferralDetails />
        </ModuleRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: '/module-2/referral-history',
    element: (
      <ProtectedRoute>
        <ModuleRoute moduleName={MODULE_NAME}>
          <ReferralHistory />
        </ModuleRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: '/module-2/referrals/incoming',
    element: (
      <ProtectedRoute>
        <ModuleRoute moduleName={MODULE_NAME}>
          <IncomingReferrals />
        </ModuleRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: '/module-2/referrals/incoming/detail/:id',
    element: (
      <ProtectedRoute>
        <ModuleRoute moduleName={MODULE_NAME}>
          <IncomingReferralDetails />
        </ModuleRoute>
      </ProtectedRoute>
    ),
  },
];
