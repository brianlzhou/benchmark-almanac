// Official OSWorld-G grounding results. Merge the overview and diagnostic tables by model.
// OSWorld agent task success is a different benchmark and is deliberately excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';
const URL = 'https://osworld-grounding.github.io/';
const board: Leaderboard = {
  benchmark: 'osworld-g', url: URL, feed: URL,
  terms: 'The official project website is CC BY-SA 4.0. Benchmark Almanac credits and links the source.',
  async fetch(): Promise<LeaderboardRow[]> {
    const ts = tables(await fetchText(URL));
    const rows = new Map<string, LeaderboardRow>();
    const overview = ts.find(t => t[0]?.some(c => c.text === 'OSWorld-G'));
    const detail = ts.find(t => t[0]?.some(c => c.text === 'Text Matching'));
    if (!overview || !detail) throw new Error('OSWorld-G result tables missing');
    const col = overview[0].findIndex(c => c.text === 'OSWorld-G');
    for (const r of overview.slice(1)) {
      const score = num(r[col]?.text);
      if (score !== undefined) rows.set(r[0].text, {model: r[0].text, score});
    }
    for (const r of detail.slice(1)) {
      const score = num(r[6]?.text);
      if (score === undefined) continue;
      const metrics: Record<string, number> = {};
      for (let i = 1; i < 6; i++) { const n = num(r[i]?.text); if (n !== undefined) metrics[detail[0][i].text] = n; }
      rows.set(r[0].text, {model: r[0].text, score, metrics});
    }
    return [...rows.values()].map(r => ({...r, model: r.model === 'Gemini-2.5-Pro' ? 'Gemini 2.5 Pro (snapshot unspecified)' : r.model}));
  },
};
export default board;
