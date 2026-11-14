import { range, seeded, smoothstep } from '@/lib/utils'
import { INK, sfx } from './comic'
import type { EffectFactory } from './types'

/**
 * Cavaleiro da Lua — uma lua cheia nasce atrás da figura e atravessa as
 * fases. A linha entre luz e sombra (o terminador) varre o corpo como numa
 * fase da lua: o lado iluminado já está no traje colorido. No fim, três
 * crescentes, as armas dele, cruzam o quadro.
 * Acabamento de quadrinho: crateras com contorno de tinta e "SHHK!".
 */

const MOON = '#f3ecd6'
const NIGHT = '#1d2742'

/**
 * Região iluminada de uma fase k (0 = lua nova, 1 = cheia), para um disco de
 * centro (cx, cy) e raio r: tudo à esquerda da curva x = cx + (2k - 1)·meia-largura(y).
 */
function litPath(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, k: number) {
  const steps = 48
  g.beginPath()
  g.moveTo(cx - r * 3, cy - r)
  for (let i = 0; i <= steps; i++) {
    const y = cy - r + (i / steps) * r * 2
    const half = r * Math.sqrt(Math.max(0, 1 - ((y - cy) / r) ** 2))
    g.lineTo(cx + (2 * k - 1) * half, y)
  }
  g.lineTo(cx - r * 3, cy + r)
  g.closePath()
}

const moonknight: EffectFactory = (c) => {
  const rand = seeded(2022)
  const mask = c.createMask(0.25)
  const craters = Array.from({ length: 9 }, () => ({ a: rand() * Math.PI * 2, d: rand() * 0.75, r: 0.05 + rand() * 0.1 }))
  const darts = [0, 1, 2].map((i) => ({ t: 0.6 + i * 0.05, v: 0.25 + i * 0.22, spin: 14 + i * 3 }))

  return {
    duration: 3,
    render(p, c) {
      const g = c.ctx
      const u1 = c.unit
      const line = Math.max(1.5, u1 * 0.004)
      const rise = smoothstep(0.02, 0.24, p)
      const phase = smoothstep(0.24, 0.74, p)
      const moonA = rise * (1 - range(p, 0.84, 0.96))

      // a lua atrás da figura: nasce de baixo e mostra a mesma fase do corpo
      if (moonA > 0) {
        const [cx, cy0] = c.toScreen(0.5, c.anchors.head[1] + 0.12)
        const cy = cy0 + (1 - rise) * u1 * 0.4
        const r = u1 * 0.42
        g.save()
        g.globalAlpha = moonA
        g.beginPath()
        g.arc(cx, cy, r, 0, Math.PI * 2)
        g.fillStyle = NIGHT
        g.fill()
        g.save()
        g.clip()
        litPath(g, cx, cy, r, phase)
        g.fillStyle = MOON
        g.fill()
        for (const k of craters) {
          g.beginPath()
          g.arc(cx + Math.cos(k.a) * k.d * r, cy + Math.sin(k.a) * k.d * r, k.r * r, 0, Math.PI * 2)
          g.fillStyle = 'rgba(29, 39, 66, 0.18)'
          g.fill()
        }
        g.restore()
        g.beginPath()
        g.arc(cx, cy, r, 0, Math.PI * 2)
        g.lineWidth = Math.max(3, u1 * 0.009)
        g.strokeStyle = INK
        g.stroke()
        g.restore()
      }

      c.drawPrint(1 - range(p, 0.86, 1))

      // terminador varrendo o corpo: o lado iluminado mostra o traje
      if (phase > 0) {
        mask.clear()
        const m = mask.ctx
        const mw = mask.canvas.width
        m.fillStyle = '#fff'
        litPath(m, mw * 0.5, mw * 0.7, mw * 0.95, phase)
        m.fill()
        c.drawRealMasked(mask)
      }
      c.drawReal(range(p, 0.76, 0.9))

      // linha do terminador sobre a figura, em tinta
      const edge = Math.sin(phase * Math.PI)
      if (edge > 0.05) {
        g.save()
        g.globalAlpha = edge * 0.9
        const [cx, cy] = c.toScreen(0.5, 0.5)
        const r = u1 * 0.95
        g.beginPath()
        for (let i = 0; i <= 48; i++) {
          const y = cy - r * 0.7 + (i / 48) * r * 1.4
          const half = r * Math.sqrt(Math.max(0, 1 - ((y - cy) / r) ** 2))
          const x = cx + (2 * phase - 1) * half
          if (i === 0) g.moveTo(x, y)
          else g.lineTo(x, y)
        }
        g.setLineDash([u1 * 0.02, u1 * 0.015])
        g.lineWidth = Math.max(2, u1 * 0.006)
        g.strokeStyle = MOON
        g.stroke()
        g.restore()
      }

      // crescentes cruzando o quadro da direita para a esquerda
      for (const d of darts) {
        const k = range(p, d.t, d.t + 0.14)
        if (k <= 0 || k >= 1) continue
        const [x, y] = c.toScreen(1.3 - k * 1.6, d.v + Math.sin(k * Math.PI) * -0.05)
        g.save()
        g.translate(x, y)
        g.rotate(k * d.spin)
        const s = u1 * 0.075
        g.beginPath()
        g.arc(0, 0, s, Math.PI * 0.15, Math.PI * 1.85)
        g.arc(s * 0.45, 0, s * 0.72, Math.PI * 1.7, Math.PI * 0.3, true)
        g.closePath()
        g.fillStyle = MOON
        g.fill()
        g.lineWidth = line
        g.strokeStyle = INK
        g.stroke()
        g.restore()
        // rastro
        g.save()
        g.globalAlpha = 0.5
        g.lineWidth = Math.max(2, u1 * 0.005)
        g.strokeStyle = MOON
        g.beginPath()
        g.moveTo(x, y)
        g.lineTo(x + u1 * 0.18, y)
        g.stroke()
        g.restore()
      }

      const [sx, sy] = c.toScreen(0.95, Math.max(0.1, c.anchors.head[1] + 0.03))
      sfx(c, 'SHHK!', sx, sy, u1 * 0.14, range(p, 0.6, 0.98), {
        rotate: 0.1,
        fill: MOON,
        burstFill: c.palette.accent,
        seed: 2022,
      })
    },
  }
}

export default moonknight
