import { range, seeded, smoothstep } from '@/lib/utils'
import { INK, sfx, speedLines } from './comic'
import type { EffectContext, EffectFactory } from './types'

/**
 * Falcão — as asas EXO-7 se abrem atrás da figura, pena por pena (placas de
 * metal com contorno de tinta). Uma batida de asa varre a página como um
 * leque a partir dos ombros: tudo que a batida já cobriu fica em cores.
 * Depois o drone Asa Vermelha cruza o quadro deixando um rastro tracejado.
 * Acabamento de quadrinho: linhas de ação na batida e "FWOOSH!".
 */

const FEATHERS = 11
const STEEL = '#9aa4ae'
const STEEL_DARK = '#4a5560'
const SHINE = 'rgba(255,255,255,0.55)'

interface Feather {
  /** ângulo aberto (rad, asa direita; 0 = horizontal, negativo = para cima) */
  open: number
  /** comprimento, em unidades de figura */
  len: number
  /** largura na ponta, em unidades de figura */
  width: number
  red: boolean
}

/** placa de metal: raiz estreita, ponta larga e chanfrada */
function plate(g: CanvasRenderingContext2D, len: number, width: number, fill: string, line: number) {
  g.beginPath()
  g.moveTo(0, -width * 0.18)
  g.lineTo(len * 0.82, -width * 0.5)
  g.lineTo(len, 0)
  g.lineTo(len * 0.82, width * 0.5)
  g.lineTo(0, width * 0.18)
  g.closePath()
  g.fillStyle = fill
  g.fill()
  g.lineWidth = line
  g.strokeStyle = INK
  g.stroke()
  // brilho do metal
  g.beginPath()
  g.moveTo(len * 0.12, -width * 0.12)
  g.lineTo(len * 0.78, -width * 0.32)
  g.lineWidth = line * 0.8
  g.strokeStyle = SHINE
  g.stroke()
}

/** asa inteira de um lado (side = 1 direita, -1 esquerda), em coordenadas de tela */
function wing(
  c: EffectContext,
  feathers: Feather[],
  root: [number, number],
  side: 1 | -1,
  openK: number,
  beat: number,
  alpha: number,
) {
  const g = c.ctx
  const u = c.unit
  const line = Math.max(1.5, u * 0.004)
  g.save()
  g.globalAlpha = alpha
  g.translate(root[0], root[1])
  g.scale(side, 1)
  // de trás para a frente: as penas de cima ficam por baixo
  for (let i = feathers.length - 1; i >= 0; i--) {
    const f = feathers[i]
    const folded = 1.35 + i * 0.02 // dobrada: apontando para baixo, colada às costas
    // a batida empurra as penas para baixo (mais as de cima, como uma asa de verdade)
    const a = folded + (f.open - folded) * openK + beat * (0.55 + (i / feathers.length) * 0.5)
    // a asa estica junto com a abertura
    const len = f.len * u * (0.35 + 0.65 * openK)
    g.save()
    g.rotate(a)
    plate(g, len, f.width * u, f.red ? c.palette.accent2 : i % 2 ? STEEL : STEEL_DARK, line)
    g.restore()
  }
  // articulação do ombro
  g.beginPath()
  g.arc(0, 0, u * 0.022, 0, Math.PI * 2)
  g.fillStyle = STEEL_DARK
  g.fill()
  g.lineWidth = line
  g.strokeStyle = INK
  g.stroke()
  g.restore()
}

/** Asa Vermelha: drone em forma de asa-delta, vermelho com centro escuro */
function redwing(g: CanvasRenderingContext2D, x: number, y: number, heading: number, s: number, color: string, line: number) {
  g.save()
  g.translate(x, y)
  g.rotate(heading)
  g.beginPath()
  g.moveTo(s * 1.1, 0)
  g.lineTo(-s * 0.6, -s * 0.95)
  g.lineTo(-s * 0.3, 0)
  g.lineTo(-s * 0.6, s * 0.95)
  g.closePath()
  g.fillStyle = color
  g.fill()
  g.lineWidth = line
  g.strokeStyle = INK
  g.stroke()
  g.beginPath()
  g.arc(s * 0.2, 0, s * 0.22, 0, Math.PI * 2)
  g.fillStyle = INK
  g.fill()
  g.beginPath()
  g.arc(s * 0.2, 0, s * 0.09, 0, Math.PI * 2)
  g.fillStyle = '#ff6b5e'
  g.fill()
  g.restore()
}

