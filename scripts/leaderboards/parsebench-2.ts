import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
const feed='https://raw.githubusercontent.com/run-llama/ParseBench/main/leaderboard-v2.csv';
export default {
  benchmark:'parsebench-2', parts: {
  Text: { name: 'Text', group: 'Dimension' },
  Formatting: { name: 'Formatting', group: 'Dimension' },
  Tables: { name: 'Tables', group: 'Dimension' },
  Charts: { name: 'Charts', group: 'Dimension' },
  Visual_Grounding: { name: 'Visual grounding', group: 'Dimension' },
  Forms: { name: 'Forms', group: 'Dimension' },
},url:'https://parsebench.ai',feed,
  terms:'LlamaIndex publishes this downloadable CSV in the public ParseBench repository; robots.txt permits the raw file path.',
  stats: { Cost_Per_Page: { name: 'Cost per page', unit: 'usd', better: 'lower' } },
  verified:'marked verified in the ParseBench 2 results CSV',
  async fetch():Promise<LeaderboardRow[]> {
    const rows=parseCsv(await fetchText(feed)).map(r=>{
      const effort=r.Provider.match(/\s*\((low|medium|high|max|xhigh)\)$/i);
      const metrics:Record<string,number>={};
      for(const k of ['Text','Formatting','Tables','Charts','Visual_Grounding','Forms','Cost_Per_Page'])if(r[k]?.trim())metrics[k]=Number(r[k]);
      return {model:effort?r.Provider.slice(0,effort.index).trim():r.Provider,setting:effort?.[1],score:Number(r.Overall),verified:r.Verified==='yes',open:r.Category==='Open Weight'?true:undefined,metrics};
    });
    if(rows.length<3 || rows.some(r=>!r.model || !Number.isFinite(r.score)))throw new Error('ParseBench 2 results missing');
    return rows;
  },
} satisfies Leaderboard;
