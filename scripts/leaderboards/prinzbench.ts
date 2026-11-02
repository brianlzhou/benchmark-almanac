// prinzbench (legal research and needle-in-a-haystack search, run privately by its author). The leaderboard is
// the markdown table between the LEADERBOARD_START and LEADERBOARD_END marks in the prinz-ai/prinzbench
// README: "prinzbench (full) score", points out of 99 over three runs of 33 questions, which is the score in
// the board's own unit. Names are the author's shorthand, often ChatGPT app modes: a parenthesized level
// ("(extended)", "(heavy)", "(xhigh)") becomes the setting, "-thinking" marks a thinking mode, and a trailing
// "*" (a model tested before its public release) is dropped.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { ghRaw, mdTables } from './big-bench-extra-hard.ts';

const REPO = 'prinz-ai/prinzbench';
const FEED = ghRaw(REPO, 'README.md');

const board: Leaderboard = {
  benchmark: 'prinzbench',
  url: `https://github.com/${REPO}`,
  feed: `${FEED} (prinzbench (full) score)`,
  terms: 'README table in the prinz-ai/prinzbench GitHub repository, which states no license; scores are cited to the author.',
  aliases: {
    'fable-5': 'claude-fable-5',
    'opus-4.8': 'claude-opus-4-8',
    'opus-4.7': 'claude-opus-4-7',
    'opus-4.6': 'claude-opus-4-6',
    'opus-4.5': 'claude-opus-4-5',
    'sonnet-4.6': 'claude-sonnet-4-6',
    'sonnet-4.5': 'claude-sonnet-4-5',
  },
  async fetch() {
    const t = mdTables(await fetchText(FEED)).find((x) => x.head.some((h) => /^prinzbench \(full\) score/.test(h)));
    if (!t) throw new Error('prinzbench table not found');
    const iScore = t.head.findIndex((h) => /^prinzbench \(full\) score/.test(h));
    const rows: LeaderboardRow[] = [];
    for (const r of t.rows) {
      const score = Number(r[iScore]);
      let model = r[0]?.replace(/\*$/, '').trim();
      if (!model || !Number.isFinite(score)) continue;
      let setting: string | undefined;
      const level = model.match(/\s*\(([\w-]+)\)$/);
      if (level) {
        setting = level[1];
        model = model.slice(0, level.index).trim();
      }
      const thinking = model.match(/^(.+)-thinking$/);
      if (thinking) {
        model = thinking[1];
        setting = setting ? `thinking ${setting}` : 'thinking';
      }
      rows.push({ model, score, setting });
    }
    return rows;
  },
};
export default board;
