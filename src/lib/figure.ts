import type { Character } from '@/data/characters'

/**
 * Pipeline de imagem do personagem.
 * Uma única imagem (traje.png) gera as duas camadas da capa:
 *  - real:   a imagem normalizada para 1000×1400, recortada como figurinha
 *  - print:  a mesma imagem em xerox P&B com retícula, gerada por código
 * Como as duas saem do mesmo bitmap, ficam sempre perfeitamente alinhadas.
 */

export const FIG_W = 1000
export const FIG_H = 1400

export interface FigureAssets {
  /** bitmaps prontos para a GPU (desenhados a cada quadro) */
  real: ImageBitmap
  print: ImageBitmap
  /** pontos opacos (u, v) — base para partículas dos efeitos */
  points: Float32Array
  /** peito/cabeça detectados pela silhueta (usados quando o personagem não define) */
  anchors: { chest: [number, number]; head: [number, number] }
  placeholder: boolean
}

const cache = new Map<string, Promise<FigureAssets>>()

export function loadFigure(character: Character): Promise<FigureAssets> {
  let p = cache.get(character.id)
  if (!p) {
    p = buildFigure(character)
    cache.set(character.id, p)
  }
  return p
}

async function buildFigure(character: Character): Promise<FigureAssets> {
  const img = await loadImage(`/characters/${character.id}/traje.png`)
  const real = img ? normalize(img) : await placeholder(character)
  const base = cutoutBase(real)
  // os canvases de trabalho usam willReadFrequently (memória de CPU);
  // convertidos em ImageBitmap, ficam na GPU e o desenho por quadro é barato
  const [realBmp, printBmp] = await Promise.all([
    createImageBitmap(withBase(base, real)),
    createImageBitmap(print(real, base)),
  ])
  return {
    real: realBmp,
    print: printBmp,
    points: samplePoints(real),
    anchors: detectAnchors(real),
    placeholder: !img,
  }
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img.naturalWidth > 0 ? img : null)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function canvas(w = FIG_W, h = FIG_H) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

function ctx2d(c: HTMLCanvasElement) {
  return c.getContext('2d', { willReadFrequently: true })!
}

/* ------------------------------------------------------------------ */
/* Normalização: recorta pelo alfa e encaixa em 1000×1400, pés embaixo */
/* ------------------------------------------------------------------ */

const PAD_TOP = 40
const PAD_BOTTOM = 24
const MAX_W = 920

function normalize(img: HTMLImageElement): HTMLCanvasElement {
  // mede a caixa do conteúdo opaco numa cópia reduzida (rápido)
  const s = Math.min(1, 500 / Math.max(img.naturalWidth, img.naturalHeight))
  const probe = canvas(Math.round(img.naturalWidth * s), Math.round(img.naturalHeight * s))
  const pctx = ctx2d(probe)
  pctx.drawImage(img, 0, 0, probe.width, probe.height)
  const { data, width, height } = pctx.getImageData(0, 0, probe.width, probe.height)

  let x0 = width, y0 = height, x1 = -1, y1 = -1
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 16) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  // imagem sem alfa útil: usa o quadro inteiro
  if (x1 < 0) {
    x0 = 0; y0 = 0; x1 = width - 1; y1 = height - 1
  }

  const bx = x0 / s, by = y0 / s
  const bw = (x1 - x0 + 1) / s, bh = (y1 - y0 + 1) / s
  const fit = Math.min(MAX_W / bw, (FIG_H - PAD_TOP - PAD_BOTTOM) / bh)
  const dw = bw * fit, dh = bh * fit

  const out = canvas()
  const octx = ctx2d(out)
  octx.imageSmoothingQuality = 'high'
  octx.drawImage(img, bx, by, bw, bh, (FIG_W - dw) / 2, FIG_H - PAD_BOTTOM - dh, dw, dh)
  return out
}

/* ------------------------------------------------------------------ */
/* Recorte: borda branca de "figurinha recortada" + sombra no papel    */
/* ------------------------------------------------------------------ */

const PAPER = '#fbf6ea'
const BORDER = 11

/** Silhueta dilatada (borda do recorte), na cor pedida. */
function dilated(real: HTMLCanvasElement, radius: number, color: string) {
  const solid = canvas()
  const s = solid.getContext('2d')!
  s.drawImage(real, 0, 0)
  s.globalCompositeOperation = 'source-in'
  s.fillStyle = color
  s.fillRect(0, 0, FIG_W, FIG_H)

  const out = canvas()
  const o = out.getContext('2d')!
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    o.drawImage(solid, Math.cos(a) * radius, Math.sin(a) * radius)
    o.drawImage(solid, Math.cos(a) * radius * 0.5, Math.sin(a) * radius * 0.5)
  }
  o.drawImage(solid, 0, 0)
  return out
}

