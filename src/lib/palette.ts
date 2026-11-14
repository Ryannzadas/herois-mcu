import type { Character } from '@/data/characters'
import { gsap } from './gsap'
import { textureCss, textureFor } from './textures'

/** Anima as variáveis CSS da página inteira para a paleta do personagem. */
export function applyPalette(c: Character, reduced: boolean) {
  gsap.to(document.documentElement, {
    '--accent': c.palette.accent,
    '--accent-2': c.palette.accent2,
    '--glow': c.palette.glow,
    duration: reduced ? 0 : 1.1,
    ease: 'power2.inOut',
    overwrite: true,
  })
  // textura temática do herói nas páginas de papel (troca direta, é bem sutil)
  const tex = textureCss(textureFor(c))
  document.documentElement.style.setProperty('--hero-texture', tex.image)
  document.documentElement.style.setProperty('--hero-texture-size', tex.size)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', c.palette.accent)
}
