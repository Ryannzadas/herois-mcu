import { useMemo } from 'react'
import { cn, seeded } from '@/lib/utils'

/** Selo estourado (starburst) de capa de gibi. */
export function Starburst({
  children,
  className,
  spikes = 18,
  seed = 3,
  fill = 'var(--accent-2)',
}: {
  children: React.ReactNode
  className?: string
  spikes?: number
  seed?: number
  fill?: string
}) {
  const points = useMemo(() => {
    const rand = seeded(seed)
    return Array.from({ length: spikes * 2 }, (_, i) => {
      const a = (i / (spikes * 2)) * Math.PI * 2
      const r = i % 2 === 0 ? 48 + rand() * 2 : 36 + rand() * 4
      return `${50 + Math.cos(a) * r},${50 + Math.sin(a) * r}`
    }).join(' ')
  }, [spikes, seed])
  return (
    <div className={cn('relative grid place-items-center', className)}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <polygon points={points} fill="var(--ink)" transform="translate(3 3)" />
        <polygon points={points} fill={fill} stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="miter" />
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  )
}

/** Pedaço de fita adesiva. */
export function Tape({ className }: { className?: string }) {
  return <span aria-hidden className={cn('tape pointer-events-none absolute block h-7 w-24', className)} />
}

/** Borda de papel rasgado (coloque no topo/rodapé de uma seção de cor). */
export function TornEdge({ className, seed = 1, flip = false }: { className?: string; seed?: number; flip?: boolean }) {
  const d = useMemo(() => {
    const rand = seeded(seed)
    let path = 'M0,20 '
    for (let x = 0; x <= 100; x += 1.6 + rand() * 1.8) path += `L${x.toFixed(2)},${(6 + rand() * 9).toFixed(2)} `
    return path + 'L100,20 Z'
  }, [seed])
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 20"
      preserveAspectRatio="none"
      className={cn('pointer-events-none block h-4 w-full sm:h-6', flip && 'rotate-180', className)}
    >
      <path d={d} fill="currentColor" />
    </svg>
  )
}

/** Faixa de texto correndo infinitamente. */
export function Marquee({
  text,
  reverse,
  className,
  speed = 28,
}: {
  text: string
  reverse?: boolean
  className?: string
  speed?: number
}) {
  const items = Array.from({ length: 8 }, (_, i) => (
    <span key={i} className="flex shrink-0 items-center gap-6 pr-6">
      <span>{text}</span>
      <span aria-hidden className="text-[0.6em]">✦</span>
    </span>
  ))
  return (
    <div className={cn('overflow-hidden whitespace-nowrap', className)} aria-label={text} role="marquee">
      <div aria-hidden className="marquee-track" data-reverse={reverse || undefined} style={{ '--marquee-speed': `${speed}s` } as React.CSSProperties}>
        {items}
        {items}
      </div>
    </div>
  )
}
