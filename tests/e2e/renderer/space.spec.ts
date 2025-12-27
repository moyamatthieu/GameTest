import { test, expect } from '@playwright/test';

test('Space visualization renders correctly', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');

  // Wait for the game canvas to be added to the DOM
  await page.waitForSelector('#game-canvas');

  // Check that the game canvas exists
  const canvas = page.locator('#game-canvas');
  await expect(canvas).toBeVisible();

  // Check that the canvas has WebGL context (basic check)
  const hasWebGL = await page.evaluate(() => {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!canvas) return false;
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    return !!gl;
  });

  expect(hasWebGL).toBe(true);
});
