<script lang="ts">
  import { onMount } from 'svelte'
  import type { Parfait } from '../lib/types'
  import { drawFair, MAX_SLIP, narrow, possibleDigits, resolveStop } from '../lib/slot'

  let {
    spinning = $bindable(false),
    meoshi,
    getPool,
    onstart,
    onresult,
  }: {
    spinning?: boolean
    meoshi: boolean
    /** parfaits that may come out; an empty list means nothing can be drawn */
    getPool: () => Parfait[]
    onstart: () => void
    onresult: (r: { digits: number[]; parfait: Parfait | null }) => void
  } = $props()

  const W = 64, H = 150, SYM = 50
  interface Reel { pos: number; speed: number; state: 'idle' | 'spin' | 'stopping' | 'stopped'; from: number; dist: number; t0: number; dur: number; digit: number }
  const BULBS = Array.from({ length: 12 }, (_, i) => i)
  const PLACES = ['百', '十', '一'] as const
  const reels: Reel[] = [0, 1, 2].map(() => ({ pos: Math.random() * 10, speed: 0, state: 'idle', from: 0, dist: 0, t0: 0, dur: 0, digit: 0 }))
  let reelState = $state<Reel['state'][]>(['idle', 'idle', 'idle'])
  let canvases: HTMLCanvasElement[] = $state([])
  let win = $state(false)
  let pulled = $state(false)
  let candidates: Parfait[] = []

  let ink = '#3e2117'
  const font = '700 42px "M PLUS Rounded 1c","Hiragino Maru Gothic ProN",sans-serif'

  function draw(r: Reel, i: number) {
    const c = canvases[i]?.getContext('2d')
    if (!c) return
    c.clearRect(0, 0, W, H)
    c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = ink
    // pos = digit (float) on the payline; increasing pos scrolls numbers downward like a real reel
    const base = Math.floor(r.pos), frac = r.pos - base
    for (let k = -2; k <= 2; k++) c.fillText(String((((base - k) % 10) + 10) % 10), W / 2, H / 2 + 2 + (k + frac) * SYM)
  }

  const ease = (t: number) => 1 - Math.pow(1 - t, 3)

  onMount(() => {
    const dpr = window.devicePixelRatio || 1
    canvases.forEach((cv) => { cv.width = W * dpr; cv.height = H * dpr; cv.getContext('2d')?.scale(dpr, dpr) })
    ink = getComputedStyle(document.documentElement).getPropertyValue('--reel-ink').trim() || ink
    document.fonts.load(font).catch(() => undefined)
    let last = performance.now(), raf = 0
    const loop = (now: number) => {
      const dt = Math.min(50, now - last) / 1000
      last = now
      reels.forEach((r, i) => {
        if (r.state === 'spin') r.pos = (r.pos + r.speed * dt) % 10
        else if (r.state === 'stopping') {
          const t = Math.min(1, (now - r.t0) / r.dur)
          r.pos = (r.from + r.dist * ease(t)) % 10
          if (t >= 1) { r.pos = r.digit; r.state = 'stopped'; reelState[i] = 'stopped'; finishIfDone() }
        }
        draw(r, i)
      })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf) }
  })

  export function pull() {
    if (spinning) return
    const pool = getPool()
    if (!pool.length) return
    candidates = meoshi ? pool : [drawFair(pool)]
    spinning = true; win = false
    pulled = true; setTimeout(() => { pulled = false }, 260)
    reels.forEach((r, i) => { r.state = 'spin'; r.speed = 14 + i * 1.5; reelState[i] = 'spin' })
    onstart()
  }

  export function stop(i: number) {
    const r = reels[i]
    if (r?.state !== 'spin') return
    const res = resolveStop(r.pos, possibleDigits(candidates, i), meoshi ? MAX_SLIP : 9)
    Object.assign(r, { digit: res.digit, from: r.pos, dist: res.dist, t0: performance.now(), dur: 220 + res.dist * 70, state: 'stopping' })
    reelState[i] = 'stopping'
    candidates = narrow(candidates, i, res.digit)
  }

  /** Space key: pull the lever, or stop the leftmost spinning reel */
  export function next() {
    if (!spinning) {
      pull()
      return
    }
    const i = reels.findIndex((r) => r.state === 'spin')
    if (i >= 0) stop(i)
  }

  function finishIfDone() {
    if (!spinning || !reels.every((r) => r.state === 'stopped')) return
    spinning = false
    const parfait = candidates[0] ?? null
    win = !!parfait
    onresult({ digits: reels.map((r) => r.digit), parfait })
  }

  // lever: tap, or drag the cherry down and let go
  let drag: { y: number; dy: number } | null = null
  let armH = $state<number | null>(null)
  let skipClick = false
  function down(e: PointerEvent) {
    if (spinning) return
    drag = { y: e.clientY, dy: 0 }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  function move(e: PointerEvent) {
    if (!drag) return
    drag.dy = Math.max(0, Math.min(100, e.clientY - drag.y))
    armH = 160 - drag.dy
  }
  function up(fire: boolean) {
    if (!drag) return
    const d = drag.dy
    drag = null; armH = null
    skipClick = true; setTimeout(() => { skipClick = false }, 0)
    if (fire && (d < 6 || d >= 45)) pull()
  }
</script>

<div class="cabinet">
  <div class="parfait" class:spinning class:win>
    <div class="topping" aria-hidden="true"><span class="pocky"></span><span class="wafer"></span><span class="cherry"></span><div class="cream"></div></div>
    <div class="glass">
      <div class="glass-head"><span class="mode">{meoshi ? '目押し' : 'おまかせ'}</span></div>
      <div class="window">
        <div class="bulbs t">{#each BULBS as b (b)}<i></i>{/each}</div>
        <div class="reels">
          <span class="no">No.</span>
          {#each [0, 1, 2] as i (i)}
            <div class="reel" class:stopped={reelState[i] === 'stopped'}><canvas bind:this={canvases[i]}></canvas></div>
          {/each}
        </div>
        <div class="bulbs b">{#each BULBS as b (b)}<i></i>{/each}</div>
      </div>
      <div class="stops">
        {#each PLACES as place, i (place)}
          <button type="button" class="stop" disabled={reelState[i] !== 'spin'} aria-label="{place}の位をストップ" onclick={() => { stop(i) }}><span class="ball"></span></button>
        {/each}
      </div>
      <div class="layers" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
    </div>
    <div class="stem"></div><div class="foot"></div>
  </div>
  <button type="button"
    class="lever" class:pulled disabled={spinning} aria-label="レバーを引いてスタート"
    onpointerdown={down} onpointermove={move} onpointerup={() => { up(true) }} onpointercancel={() => { up(false) }}
    onclick={() => { if (!skipClick) pull() }}
  ><span class="mount"></span><span class="arm" style:height={armH == null ? null : `${String(armH)}px`} style:transition={armH == null ? null : 'none'}><span class="knob"></span></span></button>
</div>

<style>
  .cabinet { width: 100%; display: flex; align-items: flex-start; margin-top: 40px }
  .parfait { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; position: relative }
  .topping { position: relative; width: 86%; height: 62px }
  .cream { position: absolute; inset: auto 0 0 0; height: 46px; background: var(--cream); border-radius: 50% 50% 0 0/90% 90% 0 0; box-shadow: inset 0 -6px 0 var(--cream-shade) }
  .cream::before, .cream::after { content: ""; position: absolute; bottom: 22px; width: 38%; height: 34px; background: var(--cream); border-radius: 50%; box-shadow: inset -4px -5px 0 var(--cream-shade) }
  .cream::before { left: 14% }
  .cream::after { right: 14% }
  .cherry { position: absolute; left: 50%; bottom: 38px; width: 30px; height: 30px; margin-left: -15px; border-radius: 50%; background: radial-gradient(circle at 34% 32%, #fff9 0 4px, transparent 5px), var(--berry); box-shadow: inset -4px -4px 0 var(--berry-d); z-index: 2 }
  .cherry::before { content: ""; position: absolute; left: 14px; top: -20px; width: 18px; height: 24px; border-left: 3px solid var(--matcha); border-top: 3px solid var(--matcha); border-radius: 18px 0 0 0; transform: rotate(18deg) }
  .wafer { position: absolute; right: 20%; bottom: 30px; width: 16px; height: 52px; border-radius: 3px; transform: rotate(24deg); z-index: 1; background: repeating-linear-gradient(0deg, var(--gold) 0 6px, #c8862a 6px 8px) }
  .pocky { position: absolute; left: 22%; bottom: 28px; width: 7px; height: 56px; border-radius: 4px; transform: rotate(-20deg); z-index: 1; background: linear-gradient(var(--gold) 0 22%, var(--choco-2) 22%) }
  .glass { position: relative; width: 100%; background: var(--glass); border: 3px solid var(--glass-edge); border-top: none; border-radius: 0 0 46px 46px; padding: 10px 8px 0; overflow: hidden; box-shadow: 0 10px 30px #6b2a3a22 }
  .glass::before { content: ""; position: absolute; left: 4px; top: 40px; bottom: 100px; width: 5px; border-radius: 5px; background: #ffffff88; pointer-events: none }
  .glass-head { display: flex; justify-content: flex-end; margin: -2px 0 8px }
  .mode { background: var(--gold); color: var(--choco); font-weight: 800; font-size: .72rem; padding: 3px 10px; border-radius: 999px; letter-spacing: .05em }
  .window { position: relative; background: var(--choco); border-radius: 18px; padding: 16px 8px 14px; box-shadow: inset 0 0 0 3px var(--choco-2) }
  .bulbs { position: absolute; left: 14px; right: 14px; display: flex; justify-content: space-between; pointer-events: none }
  .bulbs.t { top: 5px }
  .bulbs.b { bottom: 4px }
  .bulbs i { width: 7px; height: 7px; border-radius: 50%; background: var(--gold); opacity: .35 }
  .spinning .bulbs i { animation: blink .5s infinite }
  .spinning .bulbs i:nth-child(even) { animation-delay: .25s }
  .win .bulbs i { opacity: 1; background: var(--berry); animation: blink .2s 10 }
  @keyframes blink { 50% { opacity: 1 } }
  .reels { display: flex; justify-content: center; align-items: center; gap: 8px }
  .no { font-weight: 700; color: var(--gold); font-size: 1.3rem; writing-mode: vertical-rl; letter-spacing: .05em; width: 20px }
  .reel { width: 64px; height: 150px; overflow: hidden; border-radius: 12px; background: var(--cream); position: relative }
  .reel::after { content: ""; position: absolute; inset: 0; background: linear-gradient(#3e2117cc, transparent 30%, transparent 70%, #3e2117cc); pointer-events: none }
  .reel::before { content: ""; position: absolute; left: 0; right: 0; top: 50px; height: 50px; border-block: 3px solid var(--berry); pointer-events: none; z-index: 1 }
  .reel.stopped::before { border-color: var(--gold) }
  .reel canvas { display: block; width: 64px; height: 150px }
  .stops { display: flex; justify-content: center; gap: 8px; padding-left: 28px; margin-top: 18px }
  .stop { position: relative; width: 64px; height: 58px; border: none; background: none; cursor: pointer; padding: 0 }
  .ball { display: block; width: 46px; height: 46px; margin: 0 auto; border-radius: 50%; background: var(--berry); box-shadow: 0 5px 0 var(--berry-d); transition: transform .06s, box-shadow .06s }
  .stop:not(:disabled):active .ball { transform: translateY(4px); box-shadow: 0 1px 0 var(--berry-d) }
  .stop:disabled { cursor: default }
  .stop:disabled .ball { background: var(--cream-shade); box-shadow: 0 5px 0 color-mix(in srgb, var(--cream-shade) 70%, #000) }
  .layers { margin: 14px -8px 0; display: flex; flex-direction: column }
  .layers i { display: block }
  .layers i:nth-child(1) { background: var(--cream); border-radius: 0 0 50% 50%/0 0 8px 8px; height: 14px }
  .layers i:nth-child(2) { background: var(--berry); height: 14px }
  .layers i:nth-child(3) { background: radial-gradient(circle, #c8862a 2px, transparent 2.5px) 0 0/10px 8px, var(--gold); height: 18px }
  .layers i:nth-child(4) { background: var(--choco-2); height: 18px }
  .layers i:nth-child(5) { background: var(--cream); height: 16px }
  .stem { width: 34px; height: 26px; background: var(--glass); border-inline: 3px solid var(--glass-edge) }
  .foot { width: 62%; height: 16px; border-radius: 50%; background: var(--glass-edge); box-shadow: 0 6px 12px #6b2a3a22 }
  .lever { touch-action: none; flex: none; position: relative; width: 40px; height: 250px; margin-top: 62px; border: none; background: none; padding: 0; cursor: pointer; border-radius: 12px }
  .mount { position: absolute; left: -3px; bottom: 22px; width: 26px; height: 44px; background: var(--choco-2); border-radius: 0 12px 12px 0; box-shadow: inset -3px -4px 0 #0003 }
  .arm { position: absolute; left: 15px; bottom: 44px; width: 8px; height: 160px; border-radius: 4px; background: linear-gradient(90deg, var(--cream-shade), var(--cream) 45%, var(--cream-shade)); box-shadow: 0 0 0 1.5px var(--choco-2); transition: height .22s cubic-bezier(.3, 1.5, .5, 1) }
  .knob { position: absolute; top: -30px; left: 50%; width: 38px; height: 38px; margin-left: -19px; border-radius: 50%; background: radial-gradient(circle at 34% 30%, #fffb 0 5px, transparent 6px), var(--berry); box-shadow: inset -5px -6px 0 var(--berry-d) }
  .knob::before { content: ""; position: absolute; left: 18px; top: -18px; width: 14px; height: 20px; border-left: 3px solid var(--matcha); border-top: 3px solid var(--matcha); border-radius: 14px 0 0 0; transform: rotate(18deg) }
  .knob::after { content: ""; position: absolute; left: 26px; top: -22px; width: 13px; height: 8px; background: var(--matcha); border-radius: 0 100% 0 100% }
  .lever.pulled .arm { height: 70px; transition-duration: .12s; transition-timing-function: ease-in }
  .lever:disabled { cursor: default }
  .lever:disabled .knob { filter: saturate(.35) }
  .lever:not(:disabled):hover .knob { transform: translateY(2px) }
  @media (prefers-reduced-motion: reduce) {
    .spinning .bulbs i, .win .bulbs i { animation: none }
    .spinning .bulbs i { opacity: 1 }
  }
</style>
