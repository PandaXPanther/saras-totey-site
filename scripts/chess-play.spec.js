import { expect, test } from 'playwright/test';

test('play a real engine reply and review the result in place', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/misc#chess');
  await page.getByLabel('Time control').selectOption('untimed');
  await page.getByRole('button', { name: 'Start chess game' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Your move' })).toBeVisible();
  await expect(page.getByLabel('Game chat')).toContainText('glhf');
  await page.getByRole('button', { name: 'e2 white pawn', exact: true }).click();
  await page.getByRole('button', { name: 'e4 empty', exact: true }).click();
  await expect(page.getByRole('button', { name: 'e4 white pawn', exact: true })).toBeVisible();
  await expect(page.getByLabel('Move list').getByRole('button')).toHaveCount(2);
  await page.getByRole('textbox', { name: 'Chat message' }).fill('lmao');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByLabel('Game chat')).toContainText('aight bet');
  await page.getByRole('button', { name: 'Resign', exact: true }).click();
  await page.getByRole('button', { name: 'Confirm resignation' }).click();
  await expect(page.getByLabel('Game chat')).toContainText('gg');
  await page.getByRole('button', { name: 'Review game' }).click();
  await expect(page.getByRole('heading', { name: 'Game review' })).toBeVisible();
  await expect(page.getByText('Evaluation by move')).toBeVisible();
  await expect(page.getByRole('button', { name: /e4.*(Book|Best|Excellent|Good|Inaccuracy|Mistake|Miss|Blunder)/ })).toBeVisible();
  await page.getByRole('button', { name: 'Show best move' }).click();
  await expect(page.getByRole('button', { name: 'e2 white pawn', exact: true })).toBeVisible();
  await expect(page.locator('[data-suggested="destination"]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Replay this move' }).click();
  await page.getByRole('button', { name: 'e2 white pawn', exact: true }).click();
  await page.keyboard.press('ArrowUp');
  await expect(page.getByRole('button', { name: 'e3 empty', exact: true })).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'e4 white pawn', exact: true })).toBeVisible();
  await expect(page.getByText(/You found the best move|Stockfish preferred/)).toBeVisible();
  await page.getByRole('button', { name: 'First position' }).click();
  await expect(page.getByRole('button', { name: 'e2 white pawn', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/misc#chess$/);
  expect(errors).toEqual([]);
});

test('black side starts with a bot move and can be closed at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/misc#chess');
  await page.getByLabel('Play as').selectOption('b');
  await page.getByRole('button', { name: 'Start chess game' }).click();
  const board = page.getByRole('group', { name: 'Chessboard' });
  await expect(board).toBeVisible();
  await expect(board.getByRole('button').first()).toHaveAccessibleName('h1 white rook');
  await expect(page.getByLabel('Move list').getByRole('button')).toHaveCount(1);
  expect(await board.evaluate((element) => element.getBoundingClientRect().right)).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: 'Close game' }).click();
  await expect(page.getByRole('button', { name: 'Start chess game' })).toBeVisible();
});

test('an unavailable worker can be restarted and the blitz clock ends the new game', async ({ page }) => {
  const engine = '**/chess-engine/stockfish-19-lite-single.js';
  await page.route(engine, (route) => route.abort(), { times: 1 });
  await page.goto('/misc#chess');
  await page.getByRole('button', { name: 'Start chess game' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Engine unavailable' })).toBeVisible();
  await page.clock.install();
  await page.getByRole('button', { name: 'New game', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Your move' })).toBeVisible();
  await page.clock.fastForward(301000);
  await expect(page.getByRole('status').filter({ hasText: 'Totally Real Saras won · Time' })).toBeVisible();
  await expect(page.getByLabel('Game chat')).toContainText('gg');
});
