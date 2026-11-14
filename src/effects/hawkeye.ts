import { range, smoothstep } from '@/lib/utils'
import { INK, PAPER, sfx } from './comic'
import type { EffectContext, EffectFactory } from './types'

/**
 * Gavião Arqueiro — uma flecha atravessa a página da esquerda para a direita
 * na altura do peito. O rastro dela abre uma faixa em cores que vai se
 * alargando até cobrir o traje inteiro. Acabamento de quadrinho: linhas de
 * movimento no rastro e "TWANG!" no disparo.
 */

const hawkeye: EffectFactory = (c) => {
  const mask = c.createMask(0.25)
  const [, cv] = c.anchors.chest
  const SLOPE = -0.12 // a flecha sobe um pouco (y em v por unidade de u)

  /** posição da ponta da flecha em coordenadas de figura (u pode passar de 0..1) */
  const tipAt = (p: number, c: EffectContext) => {
    // trajeto em pixels de tela: de fora da esquerda até fora da direita
    const left = -c.fig.x / c.fig.w - 0.4
    const right = (c.width - c.fig.x) / c.fig.w + 0.4
    const t = smoothstep(0.08, 0.5, p)
    const u = left + (right - left) * t
    return { u, v: cv + (u - 0.5) * SLOPE, left }
  }

  // PNG opcional: public/effects/flecha.png (apontando para a direita, fundo transparente)
  const custom = new Image()
  custom.src = '/effects/flecha.png'

  /** desenha a flecha com a ponta em (x, y), apontando no ângulo a */
  const arrow = (g: CanvasRenderingContext2D, x: number, y: number, a: number, len: number, accent: string) => {
    g.save()
    g.translate(x, y)
    g.rotate(a)
    if (custom.complete && custom.naturalWidth > 0) {
      const h = (len * custom.naturalHeight) / custom.naturalWidth
      g.drawImage(custom, -len, -h / 2, len, h)
      g.restore()
      return
    }
    const w = len * 0.028 // meia-espessura da haste
    const line = Math.max(1.5, len * 0.008)
    g.lineJoin = 'round'
    g.strokeStyle = INK
    g.lineWidth = line

    // haste de carbono com reflexo
    const shaft = g.createLinearGradient(0, -w, 0, w)
    shaft.addColorStop(0, '#5b5f66')
    shaft.addColorStop(0.45, '#2a2d33')
    shaft.addColorStop(1, '#16181c')
    g.fillStyle = shaft
    g.beginPath()
    g.rect(-len * 0.97, -w, len * 0.86, w * 2)
    g.fill()
    g.stroke()
    g.strokeStyle = 'rgba(255,255,255,0.55)'
    g.lineWidth = line * 0.6
    g.beginPath()
    g.moveTo(-len * 0.9, -w * 0.35)
    g.lineTo(-len * 0.16, -w * 0.35)
    g.stroke()

    // anel na cor do herói perto da ponta
    g.fillStyle = accent
    g.strokeStyle = INK
    g.lineWidth = line
    g.beginPath()
    g.rect(-len * 0.16, -w * 1.5, len * 0.05, w * 3)
    g.fill()
    g.stroke()

    // ponta de três lâminas (losango metálico com aresta central)
    const head = g.createLinearGradient(0, -w * 6, 0, w * 6)
    head.addColorStop(0, '#f2f4f7')
    head.addColorStop(0.5, '#9aa3ad')
    head.addColorStop(1, '#5d6670')
    g.fillStyle = head
    g.beginPath()
    g.moveTo(len * 0.06, 0)
    g.lineTo(-len * 0.05, -w * 5.5)
    g.lineTo(-len * 0.12, -w * 1.4)
    g.lineTo(-len * 0.12, w * 1.4)
    g.lineTo(-len * 0.05, w * 5.5)
    g.closePath()
    g.fill()
    g.stroke()
    g.beginPath()
    g.moveTo(len * 0.06, 0)
    g.lineTo(-len * 0.12, 0)
    g.lineWidth = line * 0.8
    g.stroke()

    // penas: duas aletas curvas com listra branca
    for (const side of [-1, 1]) {
      g.beginPath()
      g.moveTo(-len * 0.74, side * w)
      g.quadraticCurveTo(-len * 0.84, side * w * 7.5, -len * 0.95, side * w * 7)
      g.lineTo(-len * 0.97, side * w)
      g.closePath()
      g.fillStyle = accent
      g.fill()
      g.lineWidth = line
      g.strokeStyle = INK
      g.stroke()
      g.beginPath()
      g.moveTo(-len * 0.86, side * w * 1.3)
      g.lineTo(-len * 0.87, side * w * 5.4)
      g.strokeStyle = 'rgba(255,255,255,0.85)'
      g.lineWidth = line * 1.4
      g.stroke()
    }

    // encaixe da corda (nock)
    g.fillStyle = '#f4f1e8'
    g.strokeStyle = INK
    g.lineWidth = line
    g.beginPath()
    g.rect(-len, -w * 1.3, len * 0.035, w * 2.6)
    g.fill()
    g.stroke()
    g.restore()
  }

  return {
    duration: 2.2,
    render(p, c) {
      const g = c.ctx
      const { u: tipU, v: tipV, left } = tipAt(p, c)

      c.drawPrint(1 - range(p, 0.82, 1))

      // rastro: cunha que nasce fina na ponta e engorda para trás; depois alarga tudo
      const widen = smoothstep(0.5, 0.97, p)
      mask.clear()
      const m = mask.ctx
      const W = mask.canvas.width
      const H = mask.canvas.height
      const toMask = (u: number, v: number): [number, number] => [u * W, v * H]
      const tail = Math.max(left, tipU - 2.2)
      const spread = 0.11 + widen * 1.4 // meia-largura atrás da flecha, em v
      const [x0, y0] = toMask(tipU, tipV)
      const [x1, y1] = toMask(tail, cv + (tail - 0.5) * SLOPE)
      m.fillStyle = '#fff'
      m.beginPath()
      m.moveTo(x0, y0)
      m.lineTo(x1, y1 - spread * H)
      m.lineTo(x1, y1 + spread * H)
      m.closePath()
      m.fill()
      if (widen > 0) {
        m.globalAlpha = widen
        m.fillRect(0, 0, W, H)
        m.globalAlpha = 1
      }
      c.drawRealMasked(mask)

      // bordas do rastro em traço de tinta, para o corte ficar legível
      const edges = 1 - smoothstep(0.45, 0.7, p)
      if (edges > 0 && tipU > left) {
        const [ex, ey] = c.toScreen(tipU, tipV)
        const tailV = cv + (tail - 0.5) * SLOPE
        const [ax, ay] = c.toScreen(tail, tailV - spread)
        const [bx, by] = c.toScreen(tail, tailV + spread)
        g.save()
        g.globalAlpha = edges
        g.strokeStyle = INK
        g.lineWidth = Math.max(2.5, c.unit * 0.007)
        g.beginPath()
        g.moveTo(ax, ay)
        g.lineTo(ex, ey)
        g.lineTo(bx, by)
        g.stroke()
        g.restore()
      }

      const flying = p > 0.06 && p < 0.52
      const [tx, ty] = c.toScreen(tipU, tipV)
      const angle = Math.atan2(SLOPE * c.fig.h, c.fig.w)
      if (flying) {
        // linhas de movimento atrás da flecha
        g.save()
        g.strokeStyle = INK
        g.lineCap = 'round'
        for (let i = 0; i < 6; i++) {
          const off = (i - 2.5) * c.unit * 0.025
          const len = c.unit * (0.25 + (i % 3) * 0.12)
          g.globalAlpha = 0.55
          g.lineWidth = Math.max(1.5, c.unit * 0.004)
          g.beginPath()
          g.moveTo(tx - Math.cos(angle) * c.unit * 0.35 - Math.sin(angle) * off, ty - Math.sin(angle) * c.unit * 0.35 + Math.cos(angle) * off)
          g.lineTo(
            tx - Math.cos(angle) * (c.unit * 0.35 + len) - Math.sin(angle) * off,
            ty - Math.sin(angle) * (c.unit * 0.35 + len) + Math.cos(angle) * off,
          )
          g.stroke()
        }
        g.restore()
        arrow(g, tx, ty, angle, c.unit * 0.5, c.palette.accent)
        // leve tremor quando a flecha passa pelo herói
        if (tipU > 0.2 && tipU < 0.8) c.shake(0.12)
      }

      // TWANG! no disparo, à esquerda
      const [sx, sy] = c.toScreen(0.12, Math.max(0.1, cv - 0.16))
      sfx(c, 'TWANG!', sx, sy, c.unit * 0.13, range(p, 0.04, 0.45), {
        rotate: -0.14,
        fill: c.palette.accent2,
        burstFill: PAPER,
        seed: 66,
      })
    },
  }
}

export default hawkeye
