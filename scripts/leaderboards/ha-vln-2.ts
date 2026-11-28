// HA-VLN 2.0 leaderboard table from the project page.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const URL = 'https://uwmilab.github.io/HA-VLN-webpage/';

function parseNum(raw: string): number | undefined {
  const m = raw.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  if (!m) return undefined;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : undefined;
}

const board: Leaderboard = {
  benchmark: 'ha-vln-2',
  url: URL,
  feed: URL,
  terms: 'The HA-VLN 2.0 authors publish the benchmark leaderboard table publicly on the project website.',
  headline: 'Composite score combining navigation performance and social compliance (100 times navigation times 0.70 plus 0.30 times social).',
  stats: {
    successRate: { name: 'Success rate', unit: '%', better: 'higher' },
    navigationError: { name: 'Navigation error', unit: 'score', better: 'lower', note: 'Final Euclidean distance to the goal in meters.' },
    collisionRate: { name: 'Collision rate', unit: '%', better: 'lower' },
    totalCollisionCount: { name: 'Total collision count', unit: 'count', better: 'lower', note: 'Mean number of collisions per episode.' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(URL);
    const tableMatch = html.match(/<table[\s\S]*?<\/table>/i);
    if (!tableMatch) throw new Error('HA-VLN 2.0 leaderboard table not found');

    const rows: LeaderboardRow[] = [];
    const rowRe = /<tr[^>]*class="[^"]*lb-row[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
    for (const m of tableMatch[0].matchAll(rowRe)) {
      const tr = m[1];
      const modelHtml = tr.match(/<span[^>]*class="[^"]*lb-model-name[^"]*"[^>]*>([\s\S]*?)<\/span>/i)?.[1];
      const instHtml = tr.match(/<span[^>]*class="[^"]*lb-model-inst[^"]*"[^>]*>([\s\S]*?)<\/span>/i)?.[1];
      const tagHtml = tr.match(/<span[^>]*class="[^"]*lb-tag(?:\s[^"]*)?"[^>]*>([\s\S]*?)<\/span>/i)?.[1];
      const tagSubHtml = tr.match(/<span[^>]*class="[^"]*lb-tag-sub[^"]*"[^>]*>([\s\S]*?)<\/span>/i)?.[1];
      const scoreHtml = tr.match(/<td[^>]*class="[^"]*lb-col-score[^"]*"[^>]*>([\s\S]*?)<\/td>/i)?.[1];
      const metricCells = [...tr.matchAll(/<td[^>]*class="[^"]*lb-col-metric[^"]*"[^>]*>([\s\S]*?)<\/td>/gi)].map((x) => text(x[1]));

      const model = modelHtml ? text(modelHtml) : '';
      const score = scoreHtml ? parseNum(text(scoreHtml)) : undefined;
      if (!model || score === undefined) continue;

      const submitter = instHtml ? text(instHtml) : undefined;
      const settingParts = [tagHtml ? text(tagHtml) : '', tagSubHtml ? text(tagSubHtml).replace(/\s*·\s*/g, ', ') : ''].filter(Boolean);
      const setting = settingParts.length ? settingParts.join(', ') : undefined;

      const metrics: Record<string, number> = {};
      const sr = metricCells[0] !== undefined ? parseNum(metricCells[0]) : undefined;
      const ne = metricCells[1] !== undefined ? parseNum(metricCells[1]) : undefined;
      const cr = metricCells[2] !== undefined ? parseNum(metricCells[2]) : undefined;
      const tcr = metricCells[3] !== undefined ? parseNum(metricCells[3]) : undefined;
      if (sr !== undefined) metrics.successRate = sr;
      if (ne !== undefined) metrics.navigationError = ne;
      if (cr !== undefined) metrics.collisionRate = cr;
      if (tcr !== undefined) metrics.totalCollisionCount = tcr;

      rows.push({
        model,
        score,
        ...(setting ? { setting } : {}),
        ...(submitter ? { submitter } : {}),
        ...(Object.keys(metrics).length ? { metrics } : {}),
      });
    }

    if (rows.length < 8) {
      throw new Error(`Expected at least 8 rows on HA-VLN 2.0 leaderboard, got ${rows.length}`);
    }
    return rows;
  },
};

export default board;
