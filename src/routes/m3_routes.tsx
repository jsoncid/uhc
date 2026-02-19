// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { lazy } from 'react';
import Loadable from '../layouts/full/shared/loadable/Loadable';
import { ProtectedRoute } from '../components/ProtectedRoute';

// Module 3 - Patient Profiling Components
const PatientProfiling = Loadable(lazy(() => import('../views/apps/module-3/PatientProfiling')));

export const module3Routes = [
  {
    path: '/module-3/patient-profiling',
    element: (
      <ProtectedRoute>
        <PatientProfiling />
      </ProtectedRoute>
    ),
  },
];
