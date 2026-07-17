import { expect, test } from 'playwright/test';

const depths = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1];

test('continuous flight advances through eight scroll depths', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4174/home');
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
