// NatureBench. frontisai.github.io/NatureBench fills its leaderboard from naturebench-data.js, which sets
// window.NATUREBENCH_DATA to a JSON object: per configuration (model and agent) a score per task, where a
// task score g is the SOTA-normalized gap to the paper's result and each task is valid, invalid or unscored.
// The page (leaderboard-tracks.js) ranks the Full track (90 tasks) by Surpass-SOTA, the share of all 90
// tasks with a valid g above 0.1, and breaks ties by Match-SOTA. That share, as a percent, is the score,
// computed here the same way. Configurations that ran only the 25-task subset are skipped. The agent is the
// harness; a harness name in brackets after the model ("Opus 5 (HELIX)") is dropped from the name.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsonAt } from '../lib/html.ts';

const PAGE = 'https://frontisai.github.io/NatureBench/';
const FEED = `${PAGE}naturebench-data.js`;

type Score = { state: string; value: number | null };
interface Data {
  leaderboard: { name: string; harness?: string; tracks?: string[]; scores?: Record<string, Score> }[];
  cases: { caseId: string; scores: Record<string, Score> }[];
}

const board: Leaderboard = {
  benchmark: 'naturebench',
  url: `${PAGE}#leaderboard`,
  feed: `${FEED} (Full track, Surpass-SOTA computed as the page does)`,
  terms: 'Static data file on the project site (GitHub Pages, no robots.txt rules); the FrontisAI/NatureBench repository is MIT-licensed.',
  aliases: {
    'Opus 5': 'claude-opus-5',
  },
  async fetch() {
    const js = await fetchText(FEED);
    const data = jsonAt<Data>(js, js.indexOf('{'));
    const total = data.cases.length;
    if (total !== 90) throw new Error(`expected 90 Full-track tasks, found ${total}`);
    const rows: LeaderboardRow[] = [];
    for (const row of data.leaderboard) {
      if (Array.isArray(row.tracks) && !row.tracks.includes('full')) continue;
      let surpass = 0;
      for (const c of data.cases) {
        const s = row.scores?.[c.caseId] ?? c.scores[row.name];
        if (!s) throw new Error(`no ${row.name} score for ${c.caseId}`);
        if (s.state === 'valid' && Number.isFinite(s.value) && Number(s.value) > 0.1) surpass++;
      }
      const model = row.name.replace(/\s*\([^)]*\)$/, '').trim();
      rows.push({ model, harness: row.harness, score: Number(((surpass / total) * 100).toFixed(2)) });
    }
    return rows;
  },
};
export default board;
