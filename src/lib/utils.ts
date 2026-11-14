import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** 0→1 entre a e b, com suavização cúbica. */
export function smoothstep(a: number, b: number, v: number) {
  const t = clamp((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}

/** Fatia de progresso: remapeia p ∈ [a, b] para [0, 1]. */
export const range = (p: number, a: number, b: number) => clamp((p - a) / (b - a))

/** PRNG determinístico (mulberry32) — efeitos ficam iguais a cada execução. */
export function seeded(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
