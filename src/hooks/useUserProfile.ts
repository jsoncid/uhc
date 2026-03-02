import { useState, useEffect, useCallback } from 'react'
import { userService, UserProfileData } from '@/services/userService'

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await userService.getCurrentUserProfile()
      
      // Fetch profile picture if user data exists
      if (data) {
        const userName = data.email.split('@')[0]
        const profilePictureUrl = await userService.getProfilePictureUrl(userName, data.id)
        data.profilePictureUrl = profilePictureUrl || undefined
      }
      
      setProfile(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile
  }
}
