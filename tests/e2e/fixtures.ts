import { type Page, expect } from '@playwright/test'

export const SEEDED_ADMIN = { email: 'admin@company.com', password: 'Admin@123' }

export async function login(page: Page, email = SEEDED_ADMIN.email, password = SEEDED_ADMIN.password) {
  await page.goto('/login')
  await page.locator('#email-input').fill(email)
  await page.locator('#password-input').fill(password)
  await page.locator('#sign-in-button').click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 })
}

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10_000)}@example.com`
}
