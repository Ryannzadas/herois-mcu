import { range, smoothstep } from '@/lib/utils'
import { INK, sfx } from './comic'
import type { EffectContext, EffectFactory } from './types'

/**
 * Gamora — a Matadora de Deuses risca a página em três golpes. A cada
 * golpe, um pedaço da impressão desliza ao longo do corte e cai, como num
 * corte de samurai; por baixo já está o traje colorido.
 * Acabamento de quadrinho: lâmina com brilho, rastro do golpe e "SHING!".
 */

type P = [number, number]

interface Cut {
  a: P
  b: P
  t: number
}

interface Piece {
  poly: P[]
  /** momento em que o pedaço se solta */
  t: number
  /** direção do deslize (unitária, em u/v) */
  dir: P
  spin: number
}

// cortes em espaço de figura (u, v)
const CUT1: Cut = { a: [-0.2, 0.16], b: [1.2, 0.5], t: 0.14 }
const CUT2: Cut = { a: [1.2, 0.86], b: [-0.2, 0.6], t: 0.34 }
const CUT3: Cut = { a: [0.52, 0.74], b: [0.44, 1.2], t: 0.54 }
const CUTS = [CUT1, CUT2, CUT3]
const SWING = 0.07

const norm = (v: P): P => {
  const l = Math.hypot(v[0], v[1]) || 1
  return [v[0] / l, v[1] / l]
}

const PIECES: Piece[] = [
  // acima do primeiro corte: escorrega para a direita e cai
  { poly: [[-0.2, -0.3], [1.2, -0.3], CUT1.b, CUT1.a], t: CUT1.t + SWING, dir: norm([1.4, 0.34]), spin: 0.25 },
  // faixa do meio: escorrega para a esquerda
  { poly: [CUT1.a, CUT1.b, CUT2.a, CUT2.b], t: CUT2.t + SWING, dir: norm([-1.4, -0.26]), spin: -0.3 },
  // pernas: o terceiro corte separa em duas metades
  { poly: [CUT2.b, CUT3.a, CUT3.b, [-0.2, 1.3]], t: CUT3.t + SWING, dir: norm([-1, 0.2]), spin: -0.2 },
  { poly: [CUT3.a, CUT2.a, [1.2, 1.3], CUT3.b], t: CUT3.t + SWING, dir: norm([1, 0.2]), spin: 0.2 },
]

/** Matadora de Deuses: lâmina comprida com guarda e cabo, apontando para +x */
function blade(g: CanvasRenderingContext2D, len: number, line: number, accent: string) {
  g.lineJoin = 'round'
  g.lineWidth = line
  g.strokeStyle = INK
  g.beginPath()
  g.moveTo(len, 0)
  g.lineTo(len * 0.15, -len * 0.07)
  g.lineTo(len * 0.12, len * 0.05)
  g.closePath()
  g.fillStyle = '#e9eef2'
  g.fill()
  g.stroke()
  // fio da lâmina
  g.beginPath()
  g.moveTo(len * 0.95, -len * 0.004)
  g.lineTo(len * 0.18, -len * 0.055)
  g.strokeStyle = '#ffffff'
  g.lineWidth = line * 0.7
  g.stroke()
  // guarda e cabo
  g.beginPath()
  g.rect(len * 0.08, -len * 0.08, len * 0.05, len * 0.16)
  g.fillStyle = accent
  g.fill()
  g.lineWidth = line
  g.strokeStyle = INK
  g.stroke()
  g.beginPath()
  g.rect(-len * 0.12, -len * 0.025, len * 0.2, len * 0.05)
  g.fillStyle = '#3a2a22'
  g.fill()
  g.stroke()
}

function piecePath(c: EffectContext, poly: P[]) {
  const g = c.ctx
  g.beginPath()
  poly.forEach(([u, v], i) => {
    const [x, y] = c.toScreen(u, v)
    if (i === 0) g.moveTo(x, y)
    else g.lineTo(x, y)
  })
  g.closePath()
}

const gamora: EffectFactory = () => {
  return {
    duration: 2.6,
    render(p, c) {
      const g = c.ctx
      const u1 = c.unit
      const line = Math.max(1.5, u1 * 0.004)
      const accent = c.palette.accent2

      if (p < PIECES[0].t) {
        c.drawPrint()
      } else {
        c.drawReal()
        for (const pc of PIECES) {
          const k = range(p, pc.t, pc.t + 0.22)
          if (k >= 1) continue
          const slide = smoothstep(0, 0.7, k) * 0.6
          const fall = k * k * 1.2
          const du = pc.dir[0] * slide
          const dv = pc.dir[1] * slide + fall
          const [x0, y0] = c.toScreen(0.5, 0.5)
          const [x1, y1] = c.toScreen(0.5 + du, 0.5 + dv)
          g.save()
          g.globalAlpha = 1 - range(k, 0.55, 1)
          g.translate(x1, y1)
          g.rotate(pc.spin * k)
          g.translate(-x0, -y0)
          piecePath(c, pc.poly)
          g.clip()
          c.drawPrint()
          g.restore()
        }
      }

      // golpes: a lâmina passa pela linha deixando um risco brilhante
      for (const cut of CUTS) {
        const k = range(p, cut.t, cut.t + SWING)
        if (k <= 0) continue
        const [ax, ay] = c.toScreen(...cut.a)
        const [bx, by] = c.toScreen(...cut.b)
        const hx = ax + (bx - ax) * k
        const hy = ay + (by - ay) * k
        // o risco some quando o pedaço cai
        const fade = 1 - range(p, cut.t + SWING, cut.t + SWING + 0.12)
        if (fade > 0) {
          g.save()
          g.globalAlpha = fade
          g.lineCap = 'round'
          g.beginPath()
          g.moveTo(ax, ay)
          g.lineTo(hx, hy)
          g.lineWidth = Math.max(7, u1 * 0.02)
          g.strokeStyle = INK
          g.stroke()
          g.lineWidth = Math.max(4, u1 * 0.011)
          g.strokeStyle = '#fff'
          g.stroke()
          g.lineWidth = Math.max(1.5, u1 * 0.005)
          g.strokeStyle = accent
          g.stroke()
          g.restore()
        }
        if (k < 1) {
          g.save()
          g.translate(hx, hy)
          g.rotate(Math.atan2(by - ay, bx - ax))
          blade(g, u1 * 0.6, line * 1.3, accent)
          g.restore()
          if (k < 0.3) c.shake(0.3)
        }
      }

      const [sx, sy] = c.toScreen(0.84, Math.max(0.1, c.anchors.head[1]))
      sfx(c, 'SHING!', sx, sy, u1 * 0.14, range(p, CUT1.t, 0.96), {
        rotate: -0.14,
        fill: '#f6f1ff',
        burstFill: accent,
        seed: 2014,
      })
    },
  }
}

export default gamora