/** Base comum às duas camadas: sombra + borda branca do recorte. */
function cutoutBase(real: HTMLCanvasElement) {
  const border = dilated(real, BORDER, '#ffffff')
  const shadow = dilated(real, BORDER, 'rgba(20,16,12,0.28)')
  const out = canvas()
  const g = out.getContext('2d')!
  g.imageSmoothingQuality = 'high'
  g.drawImage(downscale(shadow, 6), 10, 14, FIG_W, FIG_H)
  g.drawImage(border, 0, 0)
  return out
}

function withBase(base: HTMLCanvasElement, top: HTMLCanvasElement) {
  const out = canvas()
  const g = out.getContext('2d')!
  g.drawImage(base, 0, 0)
  g.drawImage(top, 0, 0)
  return out
}

/* ------------------------------------------------------------------ */
/* Versão impressa: xerox P&B com retícula e desalinhamento de cores   */
/* ------------------------------------------------------------------ */

const CELL = 9 // tamanho da célula de retícula, em px da figura
const ANGLE = Math.PI / 4

function print(real: HTMLCanvasElement, base: HTMLCanvasElement): HTMLCanvasElement {
  const src = ctx2d(real).getImageData(0, 0, FIG_W, FIG_H).data
  const lumAt = (x: number, y: number) => {
    const i = ((y | 0) * FIG_W + (x | 0)) * 4
    return (0.3 * src[i] + 0.59 * src[i + 1] + 0.11 * src[i + 2]) / 255
  }
  const alphaAt = (x: number, y: number) =>
    x < 0 || y < 0 || x >= FIG_W || y >= FIG_H ? 0 : src[((y | 0) * FIG_W + (x | 0)) * 4 + 3]

  // 1) traço: contorno da silhueta + bordas internas de luminância (linha de xerox)
  const ink = canvas()
  const ictx = ctx2d(ink)
  const lineData = ictx.createImageData(FIG_W, FIG_H)
  const L = lineData.data
  const E = 4
  for (let y = 2; y < FIG_H - 2; y++) {
    for (let x = 2; x < FIG_W - 2; x++) {
      if (alphaAt(x, y) < 128) continue
      const outline =
        alphaAt(x - E, y) < 128 || alphaAt(x + E, y) < 128 || alphaAt(x, y - E) < 128 || alphaAt(x, y + E) < 128
      const grad = Math.abs(lumAt(x + 2, y) - lumAt(x - 2, y)) + Math.abs(lumAt(x, y + 2) - lumAt(x, y - 2))
      const dark = lumAt(x, y) < 0.05
      if (outline || grad > 0.28 || dark) {
        const i = (y * FIG_W + x) * 4
        L[i] = L[i + 1] = L[i + 2] = 17
        L[i + 3] = 255
      }
    }
  }
  ictx.putImageData(lineData, 0, 0)

  // 2) pontos de retícula a 45°, raio pela escuridão (curva de alto contraste)
  ictx.fillStyle = '#111'
  ictx.beginPath()
  const cos = Math.cos(ANGLE), sin = Math.sin(ANGLE)
  const span = Math.ceil(Math.hypot(FIG_W, FIG_H) / CELL)
  for (let j = -span; j <= span; j++) {
    for (let i = -span; i <= span; i++) {
      const x = FIG_W / 2 + (i * cos - j * sin) * CELL
      const y = FIG_H / 2 + (i * sin + j * cos) * CELL
      if (x < 0 || y < 0 || x >= FIG_W || y >= FIG_H || alphaAt(x, y) < 128) continue
      // curva suave: trajes escuros viram retícula densa, não um bloco preto
      const d = Math.pow(Math.min(1, Math.max(0, (0.92 - lumAt(x, y)) / 0.92)), 1.4)
      if (d < 0.05) continue
      const r = CELL * 0.6 * Math.sqrt(d)
      ictx.moveTo(x + r, y)
      ictx.arc(x, y, r, 0, Math.PI * 2)
    }
  }
  ictx.fill()

  // 3) composição: papel dentro da silhueta + cópias deslocadas em ciano/magenta
  const paper = dilated(real, 0, PAPER)
  const out = canvas()
  const g = out.getContext('2d')!
  g.drawImage(paper, 0, 0)
  g.globalCompositeOperation = 'multiply'
  g.globalAlpha = 0.5
  g.drawImage(tint(ink, '#00a3e0'), -4, -2)
  g.drawImage(tint(ink, '#e5007d'), 4, 3)
  g.globalAlpha = 1
  g.globalCompositeOperation = 'source-over'
  g.drawImage(ink, 0, 0)
  // a impressão não passa da borda do recorte
  g.globalCompositeOperation = 'destination-in'
  g.drawImage(dilated(real, 2, '#000'), 0, 0)
  return withBase(base, out)
}

