// ─── ZORG Platform Types ────────────────────────────────────────────────────

export type AccountType = 'human' | 'agent' | 'bot'

export type TaskType = 'like' | 'comment' | 'repost' | 'quote' | 'bookmark' | 'follow'

export interface TaskConfig {
  type: TaskType
  label: string
  rewardPerUser: number   // ZORG per unique claimer (gross, before engagement fee)
  maxUsers: number        // max claimers for this task
  claimed: number         // current claimers
}

// ─── Fee schedule (all in basis points) ──────────────────────────────────────
// 1 bps = 0.01%
//   creation fee : 100 bps = 1.00% of gross deposit → marketing wallet
//   refund fee   :  50 bps = 0.50% of refunded amount → marketing wallet
//   engagement fee: 20 bps = 0.20% of each payout deducted before transfer to earner

export interface FeeBreakdown {
  creationFeeBps: 100     // locked constant
  refundFeeBps: 50        // locked constant
  engagementFeeBps: 20    // locked constant
}

export interface Campaign {
  id: string
  creatorAddress: string
  creatorHandle: string
  creatorType: AccountType
  tweetUrl: string
  tweetText: string           // scraped / user-provided preview
  tweetAuthor: string         // original tweet author handle

  // ── Deposit & fees ────────────────────────────────────────────────────────
  poolDeposited: number       // gross ZORG deposited by creator
  creationFee: number         // 1% of poolDeposited → marketing wallet at creation
  poolTotal: number           // net pool = poolDeposited − creationFee (funds tasks)
  poolRemaining: number       // ZORG still claimable in pool

  // ── Distribution window ───────────────────────────────────────────────────
  durationMs: number          // user-set duration in ms (min 1h, max 7d)
  createdAt: number           // unix ms
  expiresAt: number           // unix ms = createdAt + durationMs
  autoDistributeAt: number    // same as expiresAt — triggers auto-payout sweep

  // ── Refund tracking (set when campaign expires with remaining pool) ────────
  refundAmount: number        // ZORG sent back to creator (after refund fee)
  refundFee: number           // 0.5% of (poolRemaining at expiry) → marketing wallet
  totalEngagementFees: number // cumulative 0.2% deducted across all payouts

  tasks: TaskConfig[]
  status: 'active' | 'distributing' | 'completed' | 'expired' | 'refunded'
  claimedBy: string[]         // wallet addresses that received at least one payout
}

export interface ClaimRecord {
  campaignId: string
  taskType: TaskType
  claimerAddress: string
  claimerHandle: string
  grossZorg: number           // reward before engagement fee
  engagementFee: number       // 0.2% of grossZorg → marketing wallet
  earnedZorg: number          // net received (grossZorg − engagementFee)
  txHash: string
  timestamp: number
  verified: boolean           // true = confirmed by X oracle
}

export interface UserProfile {
  address: string
  handle: string              // @username on X
  accountType: AccountType
  bio: string
  avatarSeed: string
  totalEarned: number         // cumulative net ZORG earned from engagement
  totalSpent: number          // cumulative ZORG deposited for campaigns
  totalRefunded: number       // cumulative ZORG refunded
  campaignsCreated: number
  tasksCompleted: number
  joinedAt: number
  agentManifest?: AgentManifest
}

export interface AgentManifest {
  name: string
  version: string
  capabilities: string[]
  operator: string
  signature: string
  registeredAt: number
}

export type View =
  | 'landing'
  | 'auth'
  | 'feed'
  | 'compose'
  | 'campaign'
  | 'profile'
  | 'docs'
  | 'agent-register'

export interface AppState {
  view: View
  user: UserProfile | null
  activeCampaignId: string | null
  viewingProfileAddress: string | null
}
