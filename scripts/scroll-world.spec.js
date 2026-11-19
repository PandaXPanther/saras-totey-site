import { devices, expect, test } from 'playwright/test';

const world = (page) => page.locator('.scroll-world');
const video = (page) => world(page).locator('video');
const mediaTime = (page) => video(page).evaluate((player) => player.currentTime);

async function waitForVideo(page) {
  await expect.poll(() => video(page).evaluate((player) => player.readyState)).toBeGreaterThanOrEqual(2);
}

test('the original homepage scrubs the same desktop film and settles on the right chapters', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('.glass-nav')).toBeVisible();
  await expect(world(page).locator('.world-copy.is-active')).toContainText('Saras Totey.');
  await expect(world(page).locator('img[alt="Saras Totey"]')).toBeVisible();
  await expect(world(page).locator('.scroll-world__scene img')).toHaveAttribute('src', '/world/flight/continuous-flight-poster.webp');
  await waitForVideo(page);
  const source = await video(page).evaluate((player) => ({
    path: new URL(player.currentSrc).pathname, width: player.videoWidth,
  }));
  expect(source).toEqual({ path: '/world/flight/continuous-flight.mp4', width: 2560 });
  await expect.poll(() => mediaTime(page)).toBeLessThan(.05);
  await expect(world(page)).not.toHaveAttribute('data-flight-ready');

  await page.evaluate(() => {
    const player = document.querySelector('.scroll-world video');
    window.presentedFrames = [];
    const record = (_, frame) => {
      window.presentedFrames.push(frame.mediaTime);
      player.requestVideoFrameCallback(record);
    };
    player.requestVideoFrameCallback(record);
  });
  for (let i = 0; i < 4; i++) {
    await page.mouse.wheel(0, 130);
    await expect.poll(() => page.evaluate(() => presentedFrames.length)).toBeGreaterThan(i);
  }
  await expect(world(page)).toHaveAttribute('data-flight-ready', 'true');
  const presented = await page.evaluate(() => presentedFrames);
  expect(presented.at(-1)).toBeGreaterThan(presented[0]);
  await expect.poll(() => mediaTime(page)).toBeGreaterThan(1.9);

  await page.getByRole('button', { name: 'Go to Local Ledger' }).click();
  await expect(world(page).locator('.world-copy.is-active')).toContainText('A public-data observatory');
  await expect.poll(() => mediaTime(page)).toBeGreaterThanOrEqual(18.1);
  await page.mouse.move(75, 130);
  await page.mouse.wheel(0, -6500);
  await expect(world(page)).toHaveAttribute('data-marker', '0');
  await expect(world(page)).not.toHaveAttribute('data-flight-ready');
});

test('mobile uses the sharper portrait crop and preserves progress when browser chrome moves', async ({ browser }) => {
  const model = devices['iPhone 13'];
  const context = await browser.newContext({
    ...model, viewport: { width: 390, height: 675 }, userAgent: `${model.userAgent} Instagram`,
  });
  try {
    const page = await context.newPage();
    await page.goto('/');
    await waitForVideo(page);
    const source = await video(page).evaluate((player) => ({
      path: new URL(player.currentSrc).pathname, width: player.videoWidth, height: player.videoHeight,
    }));
    expect(source).toEqual({ path: '/world/flight/continuous-flight-portrait.mp4', width: 800, height: 1280 });
    const session = await context.newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 156, y: 601 }] });
    for (let step = 1; step <= 8; step++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 156, y: 601 - step * 38 }] });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => mediaTime(page)).toBeGreaterThan(1);
    const before = await world(page).evaluate((element) => element.style.getPropertyValue('--world-scroll-distance'));
    await page.setViewportSize({ width: 390, height: 805 });
    await expect.poll(() => world(page).evaluate((element) => element.style.getPropertyValue('--world-viewport-height'))).toBe('805px');
    const after = await world(page).evaluate((element) => element.style.getPropertyValue('--world-scroll-distance'));
    expect(after).toBe(before);
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await expect(world(page)).toHaveAttribute('data-marker', '5');
    await expect.poll(() => mediaTime(page)).toBeGreaterThan(34.1);
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

test('the camera does not rest in the obscured frame', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await waitForVideo(page);
  await world(page).evaluate((element) => {
    const distance = parseFloat(element.style.getPropertyValue('--world-scroll-distance'));
    window.scrollTo(0, Math.round(distance * (337.8 / 812)));
  });
  await expect(world(page)).toHaveAttribute('data-flight-ready', 'true');
  await expect.poll(() => mediaTime(page)).toBeGreaterThanOrEqual(14.5);
  await expect.poll(() => video(page).evaluate((player) => player.seeking)).toBe(false);
});

test('reduced motion keeps stills and navigation restores the original chapter position', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(video(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Go to Local Ledger' }).click();
  await expect(world(page).locator('.world-copy.is-active')).toContainText('A public-data observatory');
  const origin = await page.evaluate(() => scrollY);
  await world(page).locator('.world-copy.is-active').getByRole('link', { name: 'Take me there' }).click();
  await expect(page).toHaveURL(/\/economics#local-ledger$/);
  // The deep link can change the destination scroll without losing the homepage position.
  await page.getByRole('link', { name: 'Take me back' }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(origin);
  await expect(world(page)).toHaveAttribute('data-marker', '3');
});
