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

      {/* Content Grid */}
      <div className="relative z-10 grid lg:grid-cols-2 h-full">
        {/* Left Section - Logo and Branding */}
        <div className="hidden lg:flex items-center justify-center overflow-hidden">
          {/* Content */}
          <div className="flex justify-center items-center w-full">
            <div className="scale-[4] transform hover:scale-[4.1] transition-transform duration-300">
              <FullLogo />
            </div>
          </div>
        </div>

        {/* Right Section - Login Form */}
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-8 flex justify-center">
              <div className="bg-white dark:bg-dark rounded-2xl p-4 shadow-xl">
                <FullLogo />
              </div>
            </div>

            {/* Login Form Card */}
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
    </div>
  );
};

export default Login;
