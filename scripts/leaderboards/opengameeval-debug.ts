// Roblox ranks models on its debugging evals by Pass@1. The Debug Eval Leaderboard in the project README reports four pass measures and tool errors.
// Pass@5 counts any successful attempt. All@5 is pass^5.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://raw.githubusercontent.com/Roblox/open-game-eval/main/LLM_LEADERBOARD.md";


const board: Leaderboard = {
  benchmark: "opengameeval-debug",
  url: "https://github.com/Roblox/open-game-eval/blob/main/LLM_LEADERBOARD.md#debug-eval-leaderboard",
  feed,
  terms: "Use the second table for the debugging tasks. Roblox releases the repository under MIT. https://github.com/Roblox/open-game-eval/blob/main/LICENSE.txt The raw host serves no robots.txt rules.",
  stats: {
    passAt5: { name: 'Pass@5', unit: '%', better: 'higher' },
    cons5: { name: 'Consistent pass@5', unit: '%', better: 'higher' },
    pass5: { name: 'All pass@5', unit: '%', better: 'higher' },
    toolErrors: { name: 'Average tool error rate', unit: '%', better: 'lower' },
  },
  async fetch(){
    const section=(await fetchText(feed)).split('## Debug Eval Leaderboard')[1];
    const table=section && tables(section)[0];
    if(!table || table.length<13 || table[1].map(c=>c.text).join('|')!=='Pass@1|Pass@5|Cons@5|All@5|Avg Tool Error Rate') throw new Error('Missing debug eval table');
    return table.slice(2).map(c=>{
      const [score,pass5,cons5,all5,toolErrors]=c.slice(1).map(cell=>Number(cell.text.replace('%','')));
      if(c.length!==6 || ![score,pass5,cons5,all5,toolErrors].every(Number.isFinite)) throw new Error('Invalid debug eval row');
      const [model,setting]=c[0].text.split(' (');
      return {model,setting:setting?.replace(/\)$/,''),harness:'Roblox Studio Assistant',score,metrics:{passAt5:pass5,cons5,pass5:all5,toolErrors}};
    });
  },
};
export default board;
