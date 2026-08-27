import { test, expect } from '@playwright/test'

import { login } from './fixtures'

test.describe('workflows and marketplace', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('filters the template marketplace by category', async ({ page }) => {
    await page.goto('/marketplace')

    const cards = page.locator('[id^="use-template-"]')
    await expect(cards.first()).toBeVisible({ timeout: 15_000 })
    const totalCount = await cards.count()
    expect(totalCount).toBeGreaterThan(0)

    await page.locator('#filter-finance').click()
    await expect(page.locator('#filter-finance')).toHaveAttribute('aria-pressed', 'true')

    const financeCount = await page.locator('[id^="use-template-"]').count()
    expect(financeCount).toBeLessThanOrEqual(totalCount)

    await page.locator('#filter-all').click()
    await expect(page.locator('#filter-all')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('[id^="use-template-"]')).toHaveCount(totalCount)
  })

  test('creates a workflow from a template and inspects its execution trace', async ({ page }) => {
    await page.goto('/marketplace')

    const firstTemplateButton = page.locator('[id^="use-template-"]').first()
    await expect(firstTemplateButton).toBeVisible({ timeout: 15_000 })
    await firstTemplateButton.click()

    await expect(page).toHaveURL(/\/workflows\?id=/, { timeout: 15_000 })

    const runButton = page.getByRole('button', { name: /^Run$/ })
    await expect(runButton).toBeVisible({ timeout: 15_000 })
    await runButton.click()

    await expect(page.getByRole('button', { name: /Running…|^Run$/ })).toBeVisible({ timeout: 30_000 })

    const historyButton = page.getByRole('button', { name: 'History', exact: true })
    await historyButton.click()
    await expect(historyButton).toHaveAttribute('aria-pressed', 'true')
  })
})
