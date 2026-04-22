import { Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import '../src/css/globals.css'
import App from './App.tsx'
import Spinner from './views/spinner/Spinner.tsx'
import {
  attemptChunkRecoveryReload,
  clearChunkRecoveryFlag,
  isChunkLoadError,
} from './utils/chunkRecovery'

window.addEventListener('vite:preloadError', (event) => {
  const reloaded = attemptChunkRecoveryReload()
  if (reloaded) {
    event.preventDefault()
  }
})

window.addEventListener('unhandledrejection', (event) => {
  if (!isChunkLoadError(event.reason)) {
    return
  }

  const reloaded = attemptChunkRecoveryReload()
  if (reloaded) {
    event.preventDefault()
  }
})

window.addEventListener('load', () => {
  clearChunkRecoveryFlag()
}, { once: true })

createRoot(document.getElementById('root')!).render(
  <Suspense fallback={<Spinner />}>
    <App />
  </Suspense>
)