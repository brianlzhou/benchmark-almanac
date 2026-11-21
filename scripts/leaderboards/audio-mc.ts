import { scaleRowsWithInterval as scaleRows } from './swe-bench-pro.ts';
// Audio MC (AudioMultiChallenge): Scale's Text Output and Audio Output tabs share the audiomc page.
// Each tab ranks its output mode separately. The importer records the mode in the setting. The score is the Average Pass
// Rate in percent: a conversation passes only if it meets every rubric item.
// The board's "±" after each score (confidenceInterval_upper) is kept as the interval's bounds,
// metrics.ciLow and metrics.ciHigh.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { SCALE_ALIASES, SCALE_TERMS, type ScaleEntry, fetchScaleEntries,  scaleUrl } from '../lib/scale.ts';

/** The tab rank and the two ends of the score interval. */
function tabMetrics(e: ScaleEntry) {
  const half = Number((e as ScaleEntry & { confidenceInterval_upper?: number }).confidenceInterval_upper);
  const score = Number(e.score);
  const metrics: Record<string, number> = {};
  if (typeof e.rank === 'number') metrics.outputModeRank = e.rank;
  if (half > 0) {
    metrics.ciLow = score - half;
    metrics.ciHigh = score + half;
  }
  return { metrics };
}

const PAGE = scaleUrl('audiomc');
const MODES: [string, string][] = [
  ['text', 'text output'],
  ['audio', 'audio output'],
];

const board: Leaderboard = {
  benchmark: 'audio-mc',
  url: PAGE,
  feed: `${PAGE} (the text and audio variants in the page's Next.js flight data)`,
  terms: `${SCALE_TERMS} The Almanac credits and links the source.`,
  stats: { outputModeRank:{name:'Output mode rank',unit:'count',better:'lower'} },
  aliases: {
    ...SCALE_ALIASES,
    'Qwen3-Omni-30B-A3B-Instruct': 'qwen3-omni-30b-a3b',
    // the stable API id, the June 2025 release (the resolver would take the September preview)
    'gemini-2.5-flash': 'gemini-2-5-flash-jun-2025',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    // one tab at a time
    for (const [slug, mode] of MODES) {
      for (const r of scaleRows(await fetchScaleEntries(PAGE, slug), (_, e) => tabMetrics(e))) rows.push({ ...r, setting: r.setting ? `${r.setting}, ${mode}` : mode });
    }
    return rows;
  },
};
export default board;
