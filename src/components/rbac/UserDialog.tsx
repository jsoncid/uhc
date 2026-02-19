import { FormEvent, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { UserWithStatus } from '@/services/userService'

interface UserDialogProps {
  isOpen: boolean
  mode: 'add' | 'edit'
  initialData?: UserWithStatus
  onClose: () => void
  onSubmit: (values: { name: string; email: string; isActive: boolean }) => Promise<void>
}

export const UserDialog = ({ isOpen, mode, initialData, onClose, onSubmit }: UserDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    isActive: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name || '',
        email: initialData?.email || '',
        isActive: initialData?.is_active ?? true
      })
      setError(null)
    }
  }, [isOpen, initialData])

  const handleClose = () => {
    setFormData({ name: '', email: '', isActive: true })
    setError(null)
    onClose()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!formData.email.trim()) {
      setError('Email is required')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await onSubmit({
        name: formData.name.trim(),
        email: formData.email.trim(),
        isActive: formData.isActive
      })
      handleClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save user'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add User' : 'Edit User'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="user-name">Name</Label>
            <Input
              id="user-name"
              value={formData.name}
              onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-email">Email</Label>
            <Input
              id="user-email"
              type="email"
              value={formData.email}
              onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="user@example.com"
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="user-active"
              checked={formData.isActive}
              onCheckedChange={(value) =>
                setFormData((prev) => ({ ...prev, isActive: value }))
              }
            />
            <Label htmlFor="user-active" className="mb-0">
              {formData.isActive ? 'Active' : 'Inactive'}
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : mode === 'add' ? 'Add User' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
