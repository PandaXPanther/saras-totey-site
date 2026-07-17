import { test, expect } from 'playwright/test';

const chapterPositions = [0.02, 0.19, 0.37, 0.55, 0.73, 0.96];

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
      visible: [...document.querySelectorAll('.scroll-world__scene')].filter((node) => Number(getComputedStyle(node).opacity) > 0.5).length,
    }));
    expect(state.chapter).toBeTruthy();
    expect(state.visible).toBe(1);
  }
  for (const progress of [...chapterPositions].reverse()) {
    await page.evaluate(([height, position]) => scrollTo(0, height * position), [worldHeight, progress]);
    await page.waitForTimeout(160);
    await expect.poll(() => page.locator('.scroll-world__scene').evaluateAll((nodes) => nodes.filter((node) => Number(getComputedStyle(node).opacity) > 0.5).length)).toBe(1);
  }
  await page.evaluate(([height, position]) => scrollTo(0, height * position), [worldHeight, chapterPositions[2]]);
  await page.locator('.world-copy.is-active .glass-button').click();
  await expect(page).toHaveURL(/econ-mom/);
  await expect.poll(() => page.evaluate(() => !window.__sarasAmbientAudio.paused)).toBeTruthy();
  await page.locator('a[href="/home"]').last().click();
  await expect(page).toHaveURL(/home/);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(1000);
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
