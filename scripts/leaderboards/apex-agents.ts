// APEX-Agents 1.0: launch baselines on Mercor's live dataset card. The website now shows 1.1,
// whose revised judge makes its scores incomparable. Read Pass@1 from this original table,
// retaining pass@8, pass^8, mean rubric score, job scores and confidence limits as metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
const FEED = 'https://huggingface.co/datasets/mercor/apex-agents/resolve/main/README.md';
const board: Leaderboard = {
  benchmark: 'apex-agents',
  parts: {
    banking: { name: 'Banking', group: 'Domain' },
    consulting: { name: 'Consulting', group: 'Domain' },
    law: { name: 'Law', group: 'Domain' },
  },
  url: 'https://huggingface.co/datasets/mercor/apex-agents#leaderboard-baselines',
  feed: FEED,
  terms: 'Mercor forbids scraping and training use; Benchmark Almanac credits and links Mercor as the source of these evaluation results.',
  stats: {
    passAt8: { name: 'Pass at 8', unit: '%', better: 'higher' },
    pass8: { name: 'Pass^8', unit: '%', better: 'higher' },
    meanScore: { name: 'Mean rubric score', unit: '%', better: 'higher' },
  },
  async fetch() {
    const md = await fetchText(FEED);
    const section = md.match(/## Leaderboard baselines([\s\S]*?)(?:\n## |$)/)?.[1];
    if (!section || !section.includes('Pass@1 (95% CI)')) throw new Error('APEX-Agents launch baseline table missing');
    const rows: LeaderboardRow[] = [];
    for (const line of section.split('\n')) {
      if (!line.startsWith('|')) continue;
      const c = line.split('|').slice(1, -1).map(x => x.trim());
      const score = parseFloat(c[1]);
      if (!c[0] || !Number.isFinite(score)) continue;
      const metrics: Record<string, number> = {};
      for (const [index, key] of [[2, 'passAt8'], [3, 'pass8'], [4, 'meanScore'], [5, 'banking'], [6, 'consulting'], [7, 'law']] as const) {
        const v = parseFloat(c[index]); if (Number.isFinite(v)) metrics[key] = v;
      }
      const ci = c[1].match(/\[([\d.]+)[–-]([\d.]+)\]/);
      if (ci) { metrics.ciLow = Number(ci[1]); metrics.ciHigh = Number(ci[2]); }
      const passAt8Ci = c[2].match(/\[([\d.]+)[–-]([\d.]+)\]/);
      if (passAt8Ci) { metrics.passAt8Low = Number(passAt8Ci[1]); metrics.passAt8High = Number(passAt8Ci[2]); }
      rows.push({ model: c[0], score, low: ci ? Number(ci[1]) : undefined,
        high: ci ? Number(ci[2]) : undefined, setting: 'high reasoning effort where available', metrics });
    }
    if (!rows.length) throw new Error('APEX-Agents launch baseline table has no rows');
    return rows;
  },
};
export default board;
