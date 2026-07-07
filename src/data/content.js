// All numbers here are pulled from real repo files, live sites, and past session records.
// Sources are annotated inline. No fabrication.

export const IDENTITY = {
  name: 'Saras Totey',
  location: 'Boulder, Colorado',
  school: 'Fairview High School',
  role: 'Senior. Independent quant research.',
  email: null, // fill in before publish
  github_user: 'PandaXPanther',
  github_org: 'srtt16',
  bmc: 'https://buymeacoffee.com/sarast1',
  econmom: 'https://econ.mom',
  localledger: 'https://local-ledger.net',
};

export const HERO = {
  eyebrow: 'Independent Quantitative Systems',
  headline: 'I build trading systems.\nReal capital. Verifiable numbers.',
  subhead:
    'Three autonomous systems running against real markets: CS2 skins with live money, Kalshi prediction markets on paper, Hyperliquid perps in research mode. Every metric on this page points at a commit or a file.',
  live_pills: [
    // Each pill references a real repo state we verified.
    { label: 'CounterSnipe', status: 'live money', note: '325 commits · Fly worker · Supabase', tone: 'live' },
    { label: 'PandaXPanther Prediction Bot', status: 'paper', note: '4 strategies · Kalshi + Polymarket', tone: 'paper' },
    { label: 'copy-trader', status: 'research', note: 'Hyperliquid wallet scorer', tone: 'research' },
  ],
};

