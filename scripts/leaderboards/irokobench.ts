// IrokoBench averages three tasks across African languages. The authors compare in-language prompts with translated tests.
// Table 2 in their paper reports the average for both settings and each component score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const feed = "https://arxiv.org/html/2406.03368";


const board: Leaderboard = {
  benchmark: "irokobench", static: 'paper',
  stats: { englishAverage: { name: 'English average', unit: '%', better: 'higher' }, frenchAverage: { name: 'French average', unit: '%', better: 'higher' } },
  url: "https://9jabench.com/",
  feed,
  terms: "The authors publish the main results in their public paper. The arXiv HTML article is publicly accessible.",
  parts: { xnli: 'AfriXNLI', mmlu: 'AfriMMLU', mgsm: 'AfriMGSM' },
  async fetch() {
    const all = tables(await fetchText(feed)).map(t=>t.map(r=>r.map(c=>c.text)));
    const table = all.find(t=>t[0]?.slice(2,6).join('|') === 'AfriXNLI|AfriMMLU|AfriMGSM|Ave.' && t[1]?.length === 12);
    if (!table || table[1][8] !== 'in-' || table[1][9] !== 'translate') throw new Error('Missing IrokoBench averages');
    const rows: LeaderboardRow[] = [];
    for (const r of table.slice(3)) {
      if (!r[0] || !r[8]) continue;
      for (const [j,setting] of ['in-language','translate-test'].entries()) {
        const scores = [r[8+j],r[2+j],r[4+j],r[6+j]];
        if (!scores.every(v => v && Number.isFinite(Number(v)))) throw new Error('Incomplete result for '+r[0]);
        rows.push({ model: r[0], setting, score: Number(r[8+j]), params: r[1].endsWith('B') ? parseFloat(r[1]) : undefined,
          metrics: { xnli:Number(r[2+j]), mmlu:Number(r[4+j]), mgsm:Number(r[6+j]), englishAverage:Number(r[10]), frenchAverage:Number(r[11]) } });
      }
    }
    if (rows.length < 32) throw new Error('Expected 16 models in two settings');
    return rows;
  },
};
export default board;
