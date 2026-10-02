/**
 * ZorgLogo — renders /public/zorg-logo.svg
 * Source file: ZORG0.svg from github.com/nheoshikuyanhemo/template
 * The file is fetched and stored unmodified at /public/zorg-logo.svg.
 *
 * size prop:
 *   "sm"  — compact nav/header use (h-8,  max-w-[120px])
 *   "md"  — inner-page headers    (h-12, max-w-[220px])
 *   "lg"  — full landing hero     (w-full, no height cap)
 */

interface Props {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_CLASS: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-8 w-auto max-w-[120px]',
  md: 'h-12 w-auto max-w-[220px]',
  lg: 'w-full h-auto',
}

export function ZorgLogo({ size = 'lg', className = '' }: Props) {
  return (
    <img
      src="/zorg-logo.svg"
      alt="ZORG — Zero Organization Zero Knowledge"
      className={`block ${SIZE_CLASS[size]} ${className}`}
      draggable={false}
    />
  )
}
