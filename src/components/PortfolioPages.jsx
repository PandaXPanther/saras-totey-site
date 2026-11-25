import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import catalog from '../data/roblox-games.json';
import { creators } from '../data/robloxCreators.js';
import ChessRatings from './ChessRatings.jsx';
import PokerChallenge from './PokerChallenge.jsx';
import ProjectHeading from './ProjectHeading.jsx';
import { createBattleAudio } from './battleAudio.js';
import { nextBattleTheme } from './battleThemes.js';

const PokemonBattle = lazy(() => import('./PokemonBattle.jsx'));
const hotMicGameId = 10773050059;

const econTools = [
  ['AP FRQ Grader', 'Practice with official AP Macro and Micro rubrics.', '/frq-grader'],
  ['TariffLab', 'Model how a tariff changes prices, surplus, and revenue.', '/tarifflab'],
  ['Shadow Fed', 'Compare a model policy rate with what the Fed actually does.', '/shadow-fed'],
];

const workOffers = [
  {
    id: 'websites',
    studio: 'ATT Agency',
    title: 'Websites & marketing',
    description: 'I co-founded ATT Agency, where I lead web development and search. We build custom sites and run advertising and social campaigns for growing businesses.',
    image: '/projects/att-agency-home.png',
    mobileImage: '/projects/att-agency-mobile.png',
    imageAlt: 'ATT Agency homepage with white and purple typography',
    imageSize: [1320, 720],
    projectLabel: 'Visit ATT Agency',
    projectUrl: 'https://attagency.co/',
    inquiryLabel: 'Start an ATT project',
    inquiryUrl: 'https://attagency.co/#contact',
  },
  {
    id: 'roblox',
    studio: 'Heavens Interactive',
    title: 'Roblox game development',
    description: 'We take Roblox games from concept to launch. I build the gameplay and systems, and Ryder leads the visual design and builds the worlds.',
    image: '/projects/breed-a-fish.webp',
    imageAlt: 'A Roblox character holding a bright orange fish in Breed a Fish',
    imageSize: [768, 432],
    projectLabel: 'Play Breed a Fish',
    projectUrl: 'https://www.roblox.com/games/83347621580247',
    inquiryLabel: 'Start a Heavens project',
    inquiryUrl: 'https://heavensinteractive.com/start',
  },
];

const otherProjects = [
  {
    name: 'Kodama',
    type: 'Discord history',
    description: 'Kodama searches past Discord conversations and answers questions using the server’s own messages. Ask about an inside joke, an old decision, or a moment nobody remembers the details of.',
    image: 'kodama',
    imageAlt: 'Kodama answering a question about a tournament in a Discord conversation',
    url: 'https://askkodama.com/',
    action: 'Explore Kodama',
  },
  {
    name: 'Extemp National Points Race',
    type: 'Speech & debate',
    description: 'Follow the national standings for high school extemporaneous speaking. See which tournaments counted, how points are awarded, and who placed in past seasons.',
    image: 'extemp',
    imageAlt: 'Extemp National Points Race standings with competitor names, schools, and points',
    url: 'https://national-points-race.pages.dev/',
    action: 'View the standings',
  },
];

function ExternalLink({ children, href, className }) {
  return <a className={className} href={href} target="_blank" rel="noreferrer">{children}</a>;
}

