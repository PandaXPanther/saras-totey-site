export const routes = {
  '/': { label: 'Home', title: 'Saras Totey | Developer and Quant Researcher', description: 'Saras Totey is a Boulder developer building trading systems, economics tools, websites, and Roblox games.' },
  '/quant': { label: 'Trading Systems', short: 'Trading', title: 'Trading Systems | Saras Totey', description: 'CounterSnipe, prediction-market research, and copy-trader, with historical receipts and a model-generated trade feed.' },
  '/economics': { label: 'Economics', title: 'Economics Projects | Saras Totey', description: 'Explore Econ.mom’s interactive tools and Local Ledger’s public economic data and policy simulator.' },
  '/work-with-me': { label: 'Work with me', short: 'Hire', title: 'Work with me | Saras Totey', description: 'Start a website or marketing project with ATT Agency, or commission a Roblox game with Heavens Interactive.' },
  '/roblox': { label: 'Roblox', title: 'Roblox Game Development | Saras Totey', description: 'Play Roblox games I build with Ryder Thomas. The catalog follows both creators and their owned communities.' },
  '/misc': { label: 'Bots', title: 'Play the Bots | Saras Totey', description: 'Play against Saras Totey’s Pokémon, chess, and heads-up poker bots.' },
  '/other-projects': { label: 'Other Projects', short: 'Projects', title: 'Other Projects | Saras Totey', description: 'About me, selected honors, and two projects: Kodama and the Extemp National Points Race.' },
};

const legacyPaths = { '/home': '/', '/econ-mom': '/economics', '/local-ledger': '/economics', '/att-agency': '/work-with-me' };
export const cleanPath = (pathname) => pathname.replace(/\/+$/, '') || '/';
export const canonicalPath = (pathname) => legacyPaths[cleanPath(pathname)] || cleanPath(pathname);
