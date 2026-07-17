import { test, expect } from 'playwright/test';

test.describe.configure({ timeout: 120_000 });

const chapterPositions = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1];

const routes = [
  { label: 'Home', path: '/home', marker: '.scroll-world' },
  { label: 'Trading systems', path: '/', marker: '.project-page--quant' },
  { label: 'Econ.mom', path: '/econ-mom', marker: '.project-page--econ-mom' },
  { label: 'Local Ledger', path: '/local-ledger', marker: '.project-page--local-ledger' },
  { label: 'ATT Agency', path: '/att-agency', marker: '.project-page--att-agency' },
];

test('every header destination renders from every page', async ({ page }) => {
  const browserErrors = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  for (const source of routes) {
    for (const destination of routes) {
      browserErrors.length = 0;
      await page.goto(`http://127.0.0.1:4174${source.path}`);
      await expect(page.locator(source.marker)).toBeVisible();
      await page.getByRole('navigation', { name: 'Project pages' }).getByRole('link', { name: destination.label, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${destination.path === '/' ? '/$' : destination.path}$`));
      await expect(page.locator(destination.marker), `${source.path} -> ${destination.path}: ${browserErrors.join(' | ')}`).toBeVisible();
    }
  }
});

test('return link only exists on project entries created by a world CTA', async ({ browser }) => {
  for (const route of routes.filter(({ path }) => path !== '/home')) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:4174${route.path}`);
    await expect(page.locator('.take-back')).toHaveCount(0);
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4174/home');
  await page.getByRole('button', { name: 'Go to Trading systems' }).click();
  await expect(page.locator('.world-copy.is-active')).toContainText('Markets, then code');
  const expectedFrame = await page.evaluate(() => scrollY);
  await page.locator('.world-copy.is-active').getByRole('link', { name: /Take me there/ }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('.project-page--quant')).toBeVisible();
  await expect(page.locator('.take-back')).toBeVisible();
  await page.screenshot({ path: '.scroll-world-work/cta-quant-with-return.png' });
  await page.locator('.take-back').click();
  await expect(page).toHaveURL(/\/home$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(expectedFrame - 3);

  await page.getByRole('button', { name: 'Go to Trading systems' }).click();
  await page.locator('.world-copy.is-active').getByRole('link', { name: /Take me there/ }).click();
  await page.goBack();
  await expect(page).toHaveURL(/\/home$/);
  await expect(page.locator('.scroll-world')).toBeVisible();
  await context.close();
});

test('desktop camera chain scrubs every chapter and restores navigation state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4174/home');
  await page.waitForSelector('.scroll-world video');
  await page.waitForTimeout(2500);
  await page.locator('.audio-dock button').click();
  await expect.poll(() => page.evaluate(() => !window.__sarasAmbientAudio.paused)).toBeTruthy();
  const worldHeight = await page.locator('.scroll-world').evaluate((node) => node.offsetHeight - innerHeight);
  for (const [index, position] of chapterPositions.entries()) {
    await page.evaluate(([height, progress]) => scrollTo(0, height * progress), [worldHeight, position]);
    await page.waitForTimeout(600);
    await page.screenshot({ path: `.scroll-world-work/desktop-${index + 1}.png` });
    const state = await page.evaluate(() => ({
      chapter: document.querySelector('.world-copy.is-active')?.textContent,
      videos: document.querySelectorAll('.scroll-world video').length,
      currentTime: document.querySelector('.scroll-world video')?.currentTime,
    }));
    expect(state.chapter).toBeTruthy();
    expect(state.videos).toBe(1);
    expect(state.currentTime).toBeGreaterThanOrEqual(0);
  }
  for (const progress of [...chapterPositions].reverse()) {
    await page.evaluate(([height, position]) => scrollTo(0, height * position), [worldHeight, progress]);
    await page.waitForTimeout(160);
    await expect(page.locator('.scroll-world video')).toHaveCount(1);
  }
  const midTransition = 0.4137;
  await page.evaluate(([height, position]) => scrollTo(0, height * position), [worldHeight, midTransition]);
  const expectedFrame = await page.evaluate(() => scrollY);
  await page.locator('.world-copy.is-active .glass-button').click();
  await expect(page).not.toHaveURL(/home/);
  await expect.poll(() => page.evaluate(() => !window.__sarasAmbientAudio.paused)).toBeTruthy();
  await page.locator('.take-back').click();
  await expect(page).toHaveURL(/home/);
  await expect.poll(() => page.evaluate(() => scrollY), { timeout: 3000 }).toBeGreaterThan(expectedFrame - 2);
  expect(Math.abs((await page.evaluate(() => scrollY)) - expectedFrame)).toBeLessThanOrEqual(2);

  await page.evaluate(([height, position]) => scrollTo(0, height * position), [worldHeight, midTransition + 0.0713]);
  const browserBackFrame = await page.evaluate(() => scrollY);
  await page.locator('.world-copy.is-active .glass-button').click();
  await expect(page).not.toHaveURL(/home/);
  await page.goBack();
  await expect(page).toHaveURL(/home/);
  await expect.poll(() => page.evaluate(() => scrollY), { timeout: 3000 }).toBeGreaterThan(browserBackFrame - 2);
  expect(Math.abs((await page.evaluate(() => scrollY)) - browserBackFrame)).toBeLessThanOrEqual(2);
});

test('mobile world and project pages render cleanly', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://127.0.0.1:4174/home');
  const worldHeight = await page.locator('.scroll-world').evaluate((node) => node.offsetHeight - innerHeight);
  for (const [index, position] of chapterPositions.entries()) {
    await page.evaluate(([height, progress]) => scrollTo(0, height * progress), [worldHeight, position]);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `.scroll-world-work/mobile-${index + 1}.png` });
  }
  for (const slug of ['', 'econ-mom', 'local-ledger', 'att-agency']) {
    await page.goto(`http://127.0.0.1:4174/${slug}`);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `.scroll-world-work/mobile-page-${slug || 'quant'}.png`, fullPage: true });
  }
});

test('desktop project pages render', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const slug of ['', 'econ-mom', 'local-ledger', 'att-agency']) {
    await page.goto(`http://127.0.0.1:4174/${slug}`);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `.scroll-world-work/desktop-page-${slug || 'quant'}.png`, fullPage: true });
  }
});
