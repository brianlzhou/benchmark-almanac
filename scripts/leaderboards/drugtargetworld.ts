// DrugTargetWorld ranks agents by their mean benchmark score on simulated biobank investigations.
// The official results table gives the overall score, its components and the cost per episode.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, text } from '../lib/html.ts';

const url = 'https://drugtargetworld.vercel.app/';
const headers = ['#', 'Model', 'Overall', 'Target ID', 'Phenotype', 'Direction', 'Best', 'Cost/ep', 'Serving'];
const board: Leaderboard = {
  benchmark: 'drugtargetworld', url, feed: url,
  terms: 'Public project leaderboard. The authors release the project under the MIT license.',
  parts: { target: 'Target ID', phenotype: 'Phenotype', direction: 'Direction' },
  aliases: { 'Qwen3-Coder-30B': 'qwen3-coder-30b-a3b-instruct', 'Devstral-Small': 'devstral-small-1-1', 'Opus 5': 'claude-opus-5', 'Sonnet 5': 'claude-sonnet-5', 'Haiku 4.5': 'claude-haiku-4-5' },
  async fetch() {
    const t = tables(await fetchText(url)).find(t => headers.every((name, i) => t[0]?.[i]?.text.replace(/[↓↑]/g, '').trim() === name));
    if (!t || t.length < 10) throw new Error('Missing DrugTargetWorld results');
    return t.slice(1).map(c => {
      const [model, revision] = [...c[1].html.matchAll(/<span[^>]*>(.*?)<\/span>/gs)].map(m => text(m[1]));
      const values = c.slice(2, 8).map(cell => /^\$?\d+(\.\d+)?$/.test(cell.text) ? Number(cell.text.replace('$', '')) : NaN);
      if (!model || !revision || values.length !== 6 || !values.every(Number.isFinite)) throw new Error('Invalid DrugTargetWorld row');
      const [score, target, phenotype, direction, best, cost] = values;
      return { model, score, cost, setting: [c[8].text, revision].join(' '), metrics: { target, phenotype, direction, best } };
    });
  },
};
export default board;
