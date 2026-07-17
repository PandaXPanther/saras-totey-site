import { test, expect } from 'playwright/test';

test.describe.configure({ timeout: 120_000 });

const chapterPositions = [0, 0.2, 0.4, 0.6, 0.8, 1];

const routes = [
  { label: 'Home', path: '/', marker: '.scroll-world' },
  { label: 'Trading systems', path: '/quant', marker: '.project-page--quant' },
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
  await page.goto('http://127.0.0.1:4174/');
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

test('desktop camera chain visits every marker and restores marker state', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4174/');
  await page.waitForSelector('.scroll-world video');
  await page.waitForTimeout(2500);
  await page.locator('.audio-dock button').click();
  await expect.poll(() => page.evaluate(() => !window.__sarasAmbientAudio.paused)).toBeTruthy();
  const worldHeight = await page.locator('.scroll-world').evaluate((node) => node.offsetHeight - innerHeight);
  for (const [index, position] of chapterPositions.entries()) {
    await page.evaluate(([height, progress]) => scrollTo(0, height * progress), [worldHeight, position]);
    await expect(page.locator('.scroll-world')).toHaveAttribute('data-marker', String(index));
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
  for (const [reverseIndex, progress] of [...chapterPositions].reverse().entries()) {
    await page.evaluate(([height, position]) => scrollTo(0, height * position), [worldHeight, progress]);
    await expect(page.locator('.scroll-world')).toHaveAttribute('data-marker', String(chapterPositions.length - 1 - reverseIndex));
    await expect(page.locator('.scroll-world video')).toHaveCount(1);
  }
  await page.getByRole('button', { name: 'Go to Econ.mom' }).click();
  await expect(page.locator('.scroll-world')).toHaveAttribute('data-marker', '2');
  await page.locator('.world-copy.is-active .glass-button').click();
  await expect(page).not.toHaveURL(/home/);
  await expect.poll(() => page.evaluate(() => !window.__sarasAmbientAudio.paused)).toBeTruthy();
  await page.locator('.take-back').click();
  await expect(page).toHaveURL(/home/);
  await expect(page.locator('.scroll-world')).toHaveAttribute('data-marker', '2');

  await page.getByRole('button', { name: 'Go to Local Ledger' }).click();
  await expect(page.locator('.scroll-world')).toHaveAttribute('data-marker', '3');
  await page.locator('.world-copy.is-active .glass-button').click();
  await expect(page).not.toHaveURL(/home/);
  await page.goBack();
  await expect(page).toHaveURL(/home/);
  await expect(page.locator('.scroll-world')).toHaveAttribute('data-marker', '3');
});

test('mobile world and project pages render cleanly', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://127.0.0.1:4174/');
  const worldHeight = await page.locator('.scroll-world').evaluate((node) => node.offsetHeight - innerHeight);
  for (const [index, position] of chapterPositions.entries()) {
    await page.evaluate(([height, progress]) => scrollTo(0, height * progress), [worldHeight, position]);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `.scroll-world-work/mobile-${index + 1}.png` });
  }
  for (const slug of ['quant', 'econ-mom', 'local-ledger', 'att-agency']) {
    await page.goto(`http://127.0.0.1:4174/${slug}`);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `.scroll-world-work/mobile-page-${slug}.png`, fullPage: true });
  }
});

test('desktop project pages render', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const slug of ['quant', 'econ-mom', 'local-ledger', 'att-agency']) {
    await page.goto(`http://127.0.0.1:4174/${slug}`);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `.scroll-world-work/desktop-page-${slug}.png`, fullPage: true });
  }
});
