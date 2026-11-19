import React from 'react';
import catalog from '../data/roblox-games.json';
import { creators } from '../data/robloxCreators.js';

const econTools = [
  ['AP FRQ Grader', 'Practice with official AP Macro and Micro rubrics.', '/frq-grader'],
  ['TariffLab', 'Model how a tariff changes prices, surplus, and revenue.', '/tarifflab'],
  ['Shadow Fed', 'Compare a model policy rate with what the Fed actually does.', '/shadow-fed'],
];

const agencyWork = [
  { title: 'BAIR', type: 'Musician portfolio', href: 'https://bairmusic.net', image: 'bair' },
  { title: 'Kodama', type: 'Product launch', href: 'https://askkodama.com', image: 'kodama' },
  { title: 'Shital Tayde', type: 'Artist portfolio', href: 'https://shital-tayde-art.pages.dev', image: 'shital' },
];

const sideProjects = [
  { name: 'Kodama', type: 'Discord bot', url: 'https://askkodama.com/', description: 'A historian for Discord servers. Kodama searches old conversations, summarizes what happened, and answers questions using the server’s own context.', mark: '✳', tone: 'sage' },
  { name: 'Extemp National Points Race', type: 'Speech & debate', url: 'https://national-points-race.pages.dev/', description: 'A public tracker for national extemporaneous speaking. Browse standings, tournament results, past seasons, and the scoring rules behind each ranking.', mark: '▤', tone: 'violet' },
  { name: 'Chess', type: 'Chess.com · skibidisarz', url: 'https://www.chess.com/member/skibidisarz', description: 'My Chess.com profile, where you can find my games and results.', mark: '♞', tone: 'peach' },
  { name: 'Thryve HS Esports', type: 'Nonprofit', url: 'https://thryvehsesports.com/', description: 'I started Thryve to make competitive gaming more accessible. We run free Brawl Stars and Clash Royale tournaments for high school students.', mark: '✦', tone: 'peach' },
  { name: 'Dividend Collective', type: 'Research & digital strategy', url: 'https://thedividendcollective.com/saras-totey', description: 'I work on macro research, model-portfolio analytics, and the technology behind The Dispatch.', mark: '◐', tone: 'sage' },
  { name: 'PropGuard', type: 'Open-source software', url: 'https://github.com/PandaXPanther/propguard', description: 'A monitoring tool that tracks prop-firm drawdown and loss rules and sends Discord alerts as a limit approaches.', mark: '⊞', tone: 'violet' },
  { name: 'Robo Rush', type: 'Browser game', url: 'https://pandaxpanther.itch.io/', description: 'A four-player pass-and-play minigame rush you can play in a browser.', mark: '✣', tone: 'sage' },
];

function ExternalLink({ children, href, className }) {
  return <a className={className} href={href} target="_blank" rel="noreferrer">{children}</a>;
}

export function Economics() {
  return (
    <>
      <header className="folio-wrap page-heading economics-heading">
        <p className="folio-kicker">Research & tools</p>
        <h1 className="folio-serif">Economics, <em>hands on.</em></h1>
        <p>I build tools for testing economic ideas and finding out what the data says about real places.</p>
        <nav className="page-jumps" aria-label="Economics projects">
          <a href="#econ-mom">Econ.mom</a><a href="#local-ledger">Local Ledger</a>
        </nav>
      </header>
      <section id="econ-mom" className="econ-feature">
        <div className="folio-wrap econ-feature__grid">
          <div>
            <p className="folio-kicker">Econ.mom</p>
            <h2 className="folio-serif">The <em>Mother</em> of Econ.</h2>
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
            <h2>A closer look at local economies.</h2>
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
      <header className="folio-wrap page-heading agency-heading">
        <div>
          <p className="folio-kicker">Independent marketing studio · Boulder</p>
          <h1>ATT Agency<span>.</span></h1>
          <p>I co-founded ATT with Ryder Thomas and Sunny Avula. I lead web development, technology, and search across the studio’s client work.</p>
          <ExternalLink className="folio-button" href="https://attagency.co/">Visit the studio</ExternalLink>
        </div>
        <div className="agency-heading__stat"><strong>20+</strong><span>projects shipped</span></div>
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
        <div className="library-heading"><h2>Public games</h2><span>{catalog.games.length} experiences · updated daily from Roblox</span></div>
        {catalog.games.length === 0 && <p>No public releases are listed yet.</p>}
        <div className="game-grid">{catalog.games.map((game) => (
          <article key={game.id}>
            <ExternalLink className="game-card" href={`https://www.roblox.com/games/${game.placeId}`}>
              <div className="game-card__art">
                {game.image && <img src={game.image} alt="" width="768" height="432" loading="lazy" decoding="async" onError={(event) => { event.currentTarget.hidden = true; }} />}
              </div>
              <div className="game-card__copy">
                <span>{game.creator}{Number.isFinite(game.visits) && ` · ${game.visits.toLocaleString('en-US')} visits`}</span>
                <h3>{game.title}</h3>
                {game.description && <p>{game.description}</p>}
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
  return (
    <>
      <header className="folio-wrap page-heading misc-heading">
        <p className="folio-kicker">Outside the main projects</p>
        <h1 className="folio-serif">Side <em>quests.</em></h1>
        <p>A Discord bot with a memory, an extemp scoreboard, a chess account, and a few other things I work on.</p>
      </header>
      <section className="folio-wrap misc-library" aria-label="Miscellaneous projects">
        {sideProjects.map(({ name, type, description, mark, tone, url }) => (
          <article className={`misc-item misc-item--${tone}`} key={name}>
            <div className="misc-item__mark" aria-hidden="true">{mark}</div>
            <div><span className="folio-kicker">{type}</span><h2><ExternalLink href={url}>{name}</ExternalLink></h2><p>{description}</p></div>
            <ExternalLink className="folio-link" href={url}>Visit<span className="visually-hidden"> {name}</span></ExternalLink>
          </article>
        ))}
      </section>
      <section className="folio-wrap misc-favorites">
        <h2 className="folio-serif">Anime and games I love</h2>
        <ul>
          {['Hunter × Hunter', 'Attack on Titan', 'Code Geass', 'JoJo’s Bizarre Adventure', 'Naruto', 'Pokémon'].map((title) => <li key={title}>{title}</li>)}
        </ul>
      </section>
    </>
  );
}
