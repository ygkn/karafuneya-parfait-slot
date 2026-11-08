/** Render scripts/ogp/ogp.html to public/ogp.png (1200x630). Run: npm run ogp */
import { chromium } from '@playwright/test'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.goto(new URL('ogp.html', import.meta.url).href)
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: new URL('../../public/ogp.png', import.meta.url).pathname })
await browser.close()
