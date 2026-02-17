import { UserAcceptanceList } from '@/components/rbac/UserAcceptanceList';

const UserAcceptance = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">User Activation</h1>
        <p className="text-muted-foreground">
          Review and approve pending user registration requests
        </p>
      </div>
      <UserAcceptanceList />
    </div>
  );
};

export default UserAcceptance;
