import { readFile, rename, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { creators, knownCommunityIds } from '../src/data/robloxCreators.js';

const catalogPath = new URL('../src/data/roblox-games.json', import.meta.url);
const temporaryPath = new URL('../src/data/roblox-games.json.tmp', import.meta.url);
const ownerIds = new Set(creators.map(({ id }) => id));

async function robloxJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Roblox returned ${response.status} for ${url}`);
  return response.json();
}

function rowsOf(response) {
  if (!Array.isArray(response.data)) throw new Error('Roblox response is missing its data array');
  return response.data;
}

async function collectPages(endpoint, parameters, request) {
  const seen = new Set();
  const rows = [];
  let cursor;
  do {
    const url = new URL(endpoint);
    url.search = new URLSearchParams(parameters);
    if (cursor) url.searchParams.set('cursor', cursor);
    const page = await request(url);
    rows.push(...rowsOf(page));
    cursor = page.nextPageCursor;
    if (cursor && seen.has(cursor)) throw new Error(`Roblox repeated a pagination cursor for ${endpoint}`);
    seen.add(cursor);
  } while (cursor);
  return rows;
}

async function ownedCommunities(request) {
  const memberships = await Promise.all(creators.map(({ id }) => (
    collectPages(`https://groups.roblox.com/v1/users/${id}/groups/roles`, {}, request)
  )));
  const groups = new Map(memberships.flat().map(({ group }) => [group.id, group]));
  await Promise.all(knownCommunityIds.filter((id) => !groups.has(id)).map(async (id) => {
    groups.set(id, await request(new URL(`https://groups.roblox.com/v1/groups/${id}`)));
  }));
  return [...groups.values()]
    .filter(({ owner }) => ownerIds.has(owner?.userId))
    .map(({ id, name }) => ({ id, name }))
    .sort((a, b) => a.id - b.id);
}

function description(text) {
  const paragraph = text?.trim().split(/\r?\n/, 1)[0] || '';
  return paragraph.length > 220 ? `${paragraph.slice(0, 220).replace(/\s+\S*$/, '')}…` : paragraph;
}

function robloxImage(url) {
  return typeof url === 'string' && /^https:\/\/[^/]+\.rbxcdn\.com\//i.test(url);
}

export async function fetchRobloxCatalog(previous = { games: [] }, request = robloxJson) {
  const communities = await ownedCommunities(request);
  const sources = [
    ...creators.map(({ id, handle }) => ({ name: handle, path: `users/${id}/games` })),
    ...communities.map(({ id, name }) => ({ name, path: `groups/${id}/gamesV2` })),
  ];
  const games = new Map();
  for (let i = 0; i < sources.length; i += 6) {
    const catalogs = await Promise.all(sources.slice(i, i + 6).map(async ({ name, path }) => {
      const entries = await collectPages(`https://games.roblox.com/v2/${path}`, { accessFilter: 'Public', limit: 50 }, request);
      return entries.map((game) => ({
        id: game.id, placeId: game.rootPlace?.id, title: game.name, creator: name,
        description: description(game.description), visits: game.placeVisits,
        updated: game.updated,
      }));
    }));
    for (const game of catalogs.flat()) {
      if (!Number.isSafeInteger(game.id) || !Number.isSafeInteger(game.placeId)
        || typeof game.title !== 'string' || !Number.isFinite(Date.parse(game.updated))) {
        throw new Error('Roblox returned a malformed experience');
      }
      games.set(game.id, game);
    }
  }

  const gameIds = [...games.keys()];
  const previousImages = new Map(previous.games.map(({ id, image }) => [id, image]));
  for (let i = 0; i < gameIds.length; i += 20) {
    const ids = gameIds.slice(i, i + 20);
    const url = new URL('https://thumbnails.roblox.com/v1/games/multiget/thumbnails');
    url.search = new URLSearchParams({
      universeIds: ids.join(','), countPerUniverse: 1, defaults: true,
      size: '768x432', format: 'Webp', isCircular: false,
    });
    let thumbnails = [];
    try {
      thumbnails = rowsOf(await request(url));
    } catch {
      console.warn('Roblox thumbnails unavailable. Keeping previously fetched images.');
    }
    const images = new Map(thumbnails.map(({ universeId, thumbnails: results }) => [
      universeId, results?.find(({ state, imageUrl }) => state === 'Completed' && robloxImage(imageUrl))?.imageUrl,
    ]));
    for (const id of ids) games.get(id).image = images.get(id) || previousImages.get(id) || null;
  }
  return { communities, games: [...games.values()].sort((a, b) => Date.parse(b.updated) - Date.parse(a.updated) || a.id - b.id) };
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const previous = await readFile(catalogPath, 'utf8')
    .then(JSON.parse, (error) => { if (error.code !== 'ENOENT') throw error; });
  const catalog = await fetchRobloxCatalog(previous);
  const next = JSON.stringify(catalog, null, 2) + '\n';
  if (next !== JSON.stringify(previous, null, 2) + '\n') {
    await writeFile(temporaryPath, next);
    await rename(temporaryPath, catalogPath);
  }
  console.log(`Roblox catalog: ${catalog.games.length} public experiences from 2 creators and ${catalog.communities.length} owned communities.`);
}
