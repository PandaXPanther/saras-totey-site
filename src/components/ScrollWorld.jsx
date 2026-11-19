import React, { useEffect, useRef, useState } from 'react';
import { IDENTITY } from '../data/content.js';
import catalog from '../data/roblox-games.json';

const highlights = [
  { href: '/quant', type: 'trading', title: 'Trading Systems', description: 'I write bots to test where markets disagree with themselves, then publish the results.', image: '/world/flight/countersnipe.webp', action: 'View trading systems' },
  { href: '/economics', type: 'econ', title: 'Economics', description: 'Econ.mom makes ideas testable. Local Ledger shows how they play out in real places.', image: '/world/flight/ventures.webp', action: 'Explore economics' },
  { href: '/att-agency', type: 'agency', title: 'ATT Agency', description: 'The studio I co-founded builds websites, campaigns, and the systems that measure them.', action: 'See the agency work' },
  { href: '/roblox', type: 'roblox', title: 'Roblox Development', description: 'I program the games. Ryder designs what you see, from worlds and models to UI.', image: catalog.games.find(({ image }) => image)?.image, action: 'Find a game' },
  { href: '/misc', type: 'misc', title: 'Miscellaneous', description: 'A Discord historian, an extemp standings tracker, chess, and whatever else I’m working on.', action: 'Browse side projects' },
];

const landmarks = [
  { id: 'hunter', title: 'Hunter × Hunter', landmark: 'The trailhead', symbol: '×', description: 'The little sign is my nod to the Hunter Exam and the urge to find out what’s over the next ridge.' },
  { id: 'wall', title: 'Attack on Titan', landmark: 'The stone wall', symbol: '▥', description: 'The old rampart wraps the island like a miniature Wall Maria.' },
  { id: 'geass', title: 'Code Geass', landmark: 'The terrace', symbol: '♞', description: 'A chess piece on the terrace for Lelouch and his habit of thinking a few moves ahead.' },
  { id: 'diamond', title: 'JoJo’s Bizarre Adventure', landmark: 'The pavilion', symbol: '◇', description: 'A diamond at the pavilion for Crazy Diamond and Crazy Diamondo, one of the Roblox communities Ryder and I build in.' },
  { id: 'spiral', title: 'Naruto', landmark: 'The spiral stone', symbol: '◎', description: 'The spiral set into the path is a little Uzumaki reference.' },
  { id: 'pokemon', title: 'Pokémon', landmark: 'The trail charm', symbol: '◉', description: 'There’s a red-and-white charm at the bottom of the steps. It felt right to leave one by the tall grass.' },
];

function Island({ track }) {
  const canvas = useRef(null);
  const markers = useRef({});
  const [active, setActive] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    let dispose;
    const unavailable = (event) => {
      event.preventDefault();
      setStatus('unavailable');
    };
    const restored = () => setStatus('ready');
    const node = canvas.current;
    node.addEventListener('webglcontextlost', unavailable);
    node.addEventListener('webglcontextrestored', restored);
    import('../world/islandExperience.js').then(({ mountIsland }) => {
      if (cancelled) return;
      dispose = mountIsland(node, track.current, markers.current);
      setStatus('ready');
    }).catch(() => { if (!cancelled) setStatus('unavailable'); });
    return () => {
      cancelled = true;
      node.removeEventListener('webglcontextlost', unavailable);
      node.removeEventListener('webglcontextrestored', restored);
      dispose?.();
    };
  }, [track]);

  return (
    <figure className="island" data-scene={status}>
      <div className="island__canvas">
        <canvas ref={canvas} aria-label="A 3D sandstone island with Boulder’s Flatirons, an Indian shrine, a Japanese pavilion, cherry trees, and a waterfall" role="img" />
        {status !== 'ready' && <p className="island__status" role="status">{status === 'loading' ? 'Loading the 3D island…' : '3D graphics are unavailable on this device.'}</p>}
        <div className="island__markers">
        {landmarks.map(({ id, title, landmark, symbol }, index) => (
          <button
            key={title}
            ref={(node) => { markers.current[id] = node; }}
            type="button"
            className="island__marker"
            aria-label={`${landmark} · ${title}`}
            aria-pressed={active === index}
            aria-controls="island-caption"
            onClick={() => setActive(active === index ? null : index)}
          >{symbol}</button>
        ))}
        </div>
      </div>
      <figcaption id="island-caption" className="island__caption" aria-live="polite" aria-atomic="true">
        {active === null ? (
          <><strong>Explore the island</strong><span>Scroll to move around the island, or select a marker to find a reference.</span></>
        ) : (
          <><strong>{landmarks[active].title}</strong><span>{landmarks[active].description}</span></>
        )}
      </figcaption>
    </figure>
  );
}

export default function ScrollWorld() {
  const track = useRef(null);
  return (
    <main className="portfolio-home">
      <div ref={track} className="home-stage">
      <div className="folio-wrap home-hero">
        <div className="home-hero__copy">
          <p className="folio-kicker">Boulder, Colorado</p>
          <h1>Saras <br /><em>Totey.</em></h1>
          <p className="home-hero__lede">I’m a full-stack developer. I build trading systems, make economics tools, and program games with friends.</p>
          <div className="home-hero__actions">
            <a className="folio-button" href="#work">Explore my work</a>
            <div className="home-profile">
              <img src="/saras-headshot.jpg" width="200" height="200" alt="Saras Totey" />
              <span>Pronounced <strong>“sahr-iss.”</strong></span>
            </div>
          </div>
        </div>
        <Island track={track} />
      </div>
      </div>
      <section id="work" className="home-work">
        <div className="folio-wrap">
          <h2 className="folio-serif">Selected work</h2>
          <div className="work-grid">
            {highlights.map(({ href, type, title, description, image, action }) => (
              <article key={href} className={`work-card work-card--${type}`}>
                <div className="work-card__copy">
                  <h3><a href={href} data-work-link="true">{title}</a></h3>
                  <p>{description}</p>
                  <a className="folio-link" href={href} data-work-link="true">{action}</a>
                </div>
                {image && <img src={image} alt="" loading="lazy" decoding="async" width="768" height="432" />}
                {type === 'agency' && <b className="work-card__monogram" aria-hidden="true">AT<sup>2</sup></b>}
              </article>
            ))}
          </div>
        </div>
      </section>
      <footer id="contact" className="home-contact">
        <div className="folio-wrap">
          <h2 className="folio-serif">Get in touch</h2>
          <a className="home-contact__email" href="mailto:sarastotey@icloud.com">sarastotey@icloud.com</a>
          <nav aria-label="Contact and social links">
            <a href={IDENTITY.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            <a href={`https://github.com/${IDENTITY.github_user}`} target="_blank" rel="noreferrer">GitHub</a>
            <a href={IDENTITY.instagram} target="_blank" rel="noreferrer">Instagram</a>
            <span>Discord · PandaXPanther</span>
            <a href="tel:+17204159085">720-415-9085</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
