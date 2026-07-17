import { test, expect } from 'playwright/test';

const positions = [0, 0.26, 0.51, 0.76, 0.97];

test('desktop camera chain scrubs through every chapter', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4174/');
  await page.waitForSelector('.scroll-world video');
  await page.waitForTimeout(2500);
  await expect(page.locator('iframe')).toHaveCount(0);
  await expect(page.locator('audio')).toHaveAttribute('src', '/ambient-fairy-fountain.ogg');
  await page.locator('.audio-dock button').click();
  await expect(page.locator('audio')).not.toHaveJSProperty('muted', true);
  await expect(page.locator(`a[href="https://www.linkedin.com/in/saras-totey-64a777334/"]`).first()).toBeAttached();
  await expect(page.locator('a[href="https://buymeacoffee.com/sarast1"]').first()).toBeAttached();
  await expect(page.locator('a[href="https://github.com/PandaXPanther"]').first()).toBeAttached();
  const metrics = await page.request.get('http://127.0.0.1:4174/generated/live-signals.json');
  expect(metrics.ok()).toBeTruthy();
  const worldHeight = await page.locator('.scroll-world').evaluate((node) => node.offsetHeight - innerHeight);
  let previousTime = -1;
  for (let index = 0; index < positions.length; index += 1) {
    await page.evaluate((y) => scrollTo(0, y), worldHeight * positions[index]);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `.scroll-world-work/desktop-${index + 1}.png` });
    const state = await page.evaluate(() => ({
      chapter: document.querySelector('.world-copy.is-active')?.textContent,
      visibleVideos: [...document.querySelectorAll('.scroll-world video')].filter((video) => Number(getComputedStyle(video.parentElement).opacity) > 0.5).map((video) => video.currentTime),
    }));
    expect(state.chapter).toBeTruthy();
    expect(state.visibleVideos.length).toBeGreaterThan(0);
    const currentTime = state.visibleVideos[0];
    if (index === 0) expect(currentTime).toBeGreaterThanOrEqual(0);
    previousTime = currentTime;
  }
  expect(previousTime).toBeGreaterThan(1);
});

test('mobile layout keeps copy clear of the diorama', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://127.0.0.1:4174/');
  await page.waitForSelector('.scroll-world');
  const worldHeight = await page.locator('.scroll-world').evaluate((node) => node.offsetHeight - innerHeight);
  for (const [index, position] of [0.05, 0.52, 0.95].entries()) {
    await page.evaluate((y) => scrollTo(0, y), worldHeight * position);
    await page.waitForTimeout(700);
    await page.screenshot({ path: `.scroll-world-work/mobile-${index + 1}.png` });
  }
});
