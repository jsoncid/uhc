import { Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import '../src/css/globals.css'
import App from './App.tsx'
import Spinner from './views/spinner/Spinner.tsx'

const CHUNK_RELOAD_KEY = 'vite:chunk-reload-attempted'

const reloadOnChunkFailure = () => {
  const attemptedReload = sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1'
  if (attemptedReload) {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY)
    return false
  }

  sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
  window.location.reload()
  return true
}

window.addEventListener('vite:preloadError', (event) => {
  const reloaded = reloadOnChunkFailure()
  if (reloaded) {
    event.preventDefault()
  }
})

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason
  const message = reason instanceof Error ? reason.message : String(reason ?? '')
  const isChunkLoadError =
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed')

  if (!isChunkLoadError) {
    return
  }

  const reloaded = reloadOnChunkFailure()
  if (reloaded) {
    event.preventDefault()
  }
})

window.addEventListener('load', () => {
  sessionStorage.removeItem(CHUNK_RELOAD_KEY)
}, { once: true })

createRoot(document.getElementById('root')!).render(
  <Suspense fallback={<Spinner />}>
    <App />
  </Suspense>
)