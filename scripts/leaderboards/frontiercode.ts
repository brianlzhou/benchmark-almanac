// FrontierCode (Cognition). Each version's chart reads a static JSON file on cognition.com:
//   1.0  /data/frontier-code/data.json      (blog post 2026-06-08; subsets diamond 50, main 100, extended 150)
//   1.1  /data/frontier-code-1.1/data.json  (blog post 2026-07-07; wrapped in "v1_1"; subsets main, extended)
//   2.0  /data/frontier-code-2.0/data.json  (blog post 2026-10-27, cognition.com/frontiercode; subset main, 132 tasks)
// data[model][effort][subset].new_score (0 to 1) is the score the page plots and ranks; "correct" is the raw
// pass rate before the shortcut penalty. The page shows each model's best effort; every effort is kept
// here with the effort in `setting`. The "main" subset is read for every version: the 1.0 post calls it
// "the standard 100-task benchmark".
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

interface Payload {
  models: string[];
  harness?: Record<string, string>;
  efforts?: Record<string, string[]>;
  data: Record<string, Record<string, Record<string, { new_score?: number | null }>>>;
}

// the page's own labels for its harness keys
const HARNESS: Record<string, string> = {
  devin: 'Devin',
  'devin-cli': 'Devin CLI',
  'devin-cli-swe1': 'Devin CLI',
  'claude-code': 'Claude Code',
  codex: 'Codex',
  'grok-build': 'Grok Build',
  muse: 'Muse Code',
  'gemini-cli': 'Gemini CLI',
  vibe: 'Mistral Vibe',
  'mini-swe-agent': 'mini-swe-agent',
};

export function makeFrontierCode(opts: { benchmark: string; url: string; path: string; wrapper?: string }): Leaderboard {
  const feed = `https://cognition.com${opts.path}`;
  return {
    benchmark: opts.benchmark,
    url: opts.url,
    feed,
    terms: "Static JSON on cognition.com that the page's chart loads; Cognition's website terms set no rule against automated reading.",
    aliases: {},
    async fetch() {
      const raw = await fetchJson<Record<string, unknown>>(feed);
      const p = (opts.wrapper ? raw[opts.wrapper] : raw) as Payload;
      const rows: LeaderboardRow[] = [];
      for (const model of p.models) {
        const byEffort = p.data[model] ?? {};
        for (const effort of p.efforts?.[model] ?? Object.keys(byEffort)) {
          const s = byEffort[effort]?.main?.new_score;
          if (typeof s !== 'number') continue;
          const h = p.harness?.[model];
          rows.push({ model, score: s * 100, setting: effort, harness: h ? (HARNESS[h] ?? h) : undefined });
        }
      }
      return rows;
    },
  };
}

export default makeFrontierCode({
  benchmark: 'frontiercode',
  url: 'https://cognition.com/blog/frontier-code',
  path: '/data/frontier-code/data.json',
});
