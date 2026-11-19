import { readFile } from 'node:fs/promises';
import { devices, expect, test } from 'playwright/test';
import { formatStamp, paperMetrics, signedMoney, summarizePaper, usdTotal } from '../src/data/tradingFormat.js';

const baseline = JSON.parse(await readFile(new URL('../src/data/trading-live.json', import.meta.url)));
const archived = JSON.parse(await readFile(new URL('../src/data/trading-performance.json', import.meta.url)));
const card = (page, name) => page.locator('#live .kpi').filter({ has: page.locator('.kpi-k', { hasText: name }) }).locator('.kpi-v');

test('the dashboard, visible fill log, and model receipts update together', async ({ page }) => {
  const latest = structuredClone(baseline);
  latest.generated_at = new Date(Date.parse(baseline.generated_at) + 60_000).toISOString();
  latest.totals = { ...latest.totals, total_trades: 999_999, generated_trades: 999_999, generated_profit_usd: 999_999 };
  const countersnipe = latest.systems.countersnipe.generated;
  countersnipe.total_trades++;
  countersnipe.wins++;
  countersnipe.profit_usd += 1.38;
  countersnipe.notional_usd += 100;
  countersnipe.return_pct_sum += 1.38;
  latest.trades.push({
    ...latest.trades[0],
    id: 'integration-fill',
    timestamp: latest.generated_at,
    instrument: 'Test fill after refresh',
    strategy: 'Snapshot test strategy',
    entry_price: 100,
    exit_price: 101.38,
    profit_loss_usd: 1.38,
    profit_loss_pct: 1.38,
  });
  let feed = baseline;
  let comparison = archived;
  let requests = 0;
  const nextClose = new Date(Date.parse(archived.benchmark.at(-1)[0]) + 86_400_000).toISOString().slice(0, 10);
  const navToStart = archived.benchmark.findLast(([day]) => day <= archived.model[0][0])[1];
  await page.clock.install();
  await page.route('**/generated/trading-live.json?*', async (route) => {
    requests++;
    await route.fulfill({ json: feed });
  });
  await page.route('**/generated/trading-performance.json?*', (route) => route.fulfill({ json: comparison }));
  await page.goto('/quant');
  await expect.poll(() => requests).toBe(1);
  await expect(page.getByRole('link', { name: 'View trading dashboard' })).toHaveAttribute('href', '#live');
  const activity = page.locator('#trade-activity');
  const rows = activity.locator('tbody tr');
  await expect(activity.getByRole('heading', { name: 'Filled trades' })).toBeVisible();
  await expect(rows).toHaveCount(12);
  await expect(rows.first()).toBeVisible();
  await expect(rows.first()).not.toContainText('Test fill after refresh');
  await activity.getByRole('button', { name: `Show all ${baseline.trades.length} recent fills` }).click();
  await expect(rows).toHaveCount(baseline.trades.length);
  await activity.getByRole('button', { name: 'Show latest 12' }).click();

  feed = latest;
  comparison = {
    ...archived,
    generated_at: new Date(Date.parse(archived.generated_at) + 60_000).toISOString(),
    benchmark: [...archived.benchmark, [nextClose, navToStart * 1.05]],
  };
  await page.clock.fastForward(60_000);
  await expect(rows.first()).toContainText('Test fill after refresh');
  await expect(rows.first()).toContainText('+$1.38');
  await expect(rows).toHaveCount(12);
  await expect(page.locator('#countersnipe .paper-metrics dd').first()).toHaveText(countersnipe.total_trades.toLocaleString('en-US'));
  const totals = summarizePaper(latest.systems);
  await expect(page.locator('#backtest .trade-log-head')).toContainText(`${totals.total_trades.toLocaleString('en-US')} fills`);
  for (const { k, v } of paperMetrics(totals)) await expect(card(page, k)).toHaveText(v);
  await expect(card(page, 'Notional traded')).toHaveText(usdTotal(totals.notional_usd));
  await expect(card(page, 'Latest strategy')).toHaveText('Snapshot test strategy');
  await expect(page.locator('[data-model-pnl]')).toHaveText(signedMoney(totals.profit_usd));
  await expect(page.locator('[data-benchmark-pnl]')).toHaveText('+$71.20');
  const slider = page.getByRole('slider', { name: 'Compare by date' });
  await slider.focus();
  await slider.press('Home');
  await expect(page.locator('.performance-selection')).toContainText('Combined bots $0.00');
  await expect(page.locator('.performance-selection')).toContainText('S&P 500 benchmark $0.00');
  await expect(page.locator('.dashboard-timestamps')).toContainText(formatStamp(latest.generated_at));
  await expect(page.locator('#live')).not.toContainText('999,999');

  feed = { ...latest, generated_at: new Date(Date.parse(latest.generated_at) + 60_000).toISOString() };
  feed.trades = [{ ...latest.trades.at(-1), entry_price: 'invalid' }];
  await page.clock.fastForward(60_000);
  await expect.poll(() => requests).toBe(3);
  await expect(rows.first()).toContainText('Test fill after refresh');
});

test('trade activity shows the instrument and P&L on a narrow phone', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ ...devices['iPhone 13'], viewport: { width: 320, height: 670 }, baseURL });
  try {
    const page = await context.newPage();
    await page.goto('/quant#trade-activity');
    const region = page.getByRole('region', { name: 'Recent model-generated fills' });
    const pnl = region.getByRole('columnheader', { name: 'P&L', exact: true });
    const scroll = await region.evaluate((element) => ({ view: element.clientWidth, content: element.scrollWidth }));
    expect(scroll.content).toBeGreaterThan(scroll.view);
    const [header, viewport] = await Promise.all([pnl.boundingBox(), region.boundingBox()]);
    expect(header.x + header.width).toBeLessThanOrEqual(viewport.x + viewport.width);
    await expect(region.locator('tbody tr').first().getByRole('rowheader')).toBeVisible();
  } finally {
    await context.close();
  }
});
