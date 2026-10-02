import { useEffect, useRef, useMemo } from 'react'

// ─────────────────────────────────────────────────────────────
// HackerBackground — persistent visual layer shown on ALL pages
// Layers (bottom to top):
//   1. Matrix rain canvas  (green/cyan falling chars)
//   2. Data-stream columns (vertical scrolling hex)
//   3. Hex dump ticker     (horizontal scrolling hex)
//   4. Corner grid lines   (subtle terminal frame)
// The scanline overlay and film-grain noise live in index.css
// on #root::after / #root::before so they cover everything.
// ─────────────────────────────────────────────────────────────

// ── 1. Matrix Rain ────────────────────────────────────────────
function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const CHARS = '01ZORG#$%アイウゼロ╔╗╚╝═║░▒▓<>{}[]!?'
    const COL_W = 16
    let cols    = Math.floor(canvas.width / COL_W)
    let drops   = Array.from({ length: cols }, () => Math.random() * -80)

    // Rebuild drops array on resize
    const handleResize = () => {
      const newCols = Math.floor(canvas.width / COL_W)
      if (newCols !== cols) {
        const old = drops
        drops = Array.from({ length: newCols }, (_, i) => old[i] ?? Math.random() * -80)
        cols  = newCols
      }
    }
    window.addEventListener('resize', handleResize)

    const tick = setInterval(() => {
      ctx.fillStyle = 'rgba(10,10,10,0.06)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font = `13px 'JetBrains Mono', monospace`

      for (let i = 0; i < drops.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)]
        const y    = drops[i] * COL_W
        const x    = i * COL_W

        // Lead char brighter
        const bright = Math.random() > 0.92
        ctx.globalAlpha = bright
          ? 0.85
          : Math.random() * 0.32 + 0.04

        // Cyan accent every ~9th column
        ctx.fillStyle = i % 9 === 0
          ? (bright ? '#00d9ff' : 'rgba(0,217,255,0.5)')
          : (bright ? '#00ff41' : 'rgba(0,255,65,0.55)')

        ctx.fillText(char, x, y)
        ctx.globalAlpha = 1

        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0
        else drops[i]++
      }
    }, 50)

    return () => {
      clearInterval(tick)
      window.removeEventListener('resize', resize)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1, opacity: 0.15 }}
      aria-hidden="true"
    />
  )
}

// ── 2. Data-stream columns ────────────────────────────────────
const HEX_CHARS = '0123456789ABCDEF'
function randomHexLine(len = 24): string {
  return Array.from({ length: len }, () => HEX_CHARS[Math.floor(Math.random() * 16)]).join(' ')
}

function DataStreams() {
  // Static — positions chosen once, CSS animation scrolls them
  const streams = useMemo(() => (
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: `${5 + i * 12}%`,
      delay: `${i * 1.3}s`,
      dur: `${14 + i * 2.5}s`,
      text: Array.from({ length: 40 }, () => randomHexLine(8)).join('\n'),
    }))
  ), [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }} aria-hidden="true">
      {streams.map((s) => (
        <div
          key={s.id}
          className="data-stream-char"
          style={{
            left: s.left,
            top: '100%',
            animationDuration: s.dur,
            animationDelay: s.delay,
            fontSize: '0.52rem',
            opacity: 0.09,
          }}
        >
          {s.text}
        </div>
      ))}
    </div>
  )
}

// ── 3. Hex dump ticker ────────────────────────────────────────
const HEX_STRIP = Array.from(
  { length: 6 },
  (_, r) => Array.from({ length: 32 }, (_, c) =>
    (r * 32 + c).toString(16).padStart(2, '0').toUpperCase()
  ).join(' ')
).join('  ·  ')

function HexTicker() {
  return (
    <div className="fixed bottom-8 left-0 right-0 pointer-events-none hex-ticker" style={{ zIndex: 3 }} aria-hidden="true">
      <div className="hex-ticker-inner select-none">
        {HEX_STRIP}&nbsp;&nbsp;&nbsp;{HEX_STRIP}
      </div>
    </div>
  )
}

// ── 4. Corner frame lines ─────────────────────────────────────
function CornerLines() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 4 }} aria-hidden="true">
      {/* Top-left */}
      <div className="absolute top-3 left-3 w-8 h-8 border-t border-l" style={{ borderColor: 'rgba(0,255,65,0.18)' }} />
      {/* Top-right */}
      <div className="absolute top-3 right-3 w-8 h-8 border-t border-r" style={{ borderColor: 'rgba(0,255,65,0.18)' }} />
      {/* Bottom-left */}
      <div className="absolute bottom-3 left-3 w-8 h-8 border-b border-l" style={{ borderColor: 'rgba(0,255,65,0.18)' }} />
      {/* Bottom-right */}
      <div className="absolute bottom-3 right-3 w-8 h-8 border-b border-r" style={{ borderColor: 'rgba(0,255,65,0.18)' }} />
      {/* Subtle vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)',
          zIndex: 0,
        }}
      />
    </div>
  )
}

// ── 5. Glitch flash ───────────────────────────────────────────
function GlitchFlash() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const flash = () => {
      const el = ref.current
      if (!el) return
      // Random horizontal tear
      const top    = Math.random() * 80 + 5
      const height = Math.random() * 6 + 1
      const shift  = (Math.random() - 0.5) * 12

      el.style.cssText = `
        position: fixed;
        top: ${top}%;
        left: 0; right: 0;
        height: ${height}px;
        transform: translateX(${shift}px);
        background: rgba(0,217,255,0.08);
        z-index: 9996;
        pointer-events: none;
        mix-blend-mode: screen;
        opacity: 1;
      `
      setTimeout(() => { if (el) el.style.opacity = '0' }, 60 + Math.random() * 80)
    }

    // Fire randomly every 2–8 seconds
    const schedule = () => {
      const delay = 2000 + Math.random() * 6000
      return setTimeout(() => { flash(); schedule() }, delay)
    }
    const id = schedule()
    return () => clearTimeout(id)
  }, [])

  return <div ref={ref} style={{ opacity: 0 }} aria-hidden="true" />
}

// ── Main export ───────────────────────────────────────────────
export function HackerBackground() {
  return (
    <>
      <MatrixRain />
      <DataStreams />
      <HexTicker />
      <CornerLines />
      <GlitchFlash />
    </>
  )
}
