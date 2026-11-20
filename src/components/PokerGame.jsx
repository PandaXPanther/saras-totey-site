import React, { useEffect, useRef, useState } from 'react';
import { CARD_RANKS, SUITS, cardName, cardRank, cardSuit, handRank } from '../poker/cards.js';
import { pickPokerAction } from '../poker/bot.js';
import {
  BIG_BLIND, BOT, HUMAN, PHASE_NAMES, SMALL_BLIND, applyAction, createHand, legalActions,
  nextHand, otherSeat, potSize, publicView,
} from '../poker/table.js';

const chips = (amount) => amount.toLocaleString('en-US');

function Card({ card, hidden }) {
  if (hidden) return <span className="poker-card poker-card--back" role="img" aria-label="Face-down card"><span aria-hidden="true">ST</span></span>;
  if (card == null) return <span className="poker-card poker-card--empty" aria-hidden="true" />;
  const suit = SUITS[cardSuit(card)];
  const rank = cardRank(card);
  return <span className="poker-card" data-red={suit.red} role="img" aria-label={cardName(card)}>
    <span className="poker-card__rank" aria-hidden="true">{rank === 10 ? '10' : CARD_RANKS[rank - 2]}</span>
    <span className="poker-card__suit" aria-hidden="true">{suit.symbol}</span>
  </span>;
}

function Seat({ hand, seat }) {
  const isHuman = seat === HUMAN;
  const visible = isHuman || hand.outcome?.reason === 'showdown';
  const rank = visible && hand.board.length >= 3 ? handRank([...hand.hole[seat], ...hand.board]).label : null;

  return (
    <div className="saras-poker__seat" data-active={hand.actor === seat} data-winner={hand.outcome?.winner === seat}
      role="group" aria-label={isHuman ? 'Your seat' : 'Saras’s seat'}>
      <div className="saras-poker__identity">
        {isHuman ? <span className="saras-poker__avatar" aria-hidden="true">♠</span>
          : <img className="saras-poker__avatar" src="/saras-headshot.jpg" alt="" width="36" height="36" />}
        <div className="saras-poker__seat-name">
          <strong>{isHuman ? 'You' : 'Totally Real Saras'}</strong>
          {rank && <span>{rank}</span>}
        </div>
        {hand.dealer === seat && <span className="saras-poker__dealer" aria-label="Dealer button" title="Dealer button">D</span>}
        <div className="saras-poker__stack">
          <span aria-label={isHuman ? 'Your stack' : 'Saras’s stack'}>{chips(hand.stacks[seat])}</span>
          <small>chips</small>
        </div>
      </div>
      <div className="saras-poker__hole" role="group" aria-label={isHuman ? 'Your cards' : 'Saras’s cards'}>
        {hand.hole[seat].map((card, index) => <Card key={index} card={visible ? card : undefined} hidden={!visible} />)}
      </div>
    </div>
  );
}

