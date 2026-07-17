import { expect, test } from 'playwright/test';

const depths = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1];
const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:4174';

test('continuous flight advances through eight scroll depths', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/home`);
  await page.waitForSelector('.scroll-world video');
  await expect.poll(() => page.locator('.scroll-world video').evaluate((video) => video.duration)).toBeGreaterThan(31);

  const worldHeight = await page.locator('.scroll-world').evaluate((node) => node.offsetHeight - innerHeight);
  let previousTime = -1;
  for (const [index, depth] of depths.entries()) {
    await page.evaluate(([height, progress]) => scrollTo(0, height * progress), [worldHeight, depth]);
    await page.waitForTimeout(700);
    const currentTime = await page.locator('.scroll-world video').evaluate((video) => video.currentTime);
    expect(currentTime).toBeGreaterThan(previousTime);
    previousTime = currentTime;
    await page.screenshot({ path: `.scroll-world-work/refine-${index + 1}.png` });
  }
});

test('hard refresh restores the scroll-matched flight frame', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/home`);
  await expect.poll(() => page.locator('.scroll-world video').evaluate((video) => video.duration)).toBeGreaterThan(31);

  const worldHeight = await page.locator('.scroll-world').evaluate((node) => node.offsetHeight - innerHeight);
  for (const depth of [0.18, 0.42, 0.67, 0.88]) {
    await page.evaluate(([height, progress]) => scrollTo(0, height * progress), [worldHeight, depth]);
    // Reload immediately: this catches stale media time saved before the scroll RAF seeks.
    await page.waitForTimeout(10);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect.poll(() => page.locator('.scroll-world video').evaluate((video) => video.readyState)).toBeGreaterThanOrEqual(2);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(worldHeight * depth - 3);
    const state = await page.evaluate(() => {
      const world = document.querySelector('.scroll-world');
      const video = world?.querySelector('video');
      const progress = (scrollY - world.offsetTop) / (world.offsetHeight - innerHeight);
      return {
        active: world?.querySelector('.world-copy.is-active')?.textContent,
        currentTime: video?.currentTime,
        expectedTime: progress * (video?.duration - 0.04),
      };
    });
    expect(state.active).toBeTruthy();
    expect(Math.abs(state.currentTime - state.expectedTime)).toBeLessThan(0.12);
  }
});
