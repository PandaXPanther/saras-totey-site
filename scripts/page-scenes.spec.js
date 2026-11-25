import { expect, test } from 'playwright/test';

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
  test(`${route} paints its own background without capturing clicks`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 860 });
    await page.goto(route);
    const canvas = page.locator(`canvas[data-scene="${scene}"]`);
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute('aria-hidden', 'true');
    await expect(canvas).toHaveCSS('pointer-events', 'none');
    await expect.poll(() => paintedPixels(canvas)).toBeGreaterThan(0);
    const first = await picture(canvas);
    await expect.poll(() => picture(canvas)).not.toBe(first);
  });
}

test('background motion has no pause button and settles on its own', async ({ page }) => {
  await page.goto('/work-with-me');
  const canvas = page.locator('canvas[data-scene="studio"]');
  await expect.poll(() => paintedPixels(canvas)).toBeGreaterThan(0);
  await expect(page.getByRole('button', { name: 'Pause background animation' })).toHaveCount(0);
  await page.waitForTimeout(5200);
  const settled = await picture(canvas);
  await page.waitForTimeout(250);
  expect(await picture(canvas)).toBe(settled);
});

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

test('the background stops drawing when its heading scrolls offscreen', async ({ page }) => {
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
});
