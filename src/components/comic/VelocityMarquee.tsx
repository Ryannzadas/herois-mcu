import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap'
import { cn } from '@/lib/utils'

/**
 * Faixa gigante em loop infinito cuja velocidade acompanha a do scroll:
 * rola mais rápido quando o usuário rola rápido e inverte o sentido quando
 * ele rola para cima. Anima só transform (x) via gsap.quickSetter.
 */
export function VelocityMarquee({
  text,
  reverse = false,
  className,
  /** px por segundo em repouso */
  base = 60,
  paused = false,
}: {
  text: string
  reverse?: boolean
  className?: string
  base?: number
  paused?: boolean
}) {
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const track = trackRef.current!
    const setX = gsap.quickSetter(track, 'x', 'px')
    let x = 0
    let half = track.scrollWidth / 2
    let lastY = window.scrollY
    let dir = 1 // 1 = rolando para baixo, -1 = para cima
    let boost = 0

    const ro = new ResizeObserver(() => (half = track.scrollWidth / 2))
    ro.observe(track)

    const tick = (_t: number, deltaMs: number) => {
      const dt = Math.min(0.05, deltaMs / 1000)
      const y = window.scrollY
      const dy = y - lastY
      lastY = y
      if (dy !== 0) dir = dy > 0 ? 1 : -1
      // empurrão proporcional à velocidade do scroll, que decai suavemente
      boost = gsap.utils.interpolate(boost, Math.min(2000, Math.abs(dy) / Math.max(dt, 0.001)), 0.12)
      if (paused) return
      const speed = (base + boost * 0.35) * dir * (reverse ? -1 : 1)
      x -= speed * dt
      if (half > 0) x = gsap.utils.wrap(-half, 0, x)
      setX(x)
    }
    gsap.ticker.add(tick)
    return () => {
      gsap.ticker.remove(tick)
      ro.disconnect()
    }
  }, [base, reverse, paused, text])

  const items = Array.from({ length: 6 }, (_, i) => (
    <span key={i} className="flex shrink-0 items-center gap-[0.4em] pr-[0.4em]">
      <span>{text}</span>
      <span aria-hidden className="text-[0.5em]">✦</span>
    </span>
  ))

  return (
    <div className={cn('overflow-hidden whitespace-nowrap', className)} aria-hidden>
      <div ref={trackRef} className="flex w-max will-change-transform">
        {items}
        {items}
      </div>
    </div>
  )
}
