import { lazy, Suspense } from 'react';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { ModuleRoute } from '../components/ModuleRoute';

const UhcMember = lazy(() => import('../layouts/full/vertical/sidebar/module-4/m-4/UhcMember'));
const UhcOperator = lazy(() => import('../layouts/full/vertical/sidebar/module-4/m-4/UhcOperator'));

const MODULE_NAME = 'Module 4 - HEALTH CARD';

export const m4Routes = [
  {
    path: '/module-4/member',
    element: (
      <ProtectedRoute>
        <ModuleRoute moduleName={MODULE_NAME}>
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
        <ModuleRoute moduleName={MODULE_NAME}>
          <Suspense fallback={<div>Loading...</div>}>
            <UhcOperator />
          </Suspense>
        </ModuleRoute>
      </ProtectedRoute>
    ),
  },
];
