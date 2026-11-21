// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// The makers' spreadsheet reports schema compliance and JSON validity by difficulty.
// Parentheses contain uncertainty percentages. The spreadsheet does not label their statistical interpretation.
import type { Leaderboard } from './types.ts';
import { fetchText, parseCsv } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const sheet = 'https://docs.google.com/spreadsheets/d/1gloUwsKiiOgrBmxbNluh-2_-vV_6RgaPji6KAD52pv0';
const feed = sheet + '/export?format=csv';
const board: Leaderboard = {
  benchmark: 'jsonschemabench', url: sheet + '/edit', feed,
  terms: 'The authors publish this spreadsheet through their leaderboard repository. https://github.com/epfl-dlab/jsonschemabench-leaderboard',
  parts: { Easy: 'Easy', Medium: 'Medium', Hard: 'Hard' },
  aliases: { 'Qwen/Qwen2.5-Coder-3B-Instruct': 'qwen2-5-coder-3b-instruct' },
  async fetch() {
    const csv = await fetchText(feed);
    const header = 'Model,Dataset,Schema Compliance (%),JSON Validity (%)';
    const start = csv.indexOf(header);
    if (start < 0) throw new Error('Missing schema compliance columns');
    const models = new Map<string, Record<string, number>>();
    for (const r of parseCsv(csv.slice(start))) {
      const metrics = models.get(r.Model) ?? {};
      const part = r.Dataset;
      if (!['Easy', 'Medium', 'Hard'].includes(part) || part in metrics) throw new Error('Unexpected difficulty for ' + r.Model);
      for (const [column, suffix] of [['Schema Compliance (%)', ''], ['JSON Validity (%)', 'Validity']]) {
        const match = r[column]?.trim().match(/^([\d.]+)%\s*\(([\d.]+)%\)$/);
        if (!match) throw new Error('Invalid percentage in ' + column);
        metrics[part + suffix] = Number(match[1]);
        metrics[part + suffix + 'Uncertainty'] = Number(match[2]);
      }
      models.set(r.Model, metrics);
    }
    const rows = [...models].filter(([, m]) => [m.Easy, m.Medium, m.Hard].every(Number.isFinite))
      .map(([model, metrics]) => ({ model, score: (metrics.Easy + metrics.Medium + metrics.Hard) / 3, metrics }));
    return checked(rows, 15);
  },
};
export default board;
