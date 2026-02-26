// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { lazy } from 'react';
import Loadable from '../layouts/full/shared/loadable/Loadable';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { ModuleRoute } from '../components/ModuleRoute';
import { PAGE_MODULES } from '../constants/moduleAccess';

// Module 3 - Patient Repository Components
const PatientList = Loadable(
  lazy(() => import('../views/apps/module-3/PatientList')),
);
const PatientDetails = Loadable(
  lazy(() => import('../views/apps/module-3/PatientDetails')),
);
const PatientProfiling = Loadable(
  lazy(() => import('../views/apps/module-3/PatientProfiling')),
);
const PatientTagging = Loadable(
  lazy(() => import('../views/apps/module-3/PatientTagging')),
);

// Database Management - Dynamic Database Connections
const DatabaseManagement = Loadable(
  lazy(() => import('../views/database/DatabaseManagement')),
);

export const module3Routes = [
  {
    path: '/module-3/patient-list',
    element: (
      <ProtectedRoute>
        <PatientList />
      </ProtectedRoute>
    ),
  },
  {
    path: '/module-3/patient-details',
    element: (
      <ProtectedRoute>
        <PatientDetails />
      </ProtectedRoute>
    ),
  },
  {
    path: '/module-3/patient-profiling',
    element: (
      <ProtectedRoute>
        <ModuleRoute moduleName={PAGE_MODULES.MODULE_3_PATIENT_PROFILING}>
          <PatientProfiling />
        </ModuleRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: '/module-3/patient-tagging',
    element: (
      <ProtectedRoute>
        <PatientTagging />
      </ProtectedRoute>
    ),
  },
  {
    path: '/module-3/database-management',
    element: (
      <ProtectedRoute>
        <DatabaseManagement />
      </ProtectedRoute>
    ),
  },
];
