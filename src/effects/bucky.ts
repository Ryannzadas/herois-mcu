import { clamp, range, seeded, smoothstep } from '@/lib/utils'
import { INK, burst, sfx } from './comic'
import type { EffectFactory } from './types'

/**
 * Soldado Invernal — a impressão congela, como na câmara criogênica da
 * HIDRA: o gelo sobe dos pés e cristais brotam pelo corpo, enquanto as dez
 * palavras de ativação aparecem carimbadas em vermelho. Na última palavra,
 * um soco do braço de metal (estrela vermelha) estilhaça o gelo: os cacos da
 * impressão voam para longe e o traje colorido fica por baixo.
 * Acabamento de quadrinho: rachaduras com contorno, estouro e "KRAK!".
 */

const WORDS = [
  'Желание',
  'Ржавый',
  'Семнадцать',
  'Рассвет',
  'Печь',
  'Девять',
  'Добросердечный',
  'Возвращение на родину',
  'Один',
  'Грузовой вагон',
]
const RED = '#c8102e'
const ICE = 'rgba(190, 228, 248, 0.62)'
const ICE_LINE = '#f4fbff'
const COLS = 5
const ROWS = 7
const HIT = 0.46

/** estrela de cinco pontas */
function star(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 ? r * 0.42 : r
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
  }
  g.closePath()
}

