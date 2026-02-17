import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, Users, UserCheck, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { roleService } from '@/services/roleService'
import { assignmentService } from '@/services/assignmentService'
import { moduleService } from '@/services/moduleService'
import { userService } from '@/services/userService'
import { Database } from '@/lib/supabase'
import { UserAssignmentDialog } from './UserAssignmentDialog.tsx'
import { RoleModuleAccessDialog } from './RoleModuleAccessDialog.tsx'
import { UserRoleDialog } from './UserRoleDialog.tsx'

type UserAssignment = Database['public']['Tables']['user_assignment']['Row'] & {
  users?: { email?: string; username?: string }
  assignment?: { description?: string; id: string }
}
type Assignment = Database['public']['Tables']['assignment']['Row']
type RoleModuleAccess = Database['public']['Tables']['role_module_access']['Row']
type Role = Database['public']['Tables']['role']['Row']
type UserRole = {
  id: string
  user: string
  role: string
  created_at: string
  users?: { email?: string; username?: string }
  roleData?: { description?: string; id: string }
}

export const UserAssignmentList = () => {
  const [userAssignments, setUserAssignments] = useState<UserAssignment[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [roleModuleAccess, setRoleModuleAccess] = useState<RoleModuleAccess[]>([])
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUserAssignmentDialogOpen, setIsUserAssignmentDialogOpen] = useState(false)
  const [isRoleModuleDialogOpen, setIsRoleModuleDialogOpen] = useState(false)
  const [isUserRoleDialogOpen, setIsUserRoleDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [selectedAccess, setSelectedAccess] = useState<RoleModuleAccess | null>(null)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [assignmentsData, rolesData, userAssignmentsData, userRolesData] = await Promise.all([
        assignmentService.getAllAssignments(),
        roleService.getAllRoles(),
        roleService.getAllUserAssignments(),
        userService.getAllUserRoles()
      ])
      setAssignments(assignmentsData)
      setRoles(rolesData)
      setUserAssignments(userAssignmentsData)
      setUserRoles(userRolesData)
    } catch (err) {
      setError('Failed to fetch data')
      console.error('Error fetching data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserAssignments = async () => {
    try {
      const userAssignmentsData = await roleService.getAllUserAssignments()
      setUserAssignments(userAssignmentsData)
    } catch (err) {
      setError('Failed to fetch user assignments')
      console.error('Error fetching user assignments:', err)
    }
  }

  const fetchRoleModuleAccess = async () => {
    try {
      const allAccess: (RoleModuleAccess & { roleDescription?: string; moduleDescription?: string })[] = []
      for (const role of roles) {
        const access = await roleService.getRoleModuleAccess(role.id)
        // Add role description to each access record
        const accessWithRoleDesc = access.map(item => ({
          ...item,
          roleDescription: role.description || role.id
        }))
        allAccess.push(...accessWithRoleDesc)
      }
      
      // Fetch module descriptions for all unique module IDs
      const moduleIds = [...new Set(allAccess.map(item => item.module))]
      if (moduleIds.length > 0) {
        try {
          // Fetch all modules to get their descriptions
          const modules = await moduleService.getAllModules()
          const moduleMap = new Map(modules.map(module => [module.id, module.description || module.id]))
          
          // Add module descriptions to each access record
          const accessWithModuleDesc = allAccess.map(item => ({
            ...item,
            moduleDescription: moduleMap.get(item.module) || item.module
          }))
          setRoleModuleAccess(accessWithModuleDesc)
        } catch (moduleErr) {
          console.error('Error fetching module descriptions:', moduleErr)
          // Fallback to using module IDs as descriptions
          setRoleModuleAccess(allAccess)
        }
      } else {
        setRoleModuleAccess(allAccess)
      }
    } catch (err) {
      console.error('Error fetching role module access:', err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (roles.length > 0) {
      fetchRoleModuleAccess()
    }
  }, [roles])

  const handleDeleteUserAssignment = async (id: string) => {
    if (confirm('Are you sure you want to remove this user assignment?')) {
      try {
        await roleService.deleteUserAssignment(id)
        await fetchUserAssignments()
      } catch (err) {
        setError('Failed to delete user assignment')
        console.error('Error deleting user assignment:', err)
      }
    }
  }

  const handleDeleteRoleModuleAccess = async (id: string) => {
    if (confirm('Are you sure you want to remove this role module access?')) {
      try {
        await roleService.deleteRoleModuleAccess(id)
        await fetchRoleModuleAccess()
      } catch (err) {
        setError('Failed to delete role module access')
        console.error('Error deleting role module access:', err)
      }
    }
  }

  const handleEditRoleModuleAccess = (access: RoleModuleAccess) => {
    // Find the role for this access record
    const role = roles.find(r => r.id === access.role)
    if (role) {
      setSelectedRole(role)
      setSelectedAccess(access)
      setIsRoleModuleDialogOpen(true)
    }
  }

  const handleDeleteUserRole = async (id: string) => {
    if (confirm('Are you sure you want to remove this user role assignment?')) {
      try {
        await userService.deleteUserRole(id)
        await fetchData()
      } catch (err) {
        setError('Failed to delete user role')
        console.error('Error deleting user role:', err)
      }
    }
  }

  const handleManageRoleAccess = (role: Role) => {
    setSelectedRole(role)
    setIsRoleModuleDialogOpen(true)
  }

  const handleDialogClose = () => {
    setIsUserAssignmentDialogOpen(false)
    setIsRoleModuleDialogOpen(false)
    setIsUserRoleDialogOpen(false)
    setSelectedRole(null)
    setSelectedAccess(null)
    fetchUserAssignments()
    fetchRoleModuleAccess()
    fetchData() // Refresh user roles data
  }

  // Filter user assignments based on search term
  const filteredUserAssignments = userAssignments.filter((assignment) => {
    if (!searchTerm) return true
    const lowerSearchTerm = searchTerm.toLowerCase()
    const userEmail = assignment.users?.email?.toLowerCase() || ''
    const userName = assignment.users?.username?.toLowerCase() || ''
    const userId = assignment.user?.toLowerCase() || ''
    const assignmentDesc = assignment.assignment?.description?.toLowerCase() || ''
    const assignmentId = (typeof assignment.assignment === 'string' ? assignment.assignment : '')?.toLowerCase() || ''
    
    return userEmail.includes(lowerSearchTerm) || 
           userName.includes(lowerSearchTerm) || 
           userId.includes(lowerSearchTerm) ||
           assignmentDesc.includes(lowerSearchTerm) ||
           assignmentId.includes(lowerSearchTerm)
  })

  // Filter user roles based on search term
  const filteredUserRoles = userRoles.filter((userRole) => {
    if (!searchTerm) return true
    const lowerSearchTerm = searchTerm.toLowerCase()
    const userEmail = userRole.users?.email?.toLowerCase() || ''
    const userId = userRole.user?.toLowerCase() || ''
    const roleDesc = userRole.roleData?.description?.toLowerCase() || ''
    const roleId = userRole.role?.toLowerCase() || ''
    
    return userEmail.includes(lowerSearchTerm) || 
           userId.includes(lowerSearchTerm) ||
           roleDesc.includes(lowerSearchTerm) ||
           roleId.includes(lowerSearchTerm)
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="user-assignments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="user-assignments">User Assignments</TabsTrigger>
          <TabsTrigger value="user-roles">User Roles</TabsTrigger>
          <TabsTrigger value="role-access">Role Module Access</TabsTrigger>
        </TabsList>

        <TabsContent value="user-assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Facility Assignment Management
                </CardTitle>
                <Button onClick={() => setIsUserAssignmentDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Assign User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search user assignments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              {error && (
                <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">
                  {error}
                </div>
              )}

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUserAssignments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? 'No user assignments match your search' : 'No user assignments found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUserAssignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell className="font-medium">
                            {assignment.users?.email || assignment.users?.username || assignment.user}
                          </TableCell>
                          <TableCell>
                            {assignment.assignment?.description || assignment.assignment}
                          </TableCell>
                          <TableCell>
                            {new Date(assignment.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUserAssignment(assignment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user-roles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Role Assignment Management
                </CardTitle>
                <Button onClick={() => setIsUserRoleDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Role
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search user roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              {error && (
                <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">
                  {error}
                </div>
              )}

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUserRoles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? 'No user roles match your search' : 'No user roles found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUserRoles.map((userRole) => (
                        <TableRow key={userRole.id}>
                          <TableCell className="font-medium">
                            {userRole.users?.email || userRole.user}
                          </TableCell>
                          <TableCell>
                            {userRole.roleData?.description || userRole.role}
                          </TableCell>
                          <TableCell>
                            {new Date(userRole.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUserRole(userRole.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="role-access" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Role Module Access Management
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">
                  {error}
                </div>
              )}
              
              <div className="grid gap-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading roles...</p>
                  </div>
                ) : roles.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No roles found</p>
                    <p className="text-sm text-muted-foreground">
                      Create roles first to manage module access permissions
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roles.map((role) => (
                      <Card key={role.id} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{role.id}</h3>
                          <Badge variant={role.is_active ? 'default' : 'secondary'}>
                            {role.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {role.description || 'No description'}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleManageRoleAccess(role)}
                          >
                            Manage Access
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {roleModuleAccess.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Current Role Module Access</h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Role</TableHead>
                            <TableHead>Module</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Select</TableHead>
                            <TableHead>Insert</TableHead>
                            <TableHead>Update</TableHead>
                            <TableHead>Delete</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {roleModuleAccess.map((access) => (
                            <TableRow key={access.id}>
                              <TableCell className="font-medium">{(access as any).roleDescription || access.role}</TableCell>
                              <TableCell>{(access as any).moduleDescription || access.module}</TableCell>
                              <TableCell>{access.description || 'No description'}</TableCell>
                              <TableCell>
                                <Badge variant={access.is_select ? 'default' : 'destructive'}>
                                  {access.is_select ? 'Yes' : 'No'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={access.is_insert ? 'default' : 'destructive'}>
                                  {access.is_insert ? 'Yes' : 'No'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={access.is_update ? 'default' : 'destructive'}>
                                  {access.is_update ? 'Yes' : 'No'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={access.is_delete ? 'default' : 'destructive'}>
                                  {access.is_delete ? 'Yes' : 'No'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditRoleModuleAccess(access)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteRoleModuleAccess(access.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <UserAssignmentDialog
        isOpen={isUserAssignmentDialogOpen}
        onClose={handleDialogClose}
        assignments={assignments}
      />

      <UserRoleDialog
        isOpen={isUserRoleDialogOpen}
        onClose={handleDialogClose}
      />

      <RoleModuleAccessDialog
        isOpen={isRoleModuleDialogOpen}
        onClose={handleDialogClose}
        role={selectedRole}
        access={selectedAccess}
      />
    </div>
  )
}
