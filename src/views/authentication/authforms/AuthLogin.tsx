import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from 'src/components/ui/button';
import { Checkbox } from 'src/components/ui/checkbox';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { useAuthStore } from '@/stores/useAuthStore';

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
    <>
      <form onSubmit={handleSubmit} className="mt-6">
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="email">Email</Label>
          </div>
          <Input 
            id="email" 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="password">Password</Label>
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
        {/* <div className="flex justify-between my-5">
          <div className="flex items-center gap-2">
            <Checkbox id="accept" className="checkbox" />
            <Label htmlFor="accept" className="opacity-90 font-normal cursor-pointer">
              Remember this Device
            </Label>
          </div>
          <Link to={'/'} className="text-primary text-sm font-medium">
            Forgot Password ?
          </Link>
        </div> */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </>
  );
};

export default AuthLogin;
