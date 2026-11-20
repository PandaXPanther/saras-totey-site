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
          pokemon.itemName = gen6.items.get(pokemon.item).name;
          pokemon.abilityName = gen6.abilities.get(pokemon.ability || pokemon.baseAbility).name;
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
  `>player p2 ${JSON.stringify({ name: 'Portfolio Bot', team: Teams.pack(createBotTeam()) })}`,
].join('\n'));
