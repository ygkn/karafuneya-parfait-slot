/**
 * Build src/lib/stores.json from the hand-checked extraction in data/extracted/.
 *
 *   data/extracted/items/<store>.json     numbered parfaits read from each store's menu PDF
 *   data/extracted/sections/<store>.json  menu section headings and the item numbers under them
 *
 * Run: npm run data   (Node runs this TypeScript file directly)
 */
import { readFileSync, writeFileSync } from 'node:fs'

interface RawItem { no: number | null; name: string; price: number | null }
interface RawSection { name: string; items: number[] }
interface Section { label: string; items: number[] }

const root = new URL('../', import.meta.url)
const readJson = (path: string): unknown => JSON.parse(readFileSync(new URL(path, root), 'utf8'))

const FETCHED_AT = '2026-11-08' // when the menu PDFs were downloaded and read
const BASE = 'https://karafuneya.jp/wp/wp-content/'
const STORES: readonly (readonly [key: string, name: string, path: string])[] = [
  ['honten', 'からふね屋珈琲 三条本店', 'uploads/2025/10/honten1009.pdf'],
  ['kumano', 'からふね屋珈琲 熊野店', 'uploads/2026/03/kumano_parfait_compressed.pdf'],
  ['ogura', 'からふね屋珈琲 小倉店', 'uploads/2026/03/2603_01_ogura_menu.pdf'],
  ['takeda', 'からふね屋珈琲 竹田店', 'uploads/2026/03/2603_01_takeda_menu.pdf'],
  ['takatsuki', 'からふね屋珈琲 高槻店', 'uploads/2026/03/2603_01_takatsuki_menu.pdf'],
  ['viera', 'からふね屋CAFE ビエラ高槻店', 'uploads/2026/03/vieratakatsuki_pafait_compressed.pdf'],
  ['osaka', 'からふね屋CAFE 大阪店', 'themes/fcvanilla/pdf/menu/osaka_pa.pdf'],
  ['abeno', 'からふね屋CAFE あべのキューズモール店', 'themes/fcvanilla/pdf/menu/abeno_menu.pdf'],
  ['okayama', 'からふね屋CAFE さんすて岡山店', 'uploads/2026/05/2605_18_okayama_menu.pdf'],
]

/** headings printed only in English get a Japanese display label */
const RENAME: Readonly<Record<string, string>> = {
  'OMOSHIRO PARFAIT': 'おもしろパフェ', 'THE BEER MUG PARFAIT': 'ジョッキパフェ', 'Afternoon Tea': 'アフタヌーンティー',
  'Melon!': 'メロン！', 'Strawberry!': 'ストロベリー！', 'Lemon!': 'レモン！', 'GELATO / ICE': 'ジェラート・アイス', PUDDING: 'プリン',
}
/** these menus print no flavour headings: borrow 三条本店's sections by item number */
const BORROW = new Set(['kumano', 'ogura', 'takeda', 'takatsuki'])
/** items in borrowing stores that 三条本店 doesn't sell, sorted by name */
const BORROW_EXTRA: ReadonlyMap<number, readonly string[]> = new Map([
  [166, ['ストロベリー', 'チョコレート']], [167, ['和風']], [169, ['チョコレート']], [170, ['和風']],
  [172, ['和風']], [173, ['キャラメル']], [215, ['パーティーパフェ']],
])
/** printed on viera's menu but missed in the first extraction pass */
const EXTRA_ITEMS: Readonly<Record<string, RawItem[]>> = {
  viera: [{ no: 391, name: 'よくばり和風パフェ～抹茶とほうじ茶～', price: 1310 }],
}
const EXTRA_SECTIONS: Readonly<Record<string, Record<string, number[]>>> = { viera: { お茶パフェ: [391] } }
/** novelty parfaits with savoury toppings (the menu calls them おもしろ系) */
const FUN: Readonly<Record<string, ReadonlySet<number>>> = {
  honten: new Set([47, 56, 231, 234, 235, 236, 329]),
  takatsuki: new Set([47, 56, 329]),
  osaka: new Set([47, 231, 234, 235, 236, 485, 545, 546]),
}

