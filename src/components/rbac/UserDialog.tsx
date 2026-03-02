import { FormEvent, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { UserWithStatus } from '@/services/userService'

interface UserDialogProps {
  isOpen: boolean
  mode: 'add' | 'edit'
  initialData?: UserWithStatus
  onClose: () => void
  onSubmit: (values: { name: string; email: string; isActive: boolean }) => Promise<void>
  onSendPasswordReset?: (email: string) => Promise<void>
}

export const UserDialog = ({ isOpen, mode, initialData, onClose, onSubmit, onSendPasswordReset }: UserDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    isActive: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingReset, setIsSendingReset] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name || '',
        email: initialData?.email || '',
        isActive: initialData?.is_active ?? true
      })
      setError(null)
      setSuccessMessage(null)
    }
  }, [isOpen, initialData])

  const handleClose = () => {
    setFormData({ name: '', email: '', isActive: true })
    setError(null)
    setSuccessMessage(null)
    onClose()
  }

  const handleSendPasswordReset = async () => {
    if (!onSendPasswordReset || !formData.email.trim()) {
      return
    }

    setIsSendingReset(true)
    setError(null)
    setSuccessMessage(null)

    try {
      await onSendPasswordReset(formData.email.trim())
      setSuccessMessage('Password reset email sent successfully!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send password reset email'
      setError(message)
    } finally {
      setIsSendingReset(false)
    }
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
          {successMessage && (
            <div className="rounded-md bg-green-500/15 px-4 py-2 text-sm text-green-600 dark:text-green-400">
              {successMessage}
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
          {mode === 'edit' && onSendPasswordReset && (
            <div className="pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleSendPasswordReset}
                disabled={isSendingReset || !formData.email.trim()}
                className="w-full"
              >
                {isSendingReset ? 'Sending...' : 'Send Password Reset Email'}
              </Button>
            </div>
          )}
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
