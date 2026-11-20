// Published full-benchmark paper results. Subscores stay in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, uncertain, checked } from '../lib/boards/arxiv-span-tables.ts';
import { num } from '../lib/html.ts';
const feed='https://arxiv.org/html/2402.11548';
export default {
  benchmark:'kmmlu', parts: {
  appliedScience: { name: 'Applied science', group: 'Domain' },
  other: { name: 'Other', group: 'Domain' },
  stem: { name: 'STEM', group: 'Domain' },
  humss: { name: 'Humanities and social science', group: 'Domain' },
},url:'https://arxiv.org/abs/2402.11548',feed,terms:PAPER_TERMS,
  async fetch():Promise<LeaderboardRow[]> {
    const ts=flatPaperTables(await paperHtml(feed)).map(grid);
    const t=ts.find(t=>t[0]?.join('|')==='Model|STEM|Applied Science|HUMSS|Other|Average');
    if(!t)throw new Error('KMMLU full test table missing');
    const rows=t.slice(1).filter(r=>/^\d+(?:\.\d+)?$/.test(r[5])).map(r=>({model:uncertain(r[0].endsWith("-Chat") ? r[0]+" (chat weights)" : r[0]),score:Number(r[5]),setting:'5-shot; Direct',metrics:{stem:Number(r[1]),appliedScience:Number(r[2]),humss:Number(r[3]),other:Number(r[4])}}));
    return checked(rows,3);
  },
} satisfies Leaderboard;