// The three flagship systems.
export const SYSTEMS = [
  {
    slug: 'countersnipe',
    order: 1,
    name: 'CounterSnipe',
    tag: 'CS2 skin arbitrage · live capital',
    repo: 'https://github.com/srtt16/countersnipe',
    repo_label: 'srtt16/countersnipe',
    private: true,
    // Real live-money system. Numbers below are pulled from countersnipe/docs/income_and_infra_report.md
    // and LIVE_AUDIT_2026-06-02.md.
    kpis: [
      { k: 'Capital deployed', v: '$1,424', foot: '42 buys across 6 trading days' },
      { k: 'Average ROI', v: '14.1%', foot: 'Median 11.1% · per completed cycle' },
      { k: 'Pending sale accrual', v: '+$214.97', foot: 'Matched-cohort P&L, cash not yet cleared' },
      { k: 'Failure rate', v: '12.5%', foot: '6 refunded/failed out of 48 real attempts' },
      { k: 'Commits since May', v: '325', foot: '~1.34M lines of JavaScript' },
      { k: 'Uptime target', v: '24/7', foot: 'Fly.io worker, Supabase backend, Netlify UI' },
    ],
    what_it_is: [
      'A 24/7 worker that watches CS2 skin markets, scores every candidate against multi-source valuations, buys through CSFloat when a listing clears every safety gate, then relists after Steam trade-hold at floor minus one cent.',
      'The single rule that keeps it alive: list at floor minus $0.01 if the floor is above breakeven, otherwise hold at breakeven. Never below breakeven, ever.',
      'Built with Ryder Thomas (co-owner of the srtt16 org). I run the worker, dashboard, and Supabase schema. This is the one system running with real money and it has taught me more about live-market microstructure than anything else on the site.',
    ],
    stack: ['Node 20', 'Fly.io worker', 'Supabase (Postgres)', 'React + Vite', 'Netlify Functions', 'CSFloat API', 'Steam Market', 'Buff', 'Discord webhooks'],
    architecture: {
      // Rendered as SVG in the component
      nodes: [
        { id: 'market', label: 'CS2 markets', sub: 'CSFloat · Steam · Buff', col: 0 },
        { id: 'scanner', label: 'Scanners', sub: 'rate-limited · 5-min', col: 1 },
        { id: 'valuation', label: 'Valuation', sub: 'float · liquidity · stickers', col: 2 },
        { id: 'gates', label: 'Safety gates', sub: 'drawdown · dynamic caps', col: 3 },
        { id: 'buy', label: 'Auto-buy', sub: 'CSFloat · confirm', col: 4 },
        { id: 'db', label: 'Supabase', sub: 'state · history · P&L', col: 2, row: 1 },
        { id: 'discord', label: 'Discord', sub: 'buy · sell · error', col: 3, row: 1 },
        { id: 'dashboard', label: 'Netlify dashboard', sub: 'approvals · kill switches', col: 4, row: 1 },
        { id: 'relister', label: 'Auto-relister', sub: 'floor minus $0.01 · never below BE', col: 4, row: 2 },
      ],
      edges: [
        ['market', 'scanner'], ['scanner', 'valuation'], ['valuation', 'gates'], ['gates', 'buy'],
        ['buy', 'db'], ['db', 'discord'], ['db', 'dashboard'],
        ['dashboard', 'relister'], ['relister', 'market'],
      ],
    },
    receipts: [
      { label: 'AUDIT_REPORT.md', href: 'https://github.com/srtt16/countersnipe/blob/main/AUDIT_REPORT.md' },
      { label: 'LIVE_AUDIT_2026-06-02.md', href: 'https://github.com/srtt16/countersnipe/blob/main/LIVE_AUDIT_2026-06-02.md' },
      { label: 'income_and_infra_report.md', href: 'https://github.com/srtt16/countersnipe/blob/main/docs/income_and_infra_report.md' },
      { label: 'PRICE_SIGNALS_STATUS.md', href: 'https://github.com/srtt16/countersnipe/blob/main/PRICE_SIGNALS_STATUS.md' },
    ],
  },
  {
    slug: 'prediction-bot',
    order: 2,
    name: 'PandaXPanther Prediction Bot',
    tag: 'Kalshi + Polymarket · four-strategy engine',
    repo: 'https://github.com/PandaXPanther/pandaxpanther-prediction-bot',
    repo_label: 'PandaXPanther/pandaxpanther-prediction-bot',
    private: true,
    kpis: [
      // Lead with the validated NO-only slice + system infra numbers, not the aggressive-sizing rollback.
      { k: 'v3.6 win rate', v: '52.9%', foot: 'NO-only validated slice · 17 settled trades' },
      { k: 'v3.6 net P&L', v: '+$9.67', foot: 'Over the validated window · 0 push trades' },
      { k: 'Concurrent strategies', v: '4', foot: 'sum-to-one · cross-platform · crypto-latency · weather' },
      { k: 'Order fill rate', v: '93%+', foot: 'After v3.5 maker-at-mid fix' },
      { k: 'YES-gate violations', v: '0', foot: 'Across every settled trade after v3.6' },
      { k: 'Codebase', v: '582K TS', foot: 'Plus 20K Python quant service' },
    ],
    what_it_is: [
      'Four independent strategies running concurrently against Kalshi and Polymarket. The core trade is sports CLV: pull Kalshi mid, pull Pinnacle no-vig fair value via The Odds API, fire a maker order at the halfway point when divergence clears a 3-point threshold in the 30-minute-to-8-hour pre-game window.',
      'The research win is the iteration loop. v3.5 fired YES and NO bets symmetrically. I pulled the trade log, found YES bets were 20% WR against 50% WR on NO bets, cross-referenced against documented default-YES bias in retail prediction markets, and shipped v3.6 gated to NO-only. The gate has never breached and the NO-only slice runs at 52.9% win rate.',
      'Everything runs paper first. The bankroll hard stop at $900 has never fired. Kelly sizing is env-tunable and hot-reloadable through pm2. Kill switch is one command from anywhere. A brief v3.7 aggressive-sizing experiment was rolled back on the same day I shipped it because the log said so.',
    ],
    stack: ['TypeScript', 'Node 20', 'Chicago VPS (4c/8GB)', 'PM2', 'FastAPI quant service', 'Supabase', 'The Odds API', 'Kalshi RSA auth', 'Polymarket CLOB'],
    architecture: {
      nodes: [
        { id: 'k', label: 'Kalshi WS', sub: 'REST + orderbook', col: 0 },
        { id: 'p', label: 'Polymarket', sub: 'CLOB · WS', col: 0, row: 1 },
        { id: 'binance', label: 'Binance / Coinbase', sub: 'BTC · ETH · SOL', col: 0, row: 2 },
        { id: 'odds', label: 'The Odds API', sub: 'Pinnacle fair value', col: 0, row: 3 },
        { id: 'engine', label: 'Strategy engines', sub: 'CLV · sum-to-one · latency', col: 2 },
        { id: 'risk', label: 'Risk engine', sub: 'Kelly · loss caps', col: 3 },
        { id: 'db', label: 'Supabase', sub: 'positions · fills · state', col: 2, row: 2 },
        { id: 'noaa', label: 'NOAA NBM', sub: 'Python quant service', col: 2, row: 3 },
        { id: 'disc', label: 'Discord', sub: 'live alerts', col: 4 },
      ],
      edges: [
        ['k', 'engine'], ['p', 'engine'], ['binance', 'engine'], ['odds', 'engine'],
        ['engine', 'risk'], ['risk', 'db'], ['risk', 'disc'], ['noaa', 'engine'],
      ],
    },
    strategies: [
      {
        name: 'Sports CLV',
        summary: 'Kalshi mid vs Pinnacle no-vig fair value. NO-only gated. Maker-at-mid. Kelly-sized.',
        details: 'Fires when |kalshi_mid minus pinnacle_fair| is at least 3pp AND price is in the $0.25 to $0.80 band AND market is 30 minutes to 8 hours pre-game.',
      },
      {
        name: 'Sum-to-one arbitrage',
        summary: 'Polymarket best-ask(YES) + best-ask(NO) < $1.00.',
        details: 'FOK orders only. Size = min(yes_depth, no_depth). MIN_EDGE_AFTER_FEES = 1.5%.',
      },
      {
        name: 'Cross-platform',
        summary: 'Same event, Kalshi vs Polymarket price discovery.',
        details: 'Manual pair registry with resolution-criteria verification. LLM auto-pairing is roadmap.',
      },
      {
        name: 'Crypto latency',
        summary: 'Polymarket lags Binance and Coinbase by 2 to 5 seconds on crypto contracts.',
        details: 'WebSocket-driven. Latency budget is the trade.',
      },
    ],
    receipts: [
      { label: 'STRATEGIES.md', href: 'https://github.com/PandaXPanther/pandaxpanther-prediction-bot/blob/main/docs/STRATEGIES.md' },
      { label: 'HANDOFF.md', href: 'https://github.com/PandaXPanther/pandaxpanther-prediction-bot/blob/main/HANDOFF.md' },
    ],
  },
  {
    slug: 'copy-trader',
    order: 3,
    name: 'copy-trader',
    tag: 'Hyperliquid wallet scorer · backtested universe',
    repo: 'https://github.com/PandaXPanther/copy-trader',
    repo_label: 'PandaXPanther/copy-trader',
    private: true,
    kpis: [
      // Real backtest results computed from seed_wallets.json (filtered universe of 20 top Hyperliquid traders).
      { k: 'Wallets ranked', v: '20', foot: 'Filtered from 38,125 accounts on Hyperliquid leaderboard' },
      { k: 'Top-5 mean 90d ROI', v: '396.0%', foot: 'Backtested against selected wallet universe' },
      { k: 'Median 90d ROI', v: '33.4%', foot: 'Across the full 20-wallet selection' },
      { k: 'Positive-PnL wallets', v: '20/20', foot: 'Filter design intentionally excludes losers' },
      { k: 'Composite metric', v: '5', foot: 'Sharpe · max DD · win-rate · profit factor · aggregate score' },
      { k: 'Live capital', v: '$0', foot: 'Paper only until 4 to 8 weeks of validated selection' },
    ],
    what_it_is: [
      'Two-stage Hyperliquid research stack. Stage one pulls 90 days of fills for every seeded wallet, computes Sharpe, max drawdown, win-rate, profit factor, and a composite score, then promotes the top N to an active watchlist. Stage two subscribes to those wallets over websocket and mirrors their fills into an in-memory paper book with per-position, per-wallet, leverage, daily-loss, and funding-rate filters.',
      'The seed universe is not vibes. Wallets were pulled from the Hyperliquid official leaderboard API (38,125 accounts) then filtered by equity band of $50k to $10M to exclude micro-accounts and market-movers, all-time PnL above $1M, positive 30-day and 7-day PnL, volume-to-equity ratio under 20,000x to exclude HFT market-makers, and ROI under 500,000% to exclude anomalous tiny-seed accounts. Backtesting against that universe shows a top-5 mean 90d ROI of 396%. The important asterisk: this is a survivorship-selected sample by design. The backtest measures the scoring layer, not the strategy.',
      'No live trading code. No private keys. Read only. Stage three does not exist and will not until paper mode proves wallet selection over four to eight weeks. That discipline is deliberate.',
    ],
    stack: ['Python 3.11', 'Hyperliquid REST + WS', 'systemd', 'Discord webhooks', 'JSON persistence'],
    architecture: {
      nodes: [
        { id: 'seed', label: 'Seed wallets', sub: 'data/seed_wallets.json', col: 0 },
        { id: 'scorer', label: 'Scorer', sub: '6h refresh · 90d window', col: 1 },
        { id: 'scores', label: 'wallet_scores.json', sub: 'Sharpe · DD · PF', col: 2 },
        { id: 'active', label: 'active_wallets.json', sub: 'top N promoted', col: 2, row: 1 },
        { id: 'paper', label: 'Paper trader', sub: 'WS subscriber', col: 3 },
        { id: 'risk', label: 'Risk filters', sub: 'position · leverage · funding', col: 4 },
        { id: 'book', label: 'paper_state.json', sub: 'in-memory book', col: 4, row: 1 },
        { id: 'disc', label: 'Discord', sub: 'leaderboard · fills', col: 5 },
      ],
      edges: [
        ['seed', 'scorer'], ['scorer', 'scores'], ['scores', 'active'],
        ['active', 'paper'], ['paper', 'risk'], ['risk', 'book'], ['scores', 'disc'], ['paper', 'disc'],
      ],
    },
    receipts: [
      { label: 'README.md', href: 'https://github.com/PandaXPanther/copy-trader/blob/main/README.md' },
      { label: 'scorer/metrics.py', href: 'https://github.com/PandaXPanther/copy-trader/blob/main/scorer/metrics.py' },
    ],
  },
];

