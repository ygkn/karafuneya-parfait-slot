<script lang="ts">
  import storesJson from './lib/stores.json'
  import type { Parfait, Slip, Store } from './lib/types'
  import { drawPool, shortStoreName } from './lib/slot'
  import { load, save } from './lib/storage'
  import Machine from './components/Machine.svelte'
  import SlipStack from './components/SlipStack.svelte'
  import StoreDialog from './components/StoreDialog.svelte'
  import KindDialog from './components/KindDialog.svelte'
  import SettingsDialog from './components/SettingsDialog.svelte'
  import PleaseList from './components/PleaseList.svelte'
  import UnofficialText from './components/UnofficialText.svelte'

  const stores = storesJson as Store[]
  const MAX_SLIPS = 12

  const savedIdx = stores.findIndex((s) => s.key === load<string | null>('parfaitStoreKey', null))
  const initialIdx = savedIdx >= 0 ? savedIdx : null
  let storeIdx = $state<number | null>(initialIdx)
  let meoshi = $state(load('parfaitMeoshi', false))
  let includeSpecial = $state(load('parfaitIncSp', false))
  let funNote = $state(load('parfaitFunNote', true))
  // selected menu sections, remembered per store by label
  const savedSections = load<Record<string, string[] | null>>('parfaitSections', {})
  let sections = $state<Set<number> | null>(null)

  let storeOpen = $state(initialIdx === null)
  let kindOpen = $state(false)
  let settingsOpen = $state(false)
  let spinning = $state(false)
  let slips = $state<Slip[]>([])
  let status = $state<string | null>(initialIdx === null ? 'お店を選んでね' : 'レバーを引いてね')
  let serial = 0
  // the part of Machine's API the page drives from the keyboard
  interface MachineApi { next: () => void }
  let machine: MachineApi | undefined = $state()

  const store = $derived(storeIdx === null ? null : stores[storeIdx])
  const pool = $derived(store ? drawPool(store, { includeSpecial, sections }) : [])

  function restoreSections(s: Store) {
    const v = savedSections[s.key]
    const set = new Set((v ?? []).map((l) => s.sections.indexOf(l)).filter((i) => i >= 0))
    sections = set.size ? set : null
  }
  const initialStore = initialIdx === null ? undefined : stores[initialIdx]
  if (initialStore) restoreSections(initialStore)

  $effect(() => { save('parfaitMeoshi', meoshi) })
  $effect(() => { save('parfaitIncSp', includeSpecial) })
  $effect(() => { save('parfaitFunNote', funNote) })
  $effect(() => {
    if (!store) return
    savedSections[store.key] = sections ? [...sections].flatMap((i) => store.sections[i] ?? []) : null
    save('parfaitSections', savedSections)
  })

  // after closing a dialog with mouse/touch, drop the focus handed back to its opener,
  // so the next Space press plays the slot instead of reopening the dialog
  const blurIfPointer = (e: MouseEvent) => { if (e.detail > 0) setTimeout(() => (document.activeElement as HTMLElement | null)?.blur(), 0) }

  function selectStore(i: number, e: MouseEvent) {
    const s = stores[i]
    if (!s) return
    storeIdx = i
    save('parfaitStoreKey', s.key)
    restoreSections(s)
    status = 'レバーを引いてね'
    storeOpen = false
    blurIfPointer(e)
  }

  function getPool(): Parfait[] {
    if (!pool.length) status = 'この種類のパフェはこのお店にありません。「気分」から種類を変えてね'
    return pool
  }

  function onresult({ digits, parfait }: { digits: number[]; parfait: Parfait | null }) {
    status = null
    if (!store) return
    serial += 1
    slips = [{ id: serial, serial, storeName: shortStoreName(store), digits, parfait, showFunNote: funNote, open: false }, ...slips].slice(0, MAX_SLIPS)
  }

  function onkey(e: KeyboardEvent) {
    if (e.code !== 'Space' || storeOpen || kindOpen || settingsOpen || !store) return
    const t = e.target as HTMLElement
    // Space on other focused page controls (store, kind, settings, slip cards) keeps its normal meaning.
    // Focus can linger on a button inside a just-closed dialog; that one must not swallow the key.
    if (t.closest('button') !== null && t.closest('.lever, .stop, dialog') === null) return
    e.preventDefault()
    machine?.next()
  }
</script>

<svelte:window onkeydown={onkey} />

