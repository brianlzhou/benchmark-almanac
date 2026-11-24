// HyperLogic — Tencent Hunyuan forward-authored Chinese logical reasoning benchmark.
// Reads the frontier leaderboard markdown table in Tencent-Hunyuan/HyperLogic README.
// Verbatim source note: "Accuracy (%) on the full benchmark, mean ± standard deviation over three rollouts, every model at its highest reasoning setting. Grok 4.6 runs at xhigh, every other model at max. Models are ranked by Base item accuracy."

import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/Tencent-Hunyuan/HyperLogic/main/README.md';

function parseMeanSd(cell: string): { mean: number; sd?: number } | null {
  const clean = cell.replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '').replace(/[*_`†]/g, '').trim();
  const m = clean.match(/(-?\d+(?:\.\d+)?)\s*(?:±|\+\/-)\s*(-?\d+(?:\.\d+)?)/);
  if (m) return { mean: Number(m[1]), sd: Number(m[2]) };
  const single = clean.match(/(-?\d+(?:\.\d+)?)/);
  return single ? { mean: Number(single[1]) } : null;
}

const board: Leaderboard = {
  benchmark: 'hyperlogic',
  feed: FEED,
  url: 'https://github.com/Tencent-Hunyuan/HyperLogic',
  terms: 'Public repository README published by Tencent Hunyuan.',
  parts: {
    seed: { name: 'Seed', group: 'Tier' },
    baseSubQ: { name: 'Base Sub-Q', group: 'Tier' },
    hardDirect: { name: 'Hard Direct', group: 'Hard tier' },
    hardSandbox: { name: 'Hard Sandbox', group: 'Hard tier' },
    hardLibrary: { name: 'Hard + Library', group: 'Hard tier' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const md = await fetchText(FEED);
    const lines = md.split(/\r?\n/);
    const hdrIdx = lines.findIndex((l) => /\|\s*Rank\s*\|\s*Model\s*\|.*Base Item.*Hard \+ Library/i.test(l));
    if (hdrIdx < 0) throw new Error('HyperLogic leaderboard table not found in README');

    const rows: LeaderboardRow[] = [];
    for (let i = hdrIdx + 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line.startsWith('|')) break;
      const cells = line
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((c) => c.trim());
      if (cells.length < 8) continue;
      const model = cells[1].replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '').replace(/[*_`†]/g, '').trim();
      const baseItem = parseMeanSd(cells[3]);
      if (!model || !baseItem) continue;
      const metrics: Record<string, number> = {};
      if (baseItem.sd !== undefined) metrics.std = baseItem.sd;
      const seed = parseMeanSd(cells[2]);
      const baseSubQ = parseMeanSd(cells[4]);
      const hardDirect = parseMeanSd(cells[5]);
      const hardSandbox = parseMeanSd(cells[6]);
      const hardLibrary = parseMeanSd(cells[7]);
      if (seed) metrics.seed = seed.mean;
      if (baseSubQ) metrics.baseSubQ = baseSubQ.mean;
      if (hardDirect) metrics.hardDirect = hardDirect.mean;
      if (hardSandbox) metrics.hardSandbox = hardSandbox.mean;
      if (hardLibrary) metrics.hardLibrary = hardLibrary.mean;
      rows.push({
        model,
        score: baseItem.mean,
        trials: 3,
        setting: /Grok\s*4\.6/i.test(model) ? 'xhigh' : 'max',
        metrics,
      });
    }

    if (rows.length < 5) throw new Error(`HyperLogic parsed only ${rows.length} rows`);
    return rows;
  },
};

export default board;
