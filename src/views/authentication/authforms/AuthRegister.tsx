import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { Label } from "src/components/ui/label";
import { useAuthStore } from '@/stores/useAuthStore';

const AuthRegister = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { signUp, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    await signUp(email, password, {
      data: {
        display_name: name
      }
    });
    
    // Check the store state after signUp completes
    const currentError = useAuthStore.getState().error;
    if (!currentError) {
      setRegistrationSuccess(true);
      // Redirect to login page after a short delay to show success message
      setTimeout(() => {
        navigate('/auth/auth2/login');
      }, 3000);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="mt-6 text-center">
        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 border border-green-500 rounded-md">
          <h3 className="text-green-700 dark:text-green-400 font-semibold mb-2">
            Registration Successful!
          </h3>
          <p className="text-green-600 dark:text-green-300 text-sm">
            Your account has been created. Please wait for administrator approval before logging in.
          </p>
          <p className="text-green-600 dark:text-green-300 text-sm mt-2">
            Redirecting to login page...
          </p>
        </div>
        <Button 
          onClick={() => navigate('/auth/auth2/login')} 
          variant="outline" 
          className="mt-4"
        >
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mt-6">
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="name" className="font-semibold">Name</Label>
          </div>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="email" className="font-semibold">Email Address</Label>
          </div>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <div className="mb-2 block">
            <Label htmlFor="password" className="font-semibold">Password</Label>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <div className="mb-4 text-red-500 text-sm">
            {error}
          </div>
        )}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Signing up...' : 'Sign Up'}
        </Button>
      </form>
    </>
  )
}

export default AuthRegister
