<script lang="ts">
  import { SvelteSet } from 'svelte/reactivity'
  import type { Store } from '../lib/types'
  import Modal from './Modal.svelte'

  let {
    open = $bindable(false),
    store,
    includeSpecial,
    selected = $bindable(null),
    onclose,
  }: {
    open?: boolean
    store: Store
    includeSpecial: boolean
    selected?: Set<number> | null
    onclose: (e: MouseEvent) => void
  } = $props()

  const counts = $derived(
    store.sections.map((_, i) => store.items.filter((p) => (includeSpecial || p.special !== true) && p.sections.includes(i)).length),
  )

  // from "すべて", tapping a section narrows to just it; after that, taps add/remove sections
  function toggle(i: number): void {
    if (!selected) {
      selected = new SvelteSet([i])
      return
    }
    const next = new SvelteSet(selected)
    if (next.has(i)) next.delete(i)
    else next.add(i)
    selected = next.size > 0 ? next : null
  }
</script>

<Modal bind:open labelledby="kindTitle">
  <h2 id="kindTitle">どんなパフェの気分？</h2>
  <p class="lead">
    選んだ種類のパフェだけが出ます。種類はお店のメニューの見出しのとおりです
    {#if store.borrowedSections}<span class="kn">このお店のメニューには種類の見出しがないため、三条本店のメニューの分け方を使っています。</span>{/if}
  </p>
  <div class="cats">
    <button type="button" aria-pressed={!selected} onclick={() => { selected = null }}>すべて</button>
    {#each store.sections as label, i (label)}
      {#if counts[i]}
        <button type="button" aria-pressed={!!selected && selected.has(i)} onclick={() => { toggle(i) }}>{label}<small>{counts[i]}</small></button>
      {/if}
    {/each}
  </div>
  <button type="button" class="close" onclick={onclose}>これで決定</button>
</Modal>

<style>
  .kn { display: block; margin-top: 4px }
  .cats { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px }
  .cats button {
    border: 2px solid var(--line); background: var(--bg); color: var(--ink); border-radius: 999px; padding: 7px 13px;
    font-size: .9rem; font-weight: 700; cursor: pointer;
  }
  .cats button[aria-pressed='true'] { border-color: var(--berry-ink); background: var(--berry-ink); color: var(--card) }
  .cats small { font-weight: 500; margin-left: 3px }
</style>
