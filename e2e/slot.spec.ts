import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import stores from '../src/lib/stores.json' with { type: 'json' }

async function chooseStore(page: Page, name: string) {
  await page.getByRole('button', { name: new RegExp(name) }).click()
  await expect(page.getByRole('dialog')).toBeHidden()
}

async function spinWithButtons(page: Page) {
  await page.getByRole('button', { name: 'レバーを引いてスタート' }).click()
  for (const place of ['百', '十', '一']) {
    await page.waitForTimeout(150)
    await page.getByRole('button', { name: `${place}の位をストップ` }).click()
  }
  await expect(page.getByRole('button', { name: 'レバーを引いてスタート' })).toBeEnabled()
}

test('first visit asks for a store and shows the unofficial notice and requests', async ({ page }) => {
  await page.goto('/')
  const dlg = page.getByRole('dialog', { name: 'どのお店で食べる？' })
  await expect(dlg).toBeVisible()
  await expect(dlg.getByText('お店で使うときのお願い')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dlg).toBeVisible() // must choose a store the first time
  await chooseStore(page, '三条本店')
  await page.getByRole('button', { name: /^来店/ }).click()
  await expect(page.getByRole('dialog').getByText('お店で使うときのお願い')).toBeHidden()
})

test('every result is a real parfait number of the chosen store', async ({ page }) => {
  await page.goto('/')
  await chooseStore(page, '大阪店')
  const osaka = new Set(stores.find((s) => s.key === 'osaka')?.items.map((p) => p.no))
  expect(osaka.size).toBeGreaterThan(0)
  for (let i = 0; i < 5; i++) await spinWithButtons(page)
  const numbers = await page.locator('.slip .big').allTextContents()
  expect(numbers).toHaveLength(5)
  for (const n of numbers) expect(osaka.has(Number(n.replace('No.', '')))).toBe(true)
})

test('each slip flips on its own', async ({ page }) => {
  await page.goto('/')
  await chooseStore(page, '三条本店')
  await spinWithButtons(page)
  await spinWithButtons(page)
  const cards = page.getByRole('button', { name: /パフェを見る|タップで隠す/ })
  await cards.nth(1).click()
  await expect(cards.nth(1)).toHaveAttribute('aria-expanded', 'true')
  await expect(cards.nth(0)).toHaveAttribute('aria-expanded', 'false')
})

test('space key pulls and stops', async ({ page }) => {
  await page.goto('/')
  await chooseStore(page, '三条本店')
  for (let i = 0; i < 4; i++) { await page.keyboard.press('Space'); await page.waitForTimeout(150) }
  await expect(page.locator('.slip .big')).toHaveCount(1)
})

test.describe('accessibility (axe)', () => {
  test('store dialog', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('dialog')).toBeVisible()
    const r = await new AxeBuilder({ page }).analyze()
    expect(r.violations.map((v) => `${v.id}: ${String(v.nodes.length)}`)).toEqual([])
  })
  test('page after a spin, with a flipped slip', async ({ page }) => {
    await page.goto('/')
    await chooseStore(page, '三条本店')
    await spinWithButtons(page)
    await page.getByRole('button', { name: 'タップしてパフェを見る' }).click()
    await page.waitForTimeout(700)
    const r = await new AxeBuilder({ page }).analyze()
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([])
  })
  test('settings and kind dialogs', async ({ page }) => {
    await page.goto('/')
    await chooseStore(page, '大阪店')
    for (const name of ['スロットの設定', /^気分/] as const) {
      await page.getByRole('button', { name }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      const r = await new AxeBuilder({ page }).analyze()
      expect(r.violations.map((v) => `${v.id}: ${String(v.nodes.length)}`), String(name)).toEqual([])
      await page.keyboard.press('Escape')
    }
  })
})
