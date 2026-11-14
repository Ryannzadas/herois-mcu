import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { gsap, ScrollTrigger } from './gsap'

/**
 * Rolagem suave (Lenis) integrada ao ScrollTrigger: o Lenis é atualizado pelo
 * ticker do GSAP e avisa o ScrollTrigger a cada rolagem, então pins e scrubs
 * ficam sincronizados. Com prefers-reduced-motion, fica a rolagem nativa.
 */

let lenis: Lenis | null = null

export function startSmoothScroll(reduced: boolean) {
  if (reduced || lenis) return () => undefined
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 })
  lenis.on('scroll', ScrollTrigger.update)
  // só em desenvolvimento: permite testar rolagens pelo console/automação
  if (import.meta.env.DEV) (window as unknown as { __lenis?: Lenis }).__lenis = lenis
  const tick = (time: number) => lenis?.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  return () => {
    gsap.ticker.remove(tick)
    lenis?.destroy()
    lenis = null
  }
}

/** Rola até um alvo (usa o Lenis quando ativo). */
export function scrollToTarget(target: number | string | HTMLElement) {
  // seção ainda não montada (ex.: um link para algo que não existe): não faz nada
  if (typeof target === 'string' && !document.querySelector(target)) return
  if (lenis) lenis.scrollTo(target)
  else if (typeof target === 'number') window.scrollTo({ top: target, behavior: 'smooth' })
  else (typeof target === 'string' ? document.querySelector(target) : target)?.scrollIntoView({ behavior: 'smooth' })
}
