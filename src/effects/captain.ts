import { range, seeded, smoothstep } from '@/lib/utils'
import { INK, PAPER, sfx } from './comic'
import type { EffectContext, EffectFactory } from './types'

/**
 * Capitão América — o escudo atravessa a página girando, da esquerda para a
 * direita, e funciona como uma cortina: tudo que fica para trás dele já está
 * em cores. Acabamento de quadrinho: linhas de movimento atrás do escudo e
 * "KLANG!" quando ele passa pelo peito.
 */

const RED = '#d0212b'
const BLUE = '#1d3f8f'

/** Escudo de quadrinho: anéis vermelho/branco, centro azul com estrela, contorno de tinta. */
function drawShield(g: CanvasRenderingContext2D, x: number, y: number, r: number, spin: number, squash: number) {
  g.save()
  g.translate(x, y)
  g.scale(squash, 1)
  // sombra dura deslocada
  g.fillStyle = INK
  g.beginPath()
  g.arc(r * 0.08, r * 0.1, r, 0, Math.PI * 2)
  g.fill()

  const rings: [number, string][] = [
    [1, RED],
    [0.8, PAPER],
    [0.6, RED],
    [0.4, BLUE],
  ]
  g.lineWidth = Math.max(2, r * 0.04)
  g.strokeStyle = INK
  for (const [k, color] of rings) {
    g.beginPath()
    g.arc(0, 0, r * k, 0, Math.PI * 2)
    g.fillStyle = color
    g.fill()
    g.stroke()
  }

  // estrela girando
  g.rotate(spin)
  g.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 === 0 ? r * 0.36 : r * 0.145
    g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
  }
  g.closePath()
  g.fillStyle = PAPER
  g.fill()
  g.stroke()

  // reflexo metálico
  g.rotate(-spin)
  g.strokeStyle = 'rgba(255,255,255,0.7)'
  g.lineWidth = r * 0.06
  g.lineCap = 'round'
  g.beginPath()
  g.arc(0, 0, r * 0.9, Math.PI * 1.1, Math.PI * 1.4)
  g.stroke()
  g.restore()
}

/** Linhas de movimento horizontais atrás do escudo. */
function motionLines(c: EffectContext, x: number, y: number, r: number, alpha: number, seed: number) {
  if (alpha <= 0) return
  const g = c.ctx
  const rand = seeded(seed)
  g.save()
  g.strokeStyle = INK
  g.lineCap = 'round'
  for (let i = 0; i < 9; i++) {
    const dy = (rand() - 0.5) * r * 1.9
    const len = r * (1.5 + rand() * 2.5)
    const start = x - r * (0.6 + rand() * 0.5)
    g.globalAlpha = alpha * (0.5 + rand() * 0.5)
    g.lineWidth = Math.max(2, r * (0.03 + rand() * 0.05))
    g.beginPath()
    g.moveTo(start, y + dy)
    g.lineTo(start - len, y + dy)
    g.stroke()
  }
  g.restore()
}

const captain: EffectFactory = (c) => {
  const mask = c.createMask(0.25)
  const [cu, cv] = c.anchors.chest

  return {
    duration: 2.2,
    render(p, c) {
      const g = c.ctx
      const r = c.unit * 0.24
      // trajeto: entra pela esquerda da tela, sai pela direita, com leve arco
      const travel = smoothstep(0.06, 0.82, p)
      const x = -r * 1.4 + travel * (c.width + r * 2.8)
      const [, chestY] = c.toScreen(cu, cv)
      const y = chestY + Math.sin(travel * Math.PI) * -c.unit * 0.06

      c.drawPrint(1 - range(p, 0.8, 1))

      // cortina: tudo à esquerda do escudo já está em cores
      const edgeU = (x - c.fig.x) / c.fig.w
      mask.clear()
      const m = mask.ctx
      m.fillStyle = '#fff'
      const w = mask.canvas.width
      const cover = range(p, 0.82, 1)
      m.fillRect(0, 0, Math.max(0, Math.min(w, edgeU * w)) + cover * w, mask.canvas.height)
      c.drawRealMasked(mask)

      // borda da cortina em traço de tinta
      if (travel > 0 && travel < 1 && x > c.fig.x && x < c.fig.x + c.fig.w) {
        g.save()
        g.strokeStyle = INK
        g.lineWidth = Math.max(3, c.unit * 0.008)
        g.beginPath()
        g.moveTo(x, c.fig.y)
        g.lineTo(x, c.fig.y + c.fig.h)
        g.stroke()
        g.restore()
      }

      const moving = travel > 0 && travel < 1
      if (moving) {
        motionLines(c, x, y, r, Math.sin(travel * Math.PI) * 0.9 + 0.1, Math.floor(c.time * 12))
        // giro + achatamento de perspectiva, como um disco arremessado
        drawShield(g, x, y, r, c.reduced ? 0 : p * 18, 0.78 + Math.sin(p * 10) * 0.06)
      }

      // KLANG! quando o escudo cruza o peito, com tremor curto
      const [chestX] = c.toScreen(cu, cv)
      const hitT = c.width > 0 ? (chestX + r * 1.4) / (c.width + r * 2.8) : 0.5
      // inverte o smoothstep do trajeto (busca binária) para achar o p do impacto
      let lo = 0.06
      let hi = 0.82
      for (let i = 0; i < 20; i++) {
        const mid = (lo + hi) / 2
        if (smoothstep(0.06, 0.82, mid) < hitT) lo = mid
        else hi = mid
      }
      const hitP = lo
      const after = range(p, hitP - 0.02, hitP + 0.18)
      if (after > 0 && after < 1) c.shake((1 - after) * 0.5)
      const [sx, sy] = c.toScreen(Math.min(0.78, cu + 0.22), Math.max(0.1, cv - 0.14))
      sfx(c, 'KLANG!', sx, sy, c.unit * 0.15, range(p, hitP - 0.02, hitP + 0.42), {
        rotate: 0.12,
        fill: c.palette.accent2,
        burstFill: PAPER,
        seed: 31,
      })
    },
  }
}

export default captain
