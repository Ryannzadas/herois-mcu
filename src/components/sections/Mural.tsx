import { Fragment, useMemo, useRef } from 'react'
import { Tape } from '@/components/comic/pieces'
import { quotesOf, type Character, type Quote } from '@/data/characters'
import { getMedia } from '@/data/media'
import { useMediaQuery } from '@/hooks/use-media-query'
import { gsap, useGSAP } from '@/lib/gsap'
import { cn, seeded } from '@/lib/utils'

type Scene = { src: string; place: string; year: number; film: string }
type Item = { kind: 'photo'; scene: Scene } | { kind: 'quote'; quote: Quote }

/**
 * Seção 3 — mural horizontal de aparições.
 * Desktop: seção presa (pin) e o mural anda na horizontal enquanto o usuário
 * rola na vertical; cada foto tem velocidade própria (parallax), o fundo passa
 * por 3 tons da paleta até o papel creme e uma linha pontilhada à mão marca o
 * progresso. Celular ou movimento reduzido: carrossel nativo de arrastar.
 */
export function Mural({ character: c, reduced }: { character: Character; reduced: boolean }) {
  const scope = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const desktop = useMediaQuery('(min-width: 768px)')
  const pinned = desktop && !reduced

  const items = useMemo(() => buildItems(c), [c])

  useGSAP(
    () => {
      if (!pinned) return
      const track = trackRef.current!
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth)

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: scope.current,
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })
      tl.to(track, { x: () => -distance(), duration: 1 }, 0)

      // parallax: cada foto anda um pouco mais rápido ou mais devagar que o mural
      gsap.utils.toArray<HTMLElement>('[data-speed]', track).forEach((el) => {
        const speed = Number(el.dataset.speed)
        tl.fromTo(el, { x: 0 }, { x: () => (1 - speed) * distance() * 0.25, duration: 1 }, 0)
      })

      // fundo: tom escuro → cor da edição → destaque → papel (crossfade só de opacidade)
      const layers = gsap.utils.toArray<HTMLElement>('[data-bg]', scope.current)
      layers.slice(1).forEach((layer, i) => {
        tl.fromTo(layer, { opacity: 0 }, { opacity: 1, duration: 0.28 }, 0.1 + i * 0.3)
      })

      // linha pontilhada "desenhada" deslizando para dentro do rodapé
      tl.fromTo('[data-trail]', { xPercent: -100 }, { xPercent: 0, duration: 1 }, 0)
    },
    { scope, dependencies: [c.id, pinned], revertOnUpdate: true },
  )

  return (
    <section
      id="mural"
      ref={scope}
      aria-label={`Por onde andou: ${c.codename}`}
      className={cn('relative overflow-hidden', pinned ? 'h-[100svh]' : 'py-16')}
    >
      {/* camadas de fundo (só a opacidade anima) */}
      <div data-bg aria-hidden className="absolute inset-0 bg-glow" />
      {pinned && (
        <>
          <div data-bg aria-hidden className="absolute inset-0 bg-accent opacity-0" />
          <div data-bg aria-hidden className="absolute inset-0 bg-accent-2 opacity-0" />
          <div data-bg aria-hidden className="absolute inset-0 bg-paper opacity-0" />
        </>
      )}

      <div
        ref={trackRef}
        className={cn(
          'relative flex items-start gap-[4vw] px-[6vw]',
          pinned
            ? 'h-full w-max pt-[12vh] will-change-transform'
            : 'scrollbar-none snap-x snap-mandatory scroll-px-[6vw] overflow-x-auto pb-10 pt-4',
        )}
      >
        <TitleCard character={c} />
        {items.map((item, i) =>
          item.kind === 'photo' ? (
            <Photo key={i} scene={item.scene} index={i} pinned={pinned} />
          ) : (
            <QuoteCard key={i} quote={item.quote} author={c.codename} index={i} />
          ),
        )}
        <EndCard pinned={pinned} />
      </div>

      {/* linha pontilhada à mão acompanhando o progresso */}
      {pinned && (
        <div aria-hidden className="absolute inset-x-0 bottom-[6vh] h-10 overflow-hidden">
          <div data-trail className="relative h-full w-full will-change-transform">
            <svg viewBox="0 0 1000 40" preserveAspectRatio="none" className="h-full w-full">
              <path
                d="M0 22 C 80 8, 160 34, 250 20 S 420 6, 500 22 S 680 36, 760 18 S 900 10, 990 22"
                fill="none"
                stroke="var(--ink)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="1 12"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <span className="absolute right-0 top-1/2 -translate-y-1/2 font-sfx text-2xl text-ink">✎</span>
          </div>
        </div>
      )}

      <p className={cn('absolute bottom-2 right-4 text-[10px] uppercase tracking-widest', pinned ? 'text-ink/50' : 'text-paper/50')}>
        Cenas © Marvel Studios · uso de fã
      </p>
    </section>
  )
}

