// Audio MC (AudioMultiChallenge): Scale's main board lists every run. It marks text-output runs with "*" and
// audio-output runs with "†", but newer rows carry no mark. So the importer reads the two boards the main board
// joins (Text Output and Audio Output) and puts the output mode in the setting. The score is the Average Pass
// Rate in percent: a conversation passes only if it meets every rubric item.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { SCALE_TERMS, fetchScaleEntries, scaleRows, scaleUrl } from '../lib/scale.ts';

const PAGE = scaleUrl('audiomc');
const MODES: [string, string][] = [
  ['audiomc-text', 'text output'],
  ['audiomc-audio', 'audio output'],
];

const board: Leaderboard = {
  benchmark: 'audio-mc',
  url: PAGE,
  feed: `${MODES.map(([slug]) => scaleUrl(slug)).join(' and ')} (the "entries" JSON in each page's Next.js flight data)`,
  terms: SCALE_TERMS,
  aliases: {},
  async fetch() {
    const rows: LeaderboardRow[] = [];
    // one page at a time
    for (const [slug, mode] of MODES) {
      for (const r of scaleRows(await fetchScaleEntries(scaleUrl(slug)))) rows.push({ ...r, setting: r.setting ? `${r.setting}, ${mode}` : mode });
    }
    return rows;
  },
};
export default board;
