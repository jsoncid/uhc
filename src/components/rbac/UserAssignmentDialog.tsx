import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
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
  editingAssignment?: UserAssignment | null
}

export const UserAssignmentDialog = ({ isOpen, onClose, assignments, userAssignments, editingAssignment }: UserAssignmentDialogProps) => {
  const [users, setUsers] = useState<AuthUser[]>([])
  const [availableUsers, setAvailableUsers] = useState<AuthUser[]>([])
  const [formData, setFormData] = useState({
    user: '',
    assignment: ''
  })
  const isEditMode = !!editingAssignment
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userSearchOpen, setUserSearchOpen] = useState(false)
  const [assignmentSearchOpen, setAssignmentSearchOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (editingAssignment) {
        setFormData({
          user: editingAssignment.user,
          assignment: editingAssignment.assignment
        })
      } else {
        setFormData({
          user: '',
          assignment: ''
        })
      }
      fetchUsers()
    } else {
      setFormData({
        user: '',
        assignment: ''
      })
      setError(null)
    }
  }, [isOpen, userAssignments, editingAssignment])

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true)
      const userData = await userService.getAllUsers()
      setUsers(userData)
      
      // Filter out users who already have an assignment
      const usersWithAssignments = new Set(
        userAssignments
          .filter(ua => ua.is_active && ua.id !== editingAssignment?.id) // Exclude current editing assignment
          .map(ua => ua.user)
      )
      const filtered = userData.filter(user => !usersWithAssignments.has(user.id))
      
      // In edit mode, ensure the current user is included
      if (isEditMode && editingAssignment) {
        const currentUser = userData.find(u => u.id === editingAssignment.user)
        if (currentUser && !filtered.find(u => u.id === currentUser.id)) {
          filtered.unshift(currentUser)
        }
      }
      
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
      if (isEditMode && editingAssignment) {
        await roleService.updateUserAssignment(editingAssignment.id, {
          assignment: formData.assignment
        })
      } else {
        await roleService.createUserAssignment({
          user: formData.user,
          assignment: formData.assignment
        })
      }
      onClose()
    } catch (err) {
      setError(isEditMode ? 'Failed to update user assignment' : 'Failed to create user assignment')
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} user assignment:`, err)
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
          <DialogTitle>{isEditMode ? 'Edit User Assignment' : 'Assign User to Facility'}</DialogTitle>
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
              {isEditMode ? (
                <div className="px-3 py-2 border rounded-md bg-muted">
                  {availableUsers.find(u => u.id === formData.user)?.email || formData.user}
                </div>
              ) : (
                <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={userSearchOpen}
                      className="w-full justify-between"
                      disabled={isLoadingUsers}
                    >
                      {formData.user
                        ? availableUsers.find((user) => user.id === formData.user)?.email || formData.user
                        : isLoadingUsers 
                        ? "Loading users..." 
                        : "Select a user..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search users..." />
                      <CommandEmpty>
                        {availableUsers.length === 0 && !isLoadingUsers
                          ? "All users already have assignments"
                          : "No user found."}
                      </CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {availableUsers.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={user.email || user.id}
                            onSelect={() => {
                              setFormData({ ...formData, user: user.id })
                              setUserSearchOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.user === user.id ? "opacity-100" : "opacity-0"
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

            <div className="grid gap-2">
              <Label htmlFor="assignment">Assignment</Label>
              <Popover open={assignmentSearchOpen} onOpenChange={setAssignmentSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={assignmentSearchOpen}
                    className="w-full justify-between"
                  >
                    {formData.assignment
                      ? assignments.find((assignment) => assignment.id === formData.assignment)?.description || 'No description'
                      : "Select an assignment..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search assignments..." />
                    <CommandEmpty>No assignment found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {assignments.map((assignment) => (
                        <CommandItem
                          key={assignment.id}
                          value={assignment.description || assignment.id}
                          onSelect={() => {
                            setFormData({ ...formData, assignment: assignment.id })
                            setAssignmentSearchOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.assignment === assignment.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {assignment.description || 'No description'}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (isEditMode ? 'Updating...' : 'Assigning...') : (isEditMode ? 'Update Assignment' : 'Assign User')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
