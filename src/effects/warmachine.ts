import { clamp, range, seeded, smoothstep } from '@/lib/utils'
import { INK, burst, sfx } from './comic'
import type { EffectFactory } from './types'

/**
 * Máquina de Combate — a metralhadora do ombro varre a figura em rajadas,
 * linha por linha. Cada tiro deixa um traçante, um clarão no impacto e um
 * furo que já mostra o traje colorido; cápsulas de latão caem do cano. No
 * fim, uma salva de mísseis sobe, faz a curva e explode em volta do corpo.
 * Acabamento de quadrinho: "BRRRT!" na rajada e "KA-BOOM!" nos mísseis.
 */

const YELLOW = '#ffd23f'
const BRASS = '#d9a441'
const ROWS = 14
const PER_ROW = 9
const GUN_END = 0.6
const MISSILES = 6

const warmachine: EffectFactory = (c) => {
  const rand = seeded(2010)
  const mask = c.createMask(0.25)

  // impactos em zigue-zague (linha da esquerda para a direita, a próxima volta)
  const shots: { u: number; v: number; t: number }[] = []
  const total = ROWS * PER_ROW
  for (let r = 0; r < ROWS; r++) {
    for (let k = 0; k < PER_ROW; k++) {
      const col = r % 2 === 0 ? k : PER_ROW - 1 - k
      const i = r * PER_ROW + k
      shots.push({
        u: 0.06 + (col / (PER_ROW - 1)) * 0.88 + (rand() - 0.5) * 0.06,
        v: 0.02 + (r / (ROWS - 1)) * 0.96 + (rand() - 0.5) * 0.04,
        t: 0.08 + (i / total) * (GUN_END - 0.1),
      })
    }
  }

  // cápsulas: saem do cano, sobem um pouco e caem girando
  const shells = Array.from({ length: 26 }, (_, i) => ({
    t: 0.08 + (i / 26) * (GUN_END - 0.1),
    vx: 0.08 + rand() * 0.12,
    vy: -0.18 - rand() * 0.12,
    spin: 6 + rand() * 10,
  }))

  // mísseis: sobem do ombro, fazem a curva e caem num ponto em volta da figura
  const missiles = Array.from({ length: MISSILES }, (_, i) => {
    const a = -Math.PI * 0.95 + (i / (MISSILES - 1)) * Math.PI * 0.9
    return {
      t0: 0.6 + i * 0.03,
      tu: 0.5 + Math.cos(a) * 0.52,
      tv: 0.55 + Math.sin(a) * -0.42 + 0.1,
      lift: 0.12 + rand() * 0.15,
    }
  })

  const GUN: [number, number] = [-0.3, 0.12]

  return {
    duration: 3,
    render(p, c) {
      const g = c.ctx
      const u1 = c.unit
      const line = Math.max(1.5, u1 * 0.004)
      const [gx, gy] = c.toScreen(...GUN)

      c.drawPrint(1 - range(p, 0.86, 1))

      // furos que revelam o traje
      mask.clear()
      const m = mask.ctx
      const mw = mask.canvas.width
      m.fillStyle = '#fff'
      for (const s of shots) {
        const k = range(p, s.t, s.t + 0.05)
        if (k <= 0) continue
        m.beginPath()
        m.arc(s.u * mw, s.v * mw * 1.4, (0.025 + 0.055 * smoothstep(0, 1, k)) * mw, 0, Math.PI * 2)
        m.fill()
      }
      c.drawRealMasked(mask)
      c.drawReal(range(p, 0.74, 0.9))

      // traçantes e clarões dos impactos recentes
      for (const s of shots) {
        const age = p - s.t
        if (age < 0 || age > 0.03) continue
        const k = age / 0.03
        const [x, y] = c.toScreen(s.u, s.v)
        g.save()
        g.globalAlpha = 1 - k
        g.lineCap = 'round'
        g.beginPath()
        g.moveTo(gx + (x - gx) * clamp(k * 2 - 0.4), gy + (y - gy) * clamp(k * 2 - 0.4))
        g.lineTo(x, y)
        g.lineWidth = Math.max(5, u1 * 0.013)
        g.strokeStyle = INK
        g.stroke()
        g.lineWidth = Math.max(2.5, u1 * 0.006)
        g.strokeStyle = YELLOW
        g.stroke()
        burst(g, x, y, u1 * 0.045 * (1 - k * 0.5), { spikes: 8, inner: 0.45, seed: Math.round(s.u * 100), fill: YELLOW, stroke: INK, line })
        g.restore()
      }

      // cano: clarão na boca enquanto a rajada dura, cápsulas caindo
      const firing = p > 0.07 && p < GUN_END
      if (firing) {
        const flick = c.reduced ? 1 : 0.75 + Math.abs(Math.sin(c.time * 60)) * 0.35
        burst(g, gx, gy, u1 * 0.09 * flick, { spikes: 10, inner: 0.4, seed: 3, fill: YELLOW, stroke: INK, line })
        burst(g, gx, gy, u1 * 0.04 * flick, { spikes: 10, inner: 0.5, seed: 4, fill: '#fff8e0' })
        c.shake(0.12)
      }
      for (const s of shells) {
        const age = (p - s.t) * 3 // segundos aproximados
        if (age < 0 || age > 0.9) continue
        const x = gx + s.vx * age * u1 * 3
        const y = gy + (s.vy * age + 1.6 * age * age) * u1
        g.save()
        g.globalAlpha = 1 - range(age, 0.6, 0.9)
        g.translate(x, y)
        g.rotate(age * s.spin)
        g.fillStyle = BRASS
        g.strokeStyle = INK
        g.lineWidth = Math.max(1, line * 0.7)
        g.beginPath()
        g.rect(-u1 * 0.009, -u1 * 0.004, u1 * 0.018, u1 * 0.008)
        g.fill()
        g.stroke()
        g.restore()
      }

      // salva de mísseis
      for (const ms of missiles) {
        const fly = range(p, ms.t0, ms.t0 + 0.14)
        const boomK = range(p, ms.t0 + 0.14, ms.t0 + 0.26)
        if (fly > 0 && fly < 1) {
          // curva de Bézier: ombro -> alto -> alvo
          const [ax, ay] = [gx, gy]
          const [cx2, cy2] = c.toScreen((GUN[0] + ms.tu) / 2, -ms.lift)
          const [bx, by] = c.toScreen(ms.tu, ms.tv)
          const at = (t: number): [number, number] => [
            (1 - t) * (1 - t) * ax + 2 * (1 - t) * t * cx2 + t * t * bx,
            (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * cy2 + t * t * by,
          ]
          const [x, y] = at(fly)
          const [px, py] = at(Math.max(0, fly - 0.04))
          // rastro de fumaça
          g.save()
          g.lineCap = 'round'
          g.strokeStyle = 'rgba(110,110,110,0.6)'
          g.lineWidth = u1 * 0.024
          g.beginPath()
          for (let k = 0; k <= 8; k++) {
            const [sx, sy] = at(Math.max(0, fly - 0.3 + (k / 8) * 0.3))
            if (k === 0) g.moveTo(sx, sy)
            else g.lineTo(sx, sy)
          }
          g.stroke()
          // corpo do míssil
          g.translate(x, y)
          g.rotate(Math.atan2(y - py, x - px))
          g.scale(1.7, 1.7)
          g.fillStyle = '#e8e4da'
          g.strokeStyle = INK
          g.lineWidth = line
          g.beginPath()
          g.moveTo(u1 * 0.03, 0)
          g.lineTo(u1 * 0.012, -u1 * 0.008)
          g.lineTo(-u1 * 0.025, -u1 * 0.008)
          g.lineTo(-u1 * 0.025, u1 * 0.008)
          g.lineTo(u1 * 0.012, u1 * 0.008)
          g.closePath()
          g.fill()
          g.stroke()
          burst(g, -u1 * 0.03, 0, u1 * 0.014, { spikes: 6, inner: 0.5, seed: 9, fill: YELLOW })
          g.restore()
        }
        if (boomK > 0 && boomK < 1) {
          const [bx, by] = c.toScreen(ms.tu, ms.tv)
          const r = u1 * (0.07 + Math.sin(boomK * Math.PI) * 0.16)
          g.save()
          g.globalAlpha = 1 - range(boomK, 0.55, 1)
          burst(g, bx, by, r, { spikes: 12, seed: ms.t0 * 100, fill: c.palette.accent2, stroke: INK, line: Math.max(3, u1 * 0.01) })
          burst(g, bx, by, r * 0.55, { spikes: 12, seed: ms.t0 * 100 + 1, fill: '#fff4d0' })
          g.restore()
          if (boomK < 0.2) c.shake(0.6)
        }
      }

      const [hx, hy] = c.toScreen(0.8, Math.max(0.1, c.anchors.head[1]))
      sfx(c, 'BRRRT!', hx, hy, u1 * 0.12, range(p, 0.08, GUN_END + 0.04), {
        rotate: -0.08,
        fill: YELLOW,
        burstFill: c.palette.accent,
        seed: 2010,
      })
      const [kx, ky] = c.toScreen(0.5, Math.min(0.9, c.anchors.chest[1] + 0.3))
      sfx(c, 'KA-BOOM!', kx, ky, u1 * 0.15, range(p, 0.72, 1), {
        rotate: 0.1,
        fill: YELLOW,
        burstFill: c.palette.accent2,
        seed: 2011,
      })
    },
  }
}

export default warmachine
