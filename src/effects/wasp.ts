import { range, seeded, smoothstep } from '@/lib/utils'
import { INK, sfx } from './comic'
import type { EffectFactory } from './types'

/**
 * Vespa — uma vespinha voa em zigue-zague por cima da figura; o rastro do voo
 * pinta o traje colorido e engrossa até cobrir tudo. A cada curva sai uma
 * ferroada bioelétrica amarela. Acabamento de quadrinho: rastro tracejado,
 * raios com contorno de tinta e "BZZZT!".
 */

const STOPS = 12
const YELLOW = '#ffd23f'
const WING = 'rgba(214, 240, 255, 0.75)'

// PNG opcional: public/effects/vespa.png (de lado, olhando para a direita, fundo transparente)
const custom = new Image()
custom.src = '/effects/vespa.png'

/**
 * Vespa de quadrinho vista de lado, olhando para +x: abdômen listrado com
 * ferrão, tórax escuro, cabeça com olho grande e antenas, quatro asas
 * translúcidas batendo e patinhas. Tudo com contorno de tinta.
 */
function drawWasp(g: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, s: number, t: number, unit: number) {
  g.save()
  g.translate(x, y)
  // vira de lado conforme a direção do voo, sem ficar de cabeça para baixo
  const left = dx < 0
  if (left) g.scale(-1, 1)
  g.rotate(Math.atan2(dy, Math.abs(dx) || 1) * 0.5)

  if (custom.complete && custom.naturalWidth > 0) {
    const w = s * 3.2
    const h = (w * custom.naturalHeight) / custom.naturalWidth
    g.drawImage(custom, -w * 0.55, -h / 2, w, h)
    g.restore()
    return
  }

  const line = Math.max(1.5, unit * 0.0035)
  const flap = Math.sin(t * 42)
  g.lineJoin = 'round'
  g.lineCap = 'round'
  g.strokeStyle = INK

  // linhas de movimento atrás
  g.lineWidth = line
  for (const k of [-0.35, 0, 0.35]) {
    g.beginPath()
    g.moveTo(-s * 2.1, s * k)
    g.lineTo(-s * (2.7 + Math.abs(k)), s * k)
    g.stroke()
  }

  /** asa: elipse comprida com nervuras, presa no alto do tórax */
  const wing = (angle: number, len: number, alpha: number) => {
    g.save()
    g.translate(s * 0.1, -s * 0.3)
    g.rotate(angle)
    g.globalAlpha *= alpha
    g.beginPath()
    g.ellipse(-len / 2, 0, len / 2, s * 0.26, 0, 0, Math.PI * 2)
    g.fillStyle = WING
    g.fill()
    g.lineWidth = line
    g.stroke()
    g.beginPath()
    g.moveTo(0, 0)
    g.quadraticCurveTo(-len * 0.5, -s * 0.08, -len * 0.92, 0)
    g.moveTo(-len * 0.35, -s * 0.03)
    g.lineTo(-len * 0.55, s * 0.18)
    g.lineWidth = line * 0.6
    g.stroke()
    g.restore()
  }
  // par de trás (atrás do corpo)
  wing(-0.55 + flap * 0.45, s * 1.5, 0.85)
  wing(-0.25 + flap * 0.35, s * 1.15, 0.85)

  // patinhas penduradas
  g.lineWidth = line
  for (const k of [-0.05, 0.15, 0.35]) {
    g.beginPath()
    g.moveTo(s * k, s * 0.2)
    g.lineTo(s * (k - 0.12), s * 0.55)
    g.lineTo(s * (k - 0.02), s * 0.78)
    g.stroke()
  }

  // abdômen listrado
  g.save()
  g.translate(-s * 0.85, s * 0.18)
  g.rotate(0.28)
  g.beginPath()
  g.ellipse(0, 0, s * 0.85, s * 0.48, 0, 0, Math.PI * 2)
  g.fillStyle = YELLOW
  g.fill()
  g.save()
  g.clip()
  g.fillStyle = INK
  for (const bx of [0.32, -0.08, -0.48]) {
    g.beginPath()
    g.ellipse(s * bx, 0, s * 0.11, s * 0.6, 0, 0, Math.PI * 2)
    g.fill()
  }
  // brilho
  g.strokeStyle = 'rgba(255,255,255,0.7)'
  g.lineWidth = line * 1.4
  g.beginPath()
  g.ellipse(s * 0.1, -s * 0.2, s * 0.5, s * 0.12, 0, Math.PI * 1.1, Math.PI * 1.9)
  g.stroke()
  g.restore()
  g.lineWidth = line * 1.4
  g.beginPath()
  g.ellipse(0, 0, s * 0.85, s * 0.48, 0, 0, Math.PI * 2)
  g.stroke()
  // ferrão
  g.beginPath()
  g.moveTo(-s * 0.8, -s * 0.08)
  g.lineTo(-s * 1.12, s * 0.02)
  g.lineTo(-s * 0.8, s * 0.1)
  g.closePath()
  g.fillStyle = INK
  g.fill()
  g.restore()

  // cintura, tórax e cabeça
  g.fillStyle = INK
  g.beginPath()
  g.arc(-s * 0.12, s * 0.02, s * 0.12, 0, Math.PI * 2)
  g.fill()
  g.beginPath()
  g.ellipse(s * 0.18, -s * 0.02, s * 0.36, s * 0.31, 0, 0, Math.PI * 2)
  g.fillStyle = '#3a2f1c'
  g.fill()
  g.lineWidth = line * 1.4
  g.stroke()
  g.fillStyle = YELLOW
  g.beginPath()
  g.ellipse(s * 0.2, -s * 0.18, s * 0.14, s * 0.07, 0, 0, Math.PI * 2)
  g.fill()

  g.beginPath()
  g.arc(s * 0.66, -s * 0.06, s * 0.29, 0, Math.PI * 2)
  g.fillStyle = YELLOW
  g.fill()
  g.lineWidth = line * 1.4
  g.stroke()
  // olho grande
  g.beginPath()
  g.ellipse(s * 0.66, -s * 0.12, s * 0.15, s * 0.21, 0.2, 0, Math.PI * 2)
  g.fillStyle = INK
  g.fill()
  g.fillStyle = '#fff'
  g.beginPath()
  g.arc(s * 0.7, -s * 0.2, s * 0.05, 0, Math.PI * 2)
  g.fill()
  // mandíbula
  g.lineWidth = line
  g.beginPath()
  g.moveTo(s * 0.86, s * 0.12)
  g.quadraticCurveTo(s * 0.98, s * 0.2, s * 0.9, s * 0.28)
  g.stroke()
  // antenas enroladas para a frente
  for (const k of [0, 0.12]) {
    g.beginPath()
    g.moveTo(s * (0.72 + k * 0.3), -s * 0.32)
    g.quadraticCurveTo(s * (0.9 + k), -s * (0.85 - k), s * (1.22 + k), -s * (0.62 - k))
    g.stroke()
  }

  // par da frente (por cima do corpo)
  wing(-0.75 + flap * 0.5, s * 1.55, 0.9)
  g.restore()
}

