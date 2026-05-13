const CHUNK_RELOAD_KEY = 'vite:chunk-reload-attempted'

export const isChunkLoadError = (error: unknown): boolean => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : String(error ?? '')

  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed')
  )
}

export const attemptChunkRecoveryReload = (): boolean => {
  const attemptedReload = sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1'

  if (attemptedReload) {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY)
    return false
  }

  sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
  window.location.reload()
  return true
}

export const clearChunkRecoveryFlag = (): void => {
  sessionStorage.removeItem(CHUNK_RELOAD_KEY)
}