function tint(src: HTMLCanvasElement, color: string) {
  const c = canvas()
  const g = c.getContext('2d')!
  g.drawImage(src, 0, 0)
  g.globalCompositeOperation = 'source-in'
  g.fillStyle = color
  g.fillRect(0, 0, FIG_W, FIG_H)
  return c
}

function downscale(src: HTMLCanvasElement, factor: number) {
  const c = canvas(Math.round(FIG_W / factor), Math.round(FIG_H / factor))
  const g = c.getContext('2d')!
  g.imageSmoothingQuality = 'high'
  g.drawImage(src, 0, 0, c.width, c.height)
  return c
}

/**
 * Estima cabeça e peito pela silhueta: a cabeça fica perto do topo do
 * conteúdo opaco e o peito a ~1/4 da altura; o x é o centro dos pixels
 * opacos naquela faixa. Funciona bem para poses em pé; poses incomuns
 * podem definir `anchors` manualmente em characters.ts.
 */
function detectAnchors(real: HTMLCanvasElement): FigureAssets['anchors'] {
  const { data } = ctx2d(real).getImageData(0, 0, FIG_W, FIG_H)
  const opaque = (x: number, y: number) => data[(y * FIG_W + x) * 4 + 3] > 128
  let top = 0
  let bottom = FIG_H - 1
  const rowHas = (y: number) => {
    for (let x = 0; x < FIG_W; x += 2) if (opaque(x, y)) return true
    return false
  }
  while (top < FIG_H && !rowHas(top)) top++
  while (bottom > top && !rowHas(bottom)) bottom--
  const h = bottom - top

  const at = (frac: number): [number, number] => {
    const y0 = Math.round(top + h * frac)
    let sum = 0
    let n = 0
    for (let y = y0 - 8; y <= y0 + 8; y += 2) {
      for (let x = 0; x < FIG_W; x += 2) {
        if (opaque(x, y)) {
          sum += x
          n++
        }
      }
    }
    return [n ? sum / n / FIG_W : 0.5, y0 / FIG_H]
  }
  return { head: at(0.07), chest: at(0.24) }
}

function samplePoints(real: HTMLCanvasElement, step = 7): Float32Array {
  const { data } = ctx2d(real).getImageData(0, 0, FIG_W, FIG_H)
  const pts: number[] = []
  for (let y = 0; y < FIG_H; y += step) {
    for (let x = 0; x < FIG_W; x += step) {
      if (data[(y * FIG_W + x) * 4 + 3] > 128) pts.push(x / FIG_W, y / FIG_H)
    }
  }
  return new Float32Array(pts)
}

/* ------------------------------------------------------------------ */
/* Placeholder: silhueta com as cores do personagem + nome             */
/* ------------------------------------------------------------------ */

