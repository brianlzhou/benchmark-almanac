// LiveCodeBench (code generation). livecodebench.github.io/leaderboard.html loads performances_generation.json:
// per-problem pass@1 for each model, the problem's release date, and date_marks (month starts). The page
// scores each model as the mean pass@1 over problems inside a time window. Its default window runs from
// date_marks[15] (or [4] when there are 12 marks or fewer) to the last mark, and the page rounds to one
// decimal; both are reproduced here. Models released inside the window are flagged "contaminated" on the
// page but still shown with a score, so they are kept.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = 'https://livecodebench.github.io/performances_generation.json';

interface Data {
  performances: { model: string; date: number; 'pass@1': number }[];
  models: { model_repr: string; release_date?: number }[];
  date_marks: number[];
}

const board: Leaderboard = {
  benchmark: 'livecodebench',
  url: 'https://livecodebench.github.io/leaderboard.html',
  feed: FEED,
  terms: 'Static JSON on the LiveCodeBench project site; the LiveCodeBench repository is MIT-licensed.',
  aliases: {},
  async fetch() {
    const data = await fetchJson<Data>(FEED);
    const marks = [...data.date_marks].sort((a, b) => a - b);
    const start = marks[marks.length > 12 ? 15 : 4];
    const end = marks.at(-1)!;
    const day = (t: number) => new Date(t).toISOString().slice(0, 10);
    const rows: LeaderboardRow[] = [];
    for (const m of data.models) {
      if (!m.release_date) continue;
      const scores = data.performances.filter((p) => p.model === m.model_repr && p.date >= start && p.date <= end).map((p) => p['pass@1']);
      if (!scores.length) continue;
      rows.push({
        model: m.model_repr,
        score: Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)),
        setting: `problems ${day(start)} to ${day(end)}`,
      });
    }
    return rows;
  },
};
export default board;
