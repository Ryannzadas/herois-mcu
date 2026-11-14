import { useState } from 'react'
import { fileNumber, ISSUE_PRICE, type Character } from '@/data/characters'
import { cn } from '@/lib/utils'

/**
 * Miniatura de capa de revista. Usada no seletor (pilha) e no sorteio
 * (capas sendo folheadas). Tamanho vem de quem usa; o texto escala com
 * a largura via container query (cqw).
 */
export function MiniCover({ character: c, className }: { character: Character; className?: string }) {
  // thumb.png → traje.png → silhueta desenhada
  const sources = [`/characters/${c.id}/thumb.png`, `/characters/${c.id}/traje.png`]
  const [srcIndex, setSrcIndex] = useState(0)
  return (
    <div
      className={cn('@container relative aspect-[3/4] overflow-hidden border-[3px] border-ink', className)}
      style={{ background: c.palette.accent }}
    >
      {/* retícula de fundo */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle, ${c.palette.glow} 30%, transparent 33%)`,
          backgroundSize: '6cqw 6cqw',
        }}
      />
      {/* figura */}
      <div className="absolute inset-x-0 bottom-0 top-[30%]">
        {srcIndex < sources.length ? (
          <img
            src={sources[srcIndex]}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setSrcIndex((i) => i + 1)}
            className="h-full w-full object-cover object-top drop-shadow-[3px_3px_0_var(--ink)]"
          />
        ) : (
          <Silhouette fill={c.palette.accent2} />
        )}
      </div>
      {/* cabeçalho da capa */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-ink px-[4cqw] py-[1.5cqw] font-display text-[7cqw] leading-none text-paper">
        <span>{fileNumber(c)}</span>
        <span className="text-accent-2" style={{ color: c.palette.accent2 }}>
          {ISSUE_PRICE}
        </span>
      </div>
      <p
        className="ink-stroke absolute inset-x-[4cqw] top-[11cqw] font-display text-[19cqw] uppercase leading-[0.85] text-paper"
        style={{ WebkitTextStrokeWidth: '0.8cqw' }}
      >
        {c.codename}
      </p>
    </div>
  )
}

function Silhouette({ fill }: { fill: string }) {
  return (
    <svg viewBox="0 0 64 80" preserveAspectRatio="xMidYMax meet" className="h-full w-full" aria-hidden>
      <g fill={fill} stroke="var(--ink)" strokeWidth="2">
        <circle cx="32" cy="22" r="10" />
        <path d="M10 82 C10 50 18 36 32 36 C46 36 54 50 54 82 Z" />
      </g>
    </svg>
  )
}
