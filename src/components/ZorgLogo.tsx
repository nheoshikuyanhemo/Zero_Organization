/**
 * ZorgLogo — renders /public/zorg-logo.svg
 * Source: ZORG0.svg from github.com/nheoshikuyanhemo/template (unmodified)
 *
 * Sizes:
 *   "sm"  — compact nav/header (h-8,  max-w-[120px])
 *   "md"  — inner-page header  (h-12, max-w-[220px])
 *   "lg"  — landing hero       (w-full, no height cap)
 *
 * glitch prop — adds periodic glitch-shift + color-split animation
 */

interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  glitch?: boolean
}

const SIZE_CLASS: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-8 w-auto max-w-[120px]',
  md: 'h-12 w-auto max-w-[220px]',
  lg: 'w-full h-auto',
}

// Keyframes injected inline so they work without touching global CSS
const GLITCH_STYLE = `
  @keyframes zorg-logo-glitch {
    0%,86%,100% { transform:none; filter:drop-shadow(0 0 6px rgba(0,255,65,0.35)); opacity:1; }
    87% { transform:translateX(-3px) skewX(-1deg); filter:drop-shadow(-3px 0 rgba(0,217,255,0.7)) drop-shadow(3px 0 rgba(255,0,60,0.5)); }
    88% { transform:translateX(3px) skewX(1deg);  filter:drop-shadow(3px 0 rgba(0,217,255,0.7)) drop-shadow(-2px 0 rgba(255,0,60,0.5)); opacity:0.88; }
    89% { transform:translateX(-1px); filter:drop-shadow(0 0 8px rgba(0,255,65,0.5)); }
    90% { transform:none; filter:drop-shadow(0 0 6px rgba(0,255,65,0.35)); opacity:1; }
    93% { transform:translateX(2px) scaleX(1.01); filter:drop-shadow(2px 0 rgba(0,217,255,0.5)); }
    94% { transform:none; }
  }
  @keyframes zorg-logo-flicker {
    0%,19%,21%,23%,25%,54%,56%,100% { opacity:1; }
    20%,22%,24%,55% { opacity:0.6; }
  }
`

export function ZorgLogo({ size = 'lg', className = '', glitch = true }: Props) {
  return (
    <>
      {glitch && (
        <style>{GLITCH_STYLE}</style>
      )}
      <img
        src="/zorg-logo.svg"
        alt="ZORG — Zero Organization Zero Knowledge"
        className={`block ${SIZE_CLASS[size]} ${className}`}
        draggable={false}
        style={glitch ? {
          animation: 'zorg-logo-glitch 8s infinite, zorg-logo-flicker 12s infinite',
          filter: 'drop-shadow(0 0 6px rgba(0,255,65,0.35))',
        } : undefined}
      />
    </>
  )
}
