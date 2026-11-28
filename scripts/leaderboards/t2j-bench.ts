// T2J-Bench — Google Cloud AI Research, Google DeepMind, and UIUC PyTorch-to-JAX migration benchmark.
// Live HTML table at https://ft2023.github.io/T2j-web/ (21 evaluated model-harness configurations).
// Verbatim source caption: "Three-seed mean scores on all 63 tasks. Reward shows sample standard deviation; higher is better. Train and Serve are subset rewards."

import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const FEED = 'https://ft2023.github.io/T2j-web/';

const HARNESS_NAMES: Record<string, string> = {
  'Claude-Code': 'Claude Code',
  'Gemini-CLI': 'Gemini CLI',
};

const board: Leaderboard = {
  benchmark: 't2j-bench',
  feed: FEED,
  url: FEED,
  terms: 'Public project leaderboard published by Google Cloud AI Research, Google DeepMind, and UIUC.',
  harnesses: 'system',
  reference: ['OpenCode', 'OpenHands', 'Terminus-2'],
  aliases: {
    'opus-5': 'claude-opus-5',
    'sonnet-5': 'claude-sonnet-5',
  },
  parts: {
    train: { name: 'Train', group: 'Subset' },
    serve: { name: 'Serve', group: 'Subset' },
  },
  stats: {
    spec: { name: 'Spec', unit: 'score', better: 'higher' },
    numeric: { name: 'Numeric', unit: 'score', better: 'higher' },
    behavior: { name: 'Behavior', unit: 'score', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(FEED);
    const tbl = tables(html).find(
      (t) => t.length > 5 && t[0].some((c) => /Harness/i.test(c.text)) && t[0].some((c) => /Reward/i.test(c.text)),
    );
    if (!tbl) throw new Error('T2J-Bench leaderboard table not found');
    const rows: LeaderboardRow[] = [];
    for (const r of tbl.slice(1)) {
      if (r.length < 8) continue;
      const rawHarness = r[0].text.replace(/\s+Ours$/i, '').trim();
      const model = r[1].text.trim();
      if (!rawHarness || !model || /^Reference\b/i.test(rawHarness) || /^oracle$/i.test(model)) continue;
      const rewardCell = r[2].text.trim();
      const m = rewardCell.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:±|\+\/-)\s*([0-9]+(?:\.[0-9]+)?)/);
      const score = m ? Number(m[1]) : num(rewardCell);
      if (score === undefined) continue;
      const metrics: Record<string, number> = {};
      if (m) metrics.std = Number(m[2]);
      const spec = num(r[3].text);
      const numeric = num(r[4].text);
      const behavior = num(r[5].text);
      const train = num(r[6].text);
      const serve = num(r[7].text);
      if (spec !== undefined) metrics.spec = spec;
      if (numeric !== undefined) metrics.numeric = numeric;
      if (behavior !== undefined) metrics.behavior = behavior;
      if (train !== undefined) metrics.train = train;
      if (serve !== undefined) metrics.serve = serve;
      rows.push({
        model,
        harness: HARNESS_NAMES[rawHarness] ?? rawHarness,
        score,
        trials: 3,
        metrics,
      });
    }
    if (rows.length < 15) throw new Error(`T2J-Bench parsed only ${rows.length} rows`);
    return rows;
  },
};

export default board;
