import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState } from 'react'
import { MiniCover } from '@/components/comic/MiniCover'
import { Tape, TornEdge } from '@/components/comic/pieces'
import { ComicButton } from '@/components/ui/comic-button'
import { CHARACTERS, fileNumber, GROUPS, type Character, type GroupId } from '@/data/characters'
import { cn } from '@/lib/utils'

interface Props {
  currentId: string
  disabled: boolean
  reduced: boolean
  onSelect: (id: string) => void
  onRandom: () => void
}

type Filter = GroupId | 'todos'

/** Fileira de capas empilhadas, com filtro por grupo e edição aleatória. */
export function IssueStack({ currentId, disabled, reduced, onSelect, onRandom }: Props) {
  const [filter, setFilter] = useState<Filter>('todos')
  const listRef = useRef<HTMLUListElement>(null)
  const list = filter === 'todos' ? CHARACTERS : CHARACTERS.filter((c) => c.group === filter)
  const [focusId, setFocusId] = useState(currentId)
  const tabStop = list.some((c) => c.id === focusId) ? focusId : (list.find((c) => c.id === currentId) ?? list[0])?.id

  // navegação por teclado: setas movem o foco, Enter/Espaço seleciona
  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = list.findIndex((c) => c.id === tabStop)
    const next: Record<string, number> = {
      ArrowRight: i + 1,
      ArrowDown: i + 1,
      ArrowLeft: i - 1,
      ArrowUp: i - 1,
      Home: 0,
      End: list.length - 1,
    }
    if (!(e.key in next)) return
    e.preventDefault()
    const target = list[(next[e.key] + list.length) % list.length]
    setFocusId(target.id)
    listRef.current?.querySelector<HTMLElement>(`[data-id="${target.id}"]`)?.focus()
  }

  return (
    <section id="edicoes" aria-label="Escolha sua edição" className="relative text-accent">
      <TornEdge seed={4} className="-mb-px" />
      <div className="bg-accent px-4 pb-10 pt-6 text-paper sm:px-8">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div>
            <h2 className="ink-stroke font-display text-5xl uppercase leading-none text-paper sm:text-6xl" style={{ WebkitTextStrokeWidth: 2 }}>
              Escolha sua edição
            </h2>
            <p className="mt-1 -rotate-1 font-hand text-2xl text-accent-2">ou deixe a pilha decidir →</p>
          </div>
          <ComicButton variant="highlight" className="ml-auto" onClick={onRandom} disabled={disabled} aria-label="Pegar uma edição aleatória">
            <DiceIcon />
            Edição aleatória
          </ComicButton>
        </div>

        {/* abas de índice */}
        <div role="group" aria-label="Filtrar por grupo" className="scrollbar-none -mx-4 mt-6 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {[{ id: 'todos' as const, short: 'Todas' }, ...GROUPS].map((g) => {
            const active = filter === g.id
            return (
              <button
                key={g.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(g.id)}
                className={cn(
                  'relative shrink-0 border-[3px] border-b-0 border-ink px-4 pb-1.5 pt-2 font-sfx text-lg tracking-wide transition-transform',
                  active ? 'translate-y-0 bg-accent-2 text-ink' : 'translate-y-1.5 bg-paper text-ink hover:translate-y-0.5',
                )}
              >
                {g.short}
              </button>
            )
          })}
        </div>

        <div className="halftone-paper border-[3px] border-ink bg-glow/40 px-4 pb-4 pt-10 sm:px-6">
          <ul
            ref={listRef}
            role="listbox"
            aria-label="Edições"
            aria-orientation="horizontal"
            onKeyDown={onKeyDown}
            className="scrollbar-none -mx-4 flex snap-x overflow-x-auto px-6 pb-4 pt-6 sm:mx-0"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {list.map((c, i) => (
                <IssueCard
                  key={c.id}
                  index={i}
                  character={c}
                  selected={c.id === currentId}
                  tabbable={c.id === tabStop}
                  disabled={disabled}
                  reduced={reduced}
                  onFocus={() => setFocusId(c.id)}
                  onSelect={() => onSelect(c.id)}
                />
              ))}
            </AnimatePresence>
            {list.length === 0 && (
              <li className="flex h-40 w-full items-center justify-center border-[3px] border-dashed border-paper/70 font-hand text-2xl text-paper">
                essas edições ainda estão na gráfica…
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  )
}

function IssueCard({
  character: c,
  index,
  selected,
  tabbable,
  disabled,
  reduced,
  onFocus,
  onSelect,
}: {
  character: Character
  index: number
  selected: boolean
  tabbable: boolean
  disabled: boolean
  reduced: boolean
  onFocus: () => void
  onSelect: () => void
}) {
  const tilt = index % 2 === 0 ? -3 : 2.5
  return (
    <motion.li
      layout={!reduced}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: reduced ? 0 : 0.25 }}
      className="relative shrink-0 snap-start [&:not(:first-child)]:-ml-8 sm:[&:not(:first-child)]:-ml-10"
      style={{ zIndex: selected ? 100 : index + 1 }}
    >
      <motion.button
        type="button"
        role="option"
        data-id={c.id}
        aria-selected={selected}
        aria-label={`${fileNumber(c)}: ${c.codename}, ${c.realName}`}
        tabIndex={tabbable ? 0 : -1}
        disabled={disabled}
        onFocus={onFocus}
        onClick={onSelect}
        initial={false}
        animate={{ rotate: selected ? 0 : tilt, y: selected ? -18 : 0 }}
        whileHover={reduced ? undefined : { y: -28, rotate: 0, scale: 1.04 }}
        whileFocus={reduced ? undefined : { y: -28, rotate: 0 }}
        whileTap={reduced ? undefined : { scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 380, damping: 24 }}
        className={cn('relative block w-36 text-left shadow-[6px_6px_0_var(--ink)] sm:w-44', disabled && 'cursor-wait')}
      >
        <MiniCover character={c} />
        {selected && (
          <>
            <Tape className="-top-3 left-1/2 -translate-x-1/2 rotate-2" />
            <span className="absolute -bottom-3 -right-3 rotate-[-10deg] border-[3px] border-ink bg-accent-2 px-2 font-sfx text-base text-ink">
              Lendo!
            </span>
          </>
        )}
      </motion.button>
    </motion.li>
  )
}

function DiceIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <circle cx="9" cy="9" r="1.3" fill="currentColor" />
      <circle cx="15" cy="15" r="1.3" fill="currentColor" />
      <circle cx="15" cy="9" r="1.3" fill="currentColor" />
      <circle cx="9" cy="15" r="1.3" fill="currentColor" />
    </svg>
  )
}
