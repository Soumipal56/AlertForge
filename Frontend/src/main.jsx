import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App'
import { ClerkProvider } from '@clerk/react'
import { neobrutalism } from '@clerk/ui/themes'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider appearance={{
      theme: neobrutalism,
    }}>
      <App />
    </ClerkProvider>
  </StrictMode>,
)