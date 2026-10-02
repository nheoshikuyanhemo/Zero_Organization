/*
 *  ███████╗████████╗██╗   ██╗██████╗ ██╗ ██████╗
 *  ██╔════╝╚══██╔══╝██║   ██║██╔══██╗██║██╔═══██╗
 *  ███████╗   ██║   ██║   ██║██║  ██║██║██║   ██║
 *  ╚════██║   ██║   ██║   ██║██║  ██║██║██║   ██║
 *  ███████║   ██║   ╚██████╔╝██████╔╝██║╚██████╔╝
 *  ╚══════╝   ╚═╝    ╚═════╝ ╚═════╝ ╚═╝ ╚═════╝
 *
 *  ZORG — Zero Organization
 */

import './tracing'
import './console-capture'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { config } from './config'
import App from './App'
import './index.css'

const queryClient = new QueryClient()

const PRIVY_APP_ID = import.meta.env.VITE_PRIVY_APP_ID as string

if (!PRIVY_APP_ID || PRIVY_APP_ID === 'your-privy-app-id-here') {
  console.warn('[ZORG] VITE_PRIVY_APP_ID not set — X login will use mock mode. Set it in .env to enable real Privy auth.')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivyProvider
      appId={PRIVY_APP_ID || 'clx0000000000000000000000'}
      config={{
        loginMethods: ['twitter'],
        appearance: {
          theme: 'dark',
          accentColor: '#00ff41',
          logo: '/zorg-logo.svg',
        },
        embeddedWallets: {
          ethereum: { createOnLogin: 'users-without-wallets' },
        },
      }}
    >
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <App />
          <Toaster position="top-center" />
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  </StrictMode>,
)
