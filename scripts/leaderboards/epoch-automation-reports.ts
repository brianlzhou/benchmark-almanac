// Epoch Automation Reports (Epoch AI). The benchmark is not in Epoch's benchmark_data.zip, so this reads its
// hub page, epoch.ai/benchmarks/epoch-automation-reports. The server-rendered heatmap "Rubric scores by
// system and task category" has one row per system (model and agent harness) and a cell per task category
// plus an Average cell; each cell's aria-label carries the value to one decimal ("Grok 4.6 (Grok Build),
// average: 59.1%"). The average, the mean rubric score across the five categories, is the score.
// Individual published task examples are excluded from benchmark scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const PAGE = 'https://epoch.ai/benchmarks/epoch-automation-reports';

const EPOCH_CATS: Record<string, string> = {
  'Graphic design': 'graphicDesign',
  'Data insight generation': 'dataInsight',
  'AI data center research': 'aiDataCenter',
  Research: 'research',
};

const board: Leaderboard = {
  benchmark: 'epoch-automation-reports',
  parts: {
    graphicDesign: { name: 'Graphic design', group: 'Category' },
    dataInsight: { name: 'Data insight generation', group: 'Category' },
    aiDataCenter: { name: 'AI data center research', group: 'Category' },
    research: { name: 'Research', group: 'Category' },
  },
  url: PAGE,
  feed: `${PAGE} (server-rendered heatmap, average cells)`,
  terms: 'Server-rendered Epoch AI page (robots.txt allows /benchmarks/); Epoch publishes its benchmark data under CC BY 4.0.',
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const byKey = new Map<string, { model: string; harness: string; score?: number; metrics: Record<string, number> }>();
    for (const m of html.matchAll(/aria-label="([^"(]+?)\s*\(([^)]+)\),\s*([^:]+):\s*([\d.]+)%"/g)) {
      const model = m[1].trim();
      const harness = m[2].trim();
      const label = m[3].trim();
      const v = num(m[4]);
      if (v === undefined) continue;
      const key = `${model}|${harness}`;
      const entry = byKey.get(key) ?? { model, harness, metrics: {} };
      if (label === 'average') entry.score = v;
      else if (EPOCH_CATS[label]) entry.metrics[EPOCH_CATS[label]] = v;
      byKey.set(key, entry);
    }
    const rows: LeaderboardRow[] = [];
    for (const e of byKey.values()) {
      if (e.score === undefined) continue;
      rows.push({
        model: e.model,
        score: e.score,
        harness: e.harness,
        metrics: Object.keys(e.metrics).length ? e.metrics : undefined,
      });
    }
    if (!rows.length) throw new Error('no average cells on the Epoch Automation Reports page');
    return rows;
  },
};
export default board;
