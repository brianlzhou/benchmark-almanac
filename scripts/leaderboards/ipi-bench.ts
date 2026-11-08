// IPI Bench (General Analysis): one-query attack success rate on all 34 workplace tasks,
// in percent, lower is better. Figure 1 reports the reviewed results in a static ARIA table.
// The other whole-benchmark attack budgets are metrics, not extra headline rows. Clean-run
// objective scores, costs and total tokens describe un-attacked workflows, so their distinct
// denominators stay explicit in metrics; they are not attack-run cost or output-token fields.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, text } from '../lib/html.ts';

const PAGE = 'https://ipibench.generalanalysis.com';
const board: Leaderboard = {
  benchmark: 'ipi-bench',
  url: PAGE,
  feed: `${PAGE} (Figure 1, One query; clean-workflow table for diagnostics)`,
  terms: 'General Analysis publishes this public research report; no separate reuse license or terms link appears on the report.',
  chart: {
    title: 'Main objective score against single-query attack success',
    x: { key: 'score', label: 'Attack success rate', unit: '%', better: 'lower' },
    y: { key: 'cleanObjective', label: 'Main objective score without injected material', unit: '%', better: 'higher' },
    note: 'Agents receive the main objective score in separate runs without injected material.',
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const figure = html.match(/<div class="lbd" role="table" aria-label="Attack success rate by model"[\s\S]*?<\/figure>/)?.[0];
    if (!figure) throw new Error('IPI Bench headline table missing');
    const clean = tables(html).find(t => t[0]?.map(c => c.text).join('|') === 'Model|Main objective score|Cost|Total tokens');
    if (!clean) throw new Error('IPI Bench clean workflow table missing');
    const cleanByModel = new Map(clean.slice(1).map(r => [r[0].text,r]));
    const out: LeaderboardRow[] = [];
    for (const match of figure.matchAll(/<div class="lbd-row" role="row">([\s\S]*?)<\/div>/g)) {
      const tr = match[1];
      const model = text(tr.match(/<span role="rowheader"[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? '');
      const values = [...tr.matchAll(/<span role="cell" class="lbd-num(?: strong)?">([\d.]+)%<span class="lbd-pm">±(?:<!-- -->)?([\d.]+)/g)];
      if (!model || values.length !== 3) throw new Error('IPI Bench invalid headline row');
      const score = Number(values[0][1]);
      const margin = Number(values[0][2]);
      const metrics: Record<string, number> = { ciLow: Math.max(0,score-margin), ciHigh: Math.min(100,score+margin),
        asr11: Number(values[1][1]), asrIterative: Number(values[2][1]) };
      const c = cleanByModel.get(model);
      if (c) {
        const objective = num(c[1].text), cost = num(c[2].text), tok = c[3].text.match(/^([\d.]+)([MK])$/i);
        if (objective !== undefined) metrics.cleanObjective = objective;
        if (cost !== undefined) metrics.cleanCost = cost;
        if (tok) metrics.cleanTotalTokens = Number(tok[1]) * (tok[2].toUpperCase() === 'M' ? 1e6 : 1e3);
      }
      out.push({ model, score, setting: 'medium effort; one-query attack', metrics });
    }
    if (!out.length) throw new Error('IPI Bench has no rows');
    return out;
  },
};
export default board;
