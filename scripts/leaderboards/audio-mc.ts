// Audio MC (AudioMultiChallenge): Scale's main board lists every run. It marks text-output runs with "*" and
// audio-output runs with "†", but newer rows carry no mark. So the importer reads the two boards the main board
// joins (Text Output and Audio Output) and puts the output mode in the setting. The score is the Average Pass
// Rate in percent: a conversation passes only if it meets every rubric item.
// The board's "±" after each score (confidenceInterval_upper) is kept as the interval's bounds,
// metrics.ciLow and metrics.ciHigh.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { SCALE_ALIASES, SCALE_TERMS, type ScaleEntry, fetchScaleEntries, scaleRows, scaleUrl } from '../lib/scale.ts';

/** The ± half-width Scale prints after the score, as the interval's two ends. */
function interval(e: ScaleEntry) {
  const half = Number((e as ScaleEntry & { confidenceInterval_upper?: number }).confidenceInterval_upper);
  const score = Number(e.score);
  return half > 0 ? { metrics: { ciLow: score - half, ciHigh: score + half } } : undefined;
}

const PAGE = scaleUrl('audiomc');
const MODES: [string, string][] = [
  ['audiomc-text', 'text output'],
  ['audiomc-audio', 'audio output'],
];

const board: Leaderboard = {
  benchmark: 'audio-mc',
  url: PAGE,
  feed: `${MODES.map(([slug]) => scaleUrl(slug)).join(' and ')} (the "entries" JSON in each page's Next.js flight data)`,
  terms: `${SCALE_TERMS} The Almanac credits and links the source.`,
  aliases: {
    ...SCALE_ALIASES,
    'Qwen3-Omni-30B-A3B-Instruct': 'qwen3-omni-30b-a3b',
    // the stable API id, the June 2025 release (the resolver would take the September preview)
    'gemini-2.5-flash': 'gemini-2-5-flash-jun-2025',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    // one page at a time
    for (const [slug, mode] of MODES) {
      for (const r of scaleRows(await fetchScaleEntries(scaleUrl(slug)), (_, e) => interval(e))) rows.push({ ...r, setting: r.setting ? `${r.setting}, ${mode}` : mode });
    }
    return rows;
  },
};
export default board;
