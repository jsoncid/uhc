import { lazy } from 'react';
import Loadable from '../layouts/full/shared/loadable/Loadable';
import { ProtectedRoute } from '../components/ProtectedRoute';

// Module 3 - Patient Repository
const PatientProfiling = Loadable(
  lazy(() => import('../views/apps/module-3/PatientProfiling')),
);
const PatientTagging = Loadable(
  lazy(() => import('../views/apps/module-3/PatientTagging')),
);

export const m3_routes = [
  {
    path: '/module-3/patient-profiling',
    element: (
      <ProtectedRoute>
        <PatientProfiling />
      </ProtectedRoute>
    ),
  },
  {
    path: '/module-3/tagging/overview',
    element: (
      <ProtectedRoute>
        <PatientTagging />
      </ProtectedRoute>
    ),
  },
];
