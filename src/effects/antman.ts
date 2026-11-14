import { range, seeded, smoothstep } from '@/lib/utils'
import { INK, burst, sfx } from './comic'
import type { EffectContext, EffectFactory } from './types'

/**
 * Homem-Formiga — a impressão encolhe até virar um pontinho, deixando um
 * rastro de cópias e faíscas vermelhas de partículas Pym; do pontinho, o
 * traje colorido volta crescendo, passa um pouco do tamanho (quase Gigante)
 * e se acomoda. Acabamento de quadrinho: estouro no ponto mínimo e "ZWIP!".
 */

const MIN = 0.03
const FEET: [number, number] = [0.5, 0.97]
const RED = '#e8242c'

/** escala da figura em torno dos pés */
function scaled(c: EffectContext, s: number, draw: () => void) {
  const g = c.ctx
  const [fx, fy] = c.toScreen(FEET[0], FEET[1])
  g.save()
  g.translate(fx, fy)
  g.scale(s, s)
  g.translate(-fx, -fy)
  draw()
  g.restore()
}

const antman: EffectFactory = () => {
  const rand = seeded(1315)
  const sparks = Array.from({ length: 40 }, () => ({
    a: rand() * Math.PI * 2,
    d: 0.05 + rand() * 0.3,
    r: 0.004 + rand() * 0.008,
  }))

  return {
    duration: 2.4,
    render(p, c) {
      const g = c.ctx
      const shrink = smoothstep(0.04, 0.4, p)
      const grow = range(p, 0.5, 0.86)

      if (p < 0.45) {
        // rastro: cópias do tamanho anterior, cada vez mais fracas
        for (const lag of [0.18, 0.12, 0.06]) {
          const s = 1 - (1 - MIN) * smoothstep(0.04, 0.4, p - lag)
          if (s < 0.999) scaled(c, s, () => c.drawPrint(0.18))
        }
        scaled(c, 1 - (1 - MIN) * shrink, () => c.drawPrint())
      } else if (grow > 0) {
        // cresce com um passo a mais (quase Gigante) e volta ao tamanho
        const over = Math.sin(Math.min(1, grow * 1.25) * Math.PI) * 0.12 * (grow < 0.8 ? 1 : 1 - range(grow, 0.8, 1))
        const s = MIN + (1 - MIN) * smoothstep(0, 0.8, grow) + over
        scaled(c, s, () => c.drawReal())
      }

      // faíscas de partículas Pym em volta da figura enquanto ela muda de tamanho
      const spark = range(p, 0.06, 0.2) * (1 - range(p, 0.82, 0.95))
      if (spark > 0) {
        const size = p < 0.45 ? 1 - (1 - MIN) * shrink : MIN + (1 - MIN) * smoothstep(0, 0.8, grow)
        const [fx, fy] = c.toScreen(FEET[0], FEET[1])
        const cy = fy - size * c.unit * 0.6
        g.save()
        g.globalAlpha = spark
        for (const s of sparks) {
          const a = s.a + (c.reduced ? 0 : c.time * 2)
          const d = (s.d + size * 0.35) * c.unit
          const x = fx + Math.cos(a) * d
          const y = cy + Math.sin(a) * d * 1.3
          g.fillStyle = INK
          g.beginPath()
          g.arc(x, y, s.r * c.unit + 1.5, 0, Math.PI * 2)
          g.fill()
          g.fillStyle = RED
          g.beginPath()
          g.arc(x, y, s.r * c.unit, 0, Math.PI * 2)
          g.fill()
        }
        g.restore()
      }

      // estouro no ponto mínimo
      const pop = range(p, 0.38, 0.56)
      if (pop > 0 && pop < 1) {
        const [fx, fy] = c.toScreen(FEET[0], FEET[1])
        const r = c.unit * (0.04 + Math.sin(pop * Math.PI) * 0.12)
        g.save()
        g.globalAlpha = 1 - range(pop, 0.6, 1)
        burst(g, fx, fy - c.unit * 0.03, r, { spikes: 10, seed: 13, fill: RED, stroke: INK, line: Math.max(3, c.unit * 0.01) })
        burst(g, fx, fy - c.unit * 0.03, r * 0.5, { spikes: 10, seed: 14, fill: '#fff4e0' })
        g.restore()
        if (pop < 0.2) c.shake(0.4)
      }

      const [sx, sy] = c.toScreen(0.78, Math.max(0.1, c.anchors.head[1]))
      sfx(c, 'ZWIP!', sx, sy, c.unit * 0.14, range(p, 0.42, 0.95), {
        rotate: -0.12,
        fill: c.palette.accent2,
        burstFill: c.palette.accent,
        seed: 1315,
      })
    },
  }
}

export default antman
