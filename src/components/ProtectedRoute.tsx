import { Navigate } from 'react-router';
import { useAuthStore } from '@/stores/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuthStore();

  // Wait for auth initialization before deciding to redirect
  if (isLoading) {
    return null; // Or a loading spinner
  }

  if (!user) {
    return <Navigate to="/auth/auth2/login" replace />;
  }

  return <>{children}</>;
};
