// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { lazy } from 'react';
import Loadable from '../layouts/full/shared/loadable/Loadable';
import { ProtectedRoute } from '../components/ProtectedRoute';

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
        <Module1Admin />
      </ProtectedRoute>
    ),
  },
  {
    path: '/module-1/queue-generator',
    element: (
      <ProtectedRoute>
        <QueueGenerator />
      </ProtectedRoute>
    ),
  },
  {
    path: '/module-1/queue-display',
    element: <QueueDisplay />,
  },
  {
    path: '/module-1/staff-queue-manager',
    element: (
      <ProtectedRoute>
        <StaffQueueManager />
      </ProtectedRoute>
    ),
  },
];
