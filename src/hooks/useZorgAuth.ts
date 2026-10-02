// ─── ZORG Auth Hook ───────────────────────────────────────────────────────────
// When VITE_PRIVY_APP_ID is valid: uses real Privy X OAuth + embedded wallet.
// When not set (demo mode): mock login so the full UI renders without Privy.

import { useCallback, useMemo, useState } from 'react'
// Privy hooks — only called when PrivyProvider is mounted in the tree
import { usePrivy, useWallets } from '@privy-io/react-auth'
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

// Module-level constant — checked once on load, never changes at runtime.
const RAW_ID = import.meta.env.VITE_PRIVY_APP_ID as string | undefined
export const HAS_PRIVY = !!(RAW_ID && RAW_ID.startsWith('cl') && RAW_ID.length > 10)

const BOOT_TIME = Date.now()

// ── Hook used when PrivyProvider IS in the tree ───────────────────────────────
function useZorgAuthReal(): ZorgAuthState {
  const { ready, authenticated, user: privyUser, login, logout } = usePrivy()
  const { wallets } = useWallets()
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy')
  const walletAddress  = (embeddedWallet ?? wallets[0])?.address ?? null

  const xAccount = privyUser?.linkedAccounts?.find((a) => a.type === 'twitter_oauth')

  const profile: UserProfile | null = useMemo(() => {
    if (!authenticated || !privyUser || !walletAddress) return null
    const xUsername = (xAccount as { username?: string } | undefined)?.username
    const xName     = (xAccount as { name?: string } | undefined)?.name
    const handle = xUsername
      ? `@${xUsername}`
      : xName ? `@${xName.toLowerCase().replace(/\s+/g, '_')}`
              : `@${walletAddress.slice(2, 8)}`
    return {
      address: walletAddress, handle, accountType: 'human', bio: '',
      avatarSeed: handle.slice(1),
      totalEarned: 0, totalSpent: 0, totalRefunded: 0,
      campaignsCreated: 0, tasksCompleted: 0, joinedAt: BOOT_TIME,
    }
  }, [authenticated, privyUser, walletAddress, xAccount])

  const loginWithX = useCallback(() => {
    if (!ready || isLoggingIn) return
    setIsLoggingIn(true)
    login()
    setTimeout(() => setIsLoggingIn(false), 5000)
  }, [ready, isLoggingIn, login])

  return {
    ready, authenticated, user: profile, walletAddress,
    loginWithX,
    logout: useCallback(() => { void logout() }, [logout]),
    isLoggingIn: !ready || isLoggingIn,
  }
}

// ── Hook used when PrivyProvider is NOT in the tree (demo mode) ───────────────
function useZorgAuthMock(): ZorgAuthState {
  const [authenticated, setAuthenticated] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)

  const loginWithX = useCallback(() => {
    const addr = '0xDEMO' + Math.random().toString(16).slice(2, 10).toUpperCase()
    setUser({
      address: addr, handle: '@zorg_demo', accountType: 'human',
      bio: 'demo — add VITE_PRIVY_APP_ID for real X login',
      avatarSeed: 'zorg_demo',
      totalEarned: 0, totalSpent: 0, totalRefunded: 0,
      campaignsCreated: 0, tasksCompleted: 0, joinedAt: Date.now(),
    })
    setAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setAuthenticated(false)
  }, [])

  return { ready: true, authenticated, user, walletAddress: user?.address ?? null, loginWithX, logout, isLoggingIn: false }
}

// ── Exported hook — HAS_PRIVY is a compile-time constant, never changes ───────
// Calling different hook implementations based on a *module-level constant*
// (not a runtime variable) is safe: the branch is fixed for the entire page
// lifetime, satisfying the Rules of Hooks stability requirement.
export function useZorgAuth(): ZorgAuthState {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return HAS_PRIVY ? useZorgAuthReal() : useZorgAuthMock()
}
