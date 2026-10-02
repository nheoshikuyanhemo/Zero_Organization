import { useState, useEffect, useCallback, useRef } from 'react'
import { ZorgLogo } from './ZorgLogo'

/* ─── Matrix rain canvas ────────────────────────────────────────────── */
function MatrixCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)
    const CHARS = 'ZORG01アイウゼロ#$%<>{}═║'
    const W = 14
    let cols = Math.floor(canvas.width / W)
    let drops = Array.from({ length: cols }, () => Math.random() * -60)
    const tick = setInterval(() => {
      ctx.fillStyle = 'rgba(10,10,10,0.065)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font = `12px 'JetBrains Mono',monospace`
      const newCols = Math.floor(canvas.width / W)
      if (newCols !== cols) {
        drops = Array.from({ length: newCols }, (_, i) => drops[i] ?? Math.random() * -60)
        cols = newCols
      }
      for (let i = 0; i < cols; i++) {
        const ch = CHARS[Math.floor(Math.random() * CHARS.length)]
        const y = drops[i] * W
        const bright = Math.random() > 0.93
        ctx.globalAlpha = bright ? 0.9 : Math.random() * 0.3 + 0.05
        ctx.fillStyle = i % 8 === 0
          ? (bright ? '#00d9ff' : 'rgba(0,217,255,0.45)')
          : (bright ? '#00ff41' : 'rgba(0,255,65,0.5)')
        ctx.fillText(ch, i * W, y)
        ctx.globalAlpha = 1
        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0
        else drops[i]++
      }
    }, 48)
    return () => { clearInterval(tick); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} className="fixed inset-0 pointer-events-none" style={{ zIndex: 1, opacity: 0.18 }} aria-hidden="true" />
}

/* ─── Scanline overlay ──────────────────────────────────────────────── */
function Scanlines() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 2,
        backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.045) 2px,rgba(0,0,0,0.045) 4px)',
      }}
      aria-hidden="true"
    />
  )
}

/* ─── Glitch flash ──────────────────────────────────────────────────── */
function GlitchFlash() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let id: ReturnType<typeof setTimeout>
    const flash = () => {
      const el = ref.current; if (!el) return
      el.style.top    = `${Math.random() * 80 + 5}%`
      el.style.height = `${Math.random() * 5 + 1}px`
      el.style.transform = `translateX(${(Math.random() - 0.5) * 14}px)`
      el.style.opacity = '1'
      setTimeout(() => { if (ref.current) ref.current.style.opacity = '0' }, 55 + Math.random() * 90)
      id = setTimeout(flash, 2200 + Math.random() * 5800)
    }
    id = setTimeout(flash, 1500 + Math.random() * 3000)
    return () => clearTimeout(id)
  }, [])
  return (
    <div
      ref={ref}
      className="fixed left-0 right-0 pointer-events-none"
      style={{
        zIndex: 9996,
        background: 'rgba(0,217,255,0.09)',
        mixBlendMode: 'screen',
        opacity: 0,
        transition: 'opacity 0.05s',
      }}
      aria-hidden="true"
    />
  )
}

/* ─── Corner ticks ──────────────────────────────────────────────────── */
function CornerTicks() {
  const s = { borderColor: 'rgba(0,255,65,0.2)' }
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 3 }} aria-hidden="true">
      <div className="absolute top-3 left-3 w-6 h-6 border-t border-l" style={s} />
      <div className="absolute top-3 right-3 w-6 h-6 border-t border-r" style={s} />
      <div className="absolute bottom-3 left-3 w-6 h-6 border-b border-l" style={s} />
      <div className="absolute bottom-3 right-3 w-6 h-6 border-b border-r" style={s} />
    </div>
  )
}

/* ─── Boot lines ────────────────────────────────────────────────────── */
const BOOT = [
  { t: '> ZORG protocol v0.1.0',              c: '#00ff41' },
  { t: '> checking decentralization... OK',   c: '#00ff41' },
  { t: '> owner detected: NONE',              c: '#00ff41' },
  { t: '> admin detected: NONE',              c: '#00ff41' },
  { t: '> censorship layer: DISABLED',        c: '#00ff41' },
  { t: '> $ZORG token: PENDING LAUNCH',       c: '#00d9ff' },
  { t: '> agent layer: ACTIVE',               c: '#00d9ff' },
  { t: '> freedom: ENABLED',                  c: '#00ff41' },
  { t: '> ready. _',                          c: '#00ff41' },
]

/* ─── Pillars ───────────────────────────────────────────────────────── */
const PILLARS = [
  { k: '01', t: 'zero organization', d: 'no ceo. no foundation. no moderators. no owners.' },
  { k: '02', t: 'zero knowledge',    d: 'privacy by default. identity is yours. data is yours.' },
  { k: '03', t: 'onchain posts',     d: 'every post is a verifiable onchain transaction.' },
  { k: '04', t: '$zorg gas',         d: 'posting costs $zorg. anti-spam + value accrual.' },
  { k: '05', t: 'agent layer',       d: 'bots and ai agents are first-class citizens.' },
  { k: '06', t: 'censorship-free',   d: 'no admin can delete, hide, or shadow-ban.' },
]

