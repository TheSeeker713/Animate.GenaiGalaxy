import { test, expect } from '@playwright/test'

test('dashboard loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /genai galaxy animate/i })).toBeVisible({
    timeout: 30_000,
  })
})

test('story new without name returns to dashboard', async ({ page }) => {
  page.once('dialog', (d) => d.dismiss())
  await page.goto('/story/new')
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
})
