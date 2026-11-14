import { range, seeded } from '@/lib/utils'
import { INK, sfx } from './comic'
import type { EffectContext, EffectFactory } from './types'

/**
 * Viúva Negra — cortes rápidos estilo câmera de vigilância.
 * A impressão vira imagem de CFTV (moldura de câmera, REC piscando, horário);
 * então a edição corta seco entre vários enquadramentos do traje — closes,
 * tela dividida em 4 câmeras — alternando P&B e cor, até parar no traje
 * inteiro. Acabamento de quadrinho: bordas de quadro em tinta e "CLIK!".
 */

type Cut =
  | { kind: 'zoom'; u: number; v: number; zoom: number; color: boolean }
  | { kind: 'grid'; spots: (readonly [number, number])[] }

const CUTS = 9
const CUT_START = 0.14
const CUT_END = 0.82

const widow: EffectFactory = (c) => {
  const rand = seeded(5005)
  const n = c.points.length / 2
  const spot = () => {
    const k = Math.floor(rand() * n)
    return [c.points[k * 2], c.points[k * 2 + 1]] as const
  }
  const cuts: Cut[] = Array.from({ length: CUTS }, (_, i) => {
    if (i === 3 || i === 7) return { kind: 'grid', spots: [c.anchors.head, c.anchors.chest, spot(), spot()] }
    // primeiro corte é sempre no rosto; os outros em pontos do corpo
    const [u, v] = i === 0 ? c.anchors.head : spot()
    return { kind: 'zoom', u, v, zoom: 1.7 + rand() * 1.1, color: i % 2 === 1 }
  })
  const clockBase = 23 * 3600 + 14 * 60 + Math.floor(rand() * 50)

  /** desenha a figura ampliada em torno de (u, v), recortada no retângulo dado */
  const zoomed = (c: EffectContext, u: number, v: number, zoom: number, color: boolean, rect = c.fig) => {
    const g = c.ctx
    const [px, py] = c.toScreen(u, v)
    g.save()
    g.beginPath()
    g.rect(rect.x, rect.y, rect.w, rect.h)
    g.clip()
    g.fillStyle = '#1b1d1f'
    g.fillRect(rect.x, rect.y, rect.w, rect.h)
    // centraliza o ponto escolhido no meio do quadro
    g.translate(rect.x + rect.w / 2, rect.y + rect.h / 2)
    g.scale(zoom, zoom)
    g.translate(-px, -py)
    if (color) c.drawReal()
    else c.drawPrint()
    g.restore()
  }

  /** moldura de câmera: cantos, REC, horário, rótulo, linhas de ruído */
  const cctv = (c: EffectContext, rect: { x: number; y: number; w: number; h: number }, cam: number, alpha: number) => {
    if (alpha <= 0) return
    const g = c.ctx
    const s = Math.max(10, rect.w * 0.05)
    g.save()
    g.globalAlpha = alpha
    g.strokeStyle = '#f4f1e8'
    g.lineWidth = Math.max(2, rect.w * 0.006)
    const corners: [number, number, number, number][] = [
      [rect.x + s * 0.6, rect.y + s * 0.6, 1, 1],
      [rect.x + rect.w - s * 0.6, rect.y + s * 0.6, -1, 1],
      [rect.x + s * 0.6, rect.y + rect.h - s * 0.6, 1, -1],
      [rect.x + rect.w - s * 0.6, rect.y + rect.h - s * 0.6, -1, -1],
    ]
    g.beginPath()
    for (const [x, y, dx, dy] of corners) {
      g.moveTo(x, y + dy * s)
      g.lineTo(x, y)
      g.lineTo(x + dx * s, y)
    }
    g.stroke()
    const font = Math.max(10, rect.w * 0.035)
    g.font = `600 ${font}px "IBM Plex Mono", ui-monospace, monospace`
    g.textBaseline = 'top'
    g.fillStyle = '#f4f1e8'
    g.fillText(`CAM ${String(cam).padStart(2, '0')}`, rect.x + s * 1.2, rect.y + s * 1.1)
    const t = clockBase + Math.floor(c.time * 4)
    const hh = String(Math.floor(t / 3600) % 24).padStart(2, '0')
    const mm = String(Math.floor(t / 60) % 60).padStart(2, '0')
    const ss = String(t % 60).padStart(2, '0')
    g.textAlign = 'right'
    g.textBaseline = 'bottom'
    g.fillText(`${hh}:${mm}:${ss}`, rect.x + rect.w - s * 1.2, rect.y + rect.h - s * 1.1)
    // REC piscando
    if (c.reduced || Math.floor(c.time * 3) % 2 === 0) {
      g.textAlign = 'right'
      g.textBaseline = 'top'
      g.fillStyle = '#e8202f'
      g.beginPath()
      g.arc(rect.x + rect.w - s * 1.2 - font * 2.6, rect.y + s * 1.1 + font * 0.5, font * 0.32, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = '#f4f1e8'
      g.fillText('REC', rect.x + rect.w - s * 1.2, rect.y + s * 1.1)
    }
    // linhas de interferência
    if (!c.reduced) {
      g.fillStyle = 'rgba(255,255,255,0.35)'
      for (let i = 0; i < 3; i++) {
        g.fillRect(rect.x, rect.y + Math.random() * rect.h, rect.w, Math.random() * 2 + 0.5)
      }
    }
    g.restore()
  }

  /** contorno de quadro de HQ */
  const panel = (c: EffectContext, rect: { x: number; y: number; w: number; h: number }) => {
    const g = c.ctx
    g.save()
    g.strokeStyle = INK
    g.lineWidth = Math.max(3, c.unit * 0.01)
    g.strokeRect(rect.x, rect.y, rect.w, rect.h)
    g.restore()
  }

  return {
    duration: 2.6,
    render(p, c) {
      const fig = c.fig

      // 1) a impressão vira imagem de câmera
      if (p < CUT_START) {
        c.drawPrint()
        cctv(c, fig, 1, range(p, 0.02, 0.1))
        panel(c, fig)
        return
      }

      // 2) cortes secos entre enquadramentos
      if (p < CUT_END) {
        const i = Math.min(CUTS - 1, Math.floor(((p - CUT_START) / (CUT_END - CUT_START)) * CUTS))
        const cut = cuts[i]
        if (cut.kind === 'grid') {
          const w = fig.w / 2
          const h = fig.h / 2
          for (let q = 0; q < 4; q++) {
            const rect = { x: fig.x + (q % 2) * w, y: fig.y + Math.floor(q / 2) * h, w, h }
            const [u, v] = cut.spots[q]
            zoomed(c, u, v, 1.4 + (q % 2) * 0.5, (q + i) % 2 === 0, rect)
            cctv(c, rect, q + 2 + i, 1)
            panel(c, rect)
          }
        } else {
          zoomed(c, cut.u, cut.v, cut.zoom, cut.color)
          cctv(c, fig, i + 2, 1)
          panel(c, fig)
        }
        // clarão curtinho a cada corte
        const local = (((p - CUT_START) / (CUT_END - CUT_START)) * CUTS) % 1
        if (local < 0.18) c.flash((0.18 - local) * 1.2, '#ffffff')
        return
      }

      // 3) para no traje inteiro; a câmera "desliga"
      const settle = range(p, CUT_END, 1)
      c.drawReal()
      cctv(c, fig, 1, 1 - settle)
      if (settle < 0.6) panel(c, fig)
      const [sx, sy] = c.toScreen(0.78, Math.max(0.1, c.anchors.head[1]))
      sfx(c, 'CLIK!', sx, sy, c.unit * 0.13, range(p, CUT_END - 0.02, 1), {
        rotate: 0.1,
        fill: c.palette.accent2,
        burstFill: '#f4f1e8',
        seed: 55,
      })
    },
  }
}

export default widow
