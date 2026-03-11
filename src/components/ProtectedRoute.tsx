import { Navigate } from 'react-router';
import { useAuthStore } from '@/stores/useAuthStore';
import FaceRegistration from '@/components/auth/FaceRegistration';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading, hasFaceProfile, setHasFaceProfile } = useAuthStore();

  // Wait for auth initialization before deciding to redirect
  if (isLoading) {
    return null; // Or a loading spinner
  }

  if (!user) {
    return <Navigate to="/auth/auth2/login" replace />;
  }

  if (!hasFaceProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-full max-w-lg bg-white dark:bg-muted rounded-2xl shadow-2xl border border-border p-8">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-foreground mb-2">Face Registration Required</h2>
            <p className="text-sm text-muted-foreground">
              Please register your face to continue using the application.
            </p>
          </div>
          <FaceRegistration
            userId={user.id}
            onComplete={() => setHasFaceProfile(true)}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
