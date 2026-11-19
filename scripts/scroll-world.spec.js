import { devices, expect, test } from 'playwright/test';

const scene = (page) => page.locator('.island');
const progress = (page) => scene(page).locator('canvas').evaluate((canvas) => Number(canvas.dataset.progress));

test('native wheel scroll changes the actual 3D camera and keeps the landmark controls attached', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(scene(page)).toHaveAttribute('data-scene', 'ready');
  await expect(scene(page).locator('img, video')).toHaveCount(0);
  await expect.poll(() => progress(page)).toBe(0);
  const landmark = page.getByRole('button', { name: /Naruto/ });
  const start = await landmark.boundingBox();
  await page.mouse.wheel(0, 270);
  await expect.poll(() => progress(page)).toBeGreaterThan(.36);
  const moved = await landmark.boundingBox();
  expect(Math.abs(moved.x - start.x) + Math.abs(moved.y - start.y)).toBeGreaterThan(12);
  await landmark.click();
  await expect(landmark).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#island-caption')).toContainText('Uzumaki');
  await page.mouse.move(100, 210);
  await page.mouse.wheel(0, -900);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect.poll(() => progress(page)).toBeLessThan(.02);
});

test('mobile touch scroll moves the world and fits all six tabs at a narrow viewport', async ({ browser }) => {
  const context = await browser.newContext({ ...devices['iPhone 13'], viewport: { width: 320, height: 690 } });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await expect(scene(page)).toHaveAttribute('data-scene', 'ready');
    const session = await context.newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 156, y: 621 }] });
    for (let step = 1; step <= 8; step++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 156, y: 621 - step * 38 }] });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => progress(page)).toBeGreaterThan(.35);
    const viewport = await page.evaluate(() => document.documentElement.clientWidth);
    for (const tab of await page.getByRole('navigation', { name: 'Portfolio pages' }).getByRole('link').all()) {
      const box = await tab.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport);
    }
  } finally {
    await context.close();
  }
});

test('reduced motion keeps the real island still, and return from a project restores scroll', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(scene(page)).toHaveAttribute('data-scene', 'ready');
  await page.getByRole('link', { name: 'Explore my work' }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
  await expect.poll(() => progress(page)).toBe(0);
  const origin = await page.evaluate(() => scrollY);
  await page.getByRole('link', { name: 'Explore economics' }).click();
  await expect(page).toHaveURL(/\/economics$/);
  await page.getByRole('link', { name: 'Back to selected work' }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(origin);
});
