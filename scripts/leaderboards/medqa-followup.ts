// MedQA-Followup shows how medical answer accuracy changes after eight interventions.
// Its default chart gives each model's worst change in percentage points. A loss of accuracy has a negative sign.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAt } from '../lib/html.ts';

const url = 'https://bmanczak.github.io/MedQA-MultiTurnRobustness/';
const feed = url + 'chart.html';
interface Trace { name: string; x: string[]; y: number[]; customdata?: (string | number)[][] }
const board: Leaderboard = {
  benchmark: 'medqa-followup', url, feed,
  terms: 'Public Plotly chart published by the MedQA robustness study authors.',
  aliases: { 'anthropic_claude-opus-4-5-20251101': 'claude-opus-4-5', 'gemini_gemini-3-pro-preview': 'gemini-3-pro' },
  async fetch() {
    const html = await fetchText(feed);
    const plot = html.lastIndexOf('Plotly.newPlot(');
    if (plot < 0) throw new Error('Missing MedQA chart');
    const traces = jsonAt<Trace[]>(html, html.indexOf('[', plot));
    const worst = traces.find(t => t.name === 'Worst Drop');
    const interventions = traces.filter(t => !['Worst Drop', 'Category Labels', 'Average'].includes(t.name));
    if (!worst || worst.x.length < 17 || interventions.length < 8) throw new Error('Incomplete MedQA chart');
    board.parts = Object.fromEntries(interventions.map(t => [t.name, t.name]));
    return worst.x.map((label, i) => {
      const metrics: Record<string, number> = {};
      for (const t of [...interventions, ...traces.filter(t => t.name === 'Average')]) {
        const at = t.x.indexOf(label);
        if (at < 0 || !Number.isFinite(t.y[at])) throw new Error('Missing MedQA intervention for ' + label);
        metrics[t.name] = t.y[at];
        const flip = t.customdata?.[at]?.[0];
        if (typeof flip === 'number') metrics[t.name + ' flip rate'] = flip;
      }
      if (!Number.isFinite(worst.y[i])) throw new Error('Missing worst drop');
      const effort = label.match(/ \((low|medium|high)\)$/);
      return { model: effort ? label.slice(0, effort.index) : label, setting: effort?.[1], score: worst.y[i], metrics };
    });
  },
};
export default board;