<div class="wrap">
  <header class="top">
    <p class="unofficial"><b>非公式</b><UnofficialText /></p>
    <div class="sign">
      <h1>からふね屋<br />パフェスロット</h1>
      <p>出た番号のパフェを注文しよう</p>
    </div>
  </header>
  <main>

  <div class="bar">
    <button type="button" class="pill shop" disabled={spinning} onclick={() => { storeOpen = true }}>
      <span class="lbl">来店</span><b>{store?.name ?? 'お店を選んでね'}</b><span class="chg">変更</span>
    </button>
    <button type="button" class="gear" disabled={spinning} aria-label="スロットの設定" onclick={() => { settingsOpen = true }}>⚙</button>
  </div>
  <button type="button" class="pill kind" disabled={spinning || !store} onclick={() => { kindOpen = true }}>
    <span class="lbl">気分</span>
    <b>{sections && store ? [...sections].map((i) => store.sections[i]).join('・') : 'すべてのパフェ'}（{pool.length}種）</b>
    <span class="chg">変更</span>
  </button>

  <Machine bind:this={machine} bind:spinning {meoshi} {getPool} onstart={() => { status = 'ねらって……ストップ！' }} {onresult} />
  <p class="hint">レバーを引いてスタート、ボタンで1桁ずつストップ<br />スペースキーでも操作できます</p>

  <SlipStack bind:slips {status} />
  </main>
  <footer>

  <section class="please" aria-labelledby="pleaseTitle">
    <h2 id="pleaseTitle">お店で使うときのお願い</h2>
    <p>お店の方やほかのお客さんの迷惑にならないよう、次のことを守って使ってください。</p>
    <PleaseList />
  </section>
  <p class="note">
    非公式のファンメイドです。番号は公式サイトの店舗別メニューPDF
    {#if store}（<a href={store.pdf} target="_blank" rel="noopener noreferrer">{store.name}</a>、{store.fetchedAt}時点）{/if}
    から読み取ったもので、読み間違いや改定で変わっている場合があります。注文前にお店のメニューで確認してください。
  </p>
  </footer>
</div>

<StoreDialog bind:open={storeOpen} {stores} current={storeIdx} onselect={selectStore} />
{#if store}
  <KindDialog bind:open={kindOpen} {store} {includeSpecial} bind:selected={sections} onclose={(e: MouseEvent) => { kindOpen = false; blurIfPointer(e) }} />
{/if}
<SettingsDialog bind:open={settingsOpen} bind:meoshi bind:includeSpecial bind:funNote onclose={(e: MouseEvent) => { settingsOpen = false; blurIfPointer(e) }} />

<style>
  .wrap, .top, main, footer { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 14px }
  .wrap { max-width: 400px }
  .unofficial { width: 100%; margin: 0; display: flex; align-items: center; gap: 10px; background: var(--choco-2); color: var(--cream); border-radius: 12px; padding: 8px 12px; text-align: left; box-shadow: inset 0 0 0 2px var(--gold) }
  .unofficial b { flex: none; font-size: 1rem; font-weight: 800; letter-spacing: .15em; background: var(--gold); color: var(--choco); border-radius: 6px; padding: 2px 8px }
  .unofficial :global(> span) { flex: 1; min-width: 0; font-size: .76rem; line-height: 1.5; word-break: auto-phrase }
  .sign { text-align: center }
  .sign h1 { margin: 0; font-weight: 800; font-size: clamp(1.7rem, 8.5vw, 2.2rem); line-height: 1.2; letter-spacing: .12em; color: var(--berry); text-shadow: 2px 2px 0 var(--cream), 3px 3px 0 color-mix(in srgb, var(--choco-2) 60%, transparent); text-wrap: balance }
  .sign p { margin: 8px 0 0; font-size: .85rem; color: var(--sub) }
  .bar { width: 100%; display: flex; align-items: stretch; gap: 8px }
  .pill { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; background: var(--card); border: 2px dashed var(--line); border-radius: 14px; padding: 8px 12px; text-align: left; cursor: pointer; color: var(--ink) }
  .pill .lbl { flex: none; font-size: .68rem; letter-spacing: .12em; color: var(--sub) }
  .pill b { flex: 1; min-width: 0; font-size: .95rem; font-weight: 800; line-height: 1.3 }
  .pill .chg { flex: none; font-size: .75rem; color: var(--berry-ink); font-weight: 800 }
  .kind { width: 100%; flex: none; margin-top: -6px }
  .kind b { font-weight: 700 }
  .pill:disabled, .gear:disabled { opacity: .5; cursor: default }
  .gear { flex: none; width: 52px; border-radius: 14px; border: 2px solid var(--line); background: var(--card); color: var(--ink); font-size: 1.3rem; cursor: pointer; display: grid; place-items: center }
  .hint { margin: 0; font-size: .75rem; color: var(--sub); text-align: center; line-height: 1.6 }
  .please { width: 100%; background: var(--card); border: 2px solid var(--line); border-radius: 16px; padding: 14px 16px; text-align: left }
  .please h2 { margin: 0 0 6px; font-size: .95rem; font-weight: 800; color: var(--berry-ink) }
  .please p { margin: 0 0 6px; font-size: .82rem; line-height: 1.6 }
  .note { font-size: .72rem; color: var(--sub); line-height: 1.7; text-align: center; margin: 0 }
  .note a { color: var(--sub) }
</style>
