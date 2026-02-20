import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from 'src/components/ui/button';
import { Checkbox } from 'src/components/ui/checkbox';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { useAuthStore } from '@/stores/useAuthStore';
import { Mail, Lock, AlertCircle } from 'lucide-react';

const AuthLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(email, password);
    if (!error) {
      navigate('/');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-semibold text-dark dark:text-white">
          Email Address
        </Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-bodytext dark:text-muted-foreground">
            <Mail size={18} />
          </div>
          <Input 
            id="email" 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="pl-10 h-12 bg-muted/50 dark:bg-background border-border focus:border-primary transition-colors"
            required
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-semibold text-dark dark:text-white">
          Password
        </Label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-bodytext dark:text-muted-foreground">
            <Lock size={18} />
          </div>
          <Input 
            id="password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="pl-10 h-12 bg-muted/50 dark:bg-background border-border focus:border-primary transition-colors"
            required
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-lighterror dark:bg-error/20 border border-error/20">
          <AlertCircle size={18} className="text-error mt-0.5 flex-shrink-0" />
          <p className="text-sm text-error dark:text-error">
            {error}
          </p>
        </div>
      )}

      {/* Remember Me & Forgot Password */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox 
            id="remember" 
            className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <Label 
            htmlFor="remember" 
            className="text-sm text-bodytext dark:text-muted-foreground font-normal cursor-pointer"
          >
            Remember me
          </Label>
        </div>
        <Link 
          to={'/auth/auth2/forgot-password'} 
          className="text-sm text-primary hover:text-primary-emphasis font-medium transition-colors"
        >
          Forgot Password?
        </Link>
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full h-12 bg-primary hover:bg-primary-emphasis text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Signing in...
          </div>
        ) : (
          'Sign in'
        )}
      </Button>
    </form>
  );
};

export default AuthLogin;
