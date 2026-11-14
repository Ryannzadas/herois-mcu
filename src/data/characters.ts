import type { EffectModule } from '@/effects/types'

/**
 * Fonte única de dados dos personagens.
 *
 * Para adicionar um herói:
 *  1. rode `node scripts/prepare-images.mjs "<pasta>"` (gera traje.png e thumb.png)
 *  2. adicione um objeto em CHARACTERS abaixo
 *  3. (opcional) crie /src/effects/{nome}.ts com a animação própria e aponte em `effect`
 *     — sem isso, a edição abre com os quadros de HQ genéricos (effects/fade.ts)
 */

export type GroupId = 'originais' | 'segunda-geracao' | 'cosmicos' | 'fase-4'

export const GROUPS: { id: GroupId; label: string; short: string }[] = [
  { id: 'originais', label: 'Vingadores originais', short: 'Originais' },
  { id: 'segunda-geracao', label: 'Segunda geração', short: '2ª geração' },
  { id: 'cosmicos', label: 'Guardiões e cósmicos', short: 'Cósmicos' },
  { id: 'fase-4', label: 'Fase 4+', short: 'Fase 4+' },
]

export type Status = 'ativo' | 'aposentado' | 'desaparecido' | 'falecido'

const STATUS_LABEL: Record<Status, [string, string]> = {
  ativo: ['Ativo', 'Ativa'],
  aposentado: ['Aposentado', 'Aposentada'],
  desaparecido: ['Desaparecido', 'Desaparecida'],
  falecido: ['Falecido', 'Falecida'],
}

export const statusLabel = (c: Character) => STATUS_LABEL[c.status][c.feminine ? 1 : 0]

/** Tom do balão: fala comum, grito (balão estourado) ou sussurro (balão tracejado). */
export type QuoteTone = 'fala' | 'grito' | 'sussurro'
/** Fala do herói. No texto, *asteriscos* marcam a palavra em destaque, como no letreiramento de gibi. */
export type Quote = { text: string; from?: string; tone?: QuoteTone }

type Anchors = { chest: [number, number]; head: [number, number] }

export interface Character {
  id: string
  /** número da edição */
  file: number
  group: GroupId
  codename: string
  realName: string
  /** concordância de gênero nos rótulos (Ativa, Falecida…) */
  feminine?: boolean
  status: Status
  affiliation: string
  firstAppearance: { title: string; year: number }
  /** nível de autorização exigido para ler a ficha */
  clearance: number
  summary: string
  /** frase marcante (faixas correndo na capa) */
  quote: string
  /**
   * manifesto da seção 2: 3 a 4 linhas curtas. Linhas pares saem em serifada
   * colorida, ímpares em condensada branca. Sem isso, usa um texto padrão.
   */
  manifesto?: string[]
  /**
   * filme principal do herói (seção "o filme"): números em US$ milhões e minutos.
   * Para heróis que só têm série, informe `episodes` e omita bilheteria e duração:
   * a seção passa a dizer "a série" e não mostra o selo de bilheteria.
   */
  film?: {
    title: string
    year: number
    synopsis: string
    director: string
    runtime?: number
    boxOffice?: number
    openingUS?: number
    episodes?: number
  }
  /** títulos dos dois lados da seção "dupla identidade" (padrão: Herói / Humano) */
  duo?: [string, string]
  /** citações curtas assinadas pelo herói (mural de aparições) */
  quotes?: Quote[]
  /** accent = cor forte da edição, accent2 = cor de destaque, glow = tom escuro (sombra/tinta) */
  palette: { accent: string; accent2: string; glow: string }
  /**
   * peito/cabeça em coordenadas 0..1 da imagem já normalizada (1000×1400).
   * Opcional: sem isso, são detectados pela silhueta (bom para poses em pé).
   */
  anchors?: Anchors
  /** usado só enquanto não existe traje.png (padrão: cores da paleta) */
  placeholder?: { suit?: [string, string]; cape?: string; emblem?: 'reactor' | 'star' | 'none' }
  /** animação própria de "Abrir edição", carregada sob demanda */
  effect?: () => Promise<EffectModule>
}

