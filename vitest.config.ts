import { defineConfig } from 'vitest/config'

// unit tests only; browser tests live in e2e/ and run with Playwright
export default defineConfig({ test: { include: ['src/**/*.test.ts'] } })
