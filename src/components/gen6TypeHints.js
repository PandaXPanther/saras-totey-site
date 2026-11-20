import { gen6, lookupGen6Move, typeFactor } from './gen6BattleBot.js';

const changedTypes = { aerilate: 'Flying', pixilate: 'Fairy', refrigerate: 'Ice' };
const weatherTypes = {
  sunnyday: 'Fire', desolateland: 'Fire', raindance: 'Water', primordialsea: 'Water', sandstorm: 'Rock', hail: 'Ice',
};

const speciesName = (details) => details.split(',')[0];
const speciesTypes = (species) => gen6.species.get(species).types;
const knownType = (type) => gen6.types.get(type).exists;
const typeList = (pokemon, baseTypes = speciesTypes(pokemon.species)) =>
  [...new Set([...(pokemon.types?.length ? pokemon.types : baseTypes), pokemon.addedType].filter(knownType))];

function attackingType(move, user, weather) {
  const item = gen6.items.get(user.item);
  if (move.id === 'judgment') return item.onPlate || move.type;
  if (move.id === 'technoblast') return item.onDrive || move.type;
  if (move.id === 'naturalgift') return item.naturalGift?.type;
  if (move.id === 'weatherball') return weatherTypes[weather] || move.type;
  if (move.id === 'struggle') return undefined;
  if (user.ability === 'normalize') return 'Normal';
  return move.type === 'Normal' ? changedTypes[user.ability] || move.type : move.type;
}

export class Gen6TypeHints {
  active = {};
  abilities = new Map();
  gravity = false;
  weather = '';

  observe(line) {
    const [, event, ident = '', value = '', ...details] = line.split('|');
    if (event === '-weather') this.weather = gen6.conditions.get(ident).id;
    if (ident === 'move: Gravity') {
      if (event === '-fieldstart') this.gravity = true;
      if (event === '-fieldend') this.gravity = false;
    }

    const slot = ident.slice(0, 3);
    if (slot !== 'p1a' && slot !== 'p2a') return;
    if (event === 'switch' || event === 'drag' || event === 'replace') {
      const species = speciesName(value);
      this.active[slot] = {
        ident, species, ability: this.abilities.get(ident + '|' + species), effects: new Set(),
      };
      return;
    }
    const pokemon = this.active[slot];
    if (!pokemon) return;

    if (event === 'faint') delete this.active[slot];
    if (event === 'detailschange' || event === '-formechange') {
      pokemon.species = speciesName(value);
      pokemon.types = undefined;
      pokemon.addedType = undefined;
      pokemon.ability = this.abilities.get(ident + '|' + pokemon.species);
    }
    if (event === '-item') pokemon.item = gen6.items.get(value).id;
    if (event === '-enditem') pokemon.item = '';
    if (event === '-endability') pokemon.suppressed = true;
    if (event === '-transform') {
      const target = this.active[value.slice(0, 3)];
      if (target) pokemon.types = typeList(target);
      pokemon.temporaryAbility = true;
      pokemon.ability = undefined;
    }
    if (event === '-start' || event === '-end') {
      const starts = event === '-start';
      if (value === 'typechange') {
        const source = details.find((part) => part.startsWith('[of] '));
        const target = source && this.active[source.slice(5, 8)];
        pokemon.types = !starts ? undefined : target ? typeList(target) : details[0]?.split('/').filter(knownType);
      }
      if (value === 'typeadd') pokemon.addedType = starts ? details[0] : undefined;
      const effect = gen6.conditions.get(value).id;
      if (starts) pokemon.effects.add(effect);
      else pokemon.effects.delete(effect);
    }

    // Opponents' abilities come only from the same protocol messages the player sees.
    if (event === '-ability') {
      pokemon.temporaryAbility ||= details.some((part) => part.startsWith('[from] '));
      pokemon.suppressed = false;
      this.reveal(ident, gen6.abilities.get(value).id);
      return;
    }
    if (event === '-activate' && value.startsWith('ability: ')) {
      this.reveal(ident, gen6.abilities.get(value.slice(9)).id);
    }
    const fields = [value, ...details];
    const ability = fields.find((part) => part.startsWith('[from] ability: '));
    if (ability) {
      const source = fields.find((part) => part.startsWith('[of] '));
      this.reveal(source ? source.slice(5) : ident, gen6.abilities.get(ability.slice(16)).id);
    }
  }

  reveal(ident, ability) {
    const pokemon = this.active[ident.slice(0, 3)];
    if (!pokemon || pokemon.ident !== ident || !ability) return;
    pokemon.ability = ability;
    if (!pokemon.temporaryAbility) this.abilities.set(ident + '|' + pokemon.species, ability);
  }

  teamTypes(pokemon) {
    const base = speciesTypes(speciesName(pokemon.details));
    const active = pokemon.active ? this.active.p1a : null;
    return active ? typeList(active, base) : base;
  }

  effectiveness(name, user, megaSpecies) {
    const move = lookupGen6Move(name);
    const foe = this.active.p2a;
    if (!user || !foe || !move.exists || move.category === 'Status') return null;
    const ability = megaSpecies ? gen6.abilities.get(gen6.species.get(megaSpecies).abilities[0]).id :
      this.active.p1a?.suppressed ? '' : user.ability || user.baseAbility;
    const weather = [ability, foe.suppressed ? '' : foe.ability].some((id) => ['airlock', 'cloudnine'].includes(id)) ?
      '' : this.weather;
    const type = attackingType(move, { item: user.item, ability }, weather);
    const types = typeList(foe);
    if (!knownType(type) || !types.length) return null;
    const factor = typeFactor(type, {
      types,
      item: foe.item,
      ability: foe.suppressed ? '' : foe.ability,
      grounded: this.gravity || foe.effects.has('smackdown') || foe.effects.has('ingrain') || foe.item === 'ironball',
      airborne: foe.effects.has('magnetrise') || foe.effects.has('telekinesis'),
    }, move.id, ability);
    if (factor === 0) return 'immune';
    if (move.damage || move.damageCallback) return null;
    if (factor > 1) return 'super';
    if (factor < 1) return 'resisted';
    return null;
  }
}
