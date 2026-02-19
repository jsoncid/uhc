import { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuthStore } from '../stores/useAuthStore'; // adjust path
import { MODULE_IDS, ROLE_IDS } from '../constants/moduleAccess';

interface ModuleGuardProps {
  requiredRoleIds: string[];
  requiredModuleId: string;
  children: ReactNode;
}

export const ModuleGuard = ({
  requiredRoleIds,
  requiredModuleId,
  children,
}: ModuleGuardProps) => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/auth/auth2/login" replace />;
  }

  const userModuleId = user.user_metadata?.module_id;
  const userRoleId = user.user_metadata?.role_id;

  console.log('userModuleId:', userModuleId);
  console.log('userRoleId:', userRoleId);
  console.log('requiredModuleId:', requiredModuleId);
  console.log('requiredRoleIds:', requiredRoleIds);

  const hasAccess =
    userModuleId === requiredModuleId &&
    requiredRoleIds.includes(userRoleId);

  if (!hasAccess) {
    return <Navigate to="/auth/404" replace />;
  }

  return <>{children}</>;
};