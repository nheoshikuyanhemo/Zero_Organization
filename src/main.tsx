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

// Validate Privy App ID — Privy IDs start with "cl" and are >10 chars.
// The placeholder "your-privy-app-id-here" and "clx000..." both fail this check.
const RAW_ID = import.meta.env.VITE_PRIVY_APP_ID as string | undefined
const PRIVY_APP_ID = RAW_ID && RAW_ID.startsWith('cl') && RAW_ID.length > 10
  ? RAW_ID
  : null

if (!PRIVY_APP_ID) {
  console.info('[ZORG] No valid VITE_PRIVY_APP_ID — running in demo mode.')
}

const inner = (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster position="top-center" />
    </QueryClientProvider>
  </WagmiProvider>
)

// Only mount PrivyProvider when we have a real validated App ID.
// Mounting it with an invalid ID throws synchronously and crashes the whole tree.
const root = PRIVY_APP_ID
  ? (
    <PrivyProvider
      appId={PRIVY_APP_ID}
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
      {inner}
    </PrivyProvider>
  )
  : inner

createRoot(document.getElementById('root')!).render(
  <StrictMode>{root}</StrictMode>,
)
