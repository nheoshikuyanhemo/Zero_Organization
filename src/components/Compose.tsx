import { useState, useCallback } from 'react'
import { ZorgLogo } from './ZorgLogo'
import { motion, AnimatePresence } from 'framer-motion'
import {
  createCampaign,
  validatePoolAllocation,
  TASK_META,
  calcCreationFee,
  calcRefundFee,
  calcEngagementFee,
  DURATION_PRESETS,
  FEE_CREATION_BPS,
  FEE_REFUND_BPS,
  FEE_ENGAGEMENT_BPS,
  clampDuration,
} from '../store/zorgStore'
import type { TaskConfig, TaskType, UserProfile, Campaign } from '../types/zorg'

interface Props {
  user: UserProfile
  onBack: () => void
  onCreated: (campaign: Campaign) => void
}

const ALL_TASK_TYPES: TaskType[] = ['like', 'comment', 'repost', 'quote', 'bookmark', 'follow']

function extractTweetText(url: string): string {
  if (!url) return ''
  return 'preview not available — text will be fetched onchain at post time'
}

function extractHandle(url: string): string {
  const m = url.match(/x\.com\/([^/]+)/)
  return m ? '@' + m[1] : '@unknown'
}

function isValidXUrl(url: string): boolean {
  return /^https?:\/\/(x|twitter)\.com\/[^/]+\/status\/\d+/.test(url)
}

