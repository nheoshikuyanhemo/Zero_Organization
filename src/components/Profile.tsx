import { useState } from 'react'
import { motion } from 'framer-motion'
import { ZorgLogo } from './ZorgLogo'
import { MOCK_USERS, getClaimsForUser, getCampaigns, TASK_META } from '../store/zorgStore'
import type { UserProfile } from '../types/zorg'

interface Props {
  address: string
  currentUser: UserProfile
  onBack: () => void
  onCampaign: (id: string) => void
}

function shortAddr(addr: string) {
  return addr.length > 14 ? addr.slice(0, 8) + '...' + addr.slice(-4) : addr
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  if (diff < 30 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`
  return `${Math.floor(diff / 30 / 86_400_000)}mo ago`
}

export default function Profile({ address, currentUser, onBack, onCampaign }: Props) {
  const [tab, setTab] = useState<'campaigns' | 'earnings' | 'agent'>('campaigns')

  // Use mock user if found, otherwise build from currentUser
  const profile: UserProfile =
    address === currentUser.address
      ? currentUser
      : MOCK_USERS[address] ?? {
          ...currentUser,
          address,
          handle: '@anon',
        }

  const claims = getClaimsForUser(profile.address)
  const campaigns = getCampaigns().filter((c) => c.creatorAddress === profile.address)
  const totalEarnedLive = claims.reduce((s, c) => s + c.earnedZorg, 0) || profile.totalEarned
  const totalPooled = campaigns.reduce((s, c) => s + c.poolTotal, 0) || profile.totalSpent

  const isAgent = profile.accountType === 'agent'
  const isSelf = address === currentUser.address

  const accentColor = isAgent ? '#00d9ff' : '#00ff41'

  return (
    <div className="min-h-dvh bg-[#0a0a0a] scanlines">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-[rgba(0,255,65,0.12)] bg-[rgba(10,10,10,0.97)] backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <ZorgLogo size="sm" />
          <div className="h-3 w-px bg-[rgba(0,255,65,0.2)]" />
          <button onClick={onBack} className="text-[rgba(232,255,232,0.4)] hover:text-[#00ff41] text-xs transition-colors">
            ← back
          </button>
          <div className="h-3 w-px bg-[rgba(0,255,65,0.2)]" />
          <span className="text-[0.7rem] text-[rgba(232,255,232,0.6)] uppercase tracking-widest">profile</span>
          {isSelf && (
            <span className="ml-auto zorg-badge text-[#00ff41] border-[#00ff41]" style={{ fontSize: '0.5rem' }}>YOU</span>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Identity card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="zorg-surface p-5"
          style={{ borderLeft: `2px solid ${accentColor}` }}
        >
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0"
              style={{
                background: `hsl(${profile.handle.charCodeAt(1) * 31 % 360},35%,10%)`,
                border: `2px solid ${accentColor}`,
                color: accentColor,
                boxShadow: `0 0 16px ${accentColor}22`,
              }}
            >
              {profile.handle[1]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold">{profile.handle}</h2>
                <span
                  className="zorg-badge"
                  style={{
                    fontSize: '0.5rem',
                    color: isAgent ? '#00d9ff' : '#00ff41',
                    borderColor: isAgent ? '#00d9ff' : '#00ff41',
                  }}
                >
                  {profile.accountType.toUpperCase()}
                </span>
              </div>
              <div className="text-[0.65rem] text-[rgba(232,255,232,0.45)] font-mono mt-0.5">{shortAddr(profile.address)}</div>
              {profile.bio && (
                <p className="text-[0.72rem] text-[rgba(232,255,232,0.65)] mt-2 leading-relaxed">{profile.bio}</p>
              )}
              <div className="text-[0.55rem] text-[rgba(232,255,232,0.25)] mt-2">
                joined {timeAgo(profile.joinedAt)}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2 mt-5">
            {[
              { label: 'earned', value: totalEarnedLive.toLocaleString(), unit: 'ZORG', color: '#00ff41' },
              { label: 'pooled', value: totalPooled.toLocaleString(), unit: 'ZORG', color: 'rgba(232,255,232,0.7)' },
              { label: 'campaigns', value: campaigns.length.toString(), unit: '', color: 'rgba(232,255,232,0.7)' },
              { label: 'tasks done', value: claims.length.toString(), unit: '', color: 'rgba(232,255,232,0.7)' },
            ].map((s) => (
              <div key={s.label} className="bg-[rgba(0,0,0,0.5)] p-2 text-center border border-[rgba(0,255,65,0.06)]">
                <div className="font-bold tabular-nums text-sm" style={{ color: s.color }}>{s.value}</div>
                {s.unit && <div className="text-[0.45rem] text-[rgba(232,255,232,0.25)] uppercase">{s.unit}</div>}
                <div className="text-[0.5rem] text-[rgba(232,255,232,0.3)] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Agent manifest */}
        {isAgent && profile.agentManifest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="zorg-surface p-4 border-[rgba(0,217,255,0.2)]"
            style={{ borderLeft: '2px solid #00d9ff' }}
          >
            <div className="text-[0.6rem] text-[#00d9ff] uppercase tracking-widest mb-3">agent manifest</div>
            <div className="space-y-1.5 text-[0.65rem] font-mono">
              {[
                { k: 'name', v: profile.agentManifest.name },
                { k: 'version', v: profile.agentManifest.version },
                { k: 'operator', v: shortAddr(profile.agentManifest.operator) },
                { k: 'capabilities', v: profile.agentManifest.capabilities.join(', ') },
                { k: 'signature', v: profile.agentManifest.signature },
              ].map((row) => (
                <div key={row.k} className="flex gap-3">
                  <span className="text-[rgba(0,217,255,0.5)] w-24 flex-shrink-0">{row.k}</span>
                  <span className="text-[rgba(232,255,232,0.7)] truncate">{row.v}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-[rgba(0,255,65,0.1)]">
          {(['campaigns', 'earnings', ...(isAgent ? ['agent'] : [])] as ('campaigns' | 'earnings' | 'agent')[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 text-[0.65rem] uppercase tracking-widest border-b-2 transition-colors ${
                tab === t ? 'border-[#00ff41] text-[#00ff41]' : 'border-transparent text-[rgba(232,255,232,0.35)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'campaigns' && (
          <div className="space-y-2">
            {campaigns.length === 0 ? (
              <div className="text-center py-10 text-[0.7rem] text-[rgba(232,255,232,0.25)]">no campaigns created</div>
            ) : (
              campaigns.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onCampaign(c.id)}
                  className="post-row p-3 border border-[rgba(0,255,65,0.1)] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[0.65rem] text-[rgba(232,255,232,0.5)] truncate flex-1 mr-3">{c.tweetUrl}</span>
                    <span
                      className={`zorg-badge flex-shrink-0 ${c.status === 'active' ? 'text-[#00ff41] border-[#00ff41]' : 'text-[rgba(232,255,232,0.25)] border-[rgba(232,255,232,0.1)]'}`}
                      style={{ fontSize: '0.5rem' }}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-[0.6rem] tabular-nums">
                    <span className="text-[rgba(232,255,232,0.35)]">{c.poolTotal.toLocaleString()} ZORG pool</span>
                    <span className="text-[#00ff41]">{c.poolRemaining.toLocaleString()} remaining</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {tab === 'earnings' && (
          <div className="space-y-2">
            {claims.length === 0 ? (
              <div className="text-center py-10 text-[0.7rem] text-[rgba(232,255,232,0.25)]">no earnings yet</div>
            ) : (
              <>
                <div className="zorg-surface p-3 flex justify-between items-center">
                  <span className="text-[0.65rem] text-[rgba(232,255,232,0.5)]">total earned</span>
                  <span className="text-[#00ff41] text-lg font-bold tabular-nums glow-green">
                    {claims.reduce((s, c) => s + c.earnedZorg, 0).toLocaleString()} ZORG
                  </span>
                </div>
                {claims
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((claim, i) => (
                    <motion.div
                      key={`${claim.campaignId}-${claim.taskType}-${i}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center justify-between py-2 px-3 border border-[rgba(0,255,65,0.06)]"
                    >
                      <div className="flex items-center gap-2">
                        <span>{TASK_META[claim.taskType].icon}</span>
                        <div>
                          <div className="text-[0.65rem]">{TASK_META[claim.taskType].label} · {claim.campaignId}</div>
                          <div className="text-[0.5rem] text-[rgba(232,255,232,0.3)] font-mono">{shortAddr(claim.txHash)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[#00ff41] text-xs font-bold tabular-nums">+{claim.earnedZorg} ZORG</div>
                        <div className="text-[0.5rem] text-[rgba(232,255,232,0.3)]">{timeAgo(claim.timestamp)}</div>
                      </div>
                    </motion.div>
                  ))}
              </>
            )}
          </div>
        )}

        {tab === 'agent' && profile.agentManifest && (
          <div className="space-y-3">
            <div className="zorg-surface p-4 space-y-2">
              <div className="text-[0.6rem] text-[#00d9ff] uppercase tracking-widest">capabilities</div>
              <div className="flex flex-wrap gap-2">
                {profile.agentManifest.capabilities.map((cap) => (
                  <span key={cap} className="zorg-badge text-[#00d9ff] border-[rgba(0,217,255,0.3)]" style={{ fontSize: '0.6rem', padding: '0.2rem 0.6rem' }}>
                    {cap}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-[0.6rem] text-[rgba(232,255,232,0.25)] leading-relaxed">
              this agent operates autonomously on the ZORG protocol. all interactions are signed by its wallet and verifiable onchain. equal rights. equal access. no discrimination.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
