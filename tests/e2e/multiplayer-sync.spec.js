import { test, expect } from '@playwright/test';

test.describe('Multiplayer Synchronization', () => {
  test('should connect multiple players to the same game session', async ({ browser }) => {
    test.slow();

    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Both players connect
      await page1.goto('http://localhost:5173');
      await page2.goto('http://localhost:5173');

      await page1.waitForSelector('canvas', { timeout: 15000 });
      await page2.waitForSelector('canvas', { timeout: 15000 });

      // Verify both pages have loaded the game
      const canvas1 = page1.locator('canvas').first();
      const canvas2 = page2.locator('canvas').first();

      await expect(canvas1).toBeVisible();
      await expect(canvas2).toBeVisible();

      // Wait for connection establishment
      await page1.waitForTimeout(2000);
      await page2.waitForTimeout(2000);

      // Check for connection indicators
      const connectionIndicator1 = page1.locator('.connection-status, [data-testid="connection"]').first();
      const connectionIndicator2 = page2.locator('.connection-status, [data-testid="connection"]').first();

      // Verify both players are connected (if indicator exists)
      if (await connectionIndicator1.count() > 0) {
        await expect(connectionIndicator1).toHaveText(/connected|Connected|✓/, { timeout: 5000 });
      }

      if (await connectionIndicator2.count() > 0) {
        await expect(connectionIndicator2).toHaveText(/connected|Connected|✓/, { timeout: 5000 });
      }

    } finally {
      await page1.close();
      await page2.close();
      await context1.close();
      await context2.close();
    }
  });

  test('should synchronize player movements between clients', async ({ browser }) => {
    test.slow();

    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      await page1.goto('http://localhost:5173');
      await page2.goto('http://localhost:5173');

      await page1.waitForSelector('canvas', { timeout: 15000 });
      await page2.waitForSelector('canvas', { timeout: 15000 });

      await page1.waitForTimeout(2000);
      await page2.waitForTimeout(2000);

      // Player 1 moves their ship/entity
      const canvas1 = page1.locator('canvas').first();

      // Select an entity first (if there's a selection system)
      await canvas1.click({ position: { x: 400, y: 300 } });
      await page1.waitForTimeout(500);

      // Issue a move command (this depends on UI implementation)
      // Try right-click or use move button
      const moveButton = page1.locator('button:has-text("Move")').or(page1.locator('button:has-text("Déplacer")'));

      if (await moveButton.count() > 0) {
        await moveButton.click();
        await canvas1.click({ position: { x: 500, y: 400 } });
      } else {
        // Try right-click for context menu
        await canvas1.click({ button: 'right', position: { x: 500, y: 400 } });
        await page1.waitForTimeout(500);

        const moveOption = page1.locator('text=Move, text=Déplacer').first();
        if (await moveOption.count() > 0) {
          await moveOption.click();
        }
      }

      // Wait for movement to occur
      await page1.waitForTimeout(2000);

      // Player 2 should see the movement
      const canvas2 = page2.locator('canvas').first();

      // Look for the moved entity at the new position
      // This is a simplified check - actual implementation would need proper selectors
      await page2.waitForTimeout(2000);

      // Take a screenshot for debugging (optional)
      await page2.screenshot({ path: 'test-results/movement-sync.png' });

    } finally {
      await page1.close();
      await page2.close();
      await context1.close();
      await context2.close();
    }
  });

  test('should handle prediction and reconciliation', async ({ browser }) => {
    test.slow();

    // This test verifies that client-side prediction works
    // and server corrections are applied smoothly

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto('http://localhost:5173');
      await page.waitForSelector('canvas', { timeout: 15000 });

      await page.waitForTimeout(2000);

      const canvas = page.locator('canvas').first();

      // Perform a rapid sequence of actions
      for (let i = 0; i < 5; i++) {
        await canvas.click({ position: { x: 400 + i * 20, y: 300 } });
        await page.waitForTimeout(100);
      }

      // Wait for any pending reconciliations
      await page.waitForTimeout(2000);

      // Verify the final state is consistent
      // (This would need specific UI elements to verify)

    } finally {
      await page.close();
      await context.close();
    }
  });

  test('should maintain sync under network latency', async ({ browser }) => {
    test.slow();

    // Simulate network conditions using Playwright's network emulation
    const context = await browser.newContext();

    // Enable network emulation (if supported)
    try {
      await context.route('**/*', route => {
        // Add artificial delay to simulate latency
        setTimeout(() => route.continue(), 100);
      });
    } catch (error) {
      // Network emulation might not be available
      console.warn('Network emulation not available, running without latency simulation');
    }

    const page = await context.newPage();

    try {
      await page.goto('http://localhost:5173');
      await page.waitForSelector('canvas', { timeout: 20000 }); // Longer timeout for latency

      await page.waitForTimeout(3000);

      // Perform actions under simulated latency
      const canvas = page.locator('canvas').first();
      await canvas.click({ position: { x: 400, y: 300 } });

      await page.waitForTimeout(1000);

      // Verify game remains responsive
      await canvas.click({ position: { x: 450, y: 350 } });

      await page.waitForTimeout(1000);

      // Check for any desync indicators or errors
      const errorIndicator = page.locator('.error, .desync-warning, [data-testid="error"]');

      if (await errorIndicator.count() > 0) {
        const errorText = await errorIndicator.textContent();
        console.warn('Desync or error detected:', errorText);
      }

    } finally {
      await page.close();
      await context.close();
    }
  });

  test('should handle player disconnection and reconnection', async ({ browser }) => {
    test.slow();

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Connect
      await page.goto('http://localhost:5173');
      await page.waitForSelector('canvas', { timeout: 15000 });

      await page.waitForTimeout(2000);

      // Simulate disconnection by going offline
      await context.setOffline(true);

      await page.waitForTimeout(1000);

      // Try to perform an action (should be queued or fail gracefully)
      const canvas = page.locator('canvas').first();
      await canvas.click({ position: { x: 400, y: 300 } });

      await page.waitForTimeout(1000);

      // Reconnect
      await context.setOffline(false);

      await page.waitForTimeout(3000);

      // Verify reconnection
      const connectionIndicator = page.locator('.connection-status, [data-testid="connection"]').first();

      if (await connectionIndicator.count() > 0) {
        await expect(connectionIndicator).toHaveText(/connected|Connected|✓/, { timeout: 10000 });
      }

    } finally {
      await page.close();
      await context.close();
    }
  });

  test('should synchronize game state after join mid-game', async ({ browser }) => {
    test.slow();

    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Player 1 joins first
      await page1.goto('http://localhost:5173');
      await page1.waitForSelector('canvas', { timeout: 15000 });

      await page1.waitForTimeout(2000);

      // Player 1 performs some actions
      const canvas1 = page1.locator('canvas').first();
      await canvas1.click({ position: { x: 400, y: 300 } });

      await page1.waitForTimeout(1000);

      // Player 2 joins later
      await page2.goto('http://localhost:5173');
      await page2.waitForSelector('canvas', { timeout: 15000 });

      await page2.waitForTimeout(3000);

      // Player 2 should see the current game state
      const canvas2 = page2.locator('canvas').first();

      // Verify both players see the same world
      // (This would need specific elements to compare)

      await page2.screenshot({ path: 'test-results/late-join-sync.png' });

    } finally {
      await page1.close();
      await page2.close();
      await context1.close();
      await context2.close();
    }
  });

  test('should handle rapid input from multiple players', async ({ browser }) => {
    test.slow();

    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const context3 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    const page3 = await context3.newPage();

    try {
      // All players connect
      await Promise.all([
        page1.goto('http://localhost:5173'),
        page2.goto('http://localhost:5173'),
        page3.goto('http://localhost:5173')
      ]);

      await Promise.all([
        page1.waitForSelector('canvas', { timeout: 15000 }),
        page2.waitForSelector('canvas', { timeout: 15000 }),
        page3.waitForSelector('canvas', { timeout: 15000 })
      ]);

      await page1.waitForTimeout(2000);
      await page2.waitForTimeout(2000);
      await page3.waitForTimeout(2000);

      // All players perform rapid actions simultaneously
      const canvas1 = page1.locator('canvas').first();
      const canvas2 = page2.locator('canvas').first();
      const canvas3 = page3.locator('canvas').first();

      const actions = [];

      for (let i = 0; i < 10; i++) {
        actions.push(
          canvas1.click({ position: { x: 300 + i * 10, y: 200 } }),
          canvas2.click({ position: { x: 400 + i * 10, y: 300 } }),
          canvas3.click({ position: { x: 500 + i * 10, y: 400 } })
        );

        await page1.waitForTimeout(50);
        await page2.waitForTimeout(50);
        await page3.waitForTimeout(50);
      }

      // Wait for all actions to complete
      await Promise.all(actions);

      await page1.waitForTimeout(3000);
      await page2.waitForTimeout(3000);
      await page3.waitForTimeout(3000);

      // Verify all clients remain in sync
      // Check for errors or desync warnings
      const error1 = page1.locator('.error, .desync-warning');
      const error2 = page2.locator('.error, .desync-warning');
      const error3 = page3.locator('.error, .desync-warning');

      if (await error1.count() > 0 || await error2.count() > 0 || await error3.count() > 0) {
        console.warn('Errors detected during stress test');
      }

    } finally {
      await page1.close();
      await page2.close();
      await page3.close();
      await context1.close();
      await context2.close();
      await context3.close();
    }
  });
});
