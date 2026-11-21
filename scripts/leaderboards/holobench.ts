// HoloBench tests database operations over long texts. Table 5 gives average accuracy across five context lengths.
// Each model has two settings: fixed information amount and fixed information density. Table 6 identifies the snapshots.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2410.11996';
const lengths = ['4k','8k','16k','32k','64k'];
const board: Leaderboard = {
  benchmark:'holobench',static:'paper',feed,url:feed,terms:PAPER_TERMS+' https://arxiv.org/licenses/',
  aliases:{'GPT-4o (snapshot unspecified)':'gpt-4o-aug-2024','GPT-4o-mini (snapshot unspecified)':'gpt-4o-mini',
    'Claude-3.5-Sonnet (snapshot unspecified)':'claude-3-5-sonnet','Gemini-1.5 Pro (snapshot unspecified)':'gemini-1-5-pro-may-2024',
    'Gemini-1.5 Flash (snapshot unspecified)':'gemini-1-5-flash-may-2024','Gemini-2.0 Flash':'gemini-2-0-flash-feb-2025',
    'Gemini-2.0 Flash Thinking':'gemini-2-0-flash-thinking-jan-2025','DeepSeek-V3 (snapshot unspecified)':'deepseek-v3',
    'DeepSeek-R1 (snapshot unspecified)':'deepseek-r1'},
  parts:Object.fromEntries(lengths.map(name=>[name,name+' tokens'])),
  stats: {
    weightedIncreasing: { name: 'Weighted increasing accuracy', unit: '%', better: 'higher' },
    weightedDecreasing: { name: 'Weighted decreasing accuracy', unit: '%', better: 'higher' },
  },
  async fetch() {
    const t = paperTables(await paperHtml(feed)).map(grid).find(t=>t[0]?.[1]==='Constant Information Amount (2k)' &&
      t[0]?.[9]?.includes('Constant Information Density') && t[1]?.[6]==='Avg.' && t[1]?.[14]==='Avg.');
    if (!t) throw Error('Missing HoloBench context-length table');
    const rows = t.slice(2).flatMap(r=>[1,9].map(start=>{
      const values = r.slice(start,start+8).map(s=>s.trim()?Number(s):NaN);
      if (values.length!==8 || !values.every(Number.isFinite)) throw Error('Invalid accuracies for '+r[0]);
      return { model:r[0],setting:start===1?'Constant information amount (2k)':'Constant information density (50%)',
        score:values[5],metrics:{...Object.fromEntries(lengths.map((k,i)=>[k,values[i]])),weightedIncreasing:values[6],weightedDecreasing:values[7]} };
    }));
    return checked(rows,28);
  },
};
export default board;
