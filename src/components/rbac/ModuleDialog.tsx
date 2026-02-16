import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { moduleService } from '@/services/moduleService'
import { Database } from '@/lib/supabase'

type Module = Database['public']['Tables']['module']['Row']

interface ModuleDialogProps {
  isOpen: boolean
  onClose: () => void
  module?: Module | null
}

export const ModuleDialog = ({ isOpen, onClose, module }: ModuleDialogProps) => {
  const [formData, setFormData] = useState({
    description: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (module) {
      setFormData({
        description: module.description || ''
      })
    } else {
      setFormData({
        description: ''
      })
    }
    setError(null)
  }, [module, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (module) {
        // Update existing module
        await moduleService.updateModule(module.id, {
          description: formData.description || null
        })
      } else {
        // Create new module
        await moduleService.createModule({
          description: formData.description || null
        })
      }
      onClose()
    } catch (err) {
      setError(module ? 'Failed to update module' : 'Failed to create module')
      console.error('Error saving module:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ description: '' })
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {module ? 'Edit Module' : 'Create New Module'}
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter module description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : module ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
