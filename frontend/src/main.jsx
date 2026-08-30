import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Manage PWA Service Worker (only active in production to prevent caching Vite dev chunks)
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('PWA ServiceWorker registered:', reg.scope))
        .catch((err) => console.warn('PWA ServiceWorker registration failed:', err));
    });
  } else {
    // In dev mode, unregister any existing service worker to prevent stale React chunk collisions
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister();
      }
    });
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
