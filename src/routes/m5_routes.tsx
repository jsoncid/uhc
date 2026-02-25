import { lazy, Suspense } from 'react';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { ModuleRoute } from '../components/ModuleRoute';

const MobileNotesIntegration = lazy(() => import('../layouts/full/vertical/sidebar/module-5/LiveDocuments'));

export const module5Routes = [
  {
    path: '/module-5/mobile-notes-integration',
    element: (
      <ProtectedRoute>
        <ModuleRoute moduleName="Module 5 - Documents">
          <Suspense fallback={<div>Loading...</div>}>
            <MobileNotesIntegration />
          </Suspense>
        </ModuleRoute>
      </ProtectedRoute>
    ),
  },
  // Keep the old route for backward compatibility
  {
    path: '/module-5/live-documents',
    element: (
      <ProtectedRoute>
        <ModuleRoute moduleName="Module 5 - Documents">
          <Suspense fallback={<div>Loading...</div>}>
            <MobileNotesIntegration />
          </Suspense>
        </ModuleRoute>
      </ProtectedRoute>
    ),
  },
];
