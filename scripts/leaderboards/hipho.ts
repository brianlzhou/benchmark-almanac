// HiPhO on PhyArena (phyarena.github.io). The board page loads data/hipho.json: for each of the 13 physics
// olympiad exams (2024 and 2025) the official full mark and every model's exam score in points. The page's
// "Avg" column is the plain mean of those points, which mixes exams marked out of 25, 30, 72 and 100, so it
// is not a percent. Labs report HiPhO as the average normalized score over the 13 olympiads (for example the
// Seed2.0 model card), so the score here is the mean of score / official full mark (full_mark_human), times
// 100. Only models with a score on all 13 exams are kept, so every average covers the same exams.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const PAGE = 'https://phyarena.github.io/';
const FEED = 'https://phyarena.github.io/data/hipho.json';

interface Data {
  olympiads: { name: string; year: number; full_mark_human: number; models: { name: string; score: number | null }[] }[];
}

const board: Leaderboard = {
  benchmark: 'hipho',
  url: PAGE,
  feed: `${FEED} (mean of score / full mark over the 13 olympiads)`,
  terms: 'Static JSON on the PhyArena GitHub Pages site; GitHub Pages serves no robots.txt rules for it and the site states no terms.',
  aliases: {
    'Claude-4-Sonnet': 'claude-sonnet-4',
    'Claude-4-Sonnet-Thinking': 'claude-sonnet-4',
    'InternVL3-78B-Instruct': 'internvl3-78b',
    'InternVL3-38B-Instruct': 'internvl3-38b',
    'InternVL3-9B-Instruct': 'internvl3-9b',
    'LLaMA4-Scout-17B': 'llama-4-scout',
    // the July 2025 release; the September update is named Kimi-K2-Instruct-0905
    'Kimi-K2-Instruct': 'kimi-k2-jul-2025',
    'Qwen3-30B-A3B-Thinking-2507': 'qwen3-30b-a3b-thinking-jul-2025',
  },
  async fetch() {
    const data = await fetchJson<Data>(FEED);
    const exams = data.olympiads.length;
    if (exams < 10) throw new Error(`expected 13 olympiads, found ${exams}`);
    const parts = new Map<string, number[]>();
    for (const o of data.olympiads) {
      if (!(o.full_mark_human > 0)) throw new Error(`no full mark for ${o.name} ${o.year}`);
      for (const m of o.models) {
        if (typeof m.score !== 'number') continue;
        parts.set(m.name, [...(parts.get(m.name) ?? []), m.score / o.full_mark_human]);
      }
    }
    const rows: LeaderboardRow[] = [];
    for (const [model, xs] of parts) {
      if (xs.length !== exams) continue;
      const score = Number(((xs.reduce((a, b) => a + b, 0) / exams) * 100).toFixed(1));
      // the alias drops the setting, so name it here
      rows.push(/^Claude.*-Thinking$/.test(model) ? { model, score, setting: 'thinking' } : { model, score });
    }
    return rows;
  },
};
export default board;
