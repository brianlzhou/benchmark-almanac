// OPT-RSVG evaluates visual grounding on 24,477 aerial remote-sensing referring expression
// test pairs. This importer reads the official test-set comparison table from the authors'
// GitHub repository README, capturing Pr@0.5 accuracy alongside Pr@0.6 through Pr@0.9,
// meanIoU, and cumIoU across ten visual grounding models.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://raw.githubusercontent.com/like413/OPT-RSVG/main/README.md';

function parseCell(raw: string): number {
  const cleaned = raw
    .replace(/\*\*/g, '')
    .replace(/\\textcolor\{[^}]+\}\{([^}]+)\}/g, '$1')
    .trim();
  const n = Number(cleaned);
  if (!Number.isFinite(n)) throw new Error(`OPT-RSVG unexpected numeric cell: "${raw}"`);
  return n;
}

const board: Leaderboard = {
  benchmark: 'opt-rsvg',
  static: 'paper',
  url: 'https://github.com/like413/OPT-RSVG',
  feed: FEED,
  terms: 'Public official GitHub repository README. Scores remain credited to Li et al. (IEEE TGRS 2024).',
  headline: 'Headline is Pr@0.5 visual grounding accuracy in percent on the OPT-RSVG test set.',
  stats: {
    pr06: { name: 'Pr@0.6', unit: '%', better: 'higher' },
    pr07: { name: 'Pr@0.7', unit: '%', better: 'higher' },
    pr08: { name: 'Pr@0.8', unit: '%', better: 'higher' },
    pr09: { name: 'Pr@0.9', unit: '%', better: 'higher' },
    meanIou: { name: 'Mean IoU', unit: '%', better: 'higher' },
    cumIou: { name: 'Cumulative IoU', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const res = await fetch(FEED, {
      headers: { 'user-agent': 'benchmark-almanac (+https://github.com/brianlzhou/benchmark-almanac)' },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`OPT-RSVG README fetch failed: ${res.status}`);
    const md = await res.text();

    const start = md.indexOf('on the test set of OPT-RSVG');
    const end = md.indexOf('on the test set of DIOR-RSVG', start);
    if (start < 0 || end < 0) throw new Error('OPT-RSVG test-set table missing in README');
    const block = md.slice(start, end);

    const rows: LeaderboardRow[] = [];
    const seen = new Map<string, number>();

    for (const line of block.split('\n')) {
      if (!line.trim().startsWith('|')) continue;
      const cells = line.split('|').slice(1, -1).map((c) => c.trim());
      if (cells.length < 11) continue;
      const name = cells[0].replace(/\*\*/g, '').trim();
      if (!name || name === 'Methods' || /^-+$/.test(name) || name.endsWith(':')) continue;

      const visual = cells[2].trim();
      const lang = cells[3].trim();
      const count = (seen.get(name) ?? 0) + 1;
      seen.set(name, count);

      rows.push({
        model: name,
        setting: `${visual} + ${lang}`,
        score: parseCell(cells[4]),
        metrics: {
          pr06: parseCell(cells[5]),
          pr07: parseCell(cells[6]),
          pr08: parseCell(cells[7]),
          pr09: parseCell(cells[8]),
          meanIou: parseCell(cells[9]),
          cumIou: parseCell(cells[10]),
        },
      });
    }

    return checked(rows, 10);
  },
};

export default board;
