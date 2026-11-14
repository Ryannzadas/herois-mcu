import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Marquee, Starburst, Tape } from '@/components/comic/pieces'
import { ComicStage } from '@/components/stage/ComicStage'
import { fileNumber, ISSUE_PRICE, statusLabel, type Character } from '@/data/characters'
import { DrawPile } from './DrawPile'
import { FitTitle } from './FitTitle'

interface Props {
  character: Character
  drawing: boolean
  reduced: boolean
  onDrawEnd: () => void
}

const ISSUE_DATE = new Date().toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '').toUpperCase()

/** Capa da edição: título enorme, herói recortado por cima, selos, fita e faixas. */
export function Cover({ character: c, drawing, reduced, onDrawEnd }: Props) {
  const titleMax = useTitleMax()

  // troca de capa: a anterior sai como página virando
  const turn = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, rotate: -4, y: 24 },
        animate: { opacity: 1, rotate: 0, y: 0 },
        exit: { opacity: 0, rotateY: 75, x: -60, transition: { duration: 0.28, ease: 'easeIn' as const } },
      }

  return (
    <section aria-label={`Capa da edição ${fileNumber(c)}`} className="relative flex h-[100svh] flex-col overflow-hidden bg-paper bg-texture">
      <Masthead character={c} hidden={drawing} />

      <div className="relative min-h-0 flex-1 px-4 sm:px-8">
        {/* círculo de retícula atrás do herói */}
        <div
          aria-hidden
          className="halftone-accent absolute left-1/2 top-[14%] aspect-square w-[min(80vw,40rem)] -translate-x-1/2 rounded-full opacity-50"
        />

        {/* título enorme, atrás da figura */}
        <div className="pointer-events-none absolute inset-x-4 top-3 z-0 sm:inset-x-8">
          <AnimatePresence mode="wait" initial={false}>
            {!drawing && (
              <motion.div key={c.id} {...turn} style={{ transformOrigin: 'left center' }}>
                <FitTitle text={c.codename} reduced={reduced} maxHeight={titleMax} className="text-accent" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* herói recortado por cima do título; o palco ocupa a capa toda para os efeitos cruzarem a página */}
        <div className="absolute inset-0 z-10">
          <ComicStage character={c} locked={drawing} reduced={reduced} />
        </div>

        {/* selos e etiquetas */}
        <AnimatePresence mode="wait" initial={false}>
          {!drawing && (
            <motion.div key={c.id} className="pointer-events-none absolute inset-0 z-20" {...turn}>
              <Starburst
                seed={c.file}
                className="pointer-events-auto absolute right-2 top-[30%] size-28 rotate-12 sm:right-[6%] sm:top-[26%] sm:size-36 lg:size-40"
              >
                <span className="block font-display text-sm uppercase leading-none sm:text-base">1ª aparição</span>
                <span className="block font-display text-3xl leading-none sm:text-4xl">{c.firstAppearance.year}</span>
              </Starburst>

              <div className="pointer-events-auto absolute bottom-[3%] left-3 hidden max-w-[15rem] -rotate-2 border-[3px] border-ink bg-paper p-3.5 shadow-[6px_6px_0_var(--ink)] sm:left-[4%] md:block">
                <Tape className="-top-3 left-1/2 -translate-x-1/2 -rotate-3" />
                <p className="font-sfx text-lg uppercase tracking-wide text-accent">Nesta edição</p>
                <p className="mt-1 text-sm leading-snug">{c.summary}</p>
                <p className="mt-3 -rotate-1 font-hand text-2xl leading-none text-glow">{c.realName}</p>
              </div>

              <div className="absolute bottom-[26%] left-2 rotate-[-8deg] sm:left-auto sm:bottom-[30%] border-[3px] border-ink bg-accent-2 px-3 py-1 font-display text-lg uppercase shadow-[4px_4px_0_var(--ink)] sm:right-[8%] sm:text-xl">
                Status: {statusLabel(c)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {drawing && <DrawPile target={c} reduced={reduced} onDone={onDrawEnd} />}
      </div>

      {/* faixas com a frase do herói, em direções opostas */}
      <div className="relative z-20 -mx-4 mt-2 -rotate-1 space-y-0 pb-3">
        <Marquee
          text={drawing ? 'PEGANDO UMA EDIÇÃO DA PILHA…' : c.quote.toUpperCase()}
          className="border-y-[3px] border-ink bg-accent py-1.5 font-display text-2xl text-paper sm:text-3xl"
        />
        <Marquee
          reverse
          speed={34}
          text={drawing ? 'EDIÇÃO SURPRESA · EDIÇÃO SURPRESA' : `${fileNumber(c)} · ${c.codename.toUpperCase()} · ${c.affiliation.toUpperCase()}`}
          className="rotate-2 border-y-[3px] border-ink bg-ink py-1 font-display text-lg text-accent-2 sm:text-xl"
        />
      </div>

    </section>
  )
}

/** Resumo da edição no mobile (no desktop fica no cartão com fita, dentro da capa). */
export function CoverBlurbMobile({ character: c, hidden }: { character: Character; hidden: boolean }) {
  return (
    <div className={`relative px-4 pb-6 pt-4 md:hidden ${hidden ? 'invisible' : ''}`}>
      <p className="font-sfx text-lg uppercase tracking-wide text-accent">Nesta edição</p>
      <p className="mt-1 leading-snug">{c.summary}</p>
      <p className="mt-2 font-hand text-2xl text-glow">{c.realName}</p>
    </div>
  )
}

function Masthead({ character: c, hidden }: { character: Character; hidden: boolean }) {
  return (
    <header className="relative z-20 flex items-stretch gap-3 border-b-[3px] border-ink py-2 pl-4 pr-[12rem] sm:pl-8 sm:pr-[21rem]">
      <div className="flex flex-col items-center justify-center border-[3px] border-ink bg-paper px-2 py-1 leading-none shadow-[3px_3px_0_var(--ink)]">
        <span className="font-display text-2xl">{hidden ? 'Nº ???' : fileNumber(c)}</span>
        <span className="mt-0.5 font-sfx text-sm tracking-wide text-accent">{ISSUE_PRICE}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p className="font-display text-3xl leading-none tracking-tight sm:text-4xl">
          HERÓIS<span className="text-accent">!</span>
        </p>
        <p className="truncate text-sm italic text-muted">o fanzine colecionável do universo cinematográfico</p>
      </div>
      <div className="hidden flex-col items-end justify-center text-right font-sfx text-base leading-tight tracking-wide sm:flex">
        <span>Edição de colecionador</span>
        <span className="text-muted">{ISSUE_DATE}</span>
      </div>
    </header>
  )
}

/** Altura máxima de cada linha do título, proporcional à tela. */
function useTitleMax() {
  const get = () => Math.max(90, Math.min(window.innerHeight * 0.27, 280))
  const [v, setV] = useState(get)
  useEffect(() => {
    const on = () => setV(get())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return v
}
