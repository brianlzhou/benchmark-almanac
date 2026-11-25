// AlphaEval reports a score over 94 tasks and scores for six domains in each scaffold-model row.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num, jsLiteral } from '../lib/html.ts';

const FEED = 'https://alphaeval.ai';
interface Detail {
  tasks: { key: string; label: string }[];
  leaderboard: { scaffold: string; models: {name: string; avg: number; scores: number[]}[] }[];
}
const board: Leaderboard = {
  benchmark: 'alphaeval', harnesses: 'system', url: FEED, feed: FEED,
  terms: 'The benchmark authors publish this public feed; their source license and site terms apply.',
  parts: {
    hr: { name: 'Human Resources', group: 'Domain' },
    fni: { name: 'Finance & Investment', group: 'Domain' },
    poo: { name: 'Procurement & Operations', group: 'Domain' },
    swe: { name: 'Software Engineering', group: 'Domain' },
    hls: { name: 'Healthcare & Life Sciences', group: 'Domain' },
    tr: { name: 'Technology Research', group: 'Domain' },
  },
  async fetch() {
    const page = await fetchText(FEED);
    const table = tables(page).find(t => t[0]?.some(c => c.text === 'Scaffold'));
    if (!table) throw new Error('No AlphaEval table');
    const rows: LeaderboardRow[] = table.slice(1).map(r => ({
      model: r[2].text, harness: r[1].text, score: num(r[3].text)!, setting: 'Average of 94 tasks',
    }));
    const chunks = [...page.matchAll(/<script[^>]+src="(\/_next\/static\/chunks\/[^"]+\.js)"/g)].map(m => m[1]);
    // Try the current data chunk first. A new deployment changes the file names.
    chunks.sort((a,b) => Number(b.endsWith('/181051a1701771c7.js')) - Number(a.endsWith('/181051a1701771c7.js')));
    for (const chunk of chunks) {
      await new Promise(resolve => setTimeout(resolve, 1050));
      const script = await fetchText(new URL(chunk, FEED).href);
      const start = script.indexOf('{tasks:[{key:');
      if (start === -1) continue;
      const data = jsLiteral<Detail>(script, start);
      if (!Array.isArray(data.leaderboard)) continue;
      for (const entry of data.leaderboard) {
        for (const model of entry.models) {
          const row = rows.find(r => r.harness === entry.scaffold && r.model === model.name && r.score === model.avg);
          if (row && model.scores.length === data.tasks.length) {
            row.metrics = Object.fromEntries(data.tasks.map((task, i) => [task.key === 'se' ? 'swe' : task.key, model.scores[i]]));
          }
        }
      }
      break;
    }
    for (const row of rows) if (row.model === 'Gemini 3 Pro') row.model += ' [snapshot unspecified]';
    return rows;
  },
};
export default board;
