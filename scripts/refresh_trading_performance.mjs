import { execFileSync } from 'node:child_process';
import { readFile, rename, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { summarizePaper } from '../src/data/tradingFormat.js';
import { extendModelHistory, validPerformance } from '../src/data/tradingPerformance.js';

const source = new URL('../public/generated/trading-live.json', import.meta.url);
const localData = new URL('../src/data/trading-performance.json', import.meta.url);
const publicData = new URL('../public/generated/trading-performance.json', import.meta.url);
const navReader = fileURLToPath(new URL('./read_spy_nav.py', import.meta.url));
const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));

const [dashboard, previous] = await Promise.all([readJson(source), readJson(localData)]);
if (!validPerformance(previous)) throw new Error('Invalid stored trading performance archive');
const model = extendModelHistory(previous.model, dashboard.trades, summarizePaper(dashboard.systems));
let benchmark = previous.benchmark;

try {
  const start = new Date(Date.parse(model[0][0]) - 7 * 86_400_000).toISOString().slice(0, 10);
  const python = process.platform === 'win32' ? 'python' : 'python3';
  const incoming = JSON.parse(execFileSync(python, [navReader, start], { encoding: 'utf8', timeout: 30_000 }));
  if (incoming.at(-1)[0] < (benchmark.at(-1)?.[0] ?? '')) throw new Error('The SPY workbook is older than the last published close');
  if (!validPerformance({ model, benchmark: incoming })) throw new Error('Invalid SPY benchmark history');
  benchmark = incoming;
} catch (error) {
  console.warn(`SPY benchmark refresh: ${error.message}. Keeping the last published NAVs.`);
}

const changed = JSON.stringify([model, benchmark]) !== JSON.stringify([previous.model, previous.benchmark]);
const data = { generated_at: changed ? new Date().toISOString() : previous.generated_at, model, benchmark };
const contents = JSON.stringify(data) + '\n';
for (const file of [localData, publicData]) {
  const current = await readFile(file, 'utf8').catch((error) => { if (error.code !== 'ENOENT') throw error; });
  if (current === contents) continue;
  const temporary = new URL(file.href + '.tmp');
  await writeFile(temporary, contents, 'utf8');
  await rename(temporary, file);
}
console.log(`Trading performance: ${model.length} model observations; SPY NAV through ${benchmark.at(-1)?.[0] ?? 'unavailable'}.`);
