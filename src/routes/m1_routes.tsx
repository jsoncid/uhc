// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { lazy } from 'react';
import Loadable from '../layouts/full/shared/loadable/Loadable';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { ModuleRoute } from '../components/ModuleRoute';
import { PAGE_MODULES } from '../constants/moduleAccess';

// Module 1 - Queue Management System Components
const Module1Admin = Loadable(
  lazy(() => import('../layouts/full/vertical/sidebar/module-1/AdminPage')),
);
const QueueGenerator = Loadable(
  lazy(() => import('../layouts/full/vertical/sidebar/module-1/QueueGenerator')),
);
const QueueDisplay = Loadable(
  lazy(() => import('../layouts/full/vertical/sidebar/module-1/QueueDisplay')),
);
const StaffQueueManager = Loadable(
  lazy(() => import('../layouts/full/vertical/sidebar/module-1/StaffQueueManager')),
);

export const module1Routes = [
  {
    path: '/module-1/admin',
    element: (
      <ProtectedRoute>
        <ModuleRoute moduleName={PAGE_MODULES.MODULE_1_ADMIN}>
          <Module1Admin />
        </ModuleRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: '/module-1/queue-generator',
    element: (
      <ProtectedRoute>
        <ModuleRoute moduleName={PAGE_MODULES.MODULE_1_QG}>
          <QueueGenerator />
        </ModuleRoute>
      </ProtectedRoute>
    ),
  },
  {
    path: '/module-1/queue-display',
    element: (
      <ModuleRoute moduleName={PAGE_MODULES.MODULE_1_QD}>
        <QueueDisplay />
      </ModuleRoute>
    ),
  },
  {
    path: '/module-1/staff-queue-manager',
    element: (
      <ProtectedRoute>
        <ModuleRoute moduleName={PAGE_MODULES.MODULE_1_SQM}>
          <StaffQueueManager />
        </ModuleRoute>
      </ProtectedRoute>
    ),
  },
];
