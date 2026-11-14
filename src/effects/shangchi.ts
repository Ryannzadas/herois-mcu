import { range, smoothstep } from '@/lib/utils'
import { INK, sfx } from './comic'
import type { EffectContext, EffectFactory } from './types'

/**
 * Shang-Chi — o dragão Grande Protetor, de Ta Lo, sobe em espiral pela
 * figura, passando ora por trás, ora pela frente do corpo. O rastro de água
 * do dragão pinta o traje colorido e engrossa até cobrir tudo. Depois, os
 * Dez Anéis acendem e giram em órbita em volta do peito e se juntam em duas
 * pilhas de cinco, como nos antebraços do filme.
 * Acabamento de quadrinho: escamas com contorno de tinta e "SHWAAA!".
 */

const TURNS = 2.2
const BODY = 0.3 // comprimento do corpo, em fração do caminho
const SEGMENTS = 34
const WATER = '#5fd4d0'
const WATER_DARK = '#2a8f9a'
const STEEL = '#2c56ad'
const STEEL_LIGHT = '#16264f'
const GLOW = '#6fc3ff'

// PNG opcional: public/effects/aneis.png (um anel visto de frente, levemente inclinado, fundo transparente)
const custom = new Image()
custom.src = '/effects/aneis.png'

/**
 * Um dos Dez Anéis: aro grosso de metal escuro visto em perspectiva, com o
 * furo no meio, gravações azuis acesas e halo. `w` é a largura do aro;
 * `tilt` (0..1) achata a elipse; `glow` (0..1) controla o brilho.
 */
function ring(g: CanvasRenderingContext2D, x: number, y: number, w: number, tilt: number, glow: number, line: number, spin: number) {
  const rx = w / 2
  const ry = rx * tilt
  g.save()
  g.translate(x, y)
  if (custom.complete && custom.naturalWidth > 0) {
    const h = (w * custom.naturalHeight) / custom.naturalWidth
    g.drawImage(custom, -w / 2, -h / 2 * (tilt / 0.35), w, h * (tilt / 0.35))
    g.restore()
    return
  }
  const band = rx * 0.42 // espessura do aro
  // halo
  if (glow > 0) {
    g.shadowColor = GLOW
    g.shadowBlur = w * 0.5 * glow
  }
  // aro (anel = elipse de fora menos a de dentro)
  g.beginPath()
  g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
  g.ellipse(0, 0, rx - band, Math.max(0.5, ry - band * tilt), 0, 0, Math.PI * 2, true)
  g.fillStyle = STEEL
  g.fill('evenodd')
  g.shadowBlur = 0
  // espessura (lado de baixo do aro, um pouco mais claro)
  g.beginPath()
  g.ellipse(0, band * 0.25, rx, ry, 0, 0, Math.PI)
  g.lineWidth = band * 0.35
  g.strokeStyle = STEEL_LIGHT
  g.stroke()
  // gravações acesas: tracinhos ao longo do aro, girando
  const n = 22
  g.lineCap = 'round'
  g.lineWidth = Math.max(1, band * 0.28)
  for (let i = 0; i < n; i++) {
    const a = spin + (i / n) * Math.PI * 2
    const a2 = a + 0.1
    const mr = rx - band / 2
    const mry = ry - (band / 2) * tilt
    g.beginPath()
    g.moveTo(Math.cos(a) * mr, Math.sin(a) * mry)
    g.lineTo(Math.cos(a2) * mr, Math.sin(a2) * mry)
    g.strokeStyle = `rgba(190, 232, 255, ${0.45 + 0.55 * glow})`
    g.stroke()
  }
  // contorno de tinta
  g.lineWidth = line
  g.strokeStyle = INK
  g.beginPath()
  g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
  g.stroke()
  g.beginPath()
  g.ellipse(0, 0, rx - band, Math.max(0.5, ry - band * tilt), 0, 0, Math.PI * 2)
  g.stroke()
  // brilho especular
  g.beginPath()
  g.ellipse(0, 0, rx - band * 0.35, ry - band * 0.35 * tilt, 0, Math.PI * 1.15, Math.PI * 1.45)
  g.lineWidth = Math.max(1, band * 0.22)
  g.strokeStyle = 'rgba(255,255,255,0.7)'
  g.stroke()
  g.restore()
}

