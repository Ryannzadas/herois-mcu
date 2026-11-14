import { useLayoutEffect, useRef, useState } from 'react'
import { gsap, SplitText, useGSAP } from '@/lib/gsap'
import { cn } from '@/lib/utils'

/**
 * Título enorme da capa: cada linha é dimensionada para ocupar toda a largura.
 * "Homem de Ferro" → ["HOMEM DE", "FERRO"]; a última palavra ganha linha própria.
 */
function splitTitle(name: string): string[] {
  const words = name.toUpperCase().split(/\s+/)
  if (words.length === 1) return words
  return [words.slice(0, -1).join(' '), words[words.length - 1]]
}

const FONT = 'Anton'

export function FitTitle({
  text,
  reduced,
  maxHeight,
  className,
}: {
  text: string
  reduced: boolean
  /** altura máxima por linha, em px (evita títulos curtos gigantes demais) */
  maxHeight: number
  className?: string
}) {
  const ref = useRef<HTMLHeadingElement>(null)
  const lines = splitTitle(text)
  const [sizes, setSizes] = useState<number[] | null>(null)

  useLayoutEffect(() => {
    const el = ref.current!
    const ctx = document.createElement('canvas').getContext('2d')!
    const measure = () => {
      ctx.font = `400 100px "${FONT}", Impact, sans-serif`
      const width = el.clientWidth
      setSizes(lines.map((l) => Math.min((width / ctx.measureText(l).width) * 100 * 0.98, maxHeight / 0.86)))
    }
    measure()
    document.fonts.load(`400 100px "${FONT}"`).then(measure, () => undefined)
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, maxHeight])

  // letras "carimbadas" na capa
  useGSAP(
    () => {
      if (reduced || !sizes) return
      const split = SplitText.create(ref.current!.querySelectorAll('[data-line]'), { type: 'chars' })
      gsap.from(split.chars, {
        yPercent: -35,
        scale: 1.5,
        rotate: () => gsap.utils.random(-14, 14),
        opacity: 0,
        duration: 0.45,
        ease: 'back.out(2.2)',
        stagger: 0.035,
      })
      return () => split.revert()
    },
    { scope: ref, dependencies: [text, !!sizes] },
  )

  return (
    <h2 ref={ref} className={cn('select-none font-display uppercase', className)} style={{ visibility: sizes ? 'visible' : 'hidden' }}>
      {lines.map((l, i) => (
        <span
          key={l + i}
          data-line
          className="ink-stroke block whitespace-nowrap leading-[0.86]"
          style={{
            fontSize: sizes?.[i] ?? 100,
            // acentos em maiúsculas (Ã, É…) passam da altura de linha apertada
            paddingTop: /[ÀÁÂÃÉÊÍÓÔÕÚÇ]/.test(l) ? (sizes?.[i] ?? 100) * 0.16 : undefined,
            WebkitTextStrokeWidth: Math.max(2, (sizes?.[i] ?? 100) * 0.025),
            textShadow: `${Math.max(3, (sizes?.[i] ?? 100) * 0.035)}px ${Math.max(3, (sizes?.[i] ?? 100) * 0.035)}px 0 var(--ink)`,
          }}
        >
          {l}
        </span>
      ))}
    </h2>
  )
}
