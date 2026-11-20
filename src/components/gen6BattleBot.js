import { Dex, RandomPlayerAI, Teams } from '@pkmn/sim';

export const gen6 = Dex.mod('gen6');

const hazards = { stealthrock: 1, spikes: 3, toxicspikes: 2, stickyweb: 1 };
const shuckleName = "Saras' Shuckle";
const speed = (pokemon) => stat(pokemon, 'spe') * (pokemon.item === 'choicescarf' ? 1.5 : 1) *
  (pokemon.status === 'par' && pokemon.ability !== 'quickfeet' ? 0.25 : 1);
const priority = (first, second) => speed(first) >= speed(second);

export function createBotTeam(seed) {
  const reserves = Teams.generate('gen6randombattle', { seed })
    .filter(({ species }) => gen6.species.get(species).baseSpecies !== 'Shuckle')
    .slice(0, 5);
  return [{
    name: shuckleName,
    species: 'Shuckle',
    shiny: true,
    level: 90,
    ability: 'Sturdy',
    item: 'Mental Herb',
    nature: 'Impish',
    evs: { hp: 252, def: 252, spd: 4 },
    moves: ['Sticky Web', 'Stealth Rock', 'Encore', 'Knock Off'],
  }, ...reserves];
}

function pokemonInfo(pokemon) {
  const [name, level] = pokemon.details.split(', ');
  const species = gen6.species.get(name);
  const lv = level?.startsWith('L') ? Number(level.slice(1)) : 100;
  const typical = (key) => Math.floor((2 * species.baseStats[key] + 52) * lv / 100);
  const [hp, status = ''] = pokemon.condition.split(' ');
  const [current, maximum] = hp.split('/').map(Number);
  const maxHp = pokemon.stats && maximum ? maximum : typical('hp') + lv + 10;
  const stats = pokemon.stats || Object.fromEntries(['atk', 'def', 'spa', 'spd', 'spe'].map((key) => [key, typical(key) + 5]));
  return {
    ...pokemon, lv, types: species.types, hp: current / (maximum || 100), maxHp, stats, status,
    ability: pokemon.ability || pokemon.baseAbility || '', boosts: pokemon.boosts || {},
  };
}

function stat(pokemon, key) {
  const stage = pokemon.boosts[key] || 0;
  return pokemon.stats[key] * (stage > 0 ? (2 + stage) / 2 : 2 / (2 - stage));
}

function typeFactor(type, target, move) {
  const ability = target.ability;
  if (type === 'Ground' && (ability === 'levitate' || target.item === 'airballoon') && move !== 'thousandarrows') return 0;
  if (type === 'Water' && ['waterabsorb', 'stormdrain', 'dryskin'].includes(ability)) return 0;
  if (type === 'Electric' && ['voltabsorb', 'motordrive', 'lightningrod'].includes(ability)) return 0;
  if (type === 'Fire' && ability === 'flashfire') return 0;
  if (type === 'Grass' && ability === 'sapsipper') return 0;
  if (!gen6.getImmunity(type, target.types) && move !== 'thousandarrows') return 0;
  const effectiveness = gen6.getEffectiveness(type, target.types);
  if (ability === 'wonderguard' && effectiveness <= 0) return 0;
  return 2 ** effectiveness;
}

function damage(move, user, target) {
  if (move.category === 'Status') return 0;
  const effectiveness = typeFactor(move.type, target, move.id);
  if (!effectiveness) return 0;
  if (move.damage) return (move.damage === 'level' ? user.lv : move.damage) / target.maxHp;
  if (move.id === 'superfang') return target.hp / 2;
  let power = move.basePower;
  if (move.multihit) power *= Array.isArray(move.multihit) ? user.ability === 'skilllink' ? move.multihit[1] : 3 : move.multihit;
  if (!power) power = 65;
  const physical = move.category === 'Physical';
  const offense = move.id === 'foulplay' ? stat(target, 'atk') : stat(user, physical ? 'atk' : 'spa');
  const defense = stat(target, physical || move.overrideDefensiveStat === 'def' ? 'def' : 'spd');
  const attackItem = user.item === (physical ? 'choiceband' : 'choicespecs') ? 1.5 : user.item === 'lifeorb' ? 1.3 : 1;
  const burn = physical && user.status === 'brn' && user.ability !== 'guts' ? 0.5 : 1;
  const stab = user.types.includes(move.type) ? user.ability === 'adaptability' ? 2 : 1.5 : 1;
  return ((((2 * user.lv / 5 + 2) * power * offense / defense) / 50 + 2) * stab *
    effectiveness * attackItem * burn * 0.925) / target.maxHp;
}

