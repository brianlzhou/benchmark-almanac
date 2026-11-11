// LOCA-bench. loca-bench.github.io renders its tables in the browser from a JSON block embedded in the page
// (script#leaderboard-data): the "accuracy" board gives each model's success rate (0 to 1) at environment
// description lengths from 8K to 256K tokens and their average. The page sorts by the 256K column by
// default, and model cards cite LOCA-Bench at 256K, so that column (times 100) is the score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const URL = 'https://loca-bench.github.io/';

interface Board {
  id: string;
  results: { name: string; avg?: number; scores?: Record<string, number | null> }[];
}

const board: Leaderboard = {
  benchmark: 'loca-bench',
  url: URL,
  feed: `${URL} (script#leaderboard-data, accuracy board, 256K column)`,
  terms: 'Static GitHub Pages site; the data sits in the page itself and the page states no terms.',
  aliases: {
    'Claude 4.5 Opus': 'claude-opus-4-5',
    // GPT-5.2 run through the ChatGPT naming, at medium effort
    'ChatGPT-5.2': 'gpt-5-2',
  },
  async fetch() {
    const block = (await fetchText(URL)).match(/<script[^>]*id="leaderboard-data"[^>]*>([\s\S]*?)<\/script>/)?.[1];
    if (!block) throw new Error('no leaderboard-data block on the LOCA-bench page');
    const accuracy = (JSON.parse(block) as Board[]).find((b) => b.id === 'accuracy');
    if (!accuracy) throw new Error('no accuracy board in the LOCA-bench data');
    const rows: LeaderboardRow[] = [];
    for (const r of accuracy.results) {
      const v = r.scores?.['256000'];
      if (!r.name || typeof v !== 'number') continue;
      // "ChatGPT-5.2-medium", "DeepSeek-V3.2-thinking": a trailing mode becomes the setting
      const mode = r.name.match(/-(low|medium|high|xhigh|thinking)$/i);
      const metrics: Record<string, number> = {};
      for (const [length, value] of Object.entries(r.scores ?? {})) if (typeof value === 'number') metrics[`accuracy${length}`] = value * 100;
      if (typeof r.avg === 'number') metrics.average = r.avg * 100;
      rows.push({ metrics, model: mode ? r.name.slice(0, mode.index) : r.name, score: v * 100, setting: mode?.[1].toLowerCase() });
    }
    return rows;
  },
};
export default board;
