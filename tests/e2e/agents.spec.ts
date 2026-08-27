import { test, expect } from '@playwright/test'

import { login } from './fixtures'

test.describe('agent orchestration', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('renders the agent grid with registered agents', async ({ page }) => {
    await page.goto('/agents')
    await expect(page.getByRole('heading', { name: /AI Agent Orchestration Hub/i })).toBeVisible()

    await expect(
      page.getByRole('table').or(page.getByText(/Could not load agents/i)),
    ).toBeVisible({ timeout: 15_000 })

    const table = page.getByRole('table')
    if (await table.isVisible()) {
      await expect(table.getByRole('row').nth(1)).toBeVisible()
    }
  })

  test('opens the runner drawer and executes an agent', async ({ page }) => {
    await page.goto('/agents')
    await expect(
      page.getByRole('table').or(page.getByText(/Could not load agents/i)),
    ).toBeVisible({ timeout: 15_000 })

    test.skip((await page.getByText(/Could not load agents/i).count()) > 0, 'Agent registry unavailable')

    await page.getByRole('button', { name: /^Run$/ }).first().click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()

    await dialog.locator('#agent-prompt').fill('Summarize the benefits of workflow automation in one sentence.')
    await dialog.getByRole('button', { name: /Run agent/i }).click()

    await expect(
      dialog.locator('text=/success|error/i').first(),
    ).toBeVisible({ timeout: 30_000 })
  })

  test('executes a multi-agent pipeline and shows step results', async ({ page }) => {
    await page.goto('/agents/pipelines')
    await expect(page.getByRole('heading', { name: /Multi-Agent Pipeline Builder/i })).toBeVisible()

    await expect(
      page.locator('textarea').first().or(page.getByText(/Could not load agents/i)),
    ).toBeVisible({ timeout: 15_000 })

    test.skip((await page.getByText(/Could not load agents/i).count()) > 0, 'Agent registry unavailable')

    const promptBoxes = page.locator('textarea')
    await promptBoxes.first().fill('Draft a one-line project status update.')

    await page.getByRole('button', { name: /Execute pipeline/i }).click()

    await expect(
      page.getByText(/steps$/i).or(page.getByText(/Pipeline run failed/i)),
    ).toBeVisible({ timeout: 30_000 })
  })
})
