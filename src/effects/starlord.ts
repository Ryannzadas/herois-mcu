import { range, seeded, smoothstep } from '@/lib/utils'
import { INK, PAPER, sfx } from './comic'
import type { EffectContext, EffectFactory } from './types'

/**
 * Senhor das Estrelas — a fita "Awesome Mix Vol. 1" aparece aos pés da
 * figura e começa a tocar: a cada batida sai um anel de som que pinta de
 * cor tudo o que está dentro dele, e o traje vai aparecendo em degraus, no
 * ritmo. A figura dança no compasso e notas musicais sobem da fita.
 * Acabamento de quadrinho: anéis com contorno de tinta e "OOGA-CHAKA!".
 */

const BEATS = 8
const START = 0.12
const END = 0.78
const ORANGE = '#ff8a3d'
const CREAM = '#f4e4c1'
const NOTES = ['♪', '♫', '♪', '♬']

/** fita cassete de quadrinho, centrada em (x, y), largura w */
function cassette(g: CanvasRenderingContext2D, x: number, y: number, w: number, spin: number, line: number) {
  const h = w * 0.63
  g.save()
  g.translate(x, y)
  g.lineJoin = 'round'
  g.lineWidth = line
  g.strokeStyle = INK
  // corpo
  g.beginPath()
  g.roundRect(-w / 2, -h / 2, w, h, w * 0.05)
  g.fillStyle = '#2b2622'
  g.fill()
  g.stroke()
  // etiqueta
  g.beginPath()
  g.roundRect(-w * 0.42, -h * 0.4, w * 0.84, h * 0.56, w * 0.03)
  g.fillStyle = CREAM
  g.fill()
  g.stroke()
  g.fillStyle = ORANGE
  g.fillRect(-w * 0.42, -h * 0.4, w * 0.84, h * 0.12)
  g.fillStyle = INK
  g.font = `400 ${w * 0.085}px "Bangers", Impact, sans-serif`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('AWESOME MIX VOL. 1', 0, -h * 0.2)
  // janela com os dois carretéis
  g.beginPath()
  g.roundRect(-w * 0.26, -h * 0.08, w * 0.52, h * 0.2, h * 0.1)
  g.fillStyle = '#5b4a3a'
  g.fill()
  g.stroke()
  for (const sx of [-0.15, 0.15]) {
    g.save()
    g.translate(w * sx, h * 0.02)
    g.rotate(spin)
    g.beginPath()
    g.arc(0, 0, h * 0.09, 0, Math.PI * 2)
    g.fillStyle = PAPER
    g.fill()
    g.stroke()
    for (let k = 0; k < 6; k++) {
      g.rotate(Math.PI / 3)
      g.fillStyle = INK
      g.fillRect(-line * 0.5, -h * 0.085, line, h * 0.04)
    }
    g.restore()
  }
  // trapézio de baixo, com os furos
  g.beginPath()
  g.moveTo(-w * 0.3, h / 2)
  g.lineTo(-w * 0.24, h * 0.3)
  g.lineTo(w * 0.24, h * 0.3)
  g.lineTo(w * 0.3, h / 2)
  g.fillStyle = '#3b342e'
  g.fill()
  g.stroke()
  g.restore()
}

/** desenha a figura com o "quique" da dança (achata e estica em volta dos pés) */
function danced(c: EffectContext, pulse: number, sway: number, draw: () => void) {
  const g = c.ctx
  const [fx, fy] = c.toScreen(0.5, 0.97)
  g.save()
  g.translate(fx, fy)
  g.rotate(sway)
  g.scale(1 + pulse * 0.035, 1 - pulse * 0.04)
  g.translate(-fx, -fy)
  draw()
  g.restore()
}