/** cabeça de dragão estilizada, olhando para +x */
function dragonHead(g: CanvasRenderingContext2D, s: number, line: number, accent: string) {
  g.lineJoin = 'round'
  g.strokeStyle = INK
  // chifres
  for (const k of [-1, 1]) {
    g.beginPath()
    g.moveTo(-s * 0.2, k * s * 0.25)
    g.quadraticCurveTo(-s * 0.7, k * s * 0.75, -s * 1.1, k * s * 0.6)
    g.lineWidth = line * 2.2
    g.stroke()
    g.lineWidth = line * 1.1
    g.strokeStyle = '#e8d9a8'
    g.stroke()
    g.strokeStyle = INK
  }
  // crina
  for (let i = 0; i < 5; i++) {
    g.beginPath()
    g.moveTo(-s * 0.35 - i * s * 0.12, 0)
    g.lineTo(-s * 0.55 - i * s * 0.14, (i % 2 ? 1 : -1) * s * 0.55)
    g.lineWidth = line
    g.stroke()
  }
  // focinho
  g.beginPath()
  g.moveTo(s * 0.95, 0)
  g.quadraticCurveTo(s * 0.7, -s * 0.4, s * 0.1, -s * 0.44)
  g.quadraticCurveTo(-s * 0.48, -s * 0.42, -s * 0.48, 0)
  g.quadraticCurveTo(-s * 0.48, s * 0.42, s * 0.1, s * 0.44)
  g.quadraticCurveTo(s * 0.7, s * 0.4, s * 0.95, 0)
  g.fillStyle = WATER
  g.fill()
  g.lineWidth = line * 1.3
  g.stroke()
  // narinas e olhos
  for (const k of [-1, 1]) {
    g.beginPath()
    g.arc(s * 0.78, k * s * 0.1, s * 0.04, 0, Math.PI * 2)
    g.fillStyle = INK
    g.fill()
    g.beginPath()
    g.ellipse(s * 0.15, k * s * 0.22, s * 0.13, s * 0.09, 0, 0, Math.PI * 2)
    g.fillStyle = accent
    g.fill()
    g.lineWidth = line
    g.stroke()
  }
  // bigodes
  g.lineWidth = line
  for (const k of [-1, 1]) {
    g.beginPath()
    g.moveTo(s * 0.7, k * s * 0.22)
    g.bezierCurveTo(s * 1.15, k * s * 0.6, s * 0.6, k * s * 0.95, s * 1.3, k * s * 1.2)
    g.stroke()
  }
}