const falcon: EffectFactory = (c) => {
  const rand = seeded(2014)
  const [cu, cv] = c.anchors.chest
  const mask = c.createMask(0.25)
  // leque: da pena de cima (quase vertical) à de baixo (abaixo da horizontal)
  const feathers: Feather[] = Array.from({ length: FEATHERS }, (_, i) => {
    const k = i / (FEATHERS - 1)
    return {
      open: -1.05 + k * 1.6,
      len: 0.5 + Math.sin(k * Math.PI) * 0.3 + rand() * 0.05,
      width: 0.07 + rand() * 0.015,
      red: i === 3 || i === 7,
    }
  })
  // ombros um pouco acima do peito
  const shoulderV = cv - 0.06

  /** posição do Asa Vermelha: arco da direita para a esquerda por cima da cabeça */
  const droneAt = (t: number): [number, number] => {
    const u = 1.25 - t * 1.5
    const v = cv + 0.12 + Math.sin(t * Math.PI * 2) * 0.1
    return [u, v]
  }

  return {
    duration: 2.6,
    render(p, c) {
      const g = c.ctx
      const openK = smoothstep(0.04, 0.32, p)
      const sweep = smoothstep(0.34, 0.66, p)
      // batida: desce com a varredura e volta
      const beat = Math.sin(range(p, 0.34, 0.78) * Math.PI) * 0.9
      const wingsAlpha = 1 - range(p, 0.8, 0.94)
      const flutter = c.reduced ? 0 : Math.sin(c.time * 9) * 0.03 * (1 - sweep)

      // asas atrás da figura
      if (openK > 0 && wingsAlpha > 0) {
        const [rx, ry] = c.toScreen(cu + 0.05, shoulderV)
        const [lx, ly] = c.toScreen(cu - 0.05, shoulderV)
        wing(c, feathers, [rx, ry], 1, openK, beat + flutter, wingsAlpha)
        wing(c, feathers, [lx, ly], -1, openK, beat + flutter, wingsAlpha)
      }

      c.drawPrint(1 - range(p, 0.86, 1))

      // batida de asa: leque que desce dos ombros revelando o traje
      if (sweep > 0) {
        mask.clear()
        const m = mask.ctx
        const mw = mask.canvas.width
        const px = cu * mw
        const py = shoulderV * mw * 1.4
        const r = mw * 3
        const top = -Math.PI / 2
        m.fillStyle = '#fff'
        m.beginPath()
        m.moveTo(px, py)
        m.arc(px, py, r, top, top + sweep * Math.PI)
        m.closePath()
        m.fill()
        m.beginPath()
        m.moveTo(px, py)
        m.arc(px, py, r, top, top - sweep * Math.PI, true)
        m.closePath()
        m.fill()
        c.drawRealMasked(mask)
      }
      c.drawReal(range(p, 0.78, 0.92))

      // linhas de ação e tremor no começo da batida
      const [sx0, sy0] = c.toScreen(cu, shoulderV)
      const action = range(p, 0.34, 0.42) * (1 - range(p, 0.5, 0.66))
      if (action > 0) speedLines(c, sx0, sy0, action * 0.8, 2014)
      if (p > 0.34 && p < 0.42) c.shake(0.45)

      const [tx, ty] = c.toScreen(0.8, Math.max(0.12, c.anchors.head[1] + 0.05))
      sfx(c, 'FWOOSH!', tx, ty, c.unit * 0.13, range(p, 0.34, 0.95), {
        rotate: -0.1,
        fill: '#fff4e0',
        burstFill: c.palette.accent2,
        seed: 2014,
      })

      // Asa Vermelha cruzando o quadro (por cima de tudo)
      const fly = range(p, 0.52, 0.9)
      if (fly > 0 && fly < 1) {
        const line = Math.max(1.5, c.unit * 0.004)
        g.save()
        g.setLineDash([c.unit * 0.014, c.unit * 0.012])
        g.lineWidth = Math.max(2, c.unit * 0.006)
        g.strokeStyle = c.palette.accent2
        g.beginPath()
        for (let k = 0; k <= 10; k++) {
          const [u, v] = droneAt(Math.max(0, fly - 0.18 + (k / 10) * 0.18))
          const [x, y] = c.toScreen(u, v)
          if (k === 0) g.moveTo(x, y)
          else g.lineTo(x, y)
        }
        g.stroke()
        g.setLineDash([])
        const [x, y] = c.toScreen(...droneAt(fly))
        const [bx, by] = c.toScreen(...droneAt(Math.max(0, fly - 0.01)))
        redwing(g, x, y, Math.atan2(y - by, x - bx), c.unit * 0.065, c.palette.accent2, line)
        g.restore()
      }
    },
  }
}

export default falcon