function bestDamage(moves, user, target) {
  return Math.max(0, ...moves.map((move) => damage(move, user, target)));
}

export class Gen6BattleBot extends RandomPlayerAI {
  opponent = null;
  ownBoosts = {};
  revealedMoves = new Map();
  playerHazards = {};
  botHazards = {};
  turn = 0;
  lastSwitch = -10;

  receiveLine(line) {
    const [, kind, ident = '', value, extra] = line.split('|');
    if (kind === 'turn') this.turn = Number(ident);
    if (kind === 'switch' || kind === 'drag') {
      if (ident.startsWith('p1a:')) this.opponent = { ident, details: value, condition: extra, boosts: {} };
      if (ident.startsWith('p2a:')) this.ownBoosts = {};
    }
    if (this.opponent && ident === this.opponent.ident) {
      if (kind === 'detailschange' || kind === 'replace' || kind === '-formechange') this.opponent.details = value;
      if (kind === '-damage' || kind === '-heal') this.opponent.condition = value;
      if (kind === '-ability') this.opponent.ability = gen6.abilities.get(value).id;
      if (kind === '-item') this.opponent.item = gen6.items.get(value).id;
      if (kind === '-enditem') this.opponent.item = '';
      if (kind === '-status' || kind === '-curestatus') {
        const hp = this.opponent.condition.split(' ')[0];
        this.opponent.condition = kind === '-status' ? `${hp} ${value}` : hp;
      }
      if (kind === 'move') {
        const known = this.revealedMoves.get(ident) || new Set();
        this.opponent.lastMove = gen6.moves.get(value).id;
        known.add(this.opponent.lastMove);
        this.revealedMoves.set(ident, known);
      }
      if ((kind === '-start' || kind === '-end') && value === 'move: Encore') this.opponent.encored = kind === '-start';
    }
    const boosts = ident === this.opponent?.ident ? this.opponent.boosts : ident.startsWith('p2a:') ? this.ownBoosts : null;
    if (boosts && (kind === '-boost' || kind === '-unboost' || kind === '-setboost')) {
      boosts[value] = kind === '-setboost' ? Number(extra) :
        (boosts[value] || 0) + (kind === '-boost' ? 1 : -1) * Number(extra);
    }
    if (boosts && kind === '-clearboost') {
      for (const key of Object.keys(boosts)) delete boosts[key];
    }
    if (kind === '-sidestart' || kind === '-sideend') {
      const side = ident.startsWith('p1') ? this.playerHazards : this.botHazards;
      const id = gen6.moves.get(value.replace(/^move: /, '')).id;
      if (hazards[id]) side[id] = kind === '-sideend' ? 0 : (side[id] || 0) + 1;
    }
    return super.receiveLine(line);
  }

  receiveRequest(request) {
    if (request.wait) return;
    this.roster = request.side?.pokemon || [];
    this.target = this.opponent && pokemonInfo(this.opponent);
    this.move = 1;
    const active = request.active?.[0];
    const user = this.roster.find((pokemon) => pokemon.active);
    this.shuckleMove = user?.ident.endsWith(shuckleName) && active && this.target?.hp > 0 ?
      this.chooseShuckleMove(active) : null;
    if (!this.shuckleMove && this.target?.hp > 0 && user && active && !active.trapped && this.turn - this.lastSwitch > 1) {
      const current = pokemonInfo({ ...user, boosts: this.ownBoosts });
      const outgoing = bestDamage(active.moves.filter((move) => !move.disabled).map((move) => gen6.moves.get(move.id)), current, this.target);
      const incoming = this.incomingDamage(current);
      const reserves = this.roster.filter((pokemon) => !pokemon.active && !pokemon.condition.endsWith(' fnt'));
      const improvement = Math.max(-1, ...reserves.map((pokemon) => this.switchValue(pokemon))) -
        (outgoing - incoming + 0.12 * current.hp);
      const shucklePivot = user.ident.endsWith(shuckleName) && improvement > 0.16;
      if (shucklePivot || (outgoing < Math.min(0.3, this.target.hp * 0.82) && incoming >= 0.2 && improvement > 0.36)) {
        this.move = 0;
        this.lastSwitch = this.turn;
      }
    }
    return super.receiveRequest(request);
  }

