// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// WRENCH tests disruption recovery on services through retained throughput after four fault kinds.
// This importer reads the makers' first-results table and keeps each fault kind in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const feed = 'https://raw.githubusercontent.com/nicknjpconsultingllc/wrench/main/docs/writeup.md';
const parts = ['entity_destruction', 'belt_cut', 'resource_exhaustion', 'adaptive_strike'];
const board: Leaderboard = {
  benchmark: 'wrench-compose',
  url: 'https://github.com/nicknjpconsultingllc/wrench/blob/main/docs/writeup.md',
  feed,
  headline: 'The paper reports no overall score, so this is the plain mean of its four fault-kind throughput-retention scores.',
  parts: Object.fromEntries(parts.map(name => [name, { name: name.replaceAll('_', ' '), group: 'Fault kind' }])),
  terms: 'The WRENCH repository is published under its repository license. https://github.com/nicknjpconsultingllc/wrench',
  async fetch() {
    const source = await fetchText(feed);
    const section = source.split('## First results')[1]?.split('**Connection-pool exhaustion')[0];
    if (!section) throw new Error('Missing WRENCH first-results table');
    const values = new Map<string, Record<string, number>>();
    for (const line of section.split('\n')) {
      if (!line.trim().startsWith('|') || line.includes('---') || /kind\s*\|/i.test(line)) continue;
      const cells = line.trim().split('|').slice(1).map(cell => cell.trim());
      const kind = cells[0];
      if (!parts.includes(kind)) continue;
      for (let i = 1; i <= 3; i++) {
        const model = ['Claude Sonnet 5', 'GPT-5.1', 'Gemini 2.5 Pro'][i - 1];
        const value = Number(cells[i]?.match(/^\d+(?:\.\d+)?/)?.[0]);
        if (Number.isFinite(value)) values.set(model, { ...(values.get(model) ?? {}), [kind]: value });
      }
    }
    const rows: LeaderboardRow[] = [];
    for (const [model, metrics] of values) {
      if (parts.some(part => !Number.isFinite(metrics[part]))) continue;
      const score = parts.reduce((sum, part) => sum + metrics[part], 0) / parts.length;
      rows.push({ model, score, trials: 20, metrics });
    }
    if (rows.length !== 3) throw new Error(`Expected three WRENCH model rows, got ${rows.length}`);
    return rows;
  },
};
export default board;
