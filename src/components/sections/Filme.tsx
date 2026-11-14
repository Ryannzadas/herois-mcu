import { useRef } from 'react'
import { Tape } from '@/components/comic/pieces'
import type { Character } from '@/data/characters'
import { getMedia } from '@/data/media'
import { countUpIn, formatNumber } from '@/lib/count-up'
import { gsap, useGSAP } from '@/lib/gsap'

const fmt = formatNumber

/**
 * Seção 6 (parte 2) — o filme principal do herói.
 * Colagem de cenas com um selo redondo de figurinha (bilheteria) girando
 * devagar por cima, e números que contam do zero ao entrar na tela.
 */
export function Filme({ character: c, reduced }: { character: Character; reduced: boolean }) {
  const scope = useRef<HTMLElement>(null)
  const film: NonNullable<Character['film']> = c.film ?? {
    title: c.firstAppearance.title,
    year: c.firstAppearance.year,
    synopsis: c.summary,
    director: '',
  }
  const isSeries = film.episodes != null
  const scenes = getMedia(c.id)?.scenes ?? []
  const fromFilm = scenes.filter((s) => s.film === film.title)
  const photos = [...fromFilm, ...scenes.filter((s) => s.film !== film.title)].slice(0, 3)

  useGSAP(
    () => {
      countUpIn(scope.current!, reduced)
      if (reduced) return
      if (scope.current!.querySelector('[data-spin]')) gsap.to('[data-spin]', { rotate: 360, duration: 18, ease: 'none', repeat: -1 })
      gsap.from('[data-photo]', {
        opacity: 0,
        y: 60,
        rotate: (i) => (i % 2 ? 8 : -8),
        stagger: 0.12,
        duration: 0.8,
        ease: 'back.out(1.3)',
        scrollTrigger: { trigger: scope.current, start: 'top 70%' },
      })
    },
    { scope, dependencies: [c.id, reduced], revertOnUpdate: true },
  )

  type Stat = { label: string; value: number; decimals?: number; prefix?: string; suffix?: string; year?: boolean }
  const stats: Stat[] = []
  if (film.boxOffice != null) stats.push({ label: 'Bilheteria mundial', value: film.boxOffice, decimals: 1, prefix: 'US$ ', suffix: ' mi' })
  if (film.openingUS != null) stats.push({ label: 'Abertura nos EUA', value: film.openingUS, decimals: 1, prefix: 'US$ ', suffix: ' mi' })
  if (film.episodes != null) stats.push({ label: 'Episódios', value: film.episodes })
  if (film.runtime != null) stats.push({ label: 'Duração', value: film.runtime, suffix: ' min' })
  stats.push({ label: 'Ano', value: film.year, year: true })

  return (
    <section id="filme" ref={scope} aria-label={`${isSeries ? 'A série' : 'O filme'}: ${film.title}`} className="relative overflow-hidden bg-paper bg-texture px-4 py-20 sm:px-8">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="-rotate-2 font-hand text-3xl text-accent">a edição recomenda</p>
          <h2 className="mt-2 font-display text-[clamp(3rem,8vw,6.5rem)] uppercase leading-[0.9]">{film.title}</h2>
          <p className="font-serif text-4xl font-black italic text-accent">{isSeries ? 'a série' : 'o filme'}</p>
          <p className="mt-6 max-w-lg text-lg leading-relaxed">{film.synopsis}</p>

          <dl className="mt-8 grid max-w-lg grid-cols-2 gap-x-6 gap-y-5">
            {stats.map((s) => (
              <div key={s.label} className="border-t-[3px] border-ink pt-2">
                <dt className="text-sm uppercase tracking-wider text-muted">{s.label}</dt>
                <dd className="font-display text-3xl leading-tight sm:text-4xl">
                  {s.prefix}
                  <span data-count={s.value} data-decimals={s.decimals ?? 0} data-grouping={s.year ? 'false' : undefined}>
                    {fmt(s.value, s.decimals ?? 0, !s.year)}
                  </span>
                  {s.suffix}
                </dd>
              </div>
            ))}
            {film.director && (
              <div className="col-span-2 border-t-[3px] border-ink pt-2">
                <dt className="text-sm uppercase tracking-wider text-muted">Direção</dt>
                <dd className="font-serif text-2xl italic">{film.director}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* colagem de fotos com o selo colado por cima */}
        <div className="relative mx-auto aspect-square w-full max-w-xl">
          {photos.length ? (
            photos.map((p, i) => (
              <figure
                key={p.src}
                data-photo
                className="absolute w-[62%] bg-[#fbf6ea] p-2 shadow-[8px_8px_0_var(--ink)]"
                style={{
                  left: ['0%', '38%', '14%'][i],
                  top: ['4%', '20%', '56%'][i],
                  rotate: `${[-5, 4, -2][i]}deg`,
                  zIndex: i + 1,
                }}
              >
                <Tape className="-top-3 left-6 -rotate-6" />
                <img src={p.src} alt={`${p.film}: ${p.place}`} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                <figcaption className="mt-1 font-hand text-xl">
                  {p.place}, {p.year}
                </figcaption>
              </figure>
            ))
          ) : (
            <div data-photo className="halftone-accent absolute inset-[10%] flex items-end justify-center border-[3px] border-ink bg-accent">
              <img src={`/characters/${c.id}/traje.png`} alt={c.codename} loading="lazy" className="h-[90%] w-auto object-contain" />
            </div>
          )}

          {film.boxOffice != null && <Seal boxOffice={film.boxOffice} />}
        </div>
      </div>
    </section>
  )
}

/** Selo redondo de figurinha: anel de texto girando + valor no centro. */
function Seal({ boxOffice }: { boxOffice: number }) {
  const billions = boxOffice >= 1000
  const value = billions ? fmt(boxOffice / 1000, 1) : fmt(Math.round(boxOffice), 0)
  return (
    <div className="absolute -left-2 bottom-[2%] z-10 size-36 sm:size-44" aria-label={`Bilheteria de US$ ${value} ${billions ? 'bilhões' : 'milhões'}`}>
      <div className="absolute inset-0 rounded-full border-[3px] border-ink bg-accent shadow-[5px_5px_0_var(--ink)]" />
      <svg data-spin viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <path id="seal-ring" d="M50 50 m-38 0 a38 38 0 1 1 76 0 a38 38 0 1 1 -76 0" />
        </defs>
        <text fill="var(--paper)" fontSize="9" fontFamily="Bangers, Impact, sans-serif" letterSpacing="2.2">
          <textPath href="#seal-ring">BILHETERIA ★ FIGURINHA RARA ★ BILHETERIA ★ FIGURINHA RARA ★</textPath>
        </text>
      </svg>
      <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-paper text-center leading-none text-ink">
        <span className="font-sfx text-xs">US$</span>
        <span className="font-display text-3xl sm:text-4xl">{value}</span>
        <span className="font-sfx text-xs">{billions ? 'bilhões' : 'milhões'}</span>
      </div>
    </div>
  )
}
