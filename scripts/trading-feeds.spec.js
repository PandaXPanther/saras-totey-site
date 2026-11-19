import { readFile } from 'node:fs/promises';
import { expect, test } from 'playwright/test';

test('a new feed updates the system cards, aggregate cards, and individual receipts together', async ({ page }) => {
  const baseline = JSON.parse(await readFile(new URL('../src/data/trading-live.json', import.meta.url)));
  const latest = structuredClone(baseline);
  latest.generated_at = new Date(Date.parse(baseline.generated_at) + 60_000).toISOString();
  latest.totals.generated_trades++;
  latest.totals.generated_profit_usd += 1.38;
  latest.systems.countersnipe.generated.total_trades++;
  latest.systems.countersnipe.generated.wins++;
  latest.systems.countersnipe.generated.profit_usd += 1.38;
  latest.trades.unshift({ ...latest.trades[0], id: 'integration-fill', instrument: 'Test fill after refresh', profit_loss_usd: 1.38 });
  latest.cards.find(({ k }) => k === 'Total trades').v = String(latest.totals.total_trades + 1);
  let feed = baseline;
  let requests = 0;
  await page.clock.install();
  await page.route('**/generated/trading-live.json?*', async (route) => {
    requests++;
    await route.fulfill({ json: feed });
  });
  await page.goto('/quant');
  await expect.poll(() => requests).toBe(1);
  await expect(page.locator('#countersnipe .paper-metrics dd').first()).toHaveText(String(baseline.systems.countersnipe.generated.total_trades));
  await page.locator('.paper-fills summary').click();
  await expect(page.locator('.paper-fills tbody tr').first()).not.toContainText('Test fill after refresh');

  feed = latest;
  await page.clock.fastForward(60_000);
  await expect(page.locator('#countersnipe .paper-metrics dd').first()).toHaveText(String(latest.systems.countersnipe.generated.total_trades));
  await expect(page.locator('#backtest .trade-log-head')).toContainText(`${latest.totals.generated_trades} fills`);
  await expect(page.locator('.paper-fills tbody tr').first()).toContainText('Test fill after refresh');
  await expect(page.locator('#live .kpi').filter({ hasText: 'Baseline records + simulated fills' })).toContainText(String(latest.totals.total_trades + 1));

  feed = { generated_at: new Date(Date.parse(latest.generated_at) + 60_000).toISOString(), trades: [] };
  await page.clock.fastForward(60_000);
  await expect.poll(() => requests).toBe(3);
  await expect(page.locator('.paper-fills tbody tr').first()).toContainText('Test fill after refresh');
});
