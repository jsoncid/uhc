import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { roleService } from '@/services/roleService'
import { userService } from '@/services/userService'
import { Database } from '@/lib/supabase'

type Assignment = Database['public']['Tables']['assignment']['Row']
type UserAssignment = Database['public']['Tables']['user_assignment']['Row']

interface AuthUser {
  id: string
  email?: string
  created_at: string
}

interface UserAssignmentDialogProps {
  isOpen: boolean
  onClose: () => void
  assignments: Assignment[]
  userAssignments: UserAssignment[]
}

export const UserAssignmentDialog = ({ isOpen, onClose, assignments, userAssignments }: UserAssignmentDialogProps) => {
  const [users, setUsers] = useState<AuthUser[]>([])
  const [availableUsers, setAvailableUsers] = useState<AuthUser[]>([])
  const [formData, setFormData] = useState({
    user: '',
    assignment: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchUsers()
    } else {
      setFormData({
        user: '',
        assignment: ''
      })
      setError(null)
    }
  }, [isOpen, userAssignments])

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true)
      const userData = await userService.getAllUsers()
      setUsers(userData)
      
      // Filter out users who already have an assignment
      const usersWithAssignments = new Set(
        userAssignments
          .filter(ua => ua.is_active)
          .map(ua => ua.user)
      )
      const filtered = userData.filter(user => !usersWithAssignments.has(user.id))
      setAvailableUsers(filtered)
    } catch (err) {
      setError('Failed to fetch users')
      console.error('Error fetching users:', err)
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.user || !formData.assignment) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await roleService.createUserAssignment({
        user: formData.user,
        assignment: formData.assignment
      })
      onClose()
    } catch (err) {
      setError('Failed to create user assignment')
      console.error('Error creating user assignment:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ user: '', assignment: '' })
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign User to Facility  </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
                {error}
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="user">User</Label>
              <Select
                value={formData.user}
                onValueChange={(value) => setFormData({ ...formData, user: value })}
                disabled={isLoadingUsers}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select a user"} />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length === 0 && !isLoadingUsers ? (
                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                      All users already have assignments
                    </div>
                  ) : (
                    availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email || user.id}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="assignment">Assignment</Label>
              <Select
                value={formData.assignment}
                onValueChange={(value) => setFormData({ ...formData, assignment: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an assignment" />
                </SelectTrigger>
                <SelectContent>
                  {assignments.map((assignment) => (
                    <SelectItem key={assignment.id} value={assignment.id}>
                      {assignment.description || 'No description'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Assigning...' : 'Assign User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
