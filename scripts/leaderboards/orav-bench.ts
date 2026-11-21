// ORAV tests audio-video generation from multiple references. Table 2 ranks systems by fitted pairwise strength
// on the 350 instances all systems delivered, with bootstrap intervals and role-specific win rates.
// Table 3 gives diagnostic measures and the overall win rate.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2609.34843';
const board: Leaderboard = {
  benchmark: 'orav-bench', url: feed, feed, static: 'paper',
  terms: 'Paper and license details at https://arxiv.org/abs/2609.34843.',
  aliases: { 'Seedance-2.5': 'dreamina-seedance-2-5', 'Seedance-2.0': 'dreamina-seedance-2-0', 'Wan3.0-Video': 'wan3-0' },
  async fetch() {
    const html = (await paperHtml(feed)).replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '');
    const tables = paperTables(html).map(grid);
    const t = tables.find(t => t[1]?.join() === '#,System,Strength,95% CI,Subj.,Prop,Scene,Style,Motion,Cam.,VFX,Speech,Music');
    const d = tables.find(t => t[1]?.[1] === 'Comp. z' && t[1].at(-1) === 'Win rate');
    if (!t || !d) throw new Error('Missing ORAV ranking or diagnostics');
    const roles = ['Subject','Prop','Scene','Style','Motion','Camera movement','VFX','Speech','Music'];
    board.parts = Object.fromEntries(roles.map((name,i) => [name.replaceAll(' ', ''), {name, group:t[0][i+4], unit:'%'}]));
    const num = (v: string) => numberCell(v.replace(/^\+/, ''));
    const keys = ['visualQualityZ','technicalQuality','aestheticPredictor','subjectAffinity','sceneAffinity','productionQuality','voice','cer','wer','winRate'];
    return checked(t.slice(2).map(r => {
      const ci = r[3].match(/^\[([+-]?\d+\.\d+),\s*([+-]?\d+\.\d+)\]$/);
      const diag = d.find(a => a[0] === r[1]);
      if (!ci || !diag || diag.length !== keys.length+1) throw new Error('Missing interval or diagnostics for ' + r[1]);
      const metrics = Object.fromEntries(roles.map((name,i) => [name.replaceAll(' ', ''), num(r[4+i])]));
      keys.forEach((key,i) => { metrics[key] = num(diag[i+1]); });
      return { model:r[1], score:num(r[2]), low:num(ci[1]), high:num(ci[2]), metrics };
    }), 5);
  },
};
export default board;
