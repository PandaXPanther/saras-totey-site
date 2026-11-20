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
  await page.getByRole('button', { name: 'Move analysis', exact: true }).click();
  await page.getByLabel('Move list').getByRole('button', { name: /^e4\b/ }).click();
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
  await expect(page.getByText(/You found the best move|The engine preferred/)).toBeVisible();
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

async function scriptedOpponent(page, replies, startingPly) {
  await page.route('**/chess-engine/stockfish-19-lite-single.js', (route) => route.fulfill({
    contentType: 'text/javascript',
    body: `
      const replies = ${JSON.stringify(replies)};
      let ply = 0;
      onmessage = ({ data }) => {
        if (data === 'uci') postMessage('uciok');
        if (data === 'isready') postMessage('readyok');
        if (data.startsWith('position ')) {
          const history = data.split(' moves ')[1];
          ply = history ? history.trim().split(' ').length : 0;
        }
        if (data.startsWith('go ')) {
          if (data.includes(' searchmoves ')) {
            postMessage('bestmove (none)');
            return;
          }
          const move = replies[(ply - ${startingPly}) / 2];
          postMessage('info depth 8 multipv 1 score cp 0 pv ' + move);
          postMessage('bestmove ' + move);
        }
      };
    `,
  }));
}

const square = (page, name) => page.getByRole('group', { name: 'Chessboard' })
  .getByRole('button', { name: new RegExp('^' + name + ' ') });

async function startUntimed(page, color) {
  await page.goto('/misc#chess');
  await page.getByLabel('Play as').selectOption(color);
  await page.getByLabel('Time control').selectOption('untimed');
  await page.getByRole('button', { name: 'Start chess game' }).click();
  await expect(page.getByText('Your move', { exact: true })).toBeVisible();
}

async function clickMove(page, from, to) {
  await square(page, from).click();
  await square(page, to).click();
  await expect(page.getByText('Your move', { exact: true })).toBeVisible();
}

async function moveCoordinates(page, from, to) {
  await page.getByRole('group', { name: 'Chessboard' }).scrollIntoViewIfNeeded();
  return Promise.all([from, to].map(async (name) => {
    const box = await square(page, name).boundingBox();
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }));
}

test('chess teaser uses gameplay copy and shows live ratings before the challenge', async ({ page }) => {
  await page.route('**/pub/player/skibidisarz/stats', (route) => route.fulfill({
    json: { chess_blitz: { last: { rating: 1717 } }, chess_bullet: { last: { rating: 1873 } } },
    headers: { 'Access-Control-Allow-Origin': '*' },
  }));
  await page.goto('/misc#chess');
  const chess = page.locator('#chess');
  await expect(chess.getByRole('region').first()).toHaveAccessibleName('Chess ratings');
  await expect(chess).toContainText('1,717');
  await expect(chess).toContainText('1,873');
  await expect(chess).toContainText('trained off my gameplay');
  await expect(chess).toContainText('Custom Saras engine');
  await expect(chess).not.toContainText(/\bshit\b|\d+ rated games/i);
});

test('mouse drag follows the pointer and castles kingside on the king destination', async ({ page }) => {
  await scriptedOpponent(page, ['e7e5', 'b8c6', 'g8f6'], 1);
  await startUntimed(page, 'w');
  await clickMove(page, 'e1', 'h1');
  await expect(square(page, 'e1')).toHaveAccessibleName('e1 white king');
  await expect(page.getByLabel('Move list').getByRole('button')).toHaveCount(0);

  const replyStarted = Date.now();
  await clickMove(page, 'e2', 'e4');
  expect(Date.now() - replyStarted).toBeGreaterThanOrEqual(850);
  await clickMove(page, 'g1', 'f3');
  await clickMove(page, 'f1', 'e2');

  const [origin, destination] = await moveCoordinates(page, 'e1', 'g1');
  await page.mouse.move(origin.x, origin.y);
  await page.mouse.down();
  await page.mouse.move(destination.x, destination.y, { steps: 6 });
  const dragged = page.locator('[data-dragged-piece]');
  await expect(dragged).toBeVisible();
  await expect(dragged.locator('.saras-chess__piece')).toHaveText('♚');
  const box = await dragged.boundingBox();
  expect(Math.abs(box.x + box.width / 2 - destination.x)).toBeLessThan(2);
  await page.mouse.up();
  await expect(dragged).toHaveCount(0);
  await expect(square(page, 'g1')).toHaveAccessibleName('g1 white king');
  await expect(square(page, 'f1')).toHaveAccessibleName('f1 white rook');
  await expect(page.getByLabel('Move list').getByRole('button', { name: 'O-O', exact: true })).toBeVisible();
});

