import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
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
  const [userSearchOpen, setUserSearchOpen] = useState(false)
  const [roleSearchTerm, setRoleSearchTerm] = useState('')
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
              <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={userSearchOpen}
                    className="w-full justify-between"
                  >
                    {selectedUser
                      ? users.find((user) => user.id === selectedUser)?.email || selectedUser
                      : "Select a user..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search users..." />
                    <CommandEmpty>No user found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {users.map((user) => (
                        <CommandItem
                          key={user.id}
                          value={user.email || user.id}
                          onSelect={() => {
                            setSelectedUser(user.id)
                            setUserSearchOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedUser === user.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {user.email || user.id}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>

          <div className="space-y-3">
            <Label>Roles (select one or more)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
                value={roleSearchTerm}
                onChange={(e) => setRoleSearchTerm(e.target.value)}
                className="pl-9 mb-2"
              />
            </div>
            <div className="border rounded-md p-4 space-y-3 max-h-60 overflow-y-auto">
              {roles.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No roles available
                </div>
              ) : (
                roles
                  .filter(role => {
                    if (!roleSearchTerm) return true
                    const searchLower = roleSearchTerm.toLowerCase()
                    return (
                      (role.description?.toLowerCase() || '').includes(searchLower) ||
                      role.id.toLowerCase().includes(searchLower)
                    )
                  })
                  .map((role) => (
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
              {roles.length > 0 && roles.filter(role => {
                if (!roleSearchTerm) return true
                const searchLower = roleSearchTerm.toLowerCase()
                return (
                  (role.description?.toLowerCase() || '').includes(searchLower) ||
                  role.id.toLowerCase().includes(searchLower)
                )
              }).length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No roles match your search
                </div>
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
