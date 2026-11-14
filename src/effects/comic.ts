import { clamp, seeded } from '@/lib/utils'
import type { EffectContext } from './types'

/**
 * Acabamento de quadrinho compartilhado pelos efeitos:
 * onomatopeias, explosões em estrela e linhas de ação.
 * Todos desenham em coordenadas de tela (pixels CSS).
 */

export const INK = '#141210'
export const PAPER = '#fbf6ea'
export const SFX_FONT = 'Bangers'

/** Garante a fonte das onomatopeias antes do primeiro quadro. */
export async function loadComicFonts() {
  try {
    await document.fonts.load(`400 64px "${SFX_FONT}"`)
  } catch {
    /* segue com a fonte de fallback */
  }
}

/** Explosão em estrela ("burst") com pontas irregulares. */
export function burst(
  g: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  opts: { spikes?: number; inner?: number; seed?: number; fill: string; stroke?: string; line?: number },
) {
  const spikes = opts.spikes ?? 14
  const inner = opts.inner ?? 0.62
  const rand = seeded(opts.seed ?? 7)
  g.beginPath()
  for (let i = 0; i < spikes * 2; i++) {
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2
    const rr = i % 2 === 0 ? r * (0.85 + rand() * 0.3) : r * inner * (0.9 + rand() * 0.2)
    const px = x + Math.cos(a) * rr
    const py = y + Math.sin(a) * rr * 0.8
    if (i === 0) g.moveTo(px, py)
    else g.lineTo(px, py)
  }
  g.closePath()
  g.fillStyle = opts.fill
  g.fill()
  if (opts.stroke) {
    g.lineJoin = 'miter'
    g.lineWidth = opts.line ?? Math.max(3, r * 0.04)
    g.strokeStyle = opts.stroke
    g.stroke()
  }
}

/**
 * Onomatopeia com contorno grosso e sombra deslocada.
 * `t` (0..1) controla a entrada: cresce com overshoot e some no fim.
 */
export function sfx(
  c: EffectContext,
  text: string,
  x: number,
  y: number,
  size: number,
  t: number,
  opts: { rotate?: number; fill?: string; burstFill?: string; seed?: number } = {},
) {
  if (t <= 0 || t >= 1) return
  const g = c.ctx
  const enter = clamp(t / 0.25)
  const leave = clamp((1 - t) / 0.2)
  // overshoot elástico na entrada
  const pop = enter < 1 ? 1 + Math.sin(enter * Math.PI) * 0.35 - (1 - enter) * 0.6 : 1
  const s = Math.max(0.01, pop)
  const wobble = c.reduced ? 0 : Math.sin(c.time * 30) * 0.015

  g.save()
  g.globalAlpha = leave
  g.translate(x, y)
  g.rotate((opts.rotate ?? -0.12) + wobble)
  g.scale(s, s)

  if (opts.burstFill) {
    burst(g, 0, 0, size * text.length * 0.36, {
      fill: opts.burstFill,
      stroke: INK,
      seed: opts.seed,
      spikes: 16,
      line: size * 0.07,
    })
  }

  g.font = `400 ${size}px "${SFX_FONT}", Impact, sans-serif`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.lineJoin = 'round'
  // sombra dura deslocada
  g.fillStyle = INK
  g.fillText(text, size * 0.08, size * 0.1)
  // contorno grosso + preenchimento
  g.lineWidth = size * 0.16
  g.strokeStyle = INK
  g.strokeText(text, 0, 0)
  g.fillStyle = opts.fill ?? c.palette.accent2
  g.fillText(text, 0, 0)
  // brilho de tinta no topo das letras
  g.globalAlpha = leave * 0.35
  g.fillStyle = PAPER
  g.fillText(text, -size * 0.03, -size * 0.04)
  g.restore()
}

/** Camada auxiliar das linhas de ação (reaproveitada entre quadros). */
let lineLayer: HTMLCanvasElement | null = null

/**
 * Linhas de ação: cunhas pretas vindo das bordas em direção a (cx, cy).
 * `amount` 0..1 controla quantas e quão longe entram. As pontas externas
 * esmaecem antes da borda do palco, para não aparecer o retângulo do canvas.
 */
export function speedLines(c: EffectContext, cx: number, cy: number, amount: number, seed = 1) {
  if (amount <= 0) return
  const main = c.ctx
  const W = main.canvas.width
  const H = main.canvas.height
  if (!lineLayer) lineLayer = document.createElement('canvas')
  if (lineLayer.width !== W || lineLayer.height !== H) {
    lineLayer.width = W
    lineLayer.height = H
  }
  const g = lineLayer.getContext('2d')!
  g.setTransform(main.getTransform())
  g.clearRect(0, 0, c.width, c.height)

  const rand = seeded(seed)
  const R = Math.hypot(c.width, c.height)
  const count = 64
  // as linhas "vibram" trocando de lugar algumas vezes por segundo
  const jitter = c.reduced ? 0 : Math.floor(c.time * 14)
  g.fillStyle = INK
  g.beginPath()
  for (let i = 0; i < count; i++) {
    const r1 = rand()
    const r2 = rand()
    const a = (i / count) * Math.PI * 2 + ((r1 + jitter * 0.37) % 1) * 0.08
    const inner = R * (0.18 + (1 - amount) * 0.5 + r2 * 0.18)
    const w = 0.006 + rand() * 0.012
    g.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R)
    g.lineTo(cx + Math.cos(a + w) * R, cy + Math.sin(a + w) * R)
    g.lineTo(cx + Math.cos(a + w / 2) * inner, cy + Math.sin(a + w / 2) * inner)
    g.closePath()
  }
  g.fill()
  edgeFade(g, c.width, c.height)

  main.save()
  main.setTransform(1, 0, 0, 1, 0, 0)
  main.globalAlpha = Math.min(1, amount * 1.4)
  main.drawImage(lineLayer, 0, 0)
  main.restore()
}

/** Apaga suavemente as bordas do que já foi desenhado em `g`. */
export function edgeFade(g: CanvasRenderingContext2D, w: number, h: number) {
  const grad = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.62)
  grad.addColorStop(0, 'rgba(0,0,0,0)')
  grad.addColorStop(1, 'rgba(0,0,0,1)')
  g.save()
  g.globalCompositeOperation = 'destination-out'
  g.fillStyle = grad
  g.fillRect(0, 0, w, h)
  g.restore()
}
