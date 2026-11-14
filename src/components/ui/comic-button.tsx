import { cva, type VariantProps } from 'class-variance-authority'
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, type HTMLMotionProps } from 'motion/react'
import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Botão de gibi: contorno de tinta, sombra dura deslocada e leve inclinação.
 * Micro-interações: retícula que segue o cursor, rabisco que se desenha no
 * hover e efeito magnético. Base para adaptar botões do 21st.dev.
 */

const comicButton = cva(
  'group relative isolate inline-flex select-none items-center justify-center gap-2 overflow-hidden border-[3px] border-ink font-display uppercase tracking-wide shadow-[5px_5px_0_var(--ink)] transition-[box-shadow,background-color,color] duration-150 hover:shadow-[7px_7px_0_var(--ink)] active:shadow-[2px_2px_0_var(--ink)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-[3px_3px_0_var(--ink)]',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-paper',
        paper: 'bg-paper text-ink',
        highlight: 'bg-accent-2 text-ink',
      },
      size: {
        sm: 'h-10 px-3 text-base -rotate-1',
        md: 'h-12 px-5 text-lg -rotate-1',
        lg: 'h-14 px-7 text-2xl -rotate-2',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

type Props = Omit<HTMLMotionProps<'button'>, 'children'> &
  VariantProps<typeof comicButton> & {
    children?: React.ReactNode
    /** força do efeito magnético em px */
    magnet?: number
  }

export function ComicButton({ className, variant, size, magnet = 8, children, disabled, ...props }: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  const reduced = useReducedMotion()
  const [hover, setHover] = useState(false)

  const mx = useMotionValue(50)
  const my = useMotionValue(50)
  const tx = useSpring(0, { stiffness: 260, damping: 18, mass: 0.4 })
  const ty = useSpring(0, { stiffness: 260, damping: 18, mass: 0.4 })
  // retícula visível só num círculo em volta do cursor
  const spot = useMotionTemplate`radial-gradient(90px circle at ${mx}% ${my}%, #000 0%, transparent 75%)`

  const onMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    mx.set(px * 100)
    my.set(py * 100)
    if (!reduced && e.pointerType === 'mouse') {
      tx.set((px - 0.5) * magnet * 2)
      ty.set((py - 0.5) * magnet * 2)
    }
  }

  const reset = () => {
    setHover(false)
    tx.set(0)
    ty.set(0)
  }

  const active = hover && !disabled

  return (
    <motion.button
      ref={ref}
      type="button"
      disabled={disabled}
      className={cn(comicButton({ variant, size }), className)}
      style={{ x: tx, y: ty }}
      onPointerMove={onMove}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={reset}
      onFocus={() => setHover(true)}
      onBlur={reset}
      whileHover={reduced || disabled ? undefined : { rotate: 0, scale: 1.03 }}
      whileTap={reduced ? undefined : { scale: 0.96, x: 2, y: 2 }}
      {...props}
    >
      {/* retícula que segue o cursor */}
      <motion.span
        aria-hidden
        className="halftone pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-35"
        style={{ maskImage: spot, WebkitMaskImage: spot }}
      />
      {/* rabisco de tinta que se desenha no hover */}
      <svg aria-hidden viewBox="0 0 100 10" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-3 bottom-1 h-2.5">
        <motion.path
          d="M2 6 C 20 2, 35 9, 52 5 S 85 3, 98 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={false}
          animate={{ pathLength: active ? 1 : 0, opacity: active ? 1 : 0 }}
          transition={{ duration: reduced ? 0 : 0.35, ease: [0.65, 0, 0.35, 1] }}
        />
      </svg>
      {children}
    </motion.button>
  )
}