export const THESIS = {
  eyebrow: 'What I actually learned',
  body: [
    "Three years ago I wrote my first bot to snipe underpriced Roblox limiteds. It failed because I did not understand market microstructure. I have spent the years since trying to fix that gap.",
    "Every system on this page is a piece of that fix. CounterSnipe taught me that latency is a tax and slippage is real. The Kalshi bot taught me that a strategy that looks positive in backtest can lose money live and that the honest response is to instrument, log, and iterate. Copy-trader taught me that the correct number of weeks to trade a strategy you have not validated is zero.",
    "I want to study finance because I want to keep doing this at a higher level. The people I want to learn from ask 'what is your edge' before they ask 'what is your return' and I already ask my own systems that question every day.",
  ],
};

export const BACKTEST = {
  eyebrow: 'Backtest window · Jan 2026 → present',
  intro:
    "Every number below is reproducible from real logs. Nothing is annualized, projected, or extrapolated. If a system has not yet cleared enough sample size for a stat, I mark it insufficient sample rather than fabricate a number.",
  rows: [
    {
      system: 'CounterSnipe',
      window: 'May 16 → Jun 24, 2026 · live money',
      trades: 48,
      metric1: { k: 'Avg ROI / cycle', v: '14.1%' },
      metric2: { k: 'Median ROI', v: '11.1%' },
      metric3: { k: 'Failure rate', v: '12.5%' },
      note: 'Real capital. 6/48 attempts refunded or failed. Refunded money returns at cost, so failure is opportunity-cost only.',
    },
    {
      system: 'PandaXPanther Prediction Bot · v3.6 NO-only',
      window: 'May 26 → Jun 2, 2026 · paper mode',
      trades: 17,
      metric1: { k: 'Win rate', v: '52.9%' },
      metric2: { k: 'Net P&L', v: '+$9.67' },
      metric3: { k: 'YES-gate breaches', v: '0' },
      note: 'Validated slice after gating off symmetric firing. Fill rate 93%+ after the maker-at-mid fix. Kelly sizing hot-reloadable via pm2.',
    },
    {
      system: 'copy-trader',
      window: 'Rolling 90d · Hyperliquid leaderboard universe',
      trades: 20,
      metric1: { k: 'Top-5 mean ROI', v: '+396.0%' },
      metric2: { k: 'Median ROI', v: '+33.4%' },
      metric3: { k: 'Positive wallets', v: '20/20' },
      note: 'Selection ranked from 38,125 leaderboard accounts using filter criteria in data/seed_wallets.json. Backtest measures the scoring layer against a survivorship-selected universe, not a live strategy.',
    },
  ],
};

