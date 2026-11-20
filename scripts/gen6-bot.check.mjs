import assert from 'node:assert/strict';
import { BattleStreams, Teams } from '@pkmn/sim';
import { TeamGenerators } from '@pkmn/randoms';
import { createBotTeam, Gen6BattleBot, lookupGen6Move } from '../src/components/gen6BattleBot.js';

Teams.setGeneratorFactory(TeamGenerators);

const streams = BattleStreams.getPlayerStreams(new BattleStreams.BattleStream());
const bot = new Gen6BattleBot(streams.p2, { mega: 1, seed: [9472, 3201, 1023, 1] });
const botRun = bot.start();
const espeon = {
  species: 'Espeon', ability: 'Magic Bounce', item: 'Life Orb', level: 84, nature: 'Timid',
  moves: ['Calm Mind', 'Psyshock', 'Dazzling Gleam', 'Shadow Ball'],
  evs: { spa: 252, spe: 252, def: 4 },
};
const shuckle = createBotTeam([814, 5354, 7433, 1])[0];
const log = [];
let turn = 0;

await streams.omniscient.write([
  '>start {"formatid":"gen6randombattle","seed":[1352,7415,1614,1]}',
  `>player p1 ${JSON.stringify({ name: 'You', team: Teams.pack([espeon]) })}`,
  `>player p2 ${JSON.stringify({ name: 'Totally Real Saras', team: Teams.pack([shuckle]) })}`,
].join('\n'));
for await (const chunk of streams.p1) {
  for (const line of chunk.split('\n')) {
    if (line.startsWith('|turn|')) turn = Number(line.split('|')[2]);
    if (line.startsWith('|request|')) {
      const request = JSON.parse(line.slice('|request|'.length));
      if (request.active) await streams.p1.write(turn <= 4 ? 'move 1' : 'move 2');
    } else {
      log.push(line);
    }
  }
}
await botRun;
assert.equal(log.filter((line) => line.includes('[from] ability: Magic Bounce')).length, 1);
assert.ok(log.some((line) => line.startsWith("|move|p2a: Saras' Shuckle|Knock Off|")));
assert.equal(bot.revealedAbilities.get('p1a: Espeon'), 'magicbounce');
assert.equal(bot.revealedMoves.get('p1a: Espeon').has('stickyweb'), false);

const responses = [];
const returning = new Gen6BattleBot({ write: (choice) => responses.push(choice) });
returning.receiveLine('|switch|p1a: Espeon|Espeon, L84|100/100');
returning.receiveLine("|move|p1a: Espeon|Sticky Web|p2a: Saras' Shuckle|[from] ability: Magic Bounce");
returning.receiveLine('|switch|p1a: Altaria|Altaria, L85|100/100');
returning.receiveLine('|switch|p1a: Espeon|Espeon, L84|100/100');
returning.receiveRequest({
  side: { pokemon: [{
    ident: 'p2: Cresselia', details: 'Cresselia, L84', active: true, condition: '250/250',
    stats: { atk: 122, def: 222, spa: 164, spd: 231, spe: 165 },
    baseAbility: 'levitate', moves: ['toxic', 'icebeam'],
  }] },
  active: [{ trapped: true, moves: [
    { move: 'Toxic', id: 'toxic', target: 'normal' },
    { move: 'Ice Beam', id: 'icebeam', target: 'normal' },
  ] }],
});
assert.deepEqual(responses, ['move 2']);
console.log('Magic Bounce verified against Shuckle’s lead hazards and Cresselia’s Toxic after Espeon switches back in.');


async function playIntoArceus(item) {
  const replay = BattleStreams.getPlayerStreams(new BattleStreams.BattleStream());
  const opponent = new Gen6BattleBot(replay.p2, { seed: [9472, 3201, 1023, 1] });
  const opponentRun = opponent.start();
  const team = [
    { species: 'Dedenne', level: 84, ability: 'Cheek Pouch', item: 'Sitrus Berry', moves: ['Thunderbolt'] },
    { species: 'Arceus-Flying', level: 76, ability: 'Multitype', item: 'Sky Plate', moves: ['Judgment'] },
  ];
  const opposition = [
    { species: 'Tyrantrum', level: 82, ability: 'Rock Head', item, moves: ['Earthquake', 'Stone Edge', 'Dragon Claw', 'Crunch'] },
    { species: 'Jolteon', level: 82, ability: 'Volt Absorb', moves: ['Thunderbolt'] },
  ];
  await replay.omniscient.write([
    '>start {"formatid":"gen6randombattle","seed":[1352,7415,1614,1]}',
    `>player p1 ${JSON.stringify({ name: 'You', team: Teams.pack(team) })}`,
    `>player p2 ${JSON.stringify({ name: 'Totally Real Saras', team: Teams.pack(opposition) })}`,
  ].join('\n'));

  const transcript = [];
  let choices = 0;
  for await (const chunk of replay.p1) {
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('|request|')) {
        transcript.push(line);
        continue;
      }
      const request = JSON.parse(line.slice('|request|'.length));
      if (!request.active) continue;
      choices += 1;
      if (choices === 1) await replay.p1.write('switch 2');
      if (choices === 2) await replay.p1.write('move 1');
      if (choices === 3) await replay.omniscient.write('>forcewin p1');
    }
  }
  await opponentRun;
  assert.equal(transcript.filter((line) => line.startsWith('|move|p2a: Tyrantrum|Earthquake|')).length, 1);
  assert.equal(transcript.filter((line) => line === '|-immune|p1a: Arceus').length, 1);
  return transcript.slice(transcript.indexOf('|turn|2') + 1);
}

const lockedTurn = await playIntoArceus('Choice Scarf');
assert.ok(lockedTurn.some((line) => line.startsWith('|switch|p2a: Jolteon|')));
const unlockedTurn = await playIntoArceus('Life Orb');
assert.ok(unlockedTurn.some((line) => line.startsWith('|move|p2a: Tyrantrum|Stone Edge|')));
assert.equal(lookupGen6Move('return102').basePower, 102);
assert.equal(lookupGen6Move('Frustration 102').name, 'Frustration');
assert.equal(lookupGen6Move('hiddenpowerice60').type, 'Ice');
console.log('Tyrantrum verified against Arceus-Flying with and without a Choice lock.');
