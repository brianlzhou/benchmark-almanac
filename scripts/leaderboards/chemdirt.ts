// ChemDIRT evaluates molecular reasoning under different instructions and representations.
// Tables IV through VI mix accuracy, similarity and regression errors. The first measure is exact match on IUPAC-to-SMILES translation.
import type { Leaderboard, LeaderboardRow, BoardPart } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2608.21504';
const parts: Record<string, BoardPart> = {};
function number(s: string) {
  const normalized = s.trim().replace(/\\!|\\,/g, '').replace(/\\times\s*10\^\{(-?\d+)\}/, 'e$1');
  if (!normalized || !Number.isFinite(Number(normalized))) throw new Error('Invalid reported metric: ' + s);
  return Number(normalized);
}
const board: Leaderboard = {
  benchmark: 'chemdirt', url: feed, feed, static: 'paper', parts,
  terms: 'The authors publish the benchmark results on arXiv. https://arxiv.org/abs/2608.21504',
  headline: 'The paper gives no overall score, so the headline uses its first measure, exact match for IUPAC-to-SMILES translation.',
  aliases: { Gemma2: 'gemma-2-9b', Gemma3: 'gemma-3-4b', Llama2: 'llama-2-7b', Qwen2: 'qwen2-7b-instruct', Qwen3: 'qwen3-8b' },
  async fetch() {
    const html = await paperHtml(feed);
    const tables = [...html.matchAll(/<figure id="S3.T[456]"[\s\S]*?<\/figure>/g)].flatMap(f => inlinePaperTables(f[0]));
    if (tables.length !== 9 || !tables[0][0][1].startsWith('IUPAC') || tables[0][1][1] !== 'Exact Match') throw new Error('ChemDIRT result panels changed');
    const rows = new Map<string, LeaderboardRow>();
    for (const [index, table] of tables.entries()) {
      for (const [raw, ...cells] of table.slice(2)) {
        const model = raw.split(' [')[0];
        if (index === 0 && cells[0] !== 'Unable to complete') rows.set(model, { model, score: NaN, metrics: {} });
        const row = rows.get(model);
        if (!row) continue;
        cells.forEach((cell, i) => {
          if (cell === 'Unable to complete' || cell === '–') return;
          const group = table[0][i+1].replace(/\s*\( n=.*$/, '').replace('\\rightarrow', 'to');
          const label = table[1][i+1];
          const key = (group + label).replace(/[^a-zA-Z0-9]/g, '');
          const error = /RMSE|MAE/.test(label);
          const percent = /Accuracy|Exact Match| EM$/.test(label) || group.includes('Accuracy');
          parts[key] = { name: group + ': ' + label, group, unit: percent ? '%' : 'score', ...(error ? { better: 'lower' } : {}) };
          const [value, sd] = cell.split('\\pm').map(number);
          const scale = percent ? 100 : 1;
          row.metrics![key] = value * scale;
          if (sd !== undefined) row.metrics![key + 'Std'] = sd * scale;
          if (index === 0 && i === 0) {
            row.score = value * scale;
            row.metrics!.std = sd * scale;
          }
        });
      }
    }
    return checked([...rows.values()], 21);
  },
};
export default board;