function formatDurationLabel(ms: number): string {
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m`
  if (ms < 24 * 3_600_000) return `${Math.floor(ms / 3_600_000)}h`
  return `${Math.floor(ms / 86_400_000)}d`
}

interface TaskRow {
  type: TaskType
  enabled: boolean
  rewardPerUser: number
  maxUsers: number
}

export default function Compose({ user, onBack, onCreated }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [tweetUrl, setTweetUrl] = useState('')
  const [tweetText, setTweetText] = useState('')
  const [poolTotal, setPoolTotal] = useState(1000)
  const [durationMs, setDurationMs] = useState(24 * 3_600_000) // default 24h
  const [tasks, setTasks] = useState<TaskRow[]>(
    ALL_TASK_TYPES.map((t) => ({
      type: t,
      enabled: ['like', 'comment', 'repost'].includes(t),
      rewardPerUser: TASK_META[t].defaultReward,
      maxUsers: 0,
    }))
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // ── Fee calculations ──────────────────────────────────────────────────────
  const safeDuration = clampDuration(durationMs)
  const { fee: creationFee, netPool } = calcCreationFee(poolTotal)

  // Compute maxUsers from net pool
  const enabledTasks = tasks.filter((t) => t.enabled)
  const totalWeight = enabledTasks.reduce((s, t) => s + t.rewardPerUser, 0)
  const computedTasks: TaskRow[] = tasks.map((t) => {
    if (!t.enabled || totalWeight === 0) return { ...t, maxUsers: 0 }
    const share = (t.rewardPerUser / totalWeight) * netPool
    return { ...t, maxUsers: Math.max(1, Math.floor(share / t.rewardPerUser)) }
  })
  const allocation = validatePoolAllocation({
    poolTotal: netPool,
    tasks: computedTasks.filter((t) => t.enabled).map((t) => ({
      rewardPerUser: t.rewardPerUser,
      maxUsers: t.maxUsers,
    })),
  })

  // Worst-case refund fee (if no tasks claimed at all — conservative estimate)
  const { fee: maxRefundFee, refundToCreator: maxRefund } = calcRefundFee(netPool)
  // Example engagement fee on a single 25 ZORG comment
  const { fee: sampleEngFee, netEarned: sampleNet } = calcEngagementFee(25)

  const toggleTask = (type: TaskType) => {
    setTasks((prev) => prev.map((t) => (t.type === type ? { ...t, enabled: !t.enabled } : t)))
  }

  const updateReward = useCallback((type: TaskType, val: number) => {
    setTasks((prev) => prev.map((t) => (t.type === type ? { ...t, rewardPerUser: Math.max(1, val) } : t)))
  }, [])

  const handleSubmit = () => {
    if (!isValidXUrl(tweetUrl)) { setError('invalid x.com post url'); return }
    if (enabledTasks.length === 0) { setError('enable at least one task'); return }
    if (allocation.allocated === 0) { setError('pool allocation is zero'); return }
    setError('')
    setSubmitting(true)

    setTimeout(() => {
      const finalized: TaskConfig[] = computedTasks
        .filter((t) => t.enabled && t.maxUsers > 0)
        .map((t) => ({
          type: t.type,
          label: TASK_META[t.type].label,
          rewardPerUser: t.rewardPerUser,
          maxUsers: t.maxUsers,
          claimed: 0,
        }))

      const campaign = createCampaign({
        creator: user,
        tweetUrl,
        tweetText: tweetText || extractTweetText(tweetUrl),
        tweetAuthor: extractHandle(tweetUrl),
        grossDeposit: poolTotal,
        durationMs: safeDuration,
        tasks: finalized,
      })
      setSubmitting(false)
      onCreated(campaign)
    }, 1200)
  }

  return (
    <div className="min-h-dvh bg-[#0a0a0a] scanlines">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-[rgba(0,255,65,0.12)] bg-[rgba(10,10,10,0.97)] backdrop-blur-sm px-4 py-3 max-w-2xl mx-auto flex items-center gap-3">
        <ZorgLogo size="sm" />
        <div className="h-3 w-px bg-[rgba(0,255,65,0.2)]" />
        <button onClick={onBack} className="text-[rgba(232,255,232,0.4)] hover:text-[#00ff41] text-xs transition-colors">
          ← back
        </button>
        <div className="h-3 w-px bg-[rgba(0,255,65,0.2)]" />
        <span className="text-[0.7rem] text-[rgba(232,255,232,0.6)] uppercase tracking-widest">create campaign</span>
        <div className="ml-auto flex gap-1">
          {([1, 2, 3, 4] as const).map((s) => (
            <div key={s} className={`w-4 h-0.5 ${step >= s ? 'bg-[#00ff41]' : 'bg-[rgba(0,255,65,0.15)]'}`} />
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* ── Step 1: Tweet URL ─────────────────────────────────────────────── */}
        <div className="zorg-surface p-5 space-y-4">
          <StepLabel n={1} active={step >= 1} label="tweet url" />
          <div className="space-y-2">
            <label className="text-[0.6rem] text-[rgba(232,255,232,0.4)] uppercase tracking-widest">paste x.com post url</label>
            <input
              className="zorg-input text-sm"
              placeholder="https://x.com/username/status/..."
              value={tweetUrl}
              onChange={(e) => {
                setTweetUrl(e.target.value)
                if (step === 1 && isValidXUrl(e.target.value)) setStep(2)
              }}
            />
            {tweetUrl && !isValidXUrl(tweetUrl) && (
              <p className="text-[0.6rem] text-[#ff003c]">must be a valid x.com/username/status/... url</p>
            )}
          </div>
          {isValidXUrl(tweetUrl) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              <label className="text-[0.6rem] text-[rgba(232,255,232,0.4)] uppercase tracking-widest">tweet preview text (optional)</label>
              <textarea
                className="zorg-input text-xs resize-none"
                rows={3}
                placeholder="what does this tweet say? (leave blank to fetch onchain)"
                value={tweetText}
                onChange={(e) => setTweetText(e.target.value)}
              />
            </motion.div>
          )}
        </div>

        {/* ── Step 2: Pool size ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {step >= 2 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="zorg-surface p-5 space-y-4">
              <StepLabel n={2} active={step >= 2} label="pool size" />
              <div className="space-y-3">
                <label className="text-[0.6rem] text-[rgba(232,255,232,0.4)] uppercase tracking-widest">total $ZORG to deposit</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number" min={50} step={50}
                    className="zorg-input text-2xl font-bold tabular-nums w-40"
                    value={poolTotal}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 0
                      setPoolTotal(Math.max(50, v))
                      if (step === 2) setStep(3)
                    }}
                  />
                  <span className="text-[#00ff41] font-bold text-sm glow-green">ZORG</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[500, 1000, 2000, 5000, 10000].map((v) => (
                    <button key={v}
                      onClick={() => { setPoolTotal(v); setStep(3) }}
                      className={`text-[0.6rem] px-2.5 py-1 border transition-colors tabular-nums ${
                        poolTotal === v ? 'border-[#00ff41] text-[#00ff41] bg-[rgba(0,255,65,0.08)]'
                          : 'border-[rgba(0,255,65,0.15)] text-[rgba(232,255,232,0.4)] hover:border-[rgba(0,255,65,0.35)]'
                      }`}
                    >{v.toLocaleString()}</button>
                  ))}
                </div>
                {/* Fee impact preview */}
                <div className="flex items-center gap-3 text-[0.6rem] text-[rgba(232,255,232,0.4)] tabular-nums">
                  <span>−{creationFee.toLocaleString()} ZORG creation fee (1%)</span>
                  <span className="text-[rgba(232,255,232,0.25)]">→</span>
                  <span className="text-[rgba(232,255,232,0.7)]">{netPool.toLocaleString()} ZORG net pool</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Step 3: Distribution window ───────────────────────────────────── */}
        <AnimatePresence>
          {step >= 3 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="zorg-surface p-5 space-y-4">
              <StepLabel n={3} active={step >= 3} label="distribution window" />
              <p className="text-[0.62rem] text-[rgba(232,255,232,0.4)] leading-relaxed">
                pool auto-distributes verified engagements during this window.
                at expiry, unclaimed pool is refunded to you (minus 0.5% refund fee).
              </p>

              {/* Presets */}
              <div className="space-y-2">
                <label className="text-[0.6rem] text-[rgba(232,255,232,0.4)] uppercase tracking-widest">
                  duration — min 1h · max 7d
                </label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {DURATION_PRESETS.map((p) => (
                    <button key={p.ms}
                      onClick={() => { setDurationMs(p.ms); setStep(4) }}
                      className={`py-2 text-[0.65rem] border transition-colors ${
                        durationMs === p.ms
                          ? 'border-[#00ff41] text-[#00ff41] bg-[rgba(0,255,65,0.08)]'
                          : 'border-[rgba(0,255,65,0.15)] text-[rgba(232,255,232,0.4)] hover:border-[rgba(0,255,65,0.35)]'
                      }`}
                    >{p.label}</button>
                  ))}
                </div>
              </div>

              {/* Timeline strip */}
              <div className="flex items-center gap-2 text-[0.6rem] text-[rgba(232,255,232,0.35)]">
                <span className="text-[#00ff41]">now</span>
                <div className="flex-1 h-px bg-gradient-to-r from-[#00ff41] to-[rgba(0,255,65,0.1)]" />
                <span>+{formatDurationLabel(safeDuration)}</span>
                <div className="h-3 w-px bg-[rgba(0,255,65,0.4)]" />
                <span>auto-distribute</span>
              </div>

              {/* Refund scenario */}
              {netPool > 0 && (
                <div className="bg-[rgba(0,0,0,0.4)] p-3 border border-[rgba(0,255,65,0.06)] space-y-1">
                  <div className="text-[0.55rem] text-[rgba(232,255,232,0.3)] uppercase tracking-widest mb-1">if pool not fully claimed</div>
                  <div className="flex justify-between text-[0.62rem]">
                    <span className="text-[rgba(232,255,232,0.4)]">hypothetical remaining</span>
                    <span className="tabular-nums text-[rgba(232,255,232,0.6)]">{netPool.toLocaleString()} ZORG</span>
                  </div>
                  <div className="flex justify-between text-[0.62rem]">
                    <span className="text-[rgba(255,0,60,0.7)]">refund fee (0.5%)</span>
                    <span className="tabular-nums text-[rgba(255,0,60,0.7)]">−{maxRefundFee.toLocaleString()} ZORG</span>
                  </div>
                  <div className="flex justify-between text-[0.62rem]">
                    <span className="text-[rgba(232,255,232,0.6)]">you receive back</span>
                    <span className="tabular-nums text-[#00ff41]">{maxRefund.toLocaleString()} ZORG</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Step 4: Task bounties ─────────────────────────────────────────── */}
        <AnimatePresence>
          {step >= 4 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="zorg-surface p-5 space-y-4">
              <StepLabel n={4} active label="task bounties" />
              <p className="text-[0.62rem] text-[rgba(232,255,232,0.35)]">
                0.2% engagement fee is deducted from each payout automatically.
                pool auto-splits by reward weight.
              </p>

              <div className="space-y-2">
                {tasks.map((task) => {
                  const meta = TASK_META[task.type]
                  const computed = computedTasks.find((t) => t.type === task.type)!
                  const { fee: engFee, netEarned } = calcEngagementFee(task.rewardPerUser)
                  return (
                    <div key={task.type}
                      className={`p-3 border transition-colors ${
                        task.enabled ? 'border-[rgba(0,255,65,0.25)] bg-[rgba(0,255,65,0.02)]'
                          : 'border-[rgba(232,255,232,0.06)] opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleTask(task.type)}
                          className={`w-4 h-4 border flex items-center justify-center text-[0.6rem] flex-shrink-0 ${
                            task.enabled ? 'border-[#00ff41] text-[#00ff41] bg-[rgba(0,255,65,0.1)]'
                              : 'border-[rgba(232,255,232,0.2)]'
                          }`}
                        >{task.enabled && '✓'}</button>
                        <span className="text-base leading-none">{meta.icon}</span>
                        <span className="text-[0.75rem] font-medium w-16 flex-shrink-0">{meta.label}</span>
                        <div className="flex items-center gap-1.5 flex-1">
                          <input type="number" min={1}
                            className="zorg-input text-xs w-20 tabular-nums"
                            value={task.rewardPerUser}
                            disabled={!task.enabled}
                            onChange={(e) => updateReward(task.type, parseInt(e.target.value) || 1)}
                          />
                          <span className="text-[0.6rem] text-[rgba(232,255,232,0.4)]">ZORG</span>
                        </div>
                        {task.enabled && (
                          <div className="text-right flex-shrink-0 space-y-0.5">
                            <div className="text-[0.65rem] text-[#00ff41] tabular-nums font-bold">
                              ×{computed.maxUsers} users
                            </div>
                            <div className="text-[0.5rem] text-[rgba(232,255,232,0.3)] tabular-nums">
                              net: {netEarned} / fee: {engFee}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Full cost breakdown */}
              <div className="bg-[rgba(0,0,0,0.55)] p-4 border border-[rgba(0,255,65,0.1)] space-y-2">
                <div className="text-[0.55rem] text-[rgba(232,255,232,0.3)] uppercase tracking-widest mb-2">cost breakdown</div>

                <FeeRow label="you deposit (gross)" value={`${poolTotal.toLocaleString()} ZORG`} />
                <FeeRow label={`creation fee ${FEE_CREATION_BPS/100}%`} value={`−${creationFee.toLocaleString()} ZORG`} red />
                <FeeRow label="net reward pool" value={`${netPool.toLocaleString()} ZORG`} bright />

                <div className="h-px bg-[rgba(0,255,65,0.08)] my-1" />

                <FeeRow label="allocated to tasks" value={`${allocation.allocated.toLocaleString()} ZORG`} green />
                <FeeRow label="unallocated" value={`${allocation.remaining.toLocaleString()} ZORG`} />

                <div className="h-px bg-[rgba(0,255,65,0.08)] my-1" />

                <FeeRow
                  label={`refund fee ${FEE_REFUND_BPS/100}% (if unclaimed at expiry)`}
                  value={`up to −${maxRefundFee.toLocaleString()} ZORG`}
                  red
                />
                <FeeRow
                  label={`engagement fee ${FEE_ENGAGEMENT_BPS/100}% per payout (e.g. 25 ZORG comment)`}
                  value={`−${sampleEngFee} → earner gets ${sampleNet}`}
                  red
                />

                <div className="h-px bg-[rgba(0,255,65,0.08)] my-1" />

                <FeeRow label="distribution window" value={`+${formatDurationLabel(safeDuration)} from deploy`} />

                <div className="h-1 bg-[rgba(0,255,65,0.08)] mt-2">
                  <div
                    className="h-full bg-[#00ff41] transition-all"
                    style={{ width: `${Math.min(100, (allocation.allocated / Math.max(1, netPool)) * 100)}%` }}
                  />
                </div>
                <div className="text-[0.5rem] text-[rgba(232,255,232,0.2)] text-right tabular-nums">
                  {netPool > 0 ? ((allocation.allocated / netPool) * 100).toFixed(1) : '0.0'}% of net pool allocated
                </div>
              </div>

              {/* Fee purpose note */}
              <div className="bg-[rgba(0,255,65,0.03)] border border-[rgba(0,255,65,0.08)] p-3">
                <div className="text-[0.55rem] text-[rgba(0,255,65,0.5)] uppercase tracking-widest mb-1.5">why platform fees?</div>
                <div className="text-[0.6rem] text-[rgba(232,255,232,0.4)] leading-relaxed space-y-1">
                  <p>· protocol development + audits + infrastructure</p>
                  <p>· community pool for future governance rewards</p>
                  <p>· ZORG buy-pressure → price stability</p>
                  <p>· all fees route to marketing wallet — transparent onchain</p>
                </div>
              </div>

              {error && (
                <p className="text-[0.65rem] text-[#ff003c] glow-red">&gt; error: {error}</p>
              )}

              <button
                className="btn-zorg btn-zorg-solid w-full py-3 text-sm tracking-widest"
                onClick={handleSubmit}
                disabled={submitting || !isValidXUrl(tweetUrl) || allocation.allocated === 0}
              >
                {submitting ? (
                  <span className="cursor-blink">depositing {poolTotal.toLocaleString()} ZORG</span>
                ) : (
                  `[ deploy — ${poolTotal.toLocaleString()} ZORG · ${formatDurationLabel(safeDuration)} window ]`
                )}
              </button>

              <div className="flex justify-between text-[0.55rem] text-[rgba(232,255,232,0.2)] tabular-nums">
                <span>{creationFee.toLocaleString()} ZORG → marketing wallet now</span>
                <span>{netPool.toLocaleString()} ZORG → reward pool</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StepLabel({ n, active, label }: { n: number; active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center border ${
        active ? 'border-[#00ff41] text-[#00ff41]' : 'border-[rgba(232,255,232,0.2)] text-[rgba(232,255,232,0.2)]'
      }`}>{n}</span>
      <span className="text-[0.7rem] uppercase tracking-widest text-[rgba(232,255,232,0.6)]">{label}</span>
    </div>
  )
}

function FeeRow({
  label, value, red = false, green = false, bright = false,
}: {
  label: string
  value: string
  red?: boolean
  green?: boolean
  bright?: boolean
}) {
  return (
    <div className="flex justify-between text-[0.62rem]">
      <span className={red ? 'text-[rgba(255,0,60,0.7)]' : 'text-[rgba(232,255,232,0.4)]'}>{label}</span>
      <span className={`tabular-nums ${
        green ? 'text-[#00ff41]'
        : red ? 'text-[rgba(255,0,60,0.7)]'
        : bright ? 'text-[rgba(232,255,232,0.9)] font-semibold'
        : 'text-[rgba(232,255,232,0.6)]'
      }`}>{value}</span>
    </div>
  )
}
