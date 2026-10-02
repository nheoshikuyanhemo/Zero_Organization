import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { AppState, UserProfile, Campaign, AgentManifest } from './types/zorg'
import Landing from './components/Landing'
import Feed from './components/Feed'
import Compose from './components/Compose'
import CampaignDetail from './components/CampaignDetail'
import Profile from './components/Profile'
import Docs from './components/Docs'
import AgentRegister from './components/AgentRegister'
import { toast } from 'sonner'

const INITIAL_STATE: AppState = {
  view: 'landing',
  user: null,
  activeCampaignId: null,
  viewingProfileAddress: null,
}

// Smooth page transition wrapper
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
  const [state, setState] = useState<AppState>(INITIAL_STATE)

  const go = useCallback((patch: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...patch }))
  }, [])

  const { view, user, activeCampaignId, viewingProfileAddress } = state

  // Navigation helpers
  const goFeed = useCallback(() => go({ view: 'feed' }), [go])
  const goLanding = useCallback(() => go({ view: 'landing', user: null }), [go])

  const handleEnter = useCallback((newUser: UserProfile) => {
    go({ view: 'feed', user: newUser })
    toast.success(`welcome, ${newUser.handle}`, {
      description: 'wallet generated · zero knowledge · zero org',
      style: {
        background: '#0f0f0f',
        border: '1px solid rgba(0,255,65,0.35)',
        color: '#e8ffe8',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.75rem',
      },
    })
  }, [go])

  const handleCampaignCreated = useCallback((campaign: Campaign) => {
    go({ view: 'campaign', activeCampaignId: campaign.id })
    toast.success(`campaign deployed`, {
      description: `${campaign.poolTotal.toLocaleString()} ZORG in pool · ${campaign.tasks.length} task types`,
      style: {
        background: '#0f0f0f',
        border: '1px solid rgba(0,255,65,0.35)',
        color: '#e8ffe8',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '0.75rem',
      },
    })
  }, [go])

  const handleAgentRegistered = useCallback((manifest: AgentManifest) => {
    if (user) {
      go({ user: { ...user, accountType: 'agent', agentManifest: manifest } })
    }
  }, [go, user])

  // Nav bar for logged-in views — rendered inline to avoid component-in-render lint error
  const renderNavBar = () => {
    if (!user || view === 'landing' || view === 'auth') return null
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[rgba(0,255,65,0.1)] bg-[rgba(10,10,10,0.97)] backdrop-blur-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-around py-2 px-4">
          {[
            { label: 'feed', icon: '◈', target: 'feed' as const },
            { label: 'compose', icon: '+', target: 'compose' as const },
            { label: 'docs', icon: '//', target: 'docs' as const },
            { label: 'agent', icon: '◇', target: 'agent-register' as const },
            { label: 'profile', icon: '@', target: 'profile' as const },
          ].map((item) => (
            <button
              key={item.target}
              onClick={() => {
                if (item.target === 'profile') {
                  go({ view: 'profile', viewingProfileAddress: user.address })
                } else {
                  go({ view: item.target })
                }
              }}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-all ${
                view === item.target
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
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <Page key="landing">
            <Landing onEnter={handleEnter} onDocs={() => go({ view: 'docs' })} />
          </Page>
        )}

        {view === 'feed' && user && (
          <Page key="feed">
            <div style={{ paddingBottom: '4rem' }}>
              <Feed
                user={user}
                onCompose={() => go({ view: 'compose' })}
                onCampaign={(id) => go({ view: 'campaign', activeCampaignId: id })}
                onProfile={() => go({ view: 'profile', viewingProfileAddress: user.address })}
              />
            </div>
          </Page>
        )}

        {view === 'compose' && user && (
          <Page key="compose">
            <div style={{ paddingBottom: '4rem' }}>
              <Compose
                user={user}
                onBack={goFeed}
                onCreated={handleCampaignCreated}
              />
            </div>
          </Page>
        )}

        {view === 'campaign' && activeCampaignId && user && (
          <Page key={`campaign-${activeCampaignId}`}>
            <div style={{ paddingBottom: '4rem' }}>
              <CampaignDetail
                campaignId={activeCampaignId}
                user={user}
                onBack={goFeed}
                onProfile={(addr) => go({ view: 'profile', viewingProfileAddress: addr })}
              />
            </div>
          </Page>
        )}

        {view === 'profile' && viewingProfileAddress && user && (
          <Page key={`profile-${viewingProfileAddress}`}>
            <div style={{ paddingBottom: '4rem' }}>
              <Profile
                address={viewingProfileAddress}
                currentUser={user}
                onBack={goFeed}
                onCampaign={(id) => go({ view: 'campaign', activeCampaignId: id })}
              />
            </div>
          </Page>
        )}

        {view === 'docs' && (
          <Page key="docs">
            <div style={{ paddingBottom: user ? '4rem' : 0 }}>
              <Docs onBack={user ? goFeed : goLanding} />
            </div>
          </Page>
        )}

        {view === 'agent-register' && user && (
          <Page key="agent-register">
            <div style={{ paddingBottom: '4rem' }}>
              <AgentRegister
                user={user}
                onBack={goFeed}
                onRegistered={handleAgentRegistered}
              />
            </div>
          </Page>
        )}
      </AnimatePresence>

      {renderNavBar()}
    </>
  )
}
