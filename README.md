# HERÓIS! — fanzine colecionável do MCU

Site de fã (sem fins lucrativos) em forma de revista em quadrinhos: cada herói é
uma edição (Nº 001, Nº 002…) e a tela principal é a capa dessa edição.
Projeto de fã, sem ligação com a Marvel Studios ou a Disney.

## Rodando

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera /dist (deploy na Vercel funciona sem configuração: framework Vite)
```

## Estrutura

```
public/
  characters/{id}/traje.png   imagem do traje (PNG transparente, 1000×1400)
  characters/{id}/thumb.png   miniatura do seletor
  textures/grain.png          grão de papel do fundo
src/
  data/characters.ts          ÚNICA fonte de dados dos personagens
  effects/
    types.ts                  interface comum dos efeitos (EffectFactory / EffectContext)
    comic.ts                  acabamento de HQ: onomatopeias (sfx), explosões, linhas de ação
    ironman.ts, thor.ts       um módulo por personagem, carregado sob demanda
    fade.ts                   quadros que se abrem (movimento reduzido / sem efeito próprio)
  lib/
    figure.ts                 normaliza a imagem, recorta como figurinha e gera o xerox em retícula
    draw.ts                   sorteio + última ficha no localStorage
    palette.ts                anima as variáveis CSS da paleta
    gsap.ts                   registro de ScrollTrigger, SplitText e ScrambleText
  components/
    cover/                    capa (título gigante, selos, faixas) e sorteio da pilha
    stage/                    palco em canvas (impressão em retícula, lupa, "Abrir edição")
    selector/                 pilha de capas com abas de filtro
    comic/                    peças de HQ: mini capa, selo estourado, fita, papel rasgado, marquee
    ui/comic-button.tsx       botão de gibi (retícula no cursor, rabisco que se desenha, magnético)
```

## Adicionar um personagem

1. Coloque `traje.png` e `thumb.png` em `public/characters/{id}/`.
   Se a imagem vier fora do padrão, o código recorta pelo alfa e reenquadra.
   Sem imagem, aparece um placeholder com silhueta e nome.
2. Crie `src/effects/{nome}.ts` exportando por padrão uma `EffectFactory`
   (use `ironman.ts` ou `thor.ts` como base). O palco chama `render(p, c)` a cada
   quadro com `p` de 0 (impressão P&B) a 1 (traje colorido); na reversão `p` volta a 0.
   Use `sfx()` e `speedLines()` de `comic.ts` para o acabamento de quadrinho.
   Use `c.createMask()` + `c.drawRealMasked()` para revelar o traje,
   `c.toScreen(u, v)` para converter coordenadas da figura, e
   `c.shake()` / `c.flash()` para impacto.
3. Adicione o objeto em `CHARACTERS` (`src/data/characters.ts`) com paleta,
   frase (`quote`), âncoras (peito/cabeça, em 0..1 da imagem já normalizada) e
   `effect: () => import('@/effects/{nome}')`.

## Bibliotecas de animação

- **GSAP**: timelines (pilha sendo folheada, efeitos), ScrambleText (número da edição no sorteio), SplitText (letras do título carimbadas), troca de paleta. ScrollTrigger já registrado para as próximas seções.
- **Lenis**: rolagem suave, sincronizada com o ScrollTrigger pelo ticker do GSAP (`src/lib/smooth-scroll.ts`); desligada com movimento reduzido.
- **Motion**: interações de interface (troca de capa com AnimatePresence, pilha do seletor, hover/tap, lupa arrastável).
