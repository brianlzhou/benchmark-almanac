// Published weighted Overall (50% tool use, 20% memory, 20% skills, 10% sub-agent). Remote JavaScript is parsed as data, never executed.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { jsLiteral } from '../lib/html.ts';
const FEED = "https://tongyi-mai.github.io/MobilePA-Bench/static/js/leaderboard_data.js";
const board: Leaderboard = {
  benchmark: "mobilepa-bench", parts: {
  toolUse: { name: 'Tool use', group: 'Task type' },
  memory: { name: 'Memory', group: 'Task type' },
  skills: { name: 'Skills', group: 'Task type' },
  subagent: { name: 'Subagent', group: 'Task type' },
}, url: "https://tongyi-mai.github.io/MobilePA-Bench/#leaderboard", feed: FEED,
  terms: 'Public maker results; the site has no robots.txt or additional restriction on reading these published values.',
  async fetch() {
    const source = await fetchText(FEED);
    const marker = source.indexOf('const LEADERBOARD_DATA =');
    if (marker < 0) throw new Error('Leaderboard array missing');
    const data = jsLiteral<({ model: string } & Record<string, unknown>)[]>(source, source.indexOf('[', marker));
    const rows = data.map(r => ({ model: r.model, score: Number(r["overall"]),
      
      metrics: Object.fromEntries([["basic", "toolUse"], ["memory", "memory"], ["skills", "skills"], ["subagent", "subagent"]].map(([key, label]) => [label, Number(r[key])])) }));
    if (rows.length < 3 || rows.some(r => !Number.isFinite(r.score))) throw new Error('Invalid leaderboard rows');
    return rows;
  },
};
export default board;
