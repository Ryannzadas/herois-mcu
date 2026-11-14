import { useRef } from 'react'
import { Tape } from '@/components/comic/pieces'
import { fileNumber, GROUPS, statusLabel, type Character } from '@/data/characters'
import { getMedia } from '@/data/media'
import { countUpIn } from '@/lib/count-up'
import { gsap, useGSAP } from '@/lib/gsap'

/**
 * Ficha técnica como página de dossiê da revista: folha pautada, foto
 * recortada presa com fita, campos datilografados, anotações à mão em
 * caneta vermelha, carimbo e números que contam ao aparecer.
 */
export function Ficha({ character: c, reduced }: { character: Character; reduced: boolean }) {
  const scope = useRef<HTMLElement>(null)
  const media = getMedia(c.id)
  const group = GROUPS.find((g) => g.id === c.group)!

  useGSAP(
    () => {
      countUpIn(scope.current!, reduced)
      const trigger = { trigger: scope.current, start: 'top 65%' }
      if (reduced) {
        gsap.from('[data-field], [data-note], [data-stamp], [data-photo]', { opacity: 0, duration: 0.5, stagger: 0.05, scrollTrigger: trigger })
        return
      }
      const tl = gsap.timeline({ scrollTrigger: trigger })
      tl.from('[data-photo]', { opacity: 0, y: 60, rotate: -12, duration: 0.7, ease: 'back.out(1.5)' })
        .from('[data-field]', { opacity: 0, x: -20, duration: 0.4, stagger: 0.07 }, 0.15)
        .from('[data-note]', { opacity: 0, scale: 0.6, rotate: -10, duration: 0.45, stagger: 0.15, ease: 'back.out(2)' }, 0.6)
        .from('[data-stamp]', { opacity: 0, scale: 2.4, rotate: -30, duration: 0.35, ease: 'power4.in' }, 0.9)
    },
    { scope, dependencies: [c.id, reduced], revertOnUpdate: true },
  )

  const fields: [string, string][] = [
    ['Codinome', c.codename],
    ['Nome real', c.realName],
    ['Status', statusLabel(c)],
    ['Afiliação', c.affiliation],
    ['1ª aparição', `${c.firstAppearance.title} (${c.firstAppearance.year})`],
    ['Grupo', group.label],
  ]
  const numbers: { label: string; value: number; year?: boolean }[] = [
    { label: 'Nível de acesso', value: c.clearance },
    { label: 'No MCU desde', value: c.firstAppearance.year, year: true },
    { label: 'Trajes catalogados', value: (media?.suits.length ?? 0) + 1 },
    { label: 'Cenas no mural', value: media?.scenes.length ?? 1 },
  ]

  return (
    <section id="ficha" ref={scope} aria-label={`Ficha técnica: ${c.codename}`} className="relative bg-paper-2 px-4 py-20 sm:px-8">
      <div
        className="relative mx-auto max-w-5xl -rotate-[0.6deg] border-[3px] border-ink bg-[#fbf6ea] px-5 pb-12 pt-10 shadow-[10px_12px_0_var(--ink)] sm:px-12"
        style={{
          // folha pautada com margem vermelha
          backgroundImage:
            'linear-gradient(90deg, transparent 2.6rem, rgb(200 22 29 / 0.35) 2.6rem, rgb(200 22 29 / 0.35) calc(2.6rem + 2px), transparent calc(2.6rem + 2px)), repeating-linear-gradient(transparent 0 1.9rem, rgb(29 79 163 / 0.14) 1.9rem calc(1.9rem + 1px))',
        }}
      >
        <Tape className="-top-3 left-10 -rotate-6" />
        <Tape className="-top-3 right-10 rotate-6" />

        <header className="flex flex-wrap items-end justify-between gap-4 border-b-[3px] border-ink pb-4">
          <div>
            <p className="font-display text-lg uppercase tracking-wide text-muted">Arquivo {fileNumber(c)}</p>
            <h2 className="font-display text-[clamp(2.6rem,7vw,5rem)] uppercase leading-[0.9]">Ficha técnica</h2>
          </div>
          <span
            data-stamp
            className="rotate-[-12deg] border-[4px] border-[#c8161d] px-3 py-1 font-display text-2xl uppercase tracking-widest text-[#c8161d] opacity-90 sm:text-3xl"
          >
            Confidencial
          </span>
        </header>

        <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,15rem)_1fr]">
          {/* foto recortada */}
          <figure data-photo className="relative mx-auto w-56 rotate-[-4deg] md:mx-0">
            <div className="halftone-accent border-[3px] border-ink bg-accent p-2 shadow-[6px_6px_0_var(--ink)]">
              <img
                src={`/characters/${c.id}/traje.png`}
                alt={`${c.codename}, foto da ficha`}
                loading="lazy"
                className="mx-auto aspect-[3/4] w-full object-contain drop-shadow-[4px_4px_0_var(--ink)]"
              />
            </div>
            <Tape className="-top-3 left-1/2 -translate-x-1/2 rotate-3" />
            <figcaption data-note className="absolute -right-6 -bottom-8 rotate-[-6deg] font-hand text-2xl leading-none text-[#c8161d]">
              ← é ele mesmo!
            </figcaption>
          </figure>

          {/* campos datilografados */}
          <div>
            <dl className="grid gap-y-1">
              {fields.map(([k, v]) => (
                <div data-field key={k} className="grid grid-cols-[8.5rem_1fr] items-baseline gap-3 py-1 sm:grid-cols-[10rem_1fr]">
                  <dt className="font-display text-base uppercase tracking-wide text-muted">{k}</dt>
                  <dd className="relative font-serif text-lg sm:text-xl">
                    {k === 'Status' ? (
                      <span className="relative inline-block px-2">
                        {v}
                        {/* círculo de caneta vermelha em volta do status */}
                        <svg data-note aria-hidden viewBox="0 0 120 50" preserveAspectRatio="none" className="absolute -inset-x-2 -inset-y-2 h-[calc(100%+1rem)] w-[calc(100%+1rem)]">
                          <path d="M8 26 C 10 6, 108 4, 112 24 S 30 50, 12 30 S 40 8, 70 7" fill="none" stroke="#c8161d" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                      </span>
                    ) : (
                      v
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            <p data-note className="mt-6 max-w-xl rotate-[-1deg] font-hand text-2xl leading-snug text-[#1d4fa3]">
              obs.: {c.summary}
            </p>
          </div>
        </div>

        {/* números */}
        <dl className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {numbers.map((n) => (
            <div data-field key={n.label} className="border-[3px] border-ink bg-paper p-3 shadow-[4px_4px_0_var(--ink)]">
              <dt className="text-xs uppercase tracking-wider text-muted">{n.label}</dt>
              <dd className="font-display text-4xl leading-tight text-accent">
                <span data-count={n.value} data-grouping={n.year ? 'false' : undefined}>
                  {n.value}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