const wasp: EffectFactory = (c) => {
  const rand = seeded(1418)
  // zigue-zague de cima para baixo, alternando os lados
  const path: [number, number][] = Array.from({ length: STOPS }, (_, i) => [
    i % 2 === 0 ? 0.15 + rand() * 0.2 : 0.65 + rand() * 0.2,
    0.02 + (i / (STOPS - 1)) * 0.96,
  ])
  const segLen = path.slice(1).map((q, i) => Math.hypot(q[0] - path[i][0], (q[1] - path[i][1]) * 1.4))
  const total = segLen.reduce((a, b) => a + b, 0)
  const mask = c.createMask(0.25)

  /** ponto do caminho na fração t (0..1) e o índice do trecho */
  const at = (t: number): [number, number, number] => {
    let d = t * total
    for (let i = 0; i < segLen.length; i++) {
      if (d <= segLen[i] || i === segLen.length - 1) {
        const k = Math.min(1, d / segLen[i])
        return [path[i][0] + (path[i + 1][0] - path[i][0]) * k, path[i][1] + (path[i + 1][1] - path[i][1]) * k, i]
      }
      d -= segLen[i]
    }
    return [...path[STOPS - 1], STOPS - 2]
  }

  return {
    duration: 2.6,
    render(p, c) {
      const g = c.ctx
      const fly = smoothstep(0.04, 0.66, p)
      const widen = smoothstep(0.5, 0.86, p)
      const [wu, wv, seg] = at(fly)

      c.drawPrint(1 - range(p, 0.88, 1))

      // rastro: traço grosso no espaço da figura, revelando o traje
      mask.clear()
      const m = mask.ctx
      const mw = mask.canvas.width
      m.strokeStyle = '#fff'
      m.lineCap = 'round'
      m.lineJoin = 'round'
      m.lineWidth = (0.09 + widen * 0.9) * mw
      m.beginPath()
      m.moveTo(path[0][0] * mw, path[0][1] * mw * 1.4)
      for (let i = 1; i <= seg; i++) m.lineTo(path[i][0] * mw, path[i][1] * mw * 1.4)
      m.lineTo(wu * mw, wv * mw * 1.4)
      m.stroke()
      c.drawRealMasked(mask)
      c.drawReal(range(p, 0.8, 0.92))

      const flight = 1 - range(p, 0.66, 0.78)
      if (flight > 0) {
        g.save()
        g.globalAlpha = flight
        // linha de voo tracejada logo atrás da vespa
        g.setLineDash([c.unit * 0.012, c.unit * 0.012])
        g.lineWidth = Math.max(1.5, c.unit * 0.004)
        g.strokeStyle = INK
        g.beginPath()
        const [tu, tv] = at(Math.max(0, fly - 0.08))
        const [x0, y0] = c.toScreen(tu, tv)
        g.moveTo(x0, y0)
        for (let k = 1; k <= 8; k++) {
          const [u, v] = at(Math.max(0, fly - 0.08 + (k / 8) * 0.08))
          const [x, y] = c.toScreen(u, v)
          g.lineTo(x, y)
        }
        g.stroke()
        g.setLineDash([])

        // ferroada: raio curtinho saindo da última curva
        const corner = path[seg]
        const since = fly * total - segLen.slice(0, seg).reduce((a, b) => a + b, 0)
        if (seg > 0 && since < segLen[seg] * 0.6) {
          const [cx, cy] = c.toScreen(corner[0], corner[1])
          const dir = corner[0] < 0.5 ? 1 : -1
          const L = c.unit * 0.09
          g.beginPath()
          g.moveTo(cx, cy)
          g.lineTo(cx + dir * L * 0.4, cy - L * 0.2)
          g.lineTo(cx + dir * L * 0.55, cy + L * 0.05)
          g.lineTo(cx + dir * L, cy - L * 0.1)
          g.lineJoin = 'miter'
          g.lineWidth = Math.max(4, c.unit * 0.012)
          g.strokeStyle = INK
          g.stroke()
          g.lineWidth = Math.max(2, c.unit * 0.006)
          g.strokeStyle = YELLOW
          g.stroke()
        }

        // a vespinha, virada para onde está voando
        const [x, y] = c.toScreen(wu, wv)
        const [pu, pv] = at(Math.max(0, fly - 0.01))
        const [px, py] = c.toScreen(pu, pv)
        drawWasp(g, x, y, x - px, y - py, c.unit * 0.045, c.reduced ? 0.5 : c.time, c.unit)
        g.restore()
      }

      const [sx, sy] = c.toScreen(0.78, Math.max(0.1, c.anchors.head[1]))
      sfx(c, 'BZZZT!', sx, sy, c.unit * 0.13, range(p, 0.12, 0.9), {
        rotate: 0.1,
        fill: YELLOW,
        burstFill: c.palette.accent,
        seed: 1418,
      })
    },
  }
}

export default wasp
