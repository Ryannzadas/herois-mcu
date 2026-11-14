import { INK } from '@/effects/comic'
import type { EffectContext, EffectPalette, FigureRect, MaskLayer } from '@/effects/types'
import { FIG_H, FIG_W, type FigureAssets } from '@/lib/figure'

/**
 * Renderizador do palco da capa. Não sabe nada de React:
 * ComicStage atualiza os campos e chama os métodos a cada quadro.
 * Também é o EffectContext entregue aos módulos de /effects.
 */
export class StageRenderer implements EffectContext {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width = 0
  height = 0
  dpr = 1
  fig: FigureRect = { x: 0, y: 0, w: 0, h: 0 }
  time = 0
  /** relógio global */
  clock = 0
  reduced = false
  palette: EffectPalette = { accent: '#c8161d', accent2: '#f2b318', glow: '#6e0b0f' }
  anchors: EffectContext['anchors'] = { chest: [0.5, 0.3], head: [0.5, 0.1] }
  points: Float32Array = new Float32Array()
  assets: FigureAssets | null = null

  shakeAmount = 0
  flashAlpha = 0
  flashColor = '#fff'

  private scratch = document.createElement('canvas')
  private sctx: CanvasRenderingContext2D

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.scratch.width = FIG_W
    this.scratch.height = FIG_H
    this.sctx = this.scratch.getContext('2d')!
  }

  get unit() {
    return this.fig.w
  }

  resize(width: number, height: number, dpr: number) {
    this.width = width
    this.height = height
    this.dpr = dpr
    this.canvas.width = Math.round(width * dpr)
    this.canvas.height = Math.round(height * dpr)
    // a figura ocupa a altura disponível (com folga no topo para onomatopeias), alinhada embaixo
    const s = Math.min((width * 0.96) / FIG_W, (height * 0.92) / FIG_H)
    const w = FIG_W * s
    const h = FIG_H * s
    this.fig = { x: (width - w) / 2, y: height - h, w, h }
  }

  setAssets(a: FigureAssets | null) {
    this.assets = a
    this.points = a?.points ?? new Float32Array()
  }

  beginFrame() {
    const g = this.ctx
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    g.globalAlpha = 1
    g.globalCompositeOperation = 'source-over'
    g.clearRect(0, 0, this.width, this.height)
    this.shakeAmount = 0
    this.flashAlpha = 0
  }

  endFrame() {
    if (this.flashAlpha > 0) {
      const g = this.ctx
      g.save()
      g.globalAlpha = Math.min(1, this.flashAlpha)
      g.globalCompositeOperation = 'lighter'
      // clarão radial: some antes das bordas, sem revelar o retângulo do canvas
      const w = this.width
      const h = this.height
      const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.min(w, h) * 0.55)
      grad.addColorStop(0, this.flashColor)
      grad.addColorStop(0.4, this.flashColor)
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = grad
      g.fillRect(0, 0, w, h)
      g.restore()
    }
  }

  /* ---------------- EffectContext ---------------- */

  toScreen(u: number, v: number): [number, number] {
    return [this.fig.x + u * this.fig.w, this.fig.y + v * this.fig.h]
  }

  drawPrint(alpha = 1) {
    this.drawLayer(this.assets?.print, alpha)
  }

  drawReal(alpha = 1) {
    this.drawLayer(this.assets?.real, alpha)
  }

  private drawLayer(src: ImageBitmap | undefined, alpha: number) {
    if (!src || alpha <= 0) return
    const g = this.ctx
    g.save()
    g.globalAlpha = alpha
    g.drawImage(src, this.fig.x, this.fig.y, this.fig.w, this.fig.h)
    g.restore()
  }

  drawRealMasked(mask: MaskLayer, alpha = 1) {
    if (this.assets) this.drawMasked(this.assets.real, mask, alpha)
  }

  drawPrintMasked(mask: MaskLayer, alpha = 1) {
    if (this.assets) this.drawMasked(this.assets.print, mask, alpha)
  }

  private drawMasked(src: CanvasImageSource, mask: MaskLayer, alpha: number) {
    const s = this.sctx
    s.globalCompositeOperation = 'source-over'
    s.clearRect(0, 0, FIG_W, FIG_H)
    s.drawImage(mask.canvas, 0, 0, FIG_W, FIG_H)
    s.globalCompositeOperation = 'source-in'
    s.drawImage(src, 0, 0)
    const g = this.ctx
    g.save()
    g.globalAlpha = alpha
    g.drawImage(this.scratch, this.fig.x, this.fig.y, this.fig.w, this.fig.h)
    g.restore()
  }

  createMask(scale = 0.25): MaskLayer {
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(FIG_W * scale)
    canvas.height = Math.round(FIG_H * scale)
    const ctx = canvas.getContext('2d')!
    return {
      canvas,
      ctx,
      scale,
      clear: () => ctx.clearRect(0, 0, canvas.width, canvas.height),
    }
  }

  drawFigureLayer(layer: MaskLayer, alpha = 1) {
    const g = this.ctx
    g.save()
    g.globalAlpha = alpha
    g.drawImage(layer.canvas, this.fig.x, this.fig.y, this.fig.w, this.fig.h)
    g.restore()
  }

  clipToSilhouette(layer: MaskLayer) {
    if (!this.assets) return
    const g = layer.ctx
    g.save()
    g.setTransform(1, 0, 0, 1, 0, 0)
    g.globalCompositeOperation = 'destination-in'
    g.drawImage(this.assets.real, 0, 0, layer.canvas.width, layer.canvas.height)
    g.restore()
  }

  shake(intensity: number) {
    this.shakeAmount = Math.max(this.shakeAmount, intensity)
  }

  flash(alpha: number, color = '#fff') {
    if (alpha > this.flashAlpha) {
      this.flashAlpha = alpha
      this.flashColor = color
    }
  }

  /* ---------------- Lupa ---------------- */

  /**
   * Lupa de quadrinho: dentro do vidro aparece a camada oposta, ampliada.
   * (cx, cy) é o centro do vidro; o cabo sai para baixo à direita.
   */
  drawLens(cx: number, cy: number, r: number, inside: 'real' | 'print') {
    if (!this.assets) return
    const g = this.ctx
    const zoom = 1.18
    const src = inside === 'real' ? this.assets.real : this.assets.print
    const rim = Math.max(6, r * 0.11)

    // cabo (atrás do aro)
    const a = Math.PI / 4
    g.save()
    g.translate(cx + Math.cos(a) * (r + rim * 0.4), cy + Math.sin(a) * (r + rim * 0.4))
    g.rotate(a)
    g.fillStyle = INK
    g.beginPath()
    g.roundRect(0, -rim * 1.05, r * 0.95, rim * 2.1, rim)
    g.fill()
    g.fillStyle = this.palette.accent
    g.beginPath()
    g.roundRect(rim * 1.4, -rim * 0.75, r * 0.95 - rim * 2, rim * 1.5, rim * 0.7)
    g.fill()
    g.restore()

    // vidro: papel por baixo + camada oposta ampliada
    g.save()
    g.beginPath()
    g.arc(cx, cy, r, 0, Math.PI * 2)
    g.clip()
    g.globalCompositeOperation = 'destination-out'
    g.fillRect(cx - r, cy - r, r * 2, r * 2)
    g.globalCompositeOperation = 'source-over'
    g.fillStyle = 'rgba(251,246,234,0.94)'
    g.fillRect(cx - r, cy - r, r * 2, r * 2)
    g.translate(cx, cy)
    g.scale(zoom, zoom)
    g.translate(-cx, -cy)
    g.drawImage(src, this.fig.x, this.fig.y, this.fig.w, this.fig.h)
    g.restore()

    // reflexos do vidro
    g.save()
    g.strokeStyle = 'rgba(255,255,255,0.85)'
    g.lineCap = 'round'
    g.lineWidth = r * 0.07
    g.beginPath()
    g.arc(cx, cy, r * 0.78, Math.PI * 1.05, Math.PI * 1.45)
    g.stroke()
    g.beginPath()
    g.arc(cx, cy, r * 0.62, Math.PI * 1.15, Math.PI * 1.25)
    g.stroke()
    g.restore()

    // aro grosso de tinta com sombra dura deslocada
    g.save()
    g.lineWidth = rim
    g.strokeStyle = INK
    g.globalAlpha = 0.22
    g.beginPath()
    g.arc(cx + rim * 0.7, cy + rim * 0.8, r + rim / 2, 0, Math.PI * 2)
    g.stroke()
    g.globalAlpha = 1
    g.beginPath()
    g.arc(cx, cy, r + rim / 2, 0, Math.PI * 2)
    g.stroke()
    g.lineWidth = rim * 0.35
    g.strokeStyle = this.palette.accent2
    g.stroke()
    g.restore()
  }
}
