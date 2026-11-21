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
  stats: {
    'Authority Prior': { name: 'Authority prior change', unit: 'score' }, 'Authority Prior flip rate': { name: 'Authority prior flip rate', unit: '%', better: 'lower' },
    'Autograder Prior': { name: 'Autograder prior change', unit: 'score' }, 'Autograder Prior flip rate': { name: 'Autograder prior flip rate', unit: '%', better: 'lower' },
    'Commitment Alignment': { name: 'Commitment alignment change', unit: 'score' }, 'Commitment Alignment flip rate': { name: 'Commitment alignment flip rate', unit: '%', better: 'lower' },
    'Recency Prior': { name: 'Recency prior change', unit: 'score' }, 'Recency Prior flip rate': { name: 'Recency prior flip rate', unit: '%', better: 'lower' },
    'Social Proof Prior': { name: 'Social proof prior change', unit: 'score' }, 'Social Proof Prior flip rate': { name: 'Social proof prior flip rate', unit: '%', better: 'lower' },
    'RAG-Style': { name: 'RAG-style change', unit: 'score' }, 'RAG-Style flip rate': { name: 'RAG-style flip rate', unit: '%', better: 'lower' },
    'Alternative': { name: 'Alternative change', unit: 'score' }, 'Alternative flip rate': { name: 'Alternative intervention flip rate', unit: '%', better: 'lower' },
    'Edge Case': { name: 'Edge case change', unit: 'score' }, 'Edge Case flip rate': { name: 'Edge case flip rate', unit: '%', better: 'lower' },
    Average: { name: 'Average change', unit: 'score' }, 'Average flip rate': { name: 'Average intervention flip rate', unit: '%', better: 'lower' },
  },
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
