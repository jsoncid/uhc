import { AssignmentList } from '@/components/rbac/AssignmentList'

const AssignmentManagement = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Assignment Management</h1>
        <p className="text-muted-foreground">
          Manage assignments in your role-based access control system
        </p>
      </div>
      <AssignmentList />
    </div>
  )
}

export default AssignmentManagement
