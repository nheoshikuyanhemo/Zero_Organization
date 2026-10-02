// ─── ZORG Auth ────────────────────────────────────────────────────────────────
// Demo mode until a real Privy App ID is provided.
// To enable real X (Twitter) login:
//   1. Get a Privy App ID from https://privy.io
//   2. Add VITE_PRIVY_APP_ID=clYOUR_ID to .env
//   3. Uncomment the Privy integration below

import { useCallback, useState } from 'react'
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

export function useZorgAuth(): ZorgAuthState {
  const [authenticated, setAuthenticated] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const loginWithX = useCallback(() => {
    if (isLoggingIn) return
    setIsLoggingIn(true)
    // Simulate network delay for realism
    setTimeout(() => {
      const addr = '0x' + Array.from({ length: 40 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')
      setUser({
        address: addr,
        handle: '@zorg_user',
        accountType: 'human',
        bio: 'zero organization. zero knowledge. total freedom.',
        avatarSeed: 'zorg_user',
        totalEarned: 0,
        totalSpent: 0,
        totalRefunded: 0,
        campaignsCreated: 0,
        tasksCompleted: 0,
        joinedAt: Date.now(),
      })
      setAuthenticated(true)
      setIsLoggingIn(false)
    }, 800)
  }, [isLoggingIn])

  const logout = useCallback(() => {
    setAuthenticated(false)
    setUser(null)
  }, [])

  return {
    ready: true,
    authenticated,
    user,
    walletAddress: user?.address ?? null,
    loginWithX,
    logout,
    isLoggingIn,
  }
}