const bucky: EffectFactory = (c) => {
  const rand = seeded(1917)
  const [cu, cv] = c.anchors.chest
  const frost = c.createMask(0.5)

  // cristais de gelo: aparecem quando a frente de gelo passa por eles
  const crystals = Array.from({ length: 70 }, () => ({
    u: rand(),
    v: rand(),
    a: rand() * Math.PI,
    len: 0.02 + rand() * 0.04,
  }))

  // malha de cacos: pontos com jitter cobrindo a figura, cada célula vira 2 triângulos
  const grid: [number, number][][] = []
  for (let r = 0; r <= ROWS; r++) {
    const row: [number, number][] = []
    for (let k = 0; k <= COLS; k++) {
      const edge = r === 0 || r === ROWS || k === 0 || k === COLS
      const ju = edge ? 0 : (rand() - 0.5) * 0.12
      const jv = edge ? 0 : (rand() - 0.5) * 0.09
      row.push([-0.05 + (k / COLS) * 1.1 + ju, -0.02 + (r / ROWS) * 1.04 + jv])
    }
    grid.push(row)
  }
  const shards: { pts: [number, number][]; cx: number; cy: number; spin: number; speed: number }[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let k = 0; k < COLS; k++) {
      const a = grid[r][k]
      const b = grid[r][k + 1]
      const d = grid[r + 1][k]
      const e = grid[r + 1][k + 1]
      const tris: [number, number][][] = rand() < 0.5 ? [[a, b, e], [a, e, d]] : [[a, b, d], [b, e, d]]
      for (const pts of tris) {
        shards.push({
          pts,
          cx: (pts[0][0] + pts[1][0] + pts[2][0]) / 3,
          cy: (pts[0][1] + pts[1][1] + pts[2][1]) / 3,
          spin: (rand() - 0.5) * 3,
          speed: 0.7 + rand() * 0.6,
        })
      }
    }
  }

  // rachaduras do soco: raios tortos saindo do peito
  const cracks = Array.from({ length: 9 }, (_, i) => {
    const a0 = (i / 9) * Math.PI * 2 + rand() * 0.4
    const pts: [number, number][] = [[cu, cv]]
    let a = a0
    let [u, v] = [cu, cv]
    for (let s = 0; s < 5; s++) {
      a += (rand() - 0.5) * 0.7
      const l = 0.04 + rand() * 0.05
      u += Math.cos(a) * l
      v += Math.sin(a) * l * 0.8
      pts.push([u, v])
    }
    return pts
  })

  return {
    duration: 2.8,
    render(p, c) {
      const g = c.ctx
      const freeze = smoothstep(0.02, 0.42, p)
      const front = 1.05 - freeze * 1.12 // linha do gelo (v): sobe dos pés à cabeça
      const shatter = range(p, HIT, 0.86)

      // camada de gelo, só dentro da silhueta
      if (freeze > 0) {
        frost.clear()
        const f = frost.ctx
        const fw = frost.canvas.width
        const fh = frost.canvas.height
        f.fillStyle = ICE
        f.beginPath()
        f.moveTo(0, fh)
        for (let i = 0; i <= 24; i++) {
          const u = i / 24
          f.lineTo(u * fw, (front + Math.sin(u * 23) * 0.012) * fh)
        }
        f.lineTo(fw, fh)
        f.closePath()
        f.fill()
        f.strokeStyle = ICE_LINE
        f.lineCap = 'round'
        f.lineWidth = Math.max(1.5, fw * 0.004)
        for (const k of crystals) {
          if (k.v < front) continue
          const grow = clamp((k.v - front) / 0.08, 0, 1)
          const l = k.len * grow
          const x = k.u * fw
          const y = k.v * fh
          for (const da of [0, Math.PI / 3, -Math.PI / 3]) {
            f.beginPath()
            f.moveTo(x - Math.cos(k.a + da) * l * fw, y - Math.sin(k.a + da) * l * fw)
            f.lineTo(x + Math.cos(k.a + da) * l * fw, y + Math.sin(k.a + da) * l * fw)
            f.stroke()
          }
        }
        c.clipToSilhouette(frost)
      }

      if (shatter <= 0) {
        c.drawPrint()
        if (freeze > 0) c.drawFigureLayer(frost)
      } else {
        // por baixo, o traje; por cima, os cacos da impressão congelada voando
        c.drawReal()
        const fade = 1 - range(shatter, 0.55, 1)
        const boom = Math.pow(shatter, 0.7)
        if (fade > 0) {
          for (const s of shards) {
            const dx = s.cx - cu
            const dy = s.cy - cv
            const dist = Math.hypot(dx, dy) || 1
            const push = boom * s.speed * (0.35 + 0.25 / (dist + 0.15))
            const ou = (dx / dist) * push
            const ov = (dy / dist) * push * 0.8 + shatter * shatter * 0.5
            const [x0, y0] = c.toScreen(s.cx, s.cy)
            const [x1, y1] = c.toScreen(s.cx + ou, s.cy + ov)
            g.save()
            g.globalAlpha = fade
            g.translate(x1, y1)
            g.rotate(s.spin * boom)
            g.translate(-x0, -y0)
            g.beginPath()
            for (const [u, v] of s.pts) g.lineTo(...c.toScreen(u, v))
            g.closePath()
            g.save()
            g.clip()
            c.drawPrint()
            c.drawFigureLayer(frost)
            g.restore()
            g.lineWidth = Math.max(1, c.unit * 0.0025)
            g.strokeStyle = 'rgba(244, 251, 255, 0.45)'
            g.stroke()
            g.restore()
          }
        }
      }

      // palavras de ativação, uma de cada vez
      const wordsAlpha = 1 - range(p, HIT, HIT + 0.08)
      if (wordsAlpha > 0) {
        const size = Math.max(13, c.unit * 0.046)
        g.save()
        g.globalAlpha = wordsAlpha
        g.font = `bold ${size}px "Courier New", Courier, monospace`
        g.textBaseline = 'middle'
        g.lineJoin = 'round'
        WORDS.forEach((w, i) => {
          const t0 = 0.06 + i * 0.036
          const k = range(p, t0, t0 + 0.03)
          if (k <= 0) return
          const left = i % 2 === 0
          const [x, y] = c.toScreen(left ? -0.08 : 1.08, 0.1 + i * 0.08)
          const shown = w.slice(0, Math.ceil(w.length * k))
          g.textAlign = left ? 'left' : 'right'
          g.save()
          g.translate(x, y)
          g.rotate((left ? -1 : 1) * 0.04)
          g.lineWidth = size * 0.28
          g.strokeStyle = '#fff'
          g.strokeText(shown, 0, 0)
          g.fillStyle = RED
          g.fillText(shown, 0, 0)
          g.restore()
        })
        g.restore()
      }

      // soco: rachaduras, estrela vermelha e estouro no peito
      const [hx, hy] = c.toScreen(cu, cv)
      const crack = range(p, HIT - 0.05, HIT)
      if (crack > 0 && shatter < 0.25) {
        g.save()
        g.globalAlpha = 1 - range(shatter, 0, 0.25)
        g.lineCap = 'round'
        g.lineJoin = 'round'
        for (const pts of cracks) {
          const n = Math.max(2, Math.ceil(pts.length * crack))
          g.beginPath()
          pts.slice(0, n).forEach(([u, v]) => g.lineTo(...c.toScreen(u, v)))
          g.lineWidth = Math.max(4, c.unit * 0.011)
          g.strokeStyle = INK
          g.stroke()
          g.lineWidth = Math.max(2, c.unit * 0.005)
          g.strokeStyle = ICE_LINE
          g.stroke()
        }
        g.restore()
      }
      const pop = range(p, HIT - 0.02, HIT + 0.16)
      if (pop > 0 && pop < 1) {
        const r = c.unit * (0.05 + Math.sin(pop * Math.PI) * 0.16)
        g.save()
        g.globalAlpha = 1 - range(pop, 0.6, 1)
        burst(g, hx, hy, r, { spikes: 12, seed: 17, fill: '#dfe7ee', stroke: INK, line: Math.max(3, c.unit * 0.01) })
        star(g, hx, hy, r * 0.45)
        g.fillStyle = RED
        g.fill()
        g.lineWidth = Math.max(2, c.unit * 0.006)
        g.strokeStyle = INK
        g.stroke()
        g.restore()
      }
      if (p > HIT - 0.01 && p < HIT + 0.05) {
        c.shake(0.9)
        c.flash((HIT + 0.05 - p) * 6, '#e8f6ff')
      }

      const [tx, ty] = c.toScreen(0.8, Math.max(0.1, c.anchors.head[1]))
      sfx(c, 'KRAK!', tx, ty, c.unit * 0.15, range(p, HIT - 0.01, 0.98), {
        rotate: 0.12,
        fill: '#e8f6ff',
        burstFill: RED,
        seed: 1917,
      })
    },
  }
}

export default bucky
