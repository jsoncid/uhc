import { RoleList } from '@/components/rbac/RoleList'

const RoleManagement = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
        <p className="text-muted-foreground">
          Manage roles in your role-based access control system
        </p>
      </div>
      <RoleList />
    </div>
  )
}

export default RoleManagement
