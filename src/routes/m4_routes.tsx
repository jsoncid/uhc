// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { lazy } from 'react';
import Loadable from '../layouts/full/shared/loadable/Loadable';
import { ProtectedRoute } from '../components/ProtectedRoute';

// Module 4 Components
const Module4Member = Loadable(
  lazy(() => import('../layouts/full/vertical/sidebar/module-4/m-4/UhcMember')),
);
const Module4Operator = Loadable(
  lazy(() => import('../layouts/full/vertical/sidebar/module-4/m-4/UhcOperator')),
);

export const module4Routes = [
  {
    path: '/module-4/member',
    element: (
      <ProtectedRoute>
        <ModuleGuard
           requiredRoleIds={[ROLE_IDS.module4Member]}
            requiredModuleId={MODULE_IDS.module4}
        >
          <Suspense fallback={<div>Loading...</div>}>
            <UhcMember />
          </Suspense>
        </ModuleGuard>
      </ProtectedRoute>
    ),
  },
  {
    path: '/module-4/operator',
    element: (
      <ProtectedRoute>
        <Module4Operator />
      </ProtectedRoute>
    ),
  },
];
