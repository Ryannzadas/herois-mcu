/**
 * Baixa as imagens de scripts/media-manifest.json para public/media/{id}/
 * (WebP otimizado) e gera src/data/media.ts com legendas e créditos.
 *
 *   node scripts/fetch-media.mjs
 *
 * Cenas e trajes são © Marvel Studios (uso de fã); fotos de atores vêm do
 * Wikimedia Commons com licença livre. Para tirar as imagens da Marvel do ar,
 * troque MARVEL_MEDIA_ENABLED para false em src/data/media.ts.
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = path.resolve(import.meta.dirname, '..')
const manifest = JSON.parse(await fs.readFile(path.join(root, 'scripts/media-manifest.json'), 'utf8'))
const UA = 'herois-fanzine/0.1 (projeto de fã sem fins lucrativos)'

function download(url) {
  // até 4 tentativas, com espera crescente (o CDN às vezes limita acessos seguidos)
  for (let i = 0; i < 4; i++) {
    const r = spawnSync('curl', ['-s', '-L', '--fail', '-A', UA, url], { maxBuffer: 64 * 1024 * 1024 })
    if (r.status === 0) return r.stdout
    spawnSync(process.execPath, ['-e', `setTimeout(()=>{}, ${1500 * (i + 1)})`])
  }
  throw new Error(`download falhou: ${url}`)
}

const exists = (p) => fs.access(p).then(() => true, () => false)

/** Remove fundo branco (trajes fotografados em estúdio) por limiar simples nas bordas. */
async function cutWhite(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const seen = new Uint8Array(w * h)
  const stack = []
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x)
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1)
  while (stack.length) {
    const p = stack.pop()
    if (seen[p]) continue
    seen[p] = 1
    const i = p * 4
    if (!(data[i] > 232 && data[i + 1] > 232 && data[i + 2] > 232)) continue
    data[i + 3] = 0
    const x = p % w
    if (x > 0) stack.push(p - 1)
    if (x < w - 1) stack.push(p + 1)
    if (p >= w) stack.push(p - w)
    if (p < w * (h - 1)) stack.push(p + w)
  }
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).trim({ threshold: 1 }).png().toBuffer()
}

const out = {}
for (const [id, m] of Object.entries(manifest)) {
  const dir = path.join(root, 'public/media', id)
  await fs.mkdir(dir, { recursive: true })
  // arquivos já baixados são reaproveitados (rode de novo à vontade)
  const save = async (getBuf, name, width) => {
    const out = path.join(dir, name)
    if (await exists(out)) return `/media/${id}/${name}`
    const buf = await getBuf()
    await sharp(buf).resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toFile(path.join(dir, name))
    return `/media/${id}/${name}`
  }

  const actorSrc = await save(() => download(m.actor.url), 'humano.webp', 900)
  const scenes = []
  for (const [i, s] of m.scenes.entries()) {
    scenes.push({ src: await save(() => download(s.url), `cena-${i + 1}.webp`, 1100), place: s.place, year: s.year, film: s.film })
  }
  const suits = []
  for (const [i, s] of m.suits.entries()) {
    suits.push({ src: await save(() => cutWhite(download(s.url)), `traje-${i + 1}.webp`, 600), name: s.name, year: s.year, film: s.film })
  }
  out[id] = {
    // "Gage Skidmore from Peoria, AZ…" → "Gage Skidmore"
    human: { src: actorSrc, name: m.actor.name, credit: `${m.actor.artist.split(' from ')[0]} · ${m.actor.license} · Wikimedia Commons` },
    scenes,
    suits,
  }
  console.log(`✓ ${id}: ${scenes.length} cenas, ${suits.length} trajes`)
}

const ts = `/* Gerado por scripts/fetch-media.mjs — edite o manifest e rode de novo. */

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

const MEDIA: Record<string, HeroMedia> = ${JSON.stringify(out, null, 2)}

export function getMedia(id: string): HeroMedia | undefined {
  const m = MEDIA[id]
  if (!m) return undefined
  return MARVEL_MEDIA_ENABLED ? m : { ...m, scenes: [], suits: [] }
}
`
await fs.writeFile(path.join(root, 'src/data/media.ts'), ts)
console.log('→ src/data/media.ts')
