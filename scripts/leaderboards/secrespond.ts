// SecRespond measures investigation and remediation planning on compromised-host evidence.
// Table 4 publishes overall detection and planning percentages separately.
// Claude Opus 4.7 has a published nine-range average because it declined the tenth range.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://arxiv.org/html/2607.26791';
const ranges = ['SSH-Miner', 'Redis-RCE', 'Docker-Escape', 'Jenkins-RCE', 'Shiro-Fastjson',
  'Log4j-RCE', 'Next.js-RCE', 'NPM-Worm', 'ASP.NET-ViewState', 'RDP-Service-Abuse'];
export default {
  benchmark: 'secrespond', static: 'paper', url, feed: url,
  terms: 'The authors publish Table 4 on arXiv. https://arxiv.org/abs/2607.26791',
  headline: 'The headline is the published overall detection percentage. The paper scores planning separately.',
  parts: Object.fromEntries([{ key: 'plan', name: 'Overall planning', unit: '%' },
    ...ranges.flatMap((name, i) => ['Detection', 'Planning'].map(axis =>
      ({ key: axis.toLowerCase() + (i + 1), name: name + ' ' + axis.toLowerCase(), unit: '%' as const })))].map(({ key, ...part }) => [key, part])),
  async fetch() {
    const table = paperTables(await paperHtml(url)).map(grid).find(t =>
      t[0]?.[1] === 'SSH-Miner' && t[0]?.[21] === 'Overall' && t[0]?.[22] === 'Overall');
    if (!table || !table[1].slice(1).every((s, i) => s === (i % 2 ? 'Plan' : 'Det')))
      throw new Error('Missing SecRespond detection and planning table');
    const num = (s: string) => {
      if (!/^\d+(?:\.\d+)?$/.test(s)) throw new Error('Unexpected Table 4 score: ' + s);
      return Number(s);
    };
    const rows = table.slice(2).map(c => {
      const partial = c[0].endsWith('†');
      const metrics: Record<string, number> = { plan: num(c[22]) };
      ranges.forEach((_, i) => {
        if (partial && i === 7 && c[15] === '—' && c[16] === '—') return;
        metrics['detection' + (i + 1)] = num(c[2*i + 1]);
        metrics['planning' + (i + 1)] = num(c[2*i + 2]);
      });
      return { model: c[0].replace(/\s*†$/, ''), score: num(c[21]), metrics,
        setting: partial ? 'Nine ranges with responses' : undefined };
    });
    return checked(rows, 23);
  },
} satisfies Leaderboard;
