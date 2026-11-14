import { range, seeded, smoothstep } from '@/lib/utils'
import { INK, sfx } from './comic'
import type { EffectFactory } from './types'

/**
 * Doutor Estranho — um anel de faíscas de portal se acende no peito e gira,
 * abrindo como um portal: dentro do anel já é o traje colorido; ele cresce
 * até engolir a figura inteira. Acabamento de quadrinho: anel com contorno
 * de tinta, faíscas em traços curtos e "FWOOM!".
 */

const SPARKS = 140

const strange: EffectFactory = (c) => {
  const rand = seeded(8008)
  const [cu, cv] = c.anchors.chest
  const mask = c.createMask(0.25)
  const sparks = Array.from({ length: SPARKS }, () => ({
    a: rand() * Math.PI * 2,
    off: (rand() - 0.5) * 0.06, // distância do anel, em u
    len: 0.02 + rand() * 0.05,
    speed: 0.8 + rand() * 1.4,
  }))
  // raio que cobre a figura inteira a partir do peito (em u)
  const full = Math.max(Math.hypot(cu, cv * 1.4), Math.hypot(1 - cu, cv * 1.4), Math.hypot(cu, (1 - cv) * 1.4), Math.hypot(1 - cu, (1 - cv) * 1.4)) + 0.1

  return {
    duration: 2.6,
    render(p, c) {
      const g = c.ctx
      const ignite = smoothstep(0.03, 0.25, p) // anel acende pequeno
      const open = smoothstep(0.3, 0.92, p) // portal abre
      const radius = ignite * 0.12 + open * (full - 0.12)
      const spin = c.reduced ? 0 : c.time * 2.4

      c.drawPrint(1 - range(p, 0.9, 1))

      // dentro do portal: traje colorido
      mask.clear()
      const m = mask.ctx
      m.fillStyle = '#fff'
      m.beginPath()
      // a máscara tem a proporção da figura (1:1.4), então o círculo de tela tem raio r·largura
      m.arc(cu * mask.canvas.width, cv * mask.canvas.height, radius * mask.canvas.width, 0, Math.PI * 2)
      m.fill()
      c.drawRealMasked(mask)

      // anel: contorno de tinta + faixa laranja + faíscas
      const fade = 1 - range(p, 0.86, 1)
      if (radius > 0 && fade > 0) {
        const [x, y] = c.toScreen(cu, cv)
        const r = radius * c.unit
        g.save()
        g.globalAlpha = fade
        g.lineWidth = Math.max(6, c.unit * 0.022)
        g.strokeStyle = INK
        g.beginPath()
        g.arc(x, y, r, 0, Math.PI * 2)
        g.stroke()
        g.lineWidth = Math.max(3, c.unit * 0.012)
        g.strokeStyle = '#ff9a1f'
        g.stroke()
        g.lineWidth = Math.max(1, c.unit * 0.004)
        g.strokeStyle = '#ffe9a8'
        g.stroke()

        // runas: um anel interno tracejado girando ao contrário
        g.setLineDash([c.unit * 0.02, c.unit * 0.014])
        g.lineDashOffset = -spin * c.unit * 0.05
        g.lineWidth = Math.max(2, c.unit * 0.005)
        g.strokeStyle = '#ffb347'
        g.beginPath()
        g.arc(x, y, r * 0.86, 0, Math.PI * 2)
        g.stroke()
        g.setLineDash([])

        // faíscas tangentes ao anel, girando
        g.lineCap = 'round'
        for (const s of sparks) {
          const a = s.a + spin * s.speed
          const rr = r + s.off * c.unit
          const sx = x + Math.cos(a) * rr
          const sy = y + Math.sin(a) * rr
          const tx = -Math.sin(a)
          const ty = Math.cos(a)
          const L = s.len * c.unit
          g.strokeStyle = INK
          g.lineWidth = Math.max(2.5, c.unit * 0.006)
          g.beginPath()
          g.moveTo(sx, sy)
          g.lineTo(sx - tx * L, sy - ty * L)
          g.stroke()
          g.strokeStyle = s.speed > 1.6 ? '#fff3c4' : '#ff9a1f'
          g.lineWidth = Math.max(1.2, c.unit * 0.003)
          g.stroke()
        }
        g.restore()
      }
      if (p > 0.28 && p < 0.4) c.flash((0.4 - p) * 2, '#ffd27a')

      const [sx, sy] = c.toScreen(Math.min(0.8, cu + 0.27), Math.max(0.1, cv - 0.16))
      sfx(c, 'FWOOM!', sx, sy, c.unit * 0.14, range(p, 0.28, 0.9), {
        rotate: 0.1,
        fill: '#ff9a1f',
        burstFill: c.palette.accent,
        seed: 88,
      })
    },
  }
}

export default strange
