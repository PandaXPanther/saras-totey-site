import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import catalog from '../data/roblox-games.json';
import { creators } from '../data/robloxCreators.js';
import ChessRatings from './ChessRatings.jsx';
import PokerChallenge from './PokerChallenge.jsx';
import { createBattleAudio } from './battleAudio.js';
import { nextBattleTheme } from './battleThemes.js';

const PokemonBattle = lazy(() => import('./PokemonBattle.jsx'));
const hotMicGameId = 10773050059;

const econTools = [
  ['AP FRQ Grader', 'Practice with official AP Macro and Micro rubrics.', '/frq-grader'],
  ['TariffLab', 'Model how a tariff changes prices, surplus, and revenue.', '/tarifflab'],
  ['Shadow Fed', 'Compare a model policy rate with what the Fed actually does.', '/shadow-fed'],
];

const agencyWork = [
  { title: 'BAIR', type: 'Musician portfolio', href: 'https://bairmusic.net', image: 'bair' },
  { title: 'Thriftly', type: 'Paid social campaign', href: 'https://attagency.co/#work', image: 'thriftly' },
  { title: 'Shital Tayde', type: 'Artist portfolio', href: 'https://shital-tayde-art.pages.dev', image: 'shital' },
];

const miscProjects = [
  { name: 'Kodama', type: 'Discord bot', url: 'https://askkodama.com/', description: 'A historian for Discord servers. Kodama searches old conversations and answers questions using the server’s own context.', image: 'kodama' },
  { name: 'Extemp National Points Race', type: 'Speech & debate', url: 'https://national-points-race.pages.dev/', description: 'National extemp standings with tournament results, past seasons, and the scoring rules behind every ranking.', image: 'extemp' },
];

function ExternalLink({ children, href, className }) {
  return <a className={className} href={href} target="_blank" rel="noreferrer">{children}</a>;
}

export function Economics() {
  return (
    <>
      <header className="folio-wrap page-heading portfolio-hero economics-heading">
        <p className="folio-kicker">Econ.mom · Local Ledger</p>
        <h1>Economics.</h1>
        <p>I build practical tools for learning economics and exploring the numbers behind local economies.</p>
        <nav className="page-jumps" aria-label="Economics projects">
          <a className="folio-button" href="#econ-mom">Explore Econ.mom</a><a className="folio-link" href="#local-ledger">Explore Local Ledger</a>
        </nav>
      </header>
      <section id="econ-mom" className="econ-feature">
        <div className="folio-wrap econ-feature__grid">
          <div>
            <p className="folio-kicker">The Mother of Econ</p>
            <h2>Econ.mom</h2>
            <p>Twelve free tools for AP economics students, debaters, and anyone who wants to change an assumption and see what happens. Every tool makes its formulas and sources visible.</p>
            <ExternalLink className="folio-button" href="https://econ.mom/">Explore all 12 tools</ExternalLink>
            <p className="econ-recognition">Featured in <ExternalLink href="https://marginalrevolution.com/marginalrevolution/2026/05/monday-assorted-links-558.html">Marginal Revolution</ExternalLink> and reviewed by N. Gregory Mankiw and Ruben A. Rivera.</p>
          </div>
          <div className="econ-tool-list">
            <h3>Try a tool</h3>
            {econTools.map(([name, detail, url]) => (
              <ExternalLink className="econ-tool" key={name} href={`https://econ.mom${url}`}>
                <strong>{name}</strong><span>{detail}</span>
              </ExternalLink>
            ))}
          </div>
        </div>
      </section>
      <section id="local-ledger" className="ledger-feature">
        <div className="folio-wrap econ-feature__grid">
          <div>
            <p className="folio-kicker">Local Ledger</p>
            <h2>A local economy should never require invented data.</h2>
            <p>Explore jobs, housing, income, education, and public spending in a single research dashboard. Every figure links back to its source.</p>
            <div className="page-actions">
              <ExternalLink className="folio-button" href="https://local-ledger.net/states/">Browse the data</ExternalLink>
              <ExternalLink className="folio-link" href="https://local-ledger.net/simulator/">Try the simulator</ExternalLink>
            </div>
          </div>
          <div className="ledger-coverage">
            <h3>National coverage</h3>
            <dl>{[['50', 'States'], ['3,143', 'Counties'], ['120', 'Metro previews'], ['BLS, FRED, Census', 'Among the sources']].map(([value, label]) => (
              <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
            ))}</dl>
          </div>
        </div>
      </section>
    </>
  );
}

