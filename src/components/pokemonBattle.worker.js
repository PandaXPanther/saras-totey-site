import { BattleStreams, Teams } from '@pkmn/sim';
import { TeamGenerators } from '@pkmn/randoms';
import { createBotTeam, Gen6BattleBot, gen6 } from './gen6BattleBot.js';

Teams.setGeneratorFactory(TeamGenerators);

const streams = BattleStreams.getPlayerStreams(new BattleStreams.BattleStream());
const bot = new Gen6BattleBot(streams.p2, { mega: 1 });

function reportFailure(error) {
  console.error(error);
  self.postMessage({ type: 'failure' });
}

async function writeBattle(stream, command) {
  try {
    await stream.write(command);
  } catch (error) {
    reportFailure(error);
  }
}

async function readBattle() {
  for await (const chunk of streams.p1) {
    const commands = [];
    for (const line of chunk.split('\n')) {
      if (line.startsWith('|request|')) {
        const request = JSON.parse(line.slice('|request|'.length));
        for (const pokemon of request.side?.pokemon || []) {
          const item = gen6.items.get(pokemon.item);
          const ability = gen6.abilities.get(pokemon.ability || pokemon.baseAbility);
          pokemon.itemName = item.name;
          pokemon.itemDescription = item.desc || item.shortDesc;
          pokemon.abilityName = ability.name;
          pokemon.abilityDescription = ability.desc || ability.shortDesc;
        }
        for (const active of request.active || []) {
          for (const option of active.moves) {
            const move = gen6.moves.get(option.id);
            const generic = move.id.startsWith('hiddenpower') ? gen6.moves.get('hiddenpower') : move;
            option.description = move.desc || generic.desc || move.shortDesc || generic.shortDesc || 'No additional effect.';
            option.meta = [move.type, move.category, move.basePower ? `${move.basePower} power` : '',
              typeof move.accuracy === 'number' ? `${move.accuracy}% accuracy` : ''].filter(Boolean).join(' · ');
          }
        }
        self.postMessage({ type: 'request', request });
      } else if (line.startsWith('|error|')) {
        self.postMessage({ type: 'invalid-choice', message: line.slice('|error|'.length) });
      } else {
        commands.push(line);
      }
    }
    if (commands.length) self.postMessage({ type: 'commands', commands });
  }
}

self.addEventListener('message', ({ data }) => {
  if (/^(move [1-4]( mega)?|switch [1-6]|team [1-6])$/.test(data.choice)) {
    void writeBattle(streams.p1, data.choice);
  }
});

void bot.start().catch(reportFailure);
void readBattle().catch(reportFailure);
void writeBattle(streams.omniscient, [
  '>start {"formatid":"gen6randombattle"}',
  '>player p1 {"name":"You"}',
  `>player p2 ${JSON.stringify({ name: 'Totally Real Saras', team: Teams.pack(createBotTeam()) })}`,
].join('\n'));
