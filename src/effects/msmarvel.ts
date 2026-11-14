import { range, seeded } from '@/lib/utils'
import { INK, sfx } from './comic'
import type { EffectFactory } from './types'

/**
 * Ms. Marvel — a luz cristalina do bracelete se espalha pelo corpo em
 * facetas roxas, a partir do peito. Cada faceta acende e, ao apagar, deixa
 * o traje colorido no lugar. No fim, um punho gigante de luz dura cresce ao
 * lado da figura.
 * Acabamento de quadrinho: facetas com contorno claro e "EMBIGGEN!".
 */

type P = [number, number]

const COLS = 6
const ROWS = 9
const SPREAD_START = 0.08
const SPREAD_END = 0.6
const LIGHT = 'rgba(176, 118, 255, 0.78)'
const LIGHT_EDGE = '#efe2ff'
const LIGHT_DARK = 'rgba(120, 70, 220, 0.85)'

/** contorno de um punho fechado visto de lado (s = largura do punho), socando para -x */
function fistPath(g: CanvasRenderingContext2D, s: number) {
  g.beginPath()
  g.moveTo(0.78 * s, -0.27 * s)
  g.lineTo(0.12 * s, -0.43 * s)
  g.quadraticCurveTo(-0.2 * s, -0.54 * s, -0.42 * s, -0.46 * s)
  // quatro dedos dobrados na frente
  for (let i = 0; i < 4; i++) {
    const y0 = -0.46 + i * 0.225
    g.quadraticCurveTo(-0.64 * s, (y0 + 0.1125) * s, -0.42 * s, (y0 + 0.225) * s)
  }
  g.quadraticCurveTo(-0.15 * s, 0.54 * s, 0.14 * s, 0.44 * s)
  g.lineTo(0.78 * s, 0.3 * s)
  g.closePath()
}
/** polegar dobrado por cima dos dedos */
function thumbPath(g: CanvasRenderingContext2D, s: number) {
  g.beginPath()
  g.moveTo(0.3 * s, -0.02 * s)
  g.quadraticCurveTo(-0.05 * s, -0.08 * s, -0.3 * s, 0.1 * s)
  g.quadraticCurveTo(-0.4 * s, 0.22 * s, -0.26 * s, 0.3 * s)
  g.quadraticCurveTo(0.02 * s, 0.2 * s, 0.34 * s, 0.26 * s)
  g.closePath()
}

