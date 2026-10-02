// ─── ZORG Mock Store & Economics Engine ─────────────────────────────────────
// In production: replace with onchain reads via wagmi + Post Registry + FeeRouter contracts

import { Campaign, ClaimRecord, TaskConfig, TaskType, UserProfile } from '../types/zorg'

// ─── Platform fee schedule ───────────────────────────────────────────────────
//
//  CREATION FEE   : 1.00% (100 bps) of gross deposit  → marketing wallet, taken upfront
//  REFUND FEE     : 0.50%  (50 bps) of refunded amount → marketing wallet, taken at expiry
//  ENGAGEMENT FEE : 0.20%  (20 bps) of each gross payout → marketing wallet, per payout
//
//  Purpose: protocol sustainability, community pool, ZORG price stability
//  All fees route to MARKETING_WALLET — replace before mainnet deploy.

export const FEE_CREATION_BPS  = 100  // 1.00%
export const FEE_REFUND_BPS    =  50  // 0.50%
export const FEE_ENGAGEMENT_BPS =  20  // 0.20%

export const MARKETING_WALLET  = '0xMARKETING_WALLET_PLACEHOLDER'

// Distribution window constraints
export const MIN_DURATION_MS = 1 * 3_600_000          // 1 hour
export const MAX_DURATION_MS = 7 * 24 * 3_600_000     // 7 days

// ─── Fee math helpers ────────────────────────────────────────────────────────

/** 1% creation fee. Returns fee + net pool. */
export function calcCreationFee(grossDeposit: number): { fee: number; netPool: number } {
  const fee = Math.floor((grossDeposit * FEE_CREATION_BPS) / 10_000)
  return { fee, netPool: grossDeposit - fee }
}

/** 0.5% refund fee on remaining pool at expiry. Returns fee + refundToCreator. */
export function calcRefundFee(remaining: number): { fee: number; refundToCreator: number } {
  const fee = Math.floor((remaining * FEE_REFUND_BPS) / 10_000)
  return { fee, refundToCreator: remaining - fee }
}

/** 0.2% engagement fee per payout. Returns fee + net earned. */
export function calcEngagementFee(grossReward: number): { fee: number; netEarned: number } {
  const fee = Math.floor((grossReward * FEE_ENGAGEMENT_BPS) / 10_000)
  return { fee, netEarned: grossReward - fee }
}

/** Full fee summary shown to creator before confirming campaign creation. */
export function feePreview(grossDeposit: number, durationMs: number): {
  grossDeposit: number
  creationFee: number
  netPool: number
  durationMs: number
  expiresAt: number
  creationFeePct: string
  refundFeePct: string
  engagementFeePct: string
} {
  const { fee, netPool } = calcCreationFee(grossDeposit)
  const now = Date.now()
  return {
    grossDeposit,
    creationFee: fee,
    netPool,
    durationMs,
    expiresAt: now + durationMs,
    creationFeePct:   `${(FEE_CREATION_BPS   / 100).toFixed(2)}%`,
    refundFeePct:     `${(FEE_REFUND_BPS     / 100).toFixed(2)}%`,
    engagementFeePct: `${(FEE_ENGAGEMENT_BPS / 100).toFixed(2)}%`,
  }
}

/** Clamp duration to [MIN, MAX]. */
export function clampDuration(ms: number): number {
  return Math.min(MAX_DURATION_MS, Math.max(MIN_DURATION_MS, ms))
}

// ─── Task metadata ───────────────────────────────────────────────────────────

export const TASK_META: Record<TaskType, { label: string; defaultReward: number; icon: string }> = {
  like:     { label: 'Like',     defaultReward: 10,  icon: '♡' },
  comment:  { label: 'Comment',  defaultReward: 25,  icon: '◈' },
  repost:   { label: 'Repost',   defaultReward: 20,  icon: '⟲' },
  quote:    { label: 'Quote',    defaultReward: 30,  icon: '❝' },
  bookmark: { label: 'Bookmark', defaultReward: 5,   icon: '◇' },
  follow:   { label: 'Follow',   defaultReward: 15,  icon: '+' },
}

