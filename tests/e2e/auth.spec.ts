import { test, expect } from '@playwright/test'

import { SEEDED_ADMIN, login, uniqueEmail } from './fixtures'

test.describe('authentication', () => {
  test('redirects unauthenticated visitors away from protected routes', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('registers a new account and reaches the dashboard', async ({ page }) => {
    const email = uniqueEmail('e2e-register')

    await page.goto('/register')
    await page.locator('#name-input').fill('E2E Test User')
    await page.locator('#email-input').fill(email)
    await page.locator('#password-input').fill('E2ePassword123')
    await page.locator('#agree-terms').check()
    await page.locator('#sign-up-button').click()

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
  })

  test('logs in with valid credentials and reaches the dashboard', async ({ page }) => {
    await login(page)
    await expect(page.getByText(/dashboard/i).first()).toBeVisible()
  })

  test('shows an error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.locator('#email-input').fill(SEEDED_ADMIN.email)
    await page.locator('#password-input').fill('wrong-password')
    await page.locator('#sign-in-button').click()

    await expect(page.locator('#login-error')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('treats a cleared session as expired and redirects to login', async ({ page, context }) => {
    await login(page)
    await context.clearCookies()
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })
})
