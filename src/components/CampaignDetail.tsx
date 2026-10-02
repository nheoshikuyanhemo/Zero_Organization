import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ZorgLogo } from './ZorgLogo'
import {
  claimTask,
  getClaimsForCampaign,
  getCampaignById,
  TASK_META,
  calcEngagementFee,
  FEE_CREATION_BPS,
  FEE_REFUND_BPS,
  FEE_ENGAGEMENT_BPS,
} from '../store/zorgStore'
import type { Campaign, TaskType, UserProfile, ClaimRecord } from '../types/zorg'
import { toast } from 'sonner'

interface Props {
  campaignId: string
  user: UserProfile
  onBack: () => void
  onProfile: (address: string) => void
}

function timeLeft(ms: number): string {
  const diff = ms - Date.now()
  if (diff <= 0) return 'expired'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m left`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ${Math.floor((diff % 3_600_000) / 60_000)}m left`
  return `${Math.floor(diff / 86_400_000)}d left`
}

function shortAddr(addr: string): string {
  if (addr.length <= 12) return addr
  return addr.slice(0, 6) + '...' + addr.slice(-4)
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  return `${Math.floor(diff / 3_600_000)}h ago`
}

function ClaimButton({
  task, campaign, user: _user, onClaim,
}: {
  task: Campaign['tasks'][number]
  campaign: Campaign
  user: UserProfile
  onClaim: (type: TaskType) => void
}) {
  const [loading, setLoading] = useState(false)
  const meta = TASK_META[task.type]
  const full = task.claimed >= task.maxUsers
  const expired = campaign.status !== 'active'
  const pct = task.maxUsers > 0 ? (task.claimed / task.maxUsers) * 100 : 0
  const { fee: engFee, netEarned } = calcEngagementFee(task.rewardPerUser)

  const handleClick = () => {
    if (full || expired || loading) return
    setLoading(true)
    setTimeout(() => {
      onClaim(task.type)
      setLoading(false)
    }, 900)
  }

  return (
    <motion.div layout className={`p-4 border ${full ? 'border-[rgba(232,255,232,0.08)]' : 'border-[rgba(0,255,65,0.2)]'} space-y-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">{meta.icon}</span>
          <div>
            <div className="text-sm font-semibold">{meta.label}</div>
            <div className="text-[0.6rem] text-[rgba(232,255,232,0.4)]">
              {task.claimed} / {task.maxUsers} claimed
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[#00ff41] text-lg font-bold tabular-nums glow-green">+{task.rewardPerUser}</div>
          <div className="text-[0.55rem] text-[rgba(232,255,232,0.35)]">ZORG gross</div>
          {engFee > 0 ? (
            <div className="text-[0.5rem] text-[rgba(255,0,60,0.5)] tabular-nums">
              fee −{engFee} → net +{netEarned}
            </div>
          ) : (
            <div className="text-[0.5rem] text-[rgba(232,255,232,0.25)] tabular-nums">
              &lt;1 ZORG fee deducted
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[rgba(0,255,65,0.08)]">
        <div
          className="h-full bg-[#00ff41] transition-all duration-500"
          style={{ width: `${pct}%`, boxShadow: pct > 0 ? '0 0 6px rgba(0,255,65,0.5)' : undefined }}
        />
      </div>

      <button
        onClick={handleClick}
        disabled={full || expired || loading}
        className={`w-full py-2.5 text-[0.7rem] tracking-widest uppercase transition-all ${
          full || expired
            ? 'border border-[rgba(232,255,232,0.1)] text-[rgba(232,255,232,0.2)] cursor-not-allowed'
            : 'btn-zorg btn-zorg-solid'
        }`}
      >
        {loading ? (
          <span className="cursor-blink">verifying on x</span>
        ) : full ? 'task full'
          : expired ? 'expired'
          : `claim +${netEarned} ZORG net →`
        }
      </button>

      {!full && !expired && (
        <p className="text-[0.55rem] text-[rgba(232,255,232,0.2)] text-center">
          0.2% engagement fee deducted automatically · go complete on x first
        </p>
      )}
    </motion.div>
  )
}

export default function CampaignDetail({ campaignId, user, onBack, onProfile }: Props) {
  const [campaign, setCampaign] = useState<Campaign | undefined>(() => getCampaignById(campaignId))
  const [claims, setClaims] = useState<ClaimRecord[]>(() => getClaimsForCampaign(campaignId))
  const [tab, setTab] = useState<'tasks' | 'claims' | 'fees'>('tasks')

  if (!campaign) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-[rgba(232,255,232,0.3)] text-sm">&gt; campaign not found</div>
      </div>
    )
  }

  const poolPct = campaign.poolTotal > 0
    ? ((campaign.poolTotal - campaign.poolRemaining) / campaign.poolTotal) * 100
    : 0

  const handleClaim = (taskType: TaskType) => {
    const result = claimTask(campaignId, taskType, user)
    if (result.success) {
      toast.success(`+${result.netEarned} ZORG earned`, {
        description: `${TASK_META[taskType].label} verified · 0.2% fee deducted`,
        style: {
          background: '#0f0f0f',
          border: '1px solid rgba(0,255,65,0.35)',
          color: '#e8ffe8',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.75rem',
        },
      })
    } else {
      toast.error(result.error || 'claim failed', {
        style: {
          background: '#0f0f0f',
          border: '1px solid rgba(255,0,60,0.35)',
          color: '#e8ffe8',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.75rem',
        },
      })
    }
    setCampaign(getCampaignById(campaignId))
    setClaims(getClaimsForCampaign(campaignId))
  }

  const isRefunded = campaign.status === 'refunded'

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
          <span className="text-[0.7rem] text-[rgba(232,255,232,0.6)] uppercase tracking-widest truncate">
            {campaign.id}
          </span>
          <StatusBadge status={campaign.status} />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* ── Refund banner ────────────────────────────────────────────────── */}
        {isRefunded && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border border-[rgba(255,180,0,0.4)] bg-[rgba(255,180,0,0.04)] space-y-2"
          >
            <div className="text-[0.65rem] text-[rgba(255,180,0,0.9)] uppercase tracking-widest font-bold">
              pool expired — refund processed
            </div>
            <div className="grid grid-cols-3 gap-2 text-[0.6rem]">
              <div className="text-center">
                <div className="tabular-nums text-[rgba(232,255,232,0.7)] font-bold">{campaign.poolDeposited.toLocaleString()}</div>
                <div className="text-[rgba(232,255,232,0.3)]">deposited</div>
              </div>
              <div className="text-center">
                <div className="tabular-nums text-[rgba(255,0,60,0.7)] font-bold">−{campaign.refundFee.toLocaleString()}</div>
                <div className="text-[rgba(232,255,232,0.3)]">refund fee 0.5%</div>
              </div>
              <div className="text-center">
                <div className="tabular-nums text-[rgba(255,180,0,0.9)] font-bold">{campaign.refundAmount.toLocaleString()}</div>
                <div className="text-[rgba(232,255,232,0.3)]">returned to creator</div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Pool hero ─────────────────────────────────────────────────────── */}
        <div className="zorg-surface p-5 space-y-4" style={{ borderLeft: '2px solid #00ff41' }}>
          {/* Creator */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: `hsl(${campaign.creatorHandle.charCodeAt(1) * 31 % 360},40%,12%)`,
                border: '1px solid rgba(0,255,65,0.25)',
                color: '#00ff41',
              }}
            >
              {campaign.creatorHandle[1].toUpperCase()}
            </div>
            <div>
              <button onClick={() => onProfile(campaign.creatorAddress)} className="text-sm font-semibold hover:text-[#00ff41] transition-colors">
                {campaign.creatorHandle}
              </button>
              {campaign.creatorType === 'agent' && (
                <span className="ml-1.5 zorg-badge text-[#00d9ff] border-[#00d9ff]" style={{ fontSize: '0.5rem' }}>AGENT</span>
              )}
              {campaign.status === 'active' && (
                <div className="text-[0.55rem] text-[rgba(232,255,232,0.35)]">{timeLeft(campaign.expiresAt)}</div>
              )}
            </div>
            {campaign.status === 'active' && (
              <div className="ml-auto text-right">
                <div className="text-[0.6rem] text-[rgba(232,255,232,0.4)]">auto-distributes</div>
                <div className="text-[0.65rem] text-[#00ff41] tabular-nums">{timeLeft(campaign.autoDistributeAt)}</div>
              </div>
            )}
          </div>

          {/* Tweet */}
          <div className="p-3 bg-[rgba(0,0,0,0.5)] border border-[rgba(0,255,65,0.08)] space-y-2">
            <a href={campaign.tweetUrl} target="_blank" rel="noopener noreferrer"
              className="text-[0.6rem] text-[#00d9ff] hover:underline flex items-center gap-1 truncate">
              ◈ {campaign.tweetUrl}
            </a>
            <p className="text-sm text-[rgba(232,255,232,0.85)] leading-relaxed">{campaign.tweetText}</p>
          </div>

          {/* Pool stats grid */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'deposited',  value: campaign.poolDeposited.toLocaleString(),  unit: 'ZORG',    color: 'text-[rgba(232,255,232,0.8)]' },
              { label: 'create fee', value: campaign.creationFee.toLocaleString(),    unit: `${FEE_CREATION_BPS/100}%`, color: 'text-[rgba(255,0,60,0.65)]' },
              { label: 'pool',       value: campaign.poolTotal.toLocaleString(),      unit: 'net ZORG', color: 'text-[rgba(232,255,232,0.8)]' },
              { label: 'remaining',  value: campaign.poolRemaining.toLocaleString(),  unit: 'ZORG',    color: 'text-[#00ff41] glow-green' },
            ].map((s) => (
              <div key={s.label} className="bg-[rgba(0,0,0,0.4)] p-2 text-center border border-[rgba(0,255,65,0.06)]">
                <div className={`text-sm font-bold tabular-nums ${s.color}`}>{s.value}</div>
                <div className="text-[0.45rem] text-[rgba(232,255,232,0.25)] uppercase tracking-widest leading-tight">{s.unit}</div>
                <div className="text-[0.45rem] text-[rgba(232,255,232,0.2)] leading-tight">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Engagement fee strip */}
          <div className="flex items-center justify-between text-[0.6rem] text-[rgba(232,255,232,0.3)]">
            <span>{campaign.claimedBy.length} earners · {claims.length} payouts</span>
            <span className="text-[rgba(255,0,60,0.45)] tabular-nums">
              {campaign.totalEngagementFees.toLocaleString()} ZORG engagement fees collected
            </span>
          </div>

          {/* Pool drain bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[0.6rem] text-[rgba(232,255,232,0.35)] tabular-nums">
              <span>{(campaign.poolTotal - campaign.poolRemaining).toLocaleString()} distributed</span>
              <span>{poolPct.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-[rgba(0,255,65,0.06)]">
              <motion.div
                className="h-full bg-gradient-to-r from-[#00ff41] to-[#00d9ff]"
                initial={{ width: 0 }}
                animate={{ width: `${poolPct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                style={{ boxShadow: '0 0 10px rgba(0,255,65,0.4)' }}
              />
            </div>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div className="flex border-b border-[rgba(0,255,65,0.1)]">
          {(['tasks', 'claims', 'fees'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-[0.65rem] uppercase tracking-widest border-b-2 transition-colors ${
                tab === t ? 'border-[#00ff41] text-[#00ff41]' : 'border-transparent text-[rgba(232,255,232,0.35)]'
              }`}
            >
              {t}
              {t === 'claims' && claims.length > 0 && (
                <span className="ml-1 text-[0.5rem] text-[rgba(0,255,65,0.6)]">({claims.length})</span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Tasks tab ─────────────────────────────────────────────────── */}
          {tab === 'tasks' && (
            <motion.div key="tasks" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {campaign.tasks.map((task) => (
                <ClaimButton key={task.type} task={task} campaign={campaign} user={user} onClaim={handleClaim} />
              ))}
              {campaign.status === 'active' && (
                <div className="zorg-surface p-3 text-center space-y-1">
                  <a href={campaign.tweetUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-[#00d9ff] hover:underline tracking-wide">
                    → open tweet on x.com
                  </a>
                  <p className="text-[0.55rem] text-[rgba(232,255,232,0.2)]">
                    complete the action on x · verified automatically · reward sent after verification
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Claims tab ────────────────────────────────────────────────── */}
          {tab === 'claims' && (
            <motion.div key="claims" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              {claims.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-[0.7rem] text-[rgba(232,255,232,0.25)]">no claims yet</div>
                </div>
              ) : (
                claims.sort((a, b) => b.timestamp - a.timestamp).map((claim, i) => (
                  <motion.div
                    key={`${claim.campaignId}-${claim.taskType}-${claim.claimerAddress}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center justify-between py-2.5 px-3 border border-[rgba(0,255,65,0.06)] hover:border-[rgba(0,255,65,0.15)] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{TASK_META[claim.taskType].icon}</span>
                      <div>
                        <div className="text-[0.7rem]">{claim.claimerHandle}</div>
                        <div className="text-[0.5rem] text-[rgba(232,255,232,0.3)] flex items-center gap-1">
                          <span>{shortAddr(claim.txHash)}</span>
                          {claim.verified && (
                            <span className="text-[#00ff41]">· verified</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#00ff41] text-xs font-bold tabular-nums">+{claim.earnedZorg} ZORG</div>
                      {claim.engagementFee > 0 && (
                        <div className="text-[0.5rem] text-[rgba(255,0,60,0.45)] tabular-nums">−{claim.engagementFee} fee</div>
                      )}
                      <div className="text-[0.5rem] text-[rgba(232,255,232,0.3)]">{timeAgo(claim.timestamp)}</div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* ── Fees tab ──────────────────────────────────────────────────── */}
          {tab === 'fees' && (
            <motion.div key="fees" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {/* Fee schedule card */}
              <div className="zorg-surface p-4 space-y-3">
                <div className="text-[0.6rem] text-[rgba(232,255,232,0.4)] uppercase tracking-widest">platform fee schedule</div>
                <div className="space-y-2">
                  <FeeScheduleRow
                    icon="◈" label="creation fee"
                    bps={FEE_CREATION_BPS}
                    desc="charged upfront when campaign is deployed"
                    example={`${campaign.creationFee.toLocaleString()} ZORG on this campaign`}
                  />
                  <div className="h-px bg-[rgba(0,255,65,0.06)]" />
                  <FeeScheduleRow
                    icon="⟲" label="engagement fee"
                    bps={FEE_ENGAGEMENT_BPS}
                    desc="deducted per payout when X action is verified"
                    example={`${campaign.totalEngagementFees.toLocaleString()} ZORG collected so far`}
                  />
                  <div className="h-px bg-[rgba(0,255,65,0.06)]" />
                  <FeeScheduleRow
                    icon="◇" label="refund fee"
                    bps={FEE_REFUND_BPS}
                    desc="charged on unclaimed pool at expiry, rest returned to creator"
                    example={isRefunded
                      ? `${campaign.refundFee.toLocaleString()} ZORG fee · ${campaign.refundAmount.toLocaleString()} ZORG returned`
                      : 'not yet triggered'}
                  />
                </div>
              </div>

              {/* This campaign totals */}
              <div className="zorg-surface p-4 space-y-2">
                <div className="text-[0.6rem] text-[rgba(232,255,232,0.4)] uppercase tracking-widest mb-2">this campaign — fee totals</div>
                <FeeRow label="creation fee paid"        value={`${campaign.creationFee.toLocaleString()} ZORG`} red />
                <FeeRow label="engagement fees collected" value={`${campaign.totalEngagementFees.toLocaleString()} ZORG`} red />
                {isRefunded && (
                  <FeeRow label="refund fee paid"         value={`${campaign.refundFee.toLocaleString()} ZORG`} red />
                )}
                <div className="h-px bg-[rgba(0,255,65,0.06)]" />
                <FeeRow
                  label="total to marketing wallet"
                  value={`${(campaign.creationFee + campaign.totalEngagementFees + campaign.refundFee).toLocaleString()} ZORG`}
                  bright
                />
              </div>

              {/* Fee purpose */}
              <div className="bg-[rgba(0,255,65,0.02)] border border-[rgba(0,255,65,0.08)] p-4 space-y-1.5">
                <div className="text-[0.6rem] text-[rgba(0,255,65,0.5)] uppercase tracking-widest mb-2">fee purpose</div>
                {[
                  'protocol development · audits · infrastructure upkeep',
                  'community pool — future governance rewards',
                  'ZORG market buy-pressure → price stability',
                  'all fees onchain-transparent, no hidden routing',
                ].map((line) => (
                  <div key={line} className="text-[0.6rem] text-[rgba(232,255,232,0.4)]">· {line}</div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Campaign['status'] }) {
  const color = status === 'active'    ? 'text-[#00ff41] border-[#00ff41]'
              : status === 'refunded'  ? 'text-[rgba(255,180,0,0.9)] border-[rgba(255,180,0,0.5)]'
              : status === 'completed' ? 'text-[#00d9ff] border-[#00d9ff]'
              : 'text-[rgba(232,255,232,0.3)] border-[rgba(232,255,232,0.15)]'
  return (
    <span className={`ml-auto zorg-badge flex-shrink-0 ${color}`} style={{ fontSize: '0.55rem' }}>
      {status}
    </span>
  )
}

function FeeScheduleRow({
  icon, label, bps, desc, example,
}: {
  icon: string; label: string; bps: number; desc: string; example: string
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-lg leading-none mt-0.5">{icon}</span>
      <div className="flex-1 space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="text-[0.7rem] font-semibold">{label}</span>
          <span className="text-[0.65rem] text-[rgba(255,0,60,0.7)] tabular-nums font-bold">
            {(bps / 100).toFixed(2)}%
          </span>
        </div>
        <div className="text-[0.6rem] text-[rgba(232,255,232,0.4)]">{desc}</div>
        <div className="text-[0.6rem] text-[rgba(232,255,232,0.25)] tabular-nums">{example}</div>
      </div>
    </div>
  )
}

function FeeRow({
  label, value, red = false, bright = false,
}: {
  label: string; value: string; red?: boolean; bright?: boolean
}) {
  return (
    <div className="flex justify-between text-[0.62rem]">
      <span className={red ? 'text-[rgba(255,0,60,0.6)]' : 'text-[rgba(232,255,232,0.4)]'}>{label}</span>
      <span className={`tabular-nums ${bright ? 'text-[rgba(232,255,232,0.9)] font-semibold' : red ? 'text-[rgba(255,0,60,0.6)]' : 'text-[rgba(232,255,232,0.6)]'}`}>
        {value}
      </span>
    </div>
  )
}
