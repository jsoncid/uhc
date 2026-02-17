import { UserAssignmentList } from '@/components/rbac/UserAssignmentList'

const UserAssignmentManagement = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Manage user assignments, roles, and role module access in your RBAC system
        </p>
      </div>
      <UserAssignmentList />
    </div>
  )
}

export default UserAssignmentManagement
