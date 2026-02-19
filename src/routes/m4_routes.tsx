import { lazy, Suspense } from 'react';
import { ProtectedRoute } from '../components/ProtectedRoute'; 
import { MODULE_IDS, ROLE_IDS } from '../constants/moduleAccess';
import { ModuleGuard } from '../components/ModuleGuard';

const UhcMember = lazy(() => import('../layouts/full/vertical/sidebar/module-4/m-4/UhcMember'));
const UhcOperator = lazy(() => import('../layouts/full/vertical/sidebar/module-4/m-4/UhcOperator'));

export const m4Routes = [
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
        <ModuleGuard
          requiredRoleIds={[ROLE_IDS.module4Operator]}
          requiredModuleId={MODULE_IDS.module4}
        >
          <Suspense fallback={<div>Loading...</div>}>
            <UhcOperator />
          </Suspense>
        </ModuleGuard>
      </ProtectedRoute>
    ),
  },
];
