export const routes = {
  '/': { label: 'Home', title: 'Saras Totey | Developer and Quant Researcher', description: 'Saras Totey is a Boulder developer building trading systems, economics tools, websites, and Roblox games.' },
  '/quant': { label: 'Trading Systems', short: 'Trading', title: 'Trading Systems | Saras Totey', description: 'CounterSnipe, prediction-market research, and copy-trader, with historical receipts and a model-generated trade feed.' },
  '/economics': { label: 'Economics', title: 'Economics Projects | Saras Totey', description: 'Explore Econ.mom’s interactive tools and Local Ledger’s public economic data and policy simulator.' },
  '/att-agency': { label: 'ATT Agency', short: 'Agency', title: 'ATT Agency | Saras Totey', description: 'Selected web, technology, and search work from the Boulder marketing studio I co-founded.' },
  '/roblox': { label: 'Roblox', title: 'Roblox Game Development | Saras Totey', description: 'Play Roblox games I build with Ryder Thomas. The catalog follows both creators and their owned communities.' },
  '/misc': { label: 'Misc', title: 'Miscellaneous Projects | Saras Totey', description: 'Pokémon Showdown, Kodama, the Extemp National Points Race, and Saras Totey’s chess and poker bots.' },
};

const legacyPaths = { '/home': '/', '/econ-mom': '/economics', '/local-ledger': '/economics' };
export const cleanPath = (pathname) => pathname.replace(/\/+$/, '') || '/';
export const canonicalPath = (pathname) => legacyPaths[cleanPath(pathname)] || cleanPath(pathname);
