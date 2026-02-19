import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { assignmentService } from '@/services/assignmentService'
import { Database } from '@/lib/supabase'

type Assignment = Database['module3']['Tables']['assignment']['Row']

interface AssignmentDialogProps {
  isOpen: boolean
  onClose: () => void
  assignment?: Assignment | null
}

export const AssignmentDialog = ({ isOpen, onClose, assignment }: AssignmentDialogProps) => {
  const [formData, setFormData] = useState({
    description: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (assignment) {
      setFormData({
        description: assignment.description || ''
      })
    } else {
      setFormData({
        description: ''
      })
    }
    setError(null)
  }, [assignment, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (assignment) {
        // Update existing assignment
        await assignmentService.updateAssignment(assignment.id, {
          description: formData.description || null
        })
      } else {
        // Create new assignment
        await assignmentService.createAssignment({
          description: formData.description || null
        })
      }
      onClose()
    } catch (err) {
      setError(assignment ? 'Failed to update assignment' : 'Failed to create assignment')
      console.error('Error saving assignment:', err)
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
            {assignment ? 'Edit Assignment' : 'Create New Assignment'}
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
                placeholder="Enter assignment description..."
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
              {isLoading ? 'Saving...' : assignment ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