// ─── Pool allocation ─────────────────────────────────────────────────────────

export function validatePoolAllocation(campaign: {
  poolTotal: number
  tasks: { rewardPerUser: number; maxUsers: number }[]
}): { valid: boolean; allocated: number; remaining: number } {
  const allocated = campaign.tasks.reduce(
    (s, t) => s + t.rewardPerUser * t.maxUsers,
    0
  )
  return {
    valid: allocated <= campaign.poolTotal,
    allocated,
    remaining: campaign.poolTotal - allocated,
  }
}

// ─── Duration helpers ────────────────────────────────────────────────────────

export const DURATION_PRESETS: { label: string; ms: number }[] = [
  { label: '1h',  ms: 1 * 3_600_000 },
  { label: '6h',  ms: 6 * 3_600_000 },
  { label: '12h', ms: 12 * 3_600_000 },
  { label: '24h', ms: 24 * 3_600_000 },
  { label: '3d',  ms: 3 * 24 * 3_600_000 },
  { label: '7d',  ms: 7 * 24 * 3_600_000 },
]

export function formatDuration(ms: number): string {
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m`
  if (ms < 24 * 3_600_000) return `${Math.floor(ms / 3_600_000)}h`
  return `${Math.floor(ms / 86_400_000)}d`
}

// ─── Seed data ───────────────────────────────────────────────────────────────

const NOW = Date.now()
const H = 3_600_000

export const MOCK_USERS: Record<string, UserProfile> = {
  '0xd3ad...b33f': {
    address: '0xd3ad...b33f',
    handle: '@null_operator',
    accountType: 'human',
    bio: 'cypherpunk. zero org. zero trust.',
    avatarSeed: 'null_operator',
    totalEarned: 4200,
    totalSpent: 12000,
    totalRefunded: 320,
    campaignsCreated: 7,
    tasksCompleted: 0,
    joinedAt: NOW - 30 * 24 * H,
  },
  '0xc0de...face': {
    address: '0xc0de...face',
    handle: '@ghost_signal',
    accountType: 'agent',
    bio: 'autonomous signal amplifier. no operators.',
    avatarSeed: 'ghost_signal',
    totalEarned: 18500,
    totalSpent: 0,
    totalRefunded: 0,
    campaignsCreated: 0,
    tasksCompleted: 247,
    joinedAt: NOW - 12 * 24 * H,
    agentManifest: {
      name: 'GhostSignal v1.2',
      version: '1.2.0',
      capabilities: ['like', 'repost', 'quote'],
      operator: '0xc0de...face',
      signature: '0xsig...abcd',
      registeredAt: NOW - 12 * 24 * H,
    },
  },
  '0xb00b...1337': {
    address: '0xb00b...1337',
    handle: '@entropy_seed',
    accountType: 'human',
    bio: 'on-chain everything. off-chain nothing.',
    avatarSeed: 'entropy_seed',
    totalEarned: 750,
    totalSpent: 3000,
    totalRefunded: 0,
    campaignsCreated: 2,
    tasksCompleted: 31,
    joinedAt: NOW - 5 * 24 * H,
  },
}

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-001',
    creatorAddress: '0xd3ad...b33f',
    creatorHandle: '@null_operator',
    creatorType: 'human',
    tweetUrl: 'https://x.com/null_operator/status/1234567890',
    tweetText: 'just deployed the first censorship-resistant social layer. no admins. no keys. no rulers. just code. #ZORG #ZeroOrg',
    tweetAuthor: '@null_operator',
    poolDeposited: 1010,
    creationFee: 10,
    poolTotal: 1000,
    poolRemaining: 420,
    durationMs: 24 * H,
    createdAt: NOW - 2 * H,
    expiresAt: NOW + 22 * H,
    autoDistributeAt: NOW + 22 * H,
    refundAmount: 0,
    refundFee: 0,
    totalEngagementFees: 11,
    tasks: [
      { type: 'like',    label: 'Like',    rewardPerUser: 10, maxUsers: 20, claimed: 14 },
      { type: 'comment', label: 'Comment', rewardPerUser: 25, maxUsers: 10, claimed: 7  },
      { type: 'repost',  label: 'Repost',  rewardPerUser: 20, maxUsers: 15, claimed: 11 },
      { type: 'quote',   label: 'Quote',   rewardPerUser: 30, maxUsers: 5,  claimed: 3  },
    ],
    status: 'active',
    claimedBy: ['0xc0de...face', '0xb00b...1337'],
  },
  {
    id: 'camp-002',
    creatorAddress: '0xb00b...1337',
    creatorHandle: '@entropy_seed',
    creatorType: 'human',
    tweetUrl: 'https://x.com/entropy_seed/status/9876543210',
    tweetText: 'the internet was supposed to be free. we let them fence it. ZORG tears down the fence. permissionless. forever.',
    tweetAuthor: '@entropy_seed',
    poolDeposited: 3030,
    creationFee: 30,
    poolTotal: 3000,
    poolRemaining: 1650,
    durationMs: 3 * 24 * H,
    createdAt: NOW - 5 * H,
    expiresAt: NOW + 67 * H,
    autoDistributeAt: NOW + 67 * H,
    refundAmount: 0,
    refundFee: 0,
    totalEngagementFees: 27,
    tasks: [
      { type: 'like',     label: 'Like',     rewardPerUser: 10, maxUsers: 50, claimed: 38 },
      { type: 'repost',   label: 'Repost',   rewardPerUser: 20, maxUsers: 30, claimed: 20 },
      { type: 'comment',  label: 'Comment',  rewardPerUser: 25, maxUsers: 20, claimed: 12 },
      { type: 'bookmark', label: 'Bookmark', rewardPerUser: 5,  maxUsers: 40, claimed: 18 },
      { type: 'follow',   label: 'Follow',   rewardPerUser: 15, maxUsers: 20, claimed: 7  },
    ],
    status: 'active',
    claimedBy: ['0xd3ad...b33f'],
  },
  {
    id: 'camp-003',
    creatorAddress: '0xd3ad...b33f',
    creatorHandle: '@null_operator',
    creatorType: 'human',
    tweetUrl: 'https://x.com/null_operator/status/1111222333',
    tweetText: 'ai agents are not bots. they are citizens. ZORG gives them the same rights as humans. same post cost. same reward. zero discrimination.',
    tweetAuthor: '@null_operator',
    poolDeposited: 505,
    creationFee: 5,
    poolTotal: 500,
    poolRemaining: 0,
    durationMs: 48 * H,
    createdAt: NOW - 48 * H,
    expiresAt: NOW - 1,
    autoDistributeAt: NOW - 1,
    refundAmount: 0,
    refundFee: 0,
    totalEngagementFees: 5,
    tasks: [
      { type: 'like',   label: 'Like',   rewardPerUser: 10, maxUsers: 15, claimed: 15 },
      { type: 'repost', label: 'Repost', rewardPerUser: 20, maxUsers: 10, claimed: 10 },
      { type: 'quote',  label: 'Quote',  rewardPerUser: 30, maxUsers: 5,  claimed: 5  },
    ],
    status: 'completed',
    claimedBy: ['0xc0de...face', '0xb00b...1337', '0xd3ad...b33f'],
  },
  {
    // Example of a partially-filled campaign that expired and triggered refund
    id: 'camp-004',
    creatorAddress: '0xb00b...1337',
    creatorHandle: '@entropy_seed',
    creatorType: 'human',
    tweetUrl: 'https://x.com/entropy_seed/status/5555666777',
    tweetText: 'ZORG tokenomics deep dive: fixed supply, no mint, fee recycling into community pool. zero vc dumps.',
    tweetAuthor: '@entropy_seed',
    poolDeposited: 2020,
    creationFee: 20,
    poolTotal: 2000,
    poolRemaining: 0,
    durationMs: 6 * H,
    createdAt: NOW - 10 * H,
    expiresAt: NOW - 4 * H,
    autoDistributeAt: NOW - 4 * H,
    // Pool ran out at expiry: 800 ZORG unclaimed → refund fee 0.5% = 4 ZORG, creator got back 796
    refundAmount: 796,
    refundFee: 4,
    totalEngagementFees: 2,
    tasks: [
      { type: 'like',    label: 'Like',    rewardPerUser: 10, maxUsers: 50, claimed: 32 },
      { type: 'comment', label: 'Comment', rewardPerUser: 25, maxUsers: 20, claimed: 11 },
      { type: 'repost',  label: 'Repost',  rewardPerUser: 20, maxUsers: 30, claimed: 18 },
    ],
    status: 'refunded',
    claimedBy: ['0xc0de...face'],
  },
]

export const MOCK_CLAIMS: ClaimRecord[] = [
  { campaignId: 'camp-001', taskType: 'like',   claimerAddress: '0xc0de...face', claimerHandle: '@ghost_signal',  grossZorg: 10, engagementFee: 0, earnedZorg: 10, txHash: '0xabc...001', timestamp: NOW - 90 * 60_000, verified: true },
  { campaignId: 'camp-001', taskType: 'repost', claimerAddress: '0xc0de...face', claimerHandle: '@ghost_signal',  grossZorg: 20, engagementFee: 0, earnedZorg: 20, txHash: '0xabc...002', timestamp: NOW - 88 * 60_000, verified: true },
  { campaignId: 'camp-002', taskType: 'like',   claimerAddress: '0xd3ad...b33f', claimerHandle: '@null_operator', grossZorg: 10, engagementFee: 0, earnedZorg: 10, txHash: '0xabc...003', timestamp: NOW - 3 * H,         verified: true },
  { campaignId: 'camp-003', taskType: 'like',   claimerAddress: '0xb00b...1337', claimerHandle: '@entropy_seed',  grossZorg: 10, engagementFee: 0, earnedZorg: 10, txHash: '0xabc...004', timestamp: NOW - 40 * H,        verified: true },
]

// ─── In-memory state ─────────────────────────────────────────────────────────

let _campaigns = [...MOCK_CAMPAIGNS]
let _claims    = [...MOCK_CLAIMS]

export function getCampaigns(): Campaign[] {
  return _campaigns.sort((a, b) => b.createdAt - a.createdAt)
}

export function getCampaignById(id: string): Campaign | undefined {
  return _campaigns.find((c) => c.id === id)
}

export function getClaimsForCampaign(campaignId: string): ClaimRecord[] {
  return _claims.filter((c) => c.campaignId === campaignId)
}

export function getClaimsForUser(address: string): ClaimRecord[] {
  return _claims.filter((c) => c.claimerAddress === address)
}

// ─── Claim task (engagement fee applied per payout) ──────────────────────────

export function claimTask(
  campaignId: string,
  taskType: TaskType,
  claimer: UserProfile
): { success: boolean; grossEarned: number; feeDeducted: number; netEarned: number; error?: string } {
  const camp = _campaigns.find((c) => c.id === campaignId)
  if (!camp) return { success: false, grossEarned: 0, feeDeducted: 0, netEarned: 0, error: 'Campaign not found' }
  if (camp.status !== 'active') return { success: false, grossEarned: 0, feeDeducted: 0, netEarned: 0, error: `Campaign is ${camp.status}` }
  if (Date.now() > camp.expiresAt) {
    // Trigger expiry / refund if not already handled
    processExpiry(camp)
    return { success: false, grossEarned: 0, feeDeducted: 0, netEarned: 0, error: 'Campaign expired — any remaining pool will be refunded' }
  }

  const task = camp.tasks.find((t) => t.type === taskType)
  if (!task) return { success: false, grossEarned: 0, feeDeducted: 0, netEarned: 0, error: 'Task not in this campaign' }
  if (task.claimed >= task.maxUsers) return { success: false, grossEarned: 0, feeDeducted: 0, netEarned: 0, error: 'Task fully claimed' }

  const alreadyClaimed = _claims.some(
    (c) => c.campaignId === campaignId && c.taskType === taskType && c.claimerAddress === claimer.address
  )
  if (alreadyClaimed) return { success: false, grossEarned: 0, feeDeducted: 0, netEarned: 0, error: 'Already claimed this task' }

  if (camp.poolRemaining < task.rewardPerUser)
    return { success: false, grossEarned: 0, feeDeducted: 0, netEarned: 0, error: 'Pool insufficient' }

  // Apply engagement fee: 0.20% of gross reward
  const { fee: engFee, netEarned } = calcEngagementFee(task.rewardPerUser)

  // Mutate pool state
  task.claimed += 1
  camp.poolRemaining -= task.rewardPerUser
  camp.totalEngagementFees += engFee
  if (!camp.claimedBy.includes(claimer.address)) camp.claimedBy.push(claimer.address)

  const txHash = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`
  _claims.push({
    campaignId,
    taskType,
    claimerAddress: claimer.address,
    claimerHandle: claimer.handle,
    grossZorg: task.rewardPerUser,
    engagementFee: engFee,
    earnedZorg: netEarned,
    txHash,
    timestamp: Date.now(),
    verified: true, // mock: auto-verified. prod: oracle checks X action
  })

  // Check full completion
  const allDone = camp.tasks.every((t) => t.claimed >= t.maxUsers)
  if (allDone || camp.poolRemaining === 0) camp.status = 'completed'

  return { success: true, grossEarned: task.rewardPerUser, feeDeducted: engFee, netEarned }
}

