import { range, seeded, smoothstep } from '@/lib/utils'
import { INK, burst, sfx, speedLines } from './comic'
import type { EffectFactory } from './types'

/**
 * Capitã Marvel — fogo fotônico sobe dos pés à cabeça por dentro da
 * silhueta; por onde ele passa fica o traje colorido. No topo, a energia
 * estoura numa estrela no peito (modo binário). Acabamento de quadrinho:
 * labaredas com contorno de tinta, linhas de ação e "SHOOM!".
 */

const TONGUES = 22
const ORANGE = '#ff8a1c'
const YELLOW = '#ffe14d'
const WHITE = '#fffbe8'

const marvel: EffectFactory = (c) => {
  const rand = seeded(1995)
  const [cu, cv] = c.anchors.chest
  const mask = c.createMask(0.25)
  const fire = c.createMask(0.5)
  const tongues = Array.from({ length: TONGUES }, (_, i) => ({
    u: (i + rand() * 0.8) / TONGUES,
    h: 0.05 + rand() * 0.07, // altura da labareda, em v
    w: 0.025 + rand() * 0.02,
    speed: 6 + rand() * 6,
    phase: rand() * Math.PI * 2,
  }))

  /** linha do fogo (v) na coluna u: sobe com o tempo e ondula */
  const frontAt = (u: number, rise: number, t: number) => 1.08 - rise * 1.25 + Math.sin(u * 13 + t * 5) * 0.015

  return {
    duration: 2.5,
    render(p, c) {
      const g = c.ctx
      const rise = smoothstep(0.08, 0.72, p)
      const t = c.reduced ? 0 : c.time

      c.drawPrint(1 - range(p, 0.86, 1))

      // abaixo da linha do fogo: traje colorido
      mask.clear()
      const mw = mask.canvas.width
      const mh = mask.canvas.height
      const m = mask.ctx
      m.fillStyle = '#fff'
      m.beginPath()
      m.moveTo(0, mh)
      for (let i = 0; i <= 40; i++) {
        const u = i / 40
        m.lineTo(u * mw, frontAt(u, rise, t) * mh)
      }
      m.lineTo(mw, mh)
      m.closePath()
      m.fill()
      c.drawRealMasked(mask)
      c.drawReal(range(p, 0.78, 0.9))

      // labaredas na linha do fogo, só por dentro do corpo
      const flame = range(p, 0.04, 0.12) * (1 - range(p, 0.7, 0.82))
      if (flame > 0) {
        fire.clear()
        const f = fire.ctx
        const fw = fire.canvas.width
        const fh = fire.canvas.height
        for (const tg of tongues) {
          const base = frontAt(tg.u, rise, t)
          const flick = 0.75 + Math.sin(t * tg.speed + tg.phase) * 0.25
          const top = base - tg.h * flick * 1.4
          const x = tg.u * fw
          const half = tg.w * fw
          for (const [color, k, line] of [
            [ORANGE, 1, true],
            [YELLOW, 0.6, false],
            [WHITE, 0.3, false],
          ] as const) {
            const yTop = (base - (base - top) * (0.4 + k * 0.6)) * fh
            f.beginPath()
            f.moveTo(x - half * k, base * fh + half * 0.4)
            f.quadraticCurveTo(x - half * k * 0.9, (base - tg.h * 0.4) * fh, x, yTop)
            f.quadraticCurveTo(x + half * k * 0.9, (base - tg.h * 0.4) * fh, x + half * k, base * fh + half * 0.4)
            f.closePath()
            f.fillStyle = color
            f.fill()
            if (line) {
              f.lineWidth = Math.max(2, fw * 0.006)
              f.strokeStyle = INK
              f.stroke()
            }
          }
        }
        c.clipToSilhouette(fire)
        c.drawFigureLayer(fire, flame)
      }

      // modo binário: estrela de energia estoura no peito
      const blast = range(p, 0.68, 0.98)
      if (blast > 0 && blast < 1) {
        const [x, y] = c.toScreen(cu, cv)
        speedLines(c, x, y, (1 - blast) * 0.9, 1995)
        g.save()
        g.globalAlpha = 1 - range(blast, 0.5, 1)
        const r = c.unit * (0.08 + blast * 0.5)
        burst(g, x, y, r, { spikes: 8, inner: 0.38, seed: 3, fill: YELLOW, stroke: INK, line: Math.max(3, c.unit * 0.012) })
        burst(g, x, y, r * 0.55, { spikes: 8, inner: 0.4, seed: 4, fill: WHITE })
        g.restore()
        if (blast < 0.15) c.shake(0.7)
      }
      if (p > 0.68 && p < 0.78) c.flash((0.78 - p) * 3.5, '#ffd76b')

      const [sx, sy] = c.toScreen(Math.min(0.8, cu + 0.28), Math.max(0.1, cv - 0.15))
      sfx(c, 'SHOOM!', sx, sy, c.unit * 0.14, range(p, 0.66, 1), {
        rotate: -0.12,
        fill: YELLOW,
        burstFill: c.palette.accent,
        seed: 1995,
      })
    },
  }
}

export default marvel
