import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, ScrambleTextPlugin)
// no celular a barra de endereço some e volta ao rolar; sem isto, cada vez
// recalcula as seções presas e a página dá um pulo
ScrollTrigger.config({ ignoreMobileResize: true })

/** Caracteres usados em todos os efeitos de "decodificação". */
export const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>'

export { gsap, ScrollTrigger, SplitText, useGSAP }