  chooseShuckleMove(active) {
    const available = new Set(active.moves.filter(({ disabled }) => !disabled).map(({ id }) => id));
    const target = this.target;
    if (target.ability === 'magicbounce') return null;
    const lastMove = gen6.moves.get(target.lastMove || '');
    if (available.has('encore') && !target.encored && (lastMove.id === 'defog' || lastMove.id === 'rapidspin' ||
        (lastMove.target === 'self' && lastMove.category === 'Status' && !lastMove.heal))) return 'encore';

    const airborne = target.types.includes('Flying') || target.ability === 'levitate';
    if (!airborne && !this.playerHazards.stickyweb && available.has('stickyweb')) return 'stickyweb';
    if (!this.playerHazards.stealthrock && available.has('stealthrock')) return 'stealthrock';
    if (!this.playerHazards.stickyweb && available.has('stickyweb')) return 'stickyweb';
    return null;
  }

  incomingDamage(target) {
    const foe = this.target;
    const known = Array.from(this.revealedMoves.get(foe.ident) || [], (id) => gen6.moves.get(id));
    const category = foe.stats.atk >= foe.stats.spa ? 'Physical' : 'Special';
    const potential = foe.types.map((type) => ({ type, category, basePower: 80 }));
    return Math.max(bestDamage(known, foe, target), 0.85 * bestDamage(potential, foe, target));
  }

  switchValue(pokemon) {
    const user = pokemonInfo(pokemon);
    const outgoing = bestDamage(pokemon.moves.map((id) => gen6.moves.get(id)), user, this.target);
    const incoming = this.incomingDamage(user);
    const rock = this.botHazards.stealthrock ? typeFactor('Rock', user) / 8 : 0;
    const spikes = user.types.includes('Flying') || user.ability === 'levitate' ? 0 : (this.botHazards.spikes || 0) * 0.08;
    return Math.min(1, outgoing) - incoming - rock - spikes + 0.12 * user.hp + (priority(user, this.target) ? 0.1 : 0);
  }

  chooseSwitch(active, switches) {
    if (!(this.target?.hp > 0)) return super.chooseSwitch(active, switches);
    const score = switches.map((candidate) => this.switchValue(candidate.pokemon));
    return switches[score.indexOf(Math.max(...score))]?.slot ?? super.chooseSwitch(active, switches);
  }

  chooseMove(active, moves) {
    const signature = this.shuckleMove && moves.find(({ move }) => gen6.moves.get(move.move).id === this.shuckleMove);
    if (signature) return signature.choice;
    const current = this.roster.find((pokemon) => pokemon.active);
    if (!current || !(this.target?.hp > 0)) return super.chooseMove(active, moves);
    const user = pokemonInfo({ ...current, boosts: this.ownBoosts });
    const foe = this.target;
    const danger = this.incomingDamage(user);
    const scores = moves.map(({ move: option }) => {
      const move = gen6.moves.get(option.move);
      const hit = move.accuracy === true ? 1 : move.accuracy / 100;
      if (move.category !== 'Status') {
        const dealt = damage(move, user, foe);
        const lethal = dealt > foe.hp * 0.92;
        const canAttack = priority(user, foe) || move.priority > 0 || danger < user.hp;
        const gain = Math.min(dealt, foe.hp) + (lethal && canAttack ? 0.55 : 0) + (move.drain ? 0.09 : 0);
        return gain * hit - (move.recoil ? 0.08 * dealt : 0) - (move.flags.charge || move.flags.recharge ? 0.16 : 0);
      }
      if (move.heal && user.hp <= 0.63 && danger < user.hp * 0.76) return Math.max(0.04, 0.62 - danger);
      if (hazards[move.id] && !this.playerHazards[move.id] && foe.hp > 0.5 && danger < 0.34 && this.turn < 14) return 0.31;
      if (move.boosts && move.target === 'self' && user.hp > 0.58 && danger < 0.27 &&
          ['atk', 'spa', 'spe'].some((key) => move.boosts[key] > 0 && (user.boosts[key] || 0) < 2)) return 0.37 - danger / 2;
      if ((move.status || move.volatileStatus === 'yawn') && !foe.status && foe.hp > 0.4 &&
          (move.id !== 'toxic' || !foe.types.some((type) => ['Steel', 'Poison'].includes(type))) &&
          (move.id !== 'willowisp' || !foe.types.includes('Fire')) &&
          (move.id !== 'thunderwave' || (!foe.types.includes('Electric') && typeFactor(move.type, foe)))) return 0.36 * hit;
      return -0.02;
    });
    return moves[scores.indexOf(Math.max(...scores))]?.choice ?? super.chooseMove(active, moves);
  }
}
