/*
 *  ███████╗███████╗██████╗  ██████╗
 *  ╚══███╔╝██╔════╝██╔══██╗██╔═══██╗
 *    ███╔╝ █████╗  ██████╔╝██║   ██║
 *   ███╔╝  ██╔══╝  ██╔══██╗██║   ██║
 *  ███████╗███████╗██║  ██║╚██████╔╝
 *  ╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝
 *  ZORG — Zero Organization
 */

import './tracing'
import './console-capture'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { config } from './config'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#0f0f0f',
              border: '1px solid rgba(0,255,65,0.35)',
              color: '#e8ffe8',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.75rem',
            },
          }}
        />
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
