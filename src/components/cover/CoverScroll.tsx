import { useRef } from 'react'
import { VelocityMarquee } from '@/components/comic/VelocityMarquee'
import type { Character } from '@/data/characters'
import { gsap, useGSAP } from '@/lib/gsap'
import { scrollToTarget } from '@/lib/smooth-scroll'
import { Cover } from './Cover'

interface Props {
  character: Character
  drawing: boolean
  reduced: boolean
  onDrawEnd: () => void
}

/**
 * Seção 1 — "a capa que vira cartão".
 * A capa abre ocupando a tela inteira; ao rolar (pin + scrub), ela encolhe até
 * virar um cartão de revista inclinado no centro, com borda de papel e sombra,
 * enquanto duas faixas gigantes surgem atrás, correndo conforme o scroll.
 */
export function CoverScroll({ character: c, drawing, reduced, onDrawEnd }: Props) {
  const scope = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (reduced) return
      const mm = gsap.matchMedia()
      mm.add({ mobile: '(max-width: 767px)', desktop: '(min-width: 768px)' }, (ctx) => {
        const { mobile } = ctx.conditions as { mobile: boolean }
        const card = cardRef.current!
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: scope.current,
            start: 'top top',
            end: mobile ? '+=90%' : '+=130%',
            pin: true,
            scrub: true,
            anticipatePin: 1,
            // encolhida, a capa vira cartão: clique volta ao topo e a lupa fica inativa
            onUpdate: (self) => {
              card.dataset.shrunk = String(self.progress > 0.04)
            },
          },
        })
        tl.to(card, { scale: mobile ? 0.6 : 0.52, rotate: -4, y: mobile ? 10 : 0 }, 0)
          .to('[data-frame]', { opacity: 1 }, 0)
          .to('[data-hint]', { opacity: 0, y: 20, duration: 0.15 }, 0)
          .fromTo(
            '[data-strip]',
            { opacity: 0, scale: 1.15 },
            { opacity: 1, scale: 1, stagger: 0.12, duration: 0.6 },
            0.15,
          )
          // respiro no fim: o cartão "assenta" antes de soltar o pin
          .to({}, { duration: 0.25 })
      })
      return () => mm.revert()
    },
    { scope, dependencies: [reduced] },
  )

  return (
    <div id="capa" ref={scope} className="bg-texture relative h-[100svh] overflow-hidden">
      {/* faixas gigantes atrás do cartão */}
      {!reduced && (
        <div aria-hidden className="absolute inset-0 flex flex-col justify-center gap-[30vh] md:gap-[34vh]">
          <div data-strip className="-rotate-3 opacity-0">
            <VelocityMarquee
              text={c.quote}
              base={70}
              className="font-serif text-[clamp(4rem,13vw,11rem)] font-black italic leading-none text-accent"
            />
          </div>
          <div data-strip className="rotate-2 opacity-0">
            <VelocityMarquee
              text={c.codename.toUpperCase()}
              reverse
              base={90}
              className="font-display text-[clamp(5rem,17vw,15rem)] uppercase leading-[0.9] text-ink"
            />
          </div>
        </div>
      )}

      <div
        ref={cardRef}
        className="group/card relative h-full origin-center will-change-transform data-[shrunk=true]:cursor-pointer [&[data-shrunk=true]>section]:pointer-events-none"
        onClick={(e) => {
          if (e.currentTarget.dataset.shrunk === 'true') scrollToTarget(0)
        }}
      >
        {/* borda de papel + sombra do cartão (só opacidade anima) */}
        <div
          data-frame
          aria-hidden
          className="pointer-events-none absolute -inset-6 -z-10 border-[3px] border-ink bg-[#fbf6ea] opacity-0 shadow-[18px_22px_0_rgb(20_18_16/0.9),0_40px_80px_rgb(20_18_16/0.35)] sm:-inset-8"
        />
        <Cover character={c} drawing={drawing} reduced={reduced} onDrawEnd={onDrawEnd} />
        {!reduced && (
          <p
            data-hint
            className="pointer-events-none absolute bottom-36 right-4 z-30 hidden rotate-[-6deg] font-hand text-2xl text-ink md:block"
          >
            role para folhear ↓
          </p>
        )}
      </div>
    </div>
  )
}
