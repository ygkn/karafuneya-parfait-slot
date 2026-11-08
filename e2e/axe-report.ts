// Run: node e2e/axe-report.ts [url]  — dumps every axe violation with targets and contrast numbers (run against `npm run preview`)
import { chromium } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
const url = process.argv[2] ?? 'http://localhost:4173/'
const b = await chromium.launch()
for (const scheme of ['light', 'dark'] as const) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, colorScheme: scheme })
  const p = await ctx.newPage()
  await p.goto(url)
  const states: Record<string, () => Promise<void>> = {
    'store dialog': async () => {
      // initial state: the store dialog is already open
    },
    'after spin + flip': async () => {
      await p.getByRole('button', { name: /三条本店/ }).click()
      await p.getByRole('button', { name: 'レバーを引いてスタート' }).click()
      for (const pl of ['百', '十', '一']) { await p.waitForTimeout(150); await p.getByRole('button', { name: `${pl}の位をストップ` }).click() }
      await p.waitForTimeout(1500)
      await p.getByRole('button', { name: 'タップしてパフェを見る' }).click(); await p.waitForTimeout(700)
    },
    'spinning': async () => { await p.getByRole('button', { name: 'レバーを引いてスタート' }).click(); await p.waitForTimeout(200) },
    'settings dialog': async () => { for (const pl of ['百', '十', '一']) await p.getByRole('button', { name: `${pl}の位をストップ` }).click(); await p.waitForTimeout(1500); await p.getByRole('button', { name: 'スロットの設定' }).click() },
    'kind dialog': async () => { await p.keyboard.press('Escape'); await p.getByRole('button', { name: /^気分/ }).click() },
  }
  for (const [name, act] of Object.entries(states)) {
    await act()
    const r = await new AxeBuilder({ page: p }).analyze()
    console.log(`[${scheme}] ${name}: ${String(r.violations.length)} violations, ${String(r.passes.length)} rules passed, ${String(r.incomplete.length)} need review`)
    for (const v of [...r.violations, ...r.incomplete.map((x) => ({ ...x, id: "REVIEW " + x.id }))]) for (const n of v.nodes)
      console.log(`[${scheme}] ${name} | ${v.id} (${v.impact ?? '-'}) | ${n.target.join(' ')} | ${(n.any[0]?.message ?? n.all[0]?.message ?? n.failureSummary ?? '').replace(/\s+/g, ' ').slice(0, 160)}`)
  }
  await ctx.close()
}
await b.close()
