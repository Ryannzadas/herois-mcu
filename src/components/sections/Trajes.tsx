import { motion } from 'motion/react'
import { useMemo, useRef, useState } from 'react'
import type { Character } from '@/data/characters'
import { getMedia, type HeroMedia } from '@/data/media'
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap'
import { seeded } from '@/lib/utils'

const STRIPS = 8

/**
 * Seção 5 — transição em tiras de papel picotado + abertura da seção Trajes.
 * Uma cena em tela cheia é cortada em tiras horizontais que saem para os
 * lados alternadamente (uma pra esquerda, outra pra direita), revelando a
 * seção escura de Trajes por baixo. Presa ao scroll (pin + scrub).
 */
export function Trajes({ character: c, reduced }: { character: Character; reduced: boolean }) {
  const pinRef = useRef<HTMLDivElement>(null)
  const media = getMedia(c.id)
  const scene = media?.scenes[0]
  const suitCount = (media?.suits.length ?? 0) + 1

  useGSAP(
    () => {
      if (reduced) return
      const strips = gsap.utils.toArray<HTMLElement>('[data-strip]', pinRef.current)
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: pinRef.current,
          start: 'top top',
          end: '+=120%',
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
        },
      })
      tl.to({}, { duration: 0.15 }) // um respiro com a cena inteira
      strips.forEach((strip, i) => {
        const dir = i % 2 === 0 ? -1 : 1
        tl.to(
          strip,
          { xPercent: dir * 115, rotate: dir * (2 + (i % 3)), duration: 0.6, ease: 'power2.in' },
          0.15 + i * 0.07,
        )
      })
      tl.from('[data-intro] > *', { opacity: 0, y: 40, stagger: 0.08, duration: 0.4 }, 0.5)
    },
    { scope: pinRef, dependencies: [c.id, reduced], revertOnUpdate: true },
  )

  return (
    <section id="trajes" aria-label="Trajes" className="relative bg-ink text-paper">
      <div ref={pinRef} className="relative h-[100svh] overflow-hidden">
        {/* por baixo: abertura escura da seção Trajes */}
        <div data-intro className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <p className="-rotate-2 font-hand text-3xl text-accent-2">página de figurinhas</p>
          <h2 className="font-display text-[clamp(5rem,20vw,16rem)] uppercase leading-[0.85]">Trajes</h2>
          <p className="mt-2 font-serif text-[clamp(1.6rem,4vw,3rem)] font-black italic text-accent-2">álbum de {c.codename}</p>
          <p className="mt-6 max-w-md text-base text-paper/75">
            {suitCount} {suitCount === 1 ? 'figurinha' : 'figurinhas'} para colar. Passe o mouse ou toque em cada uma para
            ver o filme e o ano.
          </p>
        </div>

        {/* por cima: a cena cortada em tiras */}
        {!reduced && <Strips character={c} scene={scene?.src} />}
      </div>
      <SuitAlbum character={c} reduced={reduced} />
    </section>
  )
}

function Strips({ character: c, scene }: { character: Character; scene?: string }) {
  const clips = useMemo(() => Array.from({ length: STRIPS }, (_, i) => perforated(c.file * 31 + i)), [c.file])
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-10">
      {clips.map((clip, i) => (
        <div
          key={i}
          data-strip
          className="absolute inset-x-0 overflow-hidden will-change-transform"
          style={{
            top: `calc(${(i * 100) / STRIPS}% - 4px)`,
            height: `calc(${100 / STRIPS}% + 8px)`,
            clipPath: clip,
          }}
        >
          {/* a mesma "página" inteira, deslocada para mostrar só a fatia desta tira */}
          <div className="absolute inset-x-0 h-[100svh]" style={{ top: `calc(-${(i * 100) / STRIPS}svh + 4px)` }}>
            <Page character={c} scene={scene} />
          </div>
        </div>
      ))}
    </div>
  )
}

