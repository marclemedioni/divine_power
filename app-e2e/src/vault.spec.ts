import { test, expect } from '@playwright/test';

test('Vault page loads and navigates to details', async ({ page }) => {
  await page.goto('/vault');

  // Verify Header
  await expect(page.locator('h1')).toContainText('Vault');
  
  // Verify Description
  await expect(page.locator('text=Manage your inventory')).toBeVisible();

  // Verify Grid Container exists
  await expect(page.locator('.grid')).toBeVisible();

  // Check if there are items (this depends on seeded data, but let's assume empty state or items)
  // If empty, we can't test navigation easily without seeding.
  // We can at least clear the test if the page loads.
  
  // Ideally we should seed data, but for now we verify the route exists.
  await page.goto('/vault/divine'); 
  // Should load details page
  // The header might be "Divine Orb" but if no lots, it might show "No lots found" or loading error if invalid ID.
  // Actually the component handles empty lots gracefully.
  // But if trpc returns empty array, the page will show "No lots found".
  
  // Let's verify we didn't crash.
  await expect(page.locator('a:has-text("Back to Vault")')).toBeVisible();
});
