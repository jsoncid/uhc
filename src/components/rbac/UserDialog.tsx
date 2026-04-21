import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Copy, Check } from 'lucide-react'
import type { UserWithStatus } from '@/services/userService'

interface UserDialogProps {
  isOpen: boolean
  initialData?: UserWithStatus
  onClose: () => void
  onSendPasswordReset: (email: string) => Promise<void>
  onGenerateResetLink: (email: string) => Promise<string | null>
}

export const UserDialog = ({ isOpen, initialData, onClose, onSendPasswordReset, onGenerateResetLink }: UserDialogProps) => {
  const [isSendingReset, setIsSendingReset] = useState(false)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [resetLink, setResetLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setError(null)
      setSuccessMessage(null)
      setResetLink(null)
      setIsCopied(false)
    }
  }, [isOpen])

  const handleClose = () => {
    setError(null)
    setSuccessMessage(null)
    setResetLink(null)
    setIsCopied(false)
    onClose()
  }

  const handleSendPasswordReset = async () => {
    if (!initialData?.email) {
      return
    }

    setIsSendingReset(true)
    setError(null)
    setSuccessMessage(null)
    setResetLink(null)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let _emailSent = false
    let linkGenerated = false

    try {
      // Send email first
      await onSendPasswordReset(initialData.email)
      _emailSent = true
      
      // Then try to generate link
      try {
        const link = await onGenerateResetLink(initialData.email)
        if (link) {
          setResetLink(link)
          linkGenerated = true
        }
      } catch (linkErr) {
        console.error('Failed to generate link:', linkErr)
        // Email was sent, but link generation failed
        let linkMessage = 'Could not generate link';
        if (linkErr instanceof Error) {
          linkMessage = linkErr.message;
        } else if (typeof linkErr === 'string') {
          linkMessage = linkErr;
        } else if (linkErr && typeof linkErr === 'object') {
          linkMessage = JSON.stringify(linkErr);
        }
        setSuccessMessage(`Password reset email sent successfully! However, ${linkMessage}`)
        setIsSendingReset(false)
        return
      }

      if (linkGenerated) {
        setSuccessMessage('Password reset email sent successfully! Copy the link below to share.')
      } else {
        setSuccessMessage('Password reset email sent successfully!')
      }
    } catch (err) {
      let message = 'Failed to send password reset email';
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'string') {
        message = err;
      } else if (err && typeof err === 'object') {
        message = JSON.stringify(err);
      }
      setError(message)
    } finally {
      setIsSendingReset(false)
    }
  }

  const handleGenerateLink = async () => {
    if (!initialData?.email) {
      return
    }

    setIsGeneratingLink(true)
    setError(null)
    setSuccessMessage(null)
    setResetLink(null)

    try {
      const link = await onGenerateResetLink(initialData.email)
      if (link) {
        setResetLink(link)
        setSuccessMessage('Password reset link generated successfully!')
      } else {
        setError('Failed to generate password reset link')
      }
    } catch (err) {
      let message = 'Failed to generate password reset link';
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'string') {
        message = err;
      } else if (err && typeof err === 'object') {
        message = JSON.stringify(err);
      }
      setError(message)
    } finally {
      setIsGeneratingLink(false)
    }
  }

  const handleCopyLink = async () => {
    if (!resetLink) return

    try {
      await navigator.clipboard.writeText(resetLink)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      setError('Failed to copy link to clipboard')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reset Password for {initialData?.name || initialData?.email}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
          <p className="text-sm text-muted-foreground">
            Manage password reset for <strong>{initialData?.email}</strong>
          </p>
          <div className="space-y-2">
            <Button
              type="button"
              onClick={handleSendPasswordReset}
              disabled={isSendingReset || isGeneratingLink}
              className="w-full"
            >
              {isSendingReset ? 'Sending...' : 'Send Email & Get Link'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleGenerateLink}
              disabled={isSendingReset || isGeneratingLink}
              className="w-full"
            >
              {isGeneratingLink ? 'Generating...' : 'Generate Link Only'}
            </Button>
          </div>
          {resetLink && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={resetLink}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
