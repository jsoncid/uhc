import { Navigate } from 'react-router';
import { useAuthStore } from '@/stores/useAuthStore';
import { usePermissions, type PermissionAction } from '@/context/PermissionsContext';

interface ModuleRouteProps {
  /** Must match `module.description` in the database (case-insensitive). */
  moduleName: string;
  /** CRUD action to check – defaults to `'select'` (read access). */
  action?: PermissionAction;
  children: React.ReactNode;
}

/**
 * Route-level permission guard.
 *
 * Wraps a route element and redirects to `/auth/unauthorized` if the
 * current user lacks the required permission.  While permissions are
 * still loading it renders nothing to avoid a flash-redirect.
 *
 * Usage:
 * ```tsx
 * <ModuleRoute moduleName="Module 1 - QUEUEING">
 *   <QueueDisplay />
 * </ModuleRoute>
 * ```
 */
export const ModuleRoute = ({
  moduleName,
  action = 'select',
  children,
}: ModuleRouteProps) => {
  const user = useAuthStore((s) => s.user);
  const { checkAccess, loading } = usePermissions();

  // Not authenticated → login
  if (!user) {
    return <Navigate to="/auth/auth2/login" replace />;
  }

  // Still fetching permissions → render nothing (avoids flash-redirect)
  if (loading) {
    return null;
  }

  // Permission denied → unauthorized page
  if (!checkAccess(moduleName, action)) {
    return <Navigate to="/auth/unauthorized" replace />;
  }

  return <>{children}</>;
};