export function Agency() {
  return (
    <>
      <header className="folio-wrap page-heading portfolio-hero agency-heading">
        <div>
          <p className="folio-kicker">ATT Agency · Boulder</p>
          <h1>Small businesses deserve technical work that holds up.</h1>
          <p>I co-founded ATT with Ryder Thomas and Sunny Avula. I lead web development, technology, and search for the studio.</p>
          <div className="agency-heading__actions">
            <ExternalLink className="folio-button" href="https://attagency.co/">Visit ATT Agency</ExternalLink>
            <span><strong>20+</strong> projects shipped</span>
          </div>
        </div>
      </header>
      <section className="folio-wrap agency-work">
        <h2>Selected studio work</h2>
        <div className="agency-grid">
          {agencyWork.map(({ title, type, image, href }) => (
            <article key={title}>
              <ExternalLink className="agency-card" href={href}>
                <img src={`/projects/${image}.webp`} alt="" width="800" height="504" loading="lazy" decoding="async" />
                <span>{type}</span><h3>{title}</h3>
              </ExternalLink>
            </article>
          ))}
        </div>
      </section>
      <section className="folio-wrap agency-studio">
        <h2>The studio</h2>
        <dl>
          <div><dt>Saras Totey</dt><dd>Web, technology & search</dd></div>
          <div><dt><ExternalLink href="https://ryduzz.com/">Ryder Thomas</ExternalLink></dt><dd>Creative, advertising & video</dd></div>
          <div><dt><ExternalLink href="https://sunnyavula.com/">Sunny Avula</ExternalLink></dt><dd>Strategy, accounts & reporting</dd></div>
        </dl>
      </section>
    </>
  );
}

export function Roblox() {
  const [failedCovers, setFailedCovers] = useState([]);
  const games = catalog.games.filter(({ id, image }) => image && !failedCovers.includes(id));

  return (
    <>
      <header className="folio-wrap page-heading roblox-heading">
        <div>
          <p className="folio-kicker">Saras Totey & Ryder Thomas</p>
          <h1>Building worlds <br />in <em>Roblox.</em></h1>
          <p>Ryder and I make games together, from a first mechanic in Studio to a world you can jump into.</p>
          <a className="folio-button" href="#games">Browse our games</a>
        </div>
        <div className="roblox-roles">
          {creators.map(({ id, name, role, description }) => (
            <article key={id}>
              <h2><ExternalLink href={`https://www.roblox.com/users/${id}/profile`}>{name}</ExternalLink></h2>
              <strong>{role}</strong><p>{description}</p>
            </article>
          ))}
        </div>
      </header>
      <section id="games" className="folio-wrap roblox-library">
        <div className="library-heading"><h2>Public games</h2><span>{games.length} experiences · updated daily from Roblox</span></div>
        {games.length === 0 && <p>No public games with covers to show yet.</p>}
        <div className="game-grid">{games.map((game) => (
          <article key={game.id}>
            <ExternalLink className="game-card" href={`https://www.roblox.com/games/${game.placeId}`}>
              <div className="game-card__art">
                <img src={game.image} alt="" width="768" height="432" loading="lazy" decoding="async" onError={() => setFailedCovers((ids) => [...ids, game.id])} />
              </div>
              <div className="game-card__copy">
                <span>{game.creator}{Number.isFinite(game.visits) && ` · ${game.visits.toLocaleString('en-US')} visits`}</span>
                <h3>{game.title}</h3>
                {game.description && <p>{game.description}</p>}
                {game.id === hotMicGameId && (
                  <p className="game-card__build-note">
                    I built a typo-tolerant answer checker with curated datasets and PostgreSQL.
                  </p>
                )}
                <span className="folio-link">Open on Roblox</span>
              </div>
            </ExternalLink>
          </article>
        ))}</div>
        <div className="roblox-sources">
          <h3>Our communities</h3>
          {catalog.communities.map(({ id, name }) => <ExternalLink key={id} href={`https://www.roblox.com/communities/${id}`}>{name}</ExternalLink>)}
        </div>
      </section>
    </>
  );
}

