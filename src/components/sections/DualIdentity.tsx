import { useRef, useState } from 'react'
import { ComicButton } from '@/components/ui/comic-button'
import { duoOf, type Character } from '@/data/characters'
import { getMedia } from '@/data/media'
import { gsap, SplitText, useGSAP } from '@/lib/gsap'
import { scrollToTarget } from '@/lib/smooth-scroll'
import { cn } from '@/lib/utils'

/**
 * Seção 4 — dupla identidade, como página dupla de gibi.
 * À esquerda o herói em ação, à direita o lado humano (foto do ator, licença
 * livre). As duas metades entram deslizando de lados opostos e o título do
 * meio ("Herói / Humano" ou o par do personagem) se monta letra por letra.
 * Cada lado leva a uma seção: Trajes e Ficha.
 */
export function DualIdentity({ character: c, reduced }: { character: Character; reduced: boolean }) {
  const scope = useRef<HTMLElement>(null)
  const media = getMedia(c.id)
  const [heroWord, humanWord] = duoOf(c)
  const action = media?.scenes.at(-1)
  const [colored, setColored] = useState(false)

  useGSAP(
    () => {
      const split = SplitText.create(scope.current!.querySelectorAll('[data-word]'), { type: 'chars' })
      if (reduced) {
        gsap.from('[data-side], [data-word]', {
          opacity: 0,
          duration: 0.6,
          stagger: 0.1,
          scrollTrigger: { trigger: scope.current, start: 'top 70%' },
        })
        return () => split.revert()
      }
      const mobile = window.matchMedia('(max-width: 767px)').matches
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: scope.current, start: 'top 85%', end: 'top 15%', scrub: 0.6 },
      })
      tl.fromTo('[data-side="hero"]', { xPercent: -100, rotate: -6 }, { xPercent: 0, rotate: -1.5, duration: 1 }, 0)
        .fromTo('[data-side="human"]', { xPercent: 100, rotate: 6 }, { xPercent: 0, rotate: 1.5, duration: 1 }, 0)
        .from(
          split.chars,
          {
            opacity: 0,
            yPercent: mobile ? 40 : 80,
            rotate: () => gsap.utils.random(-25, 25),
            scale: 1.6,
            duration: 0.25,
            stagger: 0.04,
            ease: 'back.out(2)',
          },
          0.45,
        )
      return () => split.revert()
    },
    { scope, dependencies: [c.id, reduced], revertOnUpdate: true },
  )

  return (
    <section
      id="identidade"
      ref={scope}
      aria-label="Dupla identidade"
      className="relative overflow-hidden bg-paper bg-texture px-4 py-16 sm:px-8 md:py-24"
    >
      <div className="relative mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[1fr_auto_1fr] md:gap-6">
        {/* lado herói */}
        <Side
          side="hero"
          label="Com o traje"
          caption="Os trajes, as lutas e os números de cada filme."
          cta="Ver os trajes"
          target="#trajes"
        >
          {action ? (
            <img src={action.src} alt={`${c.codename} em ação`} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <div className="halftone-accent flex h-full items-end justify-center bg-accent">
              <img src={`/characters/${c.id}/traje.png`} alt={`${c.codename} com o traje`} loading="lazy" className="h-[92%] w-auto object-contain drop-shadow-[6px_6px_0_var(--ink)]" />
            </div>
          )}
        </Side>

        {/* título do meio, montado letra por letra */}
        {/* key: o SplitText restaura o texto antigo ao reverter; um h2 novo por herói evita isso */}
        <h2
          key={c.id}
          className="order-first flex flex-col items-center text-center md:order-none"
          aria-label={`${heroWord} / ${humanWord}`}
        >
          <span data-word className="ink-stroke block font-display text-[clamp(3rem,8vw,6.5rem)] uppercase leading-[0.9] text-accent" style={{ WebkitTextStrokeWidth: 2 }}>
            {heroWord}
          </span>
          <span aria-hidden className="my-1 font-display text-5xl leading-none text-ink">/</span>
          <span data-word className="block font-serif text-[clamp(2.6rem,7vw,5.5rem)] font-black italic leading-[0.9] text-ink">
            {humanWord}
          </span>
        </h2>

        {/* lado humano */}
        <Side
          side="human"
          label={c.realName}
          caption={media?.human ? `Interpretado por ${media.human.name.replace(/\.$/, '')}.` : 'Por trás da máscara.'}
          cta="Ler a ficha"
          target="#ficha"
          credit={media?.human?.credit}
          hint={media?.human ? 'passe o mouse ou toque pra ver em cores' : undefined}
        >
          {media?.human ? (
            <img
              src={media.human.src}
              alt={`${media.human.name}, intérprete de ${c.codename}`}
              loading="lazy"
              onClick={() => setColored((v) => !v)}
              className={cn(
                'h-full w-full cursor-pointer object-cover object-top transition-[filter] duration-700',
                // P&B que ganha cor no hover (mouse) ou no toque (celular)
                colored ? 'grayscale-0' : 'grayscale contrast-125 group-hover/side:grayscale-0 group-hover/side:contrast-100',
              )}
            />
          ) : (
            <div className="halftone flex h-full items-center justify-center bg-paper-2 p-6 text-center">
              <span className="font-hand text-4xl text-ink">{c.realName}</span>
            </div>
          )}
        </Side>
      </div>
    </section>
  )
}

function Side({
  side,
  label,
  caption,
  cta,
  target,
  credit,
  hint,
  children,
}: {
  side: 'hero' | 'human'
  label: string
  caption: string
  cta: string
  target: string
  credit?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <article data-side={side} className="group/side relative will-change-transform">
      <div className="relative aspect-[3/4] overflow-hidden border-[3px] border-ink bg-ink shadow-[8px_8px_0_var(--ink)]">
        {children}
        <span className="absolute left-3 top-3 max-w-[85%] -rotate-2 border-[3px] border-ink bg-accent-2 px-2 py-0.5 font-display text-lg uppercase leading-tight text-ink sm:text-xl">
          {label}
        </span>
      </div>
      <p className="mt-4 text-[0.95rem] leading-snug">{caption}</p>
      {hint && <p className="mt-1 -rotate-1 font-hand text-xl leading-none text-accent">{hint} ↑</p>}
      {credit && <p className="mt-1 text-[10px] uppercase tracking-wider text-muted">Foto: {credit}</p>}
      <ComicButton size="sm" variant={side === 'hero' ? 'primary' : 'paper'} className="mt-4" onClick={() => scrollToTarget(target)}>
        {cta} →
      </ComicButton>
    </article>
  )
}