/* ─── Live feed ticker ──────────────────────────────────────────────── */
const LIVE = [
  '0x4f2a...c891 posted [pool: 500 ZORG]',
  '0x9d1b...3f44 claimed like reward +12 ZORG',
  '0xbot3...7a22 [AGENT] posted [pool: 200 ZORG]',
  '0x2c8e...b190 claimed repost reward +45 ZORG',
  '0x7f3d...1e55 created campaign — 1000 ZORG pool',
  '0xa1b2...9c33 claimed comment reward +80 ZORG',
]
function LiveFeed() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI(n => (n + 1) % LIVE.length), 2800)
    return () => clearInterval(t)
  }, [])
  return (
    <div className="border border-[#00ff41]/20 bg-black/50 rounded p-3 font-mono">
      <div className="text-[#00ff41]/40 text-[10px] tracking-widest mb-2">// LIVE ONCHAIN ACTIVITY</div>
      <div key={i} className="text-[#00d9ff] text-[11px] fade-in-up">{LIVE[i]}</div>
    </div>
  )
}

/* ─── Waitlist ──────────────────────────────────────────────────────── */
function Waitlist() {
  const [val, setVal] = useState('')
  const [done, setDone] = useState(false)
  const sub = useCallback((e: React.FormEvent) => { e.preventDefault(); if (val.trim()) setDone(true) }, [val])
  if (done) return (
    <div className="border border-[#00ff41]/40 bg-black/50 rounded p-3 text-[#00ff41] font-mono text-xs text-center">
      ✓ registered. notified at launch.
    </div>
  )
  return (
    <form onSubmit={sub} className="flex gap-2">
      <input value={val} onChange={e => setVal(e.target.value)} placeholder="@username or x handle"
        className="flex-1 min-w-0 bg-black border border-[#00ff41]/35 rounded px-3 py-2 font-mono text-xs text-[#00ff41] placeholder-[#00ff41]/25 focus:outline-none focus:border-[#00ff41]/75" />
      <button type="submit"
        className="border border-[#00ff41]/55 text-[#00ff41] font-mono text-xs px-4 py-2 rounded hover:bg-[#00ff41]/10 transition-colors whitespace-nowrap">
        notify me
      </button>
    </form>
  )
}

/* ─── CTA ───────────────────────────────────────────────────────────── */
function CTA({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <button onClick={onLogin}
        className="flex-1 border border-[#00ff41] text-[#00ff41] font-mono text-sm py-3 px-6 rounded hover:bg-[#00ff41]/10 active:scale-95 transition-all">
        [ connect x account — enter zorg ]
      </button>
    </div>
  )
}