function buildItems(c: Character): Item[] {
  const scenes = getMedia(c.id)?.scenes ?? []
  // sem cenas baixadas: uma foto com a imagem principal, para o mural não ficar vazio
  const photos: Scene[] = scenes.length
    ? scenes
    : [{ src: `/characters/${c.id}/traje.png`, place: 'Primeira aparição', year: c.firstAppearance.year, film: c.firstAppearance.title }]
  const quotes = quotesOf(c)
  const items: Item[] = []
  photos.forEach((scene, i) => {
    items.push({ kind: 'photo', scene })
    // uma citação a cada duas fotos
    if (i % 2 === 1 && quotes[Math.floor(i / 2)]) items.push({ kind: 'quote', quote: quotes[Math.floor(i / 2)] })
  })
  if (!scenes.length) quotes.forEach((quote) => items.push({ kind: 'quote', quote }))
  return items
}

/** Foto colada no mural: moldura de papel, fita, rotação e legenda "Cidade, ano". */
function Photo({ scene, index, pinned }: { scene: Scene; index: number; pinned: boolean }) {
  const rand = seeded(index * 97 + 13)
  const rotate = (rand() - 0.5) * 8
  const top = pinned ? `${Math.round(rand() * 28)}vh` : undefined
  // em telas baixas a foto encolhe pela altura, para a legenda não sair da tela
  const width = pinned ? `min(${Math.round(24 + rand() * 12)}vw, 58vh)` : undefined
  const speed = (0.8 + rand() * 0.45).toFixed(2)
  return (
    <figure
      data-speed={pinned ? speed : undefined}
      className="relative shrink-0 snap-center will-change-transform"
      style={{ marginTop: top, width, rotate: `${rotate}deg` }}
    >
      <div className={cn('bg-[#fbf6ea] p-2.5 pb-3 shadow-[8px_10px_0_rgb(20_18_16/0.85)]', !pinned && 'w-[78vw] max-w-sm')}>
        <Tape className="-top-3 left-1/2 -translate-x-1/2 rotate-[-4deg]" />
        <img
          src={scene.src}
          alt={`${scene.film}: cena em ${scene.place}`}
          loading="lazy"
          decoding="async"
          className="aspect-[4/3] w-full object-cover"
        />
        <figcaption className="mt-2 flex items-baseline justify-between gap-3 px-1">
          <span className="font-hand text-2xl leading-none text-ink">
            {scene.place}, {scene.year}
          </span>
          <span className="truncate text-[11px] italic text-muted">{scene.film}</span>
        </figcaption>
      </div>
    </figure>
  )
}

/**
 * Fala do herói letreirada como em gibi: balão com rabicho, caixa alta,
 * palavra-chave em destaque e uma caixa de legenda amarela com a origem.
 * Grito vira balão estourado; sussurro, balão tracejado.
 */
