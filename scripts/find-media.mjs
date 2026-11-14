/**
 * Busca imagens candidatas e monta uma folha de contato numerada para revisão.
 *
 *   node scripts/find-media.mjs <fonte> "<busca>" <pasta-saida> [limite]
 *
 * Fontes:
 *   commons  — Wikimedia Commons (licenças livres; traz licença e autor)
 *   fandom   — MCU Wiki (imagens © Marvel Studios, uso de fã)
 *
 * Gera em <pasta-saida>/<slug>/: candidates.json (url, tamanho, licença,
 * autor, página) e contact.png (miniaturas numeradas).
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const [source, query, outDir, limitArg] = process.argv.slice(2)
if (!source || !query || !outDir) {
  console.error('uso: node scripts/find-media.mjs <commons|fandom> "<busca>" <pasta> [limite]')
  process.exit(1)
}
const limit = Number(limitArg ?? 12)
const UA = { 'User-Agent': 'herois-fanzine/0.1 (projeto de fã sem fins lucrativos)' }

/** O CDN de imagens da wiki recusa o fetch do Node (403), mas aceita o curl. */
export function download(url) {
  const r = spawnSync('curl', ['-s', '-L', '--fail', '-A', UA['User-Agent'], url], { maxBuffer: 64 * 1024 * 1024 })
  if (r.status !== 0) throw new Error(`download falhou (${r.status}): ${url}`)
  return r.stdout
}

const API = {
  commons: 'https://commons.wikimedia.org/w/api.php',
  fandom: 'https://marvelcinematicuniverse.fandom.com/api.php',
}[source]
if (!API) throw new Error(`fonte desconhecida: ${source}`)

const params = new URLSearchParams({
  action: 'query',
  format: 'json',
  generator: 'search',
  gsrnamespace: '6',
  gsrsearch: query,
  gsrlimit: String(limit),
  prop: 'imageinfo',
  iiprop: 'url|size|extmetadata|mime',
  iiurlwidth: '320',
})
const res = await fetch(`${API}?${params}`, { headers: UA })
const data = await res.json()
const strip = (s = '') => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

const pages = Object.values(data.query?.pages ?? {})
  .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
  .filter((p) => /image\/(jpeg|png|webp)/.test(p.imageinfo?.[0]?.mime ?? ''))

const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)
const dir = path.join(outDir, `${source}-${slug}`)
await fs.mkdir(dir, { recursive: true })

const candidates = []
const tiles = []
for (const [i, p] of pages.entries()) {
  const ii = p.imageinfo[0]
  const meta = ii.extmetadata ?? {}
  const thumbUrl = ii.thumburl ?? ii.url
  const c = {
    n: i + 1,
    title: p.title,
    url: ii.url,
    width: ii.width,
    height: ii.height,
    page: ii.descriptionurl,
    license: source === 'commons' ? strip(meta.LicenseShortName?.value) : '© Marvel Studios',
    artist: source === 'commons' ? strip(meta.Artist?.value) : '',
  }
  candidates.push(c)
  try {
    // a miniatura às vezes falha; nesse caso usa a imagem completa
    let buf = download(thumbUrl)
    try {
      await sharp(buf).metadata()
    } catch {
      buf = download(ii.url)
    }
    const tile = await sharp(buf).resize(240, 240, { fit: 'contain', background: '#ddd' }).png().toBuffer()
    const label = Buffer.from(
      `<svg width="240" height="240"><rect width="44" height="30" fill="#000"/><text x="8" y="22" font-size="20" font-family="Arial" font-weight="bold" fill="#fff">${c.n}</text><rect y="214" width="240" height="26" fill="#000" opacity=".7"/><text x="6" y="232" font-size="13" font-family="Arial" fill="#fff">${c.width}x${c.height}</text></svg>`,
    )
    tiles.push(await sharp(tile).composite([{ input: label }]).png().toBuffer())
  } catch (e) {
    console.warn(`× miniatura ${c.n}: ${e.message}`)
  }
}

await fs.writeFile(path.join(dir, 'candidates.json'), JSON.stringify(candidates, null, 2))
if (tiles.length) {
  const cols = 4
  const rows = Math.ceil(tiles.length / cols)
  await sharp({ create: { width: cols * 244, height: rows * 244, channels: 3, background: '#fff' } })
    .composite(tiles.map((t, i) => ({ input: t, left: (i % cols) * 244, top: Math.floor(i / cols) * 244 })))
    .png()
    .toFile(path.join(dir, 'contact.png'))
}
for (const c of candidates) console.log(`${c.n}. ${c.title} | ${c.width}x${c.height} | ${c.license}${c.artist ? ' | ' + c.artist : ''}`)
console.log(`→ ${dir}`)