const shangchi: EffectFactory = (c) => {
  const mask = c.createMask(0.25)

  // área real da silhueta (a pose pode ocupar só parte da imagem)
  let minU = 1, maxU = 0, minV = 1, maxV = 0
  const pts = c.points
  for (let i = 0; i < pts.length; i += 2) {
    minU = Math.min(minU, pts[i])
    maxU = Math.max(maxU, pts[i])
    minV = Math.min(minV, pts[i + 1])
    maxV = Math.max(maxV, pts[i + 1])
  }
  if (maxU <= minU) [minU, maxU, minV, maxV] = [0, 1, 0, 1]
  const midU = (minU + maxU) / 2
  const halfU = (maxU - minU) / 2
  const midV = (minV + maxV) / 2
  const hgt = maxV - minV

  /** ponto do caminho em espiral (u, v) e a profundidade (z > 0 = na frente do corpo) */
  const spiral = (s: number): [number, number, number] => {
    const a = s * TURNS * Math.PI * 2 - Math.PI / 2
    const r = (halfU + 0.06) * (0.9 + Math.sin(s * Math.PI) * 0.15)
    return [midU + Math.cos(a) * r, maxV + 0.04 - s * (hgt + 0.12), Math.sin(a)]
  }

  /** desenha os gomos do corpo cuja profundidade bate com `front` */
  const body = (c: EffectContext, head: number, front: boolean, alpha: number) => {
    const g = c.ctx
    const u1 = c.unit
    const segs: [number, number, number, number][] = []
    for (let i = SEGMENTS; i >= 0; i--) {
      const s = head - (i / SEGMENTS) * BODY
      if (s < 0 || s > 1) continue
      const [u, v, z] = spiral(s)
      if (z >= 0 !== front) continue
      const [x, y] = c.toScreen(u, v)
      // grosso perto da cabeça, fino no rabo; um pouco menor quando está atrás
      const r = u1 * (0.03 + 0.045 * (1 - i / SEGMENTS)) * (0.85 + (0.15 * (z + 1)) / 2)
      segs.push([x, y, r, i])
    }
    g.save()
    g.globalAlpha = alpha
    for (const [x, y, r] of segs) {
      g.beginPath()
      g.arc(x, y, r + Math.max(2, u1 * 0.005), 0, Math.PI * 2)
      g.fillStyle = INK
      g.fill()
    }
    for (const [x, y, r, i] of segs) {
      g.beginPath()
      g.arc(x, y, r, 0, Math.PI * 2)
      g.fillStyle = i % 2 ? WATER : '#7fe3dc'
      g.fill()
      // escamas
      g.strokeStyle = WATER_DARK
      g.lineWidth = Math.max(1, r * 0.14)
      g.beginPath()
      g.arc(x, y + r * 0.15, r * 0.62, Math.PI * 1.1, Math.PI * 1.9)
      g.stroke()
      g.beginPath()
      g.arc(x, y + r * 0.45, r * 0.4, Math.PI * 1.15, Math.PI * 1.85)
      g.stroke()
    }
    g.restore()
  }

  /**
   * Posição de cada anel: primeiro em órbita inclinada em volta do peito
   * (com profundidade), depois em duas pilhas de cinco, uma de cada lado.
   */
  const ringsAt = (c: EffectContext, p: number) => {
    const appear = range(p, 0.66, 0.8)
    const stack = smoothstep(0.84, 0.94, p)
    const spin = (c.reduced ? 0 : c.time * 1.4) + p * 6
    const [cu, cv] = c.anchors.chest
    return Array.from({ length: 10 }, (_, i) => {
      const on = range(appear, i * 0.06, i * 0.06 + 0.4)
      const a = spin + (i / 10) * Math.PI * 2
      const ou = cu + Math.cos(a) * (halfU + 0.12)
      const ov = cv + Math.sin(a) * 0.05
      const oz = Math.sin(a)
      // pilhas: cinco à esquerda e cinco à direita, de cima para baixo
      const side = i < 5 ? -1 : 1
      const su = midU + side * (halfU + 0.1)
      const sv = midV - 0.08 + (i % 5) * 0.05
      return {
        u: ou + (su - ou) * stack,
        v: ov + (sv - ov) * stack,
        z: oz * (1 - stack) + stack, // empilhados ficam na frente
        on,
        tilt: 0.32 + (1 - stack) * 0.08,
      }
    })
  }

  const drawRings = (c: EffectContext, list: ReturnType<typeof ringsAt>, front: boolean, alpha: number) => {
    const g = c.ctx
    const u1 = c.unit
    const line = Math.max(1.5, u1 * 0.004)
    const spin = c.reduced ? 0 : c.time * 3
    g.save()
    g.globalAlpha = alpha
    for (const r of list) {
      if (r.on <= 0 || r.z >= 0 !== front) continue
      const [x, y] = c.toScreen(r.u, r.v)
      const w = u1 * 0.17 * (0.6 + 0.4 * r.on) * (0.85 + 0.15 * (r.z + 1) / 2)
      ring(g, x, y, w, r.tilt, r.on * (front ? 1 : 0.6), line, spin)
    }
    g.restore()
  }

  return {
    duration: 3.2,
    render(p, c) {
      const g = c.ctx
      const u1 = c.unit
      const line = Math.max(1.5, u1 * 0.004)
      const head = smoothstep(0.04, 0.62, p) * (1 + BODY) // passa do topo para o rabo também sair
      const widen = smoothstep(0.4, 0.78, p)
      const dragonA = 1 - range(p, 0.66, 0.78)
      const [hu, hv, hz] = spiral(Math.min(1, head))
      const ringsA = 1 - range(p, 0.95, 1)
      const rings = ringsAt(c, p)

      // atrás da figura: parte de trás do dragão e dos anéis
      if (dragonA > 0) body(c, head, false, dragonA)
      if (ringsA > 0) drawRings(c, rings, false, ringsA)

      c.drawPrint(1 - range(p, 0.82, 0.95))

      // rastro de água: a espiral percorrida pinta o traje
      mask.clear()
      const m = mask.ctx
      const mw = mask.canvas.width
      m.strokeStyle = '#fff'
      m.lineCap = 'round'
      m.lineJoin = 'round'
      m.lineWidth = (0.16 + widen * 0.9) * mw
      const end = Math.min(1, head)
      if (end > 0) {
        m.beginPath()
        for (let k = 0; k <= 80; k++) {
          const [u, v] = spiral((k / 80) * end)
          if (k === 0) m.moveTo(u * mw, v * mw * 1.4)
          else m.lineTo(u * mw, v * mw * 1.4)
        }
        m.stroke()
      }
      c.drawRealMasked(mask)
      c.drawReal(range(p, 0.74, 0.88))

      // na frente: o resto do dragão, a cabeça e os anéis
      if (dragonA > 0) {
        body(c, head, true, dragonA)
        if (head <= 1) {
          const [x, y] = c.toScreen(hu, hv)
          const [pu, pv] = spiral(Math.max(0, head - 0.01))
          const [px, py] = c.toScreen(pu, pv)
          g.save()
          g.globalAlpha = dragonA * (hz >= 0 ? 1 : 0.8)
          g.translate(x, y)
          g.rotate(Math.atan2(y - py, x - px))
          dragonHead(g, u1 * 0.1, line, c.palette.accent2)
          g.restore()
        }
      }
      if (ringsA > 0) drawRings(c, rings, true, ringsA)

      const [sx, sy] = c.toScreen(maxU + 0.18, Math.max(0.1, minV + 0.05))
      sfx(c, 'SHWAAA!', sx, sy, u1 * 0.12, range(p, 0.2, 0.96), {
        rotate: -0.1,
        fill: '#e8fbff',
        burstFill: c.palette.accent,
        seed: 2021,
      })
    },
  }
}

export default shangchi
