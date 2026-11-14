import { range, seeded, smoothstep } from '@/lib/utils'
import { INK, PAPER, sfx } from './comic'
import type { EffectContext, EffectFactory } from './types'

/**
 * Homem-Aranha — fios de teia disparam do peito, os anéis da teia se tecem
 * por cima da impressão e, num puxão, a teia arranca a camada impressa para
 * fora da página (como uma folha descolando), revelando o traje colorido
 * por baixo. Acabamento de quadrinho: "THWIP!".
 */

const SPOKES = 14
const RINGS = 7

const spider: EffectFactory = (c) => {
  const rand = seeded(7007)
  const [cu, cv] = c.anchors.chest
  // raios com pequenas variações de ângulo e comprimento
  const spokes = Array.from({ length: SPOKES }, (_, i) => ({
    a: (i / SPOKES) * Math.PI * 2 + (rand() - 0.5) * 0.18,
    len: 0.95 + rand() * 0.35,
  }))

  /** ponto a uma distância d (em u) do peito, no raio i */
  const at = (i: number, d: number): [number, number] => {
    const s = spokes[(i + SPOKES) % SPOKES]
    return [cu + Math.cos(s.a) * d, cv + (Math.sin(s.a) * d) / 1.4]
  }

  const drawWeb = (c: EffectContext, spokeT: number, ringT: number) => {
    const g = c.ctx
    g.save()
    g.lineCap = 'round'
    g.lineJoin = 'round'
    for (const pass of [0, 1]) {
      // tinta grossa por baixo, linha branca fina por cima (fio de teia de gibi)
      g.strokeStyle = pass === 0 ? INK : PAPER
      g.lineWidth = pass === 0 ? Math.max(3, c.unit * 0.007) : Math.max(1.2, c.unit * 0.0028)
      g.beginPath()
      spokes.forEach((s, i) => {
        const [x0, y0] = c.toScreen(cu, cv)
        const [x1, y1] = c.toScreen(...at(i, s.len * spokeT))
        g.moveTo(x0, y0)
        g.lineTo(x1, y1)
      })
      // anéis: segmentos levemente curvados para dentro entre raios vizinhos
      const rings = Math.floor(ringT * RINGS * SPOKES)
      for (let k = 0; k < rings; k++) {
        const ring = Math.floor(k / SPOKES)
        const i = k % SPOKES
        const d = 0.08 + ring * 0.13
        const [ax, ay] = c.toScreen(...at(i, d))
        const [bx, by] = c.toScreen(...at(i + 1, d))
        const [mx, my] = c.toScreen(...at(i, d * 0.9))
        const [nx, ny] = c.toScreen(...at(i + 1, d * 0.9))
        g.moveTo(ax, ay)
        g.quadraticCurveTo((mx + nx) / 2, (my + ny) / 2, bx, by)
      }
      g.stroke()
    }
    g.restore()
  }

  return {
    duration: 2.5,
    render(p, c) {
      const g = c.ctx
      const spokeT = smoothstep(0.04, 0.2, p)
      const ringT = range(p, 0.18, 0.5)
      const pull = smoothstep(0.55, 0.95, p)

      // o traje colorido espera por baixo assim que o puxão começa
      if (pull > 0) c.drawReal()

      // camada impressa + teia, puxadas juntas para o canto de cima
      const [px, py] = c.toScreen(cu, cv)
      g.save()
      if (pull > 0) {
        const dx = pull * c.width * 0.9
        const dy = -pull * c.height * 0.9
        g.translate(px + dx, py + dy)
        g.rotate(pull * 0.5)
        g.scale(1 - pull * 0.45, 1 - pull * 0.45)
        g.translate(-px, -py)
        g.globalAlpha = 1 - range(p, 0.85, 1)
      }
      c.drawPrint()
      if (spokeT > 0) drawWeb(c, spokeT, ringT)
      g.restore()

      // fios esticados entre a folha que sai e o canto da página
      if (pull > 0 && pull < 0.95) {
        g.save()
        g.strokeStyle = PAPER
        g.lineWidth = Math.max(1.5, c.unit * 0.003)
        g.globalAlpha = 0.9 * (1 - pull)
        const tx = px + pull * c.width * 0.9
        const ty = py - pull * c.height * 0.9
        for (let i = -2; i <= 2; i++) {
          g.beginPath()
          g.moveTo(tx + i * 6, ty)
          g.lineTo(c.width + 20, -20 + i * 14)
          g.stroke()
        }
        g.restore()
      }
      if (pull > 0.05 && pull < 0.5) c.shake(0.15)

      const [sx, sy] = c.toScreen(Math.min(0.8, cu + 0.28), Math.max(0.1, cv - 0.12))
      sfx(c, 'THWIP!', sx, sy, c.unit * 0.14, range(p, 0.02, 0.5), {
        rotate: -0.12,
        fill: c.palette.accent2,
        burstFill: PAPER,
        seed: 77,
      })
    },
  }
}

export default spider
