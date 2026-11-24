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
  chart: {
    title: 'Score against cost per page',
    note: 'Overall score against cost per page across reasoning efforts, matching the cost versus score chart on ParseBench.',
    x: { key: 'cost', label: 'Cost per page', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Overall score', unit: '%', better: 'higher' },
  },
  verified:'marked verified in the ParseBench 2 results CSV',
  async fetch():Promise<LeaderboardRow[]> {
    const rows=parseCsv(await fetchText(feed)).map(r=>{
      const effort=r.Provider.match(/\s*\((low|medium|high|max|xhigh)\)$/i);
      const metrics:Record<string,number>={};
      for(const k of ['Text','Formatting','Tables','Charts','Visual_Grounding','Forms'])if(r[k]?.trim())metrics[k]=Number(r[k]);
      // Cost_Per_Page in leaderboard-v2.csv is stored in cents per page (parsebench.ai divides by 100 for USD)
      const cost=r.Cost_Per_Page?.trim() && Number.isFinite(Number(r.Cost_Per_Page)) ? Number(r.Cost_Per_Page) / 100 : undefined;
      if(cost!==undefined)metrics.Cost_Per_Page=cost;
      return {model:effort?r.Provider.slice(0,effort.index).trim():r.Provider,setting:effort?.[1],score:Number(r.Overall),cost,verified:r.Verified==='yes',open:r.Category==='Open Weight'?true:undefined,metrics};
    });
    if(rows.length<3 || rows.some(r=>!r.model || !Number.isFinite(r.score)))throw new Error('ParseBench 2 results missing');
    return rows;
  },
} satisfies Leaderboard;
