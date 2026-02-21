import { lazy, Suspense } from 'react';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { ModuleRoute } from '../components/ModuleRoute';
import { PAGE_MODULES } from '../constants/moduleAccess';

const UhcMember = lazy(() => import('../layouts/full/vertical/sidebar/module-4/m-4/UhcMember'));
const UhcOperator = lazy(() => import('../layouts/full/vertical/sidebar/module-4/m-4/UhcOperator'));

export const m4Routes = [
  {
    path: '/module-4/member',
    element: (
      <ProtectedRoute>
        <ModuleRoute moduleName={PAGE_MODULES.MODULE_4_HEALTH_CARD_HOLDER}>
          <Suspense fallback={<div>Loading...</div>}>
            <UhcMember />
          </Suspense>
        </ModuleRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: '/module-4/operator',
    element: (
      <ProtectedRoute>
        <ModuleRoute moduleName={PAGE_MODULES.MODULE_4_HEALTH_CARD_OPERATOR}>
          <Suspense fallback={<div>Loading...</div>}>
            <UhcOperator />
          </Suspense>
        </ModuleRoute>
      </ProtectedRoute>
    ),
  },
];
