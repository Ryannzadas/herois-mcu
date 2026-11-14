import { lerp, range, seeded, smoothstep } from '@/lib/utils'
import { INK, sfx, speedLines } from './comic'
import { bolt, crack, makePath, maskMapper, strokeAll, type Path } from './paths'
import type { EffectFactory } from './types'

/**
 * Thor — um raio desce do topo da página, atinge o peito e racha a impressão.
 * As rachaduras se alargam e o traje colorido aparece através delas.
 * Acabamento de quadrinho: raio com contorno de tinta, linhas de ação e "KRAKOOM!".
 */

const thor: EffectFactory = (c) => {
  const rand = seeded(1011)
  const impact = c.anchors.chest
  const mask = c.createMask(0.25)

  const main = makePath(bolt(rand, [impact[0] + 0.18, -0.9], impact, 0.45, 6))
  const forks = [0, 1, 2].map(() => {
    const start = Math.floor(main.u.length * (0.3 + rand() * 0.4))
    const from: [number, number] = [main.u[start], main.v[start]]
    return makePath(bolt(rand, from, [from[0] + (rand() - 0.5) * 0.6, from[1] + 0.2 + rand() * 0.2], 0.25, 4))
  })

  const cracks: Path[] = []
  const N = 13
  for (let i = 0; i < N; i++) {
    const angle = (i / N) * Math.PI * 2 + rand() * 0.4
    cracks.push(makePath(crack(rand, impact, angle, 0.7 + rand() * 0.6)))
  }
  // ramificações secundárias
  for (let i = 0; i < 16; i++) {
    const parent = cracks[i % N]
    const k = 2 + Math.floor(rand() * (parent.u.length - 3))
    cracks.push(makePath(crack(rand, [parent.u[k], parent.v[k]], rand() * Math.PI * 2, 0.15 + rand() * 0.3)))
  }

  return {
    duration: 2.6,
    render(p, c) {
      const g = c.ctx
      const toScreen = (u: number, v: number) => c.toScreen(u, v)

      // carga: a impressão tremula enquanto o céu "carrega"
      const charge = range(p, 0, 0.14)
      const flicker = charge < 1 && rand() < charge * 0.5 ? 0.45 : 1
      const [ix, iy] = c.toScreen(impact[0], impact[1])
      speedLines(c, ix, iy, Math.sin(range(p, 0.18, 0.5) * Math.PI), 5)
      c.drawPrint(flicker * (1 - smoothstep(0.7, 1, p)))

      // rachaduras abrindo e revelando o traje
      const grow = smoothstep(0.2, 0.55, p)
      const widen = smoothstep(0.3, 0.95, p)
      if (grow > 0) {
        mask.clear()
        const m = mask.ctx
        m.strokeStyle = '#fff'
        m.lineCap = 'round'
        m.lineJoin = 'round'
        m.lineWidth = lerp(1.5, 900, widen * widen) * mask.scale
        strokeAll(m, cracks, grow, maskMapper(mask.scale))
        c.drawRealMasked(mask)

        // rachaduras em traço de tinta com miolo elétrico
        const glow = 1 - smoothstep(0.55, 0.9, p)
        if (glow > 0) {
          g.save()
          g.lineCap = 'round'
          g.lineJoin = 'round'
          g.globalAlpha = glow
          g.strokeStyle = INK
          g.lineWidth = Math.max(4, c.unit * 0.012)
          strokeAll(g, cracks, grow, toScreen)
          g.strokeStyle = c.palette.accent2
          g.lineWidth = Math.max(1.5, c.unit * 0.004)
          strokeAll(g, cracks, grow, toScreen)
          g.restore()
        }
      }

      // raio
      const strike = range(p, 0.12, 0.2)
      const fade = 1 - range(p, 0.24, 0.42)
      if (strike > 0 && fade > 0) {
        g.save()
        g.lineCap = 'round'
        g.lineJoin = 'miter'
        const jitter = (u: number, v: number): [number, number] => toScreen(u + (rand() - 0.5) * 0.004, v)
        g.globalAlpha = fade
        // raio de quadrinho: contorno preto, corpo amarelo, miolo branco
        g.strokeStyle = INK
        g.lineWidth = c.unit * 0.034
        strokeAll(g, [main], strike, jitter)
        g.lineWidth = c.unit * 0.014
        strokeAll(g, forks, range(p, 0.16, 0.24), jitter)
        g.strokeStyle = c.palette.accent2
        g.lineWidth = c.unit * 0.02
        strokeAll(g, [main], strike, jitter)
        g.lineWidth = c.unit * 0.006
        strokeAll(g, forks, range(p, 0.16, 0.24), jitter)
        g.strokeStyle = '#ffffff'
        g.lineWidth = c.unit * 0.006
        strokeAll(g, [main], strike, jitter)
        g.restore()
      }

      // impacto: clarão e tremor
      const hit = 1 - range(p, 0.2, 0.36)
      if (p >= 0.2 && hit > 0) {
        c.flash(hit * 0.85, '#dff4ff')
        c.shake(hit)
      } else if (charge > 0 && charge < 1 && rand() < 0.15) {
        c.flash(0.12, c.palette.accent2)
      }

      const [sx, sy] = c.toScreen(0.5, Math.max(0.12, c.anchors.head[1] - 0.24))
      sfx(c, 'KRAKOOM!', sx, sy, c.unit * 0.17, range(p, 0.19, 0.82), {
        rotate: -0.1,
        fill: c.palette.accent2,
        burstFill: '#ffffff',
        seed: 9,
      })
    },
  }
}

export default thor
