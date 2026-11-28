// GameDojo, a benchmark of real-time interactive agents in video games: 120 boss encounters from 20 games at three
// difficulty levels. The project page builds its leaderboard from the paper's Tables 3 and 4 (assets/js/results.js,
// generated from the paper PDF), so this is a paper board.
// The headline is the page's default view: progress (share of the boss's health removed) at Medium difficulty through
// the computer-use (CUA) action interface. Each model runs in two time modes, which are rows with their own setting:
// time-paused (300 steps, one gameplay minute) and real-time (three physical minutes).
// Win rate and the semantic interface's numbers are stats. Easy, Medium and Hard come from Table 4 (CUA), which
// covers fewer models. Table 4 also lists GameDojo-4B, the authors' model trained on GameDojo-Data, which Table 3
// leaves out, so it is left out here too.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://gamedojo-benchmark.github.io/';
const FEED = `${PAGE}assets/js/results.js`;
type Pair = [number, number] | null; // [win rate, progress]
type Modes = Record<'paused' | 'realtime', Record<string, Pair>>;
interface Entry extends Modes { name: string; group: string }
const MODES = { paused: 'time-paused, 300 steps', realtime: 'real-time, 3 minutes' } as const;

const board: Leaderboard = {
  benchmark: 'gamedojo',
  url: `${PAGE}#results`,
  feed: FEED,
  terms: 'The project page publishes the paper results openly. Results are credited to GameDojo.',
  static: 'paper',
  parts: {
    easy: { name: 'Easy', group: 'Difficulty' },
    medium: { name: 'Medium', group: 'Difficulty' },
    hard: { name: 'Hard', group: 'Difficulty' },
  },
  stats: {
    winRate: { name: 'Win rate', unit: '%', better: 'higher', note: 'Share of Medium fights won through the computer-use interface.' },
    semanticProgress: { name: 'Progress, semantic interface', unit: '%', better: 'higher', note: 'Medium progress when the model acts through named game actions instead of mouse and keyboard.' },
    semanticWinRate: { name: 'Win rate, semantic interface', unit: '%', better: 'higher' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const js = await fetchText(FEED);
    const data = JSON.parse(js.slice(js.indexOf('{'), js.lastIndexOf('}') + 1)) as { medium: Entry[]; tiers: Entry[] };
    if (!Array.isArray(data.medium) || data.medium.length < 8) throw new Error('GameDojo: results table changed');
    const tiers = new Map(data.tiers.map((t) => [t.name, t]));
    const rows: LeaderboardRow[] = [];
    for (const e of data.medium) {
      if (e.group === 'Baselines') continue;
      for (const mode of ['paused', 'realtime'] as const) {
        const cua = e[mode].cua;
        if (!cua) continue;
        const metrics: Record<string, number> = { winRate: cua[0] };
        const sem = e[mode].semantic;
        if (sem) { metrics.semanticWinRate = sem[0]; metrics.semanticProgress = sem[1]; }
        const tier = tiers.get(e.name)?.[mode];
        if (tier) for (const k of ['easy', 'medium', 'hard']) if (tier[k]) metrics[k] = tier[k]![1];
        rows.push({ model: e.name, setting: MODES[mode], score: cua[1], metrics });
      }
    }
    return rows;
  },
};
export default board;