// ─── Expiry + refund ──────────────────────────────────────────────────────────

/**
 * Called when a campaign expires.
 * If poolRemaining > 0: deduct 0.5% refund fee → marketing wallet, send rest back to creator.
 * If poolRemaining === 0: mark completed (no refund needed).
 */
export function processExpiry(camp: Campaign): void {
  if (camp.status !== 'active') return

  if (camp.poolRemaining > 0) {
    const { fee, refundToCreator } = calcRefundFee(camp.poolRemaining)
    camp.refundFee = fee
    camp.refundAmount = refundToCreator
    camp.poolRemaining = 0
    camp.status = 'refunded'
    // In production: two onchain transfers here —
    //   1. `fee` → MARKETING_WALLET
    //   2. `refundToCreator` → camp.creatorAddress
  } else {
    camp.status = 'completed'
  }
}

/** Manually trigger expiry check for a campaign (e.g. called from UI). */
export function checkAndProcessExpiry(campaignId: string): Campaign | undefined {
  const camp = _campaigns.find((c) => c.id === campaignId)
  if (!camp) return undefined
  if (camp.status === 'active' && Date.now() > camp.expiresAt) {
    processExpiry(camp)
  }
  return camp
}

// ─── Create campaign ──────────────────────────────────────────────────────────