export function Misc() {
  const [battleOpen, setBattleOpen] = useState(false);
  const [battleNumber, setBattleNumber] = useState(0);
  const [battleSound, setBattleSound] = useState(true);
  const [battleTrackName, setBattleTrackName] = useState('');
  const battleAudio = useRef(null);

  useEffect(() => () => battleAudio.current?.close(), []);

  function startBattle() {
    const track = nextBattleTheme();
    battleAudio.current = createBattleAudio(track.url);
    setBattleTrackName(track.name);
    setBattleSound(true);
    setBattleNumber((number) => number + 1);
    setBattleOpen(true);
  }

  function restartBattle() {
    const track = nextBattleTheme();
    battleAudio.current?.setTheme(track.url);
    setBattleTrackName(track.name);
    setBattleNumber((number) => number + 1);
  }

  function closeBattle() {
    battleAudio.current?.close();
    battleAudio.current = null;
    setBattleOpen(false);
  }

  return (
    <>
      <header className="folio-wrap page-heading portfolio-hero misc-heading">
        <h1>Play against my bots.</h1>
        <p>Battle in Gen 6 Pokémon, play chess, or go heads-up in Texas Hold’em.</p>
        <nav className="misc-games-nav" aria-label="Jump to a bot">
          <a className="misc-heading__jump folio-link" href="#pokemon-battle">Jump to Pokémon <span aria-hidden="true">↓</span></a>
          <a className="misc-heading__jump folio-link" href="#chess">Jump to chess <span aria-hidden="true">↓</span></a>
          <a className="misc-heading__jump folio-link" href="#poker">Jump to poker <span aria-hidden="true">↓</span></a>
        </nav>
      </header>
      <section id="pokemon-battle" className="folio-wrap misc-battle" aria-labelledby="pokemon-battle-heading">
        <div className={`misc-battle__panel${battleOpen ? ' misc-battle__panel--playing' : ''}`}>
          <div className="battle-teaser">
            <div className="battle-teaser__copy">
              {!battleOpen && <span className="battle-teaser__format">Gen 6 Random Battle</span>}
              <h2 id="pokemon-battle-heading">Battle Me in Pokémon</h2>
              {!battleOpen && (
                <>
                  <p>I built this battle simulator into my site using Pokémon Showdown. Challenge a bot trained on my own battle data to play like me in Gen 6 Random Battle. Gen 6 was my first generation, and it’s still my favorite.</p>
                  <p><strong>Shuckle is my favorite Pokémon,</strong> so Totally Real Saras always leads with a shiny Shuckle. The remaining Pokémon on both teams are randomized every match. Have fun!</p>
                  <button type="button" className="folio-button battle-teaser__play" onClick={startBattle}>Start Gen 6 battle</button>
                </>
              )}
            </div>
            {!battleOpen && (
              <div className="battle-teaser__art eclipse-landscape" aria-hidden="true">
                <img src="https://play.pokemonshowdown.com/sprites/ani-shiny/shuckle.gif" alt="" width="108" height="108" loading="lazy" />
              </div>
            )}
          </div>
          {battleOpen && (
            <Suspense fallback={<p role="status">Starting battle…</p>}>
              <PokemonBattle key={battleNumber} trackName={battleTrackName} audio={battleAudio.current}
                sound={battleSound} onSound={(enabled) => {
                  battleAudio.current?.setEnabled(enabled);
                  setBattleSound(enabled);
                }}
                onRestart={restartBattle} onClose={closeBattle} />
            </Suspense>
          )}
        </div>
      </section>
      <ChessRatings />
      <PokerChallenge />
      <section className="folio-wrap misc-library" aria-labelledby="misc-projects-heading">
        <h2 id="misc-projects-heading">Other projects</h2>
        {miscProjects.map(({ name, type, description, image, url }) => (
          <article key={name}>
            <ExternalLink href={url} className="misc-feature">
              <img src={`/projects/${image}.webp`} alt="" width="800" height="504" loading="lazy" decoding="async" />
              <span>{type}</span><h3>{name}</h3><p>{description}</p>
            </ExternalLink>
          </article>
        ))}
      </section>
    </>
  );
}
