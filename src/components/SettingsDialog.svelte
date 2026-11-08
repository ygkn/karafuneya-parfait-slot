<script lang="ts">
  import Modal from './Modal.svelte'

  let {
    open = $bindable(false),
    meoshi = $bindable(false),
    includeSpecial = $bindable(false),
    funNote = $bindable(true),
    onclose,
  }: { open?: boolean; meoshi?: boolean; includeSpecial?: boolean; funNote?: boolean; onclose: (e: MouseEvent) => void } =
    $props()
</script>

<Modal bind:open labelledby="setTitle">
  <h2 id="setTitle">スロットの設定</h2>
  <p class="lead">回している間は変えられません</p>
  <label class="setting">
    <input type="checkbox" bind:checked={meoshi} /><span class="sw"></span>
    <span><b>目押しモード</b><span class="d">
      {#if meoshi}ON：ボタンを押した位置から最大4コマすべって止まります。実在する番号まで届かなければハズレです。
      {:else}OFF：レバーを引いた時点で、全パフェから同じ確率で1つ決まります。止めるタイミングで結果は変わらず、ハズレもありません。{/if}
    </span></span>
  </label>
  <label class="setting">
    <input type="checkbox" bind:checked={includeSpecial} /><span class="sw"></span>
    <span><b>特別なパフェも入れる</b><span class="d">予約が必要な大人数向け（ジャンボ・ピッチャー・ジョッキなど）と、フードやドリンクとのセット専用のMiniパフェ</span></span>
  </label>
  <label class="setting">
    <input type="checkbox" bind:checked={funNote} /><span class="sw"></span>
    <span><b>おもしろ系パフェに注釈を出す</b><span class="d">からあげパフェやエビフライパフェのような、おもしろ系のパフェが出たときに伝票でお知らせします</span></span>
  </label>
  <button type="button" class="close" onclick={onclose}>閉じる</button>
</Modal>

<style>
  .setting { display: flex; gap: 12px; align-items: flex-start; padding: 12px 4px; border-bottom: 1px dashed var(--line); cursor: pointer; text-align: left }
  .setting:last-of-type { border-bottom: none }
  .setting input { position: absolute; opacity: 0; width: 1px; height: 1px }
  .sw { flex: none; position: relative; width: 46px; height: 26px; border-radius: 999px; background: var(--cream-shade); transition: background .15s; margin-top: 2px }
  .sw::after { content: ""; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px #0003; transition: left .15s }
  .setting input:checked + .sw { background: var(--berry) }
  .setting input:checked + .sw::after { left: 23px }
  b { display: block; font-size: .95rem }
  .d { display: block; font-size: .78rem; color: var(--sub); line-height: 1.55; margin-top: 2px }
</style>
