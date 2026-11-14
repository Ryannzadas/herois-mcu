/* Gerado por scripts/fetch-media.mjs — edite o manifest e rode de novo. */

/**
 * Cenas e trajes: imagens © Marvel Studios, usadas em projeto de fã sem fins
 * lucrativos. Mude para false para esconder todas de uma vez (o site usa só
 * a imagem principal do herói e as fotos de licença livre).
 */
export const MARVEL_MEDIA_ENABLED = true

export interface HeroMedia {
  /** foto do ator (licença livre, crédito obrigatório) */
  human: { src: string; name: string; credit: string }
  /** cenas dos filmes: "Cidade, ano" */
  scenes: { src: string; place: string; year: number; film: string }[]
  /** trajes recortados, com nome, filme e ano */
  suits: { src: string; name: string; year: number; film: string }[]
}

const MEDIA: Record<string, HeroMedia> = {
  "homem-de-ferro": {
    "human": {
      "src": "/media/homem-de-ferro/humano.webp",
      "name": "Robert Downey Jr.",
      "credit": "Gage Skidmore · CC BY-SA 2.0 · Wikimedia Commons"
    },
    "scenes": [
      {
        "src": "/media/homem-de-ferro/cena-1.webp",
        "place": "Afeganistão",
        "year": 2008,
        "film": "Homem de Ferro"
      },
      {
        "src": "/media/homem-de-ferro/cena-2.webp",
        "place": "Malibu",
        "year": 2008,
        "film": "Homem de Ferro"
      },
      {
        "src": "/media/homem-de-ferro/cena-3.webp",
        "place": "Mônaco",
        "year": 2010,
        "film": "Homem de Ferro 2"
      },
      {
        "src": "/media/homem-de-ferro/cena-4.webp",
        "place": "Nova York",
        "year": 2012,
        "film": "Os Vingadores"
      },
      {
        "src": "/media/homem-de-ferro/cena-5.webp",
        "place": "Sokovia",
        "year": 2015,
        "film": "Vingadores: Era de Ultron"
      },
      {
        "src": "/media/homem-de-ferro/cena-6.webp",
        "place": "Titã",
        "year": 2018,
        "film": "Vingadores: Guerra Infinita"
      },
      {
        "src": "/media/homem-de-ferro/cena-7.webp",
        "place": "Complexo dos Vingadores",
        "year": 2019,
        "film": "Vingadores: Ultimato"
      }
    ],
    "suits": [
      {
        "src": "/media/homem-de-ferro/traje-1.webp",
        "name": "Mark I",
        "year": 2008,
        "film": "Homem de Ferro"
      },
      {
        "src": "/media/homem-de-ferro/traje-2.webp",
        "name": "Mark III",
        "year": 2008,
        "film": "Homem de Ferro"
      },
      {
        "src": "/media/homem-de-ferro/traje-3.webp",
        "name": "Mark VII",
        "year": 2012,
        "film": "Os Vingadores"
      },
      {
        "src": "/media/homem-de-ferro/traje-4.webp",
        "name": "Mark XLII",
        "year": 2013,
        "film": "Homem de Ferro 3"
      },
      {
        "src": "/media/homem-de-ferro/traje-5.webp",
        "name": "Mark XLVI",
        "year": 2016,
        "film": "Capitão América: Guerra Civil"
      },
      {
        "src": "/media/homem-de-ferro/traje-6.webp",
        "name": "Mark L",
        "year": 2018,
        "film": "Vingadores: Guerra Infinita"
      }
    ]
  },
  "thor": {
    "human": {
      "src": "/media/thor/humano.webp",
      "name": "Chris Hemsworth",
      "credit": "Gage Skidmore · CC BY-SA 3.0 · Wikimedia Commons"
    },
    "scenes": [
      {
        "src": "/media/thor/cena-1.webp",
        "place": "Novo México",
        "year": 2011,
        "film": "Thor"
      },
      {
        "src": "/media/thor/cena-2.webp",
        "place": "Svartalfheim",
        "year": 2013,
        "film": "Thor: O Mundo Sombrio"
      },
      {
        "src": "/media/thor/cena-3.webp",
        "place": "Noruega",
        "year": 2017,
        "film": "Thor: Ragnarok"
      },
      {
        "src": "/media/thor/cena-4.webp",
        "place": "Sakaar",
        "year": 2017,
        "film": "Thor: Ragnarok"
      },
      {
        "src": "/media/thor/cena-5.webp",
        "place": "Wakanda",
        "year": 2018,
        "film": "Vingadores: Guerra Infinita"
      },
      {
        "src": "/media/thor/cena-6.webp",
        "place": "Nova Asgard",
        "year": 2019,
        "film": "Vingadores: Ultimato"
      },
      {
        "src": "/media/thor/cena-7.webp",
        "place": "Cidade da Onipotência",
        "year": 2022,
        "film": "Thor: Amor e Trovão"
      }
    ],
    "suits": [
      {
        "src": "/media/thor/traje-1.webp",
        "name": "Gladiador de Sakaar",
        "year": 2017,
        "film": "Thor: Ragnarok"
      },
      {
        "src": "/media/thor/traje-2.webp",
        "name": "Ragnarok",
        "year": 2017,
        "film": "Thor: Ragnarok"
      },
      {
        "src": "/media/thor/traje-3.webp",
        "name": "Guerra Infinita",
        "year": 2018,
        "film": "Vingadores: Guerra Infinita"
      }
    ]
  },
  "capitao-america": {
    "human": {
      "src": "/media/capitao-america/humano.webp",
      "name": "Chris Evans",
      "credit": "Elen Nivrae · CC BY 2.0 · Wikimedia Commons"
    },
    "scenes": [
      {
        "src": "/media/capitao-america/cena-1.webp",
        "place": "Ártico",
        "year": 1945,
        "film": "Capitão América: O Primeiro Vingador"
      },
      {
        "src": "/media/capitao-america/cena-2.webp",
        "place": "Nova York",
        "year": 2012,
        "film": "Os Vingadores"
      },
      {
        "src": "/media/capitao-america/cena-3.webp",
        "place": "Washington",
        "year": 2014,
        "film": "Capitão América 2: O Soldado Invernal"
      },
      {
        "src": "/media/capitao-america/cena-4.webp",
        "place": "Leipzig",
        "year": 2016,
        "film": "Capitão América: Guerra Civil"
      },
      {
        "src": "/media/capitao-america/cena-5.webp",
        "place": "Complexo dos Vingadores",
        "year": 2023,
        "film": "Vingadores: Ultimato"
      },
      {
        "src": "/media/capitao-america/cena-6.webp",
        "place": "Nova York",
        "year": 2023,
        "film": "Vingadores: Ultimato"
      }
    ],
    "suits": [
      {
        "src": "/media/capitao-america/traje-1.webp",
        "name": "Uniforme 2012",
        "year": 2012,
        "film": "Os Vingadores"
      },
      {
        "src": "/media/capitao-america/traje-2.webp",
        "name": "Guerra Civil",
        "year": 2016,
        "film": "Capitão América: Guerra Civil"
      },
      {
        "src": "/media/capitao-america/traje-3.webp",
        "name": "Digno",
        "year": 2019,
        "film": "Vingadores: Ultimato"
      }
    ]
  },
  "hulk": {
    "human": {
      "src": "/media/hulk/humano.webp",
      "name": "Mark Ruffalo",
      "credit": "Gage Skidmore · CC BY-SA 2.0 · Wikimedia Commons"
    },
    "scenes": [
      {
        "src": "/media/hulk/cena-1.webp",
        "place": "Universidade Culver",
        "year": 2008,
        "film": "O Incrível Hulk"
      },
      {
        "src": "/media/hulk/cena-2.webp",
        "place": "Harlem",
        "year": 2008,
        "film": "O Incrível Hulk"
      },
      {
        "src": "/media/hulk/cena-3.webp",
        "place": "Sakaar",
        "year": 2017,
        "film": "Thor: Ragnarok"
      },
      {
        "src": "/media/hulk/cena-4.webp",
        "place": "Sakaar",
        "year": 2017,
        "film": "Thor: Ragnarok"
      },
      {
        "src": "/media/hulk/cena-5.webp",
        "place": "Complexo dos Vingadores",
        "year": 2023,
        "film": "Vingadores: Ultimato"
      }
    ],
    "suits": [
      {
        "src": "/media/hulk/traje-1.webp",
        "name": "Gladiador",
        "year": 2017,
        "film": "Thor: Ragnarok"
      },
      {
        "src": "/media/hulk/traje-2.webp",
        "name": "Traje quântico",
        "year": 2019,
        "film": "Vingadores: Ultimato"
      }
    ]
  },
  "viuva-negra": {
    "human": {
      "src": "/media/viuva-negra/humano.webp",
      "name": "Scarlett Johansson",
      "credit": "Gage Skidmore · CC BY-SA 3.0 · Wikimedia Commons"
    },
    "scenes": [
      {
        "src": "/media/viuva-negra/cena-1.webp",
        "place": "Los Angeles",
        "year": 2010,
        "film": "Homem de Ferro 2"
      },
      {
        "src": "/media/viuva-negra/cena-2.webp",
        "place": "Queens",
        "year": 2010,
        "film": "Homem de Ferro 2"
      },
      {
        "src": "/media/viuva-negra/cena-3.webp",
        "place": "Budapeste",
        "year": 2016,
        "film": "Viúva Negra"
      },
      {
        "src": "/media/viuva-negra/cena-4.webp",
        "place": "Sala Vermelha",
        "year": 2016,
        "film": "Viúva Negra"
      },
      {
        "src": "/media/viuva-negra/cena-5.webp",
        "place": "Vormir",
        "year": 2023,
        "film": "Vingadores: Ultimato"
      }
    ],
    "suits": [
      {
        "src": "/media/viuva-negra/traje-1.webp",
        "name": "Uniforme da S.H.I.E.L.D.",
        "year": 2010,
        "film": "Homem de Ferro 2"
      },
      {
        "src": "/media/viuva-negra/traje-2.webp",
        "name": "Missão em Washington",
        "year": 2014,
        "film": "Capitão América 2: O Soldado Invernal"
      },
      {
        "src": "/media/viuva-negra/traje-3.webp",
        "name": "Traje de neve",
        "year": 2021,
        "film": "Viúva Negra"
      }
    ]
  },
  "gaviao-arqueiro": {
    "human": {
      "src": "/media/gaviao-arqueiro/humano.webp",
      "name": "Jeremy Renner",
      "credit": "Gage Skidmore · CC BY-SA 3.0 · Wikimedia Commons"
    },
    "scenes": [
      {
        "src": "/media/gaviao-arqueiro/cena-1.webp",
        "place": "Novo México",
        "year": 2011,
        "film": "Thor"
      },
      {
        "src": "/media/gaviao-arqueiro/cena-2.webp",
        "place": "Nova York",
        "year": 2012,
        "film": "Os Vingadores"
      },
      {
        "src": "/media/gaviao-arqueiro/cena-3.webp",
        "place": "Sokovia",
        "year": 2015,
        "film": "Vingadores: Era de Ultron"
      },
      {
        "src": "/media/gaviao-arqueiro/cena-4.webp",
        "place": "Tóquio",
        "year": 2018,
        "film": "Vingadores: Ultimato"
      },
      {
        "src": "/media/gaviao-arqueiro/cena-5.webp",
        "place": "Rockefeller Center",
        "year": 2024,
        "film": "Gavião Arqueiro"
      }
    ],
    "suits": [
      {
        "src": "/media/gaviao-arqueiro/traje-1.webp",
        "name": "Uniforme 2012",
        "year": 2012,
        "film": "Os Vingadores"
      },
      {
        "src": "/media/gaviao-arqueiro/traje-2.webp",
        "name": "Guerra Civil",
        "year": 2016,
        "film": "Capitão América: Guerra Civil"
      },
      {
        "src": "/media/gaviao-arqueiro/traje-3.webp",
        "name": "Ronin",
        "year": 2019,
        "film": "Vingadores: Ultimato"
      }
    ]
  },
  "homem-aranha": {
    "human": {
      "src": "/media/homem-aranha/humano.webp",
      "name": "Tom Holland",
      "credit": "Gage Skidmore · CC BY-SA 3.0 · Wikimedia Commons"
    },
    "scenes": [
      {
        "src": "/media/homem-aranha/cena-1.webp",
        "place": "Leipzig",
        "year": 2016,
        "film": "Capitão América: Guerra Civil"
      },
      {
        "src": "/media/homem-aranha/cena-2.webp",
        "place": "Washington",
        "year": 2016,
        "film": "Homem-Aranha: De Volta ao Lar"
      },
      {
        "src": "/media/homem-aranha/cena-3.webp",
        "place": "Balsa de Staten Island",
        "year": 2016,
        "film": "Homem-Aranha: De Volta ao Lar"
      },
      {
        "src": "/media/homem-aranha/cena-4.webp",
        "place": "Titã",
        "year": 2018,
        "film": "Vingadores: Guerra Infinita"
      },
      {
        "src": "/media/homem-aranha/cena-5.webp",
        "place": "Veneza",
        "year": 2024,
        "film": "Homem-Aranha: Longe de Casa"
      },
      {
        "src": "/media/homem-aranha/cena-6.webp",
        "place": "Estátua da Liberdade",
        "year": 2024,
        "film": "Homem-Aranha: Sem Volta para Casa"
      }
    ],
    "suits": [
      {
        "src": "/media/homem-aranha/traje-1.webp",
        "name": "Traje caseiro",
        "year": 2016,
        "film": "Homem-Aranha: De Volta ao Lar"
      },
      {
        "src": "/media/homem-aranha/traje-2.webp",
        "name": "Traje Stark",
        "year": 2016,
        "film": "Capitão América: Guerra Civil"
      },
      {
        "src": "/media/homem-aranha/traje-3.webp",
        "name": "Aranha de Ferro",
        "year": 2018,
        "film": "Vingadores: Guerra Infinita"
      },
      {
        "src": "/media/homem-aranha/traje-4.webp",
        "name": "Traje aprimorado",
        "year": 2019,
        "film": "Homem-Aranha: Longe de Casa"
      }
    ]
  },
  "doutor-estranho": {
    "human": {
      "src": "/media/doutor-estranho/humano.webp",
      "name": "Benedict Cumberbatch",
      "credit": "Gage Skidmore · CC BY-SA 2.0 · Wikimedia Commons"
    },
    "scenes": [
      {
        "src": "/media/doutor-estranho/cena-1.webp",
        "place": "Kamar-Taj",
        "year": 2016,
        "film": "Doutor Estranho"
      },
      {
        "src": "/media/doutor-estranho/cena-2.webp",
        "place": "Dimensão Espelhada",
        "year": 2016,
        "film": "Doutor Estranho"
      },
      {
        "src": "/media/doutor-estranho/cena-3.webp",
        "place": "Sanctum Sanctorum",
        "year": 2016,
        "film": "Doutor Estranho"
      },
      {
        "src": "/media/doutor-estranho/cena-4.webp",
        "place": "Hong Kong",
        "year": 2016,
        "film": "Doutor Estranho"
      },
      {
        "src": "/media/doutor-estranho/cena-5.webp",
        "place": "Titã",
        "year": 2018,
        "film": "Vingadores: Guerra Infinita"
      }
    ],
    "suits": [
      {
        "src": "/media/doutor-estranho/traje-1.webp",
        "name": "Manto da Levitação",
        "year": 2016,
        "film": "Doutor Estranho"
      },
      {
        "src": "/media/doutor-estranho/traje-2.webp",
        "name": "Multiverso",
        "year": 2022,
        "film": "Doutor Estranho no Multiverso da Loucura"
      }
    ]
  },
  "pantera-negra": {
    "human": {
      "src": "/media/pantera-negra/humano.webp",
      "name": "Chadwick Boseman",
      "credit": "Gage Skidmore · CC BY-SA 2.0 · Wikimedia Commons"
    },
    "scenes": [
      {
        "src": "/media/pantera-negra/cena-1.webp",
        "place": "Bucareste",
        "year": 2016,
        "film": "Capitão América: Guerra Civil"
      },
      {
        "src": "/media/pantera-negra/cena-2.webp",
        "place": "Busan",
        "year": 2016,
        "film": "Pantera Negra"
      },
      {
        "src": "/media/pantera-negra/cena-3.webp",
        "place": "Cidade Dourada",
        "year": 2016,
        "film": "Pantera Negra"
      },
      {
        "src": "/media/pantera-negra/cena-4.webp",
        "place": "Plano Ancestral",
        "year": 2016,
        "film": "Pantera Negra"
      },
      {
        "src": "/media/pantera-negra/cena-5.webp",
        "place": "Wakanda",
        "year": 2018,
        "film": "Vingadores: Guerra Infinita"
      }
    ],
    "suits": [
      {
        "src": "/media/pantera-negra/traje-1.webp",
        "name": "Traje real",
        "year": 2016,
        "film": "Capitão América: Guerra Civil"
      },
      {
        "src": "/media/pantera-negra/traje-2.webp",
        "name": "Traje da Shuri",
        "year": 2025,
        "film": "Pantera Negra: Wakanda para Sempre"
      }
    ]
  },
  "feiticeira-escarlate": {
    "human": {
      "src": "/media/feiticeira-escarlate/humano.webp",
      "name": "Elizabeth Olsen",
      "credit": "John Sears · CC BY-SA 4.0 · Wikimedia Commons"
    },
    "scenes": [
      {
        "src": "/media/feiticeira-escarlate/cena-1.webp",
        "place": "Sokovia",
        "year": 2015,
        "film": "Vingadores: Era de Ultron"
      },
      {
        "src": "/media/feiticeira-escarlate/cena-2.webp",
        "place": "Leipzig",
        "year": 2016,
        "film": "Capitão América: Guerra Civil"
      },
      {
        "src": "/media/feiticeira-escarlate/cena-3.webp",
        "place": "Wakanda",
        "year": 2018,
        "film": "Vingadores: Guerra Infinita"
      },
      {
        "src": "/media/feiticeira-escarlate/cena-4.webp",
        "place": "Complexo dos Vingadores",
        "year": 2023,
        "film": "Vingadores: Ultimato"
      },
      {
        "src": "/media/feiticeira-escarlate/cena-5.webp",
        "place": "Westview",
        "year": 2023,
        "film": "WandaVision"
      },
      {
        "src": "/media/feiticeira-escarlate/cena-6.webp",
        "place": "Monte Wundagore",
        "year": 2024,
        "film": "Doutor Estranho no Multiverso da Loucura"
      }
    ],
    "suits": [
      {
        "src": "/media/feiticeira-escarlate/traje-1.webp",
        "name": "Casaco vermelho",
        "year": 2016,
        "film": "Capitão América: Guerra Civil"
      },
      {
        "src": "/media/feiticeira-escarlate/traje-2.webp",
        "name": "Guerra Infinita",
        "year": 2018,
        "film": "Vingadores: Guerra Infinita"
      }
    ]
  },
  "visao": {
    "human": {
      "src": "/media/visao/humano.webp",
      "name": "Paul Bettany",
      "credit": "Gage Skidmore · CC BY-SA 2.0 · Wikimedia Commons"
    },
    "scenes": [
      {
        "src": "/media/visao/cena-1.webp",
        "place": "Torre dos Vingadores",
        "year": 2015,
        "film": "Vingadores: Era de Ultron"
      },
      {
        "src": "/media/visao/cena-2.webp",
        "place": "Sokovia",
        "year": 2015,
        "film": "Vingadores: Era de Ultron"
      },
      {
        "src": "/media/visao/cena-3.webp",
        "place": "Edimburgo",
        "year": 2018,
        "film": "Vingadores: Guerra Infinita"
      },
      {
        "src": "/media/visao/cena-4.webp",
        "place": "Wakanda",
        "year": 2018,
        "film": "Vingadores: Guerra Infinita"
      },
      {
        "src": "/media/visao/cena-5.webp",
        "place": "Westview",
        "year": 2023,
        "film": "WandaVision"
      }
    ],
    "suits": [
      {
        "src": "/media/visao/traje-1.webp",
        "name": "Corpo de vibranium",
        "year": 2015,
        "film": "Vingadores: Era de Ultron"
      }
    ]
  },
  "capita-marvel": {
    "human": {
      "src": "/media/capita-marvel/humano.webp",
      "name": "Brie Larson",
      "credit": "2d Lt Jessica Cicchetto · Domínio público · Wikimedia Commons"
    },
    "scenes": [
      {
        "src": "/media/capita-marvel/cena-1.webp",
        "place": "Hala",
        "year": 1995,
        "film": "Capitã Marvel"
      },
      {
        "src": "/media/capita-marvel/cena-2.webp",
        "place": "Los Angeles",
        "year": 1995,
        "film": "Capitã Marvel"
      },
      {
        "src": "/media/capita-marvel/cena-3.webp",
        "place": "Órbita da Terra",
        "year": 1995,
        "film": "Capitã Marvel"
      },
      {
        "src": "/media/capita-marvel/cena-4.webp",
        "place": "Frota de Ronan",
        "year": 1995,
        "film": "Capitã Marvel"
      },
      {
        "src": "/media/capita-marvel/cena-5.webp",
        "place": "Complexo dos Vingadores",
        "year": 2023,
        "film": "Vingadores: Ultimato"
      }
    ],
    "suits": [
      {
        "src": "/media/capita-marvel/traje-1.webp",
        "name": "Traje vermelho e azul",
        "year": 1995,
        "film": "Capitã Marvel"
      }
    ]
  },
  "homem-formiga": {
    "human": {
      "src": "/media/homem-formiga/humano.webp",
      "name": "Paul Rudd",
      "credit": "Gage Skidmore · CC BY-SA 2.0 · Wikimedia Commons"
    },
    "scenes": [
      {
        "src": "/media/homem-formiga/cena-1.webp",
        "place": "Pym Tech",
        "year": 2015,
        "film": "Homem-Formiga"
      },
      {
        "src": "/media/homem-formiga/cena-2.webp",
        "place": "São Francisco",
        "year": 2015,
        "film": "Homem-Formiga"
      },
      {
        "src": "/media/homem-formiga/cena-3.webp",
        "place": "Quarto da Cassie",
        "year": 2015,
        "film": "Homem-Formiga"
      },
      {
        "src": "/media/homem-formiga/cena-4.webp",
        "place": "Complexo dos Vingadores",
        "year": 2023,
        "film": "Vingadores: Ultimato"
      },
      {
        "src": "/media/homem-formiga/cena-5.webp",
        "place": "Reino Quântico",
        "year": 2025,
        "film": "Homem-Formiga e a Vespa: Quantumania"
      }
    ],
    "suits": [
      {
        "src": "/media/homem-formiga/traje-1.webp",
        "name": "Traje original",
        "year": 2015,
        "film": "Homem-Formiga"
      }
    ]
  },
  "vespa": {
    "human": {
      "src": "/media/vespa/humano.webp",
      "name": "Evangeline Lilly",
      "credit": "Gage Skidmore · CC BY-SA 2.0 · Wikimedia Commons"
    },
    "scenes": [
      {
        "src": "/media/vespa/cena-1.webp",
        "place": "Laboratório de Pym",
        "year": 2018,
        "film": "Homem-Formiga e a Vespa"
      },
      {
        "src": "/media/vespa/cena-2.webp",
        "place": "São Francisco",
        "year": 2018,
        "film": "Homem-Formiga e a Vespa"
      },
      {
        "src": "/media/vespa/cena-3.webp",
        "place": "Complexo dos Vingadores",
        "year": 2023,
        "film": "Vingadores: Ultimato"
      },
      {
        "src": "/media/vespa/cena-4.webp",
        "place": "Reino Quântico",
        "year": 2025,
        "film": "Homem-Formiga e a Vespa: Quantumania"
      }
    ],
    "suits": [
      {
        "src": "/media/vespa/traje-1.webp",
        "name": "Traje com asas",
        "year": 2025,
        "film": "Homem-Formiga e a Vespa: Quantumania"
      }
    ]
  },
  "falcao": {
    "human": {
      "src": "/media/falcao/humano.webp",
      "name": "Anthony Mackie",
      "credit": "Quejaytee · CC BY 4.0 · Wikimedia Commons"
    },
    "scenes": [
      {
        "src": "/media/falcao/cena-1.webp",
        "place": "Washington, D.C.",
        "year": 2014,
        "film": "Capitão América 2: O Soldado Invernal"
      },
      {
        "src": "/media/falcao/cena-2.webp",
        "place": "Aeroporto de Leipzig",
        "year": 2016,
        "film": "Capitão América: Guerra Civil"
      },
      {
        "src": "/media/falcao/cena-3.webp",
        "place": "Delacroix, Louisiana",
        "year": 2024,
        "film": "Falcão e o Soldado Invernal"
      },
      {
        "src": "/media/falcao/cena-4.webp",
        "place": "Nova York",
        "year": 2024,
        "film": "Falcão e o Soldado Invernal"
      }
    ],
    "suits": [
      {
        "src": "/media/falcao/traje-1.webp",
        "name": "Asas EXO-7",
        "year": 2014,
        "film": "Capitão América 2: O Soldado Invernal"
      }
    ]
  },
  "soldado-invernal": {
    "human": {
      "src": "/media/soldado-invernal/humano.webp",
      "name": "Sebastian Stan",
      "credit": "Gage Skidmore · CC BY-SA 3.0 · Wikimedia Commons"
    },
    "scenes": [
      {
        "src": "/media/soldado-invernal/cena-1.webp",
        "place": "Washington, D.C.",
        "year": 2014,
        "film": "Capitão América 2: O Soldado Invernal"
      },
      {
        "src": "/media/soldado-invernal/cena-2.webp",
        "place": "Helicarrier da S.H.I.E.L.D.",
        "year": 2014,
        "film": "Capitão América 2: O Soldado Invernal"
      },
      {
        "src": "/media/soldado-invernal/cena-3.webp",
        "place": "Madripoor",
        "year": 2024,
        "film": "Falcão e o Soldado Invernal"
      },
      {
        "src": "/media/soldado-invernal/cena-4.webp",
        "place": "Delacroix, Louisiana",
        "year": 2024,
        "film": "Falcão e o Soldado Invernal"
      }
    ],
    "suits": [
      {
        "src": "/media/soldado-invernal/traje-1.webp",
        "name": "Braço de metal",
        "year": 2014,
        "film": "Capitão América 2: O Soldado Invernal"
      }
    ]
  },
  "maquina-de-combate": {
    "human": {
      "src": "/media/maquina-de-combate/humano.webp",
      "name": "Don Cheadle",
      "credit": "PhilipRomanoPhoto · CC BY-SA 4.0 · Wikimedia Commons"
    },
    "scenes": [
      {
        "src": "/media/maquina-de-combate/cena-1.webp",
        "place": "Sede da Stark Industries",
        "year": 2008,
        "film": "Homem de Ferro"
      },
      {
        "src": "/media/maquina-de-combate/cena-2.webp",
        "place": "Aeroporto de Leipzig",
        "year": 2016,
        "film": "Capitão América: Guerra Civil"
      },
      {
        "src": "/media/maquina-de-combate/cena-3.webp",
        "place": "Complexo dos Vingadores",
        "year": 2018,
        "film": "Vingadores: Guerra Infinita"
      },
      {
        "src": "/media/maquina-de-combate/cena-4.webp",
        "place": "Morag",
        "year": 2014,
        "film": "Vingadores: Ultimato"
      }
    ],
    "suits": [
      {
        "src": "/media/maquina-de-combate/traje-1.webp",
        "name": "Armadura Mark I",
        "year": 2010,
        "film": "Homem de Ferro 2"
      },
      {
        "src": "/media/maquina-de-combate/traje-2.webp",
        "name": "Armadura Mark IV",
        "year": 2018,
        "film": "Vingadores: Guerra Infinita"
      }
    ]
  },
  "senhor-das-estrelas": {
    "human": {
      "src": "/media/senhor-das-estrelas/humano.webp",
      "name": "Chris Pratt",
      "credit": "Dick Thomas Johnson · CC BY 2.0 · Wikimedia Commons"
    },
    "scenes": [
      {
        "src": "/media/senhor-das-estrelas/cena-1.webp",
        "place": "Morag",
        "year": 2014,
        "film": "Guardiões da Galáxia"
      },
      {
        "src": "/media/senhor-das-estrelas/cena-2.webp",
        "place": "Lugar Nenhum",
        "year": 2014,
        "film": "Guardiões da Galáxia"
      },
      {
        "src": "/media/senhor-das-estrelas/cena-3.webp",
        "place": "Orgoscópio",
        "year": 2026,
        "film": "Guardiões da Galáxia Vol. 3"
      },
      {
        "src": "/media/senhor-das-estrelas/cena-4.webp",
        "place": "Contra-Terra",
        "year": 2026,
        "film": "Guardiões da Galáxia Vol. 3"
      }
    ],
    "suits": [
      {
        "src": "/media/senhor-das-estrelas/traje-1.webp",
        "name": "Sobretudo de Saqueador",
        "year": 2014,
        "film": "Guardiões da Galáxia"
      },
      {
        "src": "/media/senhor-das-estrelas/traje-2.webp",
        "name": "Jaqueta dos Guardiões",
        "year": 2014,
        "film": "Guardiões da Galáxia Vol. 2"
      }
    ]
  },
  "gamora": {
    "human": {
      "src": "/media/gamora/humano.webp",
      "name": "Zoe Saldaña",
      "credit": "Gage Skidmore · CC BY-SA 3.0 · Wikimedia Commons"
    },
    "scenes": [
      {
        "src": "/media/gamora/cena-1.webp",
        "place": "Planeta de Ego",
        "year": 2014,
        "film": "Guardiões da Galáxia Vol. 2"
      },
      {
        "src": "/media/gamora/cena-2.webp",
        "place": "Vormir",
        "year": 2018,
        "film": "Vingadores: Guerra Infinita"
      },
      {
        "src": "/media/gamora/cena-3.webp",
        "place": "Complexo dos Vingadores",
        "year": 2023,
        "film": "Vingadores: Ultimato"
      },
      {
        "src": "/media/gamora/cena-4.webp",
        "place": "A bordo de uma nave",
        "year": 2026,
        "film": "Guardiões da Galáxia Vol. 3"
      }
    ],
    "suits": [
      {
        "src": "/media/gamora/traje-1.webp",
        "name": "Traje de assassina",
        "year": 2014,
        "film": "Guardiões da Galáxia"
      },
      {
        "src": "/media/gamora/traje-2.webp",
        "name": "Sobretudo de couro",
        "year": 2014,
        "film": "Guardiões da Galáxia Vol. 2"
      }
    ]
  },
  "loki": {
    "human": {
      "src": "/media/loki/humano.webp",
      "name": "Tom Hiddleston",
      "credit": "Gage Skidmore · CC BY-SA 2.0 · Wikimedia Commons"
    },
    "scenes": [
      {
        "src": "/media/loki/cena-1.webp",
        "place": "Asgard",
        "year": 2010,
        "film": "Thor"
      },
      {
        "src": "/media/loki/cena-2.webp",
        "place": "Nova York",
        "year": 2012,
        "film": "Os Vingadores"
      },
      {
        "src": "/media/loki/cena-3.webp",
        "place": "Sakaar",
        "year": 2017,
        "film": "Thor: Ragnarok"
      },
      {
        "src": "/media/loki/cena-4.webp",
        "place": "Sede da AVT",
        "year": 2012,
        "film": "Loki"
      }
    ],
    "suits": [
      {
        "src": "/media/loki/traje-1.webp",
        "name": "Armadura com chifres",
        "year": 2012,
        "film": "Os Vingadores"
      }
    ]
  },
  "shang-chi": {
    "human": {
      "src": "/media/shang-chi/humano.webp",
      "name": "Simu Liu",
      "credit": "Gage Skidmore · CC BY-SA 3.0 · Wikimedia Commons"
    },
    "scenes": [
      {
        "src": "/media/shang-chi/cena-1.webp",
        "place": "São Francisco",
        "year": 2024,
        "film": "Shang-Chi e a Lenda dos Dez Anéis"
      },
      {
        "src": "/media/shang-chi/cena-2.webp",
        "place": "Macau",
        "year": 2024,
        "film": "Shang-Chi e a Lenda dos Dez Anéis"
      },
      {
        "src": "/media/shang-chi/cena-3.webp",
        "place": "Ta Lo",
        "year": 2024,
        "film": "Shang-Chi e a Lenda dos Dez Anéis"
      },
      {
        "src": "/media/shang-chi/cena-4.webp",
        "place": "Ta Lo",
        "year": 2024,
        "film": "Shang-Chi e a Lenda dos Dez Anéis"
      }
    ],
    "suits": [
      {
        "src": "/media/shang-chi/traje-1.webp",
        "name": "Traje de Ta Lo",
        "year": 2024,
        "film": "Shang-Chi e a Lenda dos Dez Anéis"
      }
    ]
  },
  "cavaleiro-da-lua": {
    "human": {
      "src": "/media/cavaleiro-da-lua/humano.webp",
      "name": "Oscar Isaac",
      "credit": "Gage Skidmore · CC BY-SA 3.0 · Wikimedia Commons"
    },
    "scenes": [
      {
        "src": "/media/cavaleiro-da-lua/cena-1.webp",
        "place": "Galeria Nacional, Londres",
        "year": 2025,
        "film": "Cavaleiro da Lua"
      },
      {
        "src": "/media/cavaleiro-da-lua/cena-2.webp",
        "place": "Londres",
        "year": 2025,
        "film": "Cavaleiro da Lua"
      },
      {
        "src": "/media/cavaleiro-da-lua/cena-3.webp",
        "place": "Cairo",
        "year": 2025,
        "film": "Cavaleiro da Lua"
      },
      {
        "src": "/media/cavaleiro-da-lua/cena-4.webp",
        "place": "Tumba de Alexandre, o Grande",
        "year": 2025,
        "film": "Cavaleiro da Lua"
      }
    ],
    "suits": []
  },
  "ms-marvel": {
    "human": {
      "src": "/media/ms-marvel/humano.webp",
      "name": "Iman Vellani",
      "credit": "VOA Urdu · Domínio público · Wikimedia Commons"
    },
    "scenes": [
      {
        "src": "/media/ms-marvel/cena-1.webp",
        "place": "Jersey City",
        "year": 2025,
        "film": "Ms. Marvel"
      },
      {
        "src": "/media/ms-marvel/cena-2.webp",
        "place": "Estação de Carachi",
        "year": 2025,
        "film": "Ms. Marvel"
      },
      {
        "src": "/media/ms-marvel/cena-3.webp",
        "place": "Partição da Índia",
        "year": 1947,
        "film": "Ms. Marvel"
      },
      {
        "src": "/media/ms-marvel/cena-4.webp",
        "place": "Casa dos Rambeau",
        "year": 2026,
        "film": "As Marvels"
      }
    ],
    "suits": [
      {
        "src": "/media/ms-marvel/traje-1.webp",
        "name": "Traje feito em casa",
        "year": 2025,
        "film": "Ms. Marvel"
      }
    ]
  }
}

export function getMedia(id: string): HeroMedia | undefined {
  const m = MEDIA[id]
  if (!m) return undefined
  return MARVEL_MEDIA_ENABLED ? m : { ...m, scenes: [], suits: [] }
}
