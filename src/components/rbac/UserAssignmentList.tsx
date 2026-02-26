import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, Users, UserCheck, Edit, Filter, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { roleService } from '@/services/roleService'
import { assignmentService } from '@/services/assignmentService'
import { moduleService } from '@/services/moduleService'
import { userService } from '@/services/userService'
import type { UserWithStatus } from '@/services/userService'
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
  const [usersWithStatus, setUsersWithStatus] = useState<UserWithStatus[]>([])
  const [isUsersLoading, setIsUsersLoading] = useState(true)
  const [userListError, setUserListError] = useState<string | null>(null)
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<UserWithStatus | null>(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isDeletingUser, setIsDeletingUser] = useState(false)
  const [deleteUserAssignmentTarget, setDeleteUserAssignmentTarget] = useState<UserAssignment | null>(null)
  const [isDeleteUserAssignmentOpen, setIsDeleteUserAssignmentOpen] = useState(false)
  const [isDeletingUserAssignment, setIsDeletingUserAssignment] = useState(false)
  const [deleteRoleModuleTarget, setDeleteRoleModuleTarget] = useState<RoleModuleAccess | null>(null)
  const [isDeleteRoleModuleOpen, setIsDeleteRoleModuleOpen] = useState(false)
  const [isDeletingRoleModule, setIsDeletingRoleModule] = useState(false)
  const [deleteUserRoleTarget, setDeleteUserRoleTarget] = useState<UserRole | null>(null)
  const [isDeleteUserRoleOpen, setIsDeleteUserRoleOpen] = useState(false)
  const [isDeletingUserRole, setIsDeletingUserRole] = useState(false)
  const [editingUserAssignment, setEditingUserAssignment] = useState<UserAssignment | null>(null)
  const [editingUserRole, setEditingUserRole] = useState<{ id: string; email?: string } | null>(null)
  const [editingUserRoles, setEditingUserRoles] = useState<UserRole[]>([])
  
  // Filter and sort states
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all')
  const [userSortBy, setUserSortBy] = useState<string>('email')
  const [userSortOrder, setUserSortOrder] = useState<'asc' | 'desc'>('asc')
  
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all')
  const [assignmentSortBy, setAssignmentSortBy] = useState<string>('created_at')
  const [assignmentSortOrder, setAssignmentSortOrder] = useState<'asc' | 'desc'>('desc')
  
  const [roleSortBy, setRoleSortBy] = useState<string>('email')
  const [roleSortOrder, setRoleSortOrder] = useState<'asc' | 'desc'>('asc')
  
  const [roleModuleSearchTerm, setRoleModuleSearchTerm] = useState('')
  const [roleModuleRoleFilter, setRoleModuleRoleFilter] = useState<string>('all')
  const [roleModuleSortBy, setRoleModuleSortBy] = useState<string>('role')
  const [roleModuleSortOrder, setRoleModuleSortOrder] = useState<'asc' | 'desc'>('asc')

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

  const fetchUsersWithStatus = async () => {
    try {
      setIsUsersLoading(true)
      setUserListError(null)
      const users = await userService.getUsersWithStatus()
      setUsersWithStatus(users)
    } catch (err) {
      setUserListError('Failed to load users')
      console.error('Error fetching users with status:', err)
    } finally {
      setIsUsersLoading(false)
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

  const openDeleteUserDialog = (user: UserWithStatus) => {
    setDeleteTarget(user)
    setIsDeleteConfirmOpen(true)
  }

  const closeDeleteUserDialog = () => {
    setIsDeleteConfirmOpen(false)
    setDeleteTarget(null)
  }

  const confirmDeleteUser = async () => {
    if (!deleteTarget) return
    try {
      setIsDeletingUser(true)
      setUserListError(null)
      await userService.deleteUserStatus(deleteTarget.id)
      await fetchUsersWithStatus()
      closeDeleteUserDialog()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete user'
      setUserListError(message)
      console.error('Error deleting user status:', err)
    } finally {
      setIsDeletingUser(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchUsersWithStatus()
  }, [])

  useEffect(() => {
    if (roles.length > 0) {
      fetchRoleModuleAccess()
    }
  }, [roles])

  const handleEditUserAssignment = (assignment: UserAssignment) => {
    setEditingUserAssignment(assignment)
    setIsUserAssignmentDialogOpen(true)
  }

  const handleDeleteUserAssignment = (assignment: UserAssignment) => {
    setDeleteUserAssignmentTarget(assignment)
    setIsDeleteUserAssignmentOpen(true)
  }

  const closeDeleteUserAssignmentDialog = () => {
    setIsDeleteUserAssignmentOpen(false)
    setDeleteUserAssignmentTarget(null)
  }

  const confirmDeleteUserAssignment = async () => {
    if (!deleteUserAssignmentTarget) return
    try {
      setIsDeletingUserAssignment(true)
      await roleService.deleteUserAssignment(deleteUserAssignmentTarget.id)
      await fetchUserAssignments()
      closeDeleteUserAssignmentDialog()
    } catch (err) {
      setError('Failed to delete user assignment')
      console.error('Error deleting user assignment:', err)
    } finally {
      setIsDeletingUserAssignment(false)
    }
  }

  const handleDeleteRoleModuleAccess = (access: RoleModuleAccess) => {
    setDeleteRoleModuleTarget(access)
    setIsDeleteRoleModuleOpen(true)
  }

  const closeDeleteRoleModuleDialog = () => {
    setIsDeleteRoleModuleOpen(false)
    setDeleteRoleModuleTarget(null)
  }

  const confirmDeleteRoleModule = async () => {
    if (!deleteRoleModuleTarget) return
    try {
      setIsDeletingRoleModule(true)
      await roleService.deleteRoleModuleAccess(deleteRoleModuleTarget.id)
      await fetchRoleModuleAccess()
      closeDeleteRoleModuleDialog()
    } catch (err) {
      setError('Failed to delete role module access')
      console.error('Error deleting role module access:', err)
    } finally {
      setIsDeletingRoleModule(false)
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

  const handleEditUserRole = (userId: string, userEmail?: string) => {
    // Get all roles for this user
    const userRolesForUser = userRoles.filter(ur => ur.user === userId)
    setEditingUserRole({
      id: userId,
      email: userEmail
    })
    setEditingUserRoles(userRolesForUser)
    setIsUserRoleDialogOpen(true)
  }

  const handleDeleteUserRole = (userId: string, userEmail?: string) => {
    // Find the first role for this user to display in confirmation
    const firstRole = userRoles.find(ur => ur.user === userId)
    if (firstRole) {
      setDeleteUserRoleTarget(firstRole)
      setIsDeleteUserRoleOpen(true)
    }
  }

  const closeDeleteUserRoleDialog = () => {
    setIsDeleteUserRoleOpen(false)
    setDeleteUserRoleTarget(null)
  }

  const confirmDeleteUserRole = async () => {
    if (!deleteUserRoleTarget) return
    try {
      setIsDeletingUserRole(true)
      // Delete all roles for this user
      const userRolesToDelete = userRoles.filter(ur => ur.user === deleteUserRoleTarget.user)
      await Promise.all(userRolesToDelete.map(ur => userService.deleteUserRole(ur.id)))
      await fetchData()
      closeDeleteUserRoleDialog()
    } catch (err) {
      setError('Failed to delete user roles')
      console.error('Error deleting user roles:', err)
    } finally {
      setIsDeletingUserRole(false)
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
    setEditingUserAssignment(null)
    setEditingUserRole(null)
    setEditingUserRoles([])
    fetchUserAssignments()
    fetchRoleModuleAccess()
    fetchData() // Refresh user roles data
  }

  // Filter user assignments based on search term
  const filteredUserAssignments = userAssignments
    .filter((assignment) => {
      // Assignment filter
      if (assignmentFilter !== 'all' && assignment.assignment !== assignmentFilter) {
        return false
      }
      
      // Search filter
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
    .sort((a, b) => {
      let aValue: any, bValue: any
      
      if (assignmentSortBy === 'user') {
        aValue = (a.users?.email || a.user || '').toLowerCase()
        bValue = (b.users?.email || b.user || '').toLowerCase()
      } else if (assignmentSortBy === 'assignment') {
        aValue = (a.assignment?.description || '').toLowerCase()
        bValue = (b.assignment?.description || '').toLowerCase()
      } else if (assignmentSortBy === 'created_at') {
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
      }
      
      if (aValue < bValue) return assignmentSortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return assignmentSortOrder === 'asc' ? 1 : -1
      return 0
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

  // Group user roles by user
  const groupedUserRoles = filteredUserRoles.reduce((acc, userRole) => {
    const userId = userRole.user
    if (!acc[userId]) {
      acc[userId] = {
        user: userId,
        email: userRole.users?.email,
        roles: [],
        created_at: userRole.created_at
      }
    }
    acc[userId].roles.push({
      id: userRole.id,
      roleId: userRole.role,
      description: userRole.roleData?.description || userRole.role,
      created_at: userRole.created_at
    })
    // Use the earliest created_at date
    if (userRole.created_at < acc[userId].created_at) {
      acc[userId].created_at = userRole.created_at
    }
    return acc
  }, {} as Record<string, { user: string; email?: string; roles: Array<{ id: string; roleId: string; description: string; created_at: string }>; created_at: string }>)

  const groupedUserRolesArray = Object.values(groupedUserRoles)
    .sort((a, b) => {
      let aValue: any, bValue: any
      
      if (roleSortBy === 'email') {
        aValue = (a.email || a.user || '').toLowerCase()
        bValue = (b.email || b.user || '').toLowerCase()
      } else if (roleSortBy === 'roles') {
        aValue = a.roles.length
        bValue = b.roles.length
      } else if (roleSortBy === 'created_at') {
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
      }
      
      if (aValue < bValue) return roleSortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return roleSortOrder === 'asc' ? 1 : -1
      return 0
    })

  // Filter and sort role module access
  const filteredRoleModuleAccess = roleModuleAccess
    .filter((access) => {
      // Role filter
      if (roleModuleRoleFilter !== 'all' && access.role !== roleModuleRoleFilter) {
        return false
      }
      
      // Search filter
      if (!roleModuleSearchTerm) return true
      const lowerSearchTerm = roleModuleSearchTerm.toLowerCase()
      const roleDesc = ((access as any).roleDescription || access.role || '').toLowerCase()
      const moduleDesc = ((access as any).moduleDescription || access.module || '').toLowerCase()
      const description = (access.description || '').toLowerCase()
      
      return roleDesc.includes(lowerSearchTerm) || 
             moduleDesc.includes(lowerSearchTerm) ||
             description.includes(lowerSearchTerm)
    })
    .sort((a, b) => {
      let aValue: any, bValue: any
      
      if (roleModuleSortBy === 'role') {
        aValue = ((a as any).roleDescription || a.role || '').toLowerCase()
        bValue = ((b as any).roleDescription || b.role || '').toLowerCase()
      } else if (roleModuleSortBy === 'module') {
        aValue = ((a as any).moduleDescription || a.module || '').toLowerCase()
        bValue = ((b as any).moduleDescription || b.module || '').toLowerCase()
      } else if (roleModuleSortBy === 'created_at') {
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
      }
      
      if (aValue < bValue) return roleModuleSortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return roleModuleSortOrder === 'asc' ? 1 : -1
      return 0
    })

  // Group role module access by role
  const groupedRoleModuleAccess = filteredRoleModuleAccess.reduce((acc, access) => {
    const roleId = access.role
    if (!acc[roleId]) {
      acc[roleId] = {
        role: roleId,
        roleDescription: (access as any).roleDescription || roleId,
        modules: [],
        created_at: access.created_at
      }
    }
    acc[roleId].modules.push({
      id: access.id,
      module: access.module,
      moduleDescription: (access as any).moduleDescription || access.module,
      description: access.description,
      is_select: access.is_select,
      is_insert: access.is_insert,
      is_update: access.is_update,
      is_delete: access.is_delete,
      created_at: access.created_at
    })
    // Use the earliest created_at date
    if (access.created_at < acc[roleId].created_at) {
      acc[roleId].created_at = access.created_at
    }
    return acc
  }, {} as Record<string, { 
    role: string; 
    roleDescription: string; 
    modules: Array<{ 
      id: string; 
      module: string; 
      moduleDescription: string; 
      description: string | null; 
      is_select: boolean; 
      is_insert: boolean; 
      is_update: boolean; 
      is_delete: boolean; 
      created_at: string 
    }>; 
    created_at: string 
  }>)

  const groupedRoleModuleAccessArray = Object.values(groupedRoleModuleAccess)
    .sort((a, b) => {
      let aValue: any, bValue: any
      
      if (roleModuleSortBy === 'role') {
        aValue = a.roleDescription.toLowerCase()
        bValue = b.roleDescription.toLowerCase()
      } else if (roleModuleSortBy === 'module') {
        aValue = a.modules.length
        bValue = b.modules.length
      } else if (roleModuleSortBy === 'created_at') {
        aValue = new Date(a.created_at).getTime()
        bValue = new Date(b.created_at).getTime()
      }
      
      if (aValue < bValue) return roleModuleSortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return roleModuleSortOrder === 'asc' ? 1 : -1
      return 0
    })

  const filteredUsers = usersWithStatus
    .filter((user) => {
      // Status filter
      if (userStatusFilter === 'active' && !user.is_active) return false
      if (userStatusFilter === 'inactive' && user.is_active) return false
      
      // Search filter
      if (!userSearchTerm) return true
      const lowerSearch = userSearchTerm.toLowerCase()
      const name = user.name?.toLowerCase() || ''
      const email = user.email.toLowerCase()
      return name.includes(lowerSearch) || email.includes(lowerSearch)
    })
    .sort((a, b) => {
      let aValue: any, bValue: any
      
      if (userSortBy === 'email') {
        aValue = a.email.toLowerCase()
        bValue = b.email.toLowerCase()
      } else if (userSortBy === 'name') {
        aValue = (a.name || '').toLowerCase()
        bValue = (b.name || '').toLowerCase()
      } else if (userSortBy === 'status') {
        aValue = a.is_active ? 1 : 0
        bValue = b.is_active ? 1 : 0
      }
      
      if (aValue < bValue) return userSortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return userSortOrder === 'asc' ? 1 : -1
      return 0
    })

  const totalUsers = usersWithStatus.length
  const activeUsers = usersWithStatus.filter((user) => user.is_active).length
  const inactiveUsers = totalUsers - activeUsers

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
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border">
          <CardContent className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-3xl font-semibold">
              {isUsersLoading ? '...' : totalUsers}
            </p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="space-y-1">
            <p className="text-sm text-muted-foreground">Active Users</p>
            <p className="text-3xl font-semibold text-emerald-500">
              {isUsersLoading ? '...' : activeUsers}
            </p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardContent className="space-y-1">
            <p className="text-sm text-muted-foreground">Inactive Users</p>
            <p className="text-3xl font-semibold text-amber-500">
              {isUsersLoading ? '...' : inactiveUsers}
            </p>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">Users</TabsTrigger>
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
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search user assignments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by assignment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Assignments</SelectItem>
                        {assignments.map((assignment) => (
                          <SelectItem key={assignment.id} value={assignment.id}>
                            {assignment.description || assignment.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <Select value={assignmentSortBy} onValueChange={setAssignmentSortBy}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="assignment">Assignment</SelectItem>
                        <SelectItem value="created_at">Date Created</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAssignmentSortOrder(assignmentSortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      {assignmentSortOrder === 'asc' ? '↑' : '↓'}
                    </Button>
                  </div>
                </div>
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
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditUserAssignment(assignment)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUserAssignment(assignment)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
                  Assign Roles
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search user roles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <Select value={roleSortBy} onValueChange={setRoleSortBy}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">User</SelectItem>
                        <SelectItem value="roles">Role Count</SelectItem>
                        <SelectItem value="created_at">Date Created</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRoleSortOrder(roleSortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      {roleSortOrder === 'asc' ? '↑' : '↓'}
                    </Button>
                  </div>
                </div>
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
                      <TableHead>Roles</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedUserRolesArray.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? 'No user roles match your search' : 'No user roles found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      groupedUserRolesArray.map((groupedRole) => (
                        <TableRow key={groupedRole.user}>
                          <TableCell className="font-medium">
                            {groupedRole.email || groupedRole.user}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1.5">
                              {groupedRole.roles.map((role) => (
                                <Badge key={role.id} variant="secondary">
                                  {role.description}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(groupedRole.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditUserRole(groupedRole.user, groupedRole.email)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUserRole(groupedRole.user, groupedRole.email)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search role module access..."
                    value={roleModuleSearchTerm}
                    onChange={(e) => setRoleModuleSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={roleModuleRoleFilter} onValueChange={setRoleModuleRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.description || role.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={roleModuleSortBy} onValueChange={setRoleModuleSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="role">Role</SelectItem>
                      <SelectItem value="module">Module Count</SelectItem>
                      <SelectItem value="created_at">Date Created</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setRoleModuleSortOrder(roleModuleSortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {error && (
                <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">
                  {error}
                </div>
              )}
              
              {roleModuleAccess.length > 0 ? (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Current Role Module Access ({filteredRoleModuleAccess.length} modules in {groupedRoleModuleAccessArray.length} roles)
                    </h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Role</TableHead>
                            <TableHead>Modules & Permissions</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupedRoleModuleAccessArray.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                No role module access found matching your filters
                              </TableCell>
                            </TableRow>
                          ) : (
                            groupedRoleModuleAccessArray.map((roleAccess) => (
                            <TableRow key={roleAccess.role}>
                              <TableCell className="font-medium align-top">
                                {roleAccess.roleDescription}
                                <div className="text-xs text-muted-foreground mt-1">
                                  {roleAccess.modules.length} module{roleAccess.modules.length !== 1 ? 's' : ''}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-2">
                                  {roleAccess.modules.map((module) => (
                                    <div key={module.id} className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">{module.moduleDescription}</div>
                                        {module.description && (
                                          <div className="text-xs text-muted-foreground">{module.description}</div>
                                        )}
                                      </div>
                                      <div className="flex gap-1">
                                        <Badge variant={module.is_insert ? 'default' : 'outline'} className="text-xs">
                                          Create
                                        </Badge>
                                        <Badge variant={module.is_select ? 'default' : 'outline'} className="text-xs">
                                          Read
                                        </Badge>
                                        <Badge variant={module.is_update ? 'default' : 'outline'} className="text-xs">
                                          Update
                                        </Badge>
                                        <Badge variant={module.is_delete ? 'default' : 'outline'} className="text-xs">
                                          Delete
                                        </Badge>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          onClick={() => handleEditRoleModuleAccess({
                                            id: module.id,
                                            role: roleAccess.role,
                                            module: module.module,
                                            description: module.description,
                                            is_select: module.is_select,
                                            is_insert: module.is_insert,
                                            is_update: module.is_update,
                                            is_delete: module.is_delete,
                                            created_at: module.created_at
                                          } as RoleModuleAccess)}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          onClick={() => handleDeleteRoleModuleAccess({
                                            id: module.id,
                                            role: roleAccess.role,
                                            module: module.module,
                                            description: module.description,
                                            is_select: module.is_select,
                                            is_insert: module.is_insert,
                                            is_update: module.is_update,
                                            is_delete: module.is_delete,
                                            created_at: module.created_at
                                          } as RoleModuleAccess)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-right align-top">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const role = roles.find(r => r.id === roleAccess.role)
                                    if (role) handleManageRoleAccess(role)
                                  }}
                                >
                                  Add Module
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No role module access configured</p>
                    <p className="text-sm text-muted-foreground">
                      Create role module access to manage permissions
                    </p>
                  </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  System Users
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="active">Active Only</SelectItem>
                        <SelectItem value="inactive">Inactive Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <Select value={userSortBy} onValueChange={setUserSortBy}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUserSortOrder(userSortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      {userSortOrder === 'asc' ? '↑' : '↓'}
                    </Button>
                  </div>
                </div>
              </div>

              {userListError && (
                <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md mb-4">
                  {userListError}
                </div>
              )}

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isUsersLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Loading users...
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name || user.email}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.is_active ? 'default' : 'secondary'}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDeleteUserDialog(user)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
      </Tabs>

      <UserAssignmentDialog
        isOpen={isUserAssignmentDialogOpen}
        onClose={handleDialogClose}
        assignments={assignments}
        userAssignments={userAssignments}
        editingAssignment={editingUserAssignment}
      />

      <UserRoleDialog
        isOpen={isUserRoleDialogOpen}
        onClose={handleDialogClose}
        editingUser={editingUserRole}
        existingUserRoles={editingUserRoles}
      />

      <Dialog open={isDeleteConfirmOpen} onOpenChange={closeDeleteUserDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete user</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {deleteTarget?.email || 'this user'}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteUserDialog} disabled={isDeletingUser}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteUser} disabled={isDeletingUser}>
              {isDeletingUser ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteUserAssignmentOpen} onOpenChange={closeDeleteUserAssignmentDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete User Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this user assignment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteUserAssignmentDialog} disabled={isDeletingUserAssignment}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteUserAssignment} disabled={isDeletingUserAssignment}>
              {isDeletingUserAssignment ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteUserRoleOpen} onOpenChange={closeDeleteUserRoleDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete User Roles</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove all role assignments for {deleteUserRoleTarget?.users?.email || 'this user'}? 
              This will delete {userRoles.filter(ur => ur.user === deleteUserRoleTarget?.user).length} role(s). 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteUserRoleDialog} disabled={isDeletingUserRole}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteUserRole} disabled={isDeletingUserRole}>
              {isDeletingUserRole ? 'Deleting...' : 'Delete All Roles'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteRoleModuleOpen} onOpenChange={closeDeleteRoleModuleDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete Role Module Access</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this role module access? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteRoleModuleDialog} disabled={isDeletingRoleModule}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteRoleModule} disabled={isDeletingRoleModule}>
              {isDeletingRoleModule ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RoleModuleAccessDialog
        isOpen={isRoleModuleDialogOpen}
        onClose={handleDialogClose}
        role={selectedRole}
        access={selectedAccess}
      />
    </div>
  )
}
