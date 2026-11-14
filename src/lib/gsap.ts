import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, ScrambleTextPlugin)

/** Caracteres usados em todos os efeitos de "decodificação". */
export const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>'

export { gsap, ScrollTrigger, SplitText, useGSAP }
