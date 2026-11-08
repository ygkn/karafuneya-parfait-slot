import { describe, expect, it } from 'vitest'
import stores from './stores.json'
import type { Store } from './types'
import { drawFair, drawPool, MAX_SLIP, narrow, pad3, possibleDigits, resolveStop } from './slot'

const all = stores as Store[]
const byKey = (k: string): Store => {
  const s = all.find((x) => x.key === k)
  if (!s) throw new Error(k)
  return s
}

describe('menu data', () => {
  it('has unique numbers per store, all within 3 digits', () => {
    for (const s of all) {
      const nos = s.items.map((p) => p.no)
      expect(new Set(nos).size).toBe(nos.length)
      for (const n of nos) {
        expect(n).toBeGreaterThan(0)
        expect(n).toBeLessThan(1000)
      }
    }
  })
  it('puts every parfait in at least one menu section', () => {
    for (const s of all) for (const p of s.items) expect(p.sections.length, `${s.key} ${String(p.no)}`).toBeGreaterThan(0)
  })
})

describe('drawPool', () => {
  const honten = byKey('honten')
  it('leaves out special parfaits unless asked', () => {
    expect(drawPool(honten, { includeSpecial: false, sections: null }).some((p) => p.special === true)).toBe(false)
    expect(drawPool(honten, { includeSpecial: true, sections: null })).toHaveLength(honten.items.length)
  })
  it('filters by section', () => {
    const fun = honten.sections.indexOf('おもしろ系')
    const pool = drawPool(honten, { includeSpecial: false, sections: new Set([fun]) })
    expect(pool.length).toBeGreaterThan(0)
    expect(pool.every((p) => p.sections.includes(fun))).toBe(true)
  })
})

describe('drawFair', () => {
  it('maps the random number evenly onto the pool', () => {
    const pool = byKey('honten').items.slice(0, 4)
    expect(drawFair(pool, () => 0)).toBe(pool[0])
    expect(drawFair(pool, () => 0.99)).toBe(pool[3])
  })
})

describe('resolveStop', () => {
  it('always moves forward', () => {
    for (let pos = 0; pos < 10; pos += 0.13) expect(resolveStop(pos, new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), 9).dist).toBeGreaterThan(0)
  })
  it('slides to the nearest reachable digit', () => {
    expect(resolveStop(2.9, new Set([5]), MAX_SLIP).digit).toBe(5)
  })
  it('stops where pressed when nothing is within the slip limit', () => {
    // 9 is 5 symbols away from the next arriving symbol (4): out of reach, so no slide
    const r = resolveStop(2.9, new Set([9]), MAX_SLIP)
    expect(r.digit).toBe(4)
    expect(r.dist).toBeLessThan(1.5)
  })
  it('always lands on a real number when the slip is unlimited', () => {
    for (const s of all) {
      let cands = s.items
      let pos = 7.3
      for (const place of [0, 1, 2]) {
        const r = resolveStop(pos, possibleDigits(cands, place), 9)
        cands = narrow(cands, place, r.digit)
        pos = (pos * 3.7) % 10
      }
      expect(cands).toHaveLength(1)
      const [hit] = cands
      if (!hit) throw new Error('no hit')
      expect(s.items).toContain(hit)
      expect(pad3(hit.no)).toHaveLength(3)
    }
  })
})
