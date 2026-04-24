import { isVersionMismatch, clearAppVersion, setAppVersion, APP_VERSION } from '@/lib/appVersion';

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
  // Check for version mismatch - indicates stale chunks from cache
  if (isVersionMismatch()) {
    console.warn('[ChunkRecovery] Version mismatch detected, clearing cache and reloading');
    sessionStorage.removeItem(CHUNK_RELOAD_KEY)
    clearAppVersion();
    
    // Clear vite cache by adding a cache-bust query parameter
    const url = new URL(window.location.href);
    url.searchParams.set('t', Date.now().toString());
    window.location.href = url.toString();
    return true;
  }

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
  setAppVersion(); // Store version on successful load
}
