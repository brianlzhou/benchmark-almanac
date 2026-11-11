// LatchBio Capabilities v1.0 on benchmarks.bio. The site publishes /results/v1/latest.json for machine use
// (llms.txt): capabilitiesLeaderboard ranks model-and-harness pairs by overallScorePct, the weighted mean
// of the V1 benchmarks' macro-mean pass rates (0 to 100), which is the score. The harness (Pi, Claude
// Code, Codex, Grok Build) is kept. "Claude Opus 5.5*" rows are modelVariant LSVP, Anthropic's
// safety-filter-exempt variant, reported next to the standard run; the asterisk is dropped and the variant
// becomes the setting. Legacy V0 (/results/v0/) is a different, non-comparable series and is not read.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://benchmarks.bio/results/v1/latest.json';

interface Row {
  model: string;
  harness?: string;
  overallScorePct?: number;
  modelVariant?: string | null;
  scores?: Record<string, number>;
}

const board: Leaderboard = {
  benchmark: 'latchbio-capabilities-v1-0',
  url: 'https://benchmarks.bio/results/v1/',
  feed: `${FEED} (capabilitiesLeaderboard)`,
  terms: 'JSON that benchmarks.bio publishes for machine use (llms.txt); robots.txt allows all paths and the site states no license.',
  aliases: {
    // the only Nemotron 3 Ultra in the registry (550B total, 55B active)
    'Nemotron 3 Ultra 550B A55B': 'nemotron-3-ultra',
  },
  async fetch() {
    const data = await fetchJson<{ resultVersion?: string; capabilitiesLeaderboard: Row[] }>(FEED);
    if (data.resultVersion && data.resultVersion !== 'v1') throw new Error(`unexpected result version ${data.resultVersion}`);
    const rows: LeaderboardRow[] = [];
    for (const r of data.capabilitiesLeaderboard) {
      if (typeof r.overallScorePct !== 'number') continue;
      rows.push({
        model: r.model.replace(/\*+$/, '').trim(),
        score: r.overallScorePct,
        harness: r.harness || undefined,
        setting: r.modelVariant || undefined,
        metrics: r.scores ? Object.fromEntries(Object.entries(r.scores).filter(([, value]) => Number.isFinite(value))) : undefined,
      });
    }
    return rows;
  },
};
export default board;
