import type { Character } from '@/data/characters'

/**
 * Texturas temáticas de fundo por herói, como SVG em data URI.
 * Tinta preta em opacidade baixa: aplicadas nas páginas de papel via
 * a variável CSS --hero-texture (classe .bg-texture em index.css).
 */
export type TextureId = 'circuits' | 'runes' | 'stars' | 'cracks' | 'webs' | 'dots'

const INK = '#141210'

const PATTERNS: Record<TextureId, { size: number; svg: string }> = {
  // trilhas de placa de circuito com nós (Homem de Ferro, Máquina de Combate…)
  circuits: {
    size: 160,
    svg: `<g fill="none" stroke="${INK}" stroke-width="1.6">
      <path d="M0 40h50l20 20h40l20-20h30M20 0v30l20 20M100 160v-40l20-20h40M0 120h30l20 20v20M80 60v40l-20 20H30"/>
      </g><g fill="${INK}"><circle cx="50" cy="40" r="3.5"/><circle cx="110" cy="60" r="3.5"/><circle cx="40" cy="50" r="3"/><circle cx="120" cy="100" r="3.5"/><circle cx="30" cy="120" r="3"/><circle cx="80" cy="60" r="3"/></g>`,
  },
  // runas nórdicas (Thor, Loki)
  runes: {
    size: 180,
    svg: `<g fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round">
      <path d="M30 20v40M30 28l14 8-14 8"/>
      <path d="M110 30v40M110 30l14 14M110 48l14-14"/>
      <path d="M60 100v40M60 100l12 20-12 20M72 100v40"/>
      <path d="M140 110l-12 18 12 18M140 110l12 18-12 18"/>
      <path d="M20 150l10-20 10 20M30 130v30"/>
      <path d="M90 20l10 15M100 35l10-15M100 35v25"/></g>`,
  },
  // estrelas de 5 pontas espalhadas (Capitão América, cósmicos)
  stars: {
    size: 150,
    svg: `<g fill="${INK}">
      <path d="M30 18l4 12h12l-10 7 4 12-10-7-10 7 4-12-10-7h12z"/>
      <path d="M110 70l3 8h8l-6 5 2 8-7-5-7 5 2-8-6-5h8z"/>
      <circle cx="80" cy="25" r="2"/><circle cx="20" cy="110" r="2.5"/><circle cx="130" cy="130" r="2"/>
      <path d="M60 110l2.5 7h7l-5.5 4 2 7-6-4.5-6 4.5 2-7-5.5-4h7z"/></g>`,
  },
  // rachaduras (Hulk)
  cracks: {
    size: 200,
    svg: `<g fill="none" stroke="${INK}" stroke-width="1.8" stroke-linejoin="bevel">
      <path d="M0 60l30 10 15-12 25 20 20-6 30 25 25-5 25 15M70 78l-5 30 12 20M140 107l10-30 20-10"/>
      <path d="M20 160l25-12 20 15 30-10 15 18M95 153l5-25"/></g>`,
  },
  // teia (Homem-Aranha)
  webs: {
    size: 200,
    svg: `<g fill="none" stroke="${INK}" stroke-width="1.4">
      <path d="M0 0L200 200M200 0L0 200M100 0v200M0 100h200"/>
      <path d="M100 60q20 20 40 0M140 100q-20 20 0 40M100 140q-20-20-40 0M60 100q20-20 0-40"/>
      <path d="M100 30q35 35 70 0M170 100q-35 35 0 70M100 170q-35-35-70 0M30 100q35-35 0-70"/></g>`,
  },
  // retícula simples (padrão)
  dots: {
    size: 18,
    svg: `<circle cx="9" cy="9" r="2" fill="${INK}"/>`,
  },
}

const BY_HERO: Partial<Record<string, TextureId>> = {
  'homem-de-ferro': 'circuits',
  'maquina-de-combate': 'circuits',
  thor: 'runes',
  loki: 'runes',
  'capitao-america': 'stars',
  'capita-marvel': 'stars',
  hulk: 'cracks',
  'homem-aranha': 'webs',
}

export function textureFor(c: Character): TextureId {
  return BY_HERO[c.id] ?? (c.group === 'cosmicos' ? 'stars' : 'dots')
}

/** Valor CSS (url + tamanho) para a variável --hero-texture. */
export function textureCss(id: TextureId) {
  const { size, svg } = PATTERNS[id]
  const doc = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><g opacity="0.07">${svg}</g></svg>`
  return { image: `url("data:image/svg+xml,${encodeURIComponent(doc)}")`, size: `${size}px ${size}px` }
}
