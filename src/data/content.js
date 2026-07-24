// Every number and claim here is drawn from a real repo file, live site, or logged trade record.
// Plain-English "what this actually is" is included in every section so a non-technical
// reader (an admissions officer, a scholarship reviewer, an interviewer's spouse) can follow along.

export const IDENTITY = {
  name: 'Saras Totey',
  location: 'Boulder, Colorado',
  school: 'Fairview High School',
  role: 'Senior. Independent quant research.',
  email: null,
  github_user: 'PandaXPanther',
  github_org: 'srtt16',
  bmc: 'https://buymeacoffee.com/sarast1',
  linkedin: 'https://www.linkedin.com/in/saras-totey-64a777334/',
  instagram: 'https://www.instagram.com/sarastotey_/',
  econmom: 'https://econ.mom',
  localledger: 'https://local-ledger.net',
};

export const HERO = {
  eyebrow: 'Independent Quantitative Systems',
  headline_line1: 'I build trading systems.',
  headline_grad: 'Real capital.',
  headline_rest: 'Verifiable numbers.',
  subhead:
    'I am a high school senior in Boulder, Colorado. Over the last year I built three programs that trade markets on their own, one of them with real money in it. Every number on this site links to the file that produced it.',
  live_pills: [
    { label: 'CounterSnipe', status: 'live money', note: 'CS2 skin arbitrage', tone: 'live' },
    { label: 'PandaXPanther Prediction Bot', status: 'paper', note: 'Kalshi + Polymarket', tone: 'paper' },
    { label: 'copy-trader', status: 'research', note: 'Hyperliquid perpetuals', tone: 'research' },
  ],
};

