import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const url='https://maxxbench.unlap.ai/';
const stats = {
  deepsweScore: { name: 'DeepSWE score', unit: '%', better: 'higher', note: 'Reference DeepSWE score shown beside MaxxBench.' },
  estimatedBenchMaxxing: { name: 'Estimated benchmark maxxing', unit: 'score' },
  steps: { name: 'Steps', unit: 'count', better: 'lower' },
  reportedTokens: { name: 'Reported tokens', unit: 'tokens', better: 'lower' },
} as const;
export default {
  benchmark:'maxxbench',url,feed:url,
  terms:'The makers publish this public results table; robots.txt has no restrictions and no separate extraction terms are stated.',
  stats,
  async fetch():Promise<LeaderboardRow[]> {
    const t=tables(await fetchText(url)).find(t=>t[0]?.some(c=>c.text.includes('MaxxBench Score')));
    if(!t || t[0].length!==5)throw new Error('MaxxBench results columns changed');
    const rows=t.slice(1).map(r=>{
      const effort=r[0].text.match(/\s+(max|xhigh|high|medium|low|minimal|none)$/i);
      const s=r[4].text; const tok=s.match(/Tokens:\s*([\d.]+)([kKmM]?)/);
      const metrics:Record<string,number>={estimatedBenchMaxxing:num(r[3].text)!};
      const deepswe=num(r[1].text.match(/DeepSWE\s+([\d.]+)%/i)?.[1]);if(deepswe!==undefined)metrics.deepsweScore=deepswe;
      const steps=num(s.match(/Steps:\s*([\d.]+)/)?.[1]);if(steps!==undefined)metrics.steps=steps;
      if(tok)metrics.reportedTokens=Number(tok[1])*({k:1e3,m:1e6}[tok[2].toLowerCase()]??1);
      return {model:effort?r[0].text.slice(0,effort.index):r[0].text,setting:effort?.[1],score:num(r[2].text)!,cost:num(s.match(/Cost:\s*\$([\d.]+)/)?.[1]),metrics};
    });
    if(rows.length<3 || rows.some(r=>!Number.isFinite(r.score)))throw new Error('MaxxBench model scores missing');
    return rows;
  },
} satisfies Leaderboard;