function QuoteCard({ quote, author, index }: { quote: Quote; author: string; index: number }) {
  const tone = quote.tone ?? (quote.text.trim().endsWith('!') ? 'grito' : 'fala')
  const flip = index % 2 === 1
  const rotate = flip ? -2.5 : 2.5
  // *asteriscos* viram destaque
  const parts = quote.text.split('*')
  const plain = parts.join('')

  const burst = useMemo(() => {
    const rand = seeded(index * 31 + 7)
    const n = 15
    return Array.from({ length: n * 2 }, (_, i) => {
      const a = (i / (n * 2)) * Math.PI * 2
      const r = i % 2 === 0 ? 47 + rand() * 3 : 37 + rand() * 3
      return `${50 + Math.cos(a) * r},${50 + Math.sin(a) * r}`
    }).join(' ')
  }, [index])

  return (
    <figure
      className="relative mt-[9vh] w-[78vw] max-w-sm shrink-0 snap-center md:w-[26vw]"
      style={{ rotate: `${rotate}deg` }}
    >
      <blockquote className="relative [filter:drop-shadow(5px_6px_0_var(--ink))]">
        {tone === 'grito' ? (
          <svg
            aria-hidden
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute -left-[9%] -top-[30%] h-[160%] w-[118%] overflow-visible"
          >
            <polygon points={burst} fill="#fffdf6" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="miter" vectorEffect="non-scaling-stroke" />
          </svg>
        ) : (
          <div
            aria-hidden
            className={cn(
              'absolute inset-0 rounded-[50%] border-[3px] border-ink bg-[#fffdf6]',
              tone === 'sussurro' && 'border-dashed',
            )}
          />
        )}
        {/* rabicho apontando para quem fala */}
        <svg
          aria-hidden
          viewBox="0 0 60 64"
          className={cn(
            'absolute h-16 w-[3.75rem] overflow-visible',
            flip ? 'right-[20%] -scale-x-100' : 'left-[20%]',
            tone === 'grito' ? 'top-[104%]' : 'top-[calc(91%-3px)]',
          )}
        >
          <path
            d="M10 0 C 16 24, 10 44, 0 62 C 24 50, 42 28, 44 0"
            fill="#fffdf6"
            stroke="var(--ink)"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeDasharray={tone === 'sussurro' ? '7 6' : undefined}
          />
        </svg>
        <p
          aria-label={plain}
          className={cn(
            'relative px-[13%] py-[13%] text-center font-balloon font-bold uppercase leading-[1.15] text-ink',
            tone === 'grito' && 'text-2xl tracking-wide md:text-[1.75rem]',
            tone === 'fala' && 'text-xl md:text-2xl',
            tone === 'sussurro' && 'text-lg text-ink/70 md:text-xl',
          )}
        >
          {parts.map((part, i) =>
            i % 2 === 1 ? (
              <strong key={i} className="text-[1.12em] italic [-webkit-text-stroke:0.6px_currentColor]">
                {part}
              </strong>
            ) : (
              <Fragment key={i}>{part}</Fragment>
            ),
          )}
        </p>
      </blockquote>
      {/* caixa de legenda: quem fala e onde */}
      <figcaption
        className={cn(
          'relative mt-9 w-fit max-w-[70%] border-[3px] border-ink bg-[#ffd84a] px-3 py-1.5 font-balloon text-xs font-bold uppercase leading-tight tracking-wide text-ink shadow-[3px_3px_0_var(--ink)]',
          flip ? 'mr-auto -rotate-1' : 'ml-auto rotate-1',
        )}
      >
        <span className="block text-sm">{author}</span>
        {quote.from && quote.from !== author && <span className="block italic opacity-80">em {quote.from}</span>}
      </figcaption>
    </figure>
  )
}

function TitleCard({ character: c }: { character: Character }) {
  return (
    <div className="relative mt-[6vh] w-[78vw] max-w-sm shrink-0 snap-start text-paper md:w-[26vw]">
      <h2 className="ink-stroke font-display text-6xl uppercase leading-[0.9] md:text-[6vw]" style={{ WebkitTextStrokeWidth: 2 }}>
        Por onde andou
      </h2>
      <p className="mt-3 -rotate-2 font-hand text-3xl text-accent-2">o mural de {c.codename} →</p>
    </div>
  )
}

function EndCard({ pinned }: { pinned: boolean }) {
  return (
    <div className={cn('relative shrink-0 snap-end self-center pr-[6vw]', pinned ? 'mt-[20vh]' : '')}>
      <p className={cn('-rotate-3 font-hand text-4xl', pinned ? 'text-ink' : 'text-paper')}>continua na próxima página…</p>
    </div>
  )
}
