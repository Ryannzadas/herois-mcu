import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { gsap } from '@/lib/gsap'
import { scrollToTarget } from '@/lib/smooth-scroll'
import { cn } from '@/lib/utils'

/** Seções da edição, na ordem da página (o id é o do elemento). */
const SECTIONS = [
  { id: 'capa', label: 'Capa' },
  { id: 'manifesto', label: 'Manifesto' },
  { id: 'mural', label: 'Mural' },
  { id: 'identidade', label: 'Dupla identidade' },
  { id: 'trajes', label: 'Trajes' },
  { id: 'filme', label: 'O filme' },
  { id: 'ficha', label: 'Ficha' },
  { id: 'edicoes', label: 'Outras edições' },
] as const

/** Rótulo da seção; a do filme diz "A série" quando o herói só tem série (lido da própria seção). */
function labelOf(s: (typeof SECTIONS)[number]): string {
  if (s.id !== 'filme' || typeof document === 'undefined') return s.label
  const own = document.getElementById(s.id)?.getAttribute('aria-label')?.split(':')[0]
  return own || s.label
}

/** Topo real de uma seção (seções presas ficam dentro de um pin-spacer). */
function sectionTop(id: string) {
  const el = document.getElementById(id)
  if (!el) return null
  const box = el.parentElement?.classList.contains('pin-spacer') ? el.parentElement : el
  return box.getBoundingClientRect().top + window.scrollY
}

/**
 * Barra de progresso de leitura no topo + indicador "indo para: [seção]".
 * A barra anima só scaleX; o rótulo troca com uma animação curta (Motion).
 * O botão leva à próxima seção; a seta abre o índice completo.
 */
export function ReadingNav({ reduced }: { reduced: boolean }) {
  const barRef = useRef<HTMLDivElement>(null)
  const [current, setCurrent] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const setScale = gsap.quickSetter(barRef.current, 'scaleX')
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setScale(max > 0 ? window.scrollY / max : 0)
      // seção atual: a última cujo topo já passou do meio da tela
      const mark = window.scrollY + window.innerHeight * 0.5
      let idx = 0
      SECTIONS.forEach((s, i) => {
        const top = sectionTop(s.id)
        if (top !== null && top <= mark) idx = i
      })
      setCurrent(idx)
    }
    gsap.ticker.add(update)
    return () => gsap.ticker.remove(update)
  }, [])

  // próxima seção que existe na página
  const available = SECTIONS.filter((s) => typeof document !== 'undefined' && document.getElementById(s.id))
  const next = SECTIONS.slice(current + 1).find((s) => available.includes(s))
  const label = next ? labelOf(next) : 'Topo'

  return (
    <>
      <div aria-hidden className="fixed inset-x-0 top-0 z-[60] h-1.5 border-b-2 border-ink bg-paper/70">
        <div ref={barRef} className="h-full origin-left scale-x-0 bg-accent will-change-transform" />
      </div>

      <nav aria-label="Seções da edição" className="fixed right-3 top-4 z-[60] sm:right-5">
        <div className="flex items-stretch border-[3px] border-ink bg-paper shadow-[4px_4px_0_var(--ink)]">
          <button
            type="button"
            onClick={() => scrollToTarget(next ? `#${next.id}` : 0)}
            className="flex items-center gap-2 px-2 py-1 text-left sm:px-3 sm:py-1.5"
            aria-label={`Ir para ${label}`}
          >
            <span className="hidden font-hand text-lg leading-none text-muted sm:inline">indo para:</span>
            <span className="relative block h-6 min-w-[7.5rem] overflow-hidden sm:min-w-[10.5rem]">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={label}
                  initial={reduced ? { opacity: 0 } : { y: '110%', rotate: -6 }}
                  animate={reduced ? { opacity: 1 } : { y: '0%', rotate: 0 }}
                  exit={reduced ? { opacity: 0 } : { y: '-110%', rotate: 6 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  className="absolute left-0 top-0 block whitespace-nowrap font-display text-base uppercase leading-6 text-accent sm:text-lg"
                >
                  {label} ↓
                </motion.span>
              </AnimatePresence>
            </span>
          </button>
          <button
            type="button"
            aria-expanded={open}
            aria-label="Abrir índice"
            onClick={() => setOpen((v) => !v)}
            className="border-l-[3px] border-ink px-2 font-display text-lg"
          >
            {open ? '×' : '≡'}
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.ol
              initial={{ opacity: 0, y: -8, rotate: -2 }}
              animate={{ opacity: 1, y: 0, rotate: -1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: reduced ? 0 : 0.2 }}
              className="mt-2 border-[3px] border-ink bg-paper p-2 shadow-[4px_4px_0_var(--ink)]"
            >
              {available.map((s) => {
                const i = SECTIONS.indexOf(s)
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false)
                        scrollToTarget(`#${s.id}`)
                      }}
                      className={cn(
                        'flex w-full items-baseline gap-3 px-2 py-1 text-left font-display text-lg uppercase hover:bg-accent-2',
                        i === current && 'text-accent',
                      )}
                    >
                      <span className="font-sfx text-sm text-muted">{String(i + 1).padStart(2, '0')}</span>
                      {labelOf(s)}
                    </button>
                  </li>
                )
              })}
            </motion.ol>
          )}
        </AnimatePresence>
      </nav>
    </>
  )
}
