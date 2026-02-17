import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

interface UserRoleDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const UserRoleDialog = ({ isOpen, onClose }: UserRoleDialogProps) => {
  const [users, setUsers] = useState<AuthUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [formData, setFormData] = useState({
    user: '',
    role: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        user: '',
        role: ''
      })
      setError(null)
    }
  }, [isOpen])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.user || !formData.role) {
      setError('Please select both user and role')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await userService.createUserRole({
        user: formData.user,
        role: formData.role
      })
      onClose()
    } catch (err) {
      setError('Failed to assign user to role')
      console.error('Error creating user role:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      user: '',
      role: ''
    })
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Assign User to Role
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
            <Select
              value={formData.user}
              onValueChange={(value) => setFormData(prev => ({ ...prev, user: value }))}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.description || role.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Assigning...' : 'Assign Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