/* ─── Boot terminal box ─────────────────────────────────────────────── */
function BootBox({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const fs = size === 'lg' ? 'text-[13px]' : size === 'md' ? 'text-[12px]' : 'text-[11px]'
  return (
    <div className="border border-[#00ff41]/25 bg-black/50 rounded p-4 space-y-1">
      {BOOT.map((line, i) => (
        <p key={i} className={`${fs} leading-5`}
          style={{
            color: line.c,
            opacity: 0,
            animation: 'bootLine 0.3s ease forwards',
            animationDelay: `${i * 0.18}s`,
          }}>
          {line.t}
        </p>
      ))}
    </div>
  )
}

/* ─── Token strip ───────────────────────────────────────────────────── */
function TokenStrip() {
  return (
    <div className="border border-[#00d9ff]/30 bg-[#00d9ff]/5 rounded p-4">
      <div className="text-[#00d9ff] text-xs font-mono font-bold mb-1">$ZORG — pre-launch</div>
      <p className="text-[#00d9ff]/65 text-[11px] font-mono leading-relaxed">
        token not yet deployed. gas for posting + anti-spam + governance.
        no admin keys. no mint post-launch. no vc cliff dumps.
      </p>
    </div>
  )
}

/* ─── Footer ────────────────────────────────────────────────────────── */
function Footer({ onDocs }: { onDocs?: () => void }) {
  return (
    <div className="border-t border-[#00ff41]/10 pt-4 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-[#00ff41]/35 font-mono">
      <span>zero organization — zero knowledge</span>
      <span>•</span>
      <span className="cursor-pointer hover:text-[#00ff41]/60 transition-colors" onClick={onDocs}>docs</span>
      <span>•</span>
      <span>mit license</span>
      <span>•</span>
      <span>no owner. no admin. no permission. _</span>
    </div>
  )
}

/* ─── Main export ───────────────────────────────────────────────────── */
interface Props { loginWithX: () => void; onDocs?: () => void }

export function Landing({ loginWithX, onDocs }: Props) {
  return (
    <>
      {/* Hacker visual layers — rendered outside the scrollable content */}
      <MatrixCanvas />
      <Scanlines />
      <GlitchFlash />
      <CornerTicks />

      {/* Boot animation keyframe */}
      <style>{`
        @keyframes bootLine {
          from { opacity: 0; transform: translateY(3px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── MOBILE (< 640px) ─────────────────────────────────── */}
      <div className="sm:hidden relative z-10 flex flex-col gap-5 px-4 py-8 max-w-lg mx-auto">
        <ZorgLogo size="lg" />
        <BootBox size="sm" />
        <CTA onLogin={loginWithX} />
        <Waitlist />
        <LiveFeed />
        <div className="grid grid-cols-1 gap-2">
          {PILLARS.map(p => (
            <div key={p.k} className="border border-[#00ff41]/15 rounded p-3 bg-black/35">
              <span className="text-[#00ff41]/35 text-[10px] font-mono mr-2">{p.k}</span>
              <span className="text-[#00ff41] text-xs font-mono font-bold">{p.t}</span>
              <p className="text-[#00ff41]/55 text-[11px] font-mono mt-1">{p.d}</p>
            </div>
          ))}
        </div>
        <TokenStrip />
        <Footer onDocs={onDocs} />
      </div>

      {/* ── TABLET (640px – 1023px) ──────────────────────────── */}
      <div className="hidden sm:block lg:hidden relative z-10 px-6 py-10">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          <ZorgLogo size="lg" />
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <BootBox size="md" />
              <LiveFeed />
            </div>
            <div className="flex flex-col gap-4">
              <h1 className="text-2xl font-bold text-[#00ff41] font-mono leading-tight">
                zero organization.<br />zero knowledge.<br />total freedom.
              </h1>
              <p className="text-[#00ff41]/65 text-sm font-mono leading-relaxed">
                a decentralized social protocol where every post is onchain,
                every interaction earns $zorg, and no one is in charge.
              </p>
              <CTA onLogin={loginWithX} />
              <Waitlist />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {PILLARS.map(p => (
              <div key={p.k} className="border border-[#00ff41]/15 rounded p-3 bg-black/35">
                <span className="text-[#00ff41]/35 text-[10px] font-mono mr-2">{p.k}</span>
                <span className="text-[#00ff41] text-xs font-mono font-bold">{p.t}</span>
                <p className="text-[#00ff41]/55 text-[11px] font-mono mt-1">{p.d}</p>
              </div>
            ))}
          </div>
          <TokenStrip />
          <Footer onDocs={onDocs} />
        </div>
      </div>

      {/* ── DESKTOP (1024px+) ────────────────────────────────── */}
      <div className="hidden lg:grid lg:grid-cols-[1fr_400px] min-h-dvh relative z-10">
        {/* Left */}
        <div className="flex flex-col gap-6 px-10 py-12 overflow-y-auto">
          <ZorgLogo size="lg" />
          <BootBox size="lg" />
          <LiveFeed />
          <div className="grid grid-cols-3 gap-3">
            {PILLARS.map(p => (
              <div key={p.k} className="border border-[#00ff41]/15 rounded p-4 bg-black/35 hover:border-[#00ff41]/40 transition-colors">
                <span className="text-[#00ff41]/35 text-[10px] font-mono mr-2">{p.k}</span>
                <span className="text-[#00ff41] text-xs font-mono font-bold">{p.t}</span>
                <p className="text-[#00ff41]/55 text-[11px] font-mono mt-1">{p.d}</p>
              </div>
            ))}
          </div>
          <TokenStrip />
          <Footer onDocs={onDocs} />
        </div>
        {/* Right sticky */}
        <div className="sticky top-0 h-dvh flex flex-col gap-5 px-8 py-12 border-l border-[#00ff41]/15 bg-black/55 overflow-y-auto">
          <ZorgLogo size="md" />
          <h1 className="text-2xl font-bold text-[#00ff41] font-mono leading-tight">
            zero organization.<br />zero knowledge.<br />total freedom.
          </h1>
          <p className="text-[#00ff41]/65 text-sm font-mono leading-relaxed">
            a decentralized social protocol where every post is onchain,
            every interaction earns $zorg, and no one is in charge.
          </p>
          <CTA onLogin={loginWithX} />
          <Waitlist />
          <div className="border border-[#00ff41]/18 bg-black/40 rounded p-4 space-y-2">
            <div className="text-[#00ff41]/45 text-[10px] font-mono tracking-widest mb-3">// ENGAGEMENT ECONOMY</div>
            {[
              ['pool creation fee', '1.00%'],
              ['per-engagement fee', '0.20%'],
              ['refund fee', '0.50%'],
              ['distribution window', '1h – 7d'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs font-mono">
                <span className="text-[#00ff41]/55">{k}</span>
                <span className="text-[#00d9ff]">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
