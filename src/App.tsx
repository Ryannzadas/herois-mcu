import { useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useState } from 'react'
import { CoverBlurbMobile } from '@/components/cover/Cover'
import { ReadingNav } from '@/components/layout/ReadingNav'
import { CoverScroll } from '@/components/cover/CoverScroll'
import { DualIdentity } from '@/components/sections/DualIdentity'
import { Ficha } from '@/components/sections/Ficha'
import { Filme } from '@/components/sections/Filme'
import { Manifesto } from '@/components/sections/Manifesto'
import { Mural } from '@/components/sections/Mural'
import { Trajes } from '@/components/sections/Trajes'
import { IssueStack } from '@/components/selector/IssueStack'
import { CHARACTERS, getCharacter } from '@/data/characters'
import { drawHero, readLastHero, saveLastHero } from '@/lib/draw'
import { applyPalette } from '@/lib/palette'
import { ScrollTrigger } from '@/lib/gsap'
import { jumpToTop, startSmoothScroll } from '@/lib/smooth-scroll'

const initialHero = () => drawHero(CHARACTERS, readLastHero()).id

export default function App() {
  const reduced = !!useReducedMotion()
  const [currentId, setCurrentId] = useState(initialHero)
  const [drawing, setDrawing] = useState(true)
  const character = getCharacter(currentId)!

  useEffect(() => saveLastHero(currentId), [currentId])

  useEffect(() => startSmoothScroll(reduced), [reduced])

  // fontes mudam a altura dos textos: recalcula os pins quando terminam de carregar
  useEffect(() => {
    document.fonts.ready.then(() => ScrollTrigger.refresh())
  }, [])

  useEffect(() => {
    if (!drawing) applyPalette(character, reduced)
  }, [character, drawing, reduced])

  const select = (id: string) => {
    if (id === currentId || drawing) return
    jumpToTop()
    setCurrentId(id)
  }

  const randomize = () => {
    if (drawing) return
    const hero = drawHero(CHARACTERS, currentId)
    jumpToTop()
    setCurrentId(hero.id)
    setDrawing(true)
  }

  const endDraw = useCallback(() => setDrawing(false), [])

  return (
    <div className="relative min-h-dvh">
      <ReadingNav reduced={reduced} />
      <main>
        <h1 className="sr-only">Heróis — fanzine colecionável sobre os personagens do MCU</h1>
        <CoverScroll character={character} drawing={drawing} reduced={reduced} onDrawEnd={endDraw} />
        <CoverBlurbMobile character={character} hidden={drawing} />
        <Manifesto character={character} reduced={reduced} />
        <Mural character={character} reduced={reduced} />
        <DualIdentity character={character} reduced={reduced} />
        <Trajes character={character} reduced={reduced} />
        <Filme character={character} reduced={reduced} />
        <Ficha character={character} reduced={reduced} />
        <IssueStack currentId={currentId} disabled={drawing} reduced={reduced} onSelect={select} onRandom={randomize} />
      </main>
      <Footer />
    </div>
  )
}

function Footer() {
  return (
    <footer className="bg-ink px-4 py-6 text-center font-sfx text-lg tracking-wide text-paper sm:px-8">
      Projeto de fã, sem ligação com a Marvel Studios ou a Disney.
    </footer>
  )
}
