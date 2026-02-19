import type { Session, User } from '@supabase/supabase-js'
import { beforeEach, describe, expect, it, Mock, vi } from 'vitest'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '../useAuthStore'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      refreshSession: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

const mockRefreshSession = supabase.auth.refreshSession as Mock

const setStoreState = (state: Partial<{ user: User | null; sessionExpiry: number | null; isLoading: boolean; error: string | null }> = {}) => {
  useAuthStore.setState({
    user: null,
    sessionExpiry: null,
    isLoading: false,
    error: null,
    ...state,
  })
}

const ensureSessionValid = (options?: { refreshOnExpired?: boolean }) =>
  useAuthStore.getState().ensureSessionValid(options)

describe('useAuthStore ensureSessionValid helper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setStoreState()
  })

  it('returns true when no expiry is stored', async () => {
    const result = await ensureSessionValid()

    expect(result).toBe(true)
  })

  it('detects an expired session', async () => {
    setStoreState({ sessionExpiry: Date.now() - 1000 })

    const result = await ensureSessionValid()

    expect(result).toBe(false)
  })

  it('can refresh when requested', async () => {
    const expiresAtSeconds = Math.floor(Date.now() / 1000) + 60
    const mockSession = ({
      user: { id: 'user-refresh' } as User,
      expires_at: expiresAtSeconds,
    } as unknown) as Session

    mockRefreshSession.mockResolvedValue({ data: { session: mockSession }, error: null })
    setStoreState({ sessionExpiry: Date.now() - 1000 })

    const result = await ensureSessionValid({ refreshOnExpired: true })

    expect(result).toBe(true)
    expect(mockRefreshSession).toHaveBeenCalled()
    expect(useAuthStore.getState().user).toEqual(mockSession.user)
    expect(useAuthStore.getState().sessionExpiry).toBe(expiresAtSeconds * 1000)
  })
})

describe('useAuthStore refreshSession helper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setStoreState()
  })

  it('refreshes and returns false when refresh fails', async () => {
    mockRefreshSession.mockRejectedValue(new Error('refresh failed'))

    const result = await useAuthStore.getState().refreshSession()

    expect(result).toBe(false)
  })

  it('refreshes successfully when the API returns a valid session', async () => {
    const expiresAtSeconds = Math.floor(Date.now() / 1000) + 60
    const mockSession = ({
      user: { id: 'user-refresh' } as User,
      expires_at: expiresAtSeconds,
    } as unknown) as Session

    mockRefreshSession.mockResolvedValue({ data: { session: mockSession }, error: null })

    const result = await useAuthStore.getState().refreshSession()

    expect(result).toBe(true)
    expect(useAuthStore.getState().user).toEqual(mockSession.user)
    expect(useAuthStore.getState().sessionExpiry).toBe(expiresAtSeconds * 1000)
  })
})
