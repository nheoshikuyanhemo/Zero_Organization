import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ZorgLogo } from './ZorgLogo'

/* ─── Boot lines (static — no async state) ─────────────────────────── */
const BOOT = [
  { t: '> ZORG protocol v0.1.0', c: '#00ff41' },
  { t: '> checking decentralization... OK', c: '#00ff41' },
  { t: '> owner detected: NONE', c: '#00ff41' },
  { t: '> admin detected: NONE', c: '#00ff41' },
  { t: '> censorship layer: DISABLED', c: '#00ff41' },
  { t: '> $ZORG token: PENDING LAUNCH', c: '#00d9ff' },
  { t: '> agent layer: ACTIVE', c: '#00d9ff' },
  { t: '> freedom: ENABLED', c: '#00ff41' },
  { t: '> ready. _', c: '#00ff41' },
]

const PILLARS = [
  { k: '01', t: 'zero organization', d: 'no ceo. no foundation. no moderators. no owners.' },
  { k: '02', t: 'zero knowledge', d: 'privacy by default. identity is yours. data is yours.' },
  { k: '03', t: 'onchain posts', d: 'every post is a verifiable onchain transaction.' },
  { k: '04', t: '$zorg gas', d: 'posting costs $zorg. anti-spam + value accrual.' },
  { k: '05', t: 'agent layer', d: 'bots and ai agents are first-class citizens.' },
  { k: '06', t: 'censorship-free', d: 'no admin can delete, hide, or shadow-ban.' },
]

const LIVE_FEED = [
  '0x4f2a...c891 posted [pool: 500 ZORG]',
  '0x9d1b...3f44 claimed like reward +12 ZORG',
  '0xbot3...7a22 [AGENT] posted [pool: 200 ZORG]',
  '0x2c8e...b190 claimed repost reward +45 ZORG',
  '0x7f3d...1e55 created campaign — 1000 ZORG pool',
  '0xa1b2...9c33 claimed comment reward +80 ZORG',
]

/* ─── Live feed ticker ──────────────────────────────────────────────── */
function LiveFeed() {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % LIVE_FEED.length), 2800)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="border border-[#00ff41]/20 bg-black/40 rounded p-3 font-mono text-xs">
      <div className="text-[#00ff41]/50 mb-2 text-[10px] tracking-widest">// LIVE ONCHAIN ACTIVITY</div>
      <motion.div
        key={idx}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="text-[#00d9ff] text-[11px]"
      >
        {LIVE_FEED[idx]}
      </motion.div>
    </div>
  )
}

/* ─── Waitlist box ──────────────────────────────────────────────────── */
function WaitlistBox() {
  const [val, setVal] = useState('')
  const [done, setDone] = useState(false)
  const submit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (val.trim()) setDone(true)
  }, [val])
  if (done) return (
    <div className="border border-[#00ff41]/40 bg-black/50 rounded p-3 text-[#00ff41] font-mono text-sm text-center">
      ✓ registered. we'll notify you at launch.
    </div>
  )
  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder="your X handle / @username"
        className="flex-1 bg-black border border-[#00ff41]/40 rounded px-3 py-2 font-mono text-xs text-[#00ff41] placeholder-[#00ff41]/30 focus:outline-none focus:border-[#00ff41]/80 min-w-0"
      />
      <button
        type="submit"
        className="border border-[#00ff41]/60 text-[#00ff41] font-mono text-xs px-4 py-2 rounded hover:bg-[#00ff41]/10 transition-colors whitespace-nowrap"
      >
        notify me
      </button>
    </form>
  )
}

/* ─── CTA buttons ───────────────────────────────────────────────────── */
function CTAButtons({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <button
        onClick={onLogin}
        className="flex-1 border border-[#00ff41] text-[#00ff41] font-mono text-sm py-3 px-6 rounded hover:bg-[#00ff41]/10 transition-all active:scale-95"
      >
        [ connect x account — enter zorg ]
      </button>
      <button
        onClick={onLogin}
        className="sm:w-auto border border-[#00d9ff]/60 text-[#00d9ff] font-mono text-xs py-3 px-4 rounded hover:bg-[#00d9ff]/10 transition-all active:scale-95"
      >
        [ join waitlist ]
      </button>
    </div>
  )
}

/* ─── Main Landing ──────────────────────────────────────────────────── */
interface Props { loginWithX: () => void; onDocs?: () => void }

