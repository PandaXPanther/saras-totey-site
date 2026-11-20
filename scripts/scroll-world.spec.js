import { readFileSync } from 'node:fs';
import { devices, expect, test } from 'playwright/test';

const pacing = JSON.parse(readFileSync(new URL('../src/data/flight-pacing.json', import.meta.url)));
const world = (page) => page.locator('.scroll-world');
const renderedFrame = (page) => world(page).evaluate((element) => Number(element.dataset.renderedFrame));
const activeCopy = (page) => world(page).locator('.world-copy.is-active');
const chapter = (page, name) => page.getByRole('button', { name: `Go to ${name}`, exact: true });

test('the camera paints multiple intermediate frames between wheel movements', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(world(page)).toHaveAttribute('data-flight-renderer', 'frames');
  await expect(world(page).locator('.scroll-world__scene img')).toHaveAttribute('src', '/world/flight/continuous-flight-poster.webp');
  await expect.poll(() => renderedFrame(page)).toBe(0);
  const width = await world(page).locator('img[alt="Saras Totey"]').evaluate((image) => image.getBoundingClientRect().width);
  expect(width).toBeGreaterThan(95);

  await world(page).evaluate((element) => {
    window.flightFrames = [];
    new MutationObserver(() => window.flightFrames.push(Number(element.dataset.renderedFrame)))
      .observe(element, { attributes: true, attributeFilter: ['data-rendered-frame'] });
  });
  await page.mouse.wheel(0, 320);
  await expect.poll(() => renderedFrame(page)).toBeGreaterThanOrEqual(59);
  const frames = await page.evaluate(() => flightFrames);
  expect(new Set(frames.filter((frame) => frame > 0 && frame < 54)).size).toBeGreaterThanOrEqual(2);

  await chapter(page, 'Local Ledger').click();
  await expect(activeCopy(page)).toContainText('A public-data observatory', { timeout: 10_000 });
  await page.mouse.move(80, 100);
  await page.mouse.wheel(0, -8000);
  await expect.poll(() => renderedFrame(page), { timeout: 10_000 }).toBe(0);
});

test('a missing motion sheet cannot freeze the island or hold the chapter links', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route('**/world/flight/motion-v2/wide/*.webp', async (route) => {
    if (route.request().url().endsWith('/overview.webp')) await route.continue();
    else await route.abort();
  });
  await page.route('**/world/flight/frames/wide/*.bin', (route) => route.abort());
  await page.goto('/');
  await expect(world(page)).toHaveAttribute('data-flight-quality', 'overview');
  await expect.poll(() => renderedFrame(page)).toBe(0);

  for (const [delta, minimum] of [[420, 48], [460, 100], [-640, 20]]) {
    await page.mouse.wheel(0, delta);
    if (delta > 0) await expect.poll(() => renderedFrame(page)).toBeGreaterThan(minimum);
    else await expect.poll(() => renderedFrame(page)).toBeLessThan(70);
  }
  await expect.poll(() => renderedFrame(page)).toBeGreaterThan(20);
  await chapter(page, 'Roblox games').click();
  await expect(activeCopy(page).getByRole('link', { name: 'Take me there' })).toHaveAttribute('href', '/roblox');
  await expect.poll(() => renderedFrame(page)).toBeGreaterThan(595);
});

test('portrait touch scroll and browser chrome resize preserve the flight', async ({ browser }) => {
  const model = devices['iPhone 13'];
  const context = await browser.newContext({
    ...model, viewport: { width: 390, height: 675 }, userAgent: `${model.userAgent} Instagram`,
  });
  try {
    const page = await context.newPage();
    await page.goto('/?utm_source=ig_bio', { referer: 'https://l.instagram.com/' });
    await expect(world(page)).toHaveAttribute('data-in-app-webview', 'true');
    await expect.poll(() => renderedFrame(page)).toBe(0);
    const canvasSize = await world(page).locator('canvas').evaluate(({ width, height }) => [width, height]);
    expect(canvasSize).toEqual([900, 1440]);
    const session = await context.newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 156, y: 601 }] });
    for (let step = 1; step <= 8; step++) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 156, y: 601 - step * 38 }] });
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => renderedFrame(page)).toBeGreaterThan(32);
    const readDistance = () => world(page).evaluate((element) => element.style.getPropertyValue('--world-scroll-distance'));
    const before = await readDistance();
    await page.setViewportSize({ width: 390, height: 805 });
    await expect.poll(() => world(page).evaluate((element) => element.style.getPropertyValue('--world-viewport-height'))).toBe('805px');
    expect(await readDistance()).toBe(before);
    await page.setViewportSize({ width: 805, height: 390 });
    await expect.poll(() => world(page).locator('canvas').evaluate(({ width }) => width)).toBe(1920);
    await expect.poll(() => renderedFrame(page)).toBeGreaterThan(32);
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await expect(activeCopy(page)).toContainText('Contact me.', { timeout: 10_000 });
    await expect.poll(() => renderedFrame(page)).toBe(821);
  } finally {
    await context.close();
  }
});

test('the flight does not stop on the foreground beam', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect.poll(() => renderedFrame(page)).toBe(0);
  await world(page).evaluate((element, progress) => {
    const distance = parseFloat(element.style.getPropertyValue('--world-scroll-distance'));
    window.scrollTo(0, Math.round(distance * progress));
  }, pacing[345] / pacing.at(-1));
  await expect.poll(() => renderedFrame(page)).toBe(348);
});

test('the homepage stops link to their projects without reference badges', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(world(page).locator('canvas, video')).toHaveCount(0);
  await expect(world(page).locator('details')).toHaveCount(0);
  await chapter(page, 'Econ.mom').click();
  await expect(activeCopy(page).getByRole('link', { name: 'Take me there' })).toHaveAttribute('href', '/economics#econ-mom');
  await chapter(page, 'Local Ledger').click();
  await expect(activeCopy(page).getByRole('link', { name: 'Take me there' })).toHaveAttribute('href', '/economics#local-ledger');
  await chapter(page, 'Roblox games').click();
  await expect(activeCopy(page).getByRole('link', { name: 'Take me there' })).toHaveAttribute('href', '/roblox');
  await chapter(page, 'Miscellaneous projects').click();
  await expect(activeCopy(page)).toContainText('The other things I build.');
  const origin = await page.evaluate(() => scrollY);
  await activeCopy(page).getByRole('link', { name: 'Take me there' }).click();
  await expect(page).toHaveURL(/\/misc$/);
  await page.getByRole('link', { name: 'Take me back' }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(origin);
  await expect(activeCopy(page)).toContainText('The other things I build.');
});

test('one glass navigation fits every page at 320px and shows its active tab', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 660 });
  for (const [path, label] of [['/', 'Home'], ['/quant', 'Trading Systems'], ['/economics', 'Economics'], ['/att-agency', 'ATT Agency'], ['/roblox', 'Roblox'], ['/misc', 'Misc']]) {
    await page.goto(path);
    const nav = page.getByRole('navigation', { name: 'Portfolio pages' });
    await expect(nav).toHaveClass('glass-nav');
    await expect(nav.getByRole('link', { name: label, exact: true })).toHaveAttribute('aria-current', 'page');
    const tabs = await nav.getByRole('link').all();
    expect(tabs).toHaveLength(6);
    for (const tab of tabs) {
      const bounds = await tab.boundingBox();
      expect(bounds.width).toBeGreaterThanOrEqual(44);
      expect(bounds.height).toBeGreaterThanOrEqual(44);
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
    }
  }
});
