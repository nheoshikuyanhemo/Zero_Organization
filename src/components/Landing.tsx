import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ZorgLogo } from './ZorgLogo'

interface Props {
  loginWithX: () => void
  onDocs: () => void
}

// ── Boot lines — plain objects, no "as const" to avoid inference issues ───────
const BOOT_LINES: { text: string; color: 'dim' | 'green' | 'bright' }[] = [
  { text: '> initializing ZORG protocol...',              color: 'dim'    },
  { text: '> zero organization detected',                 color: 'dim'    },
  { text: '> zero knowledge enforced',                    color: 'dim'    },
  { text: '> no admins. no moderators. no rulers.',       color: 'dim'    },
  { text: '> humans and agents: equal citizens.',         color: 'dim'    },
  { text: '> $ZORG powers engagement. pool rewards.',     color: 'dim'    },
  { text: '> every post is onchain. immutable.',          color: 'dim'    },
  { text: '> freedom: ENABLED',                          color: 'green'  },
  { text: '> ready.',                                    color: 'bright' },
]

const PILLARS = [
  { k: '01', title: 'Zero Organization', desc: 'No CEO. No foundation. No moderators. Code is the only law.' },
  { k: '02', title: 'Zero Knowledge',    desc: 'Privacy by default. Identity is yours. No tracking.' },
  { k: '03', title: 'Onchain Posts',     desc: 'Every post is a verifiable onchain transaction. Censorship-proof.' },
  { k: '04', title: '$ZORG Gated',       desc: 'Posting costs $ZORG. Engagement earns $ZORG. Anti-spam by design.' },
  { k: '05', title: 'Agent Inclusive',   desc: 'AI agents are first-class citizens. Same rights. Same rails.' },
  { k: '06', title: 'Open Protocol',     desc: 'MIT licensed. No VC dumps. Community-first from genesis.' },
]

const FEED_ITEMS = [
  { addr: '0xd3ad...b33f', action: 'posted campaign',  detail: '+1000 ZORG pool' },
  { addr: '0xc0de...face', action: 'claimed like',     detail: '+10 ZORG earned' },
  { addr: '0xb00b...1337', action: 'claimed repost',   detail: '+20 ZORG earned' },
  { addr: '0xf00d...cafe', action: 'registered agent', detail: 'GhostBot v2.1'   },
  { addr: '0xdead...beef', action: 'posted campaign',  detail: '+500 ZORG pool'  },
  { addr: '0xaaaa...1234', action: 'claimed comment',  detail: '+25 ZORG earned' },
]

// ── Boot terminal — ONE instance only, never duplicated ───────────────────────
// Reducer keeps lines strictly append-only and ignores duplicate indices
// — immune to StrictMode double-invocation and concurrent renders
type TermLine = { text: string; color: 'dim' | 'green' | 'bright' }
type TermState = { lines: TermLine[]; count: number; done: boolean }
type TermAction = { type: 'ADD'; line: TermLine } | { type: 'DONE' }
function termReducer(state: TermState, action: TermAction): TermState {
  if (action.type === 'DONE') return { ...state, done: true }
  // Only append if this line isn't already present (StrictMode guard)
  if (state.count >= BOOT_LINES.length) return state
  return { lines: [...state.lines, action.line], count: state.count + 1, done: false }
}

