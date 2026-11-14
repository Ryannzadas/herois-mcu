/**
 * Padroniza as imagens dos heróis para public/characters/{id}/.
 *
 *   node scripts/prepare-images.mjs "<pasta com as imagens originais>"
 *
 * Para cada arquivo mapeado em SOURCES:
 *  - recorta as bordas transparentes (trim)
 *  - limita a 1000×1400 sem distorcer → traje.png
 *  - gera thumb.png (cabeça e tronco, 400 px de largura) para as mini capas
 * Imagens com fundo branco (ex.: JPG) passam por remoção de fundo por
 * preenchimento a partir das bordas; `cropBottom` corta logos/legendas.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const SOURCES = {
  'homem-de-ferro': 'avengers_endgame_iron_man_mark_85_png_by_metropoli_by_blackknight98_dd5lwtt.png',
  thor: 'thor_avengers_infinity_war_png_by_thatkonnorguy_djufdec.png',
  'capitao-america': 'captain_america_endgame_suit_transparent_png_by_itsmeq3_df8x9wf.png',
  hulk: 'hulk_avengers_age_of_ultron_png_7_by_joaolucasvingaprimos_diy2unz.png',
  'viuva-negra': 'mcu_black_widow_png_iron_man_2__by_nachoman1989_dmmp628.png',
  'gaviao-arqueiro': 'hawkeye_avengers_age_of_ultron_png_by_thatkonnorguy_djufvmg.png',
  'homem-aranha': '_mcu_spider_man_png_no_way_home_final_suit__by_nachoman1989_dlytw6t.png',
  'doutor-estranho': 'mcu_doctor_strange_png_mom__by_nachoman1989_dmn6zo8.png',
  'pantera-negra': 'mcu_black_panther_png_infinity_war__by_nachoman1989_dm3hzx7.png',
  'feiticeira-escarlate': 'wanda_png_by_purpleaxell_df6n0b9.png',
  visao: 'wandavision_vision_png_by_metropolis_hero1125_depf7qr-414w-2x.png',
  'capita-marvel': 'dfzdc6f-1580f053-0b31-4616-8e2c-7d9cf6829c7f.png',
  'homem-formiga': 'ant_man_quantumania_rebranding_suit_png_edit_by_hawkeyebr4_dmxjb8x-375w-2x.png',
  vespa: 'wasp_png_mcu_by_kevinalexande23_dlwvwk0-414w-2x.png',
  falcao: 'mcu_falcon_3_by_celebrate1932_dkg3wrq-414w-2x.png',
  'soldado-invernal': 'the_falcon_and_the_winter_soldier_bucky_png_by_metropolis_hero1125_dea37fp-375w-2x.png',
  'maquina-de-combate': 'war_machine_png_by_jt525pro_df6ncz8-414w-2x.png',
  'senhor-das-estrelas': 'mcu_star_lord_png_gotg_3__by_nachoman1989_dmmpnu1-375w-2x.png',
  gamora: 'gamora_guardians_of_the_galaxy_png_by_thatkonnorguy_djufl2h-pre.png',
  loki: { file: 'Loki - Suit 1 (TVA).jpg', removeWhite: true, cropBottom: 0.1 },
  'shang-chi': 'shang_chi_png_by_thatkonnorguy_djub7jk-pre.png',
  'cavaleiro-da-lua': 'mcu_moon_knight_png__by_nachoman1989_dlmax2o-375w-2x.png',
  'ms-marvel': 'kamala_khan_ms_marvel_solo_the_marvels_png9_by_iwasboredsoididthis_dldc4oh-414w-2x.png',
}

const MAX_W = 1000
const MAX_H = 1400
const THUMB_W = 400

const srcDir = process.argv[2]
if (!srcDir) {
  console.error('uso: node scripts/prepare-images.mjs "<pasta das imagens>"')
  process.exit(1)
}
const outRoot = path.resolve(import.meta.dirname, '../public/characters')

/** Remove fundo branco por preenchimento a partir das bordas (flood fill). */
async function removeWhiteBackground(input, cropBottom = 0) {
  const meta = await sharp(input).metadata()
  const height = Math.round(meta.height * (1 - cropBottom))
  const { data, info } = await sharp(input)
    .extract({ left: 0, top: 0, width: meta.width, height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const isBg = (i) => data[i] > 228 && data[i + 1] > 228 && data[i + 2] > 228
  const seen = new Uint8Array(w * h)
  const stack = []
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x)
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1)
  while (stack.length) {
    const p = stack.pop()
    if (seen[p]) continue
    seen[p] = 1
    if (!isBg(p * 4)) continue
    data[p * 4 + 3] = 0
    const x = p % w
    if (x > 0) stack.push(p - 1)
    if (x < w - 1) stack.push(p + 1)
    if (p >= w) stack.push(p - w)
    if (p < w * (h - 1)) stack.push(p + w)
  }
  // suaviza o contorno: pixels claros vizinhos do fundo ficam semitransparentes
  for (let p = 0; p < w * h; p++) {
    if (data[p * 4 + 3] === 0) continue
    const x = p % w
    const nearBg =
      (x > 0 && data[(p - 1) * 4 + 3] === 0) ||
      (x < w - 1 && data[(p + 1) * 4 + 3] === 0) ||
      (p >= w && data[(p - w) * 4 + 3] === 0) ||
      (p < w * (h - 1) && data[(p + w) * 4 + 3] === 0)
    if (nearBg) {
      const lum = (data[p * 4] + data[p * 4 + 1] + data[p * 4 + 2]) / 3
      data[p * 4 + 3] = Math.round(255 * Math.min(1, Math.max(0.35, (255 - lum) / 60)))
    }
  }
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer()
}

for (const [id, entry] of Object.entries(SOURCES)) {
  const opts = typeof entry === 'string' ? { file: entry } : entry
  const input = path.join(srcDir, opts.file)
  try {
    await fs.access(input)
  } catch {
    console.warn(`× ${id}: arquivo não encontrado (${opts.file})`)
    continue
  }
  let buf = opts.removeWhite ? await removeWhiteBackground(input, opts.cropBottom) : await fs.readFile(input)
  buf = await sharp(buf).ensureAlpha().trim({ threshold: 1 }).png().toBuffer()

  const dir = path.join(outRoot, id)
  await fs.mkdir(dir, { recursive: true })
  const traje = await sharp(buf)
    .resize({ width: MAX_W, height: MAX_H, fit: 'inside', withoutEnlargement: true })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(path.join(dir, 'traje.png'))

  // thumb: parte de cima da figura (cabeça e tronco)
  const resized = await sharp(buf).resize({ width: THUMB_W }).png().toBuffer()
  const { height: rh } = await sharp(resized).metadata()
  await sharp(resized)
    .extract({ left: 0, top: 0, width: THUMB_W, height: Math.min(rh, Math.round(THUMB_W * 1.15)) })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(path.join(dir, 'thumb.png'))

  const kb = Math.round((await fs.stat(path.join(dir, 'traje.png'))).size / 1024)
  console.log(`✓ ${id}: ${traje.width}×${traje.height} (${kb} KB)`)
}