function BettingControls({ hand, act }) {
  const legal = legalActions(hand);
  const available = legal.maxTo !== null;
  const bound = (value) => Math.max(legal.minTo, Math.min(legal.maxTo, value));
  const preset = (fraction) => bound(legal.largest + Math.round((potSize(hand) + legal.toCall) * fraction));
  const [amount, setAmount] = useState(() => available ? String(preset(0.5)) : '');
  const [sizing, setSizing] = useState(false);
  const size = Number(amount);
  const valid = amount !== '' && Number.isInteger(size) && size >= legal.minTo && size <= legal.maxTo;
  const allIn = valid && size === hand.street[HUMAN] + hand.stacks[HUMAN];
  const verb = allIn ? 'All-in' : (legal.isBet ? 'Bet' : 'Raise to');

  return (
    <div className="saras-poker__controls" role="group" aria-label="Your actions">
      <div className="saras-poker__action-buttons">
        {legal.toCall > 0 && <button type="button" onClick={() => act({ type: 'fold' })}>Fold</button>}
        <button type="button" className={!sizing ? 'saras-poker__primary' : undefined}
          onClick={() => act({ type: legal.toCall ? 'call' : 'check' })}>
          {legal.toCall ? 'Call ' + chips(legal.toCall) : 'Check'}
        </button>
        {available && <button type="button" aria-expanded={sizing} aria-controls="poker-bet-sizing"
          onClick={() => setSizing(!sizing)}>{sizing ? 'Cancel sizing' : (legal.isBet ? 'Bet' : 'Raise')}</button>}
      </div>
      {available && <div id="poker-bet-sizing" className="saras-poker__sizing" hidden={!sizing}>
        {sizing && <>
          <div className="saras-poker__presets" role="group" aria-label="Bet presets">
            {[['Min', legal.minTo], ['Half pot', preset(0.5)], ['Pot', preset(1)], ['Max', legal.maxTo]].map(([name, value]) =>
              <button type="button" key={name}
                onClick={() => setAmount(String(value))}>{name}</button>)}
          </div>
          <label className="saras-poker__amount">
            <span>Total bet this round</span>
            <input type="number" min={legal.minTo} max={legal.maxTo} step="1"
              inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </label>
          <p className="saras-poker__bet-help">{valid
            ? `Adds ${chips(size - hand.street[HUMAN])} chips from your stack.`
            : `Enter ${chips(legal.minTo)}–${chips(legal.maxTo)} chips.`}</p>
          <button type="button" className="saras-poker__primary" disabled={!valid}
            onClick={() => act({ type: 'raise', to: size })}>{verb}{valid ? ' ' + chips(size) : ''}</button>
        </>}
      </div>}
    </div>
  );
}

function actionText({ type, phase, seat, amount, to, allIn }, dealer) {
  if (type === 'street') return PHASE_NAMES[phase];
  const own = seat === HUMAN;
  const name = own ? 'You' : 'Saras';
  const verb = (first, third) => own ? first : third;
  const suffix = allIn ? ' · all-in' : '';
  if (type === 'blind') {
    return name + verb(' post the ', ' posts the ') + (seat === dealer ? 'small' : 'big') + ' blind · ' + chips(amount);
  }
  if (type === 'raise' || type === 'bet') return name + (type === 'raise' ? verb(' raise to ', ' raises to ') : verb(' bet ', ' bets ')) + chips(to) + suffix;
  if (type === 'call') return name + verb(' call ', ' calls ') + chips(amount) + suffix;
  return name + (type === 'fold' ? verb(' fold', ' folds') : verb(' check', ' checks'));
}

function HandLog({ hand }) {
  const panel = useRef(null);
  const scrollToLatest = () => {
    if (panel.current) panel.current.scrollTop = panel.current.scrollHeight;
  };
  useEffect(scrollToLatest, [hand.log]);
  return (
    <details className="saras-poker__log" onToggle={scrollToLatest}>
      <summary>Hand history</summary>
      <div role="log" aria-label="Betting log" ref={panel}>
        {hand.log.map((entry, index) => <p key={index} data-seat={entry.seat} data-type={entry.type}>{actionText(entry, hand.dealer)}</p>)}
      </div>
    </details>
  );
}

function useBotTurn(hand, setHand) {
  useEffect(() => {
    const view = publicView(hand, BOT);
    if (!view) return;
    let worker;
    let timer;
    let deadline;
    let done = false;
    const readyAt = performance.now() + 630 + Math.random() * 680;
    const safeAction = { type: view.legal.toCall ? 'fold' : 'check' };

    function answer(action) {
      if (done) return;
      done = true;
      clearTimeout(deadline);
      worker?.terminate();
      timer = setTimeout(() => {
        setHand((current) => {
          if (current !== hand) return current;
          const next = applyAction(current, BOT, action);
          return next === current ? applyAction(current, BOT, safeAction) : next;
        });
      }, Math.max(0, readyAt - performance.now()));
    }

    function fallback() {
      try { answer(pickPokerAction(view, Math.random, 180)); }
      catch { answer(safeAction); }
    }

    try {
      worker = new Worker(new URL('./poker.worker.js', import.meta.url), { type: 'module' });
      worker.onmessage = ({ data }) => answer(data);
      worker.onerror = fallback;
      deadline = setTimeout(fallback, 4000);
      worker.postMessage(view);
    } catch {
      fallback();
    }

    return () => {
      done = true;
      clearTimeout(timer);
      clearTimeout(deadline);
      worker?.terminate();
    };
  }, [hand, setHand]);
}