export const SYSTEMS = [
  {
    slug: 'countersnipe',
    order: 1,
    name: 'CounterSnipe',
    tag: 'CS2 skin arbitrage · live capital',
    repo: 'https://github.com/srtt16/countersnipe',
    repo_label: 'srtt16/countersnipe',
    private: false,

    tldr:
      'Counter-Strike 2 is a video game. Its cosmetic weapon skins trade on real online marketplaces (CSFloat, Steam, Buff) with tens of millions of dollars in daily volume. Prices are set by humans typing numbers, and humans make mistakes. CounterSnipe is a program I wrote that watches those marketplaces around the clock, spots when someone has listed a skin below its fair market value, buys it automatically, and re-lists it at the correct price. It currently runs with $1,424 of my real money and averages a 14.1% return per completed trade.',

    kpis: [
      { k: 'Capital deployed', v: '$1,424', foot: '42 real buys across 6 trading days' },
      { k: 'Average return per trade', v: '14.1%', foot: 'Median 11.1%' },
      { k: 'Unrealized gain (pending sale)', v: '+$214.97', foot: 'Skins bought, not yet sold' },
      { k: 'Failure rate', v: '12.5%', foot: '6 out of 48 attempts refunded' },
      { k: 'Commits since May', v: '325', foot: '~1.34M lines of JavaScript' },
      { k: 'Uptime target', v: '24/7', foot: 'Fly.io, Supabase, Netlify' },
    ],

    what_it_is: [
      'A program that runs on a rented server around the clock. Every few minutes it pulls fresh listings from every major CS2 skin marketplace, scores each one against a valuation model I wrote, and if the price is low enough to leave room for profit after fees, it buys through CSFloat. Once Steam releases the item from its seven-day trade hold, the program re-lists it at the current floor price minus one cent so it sells first.',
      'The single rule that keeps it alive: never sell below what I paid. If the market crashes on an item, the program holds it until the price recovers instead of dumping at a loss. Every buy also runs through a stack of safety gates that check things like inventory concentration, category exposure, and drawdown limits, and any single tripwire can kill the whole system with one command.',
      'This is the only one of my three systems that runs with real money. It has taught me more about how live markets actually behave than anything else I have built.',
    ],

    origin: {
      how_it_started:
        'I had been playing CS2 for four years and I kept noticing the same pattern: whenever Buff (a Chinese marketplace) went down for maintenance, sellers who only used Buff would rush to list on CSFloat instead, and those listings were often priced below the current Steam price because sellers had not updated their reference prices. In April I wrote a manual script that pinged me on Discord when this happened. In May I made the buying automatic. In June I connected real capital, and everything got harder.',
      hardest_lesson:
        'Sticker prices are the trap. Some CS2 skins have small collectible stickers applied to them, and older stickers used to be worth a lot but most no longer are. My first live losses came from buying skins where the seller had priced in a sticker as if it was still worth $40 when the real market value was closer to $2. I rewrote the valuation code to look up each sticker\u2019s actual last-30-day sale price on Buff instead of trusting the listed price. My failure rate dropped from 22.9% to 12.5% in two days.',
    },

    research_finding: {
      title: 'Float is overrated. Sticker mispricing is where the edge lives.',
      body:
        'Most online guides tell you the important variable for CS2 skin arbitrage is float, a hidden number between 0 and 1 that describes how worn the skin looks. Lower float means cleaner appearance and higher price. I found that low-float chase-buys are actually the worst trades because dozens of other bots are also scanning that band and the profit gets competed away in milliseconds. My actual profitable trades cluster in the mid-float range (0.15 to 0.25) where the visual difference is negligible but retail sellers still discount the item as if it looked worse. Combined with correctly-valued stickers, that band is where retail sellers consistently misprice their inventory. Full analysis in the audit report linked below.',
    },

    citations: [
      { title: 'Steam Market API documentation', href: 'https://steamcommunity.com/dev', note: 'Official Valve API used for cross-market price verification.' },
      { title: 'CSFloat API', href: 'https://docs.csfloat.com/', note: 'Primary listing feed and execution venue.' },
      { title: 'Sharpe (1966) : Mutual Fund Performance', href: 'https://www.jstor.org/stable/2351741', note: 'Sharpe ratio is used inside the P&L auditing scripts to compare weekly performance.' },
    ],

    code_snippet: {
      caption: 'The core safety gate. Every purchase must clear all four checks before a buy fires.',
      language: 'typescript',
      code: `// src/safety/gates.ts
export function canBuy(item: Listing, portfolio: Portfolio): GateResult {
  // 1. Never let one category dominate the book
  if (portfolio.categoryExposure(item.category) > 0.35) {
    return { ok: false, reason: 'category_cap' };
  }
  // 2. Freeze buying if today's realized P&L is red past a threshold
  if (portfolio.dailyPnL < -MAX_DAILY_LOSS) {
    return { ok: false, reason: 'drawdown_pause' };
  }
  // 3. Reject any listing whose sticker value cannot be verified
  if (item.stickerCapture > 0 && !item.stickersVerified) {
    return { ok: false, reason: 'unverified_stickers' };
  }
  // 4. Reject if projected sale margin does not clear fees plus 5%
  const netMargin = item.projectedSale - item.askPrice - item.fees;
  if (netMargin / item.askPrice < 0.05) {
    return { ok: false, reason: 'margin_too_thin' };
  }
  return { ok: true };
}`,
    },

    stack: ['Node 20', 'Fly.io worker', 'Supabase (Postgres)', 'React + Vite', 'Netlify Functions', 'CSFloat API', 'Steam Market', 'Buff', 'Discord webhooks'],

    architecture: {
      nodes: [
        { id: 'market', label: 'CS2 markets', sub: 'CSFloat · Steam · Buff', col: 0 },
        { id: 'scanner', label: 'Scanners', sub: 'rate-limited · 5-min', col: 1 },
        { id: 'valuation', label: 'Valuation', sub: 'float · liquidity · stickers', col: 2 },
        { id: 'gates', label: 'Safety gates', sub: 'drawdown · dynamic caps', col: 3 },
        { id: 'buy', label: 'Auto-buy', sub: 'CSFloat · confirm', col: 4 },
        { id: 'db', label: 'Supabase', sub: 'state · history · P&L', col: 2, row: 1 },
        { id: 'discord', label: 'Discord', sub: 'buy · sell · error', col: 3, row: 1 },
        { id: 'dashboard', label: 'Netlify dashboard', sub: 'approvals · kill switches', col: 4, row: 1 },
        { id: 'relister', label: 'Auto-relister', sub: 'floor minus $0.01 · never below cost', col: 4, row: 2 },
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
    private: false,

    tldr:
      'Kalshi and Polymarket are legal online markets where people can bet real money on the outcome of future events: "will the Fed cut rates in July," "will the Chiefs win Sunday," "will BTC hit $100k by year end." Because these markets are relatively new, prices sometimes lag or overreact compared to established sportsbooks and financial exchanges. My prediction bot watches for those gaps and simulates trades against them. It currently runs in paper mode, meaning it uses a simulated bankroll rather than my real money, while I collect enough evidence that its strategies actually work.',

    kpis: [
      { k: 'Win rate (v3.6 slice)', v: '52.9%', foot: 'The validated version, betting only NO' },
      { k: 'Net gain (v3.6 slice)', v: '+$9.67', foot: 'Over 17 settled paper trades' },
      { k: 'Concurrent strategies', v: '4', foot: 'sports · sum-to-one · cross-platform · crypto' },
      { k: 'Order fill rate', v: '93%+', foot: 'How often my orders actually get matched' },
      { k: 'Rule breaches', v: '0', foot: 'Across every trade since v3.6 shipped' },
      { k: 'Codebase', v: '582K TS', foot: 'Plus 20K Python' },
    ],

    what_it_is: [
      'Four separate betting strategies run at the same time against Kalshi and Polymarket. The most important one, sports contract-line value, works like this: I pull the current Kalshi price for a game (say the Chiefs at $0.62 to win), and separately pull the same game\u2019s odds from Pinnacle, the largest sportsbook in the world. Pinnacle\u2019s odds get converted into a fair probability by removing their built-in profit margin, giving me a "true" probability of the Chiefs winning. If Kalshi\u2019s price and Pinnacle\u2019s fair probability disagree by more than three cents, the bot places a paper bet on the mispriced side.',
      'The most important research moment in this project was catching a bias I did not expect. My first version placed both YES and NO bets whenever it saw a mispricing. When I sat down with the trade log I discovered the YES bets were winning 20% of the time while the NO bets were winning 50%. Same strategy, same math, same fill logic. The only difference was which side of the contract I bought. This matches published research on prediction market bias: retail traders systematically overpay for YES outcomes on positively-framed questions. I gated the bot to only place NO bets and the win rate stabilized.',
      'Everything runs paper first. A hard bankroll stop at $900 has never fired. Bet sizes are calibrated using the Kelly criterion, a formula from information theory that tells you the mathematically optimal fraction of your bankroll to risk on each trade given its edge. Every strategy has a kill switch I can trigger from anywhere.',
    ],

    origin: {
      how_it_started:
        'After the 2024 election I read academic papers describing systematic biases in prediction markets and became convinced I could measure those biases in my own data instead of trusting a paper written five years ago. The first version was a Python script that just logged price divergences between Kalshi and Pinnacle for two weeks before I ever tried to place an order.',
      hardest_lesson:
        'I originally thought bad execution was the problem. I discovered it was actually the timing. Prediction markets have very thin liquidity many hours before a game starts, then thicken up as the game approaches. When I plotted how often my paper orders would have filled against how many hours were left before kickoff, I saw a clean inflection: fill rate was 42% at six hours out and 93% at ninety minutes out. I gated the strategy to only fire between eight hours and thirty minutes pre-game, and the whole system got quieter and more accurate at the same time.',
    },

    research_finding: {
      title: 'Retail prediction markets are biased toward YES. I measured it in my own trades.',
      body:
        'Academic research going back to Rothschild (2009) and continuing through the 2024 election documents that retail prediction-market traders overpay for YES outcomes on positively-framed questions, especially in sports and politics. My v3.5 log gave me a clean natural experiment. The strategy fired 33 YES bets and 33 NO bets over the same window, using the same fair-value model against the same events. YES bets won 20% of the time. NO bets won 50%. Nothing else was different. The academic finding was reproducible in my own paper trades, and the fix (only bet the side that buys the mispricing) has held for every trade since I gated it.',
    },

    citations: [
      { title: 'Rothschild (2009) : Forecasting Elections: Comparing Prediction Markets, Polls, and Their Biases', href: 'https://www.jstor.org/stable/40608421', note: 'Documents systematic YES-bias in Iowa Electronic Markets, the earliest public prediction market.' },
      { title: 'Wolfers & Zitzewitz (2004) : Prediction Markets', href: 'https://www.aeaweb.org/articles?id=10.1257/0895330041371321', note: 'Foundational NBER paper on prediction market pricing efficiency.' },
      { title: 'Kelly (1956) : A New Interpretation of Information Rate', href: 'https://ieeexplore.ieee.org/document/6771227', note: 'The bet-sizing formula used by the position sizer.' },
      { title: 'Thorp (1997) : The Kelly Criterion in Blackjack, Sports Betting, and the Stock Market', href: 'https://www.eecs.harvard.edu/cs286r/courses/fall12/papers/Thorpe_KellyCriterion2007.pdf', note: 'Practical treatment of Kelly for bounded bankrolls.' },
    ],

    code_snippet: {
      caption: 'The NO-only gate. This is the single line of logic that turned a losing bot into a winning one.',
      language: 'typescript',
      code: `// src/strategy/sports_clv.ts
function shouldFire(signal: Signal): boolean {
  const edge = Math.abs(signal.kalshiMid - signal.pinnacleFair);
  if (edge < MIN_EDGE_THRESHOLD) return false;         // 3 cent minimum
  if (signal.hoursToGame < 0.5 || signal.hoursToGame > 8) return false;
  if (signal.side === 'YES') return false;             // v3.6 gate
  if (signal.priceUsd < 0.25 || signal.priceUsd > 0.80) return false;
  return true;
}`,
    },

    stack: ['TypeScript', 'Node 20', 'Chicago VPS (4c/8GB)', 'PM2', 'FastAPI', 'Supabase', 'The Odds API', 'Kalshi RSA auth', 'Polymarket CLOB'],

    architecture: {
      nodes: [
        { id: 'k', label: 'Kalshi', sub: 'orderbook feed', col: 0 },
        { id: 'p', label: 'Polymarket', sub: 'CLOB · WS', col: 0, row: 1 },
        { id: 'binance', label: 'Binance / Coinbase', sub: 'BTC · ETH · SOL', col: 0, row: 2 },
        { id: 'odds', label: 'The Odds API', sub: 'Pinnacle fair value', col: 0, row: 3 },
        { id: 'engine', label: 'Strategy engines', sub: 'sports · sum-to-one · crypto', col: 2 },
        { id: 'risk', label: 'Risk engine', sub: 'Kelly · loss caps', col: 3 },
        { id: 'db', label: 'Supabase', sub: 'positions · fills · state', col: 2, row: 2 },
        { id: 'noaa', label: 'NOAA weather', sub: 'Python quant service', col: 2, row: 3 },
        { id: 'disc', label: 'Discord', sub: 'live alerts', col: 4 },
      ],
      edges: [
        ['k', 'engine'], ['p', 'engine'], ['binance', 'engine'], ['odds', 'engine'],
        ['engine', 'risk'], ['risk', 'db'], ['risk', 'disc'], ['noaa', 'engine'],
      ],
    },

    strategies: [
      {
        name: 'Sports contract-line value',
        summary: 'Kalshi price versus Pinnacle fair value. Only bet NO. Sized using Kelly.',
        details: 'Fires when Kalshi and Pinnacle disagree by more than three cents and the game is 30 minutes to 8 hours away.',
      },
      {
        name: 'Sum-to-one arbitrage',
        summary: 'On Polymarket, buy both YES and NO when their prices add up to less than one dollar.',
        details: 'Only fill-or-kill orders, so partial fills cannot leave a naked leg.',
      },
      {
        name: 'Cross-platform',
        summary: 'Same event on Kalshi and Polymarket at different prices.',
        details: 'Manual pair registry today. Automated pair discovery is on the roadmap.',
      },
      {
        name: 'Crypto latency',
        summary: 'Polymarket lags Binance and Coinbase by two to five seconds on crypto contracts.',
        details: 'Speed-sensitive. Latency is the trade.',
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
    private: false,

    tldr:
      'Hyperliquid is a cryptocurrency exchange where every trader\u2019s wallet activity is public. This is unusual: on Robinhood or Coinbase you cannot see what anyone else is buying. On Hyperliquid you can. copy-trader is a program that pulls three months of trading history for the top wallets on the exchange, ranks them by how disciplined their returns look (using risk-adjusted metrics from academic finance), and simulates copying the top five. It is a research project with no real money attached, and it will stay that way until the paper simulation proves selection is skillful.',

    kpis: [
      { k: 'Wallets ranked', v: '20', foot: 'Filtered from 38,125 public accounts' },
      { k: 'Top-5 mean 90d ROI', v: '396.0%', foot: 'Backtested return of the selection layer' },
      { k: 'Median 90d ROI', v: '33.4%', foot: 'Across the whole 20-wallet universe' },
      { k: 'Positive-PnL wallets', v: '20/20', foot: 'By filter design, not luck' },
      { k: 'Metrics per wallet', v: '5', foot: 'Sharpe · drawdown · win-rate · profit factor · composite' },
      { k: 'Live capital', v: '$0', foot: 'Paper only until 4 to 8 weeks of validation' },
    ],

    what_it_is: [
      'The program runs in two stages. Stage one pulls the last 90 days of trades for every wallet in the seed list, then computes five performance statistics: Sharpe ratio, maximum drawdown, win rate, profit factor, and a weighted composite score. Only the top scoring wallets get promoted to the active watchlist. Stage two subscribes to those wallets over a real-time connection and mirrors each of their trades into a simulated paper account, applying risk rules that would apply in real life (maximum position size, maximum leverage, funding-rate filters, and a daily-loss circuit breaker).',
      'The starting list of wallets is not chosen randomly. I pulled all 38,125 accounts from Hyperliquid\u2019s public leaderboard, then filtered on five criteria at once: account size between $50k and $10M (excludes both toy accounts and market-movers), all-time profit above $1M, positive 30-day AND 7-day profit, volume-to-equity ratio below 20,000x (excludes high-frequency market-makers who profit from rebates rather than direction), and lifetime ROI below 500,000% (excludes anomalous tiny-seed accounts). The result is 20 wallets that represent the top of what a reasonably-capitalized retail trader could plausibly imitate.',
      'There is no live trading code in this project. There are no private keys anywhere in the repo. The system is read-only by design. Stage three, actual execution, does not exist and will not be built until paper mode proves the selection layer works over four to eight weeks. Discipline is the point.',
    ],

    origin: {
      how_it_started:
        'In December 2025 I lost $180 copy-trading a Twitter perpetual-futures account. It turned out to be a marketing wallet that only posted its winners. I wanted a version of copy-trading that ranked traders by evidence rather than by follower count.',
      hardest_lesson:
        'My first version ranked wallets by raw 90-day return. Predictably this ranked reckless traders above disciplined ones because leverage inflates ROI. When I rewrote scoring around Sharpe ratio and maximum drawdown, the ranking flipped dramatically: the top wallet by return dropped to rank 14 by composite score. The metric you sort on decides which strategy you are actually copying, and I had been unintentionally copying gamblers.',
    },

    research_finding: {
      title: 'Survivorship bias is a feature of copy-trading, not a bug.',
      body:
        'The 20 seed wallets are all positive over 90 days. At first glance this looks like data mining, the same mistake that made hedge fund performance studies overestimate returns for decades (see Brown, Goetzmann, Ibbotson, and Ross on this). But in copy-trading you are inherently choosing from wallets that already survived. You cannot copy a wallet that went to zero last month because it is no longer on the leaderboard. My universe reflects exactly the choice set a real copy-trader faces. What the backtest measures is whether my scoring layer picks the right wallets from a survivor-biased population, not whether the wallets themselves are magic.',
    },

    citations: [
      { title: 'Sharpe (1966) : Mutual Fund Performance', href: 'https://www.jstor.org/stable/2351741', note: 'Origin of the Sharpe ratio, the risk-adjusted return metric used as the primary ranking signal.' },
      { title: 'Brown, Goetzmann, Ibbotson & Ross (1992) : Survivorship Bias in Performance Studies', href: 'https://www.jstor.org/stable/2962287', note: 'Canonical treatment of why looking only at surviving accounts overstates returns. Directly addressed in the research finding above.' },
      { title: 'Sharpe (1994) : The Sharpe Ratio', href: 'https://web.stanford.edu/~wfsharpe/art/sr/sr.htm', note: 'The 1994 reformulation used in scorer/metrics.py.' },
    ],

    code_snippet: {
      caption: 'The composite score. Weights are what turned "who returned the most" into "who trades well."',
      language: 'python',
      code: `# scorer/metrics.py
def composite_score(fills):
    sharpe   = sharpe_ratio(daily_returns(fills))
    max_dd   = max_drawdown(equity_curve(fills))
    win_rate = wins(fills) / len(fills)
    pf       = profit_factor(fills)

    # Higher Sharpe good, deeper drawdown bad.
    return (
        0.40 * clamp(sharpe / 3.0, 0, 1)
      + 0.30 * (1 - clamp(max_dd / 0.50, 0, 1))
      + 0.15 * clamp(win_rate, 0, 1)
      + 0.15 * clamp(pf / 3.0, 0, 1)
    )`,
    },

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
      { label: 'data/seed_wallets.json', href: 'https://github.com/PandaXPanther/copy-trader/blob/main/data/seed_wallets.json' },
    ],
  },
];

export const THESIS = {
  eyebrow: 'The story behind these systems',
  paragraphs: [
    'Three years ago I wrote my first program that tried to trade a market. It was supposed to spot underpriced items on Roblox and buy them faster than a human could. It lost me forty dollars in one weekend and taught me nothing except that markets are harder than I thought.',
    'Everything I have built since then has been an attempt to understand why. CounterSnipe taught me that the difference between an idea that looks profitable on paper and one that survives with real money in it is a stack of unglamorous safety rules. The prediction bot taught me that being wrong about your own strategy is worth more than being right, because being wrong forces you to instrument, log, and iterate. copy-trader taught me that the right number of weeks to trade a strategy you have not validated is zero.',
    'I want to study finance because the people I most want to learn from ask "what is your edge" before they ask "what is your return." I already ask my own systems that question every day, and I want to keep doing this work at a level and with a rigor that I cannot reach on my own.',
  ],
};

export const BACKTEST = {
  eyebrow: 'Backtest window · Jan 2026 → present',
  intro:
    'Everything below is reproducible from real logs and real repo files. Nothing has been annualized, projected, or extrapolated. Where a system does not yet have enough sample size for a stat, I label it as insufficient sample rather than invent a number.',
  rows: [
    {
      system: 'CounterSnipe',
      window: 'May 16 → Jun 24, 2026 · live money',
      trades: 48,
      metric1: { k: 'Avg return per trade', v: '14.1%' },
      metric2: { k: 'Median return', v: '11.1%' },
      metric3: { k: 'Failure rate', v: '12.5%' },
      note: 'Real capital. 6 of 48 buys refunded or failed. Refunded money returns at cost, so a failure is opportunity cost, not a realized loss.',
    },
    {
      system: 'PandaXPanther Prediction Bot · v3.6 NO-only slice',
      window: 'May 26 → Jun 2, 2026 · paper mode',
      trades: 17,
      metric1: { k: 'Win rate', v: '52.9%' },
      metric2: { k: 'Net P&L', v: '+$9.67' },
      metric3: { k: 'Rule breaches', v: '0' },
      note: 'The window after I switched off symmetric YES/NO betting. Order fill rate stabilized at 93%+ once the timing gate was added.',
    },
    {
      system: 'copy-trader',
      window: 'Rolling 90d · Hyperliquid public leaderboard',
      trades: 20,
      metric1: { k: 'Top-5 mean ROI', v: '+396.0%' },
      metric2: { k: 'Median ROI', v: '+33.4%' },
      metric3: { k: 'Positive wallets', v: '20/20' },
      note: 'Backtest measures the wallet-selection layer against a survivorship-selected universe (see the research finding). It does not claim to predict future returns.',
    },
  ],
};

export const ROADMAP = {
  eyebrow: 'What is next',
  intro: 'Each of these three systems has a version I have already sketched. Not marketing copy. Actual issues I have opened against my own repos.',
  items: [
    {
      system: 'CounterSnipe',
      next: 'Ship the "trade-up" classifier. In CS2, ten worn skins can be combined into one new skin whose value depends on the average condition of the inputs. This is a math problem I can solve with a small supervised model trained on Buff sales data. Currently those decisions are manual approvals from me. I want to backtest the classifier on eight months of history before I let it fire on real money.',
    },
    {
      system: 'Prediction bot',
      next: 'Make the NO-only gate adapt over time. The 2.5x edge YES bets versus NO bets is not a constant. It should shrink as the market prices in the bias, especially close to game time and in high-volume markets. I want to model the gate threshold as a function of how much liquidity is in the book and how far out from the event we are, rather than treating it as a fixed rule.',
    },
    {
      system: 'copy-trader',
      next: 'Stress-test the scoring weights. The composite score currently weights Sharpe ratio at 40%, drawdown at 30%, and win rate + profit factor at 15% each. I picked those weights by intuition. I want to sweep them across a grid, measure how much the top-five ranking changes when the weights change, and defend a final choice on the basis of ranking stability rather than a guess.',
    },
    {
      system: 'Across all three',
      next: 'A single risk dashboard for all three systems. Right now each one alerts to its own Discord channel and holds its own kill switch. I want one page that sums exposure and P&L across the whole fleet, with a fleet-wide circuit breaker that halts every bot if aggregate drawdown crosses a floor.',
    },
  ],
};

export const LIVE = {
  eyebrow: 'Live signals · refreshed daily',
  intro: 'The site rebuilds every night at 06:00 UTC via a GitHub Actions workflow. Commit counts and the Hyperliquid cohort ROI regenerate against real APIs. Every number here is reproducible.',
  last_updated_iso: '2026-07-24T08:04:26.993Z',
  cards: [
    { k: "CounterSnipe commits", v: "328", foot: "srtt16/countersnipe" },
    { k: "Prediction bot commits", v: "17", foot: "PandaXPanther/pandaxpanther-prediction-bot" },
    { k: "copy-trader commits", v: "4", foot: "PandaXPanther/copy-trader" },
    { k: "Hyperliquid cohort · top-5 30d ROI", v: "+28.1%", foot: "Recomputed from seed_wallets.json + Hyperliquid leaderboard API" },
    { k: "Days since CounterSnipe live", v: "69", foot: "Since May 16, 2026" },
    { k: "Days since last commit", v: "16", foot: "Across the three-repo fleet" },
  ],
};

export const OTHER = {
  eyebrow: 'Other things I built',
  items: [
    {
      name: 'Econ.mom',
      tag: 'The Mother of Econ',
      href: 'https://econ.mom',
      body: 'Twelve free tools for AP Economics students, debate teams, and policy analysts. Includes an AP FRQ grader, a tariff-effect simulator, a Fed-shock model, a textbook citation atlas, a paper decoder, and an inflation decomposer. Every number the site displays is sourced from BLS, FRED, or a peer-reviewed paper. Nothing is generated by a language model.',
      stat: '12 tools · citation-rigorous by design',
    },
    {
      name: 'Local-Ledger',
      tag: 'Nationwide Economic Observatory',
      href: 'https://local-ledger.net',
      body: 'Public economic data for every community. The site turns official labor, income, housing, and public-finance data from BLS, FRED, Census, College Scorecard, and USAspending into readable state, county, and metro dashboards. Its tagline is "0 fabricated data points" and the build breaks if a citation is missing.',
      stat: '50 states · 3,143 counties · 120 metros · 0 fabricated',
    },
    {
      name: 'Propguard',
      tag: 'Prop-firm compliance monitor',
      href: 'https://github.com/PandaXPanther/propguard',
      body: 'A free open-source risk monitor for prop-firm traders. It tracks drawdown, daily loss, and rule-violation risk against an Alpaca brokerage account and pings the trader on Discord before a rule breach ships. Written because the person I built it for was tired of paying fifty dollars a month for a browser extension that did less.',
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
