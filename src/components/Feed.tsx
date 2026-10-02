import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getCampaigns, TASK_META } from '../store/zorgStore'
import type { Campaign, UserProfile } from '../types/zorg'
import { ZorgLogo } from './ZorgLogo'

interface Props {
  user: UserProfile
  onCompose: () => void
  onCampaign: (id: string) => void
  onProfile: () => void
}

type FeedFilter = 'all' | 'active' | 'completed' | 'mine'

function timeAgo(ms: number): string {
  const d = Date.now() - ms
  if (d < 60_000) return 'just now'
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`
  return `${Math.floor(d / 86_400_000)}d ago`
}

function timeLeft(ms: number): string {
  const d = ms - Date.now()
  if (d <= 0) return 'expired'
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m left`
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h left`
  return `${Math.floor(d / 86_400_000)}d left`
}

function PoolBar({ total, remaining }: { total: number; remaining: number }) {
  const pct = total > 0 ? ((total - remaining) / total) * 100 : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[0.68rem] text-[rgba(232,255,232,0.4)] tabular-nums">
        <span>{(total - remaining).toLocaleString()} claimed</span>
        <span>{remaining.toLocaleString()} left</span>
      </div>
      <div className="h-1.5 bg-[rgba(0,255,65,0.08)] overflow-hidden">
        <motion.div
          className="h-full bg-[#00ff41]"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          style={{ boxShadow: '0 0 6px rgba(0,255,65,0.5)' }}
        />
      </div>
      <div className="text-[0.6rem] text-[rgba(232,255,232,0.2)] tabular-nums">{pct.toFixed(1)}% drained</div>
    </div>
  )
}

function CampaignCard({ campaign, onClick }: { campaign: Campaign; onClick: () => void }) {
  const totalSlots = campaign.tasks.reduce((s, t) => s + t.maxUsers, 0)
  const claimedSlots = campaign.tasks.reduce((s, t) => s + t.claimed, 0)
  const topReward = Math.max(...campaign.tasks.map((t) => t.rewardPerUser))
  const isActive = campaign.status === 'active'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      onClick={onClick}
      className="post-row zorg-surface p-4 cursor-pointer"
      style={{ borderLeft: `3px solid ${isActive ? '#00ff41' : 'rgba(232,255,232,0.08)'}` }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
            style={{
              background: `hsl(${(campaign.creatorHandle.charCodeAt(1) * 37) % 360},35%,10%)`,
              border: '1px solid rgba(0,255,65,0.3)',
              color: '#00ff41',
            }}
          >
            {campaign.creatorHandle[1]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm text-[#e8ffe8] font-semibold truncate max-w-[140px]">
                {campaign.creatorHandle}
              </span>
              {campaign.creatorType === 'agent' && (
                <span className="zorg-badge text-[0.58rem] text-[#00d9ff] border-[#00d9ff]">AGENT</span>
              )}
            </div>
            <div className="text-[0.65rem] text-[rgba(232,255,232,0.3)] mt-0.5">
              {timeAgo(campaign.createdAt)}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span
            className={`zorg-badge text-[0.6rem] ${
              isActive
                ? 'text-[#00ff41] border-[#00ff41]'
                : campaign.status === 'refunded'
                ? 'text-[#00d9ff] border-[#00d9ff]'
                : 'text-[rgba(232,255,232,0.3)] border-[rgba(232,255,232,0.15)]'
            }`}
          >
            {campaign.status}
          </span>
          {isActive && (
            <span className="text-[0.6rem] text-[rgba(232,255,232,0.3)]">{timeLeft(campaign.expiresAt)}</span>
          )}
        </div>
      </div>

      {/* Tweet preview */}
      <div className="mb-3 p-3 bg-[rgba(0,0,0,0.5)] border border-[rgba(0,255,65,0.07)]">
        <div className="text-[0.65rem] text-[rgba(0,217,255,0.55)] mb-1.5 truncate">
          ◈ {campaign.tweetUrl}
        </div>
        <p className="text-[0.8rem] text-[rgba(232,255,232,0.85)] leading-relaxed line-clamp-2">
          {campaign.tweetText}
        </p>
      </div>

      {/* Pool bar */}
      <div className="mb-3">
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-[0.65rem] text-[rgba(232,255,232,0.4)] uppercase tracking-widest">pool</span>
          <span className="text-base text-[#00ff41] font-bold tabular-nums glow-green">
            {campaign.poolTotal.toLocaleString()} <span className="text-sm">ZORG</span>
          </span>
        </div>
        <PoolBar total={campaign.poolTotal} remaining={campaign.poolRemaining} />
      </div>

      {/* Task chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {campaign.tasks.map((task) => {
          const meta = TASK_META[task.type]
          const full = task.claimed >= task.maxUsers
          return (
            <div
              key={task.type}
              className={`flex items-center gap-1.5 px-2 py-1 text-xs border ${
                full
                  ? 'border-[rgba(232,255,232,0.08)] text-[rgba(232,255,232,0.25)]'
                  : 'border-[rgba(0,255,65,0.25)] text-[rgba(232,255,232,0.75)]'
              }`}
            >
              <span>{meta.icon}</span>
              <span>{meta.label}</span>
              <span className={full ? '' : 'text-[#00ff41] font-bold'}>+{task.rewardPerUser}</span>
              <span className="text-[rgba(232,255,232,0.3)]">{task.claimed}/{task.maxUsers}</span>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[0.65rem] text-[rgba(232,255,232,0.25)] tabular-nums">
        <span>{claimedSlots}/{totalSlots} slots · {campaign.claimedBy.length} earners</span>
        <span className="text-[#00ff41]">earn up to +{topReward} ZORG →</span>
      </div>
    </motion.div>
  )
}

export default function Feed({ user, onCompose, onCampaign, onProfile }: Props) {
  const [filter, setFilter] = useState<FeedFilter>('all')
  const allCampaigns = getCampaigns()

  const campaigns = useMemo(() => {
    switch (filter) {
      case 'active':    return allCampaigns.filter((c) => c.status === 'active')
      case 'completed': return allCampaigns.filter((c) => c.status !== 'active')
      case 'mine':      return allCampaigns.filter((c) => c.creatorAddress === user.address)
      default:          return allCampaigns
    }
  }, [filter, allCampaigns, user])

  const livePool = allCampaigns
    .filter((c) => c.status === 'active')
    .reduce((s, c) => s + c.poolRemaining, 0)

  return (
    <div className="min-h-dvh bg-[#0a0a0a] scanlines">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-[rgba(0,255,65,0.12)] bg-[rgba(10,10,10,0.97)] backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ZorgLogo size="sm" />
            <span className="h-3 w-px bg-[rgba(0,255,65,0.2)]" />
            <span className="text-xs text-[rgba(0,255,65,0.6)] tabular-nums">
              {livePool.toLocaleString()} ZORG live
            </span>
          </div>
          <button
            onClick={onProfile}
            className="flex items-center gap-2 px-2.5 py-1.5 border border-[rgba(0,255,65,0.15)] hover:border-[rgba(0,255,65,0.4)] transition-colors"
          >
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{
                background: `hsl(${(user.handle.charCodeAt(1) * 37) % 360},35%,10%)`,
                color: '#00ff41',
              }}
            >
              {user.handle[1]?.toUpperCase() ?? '?'}
            </div>
            <span className="text-xs text-[rgba(232,255,232,0.7)] hidden sm:inline">{user.handle}</span>
          </button>
        </div>

        {/* Filter tabs */}
        <div className="max-w-2xl mx-auto px-4 flex overflow-x-auto gap-0 scrollbar-none">
          {(['all', 'active', 'completed', 'mine'] as FeedFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 text-xs tracking-widest uppercase border-b-2 whitespace-nowrap transition-colors ${
                filter === f
                  ? 'border-[#00ff41] text-[#00ff41]'
                  : 'border-transparent text-[rgba(232,255,232,0.3)] hover:text-[rgba(232,255,232,0.6)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign list */}
      <div className="max-w-2xl mx-auto w-full px-4 py-4 pb-28 space-y-3">
        {campaigns.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl text-[rgba(0,255,65,0.12)] mb-4">◈</div>
            <div className="text-sm text-[rgba(232,255,232,0.3)]">no campaigns found</div>
            <div className="text-xs text-[rgba(232,255,232,0.15)] mt-1">post a tweet url to create one</div>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {campaigns.map((c) => (
              <CampaignCard key={c.id} campaign={c} onClick={() => onCampaign(c.id)} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Compose FAB */}
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={onCompose}
        className="btn-zorg btn-zorg-solid fixed bottom-20 right-4 px-5 py-3 text-sm tracking-widest z-30"
        style={{ boxShadow: '0 0 24px rgba(0,255,65,0.3)' }}
      >
        + post
      </motion.button>
    </div>
  )
}
