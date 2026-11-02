// Arena-Hard v2.0 (LMArena). The arena-hard-auto README holds the leaderboard as console tables. The first,
// "Hard Prompt, Style Control, and Gemini-2.5 as Judge (Official Configuration)", is the headline: win rate
// (0 to 100) against the o3-mini baseline on the 500 hard prompts. The other two tables (GPT-4.1 judge, and
// creative writing) are not read. The README's tables were last changed on 2025-05-01, so that date goes to
// the resolver to pick the snapshots current then. Name suffixes such as "-high" (reasoning effort) and
// "-thinking-16k" (thinking budget) become the setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://raw.githubusercontent.com/lmarena/arena-hard-auto/main/README.md';
const AS_OF = '2025-05-01';

const board: Leaderboard = {
  benchmark: 'arena-hard-v2',
  url: 'https://github.com/lmarena/arena-hard-auto#leaderboard',
  feed: `${FEED} (first table: hard prompts, style control, Gemini-2.5 judge)`,
  terms: 'README of the lmarena/arena-hard-auto repository, which is Apache-2.0.',
  aliases: {
    // the README lists "gemini-2.5" beside "gemini-2.5-flash", so it is Pro; on 2025-05-01 that was the 03-25 release
    'gemini-2.5': 'gemini-2-5-pro-mar-2025',
    'gemini-2.5-flash': 'gemini-2-5-flash-apr-2025',
    'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-october-2024',
    'llama4-maverick-instruct-basic': 'llama-4-maverick',
    'Llama-3.1-Nemotron-70B-Instruct-HF': 'llama-3-1-nemotron-70b-instruct',
    'Qwen2.5-72B-Instruct': 'qwen2-5-72b',
    'gemma-3-27b-it': 'gemma-3-27b',
  },
  async fetch() {
    const md = await fetchText(FEED);
    const start = md.indexOf('(Official Configuration)');
    if (start < 0) throw new Error('official configuration table not found');
    const block = md.slice(start).match(/```console\n([\s\S]*?)```/)?.[1];
    if (!block) throw new Error('console table not found');
    const rows: LeaderboardRow[] = [];
    for (const line of block.split('\n')) {
      const m = line.match(/^\s*\d+\s+(\S+)\s+([\d.]+)\s+\(/);
      if (!m) continue;
      let model = m[1];
      let setting: string | undefined;
      const thinking = model.match(/-thinking-(\d+k)$/);
      const effort = model.match(/^(o\d(?:-mini)?)-\d{4}-\d\d-\d\d-(low|medium|high)$/);
      if (thinking) {
        setting = `thinking ${thinking[1]}`;
        model = model.slice(0, thinking.index);
      } else if (effort) {
        setting = effort[2];
        model = effort[1];
      }
      rows.push({ model, setting, score: Number(m[2]), date: AS_OF });
    }
    if (!rows.length) throw new Error('no rows in the official table');
    return rows;
  },
};
export default board;
