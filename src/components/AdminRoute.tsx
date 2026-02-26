import { Navigate } from 'react-router';
import { useAuthStore } from 'src/stores/useAuthStore';
import { ROLE_IDS } from 'src/constants/moduleAccess';

/**
 * Route guard that blocks access for member-role users.
 * Use this to protect admin-only pages (RBAC, User Activation, etc.)
 * that should not be accessible by Module 4 health-card members.
 */
export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useAuthStore((s) => s.user);
  const userRoleId = useAuthStore((s) => s.userRoleId);
  const isLoading = useAuthStore((s) => s.isLoading);

  // Wait for auth initialization before deciding to redirect
  if (isLoading) return null;

  if (!user) return <Navigate to="/auth/auth2/login" replace />;
  if (userRoleId === ROLE_IDS.module4Member) return <Navigate to="/auth/unauthorized" replace />;

  return <>{children}</>;
};
