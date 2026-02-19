// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { lazy } from 'react';
import { Navigate, createBrowserRouter } from 'react-router';
import Loadable from '../layouts/full/shared/loadable/Loadable';
import { ProtectedRoute } from '../components/ProtectedRoute';

/* ***Layouts**** */
const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));

// authentication

const Login2 = Loadable(lazy(() => import('../views/authentication/auth2/Login')));

const Register2 = Loadable(lazy(() => import('../views/authentication/auth2/Register')));

const Maintainance = Loadable(lazy(() => import('../views/authentication/Maintainance')));

// Dashboards
const Modern = Loadable(lazy(() => import('../views/dashboards/Modern')));

//pages
const UserProfile = Loadable(lazy(() => import('../views/pages/user-profile/UserProfile')));

/* ****Apps***** */
const Notes = Loadable(lazy(() => import('../views/apps/notes/Notes')));
const Form = Loadable(lazy(() => import('../views/utilities/form/Form')));
const Table = Loadable(lazy(() => import('../views/utilities/table/Table')));
const Module4Member = Loadable(lazy(() => import('../layouts/full/vertical/sidebar/module-4/m-4/UhcMember')));
const Module4Operator = Loadable(lazy(() => import('../layouts/full/vertical/sidebar/module-4/m-4/UhcOperator')));
const Tickets = Loadable(lazy(() => import('../views/apps/tickets/Tickets')));
const CreateTickets = Loadable(lazy(() => import('../views/apps/tickets/CreateTickets')));
const Blog = Loadable(lazy(() => import('../views/apps/blog/Blog')));
const BlogDetail = Loadable(lazy(() => import('../views/apps/blog/BlogDetail')));

// Module 1 - Queue Management System
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

// Referral Pages (Module 2)
const Referrals = Loadable(
  lazy(() => import('../layouts/full/vertical/sidebar/module-2/views/Referrals')),
);
const CreateReferral = Loadable(
  lazy(() => import('../layouts/full/vertical/sidebar/module-2/views/CreateReferral')),
);
const CreateObGyneReferral = Loadable(
  lazy(() => import('../layouts/full/vertical/sidebar/module-2/views/CreateObGyneReferral')),
);
const ReferralDetails = Loadable(
  lazy(() => import('../layouts/full/vertical/sidebar/module-2/views/ReferralDetails')),
);
const ReferralHistory = Loadable(
  lazy(() => import('../layouts/full/vertical/sidebar/module-2/views/ReferralHistory')),
);

// Module 3 - Patient Profiling
const PatientProfiling = Loadable(
  lazy(() => import('../views/apps/module-3/PatientProfiling')),
);

// RBAC Pages
const AssignmentManagement = Loadable(lazy(() => import('../views/rbac/AssignmentManagement')));
const ModuleManagement = Loadable(lazy(() => import('../views/rbac/ModuleManagement')));
const RoleManagement = Loadable(lazy(() => import('../views/rbac/RoleManagement')));
const UserAssignmentManagement = Loadable(
  lazy(() => import('../views/rbac/UserAssignmentManagement')),
);
const UserAcceptance = Loadable(lazy(() => import('../views/rbac/UserAcceptance')));

const Error = Loadable(lazy(() => import('../views/authentication/Error')));

// // icons
const SolarIcon = Loadable(lazy(() => import('../views/icons/SolarIcon')));

// const SamplePage = lazy(() => import('../views/sample-page/SamplePage'));

const Router = [
  {
    path: '/',
    element: <FullLayout />,
    children: [
      {
        path: '/',
        exact: true,
        element: (
          <ProtectedRoute>
            <Modern />
          </ProtectedRoute>
        ),
      },
      {
        path: '/apps/notes',
        element: (
          <ProtectedRoute>
            <Notes />
          </ProtectedRoute>
        ),
      },
      {
        path: '/utilities/form',
        element: (
          <ProtectedRoute>
            <Form />
          </ProtectedRoute>
        ),
      },
      {
        path: '/utilities/table',
        element: (
          <ProtectedRoute>
            <Table />
          </ProtectedRoute>
        ),
      },
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
      {
        path: '/module-4/member',
        element: (
          <ProtectedRoute>
            <Module4Member />
          </ProtectedRoute>
        ),
      },
      {
        path: '/module-4/operator',
        element: (
          <ProtectedRoute>
            <Module4Operator />
          </ProtectedRoute>
        ),
      },
      { 
        path: '/apps/tickets', 
        element: (
          <ProtectedRoute>
            <Tickets />
          </ProtectedRoute>
        ),
      },
      {
        path: '/apps/tickets/create',
        element: (
          <ProtectedRoute>
            <CreateTickets />
          </ProtectedRoute>
        ),
      },
      {
        path: '/apps/blog/post',
        element: (
          <ProtectedRoute>
            <Blog />
          </ProtectedRoute>
        ),
      },
      {
        path: '/apps/blog/detail/:id',
        element: (
          <ProtectedRoute>
            <BlogDetail />
          </ProtectedRoute>
        ),
      },
      // Module 2 - Referral System Routes
      {
        path: '/module-2/referrals',
        element: (
          <ProtectedRoute>
            <Referrals />
          </ProtectedRoute>
        ),
      },
      {
        path: '/module-2/referrals/create',
        element: (
          <ProtectedRoute>
            <CreateReferral />
          </ProtectedRoute>
        ),
      },
      {
        path: '/module-2/referrals/create-obgyne',
        element: (
          <ProtectedRoute>
            <CreateObGyneReferral />
          </ProtectedRoute>
        ),
      },
      {
        path: '/module-2/referrals/detail/:id',
        element: (
          <ProtectedRoute>
            <ReferralDetails />
          </ProtectedRoute>
        ),
      },
      {
        path: '/module-2/referral-history',
        element: (
          <ProtectedRoute>
            <ReferralHistory />
          </ProtectedRoute>
        ),
      },
      // Module 3 - Patient Profiling
      {
        path: '/module-3/patient-profiling',
        element: (
          <ProtectedRoute>
            <PatientProfiling />
          </ProtectedRoute>
        ),
      },
      {
        path: '/user-profile',
        element: (
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        ),
      },
      {
        path: '/icons/iconify',
        element: (
          <ProtectedRoute>
            <SolarIcon />
          </ProtectedRoute>
        ),
      },
      // RBAC Routes
      {
        path: '/rbac/assignments',
        element: (
          <ProtectedRoute>
            <AssignmentManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: '/rbac/modules',
        element: (
          <ProtectedRoute>
            <ModuleManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: '/rbac/roles',
        element: (
          <ProtectedRoute>
            <RoleManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: '/rbac/user-assignments',
        element: (
          <ProtectedRoute>
            <UserAssignmentManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: '/rbac/user-acceptance',
        element: (
          <ProtectedRoute>
            <UserAcceptance />
          </ProtectedRoute>
        ),
      },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
  {
    path: '/',
    element: <BlankLayout />,
    children: [
      { path: '/auth/auth2/login', element: <Login2 /> },

      { path: '/auth/auth2/register', element: <Register2 /> },

      { path: '/auth/maintenance', element: <Maintainance /> },
      { path: '404', element: <Error /> },
      { path: '/auth/404', element: <Error /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
];

const router = createBrowserRouter(Router);

export default router;
