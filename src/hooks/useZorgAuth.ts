// ─── ZORG Auth Hook ───────────────────────────────────────────────────────────
// Wraps Privy's usePrivy + useWallets to produce a ZORG UserProfile.
// X (Twitter) OAuth is the primary login method.
// The embedded wallet is auto-created by Privy on first login (config: createOnLogin).

import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useCallback, useMemo, useState } from 'react'
import type { UserProfile } from '../types/zorg'

export interface ZorgAuthState {
  ready: boolean
  authenticated: boolean
  user: UserProfile | null
  walletAddress: string | null
  loginWithX: () => void
  logout: () => void
  isLoggingIn: boolean
}

// Stable timestamp — outside component so it never causes purity warnings
const BOOT_TIME = Date.now()

export function useZorgAuth(): ZorgAuthState {
  const { ready, authenticated, user: privyUser, login, logout } = usePrivy()
  const { wallets } = useWallets()

  // Track whether login was initiated
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Pick the embedded wallet first, then any external wallet
  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy')
  const anyWallet      = embeddedWallet ?? wallets[0]
  const walletAddress  = anyWallet?.address ?? null

  // Extract X (Twitter) linked account
  const xAccount = privyUser?.linkedAccounts?.find(
    (a) => a.type === 'twitter_oauth'
  )

  // Build ZORG UserProfile from Privy user data
  const profile: UserProfile | null = useMemo(() => {
    if (!authenticated || !privyUser || !walletAddress) return null

    const xUsername = (xAccount as { username?: string } | undefined)?.username
    const xName     = (xAccount as { name?: string }     | undefined)?.name
    const handle = xUsername
      ? `@${xUsername}`
      : xName
        ? `@${xName.toLowerCase().replace(/\s+/g, '_')}`
        : `@${walletAddress.slice(2, 8)}`

    return {
      address: walletAddress,
      handle,
      accountType: 'human',
      bio: '',
      avatarSeed: handle.slice(1),
      totalEarned: 0,
      totalSpent: 0,
      totalRefunded: 0,
      campaignsCreated: 0,
      tasksCompleted: 0,
      // Use module-level constant — avoids "impure Date.now in render" lint error
      joinedAt: BOOT_TIME,
    }
  }, [authenticated, privyUser, walletAddress, xAccount])

  // Login with X — calls Privy's login() which opens the OAuth modal.
  // loginMethods=['twitter'] is set in PrivyProvider so only X is shown.
  const loginWithX = useCallback(() => {
    if (!ready || isLoggingIn) return
    setIsLoggingIn(true)
    login()
    // Reset loading state after 5s (Privy calls back via state change, not a promise)
    setTimeout(() => setIsLoggingIn(false), 5000)
  }, [ready, isLoggingIn, login])

  const handleLogout = useCallback(() => {
    void logout()
  }, [logout])

  return {
    ready,
    authenticated,
    user: profile,
    walletAddress,
    loginWithX,
    logout: handleLogout,
    isLoggingIn: !ready || isLoggingIn,
  }
}
