// Full-task pass requires every F2P and P2P check in the same run. Test pass rates are metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const url='https://tokenwave-ai.github.io/swe-cowork-page';
export default {
  benchmark:'swe-cowork',url,feed:url,
  terms:'The authors publish this table on their project page; robots.txt has no restrictions and no separate extraction terms are stated.',
  async fetch():Promise<LeaderboardRow[]> {
    const t=tables(await fetchText(url)).find(t=>t[0]?.some(c=>c.text.startsWith('Full-task pass')));
    if(!t || t[0].length!==5)throw new Error('SWE-CoWork results columns changed');
    const rows=t.slice(1).map(r=>({model:r[1].text,score:num(r[4].text)!,setting:'CoWork; 101 tasks',metrics:{f2p:num(r[2].text)!,p2p:num(r[3].text)!}}));
    if(rows.length<3 || rows.some(r=>!Number.isFinite(r.score)))throw new Error('SWE-CoWork full-task scores missing');
    return rows;
  },
} satisfies Leaderboard;
