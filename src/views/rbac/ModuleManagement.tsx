import { ModuleList } from '@/components/rbac/ModuleList'

const ModuleManagement = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Module Management</h1>
        <p className="text-muted-foreground">
          Manage modules in your role-based access control system
        </p>
      </div>
      <ModuleList />
    </div>
  )
}

export default ModuleManagement
