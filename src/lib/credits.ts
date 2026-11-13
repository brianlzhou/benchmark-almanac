// One-line source credits for charts: shown at the left of a chart's "Download graph" row and printed under the
// chart in the downloaded file (src/components/ChartDownload.astro).
import { EPOCH_SOURCE } from './data.ts';

export const EPOCH_CREDIT = `Epoch AI (${EPOCH_SOURCE.license})`;
export const EPOCH_RUNS = `Epoch AI runs (${EPOCH_SOURCE.license})`;
export const ECI_CREDIT = `Epoch Capabilities Index, Epoch AI (${EPOCH_SOURCE.license})`;
export const LAUNCH_POSTS = 'labs’ launch posts, read by Benchmark Almanac';
export const LAB_CARDS = 'labs’ model cards';

const list = (xs: string[]) => (xs.length < 3 ? xs.join(' and ') : `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}`);

/** "Source: Epoch AI (CC BY 4.0)" or "Sources: A, B and C", without repeats or blanks. */
export function creditLine(parts: (string | null | undefined | false)[]): string | undefined {
  const xs = [...new Set(parts.filter((p): p is string => Boolean(p)))];
  if (!xs.length) return undefined;
  const s = list(xs);
  return `${xs.length > 1 ? 'Sources' : 'Source'}: ${s.charAt(0).toUpperCase()}${s.slice(1)}`;
}

/** Each score source in general terms, for charts that span many benchmarks. */
export const SOURCE_CREDIT: Record<string, string> = {
  leaderboard: 'official leaderboards',
  epoch: EPOCH_RUNS,
  collected: `boards copied by ${EPOCH_CREDIT}`,
  card: LAB_CARDS,
  claim: `claims collected by ${EPOCH_CREDIT}`,
};

/** The credit for rows of a reign chart or any list of things with a score source. */
// A row names its source, or, for a reign row from a pool ('headline', 'independent', 'all'), carries where each
// step's score came from. Both count, so a pooled chart credits the sources its steps actually use.
type Sourced = { source?: string; reigns?: { steps?: { from?: string }[] }[] };
const ORIGINS = ['leaderboard', 'epoch', 'collected', 'card', 'claim'];
export const sourcesCredit = (rows: Sourced[], names: Record<string, string> = SOURCE_CREDIT) => {
  const used = new Set<string>();
  for (const r of rows) {
    if (r.source) used.add(r.source);
    for (const g of r.reigns ?? []) for (const st of g.steps ?? []) if (st.from) used.add(st.from);
  }
  return creditLine(ORIGINS.filter((k) => used.has(k)).map((k) => names[k] ?? SOURCE_CREDIT[k]));
};

/** Charts that pool many benchmarks under one of the score-source choices the leader pages offer. */
export const POOL_CREDIT: Record<string, string> = {
  headline: creditLine(['official leaderboards', EPOCH_CREDIT, LAB_CARDS])!,
  independent: creditLine(['official leaderboards', EPOCH_CREDIT])!,
  all: creditLine(['official leaderboards', EPOCH_CREDIT, LAB_CARDS])!,
};
