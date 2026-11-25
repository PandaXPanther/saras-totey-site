import { readFileSync } from 'node:fs';
import { devices, expect, test } from 'playwright/test';

const pacing = JSON.parse(readFileSync(new URL('../src/data/flight-pacing.json', import.meta.url)));
const chapterIds = ['intro', 'trading', 'economics', 'att', 'roblox', 'misc', 'other-projects', 'contact'];
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
  await page.mouse.wheel(0, 360);
  await expect.poll(() => renderedFrame(page)).toBeGreaterThanOrEqual(59);
  const frames = await page.evaluate(() => flightFrames);
  expect(new Set(frames.filter((frame) => frame > 0 && frame < 54)).size).toBeGreaterThanOrEqual(2);

  await chapter(page, 'Economics').click();
  await expect(activeCopy(page)).toHaveAttribute('data-chapter', 'economics', { timeout: 10_000 });
  await page.mouse.move(80, 100);
  await page.mouse.wheel(0, -8000);
  await expect.poll(() => renderedFrame(page), { timeout: 10_000 }).toBe(0);
});

test('a missing motion sheet cannot freeze the island or hold the chapter links', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route('**/world/flight/motion-v*/wide/*.webp', (route) => route.abort());
  await page.route('**/world/flight/stills-v4/wide/*.webp', (route) => route.abort());
  await page.goto('/');
  await expect(world(page)).toHaveAttribute('data-flight-quality', 'overview');
  await expect.poll(() => renderedFrame(page)).toBe(0);

  for (const [delta, minimum] of [[473, 48], [517, 100], [-720, 20]]) {
    await page.mouse.wheel(0, delta);
    if (delta > 0) await expect.poll(() => renderedFrame(page)).toBeGreaterThan(minimum);
    else await expect.poll(() => renderedFrame(page)).toBeLessThan(70);
  }
  await expect.poll(() => renderedFrame(page)).toBeGreaterThan(20);
  await chapter(page, 'Roblox games').click();
  await expect(activeCopy(page).getByRole('link', { name: 'Take me there' })).toHaveAttribute('href', '/roblox');
  await expect.poll(() => renderedFrame(page)).toBeGreaterThan(595);
  await chapter(page, 'Other Projects').click();
  await expect(activeCopy(page)).toHaveAttribute('data-chapter', 'other-projects');
  await expect.poll(() => renderedFrame(page)).toBeGreaterThan(720);
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
    await expect(world(page)).toHaveAttribute('data-flight-quality', 'detail', { timeout: 10_000 });
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
  }, (2 + (pacing[345] - pacing[290]) / (pacing[532] - pacing[290])) / chapterIds.length);
  await expect.poll(() => renderedFrame(page)).toBe(348);
});

test('eight chapters share the full scroll distance equally', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'World chapters' }).getByRole('button')).toHaveCount(chapterIds.length);
  for (const viewport of [{ width: 1753, height: 963 }, { width: 390, height: 650 }]) {
    await page.setViewportSize(viewport);
    await expect.poll(() => world(page).evaluate((element) =>
      parseFloat(element.style.getPropertyValue('--world-scroll-distance'))
    )).toBeCloseTo(viewport.height * 10.575, 1);
    for (const [index, id] of chapterIds.entries()) {
      for (const position of [index / chapterIds.length + .001, (index + 1) / chapterIds.length - .001]) {
        await world(page).evaluate((element, fraction) => {
          const distance = parseFloat(element.style.getPropertyValue('--world-scroll-distance'));
          window.scrollTo(0, Math.round(distance * fraction));
        }, position);
        await expect(activeCopy(page)).toHaveAttribute('data-chapter', id);
      }
    }
  }
});

test('the economics view settles on the full-size source still', async ({ page }) => {
  await page.setViewportSize({ width: 1753, height: 963 });
  await page.goto('/');
  await expect.poll(() => renderedFrame(page)).toBe(0);
  const frame = 363;
  const fetchStill = page.waitForResponse((response) =>
    response.url().endsWith('/world/flight/stills-v4/wide/121.webp'));
  await world(page).evaluate((element, progress) => {
    const distance = parseFloat(element.style.getPropertyValue('--world-scroll-distance'));
    window.scrollTo(0, Math.round(distance * progress));
  }, (2 + (pacing[frame] - pacing[290]) / (pacing[532] - pacing[290])) / chapterIds.length);
  const still = await fetchStill;
  expect(still.ok()).toBe(true);
  await expect(world(page)).toHaveAttribute('data-flight-quality', 'detail');
  await expect.poll(() => renderedFrame(page)).toBe(frame);
  await expect(activeCopy(page)).toHaveAttribute('data-chapter', 'economics');
  const canvasSize = await world(page).locator('canvas').evaluate(({ width, height }) => [width, height]);
  expect(canvasSize).toEqual([2560, 1440]);
});

