import React, { useState } from 'react';
import { Icons } from '@pkmn/img';
import BattleHint from './BattleHint.jsx';

const stats = {
  atk: 'Attack', def: 'Defense', spa: 'Sp. Atk', spd: 'Sp. Def', spe: 'Speed',
};
const species = (pokemon) => pokemon.details.split(',')[0];
const fainted = (pokemon) => pokemon.condition.endsWith(' fnt');

function PokemonIcon({ name }) {
  return <span className="pokemon-game__icon" aria-hidden="true" style={Icons.getPokemon(name).css} />;
}

export default function PokemonTeam({ pokemon, canSwitch, preview, choose }) {
  const [inspected, setInspected] = useState(null);
  const selected = pokemon.find(({ ident }) => ident === inspected) || pokemon.find(({ active }) => active) || pokemon[0];
  if (!selected) return null;

  return (
    <fieldset className="pokemon-game__choices">
      <legend>Your team</legend>
      <div className="pokemon-game__grid">
        {pokemon.map((member, index) => {
          const name = species(member);
          const selectedNow = member.ident === selected.ident;
          return (
            <div key={member.ident} className="pokemon-game__member" data-inspected={selectedNow}>
              <button type="button" className="pokemon-game__identity" aria-label={`${name} details`}
                aria-pressed={selectedNow} aria-controls="pokemon-inspector"
                onPointerEnter={({ pointerType }) => { if (pointerType === 'mouse') setInspected(member.ident); }}
                onFocus={() => setInspected(member.ident)} onClick={() => setInspected(member.ident)}>
                <PokemonIcon name={name} />
                <span>
                  <strong>{name}</strong>
                  <small>{fainted(member) ? 'Fainted' : member.active ? 'Active' : member.condition}</small>
                </span>
              </button>
              <button type="button" className="pokemon-game__switch" aria-label={`${preview ? 'Lead with' : 'Switch to'} ${name}`}
                disabled={!canSwitch || member.active || fainted(member)}
                onClick={() => choose(`${preview ? 'team' : 'switch'} ${index + 1}`)}>
                {preview ? 'Lead' : 'Switch'}
              </button>
            </div>
          );
        })}
      </div>
      <section id="pokemon-inspector" className="pokemon-game__inspector" aria-label="Pokémon details">
        <div className="pokemon-game__inspector-heading">
          <PokemonIcon name={species(selected)} />
          <strong>{species(selected)}</strong>
          <span>{selected.details.split(', ').find((detail) => /^L\d+$/.test(detail))}</span>
        </div>
        <dl>
          <div>
            <dt>Type</dt>
            <dd className="pokemon-game__types">
              {(selected.types || []).map((type) => <span key={type}>{type}</span>)}
            </dd>
          </div>
          <div><dt>Item</dt><dd>{selected.itemDescription ? <BattleHint name={selected.itemName} description={selected.itemDescription} /> : selected.itemName || 'None'}</dd></div>
          <div><dt>Ability</dt><dd>{selected.abilityDescription ? <BattleHint name={selected.abilityName} description={selected.abilityDescription} /> : selected.abilityName || 'Unknown'}</dd></div>
        </dl>
        <dl className="pokemon-game__stats">
          <div><dt>HP</dt><dd>{fainted(selected) ? '0' : selected.condition.split(' ')[0]}</dd></div>
          {Object.entries(stats).map(([key, label]) => (
            <div key={key}><dt>{label}</dt><dd>{selected.stats?.[key] ?? '–'}</dd></div>
          ))}
        </dl>
        {selected.moveDetails?.length > 0 && (
          <dl className="pokemon-game__moveset">
            <div>
              <dt>Moveset</dt>
              <dd>
                <ul aria-label="Moveset">
                  {selected.moveDetails.map(({ name, description, meta }) => (
                    <li key={`${selected.ident}:${name}`}><BattleHint name={name} description={description} meta={meta} /></li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        )}
      </section>
    </fieldset>
  );
}