test('touch drag onto the rook castles queenside with Black', async ({ browser, browserName }) => {
  test.skip(browserName !== 'chromium', 'Uses Chromium touch input to drive the real pointer gesture.');
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  try {
    const page = await context.newPage();
    await scriptedOpponent(page, ['d2d4', 'b1c3', 'c1f4', 'd1d2', 'e2e3'], 0);
    await startUntimed(page, 'b');
    await clickMove(page, 'd7', 'd5');
    await clickMove(page, 'b8', 'c6');
    await clickMove(page, 'c8', 'f5');
    await clickMove(page, 'd8', 'd7');

    const [origin, destination] = await moveCoordinates(page, 'e8', 'a8');
    const touch = await context.newCDPSession(page);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [origin] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [destination] });
    await expect(page.locator('[data-dragged-piece]')).toBeVisible();
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(square(page, 'c8')).toHaveAccessibleName('c8 black king');
    await expect(square(page, 'd8')).toHaveAccessibleName('d8 black rook');
    await expect(page.getByLabel('Move list').getByRole('button', { name: 'O-O-O', exact: true })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('castling stays unavailable when the king would cross an attacked square', async ({ page }) => {
  await scriptedOpponent(page, ['b7b6', 'e7e6', 'h7h6', 'c8a6'], 1);
  await startUntimed(page, 'w');
  await clickMove(page, 'g2', 'g3');
  await clickMove(page, 'f1', 'g2');
  await clickMove(page, 'e2', 'e4');
  await clickMove(page, 'g1', 'f3');

  await square(page, 'e1').click();
  await expect(square(page, 'g1').locator('.saras-chess__target')).toHaveCount(0);
  await square(page, 'h1').click();
  await expect(square(page, 'e1')).toHaveAccessibleName('e1 white king');
  await expect(square(page, 'h1')).toHaveAccessibleName('h1 white rook');
  await expect(page.getByLabel('Move list').getByRole('button')).toHaveCount(8);
});

test('checkmate, material and review all describe the actual position', async ({ page }) => {
  await scriptedOpponent(page, ['e7e5', 'b8c6', 'g8f6'], 1);
  await startUntimed(page, 'w');
  await expect(page.getByLabel(/material advantage/)).toHaveCount(0);
  await clickMove(page, 'e2', 'e4');
  await clickMove(page, 'f1', 'c4');
  await clickMove(page, 'd1', 'h5');
  await square(page, 'h5').click();
  await square(page, 'f7').click();

  await expect(page.getByRole('status').filter({ hasText: 'You won by checkmate' })).toBeVisible();
  await expect(square(page, 'e8')).toHaveAttribute('data-check', 'mate');
  await expect(square(page, 'e8')).toHaveAccessibleName('e8 black king, checkmated');
  await expect(page.getByLabel('White material advantage +1')).toHaveText('+1');
  await expect(page.getByLabel('Black material advantage +1')).toHaveCount(0);
  await expect(page.getByLabel('Move list').getByRole('button', { name: 'Qxf7#', exact: true })).toBeVisible();

  await page.unroute('**/chess-engine/stockfish-19-lite-single.js');
  await page.getByRole('button', { name: 'Review game' }).click();
  await expect(page.getByRole('button', { name: 'Summary', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Game position')).toHaveAttribute('max', '7');
  await expect(page.getByLabel('Position evaluation')).toHaveText('Mate');
  await page.getByRole('button', { name: 'Move analysis', exact: true }).click();
  await expect(page.getByRole('heading', { name: '4. Qxf7#' })).toBeVisible();
  await expect(page.getByText('This move ends the game by checkmate.')).toBeVisible();
  await page.getByRole('button', { name: 'Show best move' }).click();
  await expect(page.getByLabel(/material advantage/)).toHaveCount(0);
  await expect(page.locator('[data-suggested="destination"]')).toHaveCount(1);
  await page.getByRole('group', { name: 'Best line' }).getByRole('button', { name: 'Qxf7#', exact: true }).click();
  await expect(square(page, 'e8')).toHaveAttribute('data-check', 'mate');
  await expect(page.getByLabel('White material advantage +1')).toBeVisible();

  await page.getByRole('button', { name: 'Show played move' }).click();
  await page.getByRole('button', { name: 'Previous move' }).click();
  await expect(page.getByLabel(/material advantage/)).toHaveCount(0);
  await expect(square(page, 'e8')).not.toHaveAttribute('data-check', 'mate');
});
