// EvoArena tests adaptation to changing terminal workflows, repositories, and user preferences.
// The project describes "average accuracy across terminal, software, and social-preference domains".
// Its overview figure reports step and chain means to one decimal. Use the same three-domain
// mean for both Base and EvoMem in the main results table, with step accuracy as the headline.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { grid, checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://aiden0526.github.io/EvoArena/';
const agents: Record<string,string> = {'Terminal-Bench-Evo':'Terminus 2','SWE-Chain-Evo':'OpenHands','PersonaMem-Evo':'A-Mem'};
const board: Leaderboard = {
  benchmark: 'evoarena', url: feed, feed,
  terms: 'The makers publish the results and say the repository license is pending. https://github.com/Aiden0526/EvoArena#license',
  headline: 'The headline is mean step accuracy across the three domains, as shown in the project overview.',
  async fetch() {
    const main = tables(await fetchText(feed)).map(grid).find(t => t[0]?.join('|') === 'Benchmark|Agent|Model|Step Base|Step +EvoMem|Step Δ|Chain Base|Chain +EvoMem|Chain Δ');
    if (!main) throw new Error('Missing EvoArena results');
    const rows = new Map<string, LeaderboardRow>();
    board.parts = {};
    for (const [domain, agent, model, step, memoryStep,,chain,memoryChain] of main.slice(1)) {
      if (model === 'Average') continue;
      if (agents[domain] !== agent) throw new Error('Unrecognized EvoArena task or agent');
      for (const [setting, s, c] of [['Base',step,chain],['EvoMem',memoryStep,memoryChain]]) {
        const key = model + ':' + setting;
        if (!rows.has(key)) rows.set(key, {model,setting,score:0,metrics:{}});
        const metrics = rows.get(key)!.metrics!;
        if (domain in metrics) throw new Error('Duplicate domain for ' + key);
        metrics[domain] = numberCell(s);
        metrics[domain + ': Chain'] = numberCell(c);
        board.parts[domain] = {name:domain + ': Step',unit:'%',note:'Evaluated with ' + agent + '.'};
        board.parts[domain + ': Chain'] = {name:domain + ': Chain',unit:'%',note:'Evaluated with ' + agent + '.'};
      }
    }
    for (const row of rows.values()) {
      const domains = Object.keys(agents);
      const mean = (suffix:string) => Number((domains.reduce((sum,d) => sum + row.metrics![d+suffix],0) / domains.length).toFixed(1));
      row.score = mean('');
      row.metrics!.chainAccuracy = mean(': Chain');
    }
    return checked([...rows.values()],16);
  },
};
export default board;
