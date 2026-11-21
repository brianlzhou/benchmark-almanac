// Full-suite pass@1 and dollar payouts from the main and open-weight model comparisons.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
const URL = 'https://arxiv.org/html/2502.12115';
const money = (s: string) => parseFloat(s.replace('$', '')) * (/M/.test(s) ? 1e6 : /k/.test(s) ? 1e3 : 1);
const models: Record<string, string> = {'GPT-4o': 'gpt-4o-2024-08-06', 'o1': 'o1', '3.5 Sonnet': 'claude-3-5-sonnet-20240620'};
const board: Leaderboard = {
  benchmark: 'swe-lancer', static: 'paper', parts: {
  'IC SWE (Full)': { name: 'IC SWE full', group: 'Task type' },
  'SWE Manager (Full)': { name: 'SWE manager full', group: 'Task type' },
}, url: URL, feed: URL + ' (SWE-Lancer Full pass@1)', terms: PAPER_TERMS,
  aliases: {'claude-3-5-sonnet-20240620': 'claude-3-5-sonnet'},
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(URL));
    const t = tables.find(t => t[0]?.[3] === 'Reasoning Effort');
    if (!t) throw new Error('SWE-Lancer main table missing');
    const extra = tables.find(t=>t[0]?.[3]==='pass@1' && t.some(r=>r[0]==='Deepseek-R1'));
    const all = [...t.slice(1),...(extra?.slice(1) ?? []).map(r=>[...r.slice(0,3),'N/A',...r.slice(3)])];
    const rows = all.filter(r => r[2].replaceAll('‑','-') === 'SWE-Lancer Full').map(r => {
      const metrics: Record<string, number> = {dollarsEarned: money(r[5].split('/')[0]), totalPayout: money(r[5].split('/')[1]), earnRate: parseFloat(r[6])};
      for (const domain of ['IC SWE (Full)', 'SWE Manager (Full)']) {
        const sub = all.find(x => x[0] === r[0] && x[2] === domain);
        if (sub) {
          const prefix = domain.startsWith('IC') ? 'ic' : 'manager';
          metrics[domain] = parseFloat(sub[4]);
          metrics[prefix+'DollarsEarned'] = money(sub[5].split('/')[0]);
          metrics[prefix+'TotalPayout'] = money(sub[5].split('/')[1]);
          metrics[prefix+'EarnRate'] = parseFloat(sub[6]);
        }
      }
      return {model: models[r[0]] ?? r[0], score: parseFloat(r[4]),open:extra?.some(x=>x[0]===r[0]) ? true : undefined,params:r[0]==='Llama 3.3 70B'?70:undefined,
        setting: 'pass@1; user tool enabled' + (r[3] === 'N/A' ? '' : '; reasoning ' + r[3]), metrics};
    });
    if (rows.length < 3) throw new Error('SWE-Lancer full results missing');
    return rows;
  },
};
export default board;
