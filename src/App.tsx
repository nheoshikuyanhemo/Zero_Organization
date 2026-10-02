import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { AppState, Campaign, AgentManifest } from './types/zorg'
import { useZorgAuth } from './hooks/useZorgAuth'
import { HackerBackground } from './components/HackerBackground'
import { Landing } from './components/Landing'
import Feed from './components/Feed'
import Compose from './components/Compose'
import CampaignDetail from './components/CampaignDetail'
import Profile from './components/Profile'
import Docs from './components/Docs'
import AgentRegister from './components/AgentRegister'
import { toast } from 'sonner'

function Page({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const { authenticated, user, loginWithX, logout, ready, isLoggingIn: _isLoggingIn } = useZorgAuth()

  const [view, setView]                           = useState<AppState['view']>('landing')
  const [activeCampaignId, setActiveCampaignId]   = useState<string | null>(null)
  const [viewingProfile,   setViewingProfile]     = useState<string | null>(null)

  // When Privy auth completes and user becomes available, auto-navigate to feed
  // Using startTransition to avoid synchronous setState-in-effect lint errors
  useEffect(() => {
    if (authenticated && user && view === 'landing') {
      const handle = user.handle
      setTimeout(() => {
        setView('feed')
        toast.success(`welcome, ${handle}`, {
          description: 'wallet ready · zero knowledge · zero org',
          style: {
            background: '#0f0f0f',
            border: '1px solid rgba(0,255,65,0.35)',
            color: '#e8ffe8',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.75rem',
          },
        })
      }, 0)
    }
  }, [authenticated, user, view])

  // When user logs out, go back to landing
  useEffect(() => {
    if (ready && !authenticated && view !== 'landing' && view !== 'docs') {
      setTimeout(() => setView('landing'), 0)
    }
  }, [ready, authenticated, view])

  const goFeed    = useCallback(() => setView('feed'), [])
  const goLanding = useCallback(() => { void logout(); setView('landing') }, [logout])

  const handleCampaignCreated = useCallback((campaign: Campaign) => {
    setActiveCampaignId(campaign.id)
    setView('campaign')
    toast.success('campaign deployed', {
      description: `${campaign.poolTotal.toLocaleString()} ZORG in pool · ${campaign.tasks.length} task types`,
      style: {
        background: '#0f0f0f',
        border: '1px solid rgba(0,255,65,0.35)',
        color: '#e8ffe8',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.75rem',
      },
    })
  }, [])

  const handleAgentRegistered = useCallback((_manifest: AgentManifest) => {
    toast.success('agent registered', {
      description: 'manifest signed onchain',
      style: { background: '#0f0f0f', border: '1px solid rgba(0,217,255,0.35)', color: '#e8ffe8', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' },
    })
  }, [])

  const renderNavBar = () => {
    if (!user || view === 'landing' || view === 'auth') return null
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[rgba(0,255,65,0.1)] bg-[rgba(10,10,10,0.97)] backdrop-blur-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-around py-2 px-4">
          {[
            { label: 'feed',    icon: '◈', action: () => setView('feed') },
            { label: 'compose', icon: '+', action: () => setView('compose') },
            { label: 'docs',    icon: '//', action: () => setView('docs') },
            { label: 'agent',   icon: '◇', action: () => setView('agent-register') },
            { label: 'profile', icon: '@', action: () => { setViewingProfile(user.address); setView('profile') } },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-all ${
                view === item.label || (item.label === 'feed' && view === 'campaign')
                  ? 'text-[#00ff41]'
                  : 'text-[rgba(232,255,232,0.3)] hover:text-[rgba(232,255,232,0.6)]'
              }`}
            >
              <span className="text-sm leading-none" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {item.icon}
              </span>
              <span className="text-[0.45rem] uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Global hacker background — matrix rain, data streams, glitch flash, hex ticker */}
      <HackerBackground />

      <AnimatePresence mode="wait">
        {(view === 'landing' || !authenticated) && (
          <Page key="landing">
            <Landing
              loginWithX={loginWithX}
              onDocs={() => setView('docs')}
            />
          </Page>
        )}

        {view === 'feed' && authenticated && user && (
          <Page key="feed">
            <div style={{ paddingBottom: '4rem' }}>
              <Feed
                user={user}
                onCompose={() => setView('compose')}
                onCampaign={(id) => { setActiveCampaignId(id); setView('campaign') }}
                onProfile={() => { setViewingProfile(user.address); setView('profile') }}
              />
            </div>
          </Page>
        )}

        {view === 'compose' && authenticated && user && (
          <Page key="compose">
            <div style={{ paddingBottom: '4rem' }}>
              <Compose user={user} onBack={goFeed} onCreated={handleCampaignCreated} />
            </div>
          </Page>
        )}

        {view === 'campaign' && activeCampaignId && authenticated && user && (
          <Page key={`campaign-${activeCampaignId}`}>
            <div style={{ paddingBottom: '4rem' }}>
              <CampaignDetail
                campaignId={activeCampaignId}
                user={user}
                onBack={goFeed}
                onProfile={(addr) => { setViewingProfile(addr); setView('profile') }}
              />
            </div>
          </Page>
        )}

        {view === 'profile' && viewingProfile && authenticated && user && (
          <Page key={`profile-${viewingProfile}`}>
            <div style={{ paddingBottom: '4rem' }}>
              <Profile
                address={viewingProfile}
                currentUser={user}
                onBack={goFeed}
                onCampaign={(id) => { setActiveCampaignId(id); setView('campaign') }}
              />
            </div>
          </Page>
        )}

        {view === 'docs' && (
          <Page key="docs">
            <div style={{ paddingBottom: user ? '4rem' : 0 }}>
              <Docs onBack={authenticated && user ? goFeed : goLanding} />
            </div>
          </Page>
        )}

        {view === 'agent-register' && authenticated && user && (
          <Page key="agent-register">
            <div style={{ paddingBottom: '4rem' }}>
              <AgentRegister user={user} onBack={goFeed} onRegistered={handleAgentRegistered} />
            </div>
          </Page>
        )}
      </AnimatePresence>

      {renderNavBar()}
    </>
  )
}