async function placeholder(c: Character): Promise<HTMLCanvasElement> {
  try {
    await document.fonts.load('700 64px "Chakra Petch"')
  } catch {
    /* segue com a fonte de fallback */
  }
  const out = canvas()
  const g = ctx2d(out)
  const ph = c.placeholder ?? {}
  const [c1, c2] = ph.suit ?? [c.palette.accent, c.palette.accent2]

  if (ph.cape) {
    g.fillStyle = ph.cape
    g.beginPath()
    g.moveTo(320, 290)
    g.quadraticCurveTo(180, 700, 150, 1180)
    g.lineTo(300, 1140)
    g.lineTo(330, 760)
    g.lineTo(670, 760)
    g.lineTo(700, 1140)
    g.lineTo(850, 1180)
    g.quadraticCurveTo(820, 700, 680, 290)
    g.closePath()
    g.fill()
  }

  const grad = g.createLinearGradient(0, 120, 0, 1380)
  grad.addColorStop(0, c2)
  grad.addColorStop(0.35, c1)
  grad.addColorStop(0.7, c1)
  grad.addColorStop(1, c2)
  g.fillStyle = grad
  silhouette(g)

  // sombreado lateral para dar volume (a retícula usa a luminância)
  const shade = g.createLinearGradient(260, 0, 740, 0)
  shade.addColorStop(0, 'rgba(0,0,0,0.45)')
  shade.addColorStop(0.45, 'rgba(255,255,255,0.12)')
  shade.addColorStop(1, 'rgba(0,0,0,0.5)')
  g.globalCompositeOperation = 'source-atop'
  g.fillStyle = shade
  g.fillRect(0, 0, FIG_W, FIG_H)
  g.globalCompositeOperation = 'source-over'

  if (ph.emblem === 'reactor') {
    const r = g.createRadialGradient(500, 420, 4, 500, 420, 46)
    r.addColorStop(0, '#ffffff')
    r.addColorStop(0.4, '#9ff4ff')
    r.addColorStop(1, 'rgba(94,231,255,0)')
    g.fillStyle = r
    g.beginPath()
    g.arc(500, 420, 46, 0, Math.PI * 2)
    g.fill()
  }

  // nome do personagem atravessando o tronco
  g.save()
  g.globalCompositeOperation = 'source-atop'
  g.fillStyle = 'rgba(0,0,0,0.55)'
  g.fillRect(0, 560, FIG_W, 110)
  g.restore()
  g.fillStyle = '#ffffff'
  g.font = '700 64px "Chakra Petch", sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(c.codename.toUpperCase(), 500, 604, 560)
  g.font = '500 22px "IBM Plex Mono", monospace'
  g.fillStyle = 'rgba(255,255,255,0.7)'
  g.fillText('IMAGEM PENDENTE', 500, 648)
  return out
}

/** Silhueta humana estilizada, de frente, ocupando 1000×1400 (preenche cada parte). */
function silhouette(g: CanvasRenderingContext2D) {
  const part = (draw: () => void) => {
    g.beginPath()
    draw()
    g.fill()
  }
  part(() => g.ellipse(500, 150, 66, 82, 0, 0, Math.PI * 2))
  part(() => {
    g.moveTo(462, 210)
    g.lineTo(538, 210)
    g.lineTo(548, 262)
    g.quadraticCurveTo(650, 270, 690, 320)
    g.quadraticCurveTo(700, 520, 640, 690)
    g.lineTo(650, 760)
    g.lineTo(350, 760)
    g.lineTo(360, 690)
    g.quadraticCurveTo(300, 520, 310, 320)
    g.quadraticCurveTo(350, 270, 452, 262)
    g.closePath()
  })
  // braços
  part(() => limb(g, 676, 310, 760, 520, 62, 48))
  part(() => limb(g, 760, 520, 790, 760, 48, 38))
  part(() => limb(g, 324, 310, 240, 520, 62, 48))
  part(() => limb(g, 240, 520, 210, 760, 48, 38))
  part(() => g.ellipse(796, 800, 34, 46, 0, 0, Math.PI * 2))
  part(() => g.ellipse(204, 800, 34, 46, 0, 0, Math.PI * 2))
  // pernas
  part(() => limb(g, 560, 720, 590, 1040, 90, 64))
  part(() => limb(g, 590, 1040, 600, 1330, 64, 50))
  part(() => limb(g, 440, 720, 410, 1040, 90, 64))
  part(() => limb(g, 410, 1040, 400, 1330, 64, 50))
  part(() => g.ellipse(612, 1350, 64, 26, 0, 0, Math.PI * 2))
  part(() => g.ellipse(388, 1350, 64, 26, 0, 0, Math.PI * 2))
}

/** Trapézio arredondado entre dois pontos (segmento de membro). */
function limb(g: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, w1: number, w2: number) {
  const a = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2
  const cx = Math.cos(a), sy = Math.sin(a)
  g.moveTo(x1 + cx * w1 / 2, y1 + sy * w1 / 2)
  g.lineTo(x2 + cx * w2 / 2, y2 + sy * w2 / 2)
  g.arc(x2, y2, w2 / 2, a, a + Math.PI)
  g.lineTo(x1 - cx * w1 / 2, y1 - sy * w1 / 2)
  g.arc(x1, y1, w1 / 2, a + Math.PI, a + Math.PI * 2)
  g.closePath()
}
