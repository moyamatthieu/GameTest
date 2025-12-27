import { test, expect } from '@playwright/test';

test('P2P connection between two peers', async ({ browser }) => {
  // Create two browser contexts
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  // Navigate to the app
  await page1.goto('http://localhost:5173');
  await page1.waitForLoadState('networkidle');
  await page2.goto('http://localhost:5173');
  await page2.waitForLoadState('networkidle');

  // Wait for identity to load
  await page1.waitForSelector('#peer-id');
  await page2.waitForSelector('#peer-id');

  // Get peer ID from page1
  const peerId1 = await page1.textContent('#peer-id');

  // Enter peer ID in page2
  await page2.fill('#target-peer-id', peerId1!);
  await page2.click('#connect-btn');

  // Wait for connection
  await page1.waitForSelector('#status-text:has-text("Connected")');
  await page2.waitForSelector('#status-text:has-text("Connected")');

  // Cleanup
  await context1.close();
  await context2.close();
});
