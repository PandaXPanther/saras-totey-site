import { expect, test } from 'playwright/test';

const stats = 'https://api.chess.com/pub/player/skibidisarz/stats';

test('Misc only lists the selected projects and refreshes the public chess ratings', async ({ page }) => {
  let requests = 0;
  await page.clock.install();
  await page.route(stats, (route) => {
    requests++;
    return route.fulfill({
      json: { chess_blitz: { last: { rating: requests === 1 ? 1717 : 1722 } }, chess_bullet: { last: { rating: 1873 } } },
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  });
  await page.goto('/misc');
  const main = page.getByRole('main');
  await expect(main.getByRole('heading', { name: 'Kodama', exact: true })).toBeVisible();
  await expect(main.getByRole('heading', { name: 'Extemp National Points Race', exact: true })).toBeVisible();
  await expect(main.getByRole('article')).toHaveCount(2);
  const chess = page.getByRole('region', { name: 'Chess ratings' });
  await expect(chess).toContainText('1,717');
  await expect(chess).toContainText('1,873');
  await expect(chess).not.toContainText('Rapid');
  await expect(chess.getByRole('link', { name: 'View my games' })).toHaveAttribute('href', 'https://www.chess.com/member/skibidisarz');
  await page.clock.fastForward(61_000);
  await expect(chess).toContainText('1,722');
  expect(requests).toBe(2);
});

test('the Chess.com profile remains usable if the ratings feed is unavailable', async ({ page }) => {
  await page.route(stats, (route) => route.abort());
  await page.goto('/misc');
  const chess = page.getByRole('region', { name: 'Chess ratings' });
  await expect(chess).toContainText('Ratings are temporarily unavailable.');
  await expect(chess.getByRole('link', { name: 'View my games' })).toBeVisible();
});