function noteFor(store: string, no: number, name: string): string | undefined {
  if (store === 'honten' && [133, 144, 162, 192, 193, 252].includes(no)) return '7日前までの予約制・大人数向け'
  if (no === 215 && name.includes('ジャンボ')) return '5日前までの予約制・4〜6人向け'
  if (name.includes('ジョッキ')) return 'ジョッキサイズ・みんなでシェア向け'
  if ([436, 437, 438].includes(no) && name.includes('Mini')) return 'フードかドリンクと一緒に頼むセット専用'
  if (name.includes('アフタヌーン')) return 'ドリンクバー付きのセット（ミニパフェ入り）'
  return undefined
}

/** large/party, reservation-only or set-only items: left out of the draw unless the player opts in */
function isSpecial(no: number, name: string, price: number | null): boolean {
  const p = price ?? 0
  return p >= 4000 || /ジョッキ|ピッチャー|ジャンボパフェ|アフタヌーン/.test(name) || ([436, 437, 438].includes(no) && p < 700)
}

function clean(heading: string): string {
  const h = heading.replace(/\s*\(.*?\)\s*$/, '').trim()
  return RENAME[h] ?? h
}

function sectionsFor(store: string, numbers: ReadonlySet<number>): Section[] {
  const own = readJson(`data/extracted/sections/${store}.json`) as { sections: RawSection[] }
  const result: Section[] = []
  const add = (label: string, items: readonly number[]): void => {
    const inStore = items.filter((n) => numbers.has(n))
    if (inStore.length === 0) return
    const existing = result.find((s) => s.label === label)
    if (existing) existing.items.push(...inStore.filter((n) => !existing.items.includes(n)))
    else result.push({ label, items: inStore })
  }
  if (BORROW.has(store)) {
    for (const s of own.sections) {
      const name = clean(s.name)
      if (['オススメ', 'おすすめ', 'ティラミス', '意外な'].some((w) => name.includes(w))) add(name, s.items)
    }
    for (const s of (readJson('data/extracted/sections/honten.json') as { sections: RawSection[] }).sections) {
      const name = clean(s.name)
      if (!name.includes('オススメ') && !name.includes('ティラミス')) add(name, s.items)
    }
    for (const [no, labels] of BORROW_EXTRA) for (const label of labels) add(label, [no])
  } else {
    for (const s of own.sections) add(clean(s.name), s.items)
  }
  for (const [label, items] of Object.entries(EXTRA_SECTIONS[store] ?? {})) add(label, items)
  return result
}

const stores = STORES.map(([key, name, path]) => {
  const raw = [...(readJson(`data/extracted/items/${key}.json`) as { items: RawItem[] }).items, ...(EXTRA_ITEMS[key] ?? [])]
  const seen = new Set<number>()
  const items = raw
    .flatMap((it) => (it.no === null ? [] : [{ ...it, no: it.no }]))
    .sort((a, b) => a.no - b.no)
    .filter((it) => !seen.has(it.no) && Boolean(seen.add(it.no)))
    .map((it) => {
      const note = noteFor(key, it.no, it.name)
      return {
        no: it.no, name: it.name, price: it.price,
        ...(isSpecial(it.no, it.name, it.price) ? { special: true } : {}),
        ...(FUN[key]?.has(it.no) === true ? { fun: true } : {}),
        ...(note === undefined ? {} : { note }),
      }
    })
  const secs = sectionsFor(key, seen)
  return {
    key, name, pdf: BASE + path, fetchedAt: FETCHED_AT,
    sections: secs.map((s) => s.label), borrowedSections: BORROW.has(key),
    items: items.map((it) => ({ ...it, sections: secs.flatMap((s, i) => (s.items.includes(it.no) ? [i] : [])) })),
  }
})

writeFileSync(new URL('src/lib/stores.json', root), JSON.stringify(stores, null, 1) + '\n')
for (const s of stores) console.log(`${s.key.padEnd(10)} ${String(s.items.length).padStart(4)} items ${String(s.sections.length).padStart(3)} sections`)
