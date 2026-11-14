import { range, seeded, smoothstep } from '@/lib/utils'
import { sfx } from './comic'
import type { EffectContext, EffectFactory } from './types'

/**
 * Loki — ilusões. Duas cópias da impressão se desdobram para os lados com
 * um brilho verde; as três figuras se embaralham como num jogo de copinhos.
 * Quando param, as cópias falsas se desfazem em faíscas verdes e douradas,
 * e a do meio, a verdadeira, aparece em cores.
 * Acabamento de quadrinho: contorno verde de ilusão e "SURPRESA!".
 */

const GREEN = '#3fd16b'
const GOLD = '#d9a520'
const SLOT = 0.62
/** ordem dos lugares (-1, 0, 1) de cada figura em cada etapa; a figura 0 é a verdadeira */
const STAGES: number[][] = [
  [0, 0, 0],
  [0, -1, 1],
  [1, -1, 0],
  [-1, 0, 1],
  [0, 1, -1],
]

/** desenha a figura deslocada `du` (em u) e levantada `lift` (em v) */
function shifted(c: EffectContext, du: number, lift: number, draw: () => void) {
  const g = c.ctx
  const [x0, y0] = c.toScreen(0, 0)
  const [x1, y1] = c.toScreen(du, -lift)
  g.save()
  g.translate(x1 - x0, y1 - y0)
  draw()
  g.restore()
}

const loki: EffectFactory = (c) => {
  const rand = seeded(1111)
  // brilho verde no formato da silhueta, reaproveitado em todas as cópias
  const glow = c.createMask(0.5)
  let glowReady = false

  // faíscas: pontos da silhueta que voam quando a ilusão se desfaz
  const pts = c.points
  const sparks = Array.from({ length: 140 }, () => {
    const i = Math.floor(rand() * (pts.length / 2)) * 2
    return { u: pts[i] ?? 0.5, v: pts[i + 1] ?? 0.5, vx: (rand() - 0.5) * 0.3, vy: -0.2 - rand() * 0.4, gold: rand() < 0.35 }
  })

  /** posição (lugar, em u) da figura `who` no progresso `p` */
  const slotAt = (who: number, p: number): [number, number] => {
    const split = smoothstep(0.04, 0.22, p)
    if (p < 0.26) return [STAGES[1][who] * SLOT * split, 0]
    const shuffle = range(p, 0.26, 0.6) * (STAGES.length - 2)
    const s = Math.min(STAGES.length - 3, Math.floor(shuffle))
    const k = smoothstep(0, 1, shuffle - s)
    const from = STAGES[s + 1][who]
    const to = STAGES[s + 2][who]
    // as figuras que trocam de lugar sobem um pouco no caminho (a da frente desce)
    const hop = from !== to ? Math.sin(k * Math.PI) * 0.05 * (who % 2 ? 1 : -1) : 0
    return [(from + (to - from) * k) * SLOT, hop]
  }

  return {
    duration: 3,
    render(p, c) {
      const g = c.ctx
      const u1 = c.unit
      if (!glowReady) {
        glow.clear()
        glow.ctx.fillStyle = GREEN
        glow.ctx.fillRect(0, 0, glow.canvas.width, glow.canvas.height)
        c.clipToSilhouette(glow)
        glowReady = true
      }
      const fakeFade = 1 - range(p, 0.64, 0.74)
      const flicker = c.reduced ? 1 : 0.85 + Math.sin(c.time * 40) * 0.15
      const realK = range(p, 0.66, 0.82)

      // cópias falsas (atrás), depois a verdadeira (na frente)
      for (const who of [1, 2, 0]) {
        const [du, lift] = slotAt(who, p)
        const fake = who !== 0
        if (fake && fakeFade <= 0) continue
        shifted(c, du, lift, () => {
          g.save()
          if (fake) g.globalAlpha = fakeFade * (p > 0.6 ? flicker : 1)
          if (fake || realK < 1) c.drawPrint(fake ? 1 : 1 - realK)
          if (!fake && realK > 0) c.drawReal(realK)
          // brilho verde de ilusão: forte nas cópias, leve na verdadeira enquanto embaralha
          const glowA = fake ? 0.28 : 0.12 * (1 - realK) * smoothstep(0.04, 0.2, p)
          if (glowA > 0) c.drawFigureLayer(glow, glowA)
          g.restore()
        })
      }

      // as falsas se desfazem em faíscas
      const burstK = range(p, 0.62, 0.9)
      if (burstK > 0 && burstK < 1) {
        g.save()
        g.globalAlpha = 1 - range(burstK, 0.6, 1)
        for (const who of [1, 2]) {
          const [du] = slotAt(who, 0.6)
          for (const s of sparks) {
            const u = s.u + du + s.vx * burstK
            const v = s.v + s.vy * burstK + burstK * burstK * 0.1
            const [x, y] = c.toScreen(u, v)
            const r = u1 * 0.006 * (1 - burstK * 0.5)
            g.fillStyle = s.gold ? GOLD : GREEN
            g.beginPath()
            g.moveTo(x, y - r * 2)
            g.lineTo(x + r * 0.6, y)
            g.lineTo(x, y + r * 2)
            g.lineTo(x - r * 0.6, y)
            g.closePath()
            g.fill()
          }
        }
        g.restore()
      }

      const [sx, sy] = c.toScreen(1.08, Math.max(0.1, c.anchors.head[1] + 0.02))
      sfx(c, 'SURPRESA!', sx, sy, u1 * 0.13, range(p, 0.64, 0.99), {
        rotate: -0.08,
        fill: GOLD,
        burstFill: c.palette.accent,
        seed: 1111,
      })
    },
  }
}

export default loki
