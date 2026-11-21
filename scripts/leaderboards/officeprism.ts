// OfficePrism tests agents completing office tasks in a simulated enterprise. Tables 16 to 20
// report the share of 420 tasks passing both natural-language assertions and final database checks.
// Each row identifies the agent harness and the full-schema or search-and-dispatch interface.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { PAPER_TERMS, paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const url='https://arxiv.org/html/2611.22262';
const board:Leaderboard={
  benchmark:'officeprism',static:'paper',url,feed:url,terms:PAPER_TERMS,
  parts:{L1:{name:'L1',unit:'%'},L2:{name:'L2',unit:'%'},L3:{name:'L3',unit:'%'},
    success:{name:'Success',unit:'%'},strict:{name:'Strict',unit:'%'},steps:{name:'Mean recorded steps',unit:'score',better:'lower'}},
  async fetch() {
    const html=await paperHtml(url);
    const rows:LeaderboardRow[]=[];
    for (const fig of html.matchAll(/<figure\b[^>]*>([\s\S]*?)<\/figure>/g)) {
      const cap=fig[1].match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/)?.[1].replace(/<[^>]+>/g,'');
      const harness=cap?.match(/OfficePrism-420 aggregates for (.+?) display labels\./)?.[1];
      if (!harness) continue;
      const t=flatPaperTables(fig[1]).map(grid).find(t=>t[0].join('|')==='Model|Pkg.|NL–DB|L1|L2|L3|Success|Strict|Steps');
      if (!t) throw new Error('Missing OfficePrism aggregate columns for '+harness);
      for (const [model,setting,...cells] of t.slice(1)) {
        if (cells.length!==7 || !['full','search'].includes(setting)) throw new Error('Invalid OfficePrism row');
        const [score,L1,L2,L3,success,strict,steps]=cells.map(numberCell);
        rows.push({model,harness,setting,score,metrics:{L1,L2,L3,success,strict,steps}});
      }
    }
    return checked(rows,124);
  },
};
export default board;
