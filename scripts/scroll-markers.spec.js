import { test, expect } from 'playwright/test';

test.describe.configure({ timeout: 120_000 });

const baseUrl = 'http://127.0.0.1:4174/';
const markerTimes = [0, 6.041667, 12.083334, 18.125001, 22.166668, 28.208335];

const waitForMarker = async (page, marker) => {
  await expect(page.locator('.scroll-world')).toHaveAttribute('data-marker', String(marker));
};

test('wheel gestures step through every marker with eased intermediate frames and synced copy', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 600 });
  await page.goto(baseUrl);
  await expect.poll(() => page.locator('.scroll-world video').evaluate((video) => video.readyState)).toBeGreaterThanOrEqual(2);

  await page.evaluate(() => {
    window.__markerSamples = [];
    window.__markerSampler = setInterval(() => {
      window.__markerSamples.push(document.querySelector('.scroll-world video')?.currentTime ?? 0);
    }, 40);
  });
  await page.mouse.wheel(0, 120);
  await page.waitForTimeout(90);
  await page.screenshot({ path: '.scroll-world-work/marker-transition-01-90ms.jpg', type: 'jpeg', quality: 65 });
  await page.waitForTimeout(80);
  await page.screenshot({ path: '.scroll-world-work/marker-transition-02-mid.jpg', type: 'jpeg', quality: 65 });
  await page.waitForTimeout(80);
  await page.screenshot({ path: '.scroll-world-work/marker-transition-03-late.jpg', type: 'jpeg', quality: 65 });
  await waitForMarker(page, 1);
  const samples = await page.evaluate(() => {
    clearInterval(window.__markerSampler);
    return window.__markerSamples;
  });
  const intermediate = samples.filter((time) => time > 0.08 && time < markerTimes[1] - 0.08);
  expect(intermediate.length).toBeGreaterThan(4);
  expect(intermediate.some((time, index) => index > 0 && time > intermediate[index - 1])).toBeTruthy();
  await expect(page.locator('.world-copy.is-active')).toContainText('Markets, then code');
  await expect(page.locator('.world-controls')).toHaveClass(/is-dismissed/);

  for (let marker = 2; marker < markerTimes.length; marker += 1) {
    await page.mouse.wheel(0, 120);
    await waitForMarker(page, marker);
    await expect.poll(() => page.locator('.scroll-world video').evaluate((video) => video.currentTime)).toBeCloseTo(markerTimes[marker], 1);
  }
  for (let marker = markerTimes.length - 2; marker >= 0; marker -= 1) {
    await page.mouse.wheel(0, -120);
    await waitForMarker(page, marker);
  }
});

test('touch swipe steps markers and marker persistence survives return and browser back', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  const session = await context.newCDPSession(page);
  await page.goto(baseUrl);
  await expect.poll(() => page.locator('.scroll-world video').evaluate((video) => video.readyState)).toBeGreaterThanOrEqual(2);

  const swipe = async (fromY, toY) => {
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y: fromY }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 190, y: toY }] });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };

  await swipe(650, 300);
  await waitForMarker(page, 1);
  await expect(page.locator('.world-copy.is-active')).toContainText('Markets, then code');
  await swipe(650, 300);
  await waitForMarker(page, 2);
  await expect(page.locator('.world-copy.is-active')).toContainText('Twelve tools');
  await page.screenshot({ path: '.scroll-world-work/marker-mobile-touch.png' });

  await page.locator('.world-copy.is-active .glass-button').click();
  await expect(page).toHaveURL(/econ-mom/);
  await page.locator('.take-back').click();
  await expect(page).toHaveURL(/home/);
  await waitForMarker(page, 2);
  await expect.poll(() => page.locator('.scroll-world video').evaluate((video) => video.currentTime)).toBeCloseTo(markerTimes[2], 1);

  await page.getByRole('button', { name: 'Go to Local Ledger' }).click();
  await waitForMarker(page, 3);
  await page.locator('.world-copy.is-active .glass-button').click();
  await expect(page).toHaveURL(/local-ledger/);
  await page.goBack();
  await expect(page).toHaveURL(/home/);
  await waitForMarker(page, 3);
  await context.close();
});

test('ambient audio persists while marker navigation and route navigation run', async ({ page }) => {
  await page.goto(baseUrl);
  await page.locator('.audio-dock button').click();
  await expect.poll(() => page.evaluate(() => !window.__sarasAmbientAudio.paused)).toBeTruthy();
  await page.mouse.wheel(0, 120);
  await waitForMarker(page, 1);
  await page.locator('.world-copy.is-active .glass-button').click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() => !window.__sarasAmbientAudio.paused)).toBeTruthy();
  await page.locator('.take-back').click();
  await waitForMarker(page, 1);
  await expect.poll(() => page.evaluate(() => !window.__sarasAmbientAudio.paused)).toBeTruthy();
});
