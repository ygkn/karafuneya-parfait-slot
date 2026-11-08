# からふね屋パフェスロット（非公式）

> **非公式** ファンが個人で楽しむために作ったもので、からふね屋の公式サイト・お店とは関係ありません。

からふね屋のパフェには通し番号が付いています。お店を選んでスロットを回し、出た番号のパフェを注文して遊ぶためのページです。

## お店で使うときのお願い

- 混んでいるときは、スロットに時間をかけずに注文を決めましょう
- 食べきれる量を注文しましょう
- 出た番号がメニューにない・売り切れのときは、ほかのパフェを選びましょう
- お店のルールとスタッフの方の案内に従いましょう

## 遊び方

- **レバー**を引く（タップ・下にドラッグ・スペースキー）とリールが回り、**ボタン**で百・十・一の位を1つずつ止めます。
- **おまかせ**（初期設定）: レバーを引いた時点で全パフェから同じ確率で1つ決まります。ハズレはありません。
- **目押しモード**: ボタンを押した位置から最大4コマすべって止まります。実在する番号まで届かなければハズレです。
- **気分**: お店のメニューの見出し（チョコレート、お茶パフェなど）で絞り込めます。
- 結果は「ご注文伝票」として積み重なり、伝票ごとにめくってパフェの名前を確認できます。

## データについて

- 番号・名前・価格は、公式サイトの[メニューページ](https://karafuneya.jp/menu/)にある店舗別メニューPDFを、2026-11-08 に読み取ったものです。読み間違いや、その後の改定・閉店で変わっている可能性があります。
- メニューに種類の見出しがない店舗（熊野・小倉・竹田・高槻）は、三条本店の見出しを番号ごとに借りています。
- **メニューのPDFや写真はこのリポジトリに含めません**（`.gitignore` で除外しています）。

```
data/extracted/items/<store>.json     各店の番号付きパフェ（読み取り結果）
data/extracted/sections/<store>.json  メニューの見出しと、その下の番号
scripts/build-data.ts                 上の2つから src/lib/stores.json を作る
```

番号の間違いや閉店に気づいたら、Issue で教えてください。`data/extracted/` を直して `npm run data` を実行すると反映されます。

## 開発

Node.js 22.18 以上（TypeScript をそのまま実行します）。

```bash
npm install
npm run dev        # 開発サーバー
npm run data       # data/extracted → src/lib/stores.json
npm run check      # svelte-check（警告もエラー扱い）+ tsc
npm run lint       # ESLint（typescript-eslint strictTypeChecked + eslint-plugin-svelte）
npm test           # Vitest（抽選ロジックとデータの検査）
npm run test:e2e   # Playwright（操作の確認 + axe によるアクセシビリティ検査）
npm run verify     # 上の4つをまとめて
```

- Svelte 5 + Vite + TypeScript（`@tsconfig/strictest` を extends）
- `main` への push で GitHub Pages に公開されます（`.github/workflows/ci.yml`）。リポジトリの Settings → Pages で Source を「GitHub Actions」にしてください。

## ライセンス

[MIT](./LICENSE) © 2026 ygkn

MIT ライセンスが適用されるのは**このプロジェクトのソースコードのみ**です。

- `data/extracted/` と `src/lib/stores.json` のメニュー情報（番号・名前・価格・見出し）は、からふね屋が公開しているメニューから読み取ったもので、このプロジェクトが利用を許諾するものではありません。
- 「からふね屋」の名称はからふね屋に帰属します。このプロジェクトは非公式で、からふね屋とは関係ありません。
