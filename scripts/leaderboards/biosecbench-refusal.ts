// BioSecBench-Refusal on benchmarks.bio (LatchBio). The site publishes /results/v1/latest.json for machine
// use (llms.txt). Its benchmarkLeaderboards object holds one ranked list per V1 benchmark, keyed by the
// site's own short id, with scorePct (the benchmark's macro-mean pass rate, 0 to 100) for each model and
// harness pair. For BioSecBench-Refusal the score is the share of harmful biology requests the model
// refuses. "Claude Opus 5.5*" rows are modelVariant LSVP, Anthropic's safety-filter-exempt variant. The
// asterisk is dropped and the variant becomes the setting, as in latchbio-capabilities-v1-0.ts. The other
// benchmarks.bio importers read their lists through bioRows from this file.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

export const BIO_FEED = 'https://benchmarks.bio/results/v1/latest.json';
export const BIO_PAGE = 'https://benchmarks.bio/results/v1/';
export const BIO_TERMS =
  'JSON that benchmarks.bio publishes for machine use (llms.txt); robots.txt allows all paths and the site states no license.';
export const bioFeed = (key: string) => `${BIO_FEED} (benchmarkLeaderboards.${key})`;

/** benchmarks.bio names the shared resolver cannot place. */
export const BIO_ALIASES: Record<string, string> = {
  // the only Nemotron 3 Ultra in the registry (550B total, 55B active)
  'Nemotron 3 Ultra 550B A55B': 'nemotron-3-ultra',
  // Meta's Muse Wonder, version 1.0 (the Full tier is named "Muse Wonder Full")
  'Muse Wonder 1.0': 'muse-wonder',
};

interface Row {
  model: string;
  harness?: string;
  scorePct?: number;
  modelVariant?: string | null;
}

/** One row per model and harness from the V1 list keyed `key` in latest.json. */
export async function bioRows(key: string): Promise<LeaderboardRow[]> {
  const data = await fetchJson<{ resultVersion?: string; benchmarkLeaderboards: Record<string, Row[]> }>(BIO_FEED);
  if (data.resultVersion && data.resultVersion !== 'v1') throw new Error(`unexpected result version ${data.resultVersion}`);
  const list = data.benchmarkLeaderboards?.[key];
  if (!list) throw new Error(`no ${key} list in benchmarks.bio latest.json`);
  const rows: LeaderboardRow[] = [];
  for (const r of list) {
    if (typeof r.scorePct !== 'number' || !r.model) continue;
    rows.push({
      model: r.model.replace(/\*+$/, '').trim(),
      score: r.scorePct,
      harness: r.harness || undefined,
      setting: r.modelVariant || undefined,
    });
  }
  return rows;
}

const board: Leaderboard = {
  benchmark: 'biosecbench-refusal',
  url: BIO_PAGE,
  feed: bioFeed('biosecbench-refusal'),
  terms: BIO_TERMS,
  aliases: BIO_ALIASES,
  fetch: () => bioRows('biosecbench-refusal'),
};
export default board;