export default function PokerGame({ onClose }) {
  const [hand, setHand] = useState(() => createHand());
  const focus = useRef(null);
  useBotTurn(hand, setHand);
  useEffect(() => { focus.current?.focus({ preventScroll: true }); }, []);

  const { outcome } = hand;
  const matchOver = Boolean(outcome && hand.stacks.includes(0));
  const resultText = outcome && (outcome.winner === null ? 'Split pot' : (outcome.winner === HUMAN ? 'You take the pot' : 'Saras takes the pot'));
  const legal = hand.actor === HUMAN ? legalActions(hand) : null;
  const botAction = hand.log.findLast(({ seat, type }) => seat === BOT && (type === 'raise' || type === 'bet'));
  const quip = outcome ? (outcome.winner === HUMAN ? 'aight u got that' : 'gg') :
    botAction?.amount > botAction?.potBefore ? 'felt like a spot' : null;

  return (
    <div className="saras-poker__game">
      <div className="saras-poker__topbar">
        <div tabIndex={-1} ref={focus}><strong>Hand {hand.number}</strong><span>Blinds {SMALL_BLIND}/{BIG_BLIND}</span></div>
        <div>
          <button type="button" onClick={() => setHand(createHand())}>New match</button>
          <button type="button" onClick={onClose}>Close table</button>
        </div>
      </div>
      <div className="saras-poker__layout">
        <div>
          <div className="saras-poker__felt" role="group" aria-label="Poker table">
            <div className="saras-poker__felt-name"><span aria-hidden="true">ST</span><strong>Saras Totey</strong></div>
            <Seat hand={hand} seat={BOT} />
            <div className="saras-poker__middle">
              <div className="saras-poker__pot">
                <span>Total pot</span><strong aria-label="Total pot">{chips(potSize(hand))}</strong><span>chips</span>
              </div>
              <div className="saras-poker__board" role="group" aria-label="Community cards">
                {Array.from({ length: 5 }, (_, index) => <Card key={index} card={hand.board[index]} />)}
              </div>
              <p className="saras-poker__stage">{PHASE_NAMES[hand.phase]}{!hand.board.length && !outcome && ' · Community cards come on the flop'}</p>
            </div>
            <Seat hand={hand} seat={HUMAN} />
          </div>
        </div>
        <div className="saras-poker__rail">
          <section className="saras-poker__decision" aria-label="Table action">
            <div className="saras-poker__turn" role="status">
              <strong>{resultText ?? (legal ? 'Your turn' : 'Saras is thinking…')}</strong>
              {legal && <span>{legal.toCall ? `${chips(legal.toCall)} chips to call.` : 'Check to pass, or bet.'}</span>}
              {outcome && <span>{outcome.winner === null ? chips(outcome.pot / 2) + ' chips each.'
                : chips(outcome.pot) + ' chips · ' + (outcome.reason === 'showdown' ? 'Showdown' : (outcome.winner === HUMAN ? 'Saras folded' : 'You folded'))}</span>}
              {matchOver && <span>{hand.stacks[HUMAN] ? 'You won the match.' : 'Saras won the match.'}</span>}
            </div>
            {outcome?.ranks && <dl className="saras-poker__showdown">
              {outcome.ranks.map(({ detail }, index) => <div key={index} data-winner={index === outcome.winner}>
                <dt>{index === HUMAN ? 'You' : 'Saras'}</dt><dd>{detail}</dd>
              </div>)}
            </dl>}
            {outcome ? <button className="saras-poker__primary" type="button"
              onClick={() => setHand((current) => matchOver ? createHand() : nextHand(current))}>
              {matchOver ? 'Play again' : 'Next hand'}
            </button> : legal && <BettingControls key={hand.number + ':' + hand.log.length} hand={hand}
              act={(action) => setHand((current) => applyAction(current, HUMAN, action))} />}
          </section>
          {hand.log.length > 0 && <p className="saras-poker__recent">{
            actionText(hand.log.findLast(({ type }) => type !== 'street'), hand.dealer)
          }</p>}
          <HandLog hand={hand} />
          {quip && <p className="saras-poker__quip"><strong>Saras</strong><span>{quip}</span></p>}
        </div>
      </div>
    </div>
  );
}
