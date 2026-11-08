<script lang="ts">
  import type { Store } from '../lib/types'
  import Modal from './Modal.svelte'
  import PleaseList from './PleaseList.svelte'
  import UnofficialText from './UnofficialText.svelte'

  let {
    open = $bindable(false),
    stores,
    current,
    onselect,
  }: { open?: boolean; stores: Store[]; current: number | null; onselect: (i: number, e: MouseEvent) => void } = $props()

  // the first time (no store yet) the dialog can't be dismissed and shows the notice and the requests
  const first = $derived(current === null)
</script>

<Modal bind:open dismissible={!first} labelledby="storeTitle">
  <h2 id="storeTitle">どのお店で食べる？</h2>
  {#if first}
    <div class="first">
      <p class="off"><b>非公式</b><UnofficialText /></p>
      <div class="please">
        <b>お店で使うときのお願い</b>
        <PleaseList />
        <p>マナーを守って、楽しく遊んでね！</p>
      </div>
    </div>
  {/if}
  <div class="list">
    {#each stores as s, i (s.key)}
      <!-- svelte-ignore a11y_autofocus -->
      <button type="button" class:cur={i === current} autofocus={i === (current ?? 0)} onclick={(e) => { onselect(i, e) }}>
        <span>{s.name}</span><small>{s.items.length}種</small>
      </button>
    {/each}
  </div>
  {#if !first}<button type="button" class="close" onclick={() => { open = false }}>閉じる</button>{/if}
</Modal>

<style>
  .first { display: flex; flex-direction: column; gap: 10px; margin: 10px 0 14px }
  .off { margin: 0; display: flex; align-items: center; gap: 10px; font-size: .8rem; line-height: 1.6; text-align: left }
  .off :global(> span) { flex: 1; min-width: 0; word-break: auto-phrase; overflow-wrap: anywhere }
  .off b {
    flex: none; font-size: .78rem; font-weight: 800; letter-spacing: .12em; background: var(--choco-2); color: var(--cream);
    border-radius: 6px; padding: 1px 7px;
  }
  .please {
    background: color-mix(in srgb, var(--gold) 18%, var(--card)); border: 2px solid var(--gold); border-radius: 14px;
    padding: 10px 12px; text-align: left;
  }
  .please > b { display: block; font-size: .88rem; font-weight: 800; margin-bottom: 6px }
  .please p { margin: 4px 0 0; font-size: .8rem; font-weight: 700; color: var(--berry-ink) }
  .list { display: flex; flex-direction: column; gap: 8px }
  .list button {
    display: flex; justify-content: space-between; align-items: center; gap: 8px; width: 100%; padding: 12px 14px;
    border-radius: 14px; border: 2px solid var(--line); background: var(--bg); color: var(--ink); font-size: .95rem;
    font-weight: 700; cursor: pointer; text-align: left;
  }
  .list button:hover { border-color: var(--berry) }
  .list button.cur { border-color: var(--berry); background: color-mix(in srgb, var(--berry) 12%, var(--card)) }
  .list small { color: var(--sub); font-weight: 500; white-space: nowrap }
</style>
