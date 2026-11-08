import type { Parfait, Store } from './types'

/** how far (in symbols) a reel may slide after STOP in 目押し mode, like a real machine */
export const MAX_SLIP = 4

export const pad3 = (n: number) => String(n).padStart(3, '0')
export const digitAt = (p: Parfait, place: number) => Number(pad3(p.no)[place])
export const yen = (p: number | null) => (p == null ? '' : '¥' + p.toLocaleString('ja-JP'))
export const shortStoreName = (s: Store) => s.name.replace(/^からふね屋(珈琲|CAFE)\s*/, '')

export interface DrawOptions {
  includeSpecial: boolean
  /** selected section indexes; null = every section */
  sections: Set<number> | null
}

export function drawPool(store: Store, opt: DrawOptions): Parfait[] {
  const { includeSpecial, sections } = opt
  return store.items.filter(
    (p) => (includeSpecial || p.special !== true) && (sections === null || p.sections.some((i) => sections.has(i))),
  )
}

/** おまかせ mode: decide the parfait up front, every item equally likely */
export function drawFair(pool: readonly Parfait[], rand: () => number = Math.random): Parfait {
  const p = pool[Math.floor(rand() * pool.length)]
  if (!p) throw new Error('drawFair: empty pool')
  return p
}

export interface StopResult {
  digit: number
  /** distance to travel, in symbols (always > 0 so the reel never snaps backward) */
  dist: number
}

/**
 * Where a reel spinning at `pos` (digit on the payline, increasing as it scrolls) stops.
 * It slides forward to the nearest digit in `possible`, at most `maxSlip` symbols;
 * if none is in reach it stops where pressed (a miss in 目押し mode).
 */
export function resolveStop(pos: number, possible: Set<number>, maxSlip: number): StopResult {
  const at = (k: number): StopResult => {
    const n = Math.ceil(pos + 0.35 + k - 1e-4)
    return { digit: ((n % 10) + 10) % 10, dist: n - pos }
  }
  for (let k = 0; k <= maxSlip; k++) {
    const c = at(k)
    if (possible.has(c.digit)) return c
  }
  return at(0)
}

export function possibleDigits(cands: Parfait[], place: number): Set<number> {
  return new Set(cands.map((c) => digitAt(c, place)))
}

export function narrow(cands: Parfait[], place: number, digit: number): Parfait[] {
  return cands.filter((c) => digitAt(c, place) === digit)
}
