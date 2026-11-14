import { range, smoothstep } from '@/lib/utils'
import { INK, sfx, speedLines } from './comic'
import type { EffectFactory } from './types'

/**
 * Pantera Negra — três golpes de garra rasgam a impressão na diagonal; por
 * dentro dos cortes já aparece o traje colorido. Os rasgos se abrem até
 * tomar a figura e o traje solta a energia cinética num pulso roxo a partir
 * do peito. Acabamento de quadrinho: cortes com contorno de tinta, linhas
 * de ação e "SKRASH!".
 */

type Slash = { a: [number, number]; b: [number, number]; from: number; to: number }

// golpes em coordenadas de figura (u, v); cada um deixa 3 marcas paralelas
const SLASHES: Slash[] = [
  { a: [0.08, -0.04], b: [0.9, 0.6], from: 0.06, to: 0.18 },
  { a: [0.92, 0.26], b: [0.08, 0.78], from: 0.22, to: 0.34 },
  { a: [0.16, 0.56], b: [0.84, 1.02], from: 0.38, to: 0.5 },
]
const CLAWS = [-1, 0, 1]
const GAP = 0.055 // distância entre as marcas, em u

const PURPLE = '#9d5cff'
const LILAC = '#e6d4ff'

/**
 * Marca de garra em forma de lente (fina nas pontas, larga no meio), em
 * pixels já isotrópicos. `d` 0..1 é quanto do golpe já foi traçado.
 */
function lens(
  g: CanvasRenderingContext2D,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  d: number,
  hw: number,
  off: number,
) {
  const dx = bx - ax
  const dy = by - ay
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const steps = 14
  g.beginPath()
  for (let i = 0; i <= steps * 2; i++) {
    const side = i <= steps ? 1 : -1
    const t = (i <= steps ? i : steps * 2 - i) / steps
    const w = hw * Math.sin(Math.PI * t) * side
    const x = ax + dx * t * d + nx * (off + w)
    const y = ay + dy * t * d + ny * (off + w)
    if (i === 0) g.moveTo(x, y)
    else g.lineTo(x, y)
  }
  g.closePath()
}

const panther: EffectFactory = (c) => {
  const [cu, cv] = c.anchors.chest
  const mask = c.createMask(0.25)

  return {
    duration: 2.4,
    render(p, c) {
      const g = c.ctx
      const widen = smoothstep(0.52, 0.86, p) // rasgos se abrem até cobrir
      const pulse = range(p, 0.58, 0.95)

      c.drawPrint(1 - range(p, 0.88, 1))

      // máscara: o que os cortes já abriram
      mask.clear()
      const m = mask.ctx
      const mw = mask.canvas.width
      m.fillStyle = '#fff'
      for (const s of SLASHES) {
        const d = smoothstep(s.from, s.to, p)
        if (d <= 0) continue
        const hw = (0.034 + widen * 0.42) * mw
        for (const k of CLAWS) {
          lens(m, s.a[0] * mw, s.a[1] * mw * 1.4, s.b[0] * mw, s.b[1] * mw * 1.4, d, hw, k * GAP * mw)
          m.fill()
        }
      }
      c.drawRealMasked(mask)
      c.drawReal(range(p, 0.74, 0.88))

      // contorno dos cortes: tinta + brilho roxo de vibranium
      const edge = 1 - range(p, 0.5, 0.6)
      if (edge > 0) {
        g.save()
        g.globalAlpha = edge
        g.lineJoin = 'round'
        for (const s of SLASHES) {
          const d = smoothstep(s.from, s.to, p)
          if (d <= 0) continue
          const [ax, ay] = c.toScreen(s.a[0], s.a[1])
          const [bx, by] = c.toScreen(s.b[0], s.b[1])
          const hw = 0.034 * c.unit
          for (const k of CLAWS) {
            lens(g, ax, ay, bx, by, d, hw, k * GAP * c.unit)
            g.lineWidth = Math.max(4, c.unit * 0.012)
            g.strokeStyle = INK
            g.stroke()
            g.lineWidth = Math.max(2, c.unit * 0.005)
            g.strokeStyle = PURPLE
            g.stroke()
            // energia cinética correndo no fundo do corte
            const n = Math.hypot(bx - ax, by - ay) || 1
            const ox = (-(by - ay) / n) * k * GAP * c.unit
            const oy = ((bx - ax) / n) * k * GAP * c.unit
            g.beginPath()
            g.moveTo(ax + ox + (bx - ax) * d * 0.12, ay + oy + (by - ay) * d * 0.12)
            g.lineTo(ax + ox + (bx - ax) * d * 0.88, ay + oy + (by - ay) * d * 0.88)
            g.lineCap = 'round'
            g.lineWidth = Math.max(2, c.unit * 0.008)
            g.strokeStyle = PURPLE
            g.stroke()
            g.lineWidth = Math.max(1, c.unit * 0.003)
            g.strokeStyle = LILAC
            g.stroke()
          }
          // faísca na ponta do golpe enquanto ele corta
          if (d > 0 && d < 1) {
            const tx = ax + (bx - ax) * d
            const ty = ay + (by - ay) * d
            g.fillStyle = LILAC
            g.beginPath()
            g.arc(tx, ty, Math.max(3, c.unit * 0.012), 0, Math.PI * 2)
            g.fill()
          }
        }
        g.restore()
        // um tranco a cada golpe
        for (const s of SLASHES) if (p > s.from && p < s.from + 0.05) c.shake(0.5)
      }

      // pulso cinético: anel roxo saindo do peito
      if (pulse > 0 && pulse < 1) {
        const [x, y] = c.toScreen(cu, cv)
        const r = (0.05 + pulse * 1.3) * c.unit
        const fade = 1 - pulse
        speedLines(c, x, y, fade * 0.9, 9)
        g.save()
        g.globalAlpha = fade
        for (const [w, color] of [
          [0.03, INK],
          [0.016, PURPLE],
          [0.005, LILAC],
        ] as const) {
          g.lineWidth = Math.max(2, c.unit * w)
          g.strokeStyle = color
          g.beginPath()
          g.arc(x, y, r, 0, Math.PI * 2)
          g.stroke()
        }
        // anel de eco, menor e mais fino
        g.lineWidth = Math.max(2, c.unit * 0.006)
        g.strokeStyle = PURPLE
        g.beginPath()
        g.arc(x, y, r * 0.72, 0, Math.PI * 2)
        g.stroke()
        g.restore()
        if (pulse < 0.12) c.shake(0.8)
      }
      if (p > 0.58 && p < 0.68) c.flash((0.68 - p) * 3, '#b88cff')

      const [sx, sy] = c.toScreen(Math.min(0.8, cu + 0.28), Math.max(0.1, cv - 0.14))
      sfx(c, 'SKRASH!', sx, sy, c.unit * 0.14, range(p, 0.08, 0.8), {
        rotate: -0.14,
        fill: LILAC,
        burstFill: c.palette.accent,
        seed: 99,
      })
    },
  }
}

export default panther
