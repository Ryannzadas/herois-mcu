import { range } from '@/lib/utils'
import { INK } from './comic'
import type { EffectFactory } from './types'

/**
 * Transição neutra: três quadros de HQ se abrem em sequência, cada um
 * revelando uma fatia do traje colorido. Com prefers-reduced-motion vira
 * uma troca direta e curta. Também serve a personagens sem efeito próprio.
 */
const PANELS = 3

const panels: EffectFactory = (c) => {
  const mask = c.createMask(0.25)
  return {
    duration: c.reduced ? 0.35 : 1.1,
    render(p, c) {
      if (c.reduced) {
        c.drawPrint(1 - p)
        c.drawReal(p)
        return
      }
      c.drawPrint(1 - range(p, 0.85, 1))
      mask.clear()
      const m = mask.ctx
      const w = mask.canvas.width / PANELS
      const h = mask.canvas.height
      m.fillStyle = '#fff'
      // cada quadro abre de cima pra baixo, um depois do outro
      const open = Array.from({ length: PANELS }, (_, i) => range(p, i * 0.22, i * 0.22 + 0.45))
      open.forEach((t, i) => {
        if (t > 0) m.fillRect(i * w, 0, w, h * (1 - Math.pow(1 - t, 3)))
      })
      c.drawRealMasked(mask)

      // contorno de tinta dos quadros enquanto abrem
      const g = c.ctx
      g.save()
      g.strokeStyle = INK
      g.lineWidth = Math.max(3, c.unit * 0.01)
      open.forEach((t, i) => {
        if (t <= 0 || t >= 1) return
        const [x, y] = c.toScreen(i / PANELS, 0)
        g.strokeRect(x, y, c.fig.w / PANELS, (1 - Math.pow(1 - t, 3)) * c.fig.h)
      })
      g.restore()
    },
  }
}

export default panels