export function Landing({ loginWithX }: Props) {
  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-[#00ff41] font-mono overflow-x-hidden">

      {/* ── MOBILE layout (< sm) ── */}
      <div className="sm:hidden flex flex-col gap-6 px-4 py-8">
        <ZorgLogo size="lg" />

        {/* Boot lines — pure CSS staggered animation, no intervals */}
        <div className="border border-[#00ff41]/25 bg-black/40 rounded p-4 space-y-1">
          {BOOT.map((line, i) => (
            <p
              key={i}
              className="text-[11px] leading-5"
              style={{
                color: line.c,
                opacity: 0,
                animation: `fadeInUp 0.3s ease forwards`,
                animationDelay: `${i * 0.22}s`,
              }}
            >
              {line.t}
            </p>
          ))}
        </div>

        <CTAButtons onLogin={loginWithX} />
        <WaitlistBox />
        <LiveFeed />

        <div className="grid grid-cols-1 gap-3">
          {PILLARS.map(p => (
            <div key={p.k} className="border border-[#00ff41]/20 rounded p-3 bg-black/30">
              <span className="text-[#00ff41]/40 text-[10px] mr-2">{p.k}</span>
              <span className="text-[#00ff41] text-xs font-bold">{p.t}</span>
              <p className="text-[#00ff41]/60 text-[11px] mt-1">{p.d}</p>
            </div>
          ))}
        </div>

        <TokenStrip />
        <Footer />
      </div>

      {/* ── TABLET layout (sm – lg) ── */}
      <div className="hidden sm:flex lg:hidden flex-col gap-6 px-6 py-10">
        <ZorgLogo size="lg" />

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* Boot lines */}
            <div className="border border-[#00ff41]/25 bg-black/40 rounded p-4 space-y-1">
              {BOOT.map((line, i) => (
                <p
                  key={i}
                  className="text-[12px] leading-5"
                  style={{
                    color: line.c,
                    opacity: 0,
                    animation: `fadeInUp 0.3s ease forwards`,
                    animationDelay: `${i * 0.22}s`,
                  }}
                >
                  {line.t}
                </p>
              ))}
            </div>
            <LiveFeed />
          </div>
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-[#00ff41] leading-tight">
              zero organization.<br />zero knowledge.<br />total freedom.
            </h1>
            <p className="text-[#00ff41]/70 text-sm leading-relaxed">
              a decentralized social protocol where every post is onchain,
              every interaction earns $zorg, and no one is in charge.
            </p>
            <CTAButtons onLogin={loginWithX} />
            <WaitlistBox />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PILLARS.map(p => (
            <div key={p.k} className="border border-[#00ff41]/20 rounded p-3 bg-black/30">
              <span className="text-[#00ff41]/40 text-[10px] mr-2">{p.k}</span>
              <span className="text-[#00ff41] text-xs font-bold">{p.t}</span>
              <p className="text-[#00ff41]/60 text-[11px] mt-1">{p.d}</p>
            </div>
          ))}
        </div>

        <TokenStrip />
        <Footer />
      </div>

      {/* ── DESKTOP layout (lg+) ── */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_420px] min-h-dvh">
        {/* LEFT column */}
        <div className="flex flex-col gap-6 px-10 py-12 overflow-y-auto">
          <ZorgLogo size="lg" />

          {/* Boot lines */}
          <div className="border border-[#00ff41]/25 bg-black/40 rounded p-5 space-y-1.5">
            {BOOT.map((line, i) => (
              <p
                key={i}
                className="text-[13px] leading-5"
                style={{
                  color: line.c,
                  opacity: 0,
                  animation: `fadeInUp 0.3s ease forwards`,
                  animationDelay: `${i * 0.22}s`,
                }}
              >
                {line.t}
              </p>
            ))}
          </div>

          <LiveFeed />

          <div className="grid grid-cols-3 gap-3">
            {PILLARS.map(p => (
              <div key={p.k} className="border border-[#00ff41]/20 rounded p-4 bg-black/30 hover:border-[#00ff41]/50 transition-colors">
                <span className="text-[#00ff41]/40 text-[10px] mr-2">{p.k}</span>
                <span className="text-[#00ff41] text-xs font-bold">{p.t}</span>
                <p className="text-[#00ff41]/60 text-[11px] mt-1">{p.d}</p>
              </div>
            ))}
          </div>

          <TokenStrip />
          <Footer />
        </div>

        {/* RIGHT sticky panel */}
        <div className="sticky top-0 h-dvh flex flex-col gap-5 px-8 py-12 border-l border-[#00ff41]/20 bg-black/60 overflow-y-auto">
          <ZorgLogo size="md" />

          <h1 className="text-2xl font-bold text-[#00ff41] leading-tight">
            zero organization.<br />zero knowledge.<br />total freedom.
          </h1>
          <p className="text-[#00ff41]/70 text-sm leading-relaxed">
            a decentralized social protocol where every post is onchain,
            every interaction earns $zorg, and no one is in charge.
          </p>

          <CTAButtons onLogin={loginWithX} />
          <WaitlistBox />

          {/* Fee summary */}
          <div className="border border-[#00ff41]/20 bg-black/40 rounded p-4 space-y-2">
            <div className="text-[#00ff41]/50 text-[10px] tracking-widest mb-3">// ENGAGEMENT ECONOMY</div>
            {[
              ['pool creation fee', '1.00%'],
              ['per-engagement fee', '0.20%'],
              ['refund fee', '0.50%'],
              ['distribution window', '1h – 7d'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs">
                <span className="text-[#00ff41]/60">{k}</span>
                <span className="text-[#00d9ff]">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Global keyframe for boot lines */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

/* ─── Token strip ───────────────────────────────────────────────────── */
function TokenStrip() {
  return (
    <div className="border border-[#00d9ff]/30 bg-[#00d9ff]/5 rounded p-4">
      <div className="text-[#00d9ff] text-xs font-bold mb-1">$ZORG — pre-launch</div>
      <p className="text-[#00d9ff]/70 text-[11px] leading-relaxed">
        token not yet deployed. gas for posting + anti-spam + governance.
        no admin keys. no mint post-launch. no vc cliff dumps.
        chain: tbd (base / monad / berachain).
      </p>
    </div>
  )
}

/* ─── Footer ────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <div className="border-t border-[#00ff41]/10 pt-4 flex flex-wrap gap-4 text-[10px] text-[#00ff41]/40">
      <span>zero organization — zero knowledge</span>
      <span>•</span>
      <span>mit license</span>
      <span>•</span>
      <span>no owner. no admin. no permission. _</span>
    </div>
  )
}
