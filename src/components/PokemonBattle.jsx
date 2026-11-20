import React, { useEffect, useRef, useState } from 'react';
import BattleHint from './BattleHint.jsx';
import { battleFavorites } from './battleThemes.js';
import PokemonTeam from './PokemonTeam.jsx';

const effectivenessLabels = { super: 'Super effective', resisted: 'Not very effective', immune: 'Immune' };

export default function PokemonBattle({ audio, sound, onSound, trackName, onRestart, onClose }) {
  const arena = useRef(null);
  const worker = useRef(null);
  const version = useRef(0);
  const [arenaReady, setArenaReady] = useState(false);
  const [arenaHeight, setArenaHeight] = useState(360);
  const [request, setRequest] = useState(null);
  const [choosing, setChoosing] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [turn, setTurn] = useState(0);
  const [outcome, setOutcome] = useState(null);
  const [theme, setTheme] = useState('arcade');
  const [portraitBounce, setPortraitBounce] = useState(true);
  const [mega, setMega] = useState(false);
  const [error, setError] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    function onArenaMessage({ source, data }) {
      if (source !== arena.current?.contentWindow || !data) return;

      if (data.type === 'pokemon-arena:ready') {
        window.clearTimeout(timeout);
        setArenaReady(true);
      }
      if (data.type === 'pokemon-arena:height' && Number.isFinite(data.height)) {
        setArenaHeight(Math.max(160, Math.min(data.height, 560)));
      }
      if (data.type === 'pokemon-arena:rendered' && data.version === version.current) {
        setTurn(data.turn);
        setRendering(false);
      }
      if (data.type === 'pokemon-arena:shiny-entrance') audio.playShiny();
      if (data.type === 'pokemon-arena:failed') setFailed(true);
    }

    window.addEventListener('message', onArenaMessage);
    const timeout = window.setTimeout(() => setFailed(true), 20000);
    return () => {
      window.removeEventListener('message', onArenaMessage);
      window.clearTimeout(timeout);
    };
  }, [audio]);

  useEffect(() => {
    if (!arenaReady) return;

    const session = new Worker(new URL('./pokemonBattle.worker.js', import.meta.url), { type: 'module' });
    worker.current = session;

    session.onmessage = ({ data }) => {
      switch (data.type) {
        case 'commands': {
          const commands = data.commands;
          const result = commands.find((line) => /^\|(win\||tie\b)/.test(line));
          if (result) setOutcome(result.startsWith('|win|You') ? 'You won!' : result.startsWith('|tie') ? 'Draw.' : 'Totally Real Saras won.');
          setRendering(true);
          version.current += 1;
          arena.current?.contentWindow?.postMessage({
            type: 'pokemon-arena:commands',
            commands,
            version: version.current,
          }, '*');
          break;
        }
        case 'request':
          setRequest(data.request);
          setChoosing(false);
          setMega(false);
          break;
        case 'invalid-choice':
          setError(data.message);
          setChoosing(false);
          break;
        case 'failure':
          setFailed(true);
          break;
      }
    };
    session.onerror = () => setFailed(true);
    return () => {
      session.terminate();
      worker.current = null;
    };
  }, [arenaReady]);

  useEffect(() => {
    if (arenaReady) {
      arena.current?.contentWindow?.postMessage({ type: 'pokemon-arena:theme', theme, portraitBounce }, '*');
    }
  }, [arenaReady, theme, portraitBounce]);

  useEffect(() => {
    if (arenaReady) arena.current?.contentWindow?.postMessage({ type: 'pokemon-arena:sound', on: sound }, '*');
  }, [arenaReady, sound]);

  function choose(choice) {
    setError('');
    setChoosing(true);
    worker.current?.postMessage({ choice });
  }

  const active = request?.active?.[0];
  const forced = request?.forceSwitch?.[0];
  const preview = request?.teamPreview;
  const busy = !request || request.wait || choosing || rendering || Boolean(outcome) || failed;
  let status = 'Starting battle…';
  if (request) status = forced ? 'Choose a Pokémon to send in.' : preview ? 'Choose your lead.' : 'Choose a move or switch.';
  if (choosing || rendering || request?.wait) status = 'Resolving turn…';
  if (outcome) status = outcome;
  if (failed) status = 'The battle couldn’t load. Start a new battle to try again.';

  return (
    <div className="pokemon-game">
      <div className="pokemon-game__bar">
        <strong>{turn > 0 ? `Turn ${turn}` : 'Gen 6 Random Battle'}</strong>
        <div className="pokemon-game__actions">
          <label className="pokemon-game__theme">
            Arena
            <select value={theme} onChange={({ target }) => setTheme(target.value)}>
              <option value="arcade">Infinite Tsukuyomi</option>
              <option value="night">Aurora Night</option>
              <option value="classic">Showdown Classic</option>
            </select>
          </label>
          <button type="button" onClick={() => setPortraitBounce(!portraitBounce)} aria-pressed={portraitBounce} disabled={theme === 'classic'}>
            Portrait bounce
          </button>
          <button type="button" onClick={() => onSound(!sound)} aria-pressed={sound}>
            {sound ? 'Sound on' : 'Sound off'}
          </button>
          <button type="button" onClick={onRestart}>New battle</button>
          <button type="button" onClick={onClose}>Close battle</button>
        </div>
      </div>
      <div className="pokemon-game__music">
        <details className="pokemon-game__favorites">
          <summary>Battle soundtrack <span>(these are my favorite themes)</span></summary>
          <ul>
            {battleFavorites.map(({ youtubeId, name }) => (
              <li key={youtubeId}><a href={`https://www.youtube.com/watch?v=${youtubeId}`} target="_blank" rel="noreferrer">{name}</a></li>
            ))}
          </ul>
        </details>
        {sound && <span className="pokemon-game__track">Battle music · {trackName}</span>}
      </div>
      <div className="pokemon-game__layout">
        <iframe
          ref={arena}
          className="pokemon-game__arena"
          title="Pokémon Showdown battlefield and battle log"
          src="/battle-arena/index.html?v=7"
          sandbox="allow-scripts"
          allow="autoplay"
          style={{ height: arenaHeight }}
        />
        <div className="pokemon-game__controls">
          <p role="status" className="pokemon-game__status">{status}</p>
          {error && <p role="alert" className="pokemon-game__error">{error}</p>}
          {active && (
            <fieldset className="pokemon-game__choices" disabled={busy || forced}>
              <legend>Moves</legend>
              {active.canMegaEvo && (
                <button type="button" className="pokemon-game__mega" aria-pressed={mega} onClick={() => setMega(!mega)}>
                  <span aria-hidden="true">✧</span> {mega ? 'Mega Evolution armed' : 'Mega Evolve'}
                </button>
              )}
              <div className="pokemon-game__grid pokemon-game__grid--moves">
                {active.moves.map(({ id, move, pp, maxpp, disabled, description, meta, effectiveness, megaEffectiveness }, index) => {
                  const rating = mega && megaEffectiveness !== undefined ? megaEffectiveness : effectiveness;
                  return (
                    <BattleHint key={id} name={move} description={description} meta={meta}>
                      <button type="button" className="pokemon-game__move" disabled={disabled} onClick={() => choose(`move ${index + 1}${mega ? ' mega' : ''}`)}>
                        <strong>{move}</strong>
                        {maxpp > 0 && <small>{pp}/{maxpp} PP</small>}
                        {!busy && rating && <small className="pokemon-game__effectiveness" data-rating={rating}>{effectivenessLabels[rating]}</small>}
                      </button>
                    </BattleHint>
                  );
                })}
              </div>
            </fieldset>
          )}
          {request?.side?.pokemon && (
            <PokemonTeam pokemon={request.side.pokemon} canSwitch={!busy && (!active?.trapped || forced)} preview={preview} choose={choose} />
          )}
        </div>
      </div>
    </div>
  );
}
