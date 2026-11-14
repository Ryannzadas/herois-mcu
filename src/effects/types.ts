/**
 * Interface comum dos efeitos de transformação ("Abrir edição").
 *
 * Cada personagem tem um módulo em /src/effects/{nome}.ts com um
 * `export default` do tipo EffectFactory. O palco (ComicStage) cria o efeito
 * quando a edição é aberta e chama `render(p)` a cada quadro, com p indo
 * de 0 (versão impressa em retícula) a 1 (traje real colorido). Na reversão, p volta de 1 a 0.
 *
 * Acabamento de quadrinho (onomatopeias, linhas de ação, explosões) em
 * /src/effects/comic.ts — use esses helpers para manter a mesma linguagem.
 *
 * Coordenadas:
 *  - "figura" (u, v): 0..1 relativos à imagem 1000×1400 do personagem.
 *    Valores fora de 0..1 são válidos (ex.: v = -0.5 fica acima da cabeça).
 *  - "tela": pixels CSS do canvas. Use `c.toScreen(u, v)` para converter.
 */

export interface FigureRect {
  x: number
  y: number
  w: number
  h: number
}

export interface EffectPalette {
  accent: string
  accent2: string
  glow: string
}

export interface MaskLayer {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  /** escala da máscara em relação à figura 1000×1400 */
  scale: number
  /** limpa a máscara (transparente = nada revelado) */
  clear(): void
}

export interface EffectContext {
  /** contexto 2D já escalado para pixels CSS */
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  /** retângulo onde a figura é desenhada (atualizado a cada quadro) */
  fig: FigureRect
  /** tempo em segundos desde que o efeito começou (útil para tremulações) */
  time: number
  reduced: boolean
  palette: EffectPalette
  anchors: { chest: [number, number]; head: [number, number] }
  /** pontos opacos da figura, pares (u, v) intercalados */
  points: Float32Array

  toScreen(u: number, v: number): [number, number]
  /** escala de 1 unidade da figura (u = 1) em pixels de tela */
  readonly unit: number

  /** versão impressa (xerox P&B com retícula) */
  drawPrint(alpha?: number): void
  drawReal(alpha?: number): void
  /** desenha o traje real apenas onde a máscara tem alfa */
  drawRealMasked(mask: MaskLayer, alpha?: number): void
  /** desenha a versão impressa apenas onde a máscara tem alfa */
  drawPrintMasked(mask: MaskLayer, alpha?: number): void
  /** cria uma máscara em espaço de figura (baixa resolução = mais rápido) */
  createMask(scale?: number): MaskLayer
  /** desenha uma camada em espaço de figura (ex.: traços) sobre a figura na tela */
  drawFigureLayer(layer: MaskLayer, alpha?: number): void
  /** recorta a camada pela silhueta do herói (o que estiver fora do corpo some) */
  clipToSilhouette(layer: MaskLayer): void

  /** tremor de tela neste quadro (0 = nenhum, 1 = forte) */
  shake(intensity: number): void
  /** flash de cor cobrindo a tela neste quadro */
  flash(alpha: number, color?: string): void
}

export interface TransformEffect {
  /** duração total da ida, em segundos */
  duration: number
  render(p: number, c: EffectContext): void
  dispose?(): void
}

export type EffectFactory = (c: EffectContext) => TransformEffect

export interface EffectModule {
  default: EffectFactory
}
