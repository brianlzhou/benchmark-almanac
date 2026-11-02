// CooperBench. cooperbench.com/leaderboard (an Astro page) fills its table from two static files,
// /static/data/coop/index.json (agents without git) and /static/data/coop_git/index.json (with git): per
// configuration a display name and the cooperative success rate on the 652 cooperative tasks (passed /
// total, the board's ranking). That rate is the score. The display name carries the agent framework in
// brackets ("Gemini 3 Flash (SDK + Git)"): no bracket means OpenHands, "SDK" the OpenHands SDK and
// "Mini-SWE" mini-SWE-agent; it becomes the harness, with "+ git" when git access was on.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const SITE = 'https://cooperbench.com';
const FEEDS = [`${SITE}/static/data/coop/index.json`, `${SITE}/static/data/coop_git/index.json`];
const FRAMEWORK: Record<string, string> = { SDK: 'OpenHands SDK', 'Mini-SWE': 'mini-SWE-agent' };

interface Index {
  modelDisplayNames: Record<string, string>;
  stats: Record<string, { rate?: number }>;
}

const board: Leaderboard = {
  benchmark: 'cooperbench',
  url: `${SITE}/leaderboard`,
  feed: `${FEEDS.join(' and ')} (stats.rate)`,
  terms: 'Static JSON behind the leaderboard page; the cooperbench.com robots.txt (Cloudflare content signals only) sets no rules and the site states no terms.',
  aliases: {
    'Qwen3-Coder-30B': 'qwen3-coder-30b-a3b-instruct',
  },
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const feed of FEEDS) {
      const d = await fetchJson<Index>(feed);
      for (const [key, s] of Object.entries(d.stats)) {
        const name = d.modelDisplayNames[key] ?? key;
        if (typeof s.rate !== 'number') continue;
        const m = name.match(/^(.*?)\s*\(([^)]*)\)$/);
        const parts = (m?.[2] ?? '').split('+').map((p) => p.trim()).filter(Boolean);
        const git = parts.some((p) => /^git$/i.test(p));
        const fw = parts.find((p) => !/^git$/i.test(p));
        const harness = `${fw ? (FRAMEWORK[fw] ?? fw) : 'OpenHands'}${git ? ' + git' : ''}`;
        rows.push({ model: m ? m[1] : name, harness, score: s.rate });
      }
    }
    return rows;
  },
};
export default board;