test('the homepage stops link to their projects and return to the same scroll position', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(world(page).locator('canvas, video')).toHaveCount(0);
  await expect(world(page).locator('details')).toHaveCount(0);
  await chapter(page, 'Economics').click();
  await expect(activeCopy(page)).toContainText('Econ.mom');
  await expect(activeCopy(page)).toContainText('Local Ledger');
  const economicsOrigin = await page.evaluate(() => scrollY);
  await activeCopy(page).getByRole('link', { name: 'Explore economics' }).click();
  await expect(page).toHaveURL(/\/economics$/);
  await expect(page.locator('main #econ-mom')).toBeVisible();
  await expect(page.locator('main #local-ledger')).toBeVisible();
  await page.getByRole('link', { name: 'Take me back' }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(economicsOrigin);
  await expect(activeCopy(page)).toHaveAttribute('data-chapter', 'economics');
  await chapter(page, 'Roblox games').click();
  await expect(activeCopy(page).getByRole('link', { name: 'Take me there' })).toHaveAttribute('href', '/roblox');
  await chapter(page, 'Bots').click();
  await expect(activeCopy(page)).toContainText('Play against my bots.');
  await expect(activeCopy(page)).toContainText('Play chess or battle in Gen 6 Pokémon');
  await expect(activeCopy(page)).toContainText('Take on my heads-up poker bot in Texas Hold’em');
  const origin = await page.evaluate(() => scrollY);
  await activeCopy(page).getByRole('link', { name: 'See the bots' }).click();
  await expect(page).toHaveURL(/\/misc$/);
  const bots = page.getByRole('main');
  await expect(bots.getByRole('heading', { level: 1 })).toHaveText('Play against my bots.');
  await expect(bots.getByRole('heading', { level: 2 })).toHaveText([
    'Battle Me in Pokémon',
    'Chess ratings',
    'Play me in chess.',
    'Play me in poker.',
  ]);
  const jumps = bots.getByRole('navigation', { name: 'Jump to a bot' });
  for (const [name, target] of [['Pokémon', 'pokemon-battle'], ['chess', 'chess'], ['poker', 'poker']]) {
    await expect(jumps.getByRole('link', { name: `Jump to ${name}` })).toHaveAttribute('href', `#${target}`);
    await expect(bots.locator(`#${target}`)).toBeVisible();
  }
  await page.getByRole('link', { name: 'Take me back' }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(origin);
  await expect(activeCopy(page)).toContainText('Play against my bots.');

  await chapter(page, 'Other Projects').click();
  await expect(activeCopy(page)).toContainText('Kodama');
  await expect(activeCopy(page)).toContainText('Extemp National Points Race');
  await expect(world(page).locator('.scroll-world__scene img')).toHaveAttribute('src', '/world/flight/stills-v4/wide/243.webp');
  const projectsOrigin = await page.evaluate(() => scrollY);
  await activeCopy(page).getByRole('link', { name: 'Explore the projects' }).click();
  await expect(page).toHaveURL(/\/other-projects$/);
  const projects = page.getByRole('main');
  await expect(projects.getByRole('heading', { level: 1 })).toHaveText('Other Projects.');
  await expect(projects.getByRole('heading', { level: 2 })).toHaveText(['Kodama', 'Extemp National Points Race']);
  await expect(projects.getByRole('link', { name: 'Explore Kodama' })).toHaveAttribute('href', 'https://askkodama.com/');
  await expect(projects.getByRole('link', { name: 'View the standings' })).toHaveAttribute('href', 'https://national-points-race.pages.dev/');
  await page.getByRole('link', { name: 'Take me back' }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(projectsOrigin);
  await expect(activeCopy(page)).toHaveAttribute('data-chapter', 'other-projects');
  await chapter(page, 'Contact').click();
  await expect(activeCopy(page)).toContainText('Contact me.');
});

test('Work with me links visitors to each studio from the homepage', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await chapter(page, 'Work with me').click();
  await activeCopy(page).getByRole('link', { name: 'Work with me' }).click();
  await expect(page).toHaveURL(/\/work-with-me$/);
  const main = page.getByRole('main');
  await expect(main.getByRole('link', { name: 'Visit ATT Agency' })).toHaveAttribute('href', 'https://attagency.co/');
  await expect(main.getByRole('img', { name: 'ATT Agency homepage with white and purple typography' })).toBeVisible();
  await expect(main.getByRole('link', { name: 'Start an ATT project' })).toHaveAttribute('href', 'https://attagency.co/#contact');
  await expect(main.getByRole('link', { name: 'Start a Heavens project' })).toHaveAttribute('href', 'https://heavensinteractive.com/start');
  await main.getByRole('link', { name: 'Take me back' }).click();
  await expect(activeCopy(page)).toHaveAttribute('data-chapter', 'att');
});

test('existing ATT links and the Roblox commission link reach the hiring page', async ({ page }) => {
  await page.goto('/att-agency/');
  await expect(page).toHaveURL(/\/work-with-me$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://sarastotey.com/work-with-me');

  await page.goto('/roblox');
  await page.getByRole('link', { name: 'Commission a Roblox game' }).click();
  await expect(page).toHaveURL(/\/work-with-me#roblox$/);
  await expect(page.locator('#roblox').getByRole('link', { name: 'Start a Heavens project' })).toBeVisible();
});

test('one glass navigation fits every page at 320px and shows its active tab', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 660 });
  for (const [path, label] of [['/', 'Home'], ['/quant', 'Trading Systems'], ['/economics', 'Economics'], ['/work-with-me', 'Work with me'], ['/roblox', 'Roblox'], ['/misc', 'Bots'], ['/other-projects', 'Other Projects']]) {
    await page.goto(path);
    const nav = page.getByRole('navigation', { name: 'Portfolio pages' });
    await expect(nav).toHaveClass('glass-nav');
    await expect(nav.getByRole('link', { name: label, exact: true })).toHaveAttribute('aria-current', 'page');
    const tabs = await nav.getByRole('link').all();
    expect(tabs).toHaveLength(7);
    for (const tab of tabs) {
      const bounds = await tab.boundingBox();
      expect(bounds.width).toBeGreaterThanOrEqual(44);
      expect(bounds.height).toBeGreaterThanOrEqual(44);
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
    }
  }
  for (const width of [320, 375, 390]) {
    await page.setViewportSize({ width, height: 660 });
    const nav = await page.getByRole('navigation', { name: 'Portfolio pages' }).boundingBox();
    const heading = await page.getByRole('heading', { level: 1 }).boundingBox();
    expect(nav.y + nav.height).toBeLessThan(heading.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
});