const msmarvel: EffectFactory = (c) => {
  const rand = seeded(2022)
  const [cu, cv] = c.anchors.chest
  const mask = c.createMask(0.25)

  // malha de facetas: pontos com jitter, cada célula vira 2 triângulos
  const grid: P[][] = []
  for (let r = 0; r <= ROWS; r++) {
    const row: P[] = []
    for (let k = 0; k <= COLS; k++) {
      const edge = r === 0 || r === ROWS || k === 0 || k === COLS
      row.push([
        -0.05 + (k / COLS) * 1.1 + (edge ? 0 : (rand() - 0.5) * 0.1),
        -0.02 + (r / ROWS) * 1.04 + (edge ? 0 : (rand() - 0.5) * 0.07),
      ])
    }
    grid.push(row)
  }
  const facets: { pts: P[]; dist: number; t: number }[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let k = 0; k < COLS; k++) {
      const a = grid[r][k]
      const b = grid[r][k + 1]
      const d = grid[r + 1][k]
      const e = grid[r + 1][k + 1]
      const tris: P[][] = rand() < 0.5 ? [[a, b, e], [a, e, d]] : [[a, b, d], [b, e, d]]
      for (const pts of tris) {
        const mu = (pts[0][0] + pts[1][0] + pts[2][0]) / 3
        const mv = (pts[0][1] + pts[1][1] + pts[2][1]) / 3
        facets.push({ pts, dist: Math.hypot(mu - cu, (mv - cv) * 1.4), t: 0 })
      }
    }
  }
  // a luz chega primeiro nas facetas mais perto do peito
  const far = Math.max(...facets.map((f) => f.dist))
  for (const f of facets) f.t = SPREAD_START + (f.dist / far) * (SPREAD_END - SPREAD_START) + (rand() - 0.5) * 0.03

  return {
    duration: 3,
    render(p, c) {
      const g = c.ctx
      const u1 = c.unit
      const line = Math.max(1.5, u1 * 0.004)

      c.drawPrint(1 - range(p, 0.84, 0.96))

      // facetas já atingidas revelam o traje
      mask.clear()
      const m = mask.ctx
      const mw = mask.canvas.width
      m.fillStyle = '#fff'
      for (const f of facets) {
        if (p < f.t) continue
        m.beginPath()
        f.pts.forEach(([u, v], i) => (i === 0 ? m.moveTo(u * mw, v * mw * 1.4) : m.lineTo(u * mw, v * mw * 1.4)))
        m.closePath()
        m.fill()
      }
      c.drawRealMasked(mask)
      c.drawReal(range(p, 0.7, 0.86))

      // brilho de luz dura nas facetas recém-atingidas
      g.save()
      g.lineJoin = 'round'
      for (const f of facets) {
        const k = range(p, f.t, f.t + 0.09)
        if (k <= 0 || k >= 1) continue
        g.globalAlpha = 1 - k
        g.beginPath()
        f.pts.forEach(([u, v], i) => {
          const [x, y] = c.toScreen(u, v)
          if (i === 0) g.moveTo(x, y)
          else g.lineTo(x, y)
        })
        g.closePath()
        g.fillStyle = LIGHT
        g.fill()
        g.lineWidth = Math.max(1.5, u1 * 0.005)
        g.strokeStyle = LIGHT_EDGE
        g.stroke()
      }
      g.restore()

      // pulso no peito quando a luz começa
      const pulse = range(p, 0.04, 0.2)
      if (pulse > 0 && pulse < 1) {
        const [x, y] = c.toScreen(cu, cv)
        g.save()
        g.globalAlpha = 1 - pulse
        g.beginPath()
        g.arc(x, y, u1 * (0.03 + pulse * 0.22), 0, Math.PI * 2)
        g.lineWidth = Math.max(4, u1 * 0.012)
        g.strokeStyle = INK
        g.stroke()
        g.lineWidth = Math.max(2, u1 * 0.006)
        g.strokeStyle = LIGHT_EDGE
        g.stroke()
        g.restore()
      }

      // punho gigante de luz dura: cresce com um passo a mais e some
      const grow = range(p, 0.6, 0.78)
      const fistA = (grow > 0 ? 1 : 0) * (1 - range(p, 0.86, 0.97))
      if (fistA > 0) {
        const over = grow < 1 ? Math.sin(grow * Math.PI) * 0.18 : 0
        const size = u1 * 0.66 * (grow + over)
        // soca da direita para a esquerda, parando ao lado da figura
        const [fx0, fy] = c.toScreen(1.42 - grow * 0.24, cv + 0.14)
        // em tela estreita o punho entra pela borda em vez de sair do quadro
        const fx = Math.min(fx0, c.width - size * 0.4)
        g.save()
        g.globalAlpha = fistA
        g.translate(fx, fy)
        g.rotate(-0.1)
        g.lineJoin = 'round'
        fistPath(g, size)
        g.fillStyle = LIGHT
        g.fill()
        // faces mais escuras: pulso e parte de baixo
        g.save()
        g.clip()
        g.fillStyle = LIGHT_DARK
        g.beginPath()
        g.moveTo(0.12 * size, -0.6 * size)
        g.lineTo(0.9 * size, -0.6 * size)
        g.lineTo(0.9 * size, 0.6 * size)
        g.lineTo(-0.5 * size, 0.6 * size)
        g.lineTo(-0.44 * size, 0.3 * size)
        g.lineTo(0.3 * size, 0.2 * size)
        g.closePath()
        g.fill()
        g.restore()
        // vincos entre os dedos
        g.lineWidth = Math.max(1.5, u1 * 0.005)
        g.strokeStyle = LIGHT_EDGE
        for (let i = 1; i < 4; i++) {
          const y = (-0.46 + i * 0.225) * size
          g.beginPath()
          g.moveTo(-0.44 * size, y)
          g.lineTo(-0.02 * size, y - 0.02 * size)
          g.stroke()
        }
        g.beginPath()
        g.moveTo(0.02 * size, -0.44 * size)
        g.lineTo(-0.02 * size, 0.46 * size)
        g.stroke()
        fistPath(g, size)
        g.lineWidth = line * 1.8
        g.strokeStyle = INK
        g.stroke()
        thumbPath(g, size)
        g.fillStyle = 'rgba(205, 170, 255, 0.95)'
        g.fill()
        g.lineWidth = line * 1.4
        g.strokeStyle = INK
        g.stroke()
        g.restore()
        if (grow > 0.5 && grow < 0.75) c.shake(0.5)
      }

      const [sx, sy] = c.toScreen(1.3, Math.max(0.06, c.anchors.head[1] - 0.06))
      sfx(c, 'EMBIGGEN!', sx, sy, u1 * 0.1, range(p, 0.64, 0.99), {
        rotate: -0.1,
        fill: LIGHT_EDGE,
        burstFill: c.palette.accent,
        seed: 2022,
      })
    },
  }
}

export default msmarvel