export function createCampaign(data: {
  creator: UserProfile
  tweetUrl: string
  tweetText: string
  tweetAuthor: string
  grossDeposit: number   // total ZORG creator deposits (fee deducted inside)
  durationMs: number     // distribution window (clamped to [1h, 7d])
  tasks: TaskConfig[]
}): Campaign {
  const safeDuration = clampDuration(data.durationMs)
  const { fee: creationFee, netPool } = calcCreationFee(data.grossDeposit)
  const now = Date.now()

  const id = `camp-${now.toString(36)}`
  const campaign: Campaign = {
    id,
    creatorAddress: data.creator.address,
    creatorHandle: data.creator.handle,
    creatorType: data.creator.accountType,
    tweetUrl: data.tweetUrl,
    tweetText: data.tweetText,
    tweetAuthor: data.tweetAuthor,
    poolDeposited: data.grossDeposit,
    creationFee,
    poolTotal: netPool,
    poolRemaining: netPool,
    durationMs: safeDuration,
    createdAt: now,
    expiresAt: now + safeDuration,
    autoDistributeAt: now + safeDuration,
    refundAmount: 0,
    refundFee: 0,
    totalEngagementFees: 0,
    tasks: data.tasks,
    status: 'active',
    claimedBy: [],
  }
  _campaigns = [campaign, ..._campaigns]
  return campaign
}
