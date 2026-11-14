import { useMemo, useRef } from 'react'
import { MiniCover } from '@/components/comic/MiniCover'
import { CHARACTERS, type Character } from '@/data/characters'
import { gsap, useGSAP } from '@/lib/gsap'

const FLIPS = 9

/**
 * "Pegando uma edição aleatória da pilha": capas passam rápido como revistas
 * sendo folheadas e param na sorteada (~1 s). Com movimento reduzido, encerra direto.
 */
export function DrawPile({ target, reduced, onDone }: { target: Character; reduced: boolean; onDone: () => void }) {
  const scope = useRef<HTMLDivElement>(null)

  // capas de cima da pilha (as que voam) + a sorteada embaixo
  const pile = useMemo(() => {
    const others = CHARACTERS.length > 1 ? CHARACTERS.filter((c) => c.id !== target.id) : CHARACTERS
    const flips = Array.from({ length: FLIPS }, (_, i) => others[i % others.length])
    return [...flips, target]
  }, [target])

  useGSAP(
    () => {
      if (reduced) {
        onDone()
        return
      }
      const cards = gsap.utils.toArray<HTMLElement>('[data-card]', scope.current)
      gsap.set(cards, {
        rotate: () => gsap.utils.random(-7, 7),
        x: () => gsap.utils.random(-10, 10),
        y: () => gsap.utils.random(-6, 6),
      })
      const tl = gsap.timeline({ onComplete: onDone })
      tl.from(scope.current!.querySelector('[data-stack]'), { y: 60, opacity: 0, duration: 0.25, ease: 'power2.out' })
      cards.slice(0, -1).forEach((card, i) => {
        const side = i % 2 === 0 ? -1 : 1
        tl.to(
          card,
          {
            xPercent: side * gsap.utils.random(90, 150),
            yPercent: gsap.utils.random(-70, -30),
            rotate: side * gsap.utils.random(25, 50),
            opacity: 0,
            duration: 0.28,
            ease: 'power2.in',
          },
          0.2 + i * 0.09,
        )
      })
      tl.to('[data-num]', {
        duration: 0.2 + FLIPS * 0.09,
        scrambleText: { text: String(target.file).padStart(3, '0'), chars: '0123456789', revealDelay: 0.6, speed: 1 },
        ease: 'none',
      }, 0.15)
      // a sorteada endireita e dá um pulinho antes de virar capa
      tl.to(cards[cards.length - 1], { rotate: 0, x: 0, y: 0, scale: 1.08, duration: 0.25, ease: 'back.out(3)' })
      tl.to(scope.current, { opacity: 0, duration: 0.2 }, '+=0.12')
    },
    { scope, dependencies: [target.id] },
  )

  return (
    <div ref={scope} className="absolute inset-0 z-30 grid place-items-center bg-paper/60" aria-live="polite">
      <div className="flex flex-col items-center gap-5">
        <p className="-rotate-2 font-hand text-2xl text-ink sm:text-3xl">pegando uma edição aleatória da pilha…</p>
        <div data-stack className="relative w-[clamp(9rem,24vw,15rem)]">
          {pile.map((c, i) => (
            <div
              key={i}
              data-card
              className="absolute inset-0 shadow-[6px_6px_0_var(--ink)] first:relative"
              style={{ zIndex: pile.length - i }}
            >
              <MiniCover character={c} />
            </div>
          ))}
        </div>
        <p className="font-display text-4xl text-ink">
          Nº <span data-num>???</span>
        </p>
      </div>
    </div>
  )
}
