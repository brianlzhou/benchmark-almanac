// GameDojo (THUSI-Lab): evaluates vision-language agents on real-time and time-paused video game boss fights across
// semantic and computer-use (CUA) action interfaces. Reads the official window.GD_RESULTS JSON dataset at
// gamedojo-benchmark.github.io/assets/js/results.js (Medium difficulty leaderboard, excluding scripted baselines).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://gamedojo-benchmark.github.io/';
const FEED = `${PAGE}assets/js/results.js`;

type Pair = [number, number] | null;
interface ModeBlock {
  semantic: Pair;
  cua: Pair;
  average: Pair;
}
interface GameDojoEntry {
  name: string;
  group: string;
  paused: ModeBlock;
  realtime: ModeBlock;
}

const board: Leaderboard = {
  benchmark: 'gamedojo',
  url: PAGE,
  feed: FEED,
  terms: 'Published openly on GitHub Pages by THUSI-Lab with no robots.txt restrictions.',
  headline: 'Time-paused mean progress (%) averaged across semantic and computer-use interfaces at Medium difficulty, matching the default view on the GameDojo leaderboard.',
  notModels: /^(Idle|Random|Boss-specific script)$/i,
  parts: {
    pausedSemantic: { name: 'Paused, semantic', group: 'Mode' },
    pausedCua: { name: 'Paused, CUA', group: 'Mode' },
    realtimeAvg: { name: 'Real-time, average', group: 'Mode' },
    realtimeSemantic: { name: 'Real-time, semantic', group: 'Mode' },
    realtimeCua: { name: 'Real-time, CUA', group: 'Mode' },
  },
  stats: {
    pausedWinRate: { name: 'Paused win rate', unit: '%', better: 'higher', note: 'Boss fight win rate (%) with the game clock paused.' },
  },
  async fetch() {
    const js = await fetchText(FEED);
    const start = js.indexOf('{');
    const end = js.lastIndexOf('}');
    if (start < 0 || end < 0) throw new Error('GameDojo GD_RESULTS JSON object not found');
    const data = JSON.parse(js.slice(start, end + 1)) as { medium: GameDojoEntry[] };
    const out: LeaderboardRow[] = [];
    for (const r of data.medium) {
      if (r.group === 'Baselines') continue;
      const pAvg = r.paused.average;
      if (!pAvg || !Number.isFinite(pAvg[1])) continue;
      const metrics: Record<string, number> = {};
      if (r.paused.semantic && Number.isFinite(r.paused.semantic[1])) metrics.pausedSemantic = r.paused.semantic[1];
      if (r.paused.cua && Number.isFinite(r.paused.cua[1])) metrics.pausedCua = r.paused.cua[1];
      if (r.realtime.average && Number.isFinite(r.realtime.average[1])) metrics.realtimeAvg = r.realtime.average[1];
      if (r.realtime.semantic && Number.isFinite(r.realtime.semantic[1])) metrics.realtimeSemantic = r.realtime.semantic[1];
      if (r.realtime.cua && Number.isFinite(r.realtime.cua[1])) metrics.realtimeCua = r.realtime.cua[1];
      if (Number.isFinite(pAvg[0])) metrics.pausedWinRate = pAvg[0];
      out.push({
        model: r.name.trim(),
        score: pAvg[1],
        metrics,
      });
    }
    if (out.length < 10) throw new Error(`GameDojo returned only ${out.length} rows`);
    return out;
  },
};
export default board;