export function Economics() {
  return (
    <>
      <ProjectHeading scene="economics" className="portfolio-hero economics-heading">
        <p className="folio-kicker">Econ.mom · Local Ledger</p>
        <h1>Economics.</h1>
        <p>I build practical tools for learning economics and exploring the numbers behind local economies.</p>
        <nav className="page-jumps" aria-label="Economics projects">
          <a className="folio-button" href="#econ-mom">Explore Econ.mom</a><a className="folio-link" href="#local-ledger">Explore Local Ledger</a>
        </nav>
      </ProjectHeading>
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

export function WorkWithMe() {
  return (
    <>
      <ProjectHeading scene="studio" className="work-heading">
        <p className="folio-kicker">Work with me</p>
        <h1>I build websites and <em>Roblox games.</em></h1>
      </ProjectHeading>
      <div className="folio-wrap work-offers">
        {workOffers.map(({ id, studio, title, description, image, mobileImage, imageAlt, imageSize, projectLabel, projectUrl, inquiryLabel, inquiryUrl }) => (
          <section key={id} id={id} aria-labelledby={`${id}-offer`} className={`work-offer work-offer--${id}`}>
            <picture>
              {mobileImage && <source media="(max-width: 740px)" srcSet={mobileImage} />}
              <img className="work-offer__image" src={image} alt={imageAlt} width={imageSize[0]} height={imageSize[1]} decoding="async" />
            </picture>
            <div className="work-offer__copy">
              <p className="folio-kicker">{studio}</p>
              <h2 id={`${id}-offer`}>{title}</h2>
              <p className="work-offer__description">{description}</p>
              <div className="page-actions">
                <ExternalLink className="folio-button" href={inquiryUrl}>{inquiryLabel}</ExternalLink>
                <ExternalLink className="folio-link" href={projectUrl}>{projectLabel}</ExternalLink>
              </div>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

export function Roblox() {
  const [failedCovers, setFailedCovers] = useState([]);
  const games = catalog.games.filter(({ id, image }) => image && !failedCovers.includes(id));

  return (
    <>
      <ProjectHeading scene="voxel" className="roblox-heading">
        <div>
          <p className="folio-kicker">Saras Totey & Ryder Thomas</p>
          <h1>Building worlds <br />in <em>Roblox.</em></h1>
          <p>Ryder and I make games together, from a first mechanic in Studio to a world you can jump into.</p>
          <div className="page-actions roblox-heading__actions">
            <a className="folio-button" href="#games">Browse our games</a>
            <a className="folio-link" href="/work-with-me#roblox">Commission a Roblox game</a>
          </div>
        </div>
        <div className="roblox-roles">
          {creators.map(({ id, name, role, description }) => (
            <article key={id}>
              <h2><ExternalLink href={`https://www.roblox.com/users/${id}/profile`}>{name}</ExternalLink></h2>
              <strong>{role}</strong><p>{description}</p>
            </article>
          ))}
        </div>
      </ProjectHeading>
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
      <ProjectHeading scene="games" className="portfolio-hero misc-heading">
        <h1>Play against my bots.</h1>
        <p>Battle in Gen 6 Pokémon, play chess, or go heads-up in Texas Hold’em.</p>
        <nav className="misc-games-nav" aria-label="Jump to a bot">
          <a className="misc-heading__jump folio-link" href="#pokemon-battle">Jump to Pokémon <span aria-hidden="true">↓</span></a>
          <a className="misc-heading__jump folio-link" href="#chess">Jump to chess <span aria-hidden="true">↓</span></a>
          <a className="misc-heading__jump folio-link" href="#poker">Jump to poker <span aria-hidden="true">↓</span></a>
        </nav>
      </ProjectHeading>
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
    </>
  );
}

export function OtherProjects() {
  return (
    <>
      <ProjectHeading scene="network" className="portfolio-hero other-heading">
        <h1>Other Projects.</h1>
      </ProjectHeading>
      <div className="folio-wrap other-projects">
        {otherProjects.map(({ name, type, description, image, imageAlt, url, action }) => (
          <article key={image} className={`other-showcase other-showcase--${image}`} aria-labelledby={`${image}-title`}>
            <div className="other-showcase__copy">
              <p className="folio-kicker">{type}</p>
              <h2 id={`${image}-title`}>{name}</h2>
              <p>{description}</p>
              <ExternalLink className="other-showcase__link" href={url}>{action} <span aria-hidden="true">↗</span></ExternalLink>
            </div>
            <img className="other-showcase__preview" src={`/projects/${image}.webp`} alt={imageAlt} width="800" height="504" loading="lazy" decoding="async" />
          </article>
        ))}
      </div>
    </>
  );
}
