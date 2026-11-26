import { expect, test } from 'playwright/test';
import { Chess } from 'chess.js';
import * as scenes from '../src/components/pageScenes.js';

const routes = [
  ['/economics', 'economics'],
  ['/work-with-me', 'studio'],
  ['/roblox', 'voxel'],
  ['/misc', 'games'],
  ['/other-projects', 'anime'],
];

const picture = (canvas) => canvas.evaluate((element) => element.toDataURL());
const paintedPixels = (canvas) => canvas.evaluate((element) => {
  const ctx = element.getContext('2d');
  return ctx.getImageData(element.width * .6, element.height * .5, 1, 1).data[3];
});

test('the Bots replay follows the Alien Gambit sacrifice to queen mate', () => {
  expect(scenes.alienGambit).toBeDefined();
  const game = new Chess();
  game.loadPgn('1. e4 c6 2. d4 d5 3. Nd2 dxe4 4. Nxe4 Nf6 5. Ng5 h6');
  expect(scenes.alienGambit.fen).toBe(game.fen());

  const moves = scenes.alienGambit.moves.map(([from, to]) => game.move({ from, to }).san);
  expect(moves).toEqual(['Nxf7', 'Kxf7', 'Nf3', 'g6', 'Bc4+', 'Kg7', 'Ne5', 'e6', 'Qd3', 'Nbd7', 'Qxg6#']);
  expect(game.isCheckmate()).toBe(true);
});

test('the ATT Agency preview uses the homepage crop for its screen size', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/work-with-me');
  const preview = page.getByRole('img', { name: 'ATT Agency homepage with white and purple typography' });
  const previewPath = () => preview.evaluate(image => image.currentSrc && new URL(image.currentSrc).pathname);
  await expect.poll(previewPath).toBe('/projects/att-agency-home.png');

  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(previewPath).toBe('/projects/att-agency-mobile.png');
  await expect.poll(() => preview.evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
});

for (const [route, scene] of routes) {
  test(`${route} keeps animating its background without capturing clicks`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 860 });
    await page.clock.install();
    await page.goto(route);
    const canvas = page.locator(`canvas[data-scene="${scene}"]`);
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute('aria-hidden', 'true');
    await expect(canvas).toHaveCSS('pointer-events', 'none');
    await expect(page.getByRole('button', { name: 'Pause background animation' })).toHaveCount(0);
    await expect.poll(() => paintedPixels(canvas)).toBeGreaterThan(0);
    const first = await picture(canvas);
    await expect.poll(async () => (await picture(canvas)) !== first).toBe(true);

    await page.clock.fastForward(5400);
    const afterFirstCycle = await picture(canvas);
    await expect.poll(async () => (await picture(canvas)) !== afterFirstCycle).toBe(true);
  });
}

test('reduced motion still displays the background artwork', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/work-with-me');
  const canvas = page.locator('canvas[data-scene="studio"]');
  await expect.poll(() => paintedPixels(canvas)).toBeGreaterThan(0);
  const staticImage = await picture(canvas);
  await page.waitForTimeout(250);
  expect(await picture(canvas)).toBe(staticImage);
});

test('Other Projects shows the About me scores and selected honors', async ({ page }) => {
  await page.goto('/other-projects');
  const about = page.getByRole('region', { name: 'About me' });
  await expect(about).toContainText('1590');
  await expect(about).toContainText('4.62');
  await expect(about).toContainText('USAEBO Round 2 Gold');
  await expect(about).toContainText('Academic All-American');
  await expect(page.getByRole('heading', { name: 'Kodama' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Extemp National Points Race' })).toBeVisible();
});

test('the background pauses offscreen and resumes when its heading returns', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto('/work-with-me');
  const canvas = page.locator('canvas[data-scene="studio"]');
  await expect.poll(() => paintedPixels(canvas)).toBeGreaterThan(0);
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await expect.poll(() => canvas.evaluate(element => element.getBoundingClientRect().bottom)).toBeLessThan(0);
  await page.waitForTimeout(100);
  const offscreen = await picture(canvas);
  await page.waitForTimeout(180);
  expect(await picture(canvas)).toBe(offscreen);

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect.poll(async () => (await picture(canvas)) !== offscreen).toBe(true);
});
