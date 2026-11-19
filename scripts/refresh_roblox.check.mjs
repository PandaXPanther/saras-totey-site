import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchRobloxCatalog } from './refresh_roblox.mjs';
import { creators, knownCommunityIds } from '../src/data/robloxCreators.js';

const cover = 'https://tr.rbxcdn.com/cover/768/432/Image/Webp/noFilter';
const completed = { state: 'Completed', imageUrl: cover };

test('a public game enters the catalog when Roblox publishes its cover', async () => {
  let uploaded = false;
  async function request(url) {
    if (url.hostname === 'groups.roblox.com') {
      const owned = knownCommunityIds.map((id) => ({ group: { id, name: String(id), owner: { userId: creators[0].id } } }));
      return { data: owned };
    }
    if (url.hostname === 'games.roblox.com') {
      return {
        data: url.pathname === `/v2/users/${creators[0].id}/games`
          ? [1, 2, 3, 4].map((id) => ({
            id, rootPlace: { id: id + 10 }, name: `Game ${id}`, updated: '2026-08-01T00:00:00Z',
          }))
          : [],
      };
    }
    assert.equal(url.hostname, 'thumbnails.roblox.com');
    assert.equal(url.searchParams.get('defaults'), 'false');
    return { data: [
      { universeId: 1, thumbnails: [{ state: 'Pending', imageUrl: null }, completed] },
      { universeId: 2, thumbnails: uploaded ? [completed] : null },
      { universeId: 3, thumbnails: [{ state: 'Pending', imageUrl: cover }] },
      { universeId: 4, thumbnails: [{ state: 'Completed', imageUrl: 'https://example.com/not-a-cover' }] },
    ] };
  }

  assert.deepEqual((await fetchRobloxCatalog(request)).games.map(({ id, image }) => [id, image]), [[1, cover]]);
  uploaded = true;
  assert.deepEqual((await fetchRobloxCatalog(request)).games.map(({ id, image }) => [id, image]), [[1, cover], [2, cover]]);
});