const starlord: EffectFactory = (c) => {
  const rand = seeded(1988)
  const mask = c.createMask(0.25)
  const tape: [number, number] = [0.5, 0.97]
  const notes = Array.from({ length: 14 }, (_, i) => ({
    t: START + (i / 14) * (END - START + 0.1),
    dx: (rand() - 0.5) * 0.9,
    glyph: NOTES[i % NOTES.length],
    wob: rand() * Math.PI * 2,
  }))

  return {
    duration: 3,
    render(p, c) {
      const g = c.ctx
      const u1 = c.unit
      const line = Math.max(1.5, u1 * 0.004)
      const music = range(p, START, END)
      const beatPos = music * BEATS
      const beatIdx = Math.min(BEATS, Math.floor(beatPos))
      const inBeat = beatPos - beatIdx
      // cada batida: um soco rápido que decai
      const pulse = music > 0 && music < 1 ? Math.exp(-inBeat * 6) : 0
      const sway = music > 0 && music < 1 ? Math.sin(beatPos * Math.PI) * 0.025 : 0
      // raio pintado: sobe em degraus, um por batida
      const step = (beatIdx + smoothstep(0, 0.35, inBeat)) / BEATS
      const radius = step * 1.3

      danced(c, pulse, sway, () => {
        c.drawPrint(1 - range(p, 0.86, 1))
        if (radius > 0) {
          mask.clear()
          const m = mask.ctx
          const mw = mask.canvas.width
          m.fillStyle = '#fff'
          m.beginPath()
          m.arc(tape[0] * mw, tape[1] * mw * 1.4, radius * mw, 0, Math.PI * 2)
          m.fill()
          c.drawRealMasked(mask)
        }
        c.drawReal(range(p, 0.8, 0.92))
      })

      // anéis de som: o da batida atual se expande e some
      const [tx, ty] = c.toScreen(...tape)
      if (music > 0 && music < 1) {
        const ringR = (beatIdx + inBeat * 1.1) / BEATS * 1.3 * u1
        g.save()
        g.globalAlpha = 1 - inBeat
        g.beginPath()
        g.arc(tx, ty, ringR, 0, Math.PI * 2)
        g.lineWidth = Math.max(8, u1 * 0.022)
        g.strokeStyle = INK
        g.stroke()
        g.lineWidth = Math.max(4, u1 * 0.012)
        g.strokeStyle = ORANGE
        g.stroke()
        g.restore()
      }

      // notas musicais subindo da fita
      g.save()
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.lineJoin = 'round'
      for (const n of notes) {
        const age = range(p, n.t, n.t + 0.28)
        if (age <= 0 || age >= 1) continue
        const x = tx + (n.dx * age + Math.sin(age * 8 + n.wob) * 0.04) * u1
        const y = ty - age * u1 * 0.95
        const size = u1 * 0.1
        g.globalAlpha = 1 - range(age, 0.7, 1)
        g.font = `bold ${size}px "Segoe UI Symbol", "Noto Music", serif`
        g.lineWidth = size * 0.16
        g.strokeStyle = INK
        g.strokeText(n.glyph, x, y)
        g.fillStyle = ORANGE
        g.fillText(n.glyph, x, y)
      }
      g.restore()

      // a fita: entra pulando, toca, sai no fim
      const show = smoothstep(0.02, 0.1, p) * (1 - range(p, 0.84, 0.94))
      if (show > 0) {
        g.save()
        g.globalAlpha = show
        const w = u1 * 0.46 * (0.6 + 0.4 * show) * (1 + pulse * 0.06)
        cassette(g, tx, ty - u1 * 0.02, w, c.reduced ? 0 : c.time * 6, line)
        g.restore()
      }

      const [sx, sy] = c.toScreen(1.02, Math.max(0.1, c.anchors.head[1] + 0.04))
      sfx(c, 'OOGA-CHAKA!', sx, sy, u1 * 0.11, range(p, 0.14, 0.96), {
        rotate: -0.1,
        fill: CREAM,
        burstFill: c.palette.accent2,
        seed: 1988,
      })
    },
  }
}

export default starlord
