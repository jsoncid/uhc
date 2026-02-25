import { lazy, Suspense } from 'react';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { MODULE_IDS } from '../constants/moduleAccess';
import { ModuleGuard } from '../components/ModuleGuard';

const MobileNotesIntegration = lazy(() => import('../layouts/full/vertical/sidebar/module-5/LiveDocuments'));

export const m5Routes = [
  {
    path: '/module-5/mobile-notes-integration',
    element: (
      <ProtectedRoute>
        <ModuleGuard
          requiredModuleId={MODULE_IDS.module5}
          requiredRoleIds={[]}
        >
          <Suspense fallback={<div>Loading...</div>}>
            <MobileNotesIntegration />
          </Suspense>
        </ModuleGuard>
      </ProtectedRoute>
    ),
  },
  // Keep the old route for backward compatibility
  {
    path: '/module-5/live-documents',
    element: (
      <ProtectedRoute>
        <ModuleGuard
          requiredModuleId={MODULE_IDS.module5}
          requiredRoleIds={[]}
        >
          <Suspense fallback={<div>Loading...</div>}>
            <MobileNotesIntegration />
          </Suspense>
        </ModuleGuard>
      </ProtectedRoute>
    ),
  },
];