/** A cena em tela cheia que vai ser picotada. */
function Page({ character: c, scene }: { character: Character; scene?: string }) {
  return (
    <div className="relative h-full w-full bg-accent">
      {scene ? (
        <img src={scene} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="halftone-paper absolute inset-0 flex items-end justify-center opacity-90">
          <img src={`/characters/${c.id}/traje.png`} alt="" className="h-[90%] w-auto object-contain" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
      <p
        className="ink-stroke absolute inset-x-0 bottom-[10%] text-center font-display text-[clamp(3.5rem,12vw,10rem)] uppercase leading-none text-paper"
        style={{ WebkitTextStrokeWidth: 3 }}
      >
        Vire a página
      </p>
    </div>
  )
}

/** Bordas superior e inferior picotadas, como papel rasgado à mão. */
function perforated(seed: number) {
  const rand = seeded(seed)
  const top: string[] = []
  const bottom: string[] = []
  for (let x = 0; x <= 100; x += 1.5 + rand() * 2.5) {
    top.push(`${x.toFixed(1)}% ${(rand() * 6).toFixed(1)}px`)
    bottom.push(`${x.toFixed(1)}% calc(100% - ${(rand() * 6).toFixed(1)}px)`)
  }
  top.push('100% 0px')
  bottom.push('100% 100%')
  return `polygon(${top.join(', ')}, ${bottom.reverse().join(', ')})`
}

/* ------------------------------------------------------------------ */
/* Seção 6 — álbum de figurinhas dos trajes                            */
/* ------------------------------------------------------------------ */

type Suit = HeroMedia['suits'][number] & { scene?: string }

/**
 * Cards de trajes como figurinhas de álbum: entram em cascata de baixo pra
 * cima com leve rotação; no hover (ou toque) o card levanta e mostra a cena
 * do filme daquele traje, com nome e ano.
 */
function SuitAlbum({ character: c, reduced }: { character: Character; reduced: boolean }) {
  const scope = useRef<HTMLDivElement>(null)
  const suits = useMemo<Suit[]>(() => {
    const media = getMedia(c.id)
    const scenes = media?.scenes ?? []
    const sceneFor = (film: string) => scenes.find((s) => s.film === film)?.src
    const list: Suit[] = (media?.suits ?? []).map((s) => ({ ...s, scene: sceneFor(s.film) }))
    // a imagem principal da capa fecha o álbum como "figurinha brilhante"
    const last = scenes.at(-1)
    list.push({
      src: `/characters/${c.id}/traje.png`,
      name: 'Traje da capa',
      year: last?.year ?? c.firstAppearance.year,
      film: last?.film ?? c.firstAppearance.title,
      scene: last?.src,
    })
    return list
  }, [c])

  useGSAP(
    () => {
      const cards = gsap.utils.toArray<HTMLElement>('[data-card]', scope.current)
      if (reduced) {
        gsap.from(cards, { opacity: 0, duration: 0.5, stagger: 0.05, scrollTrigger: { trigger: scope.current, start: 'top 80%' } })
        return
      }
      gsap.set(cards, { opacity: 0, y: 140, rotate: () => gsap.utils.random(-14, 14) })
      ScrollTrigger.batch(cards, {
        start: 'top 92%',
        onEnter: (batch) =>
          gsap.to(batch, { opacity: 1, y: 0, rotate: (i) => (i % 2 ? 2 : -2), duration: 0.7, ease: 'back.out(1.4)', stagger: 0.08, overwrite: true }),
      })
    },
    { scope, dependencies: [c.id, reduced], revertOnUpdate: true },
  )

  return (
    <div ref={scope} className="relative mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-8">
      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {suits.map((s, i) => (
          <SuitCard key={s.src} suit={s} index={i} shiny={i === suits.length - 1} reduced={reduced} />
        ))}
      </ul>
      <p className="mt-10 text-right text-[10px] uppercase tracking-widest text-paper/40">Trajes e cenas © Marvel Studios · uso de fã</p>
    </div>
  )
}

function SuitCard({ suit, index, shiny, reduced }: { suit: Suit; index: number; shiny: boolean; reduced: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <li data-card className="will-change-transform">
      <motion.button
        type="button"
        aria-pressed={open}
        aria-label={`${suit.name}: ${suit.film}, ${suit.year}`}
        onClick={() => setOpen((v) => !v)}
        onHoverStart={() => setOpen(true)}
        onHoverEnd={() => setOpen(false)}
        animate={reduced ? undefined : { y: open ? -14 : 0, scale: open ? 1.04 : 1 }}
        transition={{ type: 'spring', stiffness: 360, damping: 22 }}
        className="group relative block aspect-[3/4] w-full overflow-hidden rounded-[10px] border-[5px] border-[#fbf6ea] bg-accent text-left shadow-[0_10px_0_rgb(0_0_0/0.45)] outline-offset-4"
      >
        {/* fundo da figurinha: retícula da edição */}
        <span aria-hidden className="halftone-paper absolute inset-0 opacity-30" />
        <img
          src={suit.src}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-x-0 bottom-0 mx-auto h-[86%] w-auto max-w-none object-contain drop-shadow-[4px_4px_0_var(--ink)]"
        />
        {/* cena do filme, revelada no hover/toque */}
        <span
          aria-hidden
          className={`absolute inset-0 transition-opacity duration-300 ${suit.scene ? 'bg-ink' : 'bg-glow/75'}`}
          style={{ opacity: open ? 1 : 0 }}
        >
          {suit.scene && <img src={suit.scene} alt="" loading="lazy" className="h-full w-full object-cover opacity-80" />}
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink to-transparent p-3 pt-10">
            <span className="block font-serif text-lg font-black italic leading-tight text-paper">{suit.film}</span>
            <span className="font-display text-2xl text-accent-2">{suit.year}</span>
          </span>
        </span>
        {/* número e nome, como numa figurinha */}
        <span className="absolute left-2 top-2 rounded-full border-2 border-ink bg-accent-2 px-2 font-display text-sm text-ink">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span
          className="absolute inset-x-0 bottom-0 bg-ink px-2 py-1 font-display text-base uppercase text-paper transition-opacity"
          style={{ opacity: open ? 0 : 1 }}
        >
          {suit.name}
        </span>
        {/* brilho de figurinha especial */}
        {shiny && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 mix-blend-overlay"
            style={{ background: 'linear-gradient(120deg, transparent 30%, rgb(255 255 255 / 0.55) 45%, transparent 60%)' }}
          />
        )}
      </motion.button>
    </li>
  )
}