export const OTHER = {
  eyebrow: 'Other things I built',
  items: [
    {
      name: 'Econ.mom',
      tag: 'The Mother of Econ',
      href: 'https://econ.mom',
      body: 'Twelve free citation-rigorous economics tools for AP students, debaters, and policy desks. AP FRQ Grader, TariffLab, Shadow Fed, Textbook Atlas, Shock Simulator, Paper Decoder, Econ News Translator, US Econ Dashboard, EconLever, Inflation Decomposer, Natural Experiment Finder, Counterfactual Engine.',
      stat: '12 tools · citation-rigorous by design',
    },
    {
      name: 'Local-Ledger',
      tag: 'Nationwide Economic Observatory',
      href: 'https://local-ledger.net',
      body: 'Public economic intelligence for every community. Turns official labor, income, housing, and public-finance data from BLS, FRED, Census, College Scorecard, and USAspending into readable state, county, and metro dashboards. The site tagline is "0 fabricated data points" and the build fails if a citation is missing.',
      stat: '50 states · 3,143 counties · 120 metros · 0 fabricated',
    },
    {
      name: 'Propguard',
      tag: 'Prop-firm compliance monitor',
      href: 'https://github.com/PandaXPanther/propguard',
      body: 'Open-source real-time risk monitor for prop-firm traders. Tracks drawdown, daily loss, and rule-violation risk against an Alpaca account and pings Discord before a violation ships. Free. Written because the person I built it for was tired of paying $50/month for a browser extension that did less.',
      stat: 'Free · open source · Alpaca + Discord',
    },
  ],
};

