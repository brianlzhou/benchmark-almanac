// KnowU-Bench measures Android agent success on 192 tasks. The project leaderboard JSON includes overall and three category success rates.
import type { Leaderboard } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://zjureal.com/KnowU-Bench/leaderboard.json";
interface Entry { model: string; overall: number; general: number; personalized: number; proactive: number; category: string; date: string; runs: number; max_steps: number; link: string }

const board: Leaderboard = {
  benchmark: "knowu-bench",
  url: "https://zjureal.com/KnowU-Bench/#leaderboard",
  feed: FEED,
  terms: "The repository containing the leaderboard JSON uses Apache 2.0. https://github.com/ZJU-REAL/KnowU-Bench/blob/main/LICENSE The site allows crawling.",
  parts: { general: 'General', personalized: 'Personalized', proactive: 'Proactive' },
  async fetch() {
    const { results } = await fetchJson<{ results: Entry[] }>(FEED);
    if (results.length < 8) throw new Error('Expected eight Android agents');
    return results.map(r => {
      if (!r.model || ![r.overall,r.general,r.personalized,r.proactive,r.max_steps,r.runs].every(Number.isFinite)) throw new Error('Incomplete KnowU result');
      return { model: r.model, score: r.overall, setting: r.category + ', ' + r.max_steps + ' steps', trials: r.runs, date: r.date,
        link: r.link && r.link !== '#' ? new URL(r.link, FEED).href : undefined, metrics: { general: r.general, personalized: r.personalized, proactive: r.proactive } };
    });
  },
};
export default board;
