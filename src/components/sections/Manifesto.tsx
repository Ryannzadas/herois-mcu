import { useMemo, useRef } from 'react'
import { manifestoOf, type Character } from '@/data/characters'
import { gsap, useGSAP } from '@/lib/gsap'
import { cn, seeded } from '@/lib/utils'

/**
 * Seção 2 — manifesto com recorte de marca-texto.
 * Cada linha é revelada por uma faixa de marca-texto na cor da edição, com
 * borda de papel rasgado: a faixa cresce da esquerda pra direita, cobre a
 * linha e se recolhe pra direita deixando o texto. Uma linha por vez, presa
 * ao scroll (pin + scrub). Só transform e opacity são animados.
 */
export function Manifesto({ character: c, reduced }: { character: Character; reduced: boolean }) {
  const scope = useRef<HTMLElement>(null)
  const lines = manifestoOf(c)

  useGSAP(
    () => {
      const rows = gsap.utils.toArray<HTMLElement>('[data-row]', scope.current)
      const texts = rows.map((r) => r.querySelector('[data-text]')!)
      const strips = rows.map((r) => r.querySelector('[data-strip]')!)

      if (reduced) {
        gsap.from(texts, {
          opacity: 0,
          duration: 0.6,
          stagger: 0.15,
          scrollTrigger: { trigger: scope.current, start: 'top 70%' },
        })
        return
      }

      const mm = gsap.matchMedia()
      mm.add({ mobile: '(max-width: 767px)', desktop: '(min-width: 768px)' }, (ctx) => {
        const { mobile } = ctx.conditions as { mobile: boolean }
        gsap.set(texts, { opacity: 0 })
        gsap.set(strips, { scaleX: 0, transformOrigin: 'left center' })

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: scope.current,
            start: 'top top',
            end: `+=${lines.length * (mobile ? 45 : 65)}%`,
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
          },
        })
        rows.forEach((_, i) => {
          tl.set(strips[i], { transformOrigin: 'left center' })
            .to(strips[i], { scaleX: 1, duration: 1, ease: 'power2.inOut' })
            // coberta pela faixa, a linha aparece por baixo
            .set(texts[i], { opacity: 1 })
            .set(strips[i], { transformOrigin: 'right center' })
            .to(strips[i], { scaleX: 0, duration: 1, ease: 'power2.inOut' })
            .to({}, { duration: 0.25 })
        })
        tl.from('[data-sign]', { opacity: 0, y: 20, duration: 0.8 }).to({}, { duration: 0.5 })
      })
      return () => mm.revert()
    },
    { scope, dependencies: [c.id, reduced], revertOnUpdate: true },
  )

  return (
    <section
      id="manifesto"
      ref={scope}
      aria-label={`Manifesto: ${c.codename}`}
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-ink px-4 py-20 text-center sm:px-8"
    >
      {/* retícula sutil na cor da edição */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--accent) 30%, transparent 33%)',
          backgroundSize: '14px 14px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, #000 100%)',
        }}
      />

      <p className="relative mb-8 -rotate-2 font-hand text-2xl text-paper/70 sm:text-3xl">o editor sublinhou:</p>

      <h2 className="relative flex flex-col items-center gap-[0.12em] leading-none">
        {lines.map((line, i) => (
          <ManifestoLine key={`${c.id}-${i}`} text={line} serif={i % 2 === 0} seed={c.file * 10 + i} />
        ))}
      </h2>

      <p data-sign className="relative mt-10 font-sfx text-xl tracking-wide text-paper/80 sm:text-2xl">
        — {c.realName}, desde {c.firstAppearance.year}
      </p>
    </section>
  )
}

function ManifestoLine({ text, serif, seed }: { text: string; serif: boolean; seed: number }) {
  const clip = useMemo(() => tornClip(seed), [seed])
  return (
    <span data-row className="relative inline-block px-[0.12em]">
      <span
        data-text
        className={cn(
          'relative block whitespace-nowrap',
          serif ? 'font-serif font-black italic text-accent-2' : 'font-display uppercase text-paper',
        )}
        style={{ fontSize: lineSize(text, serif) }}
      >
        {text}
      </span>
      {/* faixa de marca-texto com borda de papel rasgado */}
      <span
        data-strip
        aria-hidden
        className="pointer-events-none absolute -inset-x-[0.15em] inset-y-[0.08em] block bg-accent will-change-transform"
        style={{ clipPath: clip }}
      />
    </span>
  )
}

/**
 * Tamanho da linha: o maior possível sem quebrar. Largura média por letra
 * (em em) de cada fonte: Anton maiúscula ≈ 0,46; Fraunces itálica ≈ 0,5.
 */
function lineSize(text: string, serif: boolean) {
  const perChar = serif ? 0.5 : 0.46
  const fit = 88 / (text.length * perChar)
  return `min(${serif ? '6.5rem' : '7.5rem'}, ${fit.toFixed(2)}vw)`
}

/** Polígono com bordas superior e inferior irregulares (papel rasgado). */
function tornClip(seed: number) {
  const rand = seeded(seed)
  const top: string[] = []
  const bottom: string[] = []
  for (let x = 0; x <= 100; x += 2 + rand() * 3) {
    top.push(`${x.toFixed(1)}% ${(rand() * 9).toFixed(1)}%`)
    bottom.push(`${x.toFixed(1)}% ${(91 + rand() * 9).toFixed(1)}%`)
  }
  top.push(`100% ${(rand() * 9).toFixed(1)}%`)
  bottom.push(`100% ${(91 + rand() * 9).toFixed(1)}%`)
  // laterais também levemente irregulares
  return `polygon(${top.join(', ')}, 98% 50%, ${bottom.reverse().join(', ')}, 2% 50%)`
}
