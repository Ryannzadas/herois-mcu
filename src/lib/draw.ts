import type { Character } from '@/data/characters'

const KEY = 'shield:ultima-ficha'

export function readLastHero(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function saveLastHero(id: string) {
  try {
    localStorage.setItem(KEY, id)
  } catch {
    /* sem armazenamento: o sorteio só não evita repetição */
  }
}

/** Sorteia um herói diferente de `excludeId` (quando há mais de um). */
export function drawHero(pool: Character[], excludeId?: string | null): Character {
  const options = pool.length > 1 ? pool.filter((c) => c.id !== excludeId) : pool
  return options[Math.floor(Math.random() * options.length)]
}
