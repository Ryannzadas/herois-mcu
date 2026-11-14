import { lerp, range, seeded, smoothstep } from '@/lib/utils'
import { INK, PAPER, sfx } from './comic'
import { crack, makePath, maskMapper, strokeAll, type Path } from './paths'
import type { EffectFactory } from './types'

/**
 * Hulk — a impressão incha em pulsos a partir do peito, a página treme e
 * rasga com rachaduras verdes; o traje colorido aparece pelos rasgos e
 * pedaços de papel voam. Acabamento de quadrinho: "RRAAAH!".
 */

type Shard = { u: number; v: number; vx: number; vy: number; spin: number; size: number; delay: number }

const hulk: EffectFactory = (c) => {
  const rand = seeded(4004)
  const [cu, cv] = c.anchors.chest
  const mask = c.createMask(0.25)
  const ink = c.createMask(0.5) // traço dos rasgos, recortado pelo corpo

  // rasgos: poucos e longos, quase verticais (o corpo "estoura" a página)
  const tears: Path[] = []
  for (let i = 0; i < 9; i++) {
    const up = i % 2 === 0
    const angle = (up ? -Math.PI / 2 : Math.PI / 2) + (rand() - 0.5) * 1.6
    tears.push(makePath(crack(rand, [cu + (rand() - 0.5) * 0.05, cv], angle, 0.9 + rand() * 0.5, 0.7)))
  }
  for (let i = 0; i < 12; i++) {
    const parent = tears[i % tears.length]
    const k = 2 + Math.floor(rand() * (parent.u.length - 3))
    tears.push(makePath(crack(rand, [parent.u[k], parent.v[k]], rand() * Math.PI * 2, 0.12 + rand() * 0.25, 1.2)))
  }

  // pedaços de papel que voam quando rasga
  const shards: Shard[] = Array.from({ length: 26 }, () => {
    const a = rand() * Math.PI * 2
    const speed = 0.5 + rand() * 0.9
    return {
      u: cu + (rand() - 0.5) * 0.25,
      v: cv + (rand() - 0.5) * 0.3,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 0.4,
      spin: (rand() - 0.5) * 12,
      size: 0.02 + rand() * 0.035,
      delay: rand() * 0.08,
    }
  })

  const GREEN = c.palette.accent

  return {
    duration: 2.6,
    render(p, c) {
      const g = c.ctx
      const [px, py] = c.toScreen(cu, cv)

      // 1) inchaço em pulsos (batimentos cada vez mais fortes)
      const swell = smoothstep(0, 0.42, p) * (1 - smoothstep(0.55, 0.9, p))
      const beat = c.reduced ? 0 : Math.max(0, Math.sin(p * Math.PI * 9)) ** 3
      const scale = 1 + swell * (0.05 + beat * 0.06)
      g.save()
      g.translate(px, py)
      g.scale(scale, scale * (1 + swell * 0.02))
      g.translate(-px, -py)
      c.drawPrint(1 - range(p, 0.75, 1))
      g.restore()
      c.shake(swell * (0.15 + beat * 0.35))

      // 2) rasgos: crescem rápido e alargam, revelando o traje
      const grow = smoothstep(0.38, 0.55, p)
      const widen = smoothstep(0.45, 0.97, p)
      if (grow > 0) {
        mask.clear()
        const m = mask.ctx
        m.strokeStyle = '#fff'
        m.lineCap = 'butt'
        m.lineJoin = 'miter'
        m.lineWidth = lerp(3, 1000, widen * widen) * mask.scale
        strokeAll(m, tears, grow, maskMapper(mask.scale))
        c.drawRealMasked(mask)

        // borda do rasgo: tinta preta + verde gama, só dentro do corpo
        const edge = 1 - smoothstep(0.6, 0.92, p)
        if (edge > 0) {
          ink.clear()
          const k = ink.ctx
          const map = maskMapper(ink.scale)
          k.lineCap = 'butt'
          k.lineJoin = 'miter'
          k.strokeStyle = INK
          k.lineWidth = 22 * ink.scale + (m.lineWidth / mask.scale) * ink.scale
          strokeAll(k, tears, grow, map)
          k.strokeStyle = GREEN
          k.lineWidth = 9 * ink.scale + (m.lineWidth / mask.scale) * ink.scale
          strokeAll(k, tears, grow, map)
          // o miolo do rasgo fica transparente: mostra o traje revelado por baixo
          k.globalCompositeOperation = 'destination-out'
          k.lineWidth = (m.lineWidth / mask.scale) * ink.scale
          strokeAll(k, tears, grow, map)
          k.globalCompositeOperation = 'source-over'
          c.clipToSilhouette(ink)
          c.drawFigureLayer(ink, edge)
        }

        // estouro: tremor forte no momento do rasgo
        const burst = 1 - range(p, 0.42, 0.62)
        if (p >= 0.42 && burst > 0) {
          c.shake(0.4 + burst * 0.6)
          c.flash(burst * 0.35, '#d9ffc8')
        }
      }

      // 3) pedaços de papel voando
      const fly = range(p, 0.42, 1)
      if (fly > 0 && fly < 1) {
        g.save()
        g.lineWidth = Math.max(1.5, c.unit * 0.004)
        g.strokeStyle = INK
        for (const s of shards) {
          const t = Math.max(0, fly - s.delay)
          if (t <= 0) continue
          const u = s.u + s.vx * t * 0.6
          const v = s.v + (s.vy * t + 1.2 * t * t) * 0.45 // gravidade puxa pra baixo
          const [x, y] = c.toScreen(u, v)
          const size = s.size * c.unit
          g.globalAlpha = 1 - t
          g.save()
          g.translate(x, y)
          g.rotate(s.spin * t)
          g.beginPath()
          g.moveTo(-size, -size * 0.6)
          g.lineTo(size * 0.8, -size)
          g.lineTo(size * 0.5, size * 0.7)
          g.lineTo(-size * 0.7, size * 0.4)
          g.closePath()
          g.fillStyle = PAPER
          g.fill()
          g.stroke()
          g.restore()
        }
        g.restore()
      }

      // 4) onomatopeia
      const [sx, sy] = c.toScreen(Math.min(0.75, cu + 0.2), Math.max(0.1, c.anchors.head[1] - 0.02))
      sfx(c, 'RRAAAH!', sx, sy, c.unit * 0.16, range(p, 0.4, 0.95), {
        rotate: -0.14,
        fill: GREEN,
        burstFill: c.palette.accent2,
        seed: 44,
      })
    },
  }
}

export default hulk
