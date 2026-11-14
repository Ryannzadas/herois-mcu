import { range, seeded, smoothstep } from '@/lib/utils'
import { sfx, speedLines } from './comic'
import type { EffectFactory } from './types'

/**
 * Homem de Ferro — nanopartículas saem do reator no peito e cobrem o corpo.
 * Cada partícula voa do peito até um ponto da silhueta; ao chegar, "carimba"
 * a máscara que revela o traje colorido. Acabamento de quadrinho: linhas de
 * ação convergindo para o reator e um "SHHRAK!" quando a armadura fecha.
 */

const COUNT = 1400
const FLIGHT = 0.22 // fração do progresso que cada partícula leva voando

const ironman: EffectFactory = (c) => {
  const rand = seeded(3000)
  const [cu, cv] = c.anchors.chest
  const total = c.points.length / 2
  const mask = c.createMask(0.25)

  // escolhe partículas e calcula atraso pela distância ao peito
  const tu = new Float32Array(COUNT)
  const tv = new Float32Array(COUNT)
  const delay = new Float32Array(COUNT)
  const bend = new Float32Array(COUNT)
  let maxD = 0
  for (let i = 0; i < COUNT; i++) {
    const k = Math.floor(rand() * total)
    tu[i] = c.points[k * 2]
    tv[i] = c.points[k * 2 + 1] * 1.4 // espaço isotrópico (figura é 1:1.4)
    delay[i] = Math.hypot(tu[i] - cu, tv[i] - cv * 1.4)
    if (delay[i] > maxD) maxD = delay[i]
    bend[i] = (rand() - 0.5) * 0.35
  }
  for (let i = 0; i < COUNT; i++) {
    delay[i] = 0.12 + (delay[i] / maxD) * 0.56 + rand() * 0.06
    tv[i] /= 1.4
  }

  return {
    duration: 2.8,
    render(p, c) {
      const g = c.ctx
      const [rx, ry] = c.toScreen(cu, cv)
      speedLines(c, rx, ry, Math.sin(range(p, 0.02, 0.45) * Math.PI) * 0.9, 11)
      c.drawPrint(1 - smoothstep(0.55, 0.95, p))

      // --- máscara de revelação ---
      mask.clear()
      const m = mask.ctx
      const ms = mask.scale * 1000
      m.fillStyle = '#fff'
      m.beginPath()
      for (let i = 0; i < COUNT; i++) {
        const t = (p - delay[i]) / FLIGHT
        if (t < 1) continue
        const r = Math.min(1, (t - 1) * 3) * 0.032 * ms
        m.moveTo(tu[i] * ms + r, tv[i] * 1400 * mask.scale)
        m.arc(tu[i] * ms, tv[i] * 1400 * mask.scale, r, 0, Math.PI * 2)
      }
      m.fill()
      const cover = range(p, 0.85, 1)
      if (cover > 0) {
        m.globalAlpha = cover
        m.fillRect(0, 0, mask.canvas.width, mask.canvas.height)
        m.globalAlpha = 1
      }
      c.drawRealMasked(mask)

      // --- reator Arc ---
      const pulse = smoothstep(0, 0.1, p) * (1 - smoothstep(0.75, 1, p))
      if (pulse > 0) {
        const rr = c.unit * (0.07 + 0.03 * Math.sin(c.time * 22))
        const grad = g.createRadialGradient(rx, ry, 0, rx, ry, rr * 3)
        grad.addColorStop(0, 'rgba(255,255,255,0.95)')
        grad.addColorStop(0.25, 'rgba(140,240,255,0.7)')
        grad.addColorStop(1, 'rgba(94,231,255,0)')
        g.save()
        g.globalCompositeOperation = 'lighter'
        g.globalAlpha = pulse
        g.fillStyle = grad
        g.beginPath()
        g.arc(rx, ry, rr * 3, 0, Math.PI * 2)
        g.fill()
        g.restore()
      }

      // --- partículas em voo ---
      g.save()
            const size = Math.max(1.5, c.unit * 0.004)
      for (let pass = 0; pass < 2; pass++) {
        g.fillStyle = pass === 0 ? c.palette.accent : c.palette.accent2
        g.beginPath()
        for (let i = pass; i < COUNT; i += 2) {
          const t = (p - delay[i]) / FLIGHT
          if (t <= 0 || t >= 1.15) continue
          const e = t >= 1 ? 1 : 1 - Math.pow(1 - t, 3)
          // curva de Bézier quadrática com desvio lateral
          const mu = (cu + tu[i]) / 2 + bend[i]
          const mv = (cv + tv[i]) / 2 - Math.abs(bend[i]) * 0.3
          const a = 1 - e
          const u = a * a * cu + 2 * a * e * mu + e * e * tu[i]
          const v = a * a * cv + 2 * a * e * mv + e * e * tv[i]
          const [x, y] = c.toScreen(u, v)
          const s = t >= 1 ? size * 2.2 : size
          g.rect(x - s / 2, y - s / 2, s, s)
        }
        g.fill()
      }
      g.restore()

      // onomatopeia quando a armadura fecha
      const [sx, sy] = c.toScreen(0.8, c.anchors.head[1] + 0.12)
      sfx(c, 'SHHRAK!', sx, sy, c.unit * 0.14, range(p, 0.55, 1), {
        rotate: -0.16,
        fill: c.palette.accent2,
        burstFill: c.palette.accent,
        seed: 21,
      })
    },
  }
}

export default ironman
