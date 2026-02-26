import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { userService } from '@/services/userService'
import { roleService } from '@/services/roleService'

interface AuthUser {
  id: string
  email?: string
  created_at: string
}

interface Role {
  id: string
  description: string | null
  is_active: boolean
  created_at: string
}

interface UserRole {
  id: string
  user: string
  role: string
  created_at: string
}

interface UserRoleDialogProps {
  isOpen: boolean
  onClose: () => void
  editingUser?: { id: string; email?: string } | null
  existingUserRoles?: UserRole[]
}

export const UserRoleDialog = ({ isOpen, onClose, editingUser, existingUserRoles }: UserRoleDialogProps) => {
  const [users, setUsers] = useState<AuthUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedUser, setSelectedUser] = useState('')
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEditMode = !!editingUser

  useEffect(() => {
    if (isOpen) {
      fetchData()
      if (editingUser) {
        setSelectedUser(editingUser.id)
        // Set existing roles
        const existingRoleIds = existingUserRoles?.map(ur => ur.role) || []
        setSelectedRoleIds(new Set(existingRoleIds))
      } else {
        setSelectedUser('')
        setSelectedRoleIds(new Set())
      }
    } else {
      setSelectedUser('')
      setSelectedRoleIds(new Set())
      setError(null)
    }
  }, [isOpen, editingUser, existingUserRoles])

  const fetchData = async () => {
    try {
      const [usersData, rolesData] = await Promise.all([
        userService.getAllUsers(),
        roleService.getAllRoles()
      ])
      setUsers(usersData)
      setRoles(rolesData)
    } catch (err) {
      setError('Failed to fetch data')
      console.error('Error fetching data:', err)
    }
  }

  const handleRoleToggle = (roleId: string) => {
    const newSelectedRoles = new Set(selectedRoleIds)
    if (newSelectedRoles.has(roleId)) {
      newSelectedRoles.delete(roleId)
    } else {
      newSelectedRoles.add(roleId)
    }
    setSelectedRoleIds(newSelectedRoles)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedUser) {
      setError('Please select a user')
      return
    }

    if (selectedRoleIds.size === 0) {
      setError('Please select at least one role')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (isEditMode && existingUserRoles) {
        // Find roles to add and remove
        const currentRoleIds = new Set(existingUserRoles.map(ur => ur.role))
        const rolesToAdd = Array.from(selectedRoleIds).filter(id => !currentRoleIds.has(id))
        const rolesToRemove = existingUserRoles.filter(ur => !selectedRoleIds.has(ur.role))

        // Delete removed roles
        await Promise.all(rolesToRemove.map(ur => userService.deleteUserRole(ur.id)))
        
        // Add new roles
        await Promise.all(rolesToAdd.map(roleId => 
          userService.createUserRole({
            user: selectedUser,
            role: roleId
          })
        ))
      } else {
        // Create all selected roles
        await Promise.all(
          Array.from(selectedRoleIds).map(roleId => 
            userService.createUserRole({
              user: selectedUser,
              role: roleId
            })
          )
        )
      }
      onClose()
    } catch (err) {
      setError(isEditMode ? 'Failed to update user roles' : 'Failed to assign user to roles')
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} user roles:`, err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedUser('')
    setSelectedRoleIds(new Set())
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit User Roles' : 'Assign User to Roles'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="user">User</Label>
            {isEditMode ? (
              <div className="px-3 py-2 border rounded-md bg-muted">
                {editingUser?.email || editingUser?.id}
              </div>
            ) : (
              <Select
                value={selectedUser}
                onValueChange={setSelectedUser}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.email || user.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-3">
            <Label>Roles (select one or more)</Label>
            <div className="border rounded-md p-4 space-y-3 max-h-60 overflow-y-auto">
              {roles.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No roles available
                </div>
              ) : (
                roles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={selectedRoleIds.has(role.id)}
                      onCheckedChange={() => handleRoleToggle(role.id)}
                    />
                    <label
                      htmlFor={`role-${role.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {role.description || role.id}
                    </label>
                  </div>
                ))
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {selectedRoleIds.size} role(s) selected
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (isEditMode ? 'Updating...' : 'Assigning...') : (isEditMode ? 'Update Roles' : 'Assign Roles')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
