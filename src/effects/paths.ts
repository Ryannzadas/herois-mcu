import { lerp } from '@/lib/utils'

/**
 * Caminhos em coordenadas de figura (u, v) para raios, rachaduras e rasgos.
 * Guardam o comprimento acumulado para serem "desenhados até t" (0..1).
 */

export type Point = [number, number]
export type Path = { u: Float32Array; v: Float32Array; len: Float32Array; total: number }
export type Mapper = (u: number, v: number) => Point

export function makePath(pts: Point[]): Path {
  const u = new Float32Array(pts.length)
  const v = new Float32Array(pts.length)
  const len = new Float32Array(pts.length)
  let total = 0
  pts.forEach(([pu, pv], i) => {
    u[i] = pu
    v[i] = pv
    // a figura é 1:1.4, então v pesa mais na distância
    if (i > 0) total += Math.hypot(pu - pts[i - 1][0], (pv - pts[i - 1][1]) * 1.4)
    len[i] = total
  })
  return { u, v, len, total }
}

/** Raio por deslocamento de ponto médio. */
export function bolt(rand: () => number, a: Point, b: Point, spread: number, depth: number): Point[] {
  if (depth === 0) return [a, b]
  const mid: Point = [(a[0] + b[0]) / 2 + (rand() - 0.5) * spread, (a[1] + b[1]) / 2 + (rand() - 0.5) * spread * 0.3]
  return [...bolt(rand, a, mid, spread / 2, depth - 1), ...bolt(rand, mid, b, spread / 2, depth - 1).slice(1)]
}

/** Rachadura: caminhada aleatória a partir de um ponto. `wobble` = quanto a direção varia. */
export function crack(rand: () => number, from: Point, angle: number, length: number, wobble = 0.9): Point[] {
  const pts: Point[] = [from]
  let [u, v] = from
  let a = angle
  let walked = 0
  while (walked < length) {
    const step = 0.025 + rand() * 0.04
    a += (rand() - 0.5) * wobble
    u += Math.cos(a) * step
    v += (Math.sin(a) * step) / 1.4
    walked += step
    pts.push([u, v])
  }
  return pts
}

/** Traça o trecho [0, upTo] de um caminho (sem beginPath/stroke). */
export function trace(g: CanvasRenderingContext2D, path: Path, upTo: number, map: Mapper) {
  const limit = path.total * upTo
  const [x0, y0] = map(path.u[0], path.v[0])
  g.moveTo(x0, y0)
  for (let i = 1; i < path.u.length; i++) {
    if (path.len[i] > limit) {
      const prev = path.len[i - 1]
      const t = (limit - prev) / (path.len[i] - prev)
      const [x, y] = map(lerp(path.u[i - 1], path.u[i], t), lerp(path.v[i - 1], path.v[i], t))
      g.lineTo(x, y)
      return
    }
    const [x, y] = map(path.u[i], path.v[i])
    g.lineTo(x, y)
  }
}

/** Traça e contorna vários caminhos com o estilo atual do contexto. */
export function strokeAll(g: CanvasRenderingContext2D, paths: Path[], upTo: number, map: Mapper) {
  g.beginPath()
  for (const p of paths) trace(g, p, upTo, map)
  g.stroke()
}

/** Mapeia (u, v) para pixels de uma máscara criada com createMask(scale). */
export const maskMapper = (scale: number): Mapper => (u, v) => [u * 1000 * scale, v * 1400 * scale]
