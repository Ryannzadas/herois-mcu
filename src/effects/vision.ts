import { range, smoothstep } from '@/lib/utils'
import { INK, sfx } from './comic'
import type { EffectContext, EffectFactory, MaskLayer } from './types'

/**
 * Visão — a Joia da Mente acende na testa e o corpo "ganha densidade": o
 * traje colorido entra em faixas horizontais finas que chegam deslizando dos
 * dois lados (como se atravessasse a página), engrossam e se fundem num corpo
 * sólido. Acabamento de quadrinho: joia com contorno de tinta e raios, e
 * "ZHUUM!".
 */

const BANDS = 26
const GOLD = '#ffd21f'
const LIGHT = '#fff6c2'

const vision: EffectFactory = (c) => {
  const [hu, hv] = c.anchors.head
  const [cu, cv] = c.anchors.chest
  // a joia fica na testa, um pouco acima do centro da cabeça
  const gem: [number, number] = [hu, hv - 0.025]
  const even = c.createMask(0.25)
  const odd = c.createMask(0.25)

  /** desenha as faixas de uma paridade com a espessura dada (0..1 da faixa) */
  const bands = (mask: MaskLayer, parity: number, thick: number) => {
    mask.clear()
    const { width: w, height: h } = mask.canvas
    const step = h / BANDS
    mask.ctx.fillStyle = '#fff'
    for (let i = parity; i < BANDS; i += 2) {
      // a faixa cresce a partir do centro dela
      const t = Math.min(1, thick * 2) // cada paridade cobre metade das faixas
      const bh = step * 2 * t
      mask.ctx.fillRect(0, i * step + step / 2 - bh / 2, w, bh)
    }
  }

  /** desenha o traje deslocado na horizontal (faixas "atravessando" a página) */
  const shifted = (c: EffectContext, mask: MaskLayer, dx: number) => {
    const g = c.ctx
    g.save()
    g.translate(dx, 0)
    c.drawRealMasked(mask)
    g.restore()
  }

  return {
    duration: 2.5,
    render(p, c) {
      const g = c.ctx
      const glow = smoothstep(0.02, 0.22, p) // joia acende
      const dense = smoothstep(0.24, 0.84, p) // densidade aumenta
      const slide = (1 - smoothstep(0.24, 0.8, p)) * c.unit * 0.5

      c.drawPrint(1 - range(p, 0.55, 0.92))

      if (dense > 0) {
        bands(even, 0, dense)
        bands(odd, 1, dense)
        shifted(c, even, -slide)
        shifted(c, odd, slide)
      }
      c.drawReal(range(p, 0.82, 0.94))

      // Joia da Mente: losango amarelo com raios
      const gemFade = glow * (1 - range(p, 0.86, 1))
      if (gemFade > 0) {
        const [x, y] = c.toScreen(gem[0], gem[1])
        const s = c.unit * 0.022 * (1 + Math.sin(c.reduced ? 0 : c.time * 9) * 0.08)
        g.save()
        g.globalAlpha = gemFade
        // raios
        g.lineCap = 'round'
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2 + (c.reduced ? 0 : c.time * 0.6)
          const r0 = s * 1.6
          const r1 = s * (k % 2 ? 3.2 : 4.6) * (0.6 + glow * 0.6)
          g.beginPath()
          g.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0)
          g.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1)
          g.strokeStyle = INK
          g.lineWidth = Math.max(3, c.unit * 0.008)
          g.stroke()
          g.strokeStyle = GOLD
          g.lineWidth = Math.max(1.5, c.unit * 0.004)
          g.stroke()
        }
        g.beginPath()
        g.moveTo(x, y - s * 1.3)
        g.lineTo(x + s, y)
        g.lineTo(x, y + s * 1.3)
        g.lineTo(x - s, y)
        g.closePath()
        g.fillStyle = GOLD
        g.fill()
        g.lineWidth = Math.max(2, c.unit * 0.006)
        g.strokeStyle = INK
        g.stroke()
        g.fillStyle = LIGHT
        g.beginPath()
        g.arc(x - s * 0.2, y - s * 0.35, s * 0.28, 0, Math.PI * 2)
        g.fill()
        g.restore()
      }
      if (p > 0.18 && p < 0.28) c.flash((0.28 - p) * 2.5, '#ffe66b')

      const [sx, sy] = c.toScreen(Math.min(0.8, cu + 0.27), Math.max(0.1, cv - 0.16))
      sfx(c, 'ZHUUM!', sx, sy, c.unit * 0.14, range(p, 0.22, 0.9), {
        rotate: 0.08,
        fill: GOLD,
        burstFill: c.palette.accent,
        seed: 11,
      })
    },
  }
}

export default vision
