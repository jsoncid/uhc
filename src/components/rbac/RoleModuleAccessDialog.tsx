import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { roleService } from '@/services/roleService'
import { moduleService } from '@/services/moduleService'
import { Database } from '@/lib/supabase'

type Role = Database['public']['Tables']['role']['Row']
type Module = Database['public']['Tables']['module']['Row']
type RoleModuleAccess = Database['public']['Tables']['role_module_access']['Row']

interface RoleModuleAccessDialogProps {
  isOpen: boolean
  onClose: () => void
  role?: Role | null
  access?: RoleModuleAccess | null
}

export const RoleModuleAccessDialog = ({ isOpen, onClose, role, access }: RoleModuleAccessDialogProps) => {
  const [modules, setModules] = useState<Module[]>([])
  const [formData, setFormData] = useState({
    module: '',
    is_select: false,
    is_insert: false,
    is_update: false,
    is_delete: false,
    description: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchModules()
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && access) {
      // Edit mode - populate form with existing data
      setFormData({
        module: access.module,
        is_select: access.is_select,
        is_insert: access.is_insert,
        is_update: access.is_update,
        is_delete: access.is_delete,
        description: access.description || ''
      })
    } else if (!isOpen) {
      // Reset form when dialog closes
      setFormData({
        module: '',
        is_select: false,
        is_insert: false,
        is_update: false,
        is_delete: false,
        description: ''
      })
      setError(null)
    }
  }, [isOpen, access])

  const fetchModules = async () => {
    try {
      const data = await moduleService.getAllModules()
      setModules(data)
    } catch (err) {
      setError('Failed to fetch modules')
      console.error('Error fetching modules:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!role || !formData.module) {
      setError('Please select a module')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (access) {
        // Edit mode - update existing access
        await roleService.updateRoleModuleAccess(access.id, {
          is_select: formData.is_select,
          is_insert: formData.is_insert,
          is_update: formData.is_update,
          is_delete: formData.is_delete,
          description: formData.description || null
        })
      } else {
        // Create mode - create new access
        await roleService.createRoleModuleAccess({
          role: role.id,
          module: formData.module,
          is_select: formData.is_select,
          is_insert: formData.is_insert,
          is_update: formData.is_update,
          is_delete: formData.is_delete,
          description: formData.description || null
        })
      }
      onClose()
    } catch (err) {
      setError(access ? 'Failed to update role module access' : 'Failed to create role module access')
      console.error('Error with role module access:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      module: '',
      is_select: false,
      is_insert: false,
      is_update: false,
      is_delete: false,
      description: ''
    })
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {access ? 'Edit' : 'Create'} Module Access for Role: {role?.description}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="bg-destructive/15 text-destructive px-4 py-2 rounded-md">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Enter description for this access rule..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="module">Module</Label>
              <Select
                value={formData.module}
                onValueChange={(value) => setFormData({ ...formData, module: value })}
                disabled={!!access}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                     {module.description || 'No description'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3">
              <Label>Permissions</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_select"
                    checked={formData.is_select}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, is_select: checked as boolean })
                    }
                  />
                  <Label htmlFor="is_select">Select (Read)</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_insert"
                    checked={formData.is_insert}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, is_insert: checked as boolean })
                    }
                  />
                  <Label htmlFor="is_insert">Insert (Create)</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_update"
                    checked={formData.is_update}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, is_update: checked as boolean })
                    }
                  />
                  <Label htmlFor="is_update">Update (Modify)</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_delete"
                    checked={formData.is_delete}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, is_delete: checked as boolean })
                    }
                  />
                  <Label htmlFor="is_delete">Delete (Remove)</Label>
                </div>
              </div>
            </div>

            
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Access Rule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
