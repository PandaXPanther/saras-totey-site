import { test, expect } from 'playwright/test';

test.describe.configure({ timeout: 120_000 });

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4174/';
const markerTimes = [0, 6.041667, 12.083334, 18.125001, 22.166668, 28.208335];

const waitForMarker = async (page, marker) => {
  await expect(page.locator('.scroll-world')).toHaveAttribute('data-marker', String(marker));
};

const waitForVideoMetadata = async (page) => {
  await expect.poll(() => page.locator('.scroll-world video').evaluate((video) => video.readyState), { timeout: 60_000 }).toBeGreaterThanOrEqual(1);
  await expect.poll(() => page.locator('.scroll-world video').evaluate((video) => video.duration), { timeout: 60_000 }).toBeGreaterThan(0);
};

const wheelUntilMarker = async (page, marker) => {
  const direction = marker > Number(await page.locator('.scroll-world').getAttribute('data-marker')) ? 1 : -1;
  let gestures = 0;
  while (Number(await page.locator('.scroll-world').getAttribute('data-marker')) !== marker) {
    const startScrollY = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, direction * 240);
    await expect.poll(() => page.evaluate(() => scrollY)).not.toBe(startScrollY);
    gestures += 1;
    expect(gestures, `marker ${marker} was not reached by free-scroll wheel travel`).toBeLessThan(12);
  }
  await waitForMarker(page, marker);
};

test('wheel free-scroll visits every marker with intermediate video frames and synced copy', async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 600 });
  await page.goto(baseUrl);
  await waitForVideoMetadata(page);

  await page.evaluate(() => {
    window.__markerSamples = [];
    window.__markerSampler = setInterval(() => {
      window.__markerSamples.push(document.querySelector('.scroll-world video')?.currentTime ?? 0);
    }, 40);
  });
  await wheelUntilMarker(page, 1);
  const samples = await page.evaluate(() => {
    clearInterval(window.__markerSampler);
    return window.__markerSamples;
  });
  const intermediate = samples.filter((time) => time > 0.08 && time < markerTimes[1] - 0.08);
  console.log('wheel intermediate video samples:', intermediate);
  expect(intermediate.length).toBeGreaterThan(4);
  expect(intermediate.some((time, index) => index > 0 && time > intermediate[index - 1])).toBeTruthy();
  await expect(page.locator('.world-copy.is-active')).toContainText('Markets, then code');
  await expect(page.locator('.world-controls')).toHaveClass(/is-dismissed/);

  for (let marker = 2; marker < markerTimes.length; marker += 1) {
    await wheelUntilMarker(page, marker);
    await expect.poll(() => page.locator('.scroll-world video').evaluate((video) => video.currentTime)).toBeGreaterThanOrEqual(markerTimes[marker] - 0.2);
  }
  for (let marker = markerTimes.length - 2; marker >= 0; marker -= 1) {
    await wheelUntilMarker(page, marker);
  }
});

test('touch free-scroll reliably traverses the full world in both directions', async ({ browser }) => {
  test.setTimeout(600_000);
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  const session = await context.newCDPSession(page);
  await page.goto(baseUrl);
  await waitForVideoMetadata(page);

  const swipe = async (fromY, toY) => {
    const startScrollY = await page.evaluate(() => scrollY);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y: fromY }] });
    for (let step = 1; step <= 8; step += 1) {
      const y = fromY + ((toY - fromY) * step) / 8;
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 190, y }] });
      await page.waitForTimeout(12);
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => page.evaluate(() => scrollY), { timeout: 3_000 }).not.toBe(startScrollY);
  };

  const traverse = async (direction) => {
    const forward = direction === 'forward';
    const expectedMarkers = forward ? [1, 2, 3, 4, 5] : [4, 3, 2, 1, 0];
    for (const expectedMarker of expectedMarkers) {
      let gestures = 0;
      while (Number(await page.locator('.scroll-world').getAttribute('data-marker')) !== expectedMarker) {
        await swipe(forward ? 700 : 180, forward ? 180 : 700);
        gestures += 1;
        expect(gestures, `marker ${expectedMarker} was not reached while traversing ${direction}`).toBeLessThan(8);
      }
      await waitForMarker(page, expectedMarker);
      await expect(page.locator('.world-copy.is-active')).toBeVisible();
      const expectedTime = markerTimes[expectedMarker];
      await expect.poll(() => page.locator('.scroll-world video').evaluate((video) => video.currentTime)).toBeGreaterThanOrEqual(Math.max(0, expectedTime - 0.35));
      if (process.env.CAPTURE_DEPTHS && forward && expectedMarker <= 5) {
        await page.screenshot({ path: `.scroll-world-work/live-mobile-depth-${expectedMarker}.png` });
      }
    }
    const atExtreme = () => page.evaluate((isForward) => {
      const maxScrollY = document.documentElement.scrollHeight - innerHeight;
      return isForward ? scrollY >= maxScrollY - 2 : scrollY <= 2;
    }, forward);
    while (!(await atExtreme())) {
      await swipe(forward ? 700 : 180, forward ? 180 : 700);
    }
    const expectedProgress = forward ? 1 : 0;
    await expect.poll(() => page.locator('.scroll-world video').evaluate((video) => video.currentTime / video.duration)).toBeCloseTo(expectedProgress, 1);
  };

  for (let pass = 1; pass <= 5; pass += 1) {
    await traverse('forward');
    const forwardEndpoint = await page.evaluate(() => ({ scrollY, videoTime: document.querySelector('.scroll-world video')?.currentTime }));
    await traverse('backward');
    await expect(page.locator('.scroll-world')).toHaveAttribute('data-marker', '0');
    const backwardEndpoint = await page.evaluate(() => ({ scrollY, videoTime: document.querySelector('.scroll-world video')?.currentTime }));
    console.log(`mobile touch pass ${pass}:`, { forwardEndpoint, backwardEndpoint });
  }

  await page.screenshot({ path: '.scroll-world-work/mobile-touch-five-pass.png' });
  await context.close();
});

