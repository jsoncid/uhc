import { Link } from "react-router";
import { Navigate } from 'react-router';
import AuthLogin from "../authforms/AuthLogin";
import FullLogo from "src/layouts/full/shared/logo/FullLogo";
import { useAuthStore } from '@/stores/useAuthStore';
import Threads from '@/components/ui/Threads';

const Login = () => {
  const { user } = useAuthStore();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="relative overflow-hidden h-screen">
      {/* Full Screen Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-primary/5 dark:from-primary/15 dark:via-dark dark:to-primary/10">
        <Threads
          amplitude={2.1}
          distance={0}
          enableMouseInteraction
        />
      </div>

      {/* Centered Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 py-12">
        {/* Logo at Top */}
        <div className="mb-12">
          <div className="transform hover:scale-105 transition-transform duration-300">
            <div className="scale-[3.5]">
              <FullLogo />
            </div>
          </div>
        </div>

        {/* Login Form Card - Centered */}
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-muted rounded-2xl shadow-2xl border border-border dark:border-border p-8">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-dark dark:text-white mb-2">
                Welcome Back
              </h2>
              <p className="text-bodytext dark:text-muted-foreground">
                Sign in to continue to your account
              </p>
            </div>

            <AuthLogin />

            <div className="mt-6 text-center">
              <p className="text-sm text-bodytext dark:text-muted-foreground">
                Don't have an account?{' '}
                <Link
                  to={"/auth/auth2/register"}
                  className="text-primary hover:text-primary-emphasis font-semibold transition-colors"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
