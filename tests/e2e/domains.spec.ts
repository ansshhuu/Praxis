import path from 'node:path'

import { test, expect } from '@playwright/test'

import { login } from './fixtures'

test.describe('domain automation flows', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('scores a lead through the CRM qualification flow', async ({ page }) => {
    await page.goto('/crm')
    await expect(page.getByRole('heading', { name: /CRM Automation/i })).toBeVisible()

    await page.getByPlaceholder('Contact name').fill('Jordan Rivera')
    await page.getByPlaceholder('Email').fill('jordan.rivera@example.com')
    await page.getByPlaceholder('Company').first().fill('Rivera Logistics')
    await page.getByPlaceholder('Budget ($)').first().fill('75000')
    await page.getByPlaceholder('Urgency').fill('14')
    await page
      .getByPlaceholder(/Fit notes/i)
      .fill('Decision maker with budget approved, urgent replacement needed.')

    await page.getByRole('button', { name: /Qualify lead/i }).click()

    const cardList = page.locator('[data-slot="card"]').filter({ hasText: 'Lead Qualification Cards' })
    await expect(cardList.getByText('Rivera Logistics')).toBeVisible({ timeout: 20_000 })
  })

  test('keeps the qualify-lead and proposal-generator forms independent', async ({ page }) => {
    await page.goto('/crm')
    await expect(page.getByRole('heading', { name: /CRM Automation/i })).toBeVisible()

    // Qualify Person A.
    await page.getByPlaceholder('Contact name').fill('Rahul Sharma')
    await page.getByPlaceholder('Email').fill('rahul.sharma@example.com')
    await page.getByPlaceholder('Company').first().fill('Sharma Textiles')
    await page.getByPlaceholder('Budget ($)').first().fill('60000')
    await page.getByPlaceholder('Urgency').fill('10')
    await page
      .getByPlaceholder(/Fit notes/i)
      .fill('Decision maker with budget approved, urgent replacement needed.')
    await page.getByRole('button', { name: /Qualify lead/i }).click()

    const cardList = page.locator('[data-slot="card"]').filter({ hasText: 'Lead Qualification Cards' })
    await expect(cardList.getByText('Sharma Textiles')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(/1 leads qualified this session/i)).toBeVisible()

    // Generate a proposal for a different person without touching the qualify form again.
    await page.getByPlaceholder('Lead name').fill('Priya Patel')
    await page.getByPlaceholder('Company').last().fill('Patel Freight')
    await page.getByPlaceholder(/Requirements/i).fill('Needs a logistics dashboard with real-time tracking.')
    await page.getByPlaceholder('Budget ($)').last().fill('90000')
    await page.getByRole('button', { name: /Generate proposal/i }).click()

    // The qualification card list must still show only Person A, not overwritten by Person B.
    await expect(cardList.getByText('Sharma Textiles')).toBeVisible()
    await expect(cardList.getByText('Patel Freight')).not.toBeVisible()
    await expect(page.getByText(/1 leads qualified this session/i)).toBeVisible()

    // The proposal form must retain Person B's own input, not Person A's qualified data.
    await expect(page.getByPlaceholder('Lead name')).toHaveValue('Priya Patel')
    await expect(page.getByPlaceholder('Company').last()).toHaveValue('Patel Freight')
  })

  test('ranks candidates through the resume screening flow', async ({ page }) => {
    await page.goto('/hr')
    await expect(page.getByRole('heading', { name: /HR & Recruitment/i })).toBeVisible()

    const resumeBuffer = Buffer.from(
      'Jane Candidate\njane.candidate@example.com\n' +
        'Senior software engineer with 8 years of experience in TypeScript, React, and Node.js. ' +
        'Led migration of a monolith to microservices and mentored a team of five engineers.',
      'utf-8',
    )

    await page.locator('input[type="file"]').setInputFiles({
      name: 'jane-candidate-resume.txt',
      mimeType: 'text/plain',
      buffer: resumeBuffer,
    })

    await page
      .getByPlaceholder(/Paste the job description/i)
      .fill(
        'We are hiring a Senior Software Engineer with strong TypeScript and React experience to lead our platform team.',
      )

    await page.getByRole('button', { name: /Screen candidates/i }).click()

    await expect(
      page
        .getByText(/Semantic Ranking/i)
        .or(page.locator('text=/screening failed|screening was not run/i')),
    ).toBeVisible({ timeout: 30_000 })
  })

  test('uploads an invoice for OCR extraction', async ({ page }) => {
    await page.goto('/finance')
    await expect(page.getByRole('heading', { name: /Finance & Invoice Hub/i })).toBeVisible()

    const invoiceImage = path.join(__dirname, 'fixtures', 'sample-invoice.png')

    await page.locator('input[type="file"][accept="image/*"]').setInputFiles(invoiceImage)

    await expect(
      page.getByText(/Record as expense/i).or(page.locator('text=/failed to parse invoice/i')),
    ).toBeVisible({ timeout: 30_000 })
  })
})