test('in-app world spacer tracks a viewport height change after scrolling starts', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 700 },
    hasTouch: true,
    isMobile: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Instagram 390.0.0.0 Mobile Safari/537.36',
  });
  const page = await context.newPage();
  await page.goto(baseUrl);

  const readGeometry = () => page.locator('.scroll-world').evaluate((world) => ({
    viewportHeight: innerHeight,
    worldHeight: world.offsetHeight,
    cssWorldHeight: getComputedStyle(world).getPropertyValue('--world-height'),
    maxScrollY: document.documentElement.scrollHeight - innerHeight,
  }));
  const initial = await readGeometry();
  expect(Number.parseFloat(initial.cssWorldHeight)).toBeCloseTo(initial.worldHeight, 0);

  await page.evaluate(() => scrollTo(0, 120));
  await page.setViewportSize({ width: 375, height: 812 });
  await expect.poll(async () => (await readGeometry()).worldHeight).toBeGreaterThan(initial.worldHeight);

  const resized = await readGeometry();
  const worldUnits = initial.worldHeight / initial.viewportHeight;
  expect(resized.worldHeight).toBeCloseTo(worldUnits * resized.viewportHeight, 0);
  expect(Number.parseFloat(resized.cssWorldHeight)).toBeCloseTo(resized.worldHeight, 0);
  expect(resized.maxScrollY).toBeGreaterThan(initial.maxScrollY);
  expect(await page.evaluate(() => scrollY)).toBeLessThan(resized.maxScrollY);

  await page.screenshot({ path: '.scroll-world-work/viewport-resize-regression.png' });
  await context.close();
});

test('light WebView scroll keeps copy and chapter rail stable while deliberate scroll remains proportional', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 700 },
    hasTouch: true,
    isMobile: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Instagram 390.0.0.0 Mobile Safari/537.36',
  });
  const page = await context.newPage();
  await page.goto(baseUrl);

  const readUi = () => page.evaluate(() => {
    const card = document.querySelector('.world-copy.is-active')?.getBoundingClientRect();
    const route = document.querySelector('.world-route')?.getBoundingClientRect();
    return {
      marker: document.querySelector('.scroll-world')?.getAttribute('data-marker'),
      scrollY,
      cardTop: card?.top,
      routeTop: route?.top,
    };
  });
  const initial = await readUi();

  await page.evaluate(() => scrollTo(0, 30));
  await page.setViewportSize({ width: 375, height: 812 });
  await expect.poll(async () => (await readUi()).scrollY).toBe(30);
  await expect.poll(async () => Math.abs((await readUi()).cardTop - initial.cardTop)).toBeLessThan(15);
  await expect.poll(async () => Math.abs((await readUi()).routeTop - initial.routeTop)).toBeLessThan(8);
  const afterLightScroll = await readUi();
  expect(afterLightScroll.marker).toBe('0');

  await page.evaluate(() => scrollTo(0, 1_500));
  await expect(page.locator('.scroll-world')).toHaveAttribute('data-marker', '1');
  const afterDeliberateScroll = await readUi();
  expect(afterDeliberateScroll.scrollY).toBe(1_500);
  expect(afterDeliberateScroll.marker).toBe('1');

  await page.screenshot({ path: '.scroll-world-work/webview-light-scroll-regression.png' });
  await context.close();
});

test('ambient audio persists while marker navigation and route navigation run', async ({ page }) => {
  await page.goto(baseUrl);
  await page.locator('.audio-dock button').click();
  await expect.poll(() => page.evaluate(() => !window.__sarasAmbientAudio.paused)).toBeTruthy();
  await wheelUntilMarker(page, 1);
  await page.locator('.world-copy.is-active .glass-button').click();
  await expect(page).toHaveURL(/\/quant$/);
  await expect.poll(() => page.evaluate(() => !window.__sarasAmbientAudio.paused)).toBeTruthy();
  await page.locator('.take-back').click();
  await waitForMarker(page, 1);
  await expect.poll(() => page.evaluate(() => !window.__sarasAmbientAudio.paused)).toBeTruthy();
});