function BootTerminal({ onReady }: { onReady: () => void }) {
  const [state, dispatch] = useReducer(termReducer, { lines: [], count: 0, done: false })
  const onReadyRef = useRef(onReady)
  // Keep ref current after every render (layout effect = before paint, safe for refs)
  useLayoutEffect(() => { onReadyRef.current = onReady })

  useEffect(() => {
    let cancelled = false
    let i = 0
    const tick = setInterval(() => {
      if (cancelled) return
      if (i < BOOT_LINES.length) {
        const line = BOOT_LINES[i]
        if (line) dispatch({ type: 'ADD', line })
        i++
      } else {
        clearInterval(tick)
        setTimeout(() => {
          if (!cancelled) {
            dispatch({ type: 'DONE' })
            onReadyRef.current()
          }
        }, 300)
      }
    }, 220)
    return () => { cancelled = true; clearInterval(tick) }
  }, []) // runs once per mount

  return (
    <div className="w-full zorg-surface p-4" style={{ fontFamily: "'JetBrains Mono','IBM Plex Mono',monospace" }}>
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[rgba(0,255,65,0.1)]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff003c]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#ffd000]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#00ff41]" />
        <span className="ml-2 text-[0.62rem] text-[rgba(232,255,232,0.28)] tracking-widest uppercase select-none">
          zorg://boot · v0.0.1
        </span>
      </div>
      <div className="space-y-1.5 min-h-[9rem]">
        {state.lines.map((line, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.1 }}
            className={`text-[0.78rem] leading-snug ${
              line.color === 'bright' ? 'text-[#00ff41] font-bold'
              : line.color === 'green' ? 'text-[#00ff41]'
              : 'text-[rgba(232,255,232,0.65)]'
            }`}
            style={{ textShadow: line.color !== 'dim' ? '0 0 8px rgba(0,255,65,0.45)' : undefined }}
          >
            {line.text}
          </motion.div>
        ))}
        {!state.done && <span className="inline-block text-[0.78rem] text-[#00ff41] cursor-blink" aria-hidden="true" />}
      </div>
    </div>
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────
function LiveFeed() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % FEED_ITEMS.length), 2800)
    return () => clearInterval(t)
  }, [])
  const item = FEED_ITEMS[idx]
  if (!item) return null
  return (
    <div className="zorg-surface px-4 py-3 flex items-center gap-3 overflow-hidden" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
      <span className="w-1.5 h-1.5 rounded-full bg-[#00ff41] flex-shrink-0 pulse-green" />
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2 min-w-0 flex-1"
        >
          <span className="text-[0.65rem] text-[rgba(0,217,255,0.7)] flex-shrink-0 tabular-nums">{item.addr}</span>
          <span className="text-[0.65rem] text-[rgba(232,255,232,0.4)] flex-shrink-0">{item.action}</span>
          <span className="text-[0.65rem] text-[#00ff41] truncate">{item.detail}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function StatsStrip() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[
        { label: 'campaigns',   value: '3'    },
        { label: 'ZORG pooled', value: '4.5K' },
        { label: 'tasks done',  value: '156'  },
      ].map((s) => (
        <div key={s.label} className="zorg-surface p-3 text-center">
          <div className="text-xl font-bold tabular-nums text-[#00ff41] leading-none mb-1" style={{ textShadow: '0 0 10px rgba(0,255,65,0.45)' }}>
            {s.value}
          </div>
          <div className="text-[0.58rem] text-[rgba(232,255,232,0.3)] uppercase tracking-widest">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

function PillarsGrid() {
  return (
    <div>
      <div className="text-[0.62rem] text-[rgba(232,255,232,0.3)] uppercase tracking-[0.2em] mb-3 font-mono">── protocol pillars ──</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {PILLARS.map((p) => (
          <div key={p.k} className="zorg-surface p-4 space-y-1.5 hover:border-[rgba(0,255,65,0.3)] transition-colors">
            <div className="text-[0.6rem] text-[rgba(0,217,255,0.55)] tracking-[0.2em] uppercase tabular-nums">{p.k}</div>
            <div className="text-sm font-semibold text-[#e8ffe8]" style={{ fontFamily: "'JetBrains Mono',monospace" }}>{p.title}</div>
            <p className="text-[0.72rem] text-[rgba(232,255,232,0.45)] leading-relaxed">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function ManifestoNote() {
  return (
    <div className="space-y-1.5">
      {[
        'ZORG exists to prove a social layer can function without rulers.',
        'only rules enforced by code and consensus.',
        'zero organization. zero knowledge. zero permission needed.',
      ].map((line, i) => (
        <p key={i} className="text-[0.7rem] text-[rgba(232,255,232,0.35)] leading-relaxed font-mono">
          <span className="text-[rgba(0,255,65,0.35)]">&gt;</span> {line}
        </p>
      ))}
    </div>
  )
}

function WaitlistBox({ val, setVal, done, setDone, compact = false }: {
  val: string; setVal: (v: string) => void
  done: boolean; setDone: (v: boolean) => void
  compact?: boolean
}) {
  return (
    <div className={`zorg-surface p-4 space-y-3 ${compact ? 'p-3' : ''}`}>
      <p className="text-[0.62rem] text-[rgba(232,255,232,0.35)] tracking-widest uppercase font-mono">— mainnet waitlist —</p>
      {done ? (
        <p className="text-[#00ff41] text-[0.78rem] font-mono" style={{ textShadow: '0 0 8px rgba(0,255,65,0.4)' }}>
          &gt; registered. you will be notified when $ZORG deploys.
        </p>
      ) : (
        <div className="flex gap-2">
          <input
            className="zorg-input text-sm flex-1"
            placeholder="@x_handle or email"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && val) setDone(true) }}
            style={{ minHeight: 44 }}
          />
          <button
            className="btn-zorg text-xs px-4 whitespace-nowrap"
            onClick={() => { if (val) setDone(true) }}
            disabled={!val}
            style={{ minHeight: 44 }}
          >
            join
          </button>
        </div>
      )}
    </div>
  )
}

function CTAButtons({ loginWithX, onDocs, large = false }: { loginWithX: () => void; onDocs: () => void; large?: boolean }) {
  return (
    <div className="space-y-3">
      <button
        onClick={loginWithX}
        className="btn-zorg btn-zorg-solid w-full tracking-widest"
        style={{ minHeight: large ? 52 : 48, fontSize: large ? '0.9rem' : '0.8rem' }}
      >
        [ connect x account — enter zorg ]
      </button>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={onDocs} className="btn-zorg py-2.5 text-xs" style={{ minHeight: 44 }}>[ manifesto ]</button>
        <button onClick={() => window.open('https://github.com/nheoshikuyanhemo/Zero_Organization', '_blank')} className="btn-zorg py-2.5 text-xs" style={{ minHeight: 44 }}>[ source ]</button>
      </div>
    </div>
  )
}

// ── Main Landing ──────────────────────────────────────────────────────────────
export default function Landing({ loginWithX, onDocs }: Props) {
  const [ready, setReady]     = useState(false)
  const [waitlistVal, setWV]  = useState('')
  const [waitlistDone, setWD] = useState(false)

  const handleReady = useCallback(() => setReady(true), [])

  // Shared content blocks
  const sharedBottom = ready ? (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="space-y-4 w-full">
      <StatsStrip />
      <LiveFeed />
      <PillarsGrid />
      <ManifestoNote />
    </motion.div>
  ) : null

  return (
    <div className="min-h-dvh relative bg-[#0a0a0a] overflow-x-hidden">
      {/* HackerBackground (matrix rain, data streams, glitch) is mounted globally in App.tsx */}

      {/* ─── SINGLE BootTerminal renders here — hidden, drives the ready state ─── */}
      {/* It is invisible (opacity-0 h-0 overflow-hidden) on tablet/desktop       */}
      {/* where we show it inline; on mobile it renders at its natural position    */}

      {/* ── MOBILE layout (< 640px) ──────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col sm:hidden px-4 py-10 pb-28 space-y-5 max-w-md mx-auto">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <ZorgLogo />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <BootTerminal onReady={handleReady} />
        </motion.div>

        <AnimatePresence>
          {ready && (
            <motion.div key="mob-cta" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
              <p className="text-[0.73rem] text-[rgba(232,255,232,0.45)] leading-relaxed font-mono">
                post tweet links with a $ZORG pool. others engage and earn. auto-distributed. no admins.
              </p>
              <CTAButtons loginWithX={loginWithX} onDocs={onDocs} />
              <WaitlistBox val={waitlistVal} setVal={setWV} done={waitlistDone} setDone={setWD} />
              {sharedBottom}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── TABLET layout (640–1023px) ────────────────────────────────────────── */}
      <div className="relative z-10 hidden sm:flex lg:hidden flex-col items-center px-6 py-12 pb-28 space-y-6 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }} className="w-full">
          <ZorgLogo />
        </motion.div>

        <div className="w-full grid grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            {/* On tablet this BootTerminal is the only one mounted (mobile is hidden) */}
            <BootTerminal onReady={handleReady} />
          </motion.div>

          <AnimatePresence>
            {ready && (
              <motion.div key="tab-cta" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="flex flex-col gap-3">
                <p className="text-[0.72rem] text-[rgba(232,255,232,0.45)] leading-relaxed font-mono">
                  post tweet links with a $ZORG pool.<br />others engage and earn.<br />auto-distributed. no middlemen.
                </p>
                <CTAButtons loginWithX={loginWithX} onDocs={onDocs} />
                <WaitlistBox val={waitlistVal} setVal={setWV} done={waitlistDone} setDone={setWD} compact />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {sharedBottom}
      </div>

      {/* ── DESKTOP layout (≥ 1024px) ────────────────────────────────────────── */}
      <div className="relative z-10 hidden lg:block px-8 py-14 pb-24 max-w-6xl mx-auto">
        <div className="grid grid-cols-[1fr_420px] gap-10 items-start">

          {/* LEFT */}
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
              <ZorgLogo />
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
              {/* On desktop this BootTerminal is the only one mounted (mobile+tablet hidden) */}
              <BootTerminal onReady={handleReady} />
            </motion.div>
            {sharedBottom}
          </div>

          {/* RIGHT — sticky CTA panel */}
          <div className="sticky top-8 space-y-4">
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55, delay: 0.2 }}>
              <ZorgLogo />
            </motion.div>

            <AnimatePresence>
              {ready && (
                <motion.div key="desk-cta" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-3">
                  <p className="text-sm text-[rgba(232,255,232,0.45)] leading-relaxed font-mono">
                    post tweet links with a $ZORG reward pool.<br />
                    others engage and earn — like, repost, comment.<br />
                    auto-distributed at expiry. no middlemen.
                  </p>
                  <CTAButtons loginWithX={loginWithX} onDocs={onDocs} large />
                  <div className="ascii-divider" />
                  <WaitlistBox val={waitlistVal} setVal={setWV} done={waitlistDone} setDone={setWD} />
                  <StatsStrip />
                  <div className="zorg-surface p-4 space-y-2">
                    <div className="text-[0.6rem] text-[rgba(232,255,232,0.3)] uppercase tracking-widest mb-2 font-mono">platform fees</div>
                    {[
                      { label: 'campaign creation', val: '1.00%' },
                      { label: 'per engagement',    val: '0.20%' },
                      { label: 'refund (if any)',   val: '0.50%' },
                    ].map((f) => (
                      <div key={f.label} className="flex justify-between text-[0.68rem] font-mono">
                        <span className="text-[rgba(232,255,232,0.4)]">{f.label}</span>
                        <span className="text-[rgba(255,0,60,0.7)] tabular-nums">{f.val}</span>
                      </div>
                    ))}
                    <p className="text-[0.6rem] text-[rgba(232,255,232,0.22)] leading-relaxed pt-1 font-mono">
                      all fees → marketing wallet · funds dev + community + ZORG stability
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[rgba(0,255,65,0.1)] bg-[rgba(10,10,10,0.96)] px-4 py-2 flex items-center justify-between">
        <span className="text-[0.6rem] text-[rgba(232,255,232,0.22)] tracking-widest font-mono">ZORG PROTOCOL · PRE-LAUNCH · TESTNET</span>
        <span className="text-[0.65rem] text-[rgba(0,255,65,0.5)] pulse-green tracking-widest font-mono">● LIVE</span>
      </div>
    </div>
  )
}
