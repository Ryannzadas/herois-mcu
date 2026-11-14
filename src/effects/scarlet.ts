import { range, seeded, smoothstep } from '@/lib/utils'
import { INK, sfx } from './comic'
import type { EffectFactory } from './types'

/**
 * Feiticeira Escarlate — fios de magia do caos espiralam em volta da figura
 * e convergem no peito; dali nasce o Hex de Westview, um hexágono vermelho
 * que cresce e reescreve a página: dentro dele, o traje colorido. Acabamento
 * de quadrinho: fios e borda do hex em tinta, chiado de estática na borda e
 * "VWOMM!".
 */

const WISPS = 8
const RED = '#ff2340'
const PINK = '#ffb3c1'

const scarlet: EffectFactory = (c) => {
  const rand = seeded(1010)
  const [cu, cv] = c.anchors.chest
  const mask = c.createMask(0.25)
  const wisps = Array.from({ length: WISPS }, (_, i) => ({
    a: (i / WISPS) * Math.PI * 2 + rand() * 0.5,
    r: 0.45 + rand() * 0.25, // raio inicial, em u
    turns: 1.2 + rand() * 0.8,
    delay: rand() * 0.08,
  }))
  // raio do hexágono que cobre a figura inteira a partir do peito (em u)
  const full =
    Math.max(Math.hypot(cu, cv * 1.4), Math.hypot(1 - cu, cv * 1.4), Math.hypot(cu, (1 - cv) * 1.4), Math.hypot(1 - cu, (1 - cv) * 1.4)) *
      1.16 +
    0.1

  /** vértices do hexágono (ponta para cima) em pixels isotrópicos */
  const hex = (g: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number) => {
    g.beginPath()
    for (let k = 0; k < 6; k++) {
      const a = rot - Math.PI / 2 + (k * Math.PI) / 3
      const px = x + Math.cos(a) * r
      const py = y + Math.sin(a) * r
      if (k === 0) g.moveTo(px, py)
      else g.lineTo(px, py)
    }
    g.closePath()
  }

  return {
    duration: 2.6,
    render(p, c) {
      const g = c.ctx
      const gather = range(p, 0.02, 0.4) // fios convergem no peito
      const grow = smoothstep(0.36, 0.9, p) // hex cresce
      const radius = grow * full
      const rot = c.reduced ? 0 : Math.sin(c.time * 1.3) * 0.05

      c.drawPrint(1 - range(p, 0.9, 1))

      // dentro do hex: traje colorido
      mask.clear()
      if (radius > 0) {
        const mw = mask.canvas.width
        mask.ctx.fillStyle = '#fff'
        hex(mask.ctx, cu * mw, cv * mw * 1.4, radius * mw, rot)
        mask.ctx.fill()
        c.drawRealMasked(mask)
      }

      // fios de magia do caos em espiral
      const wispFade = 1 - range(p, 0.34, 0.48)
      if (wispFade > 0) {
        const [x0, y0] = c.toScreen(cu, cv)
        g.save()
        g.globalAlpha = wispFade
        g.lineCap = 'round'
        g.lineJoin = 'round'
        for (const w of wisps) {
          const t = range(gather, w.delay, 1)
          if (t <= 0) continue
          // cada fio é um trecho da espiral que avança para o centro
          const head = t
          const tail = Math.max(0, t - 0.45)
          g.beginPath()
          for (let i = 0; i <= 24; i++) {
            const s = tail + ((head - tail) * i) / 24
            const rr = w.r * (1 - s) * c.unit
            const a = w.a + s * w.turns * Math.PI * 2 + (c.reduced ? 0 : c.time * 0.8)
            const px = x0 + Math.cos(a) * rr
            const py = y0 + Math.sin(a) * rr * 1.2
            if (i === 0) g.moveTo(px, py)
            else g.lineTo(px, py)
          }
          for (const [lw, color] of [
            [0.016, INK],
            [0.008, RED],
            [0.003, PINK],
          ] as const) {
            g.lineWidth = Math.max(1.5, c.unit * lw)
            g.strokeStyle = color
            g.stroke()
          }
        }
        g.restore()
      }
      if (p > 0.36 && p < 0.46) c.flash((0.46 - p) * 3, '#ff6b8a')

      // borda do hex: tinta, vermelho e um chiado de estática correndo
      const edge = 1 - range(p, 0.84, 0.98)
      if (radius > 0 && edge > 0) {
        const [x, y] = c.toScreen(cu, cv)
        const r = radius * c.unit
        g.save()
        g.globalAlpha = edge
        g.lineJoin = 'miter'
        for (const [lw, color] of [
          [0.024, INK],
          [0.012, RED],
          [0.004, PINK],
        ] as const) {
          g.lineWidth = Math.max(2, c.unit * lw)
          g.strokeStyle = color
          hex(g, x, y, r, rot)
          g.stroke()
        }
        // estática: tracinhos brancos deslizando sobre a borda
        g.setLineDash([c.unit * 0.012, c.unit * 0.05])
        g.lineDashOffset = c.reduced ? 0 : -c.time * c.unit * 0.4
        g.lineWidth = Math.max(1.5, c.unit * 0.006)
        g.strokeStyle = '#ffffff'
        hex(g, x, y, r, rot)
        g.stroke()
        g.setLineDash([])
        // eco interno do hex
        g.globalAlpha = edge * 0.6
        g.lineWidth = Math.max(1.5, c.unit * 0.005)
        g.strokeStyle = RED
        hex(g, x, y, r * 0.9, rot)
        g.stroke()
        g.restore()
      }

      const [sx, sy] = c.toScreen(Math.min(0.8, cu + 0.27), Math.max(0.1, cv - 0.16))
      sfx(c, 'VWOMM!', sx, sy, c.unit * 0.14, range(p, 0.36, 0.92), {
        rotate: -0.1,
        fill: PINK,
        burstFill: c.palette.accent,
        seed: 1010,
      })
    },
  }
}

export default scarlet
