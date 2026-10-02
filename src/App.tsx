import { useState, useCallback, useEffect } from 'react'
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

export default function App() {
  const { authenticated, user, loginWithX, logout, ready } = useZorgAuth()

  const [view, setView]                         = useState<AppState['view']>('landing')
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null)
  const [viewingProfile,   setViewingProfile]   = useState<string | null>(null)

  useEffect(() => {
    if (authenticated && user && view === 'landing') {
      setTimeout(() => {
        setView('feed')
        toast.success(`welcome, ${user.handle}`, {
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
      description: `${campaign.poolTotal.toLocaleString()} ZORG in pool`,
      style: { background: '#0f0f0f', border: '1px solid rgba(0,255,65,0.35)', color: '#e8ffe8', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' },
    })
  }, [])

  const handleAgentRegistered = useCallback((_manifest: AgentManifest) => {
    toast.success('agent registered', {
      description: 'manifest signed onchain',
      style: { background: '#0f0f0f', border: '1px solid rgba(0,217,255,0.35)', color: '#e8ffe8', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' },
    })
  }, [])

  const showNav = !!user && view !== 'landing' && view !== 'auth'

  return (
    <div className="min-h-dvh bg-[#0a0a0a]">
      <HackerBackground />

      {/* Views — simple conditional render, no AnimatePresence */}
      {(view === 'landing' || !authenticated) && (
        <Landing loginWithX={loginWithX} onDocs={() => setView('docs')} />
      )}

      {view === 'feed' && authenticated && user && (
        <div className="pb-16">
          <Feed
            user={user}
            onCompose={() => setView('compose')}
            onCampaign={(id) => { setActiveCampaignId(id); setView('campaign') }}
            onProfile={() => { setViewingProfile(user.address); setView('profile') }}
          />
        </div>
      )}

      {view === 'compose' && authenticated && user && (
        <div className="pb-16">
          <Compose user={user} onBack={goFeed} onCreated={handleCampaignCreated} />
        </div>
      )}

      {view === 'campaign' && activeCampaignId && authenticated && user && (
        <div className="pb-16">
          <CampaignDetail
            campaignId={activeCampaignId}
            user={user}
            onBack={goFeed}
            onProfile={(addr) => { setViewingProfile(addr); setView('profile') }}
          />
        </div>
      )}

      {view === 'profile' && viewingProfile && authenticated && user && (
        <div className="pb-16">
          <Profile
            address={viewingProfile}
            currentUser={user}
            onBack={goFeed}
            onCampaign={(id) => { setActiveCampaignId(id); setView('campaign') }}
          />
        </div>
      )}

      {view === 'docs' && (
        <div className={user ? 'pb-16' : ''}>
          <Docs onBack={authenticated && user ? goFeed : goLanding} />
        </div>
      )}

      {view === 'agent-register' && authenticated && user && (
        <div className="pb-16">
          <AgentRegister user={user} onBack={goFeed} onRegistered={handleAgentRegistered} />
        </div>
      )}

      {/* Bottom nav */}
      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[rgba(0,255,65,0.1)] bg-[rgba(10,10,10,0.97)] backdrop-blur-sm">
          <div className="max-w-2xl mx-auto flex items-center justify-around py-2 px-4">
            {[
              { label: 'feed',    icon: '◈', v: 'feed' },
              { label: 'post',    icon: '+', v: 'compose' },
              { label: 'docs',    icon: '//', v: 'docs' },
              { label: 'agent',   icon: '◇', v: 'agent-register' },
              { label: 'profile', icon: '@', v: 'profile', action: () => { setViewingProfile(user.address); setView('profile') } },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action ?? (() => setView(item.v as AppState['view']))}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-all ${
                  view === item.v || (item.v === 'feed' && view === 'campaign')
                    ? 'text-[#00ff41]'
                    : 'text-[rgba(232,255,232,0.3)] hover:text-[rgba(232,255,232,0.6)]'
                }`}
              >
                <span className="text-sm leading-none font-mono">{item.icon}</span>
                <span className="text-[0.45rem] uppercase tracking-widest font-mono">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
