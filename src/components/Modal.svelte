<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    open = $bindable(false),
    dismissible = true,
    labelledby,
    children,
  }: { open?: boolean; dismissible?: boolean; labelledby: string; children: Snippet } = $props()

  let dlg: HTMLDialogElement

  $effect(() => {
    if (open && !dlg.open) dlg.showModal()
    if (!open && dlg.open) dlg.close()
  })
</script>

<dialog
  bind:this={dlg}
  aria-labelledby={labelledby}
  oncancel={(e) => { if (!dismissible) e.preventDefault() }}
  onclose={() => (open = false)}
>
  {@render children()}
</dialog>

<style>
  dialog {
    border: none; border-radius: 22px; padding: 20px 16px 16px; width: min(92vw, 400px); max-height: 86vh;
    background: var(--card); color: var(--ink); box-shadow: 0 14px 40px #0006;
  }
  dialog::backdrop { background: #3e2117b3 }
  dialog :global(h2) {
    margin: 0; font-weight: 700; letter-spacing: .06em; font-size: 1.3rem; text-align: center; color: var(--berry-ink);
  }
  dialog :global(.lead) { margin: 4px 0 14px; font-size: .8rem; color: var(--sub); text-align: center }
</style>
