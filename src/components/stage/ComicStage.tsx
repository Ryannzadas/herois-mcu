import { animate, AnimatePresence, motion, useMotionValue, useMotionValueEvent } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { ComicButton } from '@/components/ui/comic-button'
import type { Character } from '@/data/characters'
import { loadComicFonts } from '@/effects/comic'
import type { EffectModule, TransformEffect } from '@/effects/types'
import { loadFigure, type FigureAssets } from '@/lib/figure'
import { gsap } from '@/lib/gsap'
import { cn } from '@/lib/utils'
import { StageRenderer } from './renderer'

/** print = xerox em retícula · opening = efeito rodando · real = traje colorido */
type Mode = 'print' | 'opening' | 'real'

interface Props {
  character: Character
  /** true enquanto o sorteio está rodando: o palco fica vazio (a pilha cobre) */
  locked: boolean
  reduced: boolean
}

/** efeito próprio do herói ou, sem ele, os quadros de HQ genéricos */
const loadEffect = (c: Character): Promise<EffectModule> => (c.effect ? c.effect() : import('@/effects/fade'))

/** fração do quadrado da lupa ocupada pelo vidro (o resto é aro) */
const GLASS = 0.84

export function ComicStage({ character, locked, reduced }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<StageRenderer | null>(null)
  const [assets, setAssets] = useState<FigureAssets | null>(null)
  const [mode, setMode] = useState<Mode>('print')
  const [lensSize, setLensSize] = useState(160)
  const [lensMoved, setLensMoved] = useState(false)

  const charRef = useRef(character)
  charRef.current = character

  const lensX = useMotionValue(0)
  const lensY = useMotionValue(0)
  // bilhete da dica abaixo da lupa quando ela está perto do topo
  const [hintBelow, setHintBelow] = useState(false)
  useMotionValueEvent(lensY, 'change', (y) => setHintBelow(y < 90))

  // estado lido pelo loop de render (não dispara re-render)
  const live = useRef({
    mode: 'print' as Mode,
    locked,
    prog: { p: 0 },
    effect: null as TransformEffect | null,
    tween: null as gsap.core.Tween | null,
    lensSize: 160,
    lensMoved: false,
  })
  live.current.locked = locked
  live.current.lensSize = lensSize
  live.current.lensMoved = lensMoved

  /* ---------- troca de personagem: carrega imagem + pré-carrega efeito ---------- */
  useEffect(() => {
    let alive = true
    const l = live.current
    l.tween?.kill()
    l.effect?.dispose?.()
    l.effect = null
    l.mode = 'print'
    setMode('print')
    setLensMoved(false) // nova capa: a lupa volta ao peito do herói
    loadEffect(character).catch(() => undefined) // lazy: só quando selecionado

    loadFigure(character).then((a) => {
      if (alive) setAssets(a)
    })
    return () => {
      alive = false
    }
  }, [character])

  /* ---------- a figura "cai" na capa quando liberada ---------- */
  useEffect(() => {
    const canvas = canvasRef.current!
    if (!assets || locked) {
      gsap.set(canvas, { autoAlpha: 0 })
      return
    }
    const t = reduced
      ? gsap.set(canvas, { autoAlpha: 1, y: 0, scale: 1, rotate: 0 })
      : gsap.fromTo(
          canvas,
          { autoAlpha: 0, y: 40, scale: 1.08, rotate: -2 },
          { autoAlpha: 1, y: 0, scale: 1, rotate: 0, duration: 0.7, ease: 'back.out(1.6)' },
        )
    return () => {
      t.kill()
    }
  }, [assets, locked, reduced])

  /* ---------- canvas: resize + loop ---------- */
  useEffect(() => {
    const canvas = canvasRef.current!
    const wrap = wrapRef.current!
    const r = new StageRenderer(canvas)
    rendererRef.current = r

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      r.resize(width, height, Math.min(window.devicePixelRatio || 1, 2))
      const size = Math.round(Math.max(120, Math.min(210, width * 0.28)))
      setLensSize(size)
      live.current.lensSize = size
    })
    ro.observe(wrap)

    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(wrap)

    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (!visible) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      r.clock += dt
      r.beginFrame()
      const l = live.current

      if (r.assets && !l.locked) {
        if (l.mode === 'opening' && l.effect) {
          r.time += dt
          l.effect.render(l.prog.p, r)
        } else if (l.mode === 'real') {
          r.drawReal()
        } else {
          r.drawPrint()
        }
        if (l.mode !== 'opening') {
          const s = l.lensSize
          // até o usuário mexer, a lupa acompanha o peito do herói (robusto a resize e troca)
          if (!l.lensMoved) {
            const [x, y] = r.toScreen(r.anchors.chest[0], r.anchors.chest[1])
            lensX.set(Math.max(0, Math.min(r.width - s, x - s / 2)))
            lensY.set(Math.max(0, Math.min(r.height - s, y - s / 2)))
          }
          r.drawLens(lensX.get() + s / 2, lensY.get() + s / 2, (s / 2) * GLASS, l.mode === 'real' ? 'print' : 'real')
        }
      }
      r.endFrame()

      if (r.shakeAmount > 0 && !r.reduced) {
        const a = r.shakeAmount * 12
        wrap.style.transform = `translate(${(Math.random() - 0.5) * a}px, ${(Math.random() - 0.5) * a}px)`
      } else if (wrap.style.transform) {
        wrap.style.transform = ''
      }
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      rendererRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const r = rendererRef.current
    if (!r) return
    r.reduced = reduced
    r.palette = character.palette
    if (assets) {
      r.setAssets(assets)
      r.anchors = character.anchors ?? assets.anchors
    }
  }, [reduced, character, assets])

  /* ---------- abrir / fechar a edição ---------- */
  const toggleIssue = async () => {
    const l = live.current
    const r = rendererRef.current
    if (!r || !r.assets || l.mode === 'opening' || locked) return
    const forward = l.mode === 'print'
    const id = character.id

    let mod: EffectModule
    try {
      ;[mod] = await Promise.all([reduced ? import('@/effects/fade') : loadEffect(character), loadComicFonts()])
    } catch {
      mod = await import('@/effects/fade')
    }
    if (charRef.current.id !== id) return

    r.time = 0
    const effect = mod.default(r)
    l.effect = effect
    l.mode = 'opening'
    setMode('opening')
    l.prog.p = forward ? 0 : 1
    l.tween = gsap.to(l.prog, {
      p: forward ? 1 : 0,
      duration: forward ? effect.duration : effect.duration * 0.6,
      ease: 'none',
      onComplete: () => {
        effect.dispose?.()
        l.effect = null
        l.mode = forward ? 'real' : 'print'
        setMode(l.mode)
      },
    })
  }

  /* ---------- lupa: toque/clique no palco move a lupa ---------- */
  const moveLensTo = (clientX: number, clientY: number) => {
    const rect = wrapRef.current!.getBoundingClientRect()
    const s = lensSize
    const x = Math.min(rect.width - s, Math.max(0, clientX - rect.left - s / 2))
    const y = Math.min(rect.height - s, Math.max(0, clientY - rect.top - s / 2))
    const opts = reduced ? { duration: 0 } : { type: 'spring' as const, stiffness: 300, damping: 30 }
    animate(lensX, x, opts)
    animate(lensY, y, opts)
    setLensMoved(true)
  }

  const nudgeLens = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 48 : 16
    const d: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }
    const v = d[e.key]
    if (!v) return
    e.preventDefault()
    const rect = wrapRef.current!.getBoundingClientRect()
    lensX.set(Math.min(rect.width - lensSize, Math.max(0, lensX.get() + v[0])))
    lensY.set(Math.min(rect.height - lensSize, Math.max(0, lensY.get() + v[1])))
    setLensMoved(true)
  }

  const showLens = !!assets && !locked && mode !== 'opening'
  const label = mode === 'real' ? 'Fechar edição' : mode === 'opening' ? 'Virando a página…' : 'Abrir edição'

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div
        ref={wrapRef}
        className="relative min-h-0 flex-1 cursor-zoom-in"
        // clique (e não pointerdown): no celular, começar a rolar com o dedo sobre a figura não move a lupa
        onClick={(e) => {
          if (e.target === e.currentTarget && showLens) moveLensTo(e.clientX, e.clientY)
        }}
      >
        <canvas
          ref={canvasRef}
          className="pointer-events-none invisible absolute inset-0 h-full w-full"
          role="img"
          aria-label={
            mode === 'real'
              ? `${character.codename} em cores, com o traje completo`
              : `${character.codename} impresso em preto e branco, com retícula`
          }
        />

        <motion.div
          role="slider"
          tabIndex={showLens ? 0 : -1}
          aria-label="Lupa. Arraste ou use as setas para ver a imagem colorida."
          aria-valuetext={mode === 'real' ? 'Mostrando a impressão dentro da lupa' : 'Mostrando as cores dentro da lupa'}
          aria-hidden={!showLens}
          drag={showLens}
          dragMomentum={false}
          dragElastic={0}
          dragConstraints={wrapRef}
          onDragStart={() => setLensMoved(true)}
          onKeyDown={nudgeLens}
          className="absolute left-0 top-0 touch-none rounded-full outline-offset-4 active:cursor-grabbing"
          style={{
            x: lensX,
            y: lensY,
            width: lensSize,
            height: lensSize,
            cursor: showLens ? 'grab' : 'default',
            pointerEvents: showLens ? 'auto' : 'none',
          }}
        />

        <AnimatePresence>
          {showLens && !lensMoved && (
            // a dica acompanha a lupa: bilhete de papel logo acima do vidro
            <motion.div
              key="lens-hint"
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 z-10"
              style={{ x: lensX, y: lensY, width: lensSize, height: lensSize }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.25 }}
            >
              <motion.p
                className={cn(
                  'absolute left-1/2 w-max max-w-[11rem] -translate-x-1/2 -rotate-3 border-2 border-ink bg-paper px-2.5 py-1 text-center font-hand text-lg leading-tight text-ink shadow-[3px_3px_0_var(--ink)] sm:text-xl',
                  // sem espaço acima da lupa (perto do topo do palco), o bilhete vai para baixo
                  hintBelow ? 'top-full mt-12' : 'bottom-full mb-3',
                )}
                animate={reduced ? undefined : { y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
              >
                arraste a lupa pra ver as cores! {hintBelow ? '↑' : '↓'}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex shrink-0 items-center justify-center pt-3">
        <ComicButton size="lg" onClick={toggleIssue} disabled={!assets || locked || mode === 'opening'} aria-live="polite">
          <BookIcon open={mode === 'real'} />
          {label}
        </ComicButton>
      </div>
    </div>
  )
}

function BookIcon({ open }: { open: boolean }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
      {open ? (
        <path d="M12 6c-2-1.5-5-2-8-1.5v14c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-14c-3-.5-6 0-8 1.5zM12 6v14" />
      ) : (
        <path d="M6 3h11a1 1 0 0 1 1 1v16H7a2 2 0 0 1-2-2V4a1 1 0 0 1 1-1zM18 20H7M9 8h6" />
      )}
    </svg>
  )
}
