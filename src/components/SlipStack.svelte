<script lang="ts">
  import type { Slip } from '../lib/types'
  import { yen } from '../lib/slot'

  let { slips = $bindable([]), status }: { slips?: Slip[]; status: string | null } = $props()
</script>

<!-- newest slip on top; a blank slip shows the current status while spinning -->
<div class="slips" aria-live="polite">
  {#if status !== null}
    <section class="slip">
      <div class="head"><span>ご注文伝票</span><span>—</span></div>
      <div class="res"><span class="say">{status}</span></div>
    </section>
  {/if}
  {#each slips as slip, i (slip.id)}
    {@const p = slip.parfait}
    <section class="slip" class:old={i > 0 || status !== null}>
      <div class="head"><span>ご注文伝票</span><span>{slip.storeName}・{String(slip.serial).padStart(3, '0')}</span></div>
      <div class="res">
        {#if p}
          <span class="big">No.{p.no}</span>
          <span class="say">「{p.no}番ください」と頼もう！</span>
          {#if p.note !== undefined}<span class="anno">※{p.note}</span>{/if}
          {#if p.fun === true && slip.showFunNote}<span class="anno">※おもしろ系のパフェです</span>{/if}
        {:else}
          <span class="big miss">No.{Number(slip.digits.join(''))}</span>
          <span class="say">この番号のパフェは、選んだお店・種類にはありません。</span>
          <span class="tip">ヒント：種類を変えるか、設定から目押しモードをOFFにしてください</span>
        {/if}
      </div>
      {#if p}
        <div class="lid">
          <button type="button" class="card" class:open={slip.open} aria-expanded={slip.open} onclick={() => (slip.open = !slip.open)}>
            <span class="face front" aria-hidden={slip.open}>タップしてパフェを見る</span>
            <span class="face back" aria-hidden={!slip.open}>
              <b>{p.name}</b>
              <span class="price">No.{p.no}<span class="gap"></span>{yen(p.price)}</span>
              <small>タップで隠す</small>
            </span>
          </button>
        </div>
      {/if}
    </section>
  {/each}
</div>

<style>
  .slips { width: 100%; display: flex; flex-direction: column; gap: 10px }
  .slip {
    position: relative; width: 100%; background: var(--card); padding: 18px 18px 20px; text-align: center;
    -webkit-mask: radial-gradient(circle 6px at 50% 0, #0000 98%, #000) 0 0/16px 51% repeat-x, radial-gradient(circle 6px at 50% 100%, #0000 98%, #000) 0 100%/16px 51% repeat-x;
    mask: radial-gradient(circle 6px at 50% 0, #0000 98%, #000) 0 0/16px 51% repeat-x, radial-gradient(circle 6px at 50% 100%, #0000 98%, #000) 0 100%/16px 51% repeat-x;
  }
  .slip.old { padding-block: 12px 14px }
  .slip.old:nth-child(even) { transform: rotate(-.5deg) }
  .slip.old:nth-child(odd) { transform: rotate(.4deg) }
  .head { display: flex; justify-content: space-between; font-size: .7rem; color: var(--sub); letter-spacing: .15em; border-bottom: 1px dashed var(--line); padding-bottom: 6px; margin-bottom: 8px }
  .res { min-height: 4.4em; display: flex; flex-direction: column; justify-content: center; gap: 2px; font-weight: 700 }
  .old .res { min-height: 0 }
  .big { font-weight: 700; letter-spacing: .02em; font-size: 2.6rem; line-height: 1.1; color: var(--berry); font-variant-numeric: tabular-nums }
  .old .big { font-size: 1.8rem }
  .miss { color: var(--sub); text-decoration: line-through; text-decoration-thickness: 3px }
  .say { font-size: .95rem; word-break: auto-phrase; text-wrap: balance }
  .tip { margin-top: 4px; font-size: .78rem; font-weight: 500; color: var(--sub); word-break: auto-phrase; text-wrap: balance }
  .anno { display: inline-block; align-self: center; margin-top: 6px; font-size: .8rem; font-weight: 700; color: var(--ink); background: color-mix(in srgb, var(--gold) 30%, var(--card)); border-radius: 8px; padding: 3px 10px }
  .lid { margin-top: 12px; perspective: 600px }
  .card {
    display: block; width: 100%; border: none; padding: 0; background: none; font: inherit; color: inherit; cursor: pointer;
    position: relative; height: 104px; transform-style: preserve-3d; transition: transform .55s cubic-bezier(.3, 1.4, .5, 1);
  }
  .card.open { transform: rotateX(180deg) }
  .face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 6px 12px }
  .front { color: var(--cream); font-weight: 800; font-size: 1rem; background: repeating-linear-gradient(45deg, var(--choco-2) 0 10px, color-mix(in srgb, var(--choco-2) 80%, var(--choco)) 10px 20px); box-shadow: inset 0 0 0 3px var(--gold) }
  .back { transform: rotateX(180deg); background: color-mix(in srgb, var(--gold) 22%, var(--card)); border: 2px solid var(--gold) }
  .back b { font-size: 1.05rem; line-height: 1.35; text-wrap: balance; word-break: auto-phrase }
  .price { font-size: .85rem; color: var(--ink); font-variant-numeric: tabular-nums }
  .gap { display: inline-block; width: 1em }
  .back small { font-size: .7rem; color: var(--ink) }
  @media (prefers-reduced-motion: reduce) { .card { transition: none } }
</style>
