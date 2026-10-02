/**
 * ZorgLogo — renders /public/zorg-logo.svg
 * Keyframes defined in index.css (zorg-logo-glitch, zorg-logo-flicker)
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

export function ZorgLogo({ size = 'lg', className = '', glitch = true }: Props) {
  return (
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
  )
}
