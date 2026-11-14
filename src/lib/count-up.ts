import { gsap } from './gsap'

export const formatNumber = (v: number, decimals = 0, grouping = true) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: grouping })

/**
 * Números que contam do zero quando entram na tela.
 * Marque os elementos com data-count="valor" (opcional: data-decimals,
 * data-grouping="false" para anos). Com movimento reduzido, mostra o valor final.
 */
export function countUpIn(scope: Element, reduced: boolean) {
  gsap.utils.toArray<HTMLElement>('[data-count]', scope).forEach((el) => {
    const target = Number(el.dataset.count)
    const decimals = Number(el.dataset.decimals ?? 0)
    const grouping = el.dataset.grouping !== 'false'
    if (reduced) {
      el.textContent = formatNumber(target, decimals, grouping)
      return
    }
    const obj = { v: 0 }
    el.textContent = formatNumber(0, decimals, grouping)
    gsap.to(obj, {
      v: target,
      duration: 1.8,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      onUpdate: () => (el.textContent = formatNumber(obj.v, decimals, grouping)),
    })
  })
}