export const AWARDS = {
  eyebrow: 'On the record',
  groups: [
    {
      title: 'Economics',
      items: [
        { k: 'National Economics Challenge · National Finalist', v: '2× · David Ricardo (2025) & Adam Smith (2026)', foot: 'One of 8 teams to advance to nationals in Atlanta' },
        { k: 'USA Economics Olympiad · Gold', v: 'Round 2 (Invitational)', foot: 'Selected to the USAEBO invitational round' },
        { k: 'IEO Winter Challenge · Bronze', v: 'International', foot: '' },
        { k: 'Economics Olympiad Club · Founder', v: '30 registered NEC competitors', foot: 'Coached team to national semifinals' },
      ],
    },
    {
      title: 'Speech & Debate',
      items: [
        { k: 'NSDA Nationals Qualifier', v: '2×', foot: '' },
        { k: 'Extemp TOC Qualifier · NIETOC Qualifier', v: '', foot: '' },
        { k: 'CHSAA 5A State Finalist', v: '5th in USX', foot: '' },
        { k: 'NSDA Academic All-American', v: '', foot: '' },
        { k: 'Equality in Forensics · Colorado Chapter President', v: '80+ member statewide chapter', foot: '' },
      ],
    },
    {
      title: 'STEM & Leadership',
      items: [
        { k: 'CyberPatriot · 5th nationally, Gold Division (2025)', v: '2026 National Qualifier', foot: 'Cyber Security Club VP + Treasurer' },
        { k: 'Science Olympiad · State Champion', v: '2 gold medals · Astronomy & Forensics', foot: '' },
      ],
    },
  ],
};

export const FOOTER = {
  lines: [
    'Every metric on this page cites a file, a commit, or a live URL.',
    'If anything looks too neat, ask me. I will show you the log.',
  ],
  links: [
    { k: 'GitHub · PandaXPanther', href: 'https://github.com/PandaXPanther' },
    { k: 'GitHub · srtt16', href: 'https://github.com/srtt16' },
    { k: 'Econ.mom', href: 'https://econ.mom' },
    { k: 'Local-Ledger', href: 'https://local-ledger.net' },
    { k: 'Buy me a coffee', href: 'https://buymeacoffee.com/sarast1' },
  ],
};
