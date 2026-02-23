import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { Label } from "src/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "src/components/ui/select";
import { useAuthStore } from '@/stores/useAuthStore';
import { assignmentService } from '@/services/assignmentService';
import { roleService } from '@/services/roleService';

interface Assignment {
  id: string;
  description: string | null;
  is_active: boolean | null;
  created_at: string;
}

interface Role {
  id: string;
  description: string | null;
  is_active: boolean | null;
  created_at: string;
}

const AuthRegister = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<'member' | 'staff'>('member');
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [memberRoleId, setMemberRoleId] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const { signUp, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch assignments
        const assignmentData = await assignmentService.getAllAssignments();
        setAssignments(assignmentData);

        // Fetch all roles and find the Member role
        const roles = await roleService.getAllRoles();
        const memberRole = roles.find(r => r.description?.toLowerCase() === 'member');
        if (memberRole) {
          setMemberRoleId(memberRole.id);
        } else {
          console.warn('Member role not found');
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoadingAssignments(false);
        setLoadingRole(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    // For staff, assignment is required; for member, it's optional
    if (userType === 'staff' && !selectedAssignment) {
      console.error('Staff users must select an assignment');
      return;
    }

    if (!memberRoleId) {
      console.error('Member role not available');
      return;
    }
    
    await signUp(email, password, {
      data: {
        display_name: name,
        user_type: userType
      },
      assignmentId: selectedAssignment || undefined,
      roleId: memberRoleId
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
        <div className="mb-4">
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
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="userType" className="font-semibold">Account Type</Label>
          </div>
          <Select
            value={userType}
            onValueChange={(value) => {
              setUserType(value as 'member' | 'staff');
              // Reset selected assignment when switching types
              if (value === 'member') {
                setSelectedAssignment('');
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {userType === 'staff' && (
          <div className="mb-6">
            <div className="mb-2 block">
              <Label htmlFor="assignment" className="font-semibold">Assignment *</Label>
            </div>
            <Select
              value={selectedAssignment}
              onValueChange={setSelectedAssignment}
              disabled={loadingAssignments}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loadingAssignments ? "Loading..." : "Select an assignment"} />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((assignment) => (
                  <SelectItem key={assignment.id} value={assignment.id}>
                    {assignment.description || 'Unnamed Assignment'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {error && (
          <div className="mb-4 text-red-500 text-sm">
            {error}
          </div>
        )}
        <Button type="submit" className="w-full" disabled={isLoading || loadingRole}>
          {isLoading ? 'Signing up...' : 'Sign Up'}
        </Button>
      </form>
    </>
  )
}

export default AuthRegister