export const CHARACTERS: Character[] = [
  /* ---------------- Vingadores originais ---------------- */
  {
    id: 'homem-de-ferro',
    file: 1,
    group: 'originais',
    codename: 'Homem de Ferro',
    realName: 'Anthony Edward Stark',
    status: 'falecido',
    affiliation: 'Vingadores · Stark Industries',
    firstAppearance: { title: 'Homem de Ferro', year: 2008 },
    clearance: 7,
    summary:
      'Engenheiro, bilionário e fundador dos Vingadores. Armadura modular com nanotecnologia alimentada por reator Arc. Sacrificou-se para reverter o Blip.',
    quote: 'Eu sou o Homem de Ferro.',
    duo: ['Ferro', 'Stark'],
    film: {
      title: 'Homem de Ferro',
      year: 2008,
      synopsis:
        'Sequestrado no Afeganistão, Tony Stark constrói uma armadura com sucata para escapar. De volta aos EUA, aperfeiçoa o traje e decide usar a tecnologia para proteger, não para vender armas.',
      director: 'Jon Favreau',
      runtime: 126,
      boxOffice: 585.8,
      openingUS: 98.6,
    },
    quotes: [{ text: 'Às vezes é preciso *correr* antes de aprender a andar.', from: 'Homem de Ferro' }, { text: 'Se não pudermos proteger a Terra, pode ter certeza que vamos *vingá-la*.', from: 'Os Vingadores' }, { text: 'Eu te amo *3000*.', from: 'Vingadores: Ultimato', tone: 'sussurro' }],
    manifesto: ['Construiu a primeira armadura', 'numa caverna,', 'com uma caixa de sucata.', 'Terminou salvando o universo.'],
    palette: { accent: '#c8161d', accent2: '#f2b318', glow: '#6e0b0f' },
    anchors: { chest: [0.515, 0.247], head: [0.494, 0.109] },
    placeholder: { suit: ['#b3121b', '#e7a92b'], emblem: 'reactor' },
    effect: () => import('@/effects/ironman'),
  },
  {
    id: 'thor',
    file: 2,
    group: 'originais',
    codename: 'Thor',
    realName: 'Thor Odinson',
    status: 'ativo',
    affiliation: 'Vingadores · Asgard',
    firstAppearance: { title: 'Thor', year: 2011 },
    clearance: 8,
    summary:
      'Príncipe de Asgard e Deus do Trovão. Canaliza relâmpagos pelo Mjolnir e pelo Rompe-Tormentas. Classificação de ameaça: nível ômega.',
    quote: 'Eu sou o Deus do Trovão!',
    duo: ['Trovão', 'Odinson'],
    film: {
      title: 'Thor: Ragnarok',
      year: 2017,
      synopsis:
        'Preso em Sakaar e obrigado a lutar como gladiador contra o Hulk, Thor precisa voltar a Asgard antes que Hela, a deusa da morte, destrua o reino e o seu povo.',
      director: 'Taika Waititi',
      runtime: 130,
      boxOffice: 855.3,
      openingUS: 122.7,
    },
    quotes: [{ text: 'Ele é um *amigo do trabalho*!', from: 'Thor: Ragnarok' }, { text: 'Traga-me *Thanos*!', from: 'Vingadores: Guerra Infinita' }, { text: 'Eu ainda sou *digno*.', from: 'Vingadores: Ultimato' }],
    manifesto: ['Perdeu o martelo,', 'o olho, o pai e o reino.', 'Continuou digno', 'mesmo assim.'],
    palette: { accent: '#1d4fa3', accent2: '#f4cf3a', glow: '#0d2552' },
    anchors: { chest: [0.668, 0.531], head: [0.713, 0.404] },
    placeholder: { suit: ['#2a3442', '#8f9db2'], cape: '#a3121f', emblem: 'none' },
    effect: () => import('@/effects/thor'),
  },
  {
    id: 'capitao-america',
    file: 3,
    group: 'originais',
    codename: 'Capitão América',
    realName: 'Steven Grant Rogers',
    status: 'aposentado',
    affiliation: 'Vingadores · S.H.I.E.L.D.',
    firstAppearance: { title: 'Capitão América: O Primeiro Vingador', year: 2011 },
    clearance: 8,
    summary:
      'Supersoldado da Segunda Guerra, congelado por décadas e despertado no século XXI. Líder dos Vingadores e dono do escudo de vibranium.',
    quote: 'Eu aguento isso o dia todo.',
    duo: ['Capitão', 'Rogers'],
    quotes: [{ text: 'Eu *entendi* essa referência.', from: 'Os Vingadores' }, { text: 'Vingadores… *avante*.', from: 'Vingadores: Ultimato' }, { text: 'Até o *fim da linha*.', from: 'Capitão América 2: O Soldado Invernal' }],
    film: {
      title: 'Capitão América 2: O Soldado Invernal',
      year: 2014,
      synopsis:
        'Em Washington, Steve descobre que a HIDRA cresceu dentro da própria S.H.I.E.L.D. Ao lado da Viúva Negra e do Falcão, enfrenta um assassino misterioso que tem o rosto do seu melhor amigo.',
      director: 'Anthony e Joe Russo',
      runtime: 136,
      boxOffice: 714.4,
      openingUS: 95,
    },
    manifesto: ['Um garoto do Brooklyn', 'que nunca aprendeu', 'a hora de correr.', 'Só a de levantar.'],
    palette: { accent: '#1f3f8f', accent2: '#e2262e', glow: '#0d1d44' },
    effect: () => import('@/effects/captain'),
  },
  {
    id: 'hulk',
    file: 4,
    group: 'originais',
    codename: 'Hulk',
    realName: 'Robert Bruce Banner',
    status: 'ativo',
    affiliation: 'Vingadores',
    firstAppearance: { title: 'O Incrível Hulk', year: 2008 },
    clearance: 8,
    summary:
      'Físico exposto à radiação gama. A raiva o transforma no Hulk; anos depois, cérebro e força passaram a dividir o mesmo corpo.',
    quote: 'Hulk esmaga!',
    duo: ['Hulk', 'Banner'],
    quotes: [{ text: 'Esse é o meu segredo, capitão: eu estou *sempre* com raiva.', from: 'Os Vingadores' }, { text: 'Deus *mirrado*.', from: 'Os Vingadores' }, { text: 'Melhor dos *dois mundos*.', from: 'Vingadores: Ultimato' }],
    film: {
      title: 'O Incrível Hulk',
      year: 2008,
      synopsis:
        'Escondido no Brasil, Bruce Banner busca uma cura para a radiação gama enquanto foge do exército. A volta aos EUA termina num confronto destruidor contra o Abominável nas ruas do Harlem.',
      director: 'Louis Leterrier',
      runtime: 112,
      boxOffice: 264.8,
      openingUS: 55.4,
    },
    manifesto: ['O outro cara', 'sempre esteve ali.', 'Banner só aprendeu', 'a dividir o volante.'],
    palette: { accent: '#3f8a2a', accent2: '#9a4fd0', glow: '#183b10' },
    effect: () => import('@/effects/hulk'),
  },
  {
    id: 'viuva-negra',
    file: 5,
    group: 'originais',
    codename: 'Viúva Negra',
    realName: 'Natasha Romanoff',
    feminine: true,
    status: 'falecido',
    affiliation: 'Vingadores · S.H.I.E.L.D.',
    firstAppearance: { title: 'Homem de Ferro 2', year: 2010 },
    clearance: 7,
    summary:
      'Espiã formada na Sala Vermelha que virou agente da S.H.I.E.L.D. Deu a vida em Vormir para que a Joia da Alma fosse recuperada.',
    quote: 'Ninguém vê a Viúva chegar.',
    palette: { accent: '#2a2a31', accent2: '#d4202f', glow: '#0b0b0e' },
    effect: () => import('@/effects/widow'),
    manifesto: ['Tinha vermelho no registro', 'e passou a vida apagando.', 'Trocou tudo isso', 'por uma família que escolheu.'],
    duo: ['Viúva', 'Natasha'],
    quotes: [{ text: 'Eu tenho *vermelho* no meu registro.', from: 'Os Vingadores' }, { text: 'Desculpa, eu estava *trabalhando*.' }, { text: 'Tudo bem. Vai ficar *tudo bem*.', from: 'Vingadores: Ultimato', tone: 'sussurro' }],
    film: {
      title: 'Viúva Negra',
      year: 2021,
      synopsis:
        'Foragida depois de Guerra Civil, Natasha volta a Budapeste e reencontra a família que a Sala Vermelha forjou para ela. Juntos, precisam derrubar o programa que transformou meninas em assassinas.',
      director: 'Cate Shortland',
      runtime: 134,
      boxOffice: 379.8,
      openingUS: 80.4,
    },
  },
  {
    id: 'gaviao-arqueiro',
    file: 6,
    group: 'originais',
    codename: 'Gavião Arqueiro',
    realName: 'Clint Barton',
    status: 'aposentado',
    affiliation: 'Vingadores · S.H.I.E.L.D.',
    firstAppearance: { title: 'Thor', year: 2011 },
    clearance: 6,
    summary:
      'Arqueiro de pontaria perfeita e ex-agente da S.H.I.E.L.D. Passou o arco e o nome para Kate Bishop e voltou para a fazenda.',
    quote: 'Nunca erro o alvo.',
    palette: { accent: '#6b2a8f', accent2: '#f2a93b', glow: '#2c0f3d' },
    effect: () => import('@/effects/hawkeye'),
    manifesto: ['Sem superpoder,', 'sem armadura,', 'só um arco', 'e mira de sobra.'],
    duo: ['Gavião', 'Clint'],
    quotes: [
      { text: 'A cidade está voando e eu tenho um *arco e flecha*. Nada disso faz sentido.', from: 'Vingadores: Era de Ultron' },
      { text: 'Se você sair por aquela porta, você é um *Vingador*.', from: 'Vingadores: Era de Ultron' },
      { text: 'Eu *nunca* erro.' },
    ],
    film: {
      title: 'Os Vingadores',
      year: 2012,
      synopsis:
        'Controlado por Loki, Clint ajuda a roubar o Tesseract. Libertado, luta ao lado de Stark, Rogers, Thor, Banner e Natasha para impedir a invasão Chitauri em Nova York.',
      director: 'Joss Whedon',
      runtime: 143,
      boxOffice: 1518.8,
      openingUS: 207.4,
    },
  },

  /* ---------------- Segunda geração ---------------- */
  {
    id: 'homem-aranha',
    file: 7,
    group: 'segunda-geracao',
    codename: 'Homem-Aranha',
    realName: 'Peter Benjamin Parker',
    status: 'ativo',
    affiliation: 'Vizinhança amigável · Queens',
    firstAppearance: { title: 'Capitão América: Guerra Civil', year: 2016 },
    clearance: 4,
    summary:
      'Estudante do Queens picado por uma aranha geneticamente alterada. Depois do feitiço de Strange, ninguém mais lembra quem ele é.',
    quote: 'Com grandes poderes vêm grandes responsabilidades.',
    palette: { accent: '#c4161c', accent2: '#2350b5', glow: '#5a0a0e' },
    effect: () => import('@/effects/spider'),
    manifesto: ['Salvou o mundo,', 'perdeu o ônibus,', 'e no fim', 'ninguém lembra o nome dele.'],
    duo: ['Aranha', 'Peter'],
    quotes: [{ text: 'Eu não quero ir, *senhor Stark*.', from: 'Vingadores: Guerra Infinita', tone: 'sussurro' }, { text: 'Seu *amigão* da vizinhança.' }, { text: 'Ei, *pessoal*.', from: 'Capitão América: Guerra Civil' }],
    film: {
      title: 'Homem-Aranha: Sem Volta para Casa',
      year: 2021,
      synopsis:
        'Com a identidade revelada ao mundo, Peter pede ajuda ao Doutor Estranho. O feitiço dá errado e abre o multiverso, trazendo vilões de outras realidades e cobrando o preço mais alto de todos.',
      director: 'Jon Watts',
      runtime: 148,
      boxOffice: 1921.8,
      openingUS: 260.1,
    },
  },
  {
    id: 'doutor-estranho',
    file: 8,
    group: 'segunda-geracao',
    codename: 'Doutor Estranho',
    realName: 'Stephen Vincent Strange',
    status: 'ativo',
    affiliation: 'Mestres das Artes Místicas · Kamar-Taj',
    firstAppearance: { title: 'Doutor Estranho', year: 2016 },
    clearance: 9,
    summary:
      'Neurocirurgião que perdeu a precisão das mãos e encontrou a magia. Mestre Supremo das Artes Místicas e guardião do Santuário de Nova York.',
    quote: 'Dormammu, vim negociar.',
    palette: { accent: '#1b4d84', accent2: '#f39a1d', glow: '#0b223d' },
    effect: () => import('@/effects/strange'),
    manifesto: ['Perdeu as mãos', 'de cirurgião', 'e ganhou', 'o tempo inteiro.'],
    duo: ['Mago', 'Stephen'],
    quotes: [{ text: '*Dormammu*, vim negociar.', from: 'Doutor Estranho' }, { text: 'Era o *único* jeito.', from: 'Vingadores: Guerra Infinita', tone: 'sussurro' }, { text: 'Nós estamos no *fim do jogo* agora.', from: 'Vingadores: Guerra Infinita' }],
    film: {
      title: 'Doutor Estranho',
      year: 2016,
      synopsis:
        'Depois de um acidente destruir suas mãos, o neurocirurgião Stephen Strange busca cura em Kamar-Taj e descobre as artes místicas, a tempo de enfrentar Kaecilius e o próprio Dormammu.',
      director: 'Scott Derrickson',
      runtime: 115,
      boxOffice: 677.8,
      openingUS: 85.1,
    },
  },
  {
    id: 'pantera-negra',
    file: 9,
    group: 'segunda-geracao',
    codename: 'Pantera Negra',
    realName: "T'Challa",
    status: 'falecido',
    affiliation: 'Wakanda · Vingadores',
    firstAppearance: { title: 'Capitão América: Guerra Civil', year: 2016 },
    clearance: 8,
    summary:
      'Rei de Wakanda e protetor do vibranium. O traje absorve energia cinética e a devolve em ondas. Abriu Wakanda para o mundo.',
    quote: 'Wakanda para sempre!',
    palette: { accent: '#4a2a8a', accent2: '#c9a6ff', glow: '#1c0f36' },
    effect: () => import('@/effects/panther'),
    manifesto: ['Herdou o trono,', 'o manto e a dor,', 'e escolheu', 'abrir as fronteiras.'],
    duo: ['Pantera', "T'Challa"],
    quotes: [{ text: '*Wakanda* para sempre!', from: 'Pantera Negra' }, { text: 'Os sábios constroem *pontes*.', from: 'Pantera Negra' }, { text: 'Eu *nunca* congelo.', from: 'Pantera Negra' }],
    film: {
      title: 'Pantera Negra',
      year: 2018,
      synopsis:
        "Depois da morte do pai, T'Challa volta a Wakanda para assumir o trono. Quando Erik Killmonger reivindica a coroa, o novo rei precisa decidir que tipo de nação Wakanda vai ser para o resto do mundo.",
      director: 'Ryan Coogler',
      runtime: 134,
      boxOffice: 1349.9,
      openingUS: 202.0,
    },
  },
  {
    id: 'feiticeira-escarlate',
    file: 10,
    group: 'segunda-geracao',
    codename: 'Feiticeira Escarlate',
    realName: 'Wanda Maximoff',
    feminine: true,
    status: 'desaparecido',
    affiliation: 'Vingadores',
    firstAppearance: { title: 'Capitão América 2: O Soldado Invernal', year: 2014 },
    clearance: 9,
    summary:
      'Nascida em Sokovia, teve os poderes ampliados pela Joia da Mente. Capaz de reescrever a realidade. Paradeiro desconhecido após Wundagore.',
    quote: 'O caos é só magia sem rédeas.',
    palette: { accent: '#a3122b', accent2: '#ff6b8a', glow: '#4a0712' },
    effect: () => import('@/effects/scarlet'),
    manifesto: ['Perdeu tudo', 'mais de uma vez,', 'e reescreveu', 'o mundo para ter de volta.'],
    duo: ['Feiticeira', 'Wanda'],
    quotes: [{ text: 'Você tirou *tudo* de mim.', from: 'Vingadores: Ultimato' }, { text: 'Não sou um monstro. Sou *mãe*.', from: 'Doutor Estranho no Multiverso da Loucura' }],
    film: {
      title: 'Doutor Estranho no Multiverso da Loucura',
      year: 2022,
      synopsis:
        'Consumida pelo Darkhold, Wanda caça America Chavez para roubar seu poder de atravessar universos e reencontrar os filhos. O caminho dela passa por Kamar-Taj, pelos Illuminati e termina no Monte Wundagore.',
      director: 'Sam Raimi',
      runtime: 126,
      boxOffice: 955.8,
      openingUS: 187.4,
    },
  },
  {
    id: 'visao',
    file: 11,
    group: 'segunda-geracao',
    codename: 'Visão',
    realName: 'Visão (sintezoide)',
    status: 'desaparecido',
    affiliation: 'Vingadores',
    firstAppearance: { title: 'Vingadores: Era de Ultron', year: 2015 },
    clearance: 8,
    summary:
      'Corpo sintético criado por Ultron, despertado com J.A.R.V.I.S. e a Joia da Mente. Atravessa matéria e controla a própria densidade.',
    quote: 'Sou a soma do que lembro.',
    palette: { accent: '#b21d34', accent2: '#f2c418', glow: '#1f4d2a' },
    effect: () => import('@/effects/vision'),
    manifesto: ['Nasceu ontem,', 'ergueu o martelo,', 'e escolheu', 'ser humano.'],
    duo: ['Sintezoide', 'Visão'],
    quotes: [{ text: 'Estou do lado da *vida*.', from: 'Vingadores: Era de Ultron' }, { text: 'O que é o luto, senão o *amor* que persiste?', from: 'WandaVision' }, { text: 'Eu *não* sou Ultron.', from: 'Vingadores: Era de Ultron' }],
    film: {
      title: 'Vingadores: Era de Ultron',
      year: 2015,
      synopsis:
        'Tony Stark tenta criar um programa de paz e acaba dando vida a Ultron. Para detê-lo, os Vingadores despertam um novo ser feito de vibranium, J.A.R.V.I.S. e a Joia da Mente: o Visão.',
      director: 'Joss Whedon',
      runtime: 141,
      boxOffice: 1405.4,
      openingUS: 191.3,
    },
  },
  {
    id: 'capita-marvel',
    file: 12,
    group: 'segunda-geracao',
    codename: 'Capitã Marvel',
    realName: 'Carol Danvers',
    feminine: true,
    status: 'ativo',
    affiliation: 'Vingadores · Força Aérea dos EUA',
    firstAppearance: { title: 'Capitã Marvel', year: 2019 },
    clearance: 9,
    summary:
      'Pilota de testes atingida pela energia do Tesseract. Absorve e dispara energia fotônica e voa mais rápido que naves interestelares.',
    quote: 'Mais alto, mais longe, mais rápido.',
    palette: { accent: '#c41e3a', accent2: '#f2c033', glow: '#14285e' },
    effect: () => import('@/effects/marvel'),
    manifesto: ['Caiu mil vezes,', 'levantou mil e uma,', 'e descobriu', 'que não tinha nada a provar.'],
    duo: ['Capitã', 'Carol'],
    quotes: [{ text: 'Eu não tenho *nada* a provar para você.', from: 'Capitã Marvel' }, { text: 'Mais *alto*, mais *longe*, mais *rápido*.', from: 'Capitã Marvel' }],
    film: {
      title: 'Capitã Marvel',
      year: 2019,
      synopsis:
        'Em 1995, a guerreira kree Vers cai na Terra no meio de uma guerra contra os skrulls. Com a ajuda de Nick Fury, ela descobre que já foi Carol Danvers, pilota da Força Aérea, e de onde vem o seu poder.',
      director: 'Anna Boden e Ryan Fleck',
      runtime: 124,
      boxOffice: 1131.4,
      openingUS: 153.4,
    },
  },
  {
    id: 'homem-formiga',
    file: 13,
    group: 'segunda-geracao',
    codename: 'Homem-Formiga',
    realName: 'Scott Lang',
    status: 'ativo',
    affiliation: 'Vingadores · Pym Technologies',
    firstAppearance: { title: 'Homem-Formiga', year: 2015 },
    clearance: 5,
    summary:
      'Ex-ladrão que herdou o traje de Hank Pym. Com as partículas Pym, encolhe até o reino quântico ou cresce até virar o Gigante.',
    quote: 'Pequeno no tamanho, gigante na coragem.',
    palette: { accent: '#b5161d', accent2: '#a9b2bc', glow: '#3a0a0c' },
    effect: () => import('@/effects/antman'),
    manifesto: ['Saiu da cadeia,', 'entrou num traje', 'e salvou o mundo', 'do tamanho de uma formiga.'],
    duo: ['Formiga', 'Scott'],
    quotes: [{ text: 'Ainda dá tempo de mudar o *nome*?', from: 'Homem-Formiga' }, { text: 'Eu tenho uma ideia meio *maluca*.' }],
    film: {
      title: 'Homem-Formiga',
      year: 2015,
      synopsis:
        'Recém-saído da prisão, o ladrão Scott Lang é recrutado por Hank Pym para vestir um traje que encolhe quem o usa e invadir a própria empresa de Pym, antes que a tecnologia caia nas mãos erradas.',
      director: 'Peyton Reed',
      runtime: 117,
      boxOffice: 519.3,
      openingUS: 57.2,
    },
  },
  {
    id: 'vespa',
    file: 14,
    group: 'segunda-geracao',
    codename: 'Vespa',
    realName: 'Hope van Dyne',
    feminine: true,
    status: 'ativo',
    affiliation: 'Vingadores · Pym Technologies',
    firstAppearance: { title: 'Homem-Formiga', year: 2015 },
    clearance: 6,
    summary:
      'Filha de Hank Pym e Janet van Dyne. Encolhe, voa com asas e dispara rajadas bioelétricas dos pulsos.',
    quote: 'Pique primeiro, pergunte depois.',
    palette: { accent: '#2d5fa8', accent2: '#f2c94c', glow: '#10213f' },
    effect: () => import('@/effects/wasp'),
    manifesto: ['Esperou a vida inteira', 'pelo próprio traje,', 'e quando chegou', 'voou primeiro.'],
    duo: ['Vespa', 'Hope'],
    quotes: [{ text: 'Já estava mais do que *na hora*.', from: 'Homem-Formiga' }],
    film: {
      title: 'Homem-Formiga e a Vespa',
      year: 2018,
      synopsis:
        'Hope van Dyne veste enfim o traje da Vespa e se une a Scott Lang para resgatar a mãe, Janet, perdida há trinta anos no reino quântico, enquanto fogem do FBI, de um traficante de tecnologia e da misteriosa Fantasma.',
      director: 'Peyton Reed',
      runtime: 118,
      boxOffice: 622.7,
      openingUS: 75.8,
    },
  },
  {
    id: 'falcao',
    file: 15,
    group: 'segunda-geracao',
    codename: 'Falcão',
    realName: 'Samuel Thomas Wilson',
    status: 'ativo',
    affiliation: 'Vingadores',
    firstAppearance: { title: 'Capitão América 2: O Soldado Invernal', year: 2014 },
    clearance: 7,
    summary:
      'Ex-paraquedista da Força Aérea com asas mecânicas e o drone Asa Vermelha. Recebeu o escudo e assumiu o manto de Capitão América.',
    quote: 'Nas alturas, eu cuido de você.',
    palette: { accent: '#3e4f63', accent2: '#e2382f', glow: '#1c2531' },
    effect: () => import('@/effects/falcon'),
    manifesto: ['Sem soro,', 'sem super-força,', 'só um par de asas', 'e um escudo que mereceu.'],
    duo: ['Falcão', 'Sam'],
    quotes: [{ text: 'Eu faço o que ele faz, só que *mais devagar*.', from: 'Capitão América 2: O Soldado Invernal' }, { text: 'Pela sua *esquerda*.', from: 'Vingadores: Ultimato' }],
    film: {
      title: 'Capitão América: Admirável Mundo Novo',
      year: 2025,
      synopsis:
        'Já como o novo Capitão América, Sam Wilson se vê no meio de uma conspiração internacional depois de um atentado na Casa Branca, e precisa descobrir quem está por trás dela antes que o presidente Thaddeus Ross perca o controle e o mundo veja o Hulk Vermelho.',
      director: 'Julius Onah',
      runtime: 118,
      boxOffice: 415.1,
      openingUS: 88.8,
    },
  },
  {
    id: 'soldado-invernal',
    file: 16,
    group: 'segunda-geracao',
    codename: 'Soldado Invernal',
    realName: 'James Buchanan "Bucky" Barnes',
    status: 'ativo',
    affiliation: 'Thunderbolts · Vingadores',
    firstAppearance: { title: 'Capitão América: O Primeiro Vingador', year: 2011 },
    clearance: 7,
    summary:
      'Melhor amigo de Steve Rogers, transformado pela HIDRA em assassino. Livre da programação, luta com um braço de vibranium.',
    quote: 'Até o fim da linha.',
    palette: { accent: '#2f3b45', accent2: '#c0c8d0', glow: '#12181d' },
    effect: () => import('@/effects/bucky'),
    manifesto: ['Setenta anos', 'cumprindo ordens dos outros.', 'Hoje cada passo', 'é escolha dele.'],
    duo: ['Soldado', 'Bucky'],
    quotes: [{ text: 'Quem diabos é *Bucky*?', from: 'Capitão América 2: O Soldado Invernal' }, { text: 'Eu me lembro de *todos* eles.', from: 'Capitão América: Guerra Civil', tone: 'sussurro' }],
    film: {
      title: 'Thunderbolts*',
      year: 2025,
      synopsis:
        'Presos numa armadilha de Valentina Allegra de Fontaine, Yelena Belova, Bucky Barnes e outros anti-heróis descartáveis precisam aprender a trabalhar juntos para enfrentar uma ameaça sombria que surge de dentro de um deles.',
      director: 'Jake Schreier',
      runtime: 127,
      boxOffice: 382.4,
      openingUS: 74.3,
    },
  },
  {
    id: 'maquina-de-combate',
    file: 17,
    group: 'segunda-geracao',
    codename: 'Máquina de Combate',
    realName: 'James Rupert "Rhodey" Rhodes',
    status: 'ativo',
    affiliation: 'Vingadores · Força Aérea dos EUA',
    firstAppearance: { title: 'Homem de Ferro', year: 2008 },
    clearance: 7,
    summary:
      'Coronel da Força Aérea e melhor amigo de Tony Stark. Armadura pesada com metralhadora no ombro e arsenal militar.',
    quote: 'Poder de fogo não falta.',
    palette: { accent: '#4a4f55', accent2: '#e3a400', glow: '#1d1f22' },
    effect: () => import('@/effects/warmachine'),
    manifesto: ['Nunca teve superpoder.', 'Tinha um amigo genial', 'e coragem de sobra', 'para segurar a barra dele.'],
    duo: ['Máquina', 'Rhodey'],
    quotes: [{ text: 'Da *próxima vez*, baby.', from: 'Homem de Ferro' }],
    film: {
      title: 'Homem de Ferro 2',
      year: 2010,
      synopsis:
        'Com o mundo sabendo que Tony Stark é o Homem de Ferro, o governo quer a armadura, o reator no peito está envenenando o próprio dono e um físico russo vingativo aparece em Mônaco. No meio da crise, o coronel James Rhodes veste uma das armaduras e vira a Máquina de Combate.',
      director: 'Jon Favreau',
      runtime: 124,
      boxOffice: 623.9,
      openingUS: 128.1,
    },
  },

  /* ---------------- Guardiões e cósmicos ---------------- */
  {
    id: 'senhor-das-estrelas',
    file: 18,
    group: 'cosmicos',
    codename: 'Senhor das Estrelas',
    realName: 'Peter Jason Quill',
    status: 'ativo',
    affiliation: 'Guardiões da Galáxia',
    firstAppearance: { title: 'Guardiões da Galáxia', year: 2014 },
    clearance: 5,
    summary:
      'Abduzido da Terra em 1988 e criado por Saqueadores. Líder (autoproclamado) dos Guardiões e dono de uma fita cassete inesquecível.',
    quote: 'Senhor das Estrelas, o lendário fora-da-lei.',
    palette: { accent: '#8a3b1c', accent2: '#ff8a3d', glow: '#3a170a' },
    effect: () => import('@/effects/starlord'),
    manifesto: ['Roubou uma esfera,', 'desafiou o vilão para dançar', 'e salvou a galáxia', 'com uma fita cassete.'],
    duo: ['Senhor', 'Quill'],
    quotes: [{ text: 'Eu tenho *12%* de um plano.', from: 'Guardiões da Galáxia' }, { text: 'Nós somos os *Guardiões da Galáxia*.', from: 'Guardiões da Galáxia' }],
    film: {
      title: 'Guardiões da Galáxia',
      year: 2014,
      synopsis:
        'Abduzido da Terra ainda criança, Peter Quill rouba uma esfera misteriosa e vira alvo de Ronan, o Acusador. Para sobreviver, forma uma aliança improvável com Gamora, Rocket, Groot e Drax, e o bando de desajustados precisa proteger a galáxia de uma Joia do Infinito.',
      director: 'James Gunn',
      runtime: 121,
      boxOffice: 773.4,
      openingUS: 94.3,
    },
  },
  {
    id: 'gamora',
    file: 19,
    group: 'cosmicos',
    codename: 'Gamora',
    realName: 'Gamora Zen Whoberi Ben Titan',
    feminine: true,
    status: 'desaparecido',
    affiliation: 'Guardiões da Galáxia · Saqueadores',
    firstAppearance: { title: 'Guardiões da Galáxia', year: 2014 },
    clearance: 7,
    summary:
      'Filha adotiva de Thanos e a assassina mais temida da galáxia. A versão de 2014 segue viva, viajando com os Saqueadores.',
    quote: 'A mulher mais perigosa da galáxia.',
    palette: { accent: '#2f7d4f', accent2: '#ec5a96', glow: '#123620' },
    effect: () => import('@/effects/gamora'),
    manifesto: ['Criada pelo titã', 'para ser uma arma,', 'escolheu ser', 'família.'],
    duo: ['Assassina', 'Gamora'],
    quotes: [{ text: 'Não vou cair na sua *feitiçaria pélvica*!', from: 'Guardiões da Galáxia' }],
    film: {
      title: 'Guardiões da Galáxia Vol. 2',
      year: 2017,
      synopsis:
        'Enquanto tentam manter o grupo unido, os Guardiões descobrem a origem de Peter Quill com a chegada de Ego, o pai dele, e Gamora precisa acertar as contas com a irmã, Nebulosa, que a culpa por todos os anos de tortura sob o comando de Thanos.',
      director: 'James Gunn',
      runtime: 136,
      boxOffice: 863.8,
      openingUS: 146.5,
    },
  },
  {
    id: 'loki',
    file: 20,
    group: 'cosmicos',
    codename: 'Loki',
    realName: 'Loki Laufeyson',
    status: 'ativo',
    affiliation: 'AVT · Asgard',
    firstAppearance: { title: 'Thor', year: 2011 },
    clearance: 9,
    summary:
      'Deus da Trapaça, mestre de ilusões e duplicatas. Depois de passar pela AVT, sustenta sozinho a árvore de todas as linhas do tempo.',
    quote: 'Fardo glorioso, propósito glorioso.',
    palette: { accent: '#2e6b3a', accent2: '#d9a520', glow: '#10291a' },
    effect: () => import('@/effects/loki'),
    manifesto: ['Nasceu gigante de gelo,', 'cresceu príncipe,', 'virou vilão', 'e acabou guardando o tempo.'],
    duo: ['Trapaça', 'Laufeyson'],
    quotes: [{ text: 'Eu sou *Loki*, de Asgard, e carrego o fardo de um *propósito glorioso*.', from: 'Os Vingadores' }, { text: 'Eu nunca quis o trono. Só queria ser seu *igual*.', from: 'Thor' }],
    film: {
      title: 'Thor',
      year: 2011,
      synopsis:
        'Banido de Asgard por arrogância, Thor cai na Terra sem os poderes, enquanto o irmão, Loki, descobre ser filho de um gigante de gelo e aproveita a ausência dele para tomar o trono, colocando os dois mundos em perigo.',
      director: 'Kenneth Branagh',
      runtime: 115,
      boxOffice: 449.3,
      openingUS: 65.7,
    },
  },

  /* ---------------- Fase 4 em diante ---------------- */
  {
    id: 'shang-chi',
    file: 21,
    group: 'fase-4',
    codename: 'Shang-Chi',
    realName: 'Xu Shang-Chi',
    status: 'ativo',
    affiliation: 'Ta Lo',
    firstAppearance: { title: 'Shang-Chi e a Lenda dos Dez Anéis', year: 2021 },
    clearance: 6,
    summary:
      'Filho de Wenwu, treinado desde criança como assassino. Mestre de artes marciais e portador dos Dez Anéis.',
    quote: 'Os dez anéis respondem a mim.',
    palette: { accent: '#c21f2b', accent2: '#f2c94c', glow: '#4d0b10' },
    effect: () => import('@/effects/shangchi'),
    manifesto: ['Fugiu do pai', 'e mudou de nome.', 'Voltou para enfrentar os dois', 'e ficou com os anéis.'],
    duo: ['Shang-Chi', 'Shaun'],
    film: {
      title: 'Shang-Chi e a Lenda dos Dez Anéis',
      year: 2021,
      synopsis:
        'Shang-Chi leva uma vida comum em São Francisco até ser atacado num ônibus pelos capangas dos Dez Anéis, a organização do próprio pai, Wenwu. Ele precisa encarar o passado de assassino treinado e impedir que o pai liberte uma força sombria em Ta Lo, a terra natal da mãe.',
      director: 'Destin Daniel Cretton',
      runtime: 132,
      boxOffice: 432.2,
      openingUS: 75.4,
    },
  },
  {
    id: 'cavaleiro-da-lua',
    file: 22,
    group: 'fase-4',
    codename: 'Cavaleiro da Lua',
    realName: 'Marc Spector',
    status: 'ativo',
    affiliation: 'Avatar de Khonshu',
    firstAppearance: { title: 'Cavaleiro da Lua (série)', year: 2022 },
    clearance: 6,
    summary:
      'Ex-mercenário que divide o corpo com Steven Grant e Jake Lockley. Punho da vingança do deus lunar Khonshu.',
    quote: 'O punho da vingança de Khonshu.',
    palette: { accent: '#34436a', accent2: '#ece6d4', glow: '#121827' },
    effect: () => import('@/effects/moonknight'),
    manifesto: ['Três homens', 'num corpo só,', 'e um deus da lua', 'falando no ouvido.'],
    duo: ['Cavaleiro', 'Marc'],
    quotes: [{ text: 'Me devolve o *meu corpo*!', from: 'Cavaleiro da Lua' }],
    film: {
      title: 'Cavaleiro da Lua',
      year: 2022,
      synopsis:
        'Steven Grant, um funcionário tímido de museu em Londres, descobre que divide o corpo com Marc Spector, mercenário e avatar de Khonshu, o deus egípcio da lua. Juntos, precisam impedir que o líder de culto Arthur Harrow liberte a deusa Ammit para julgar a humanidade.',
      director: 'Mohamed Diab, Justin Benson e Aaron Moorhead',
      episodes: 6,
    },
  },
  {
    id: 'ms-marvel',
    file: 23,
    group: 'fase-4',
    codename: 'Ms. Marvel',
    realName: 'Kamala Khan',
    feminine: true,
    status: 'ativo',
    affiliation: 'Jersey City · As Marvels',
    firstAppearance: { title: 'Ms. Marvel (série)', year: 2022 },
    clearance: 4,
    summary:
      'Adolescente de Jersey City e fã número um da Capitã Marvel. O bracelete da bisavó libera construções de luz cristalina.',
    quote: 'Heroína de verdade nunca desiste.',
    palette: { accent: '#3b3fb8', accent2: '#e3312d', glow: '#161751' },
    effect: () => import('@/effects/msmarvel'),
    manifesto: ['Desenhava heróis', 'nas margens do caderno,', 'até virar uma', 'com um bracelete da bisavó.'],
    duo: ['Ms. Marvel', 'Kamala'],
    film: {
      title: 'As Marvels',
      year: 2023,
      synopsis:
        'Carol Danvers, Monica Rambeau e Kamala Khan passam a trocar de lugar sempre que usam os poderes ao mesmo tempo. Para entender o que está acontecendo, as três precisam trabalhar juntas e enfrentar Dar-Benn, uma líder kree em busca de vingança.',
      director: 'Nia DaCosta',
      runtime: 105,
      boxOffice: 206.1,
      openingUS: 46.1,
    },
  },
]

export const getCharacter = (id: string) => CHARACTERS.find((c) => c.id === id)

export const duoOf = (c: Character): [string, string] => c.duo ?? ['Herói', 'Humano']

/** Citações do mural, ou a frase da capa. */
export const quotesOf = (c: Character): Quote[] => c.quotes ?? [{ text: c.quote }]

/** Manifesto do herói, ou um texto padrão montado com os dados da ficha. */
export const manifestoOf = (c: Character): string[] =>
  c.manifesto ?? ['Nesta edição,', `${c.codename}.`, c.quote]

export const fileNumber = (c: Character) => `Nº ${String(c.file).padStart(3, '0')}`

/** preço fictício de capa, como nos gibis */
export const ISSUE_PRICE = 'R$ 4,90'
