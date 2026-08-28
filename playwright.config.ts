import { defineConfig, devices } from '@playwright/test'

const PORT = 3000
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // `next start` cannot serve an `output: standalone` build (see next.config.mjs) -
    // run the standalone server.js directly, same as Dockerfile's production CMD, with
    // static assets copied alongside it the way the Dockerfile does for the image.
    command:
      'npm run build && ' +
      'node -e "require(\'fs\').cpSync(\'public\',\'.next/standalone/public\',{recursive:true}); require(\'fs\').cpSync(\'.next/static\',\'.next/standalone/.next/static\',{recursive:true})" && ' +
      'node .next/standalone/server.js',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
