import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { paperModel } from '../lib/boards/arxiv-nested-tables.ts';
const URL = 'https://arxiv.org/html/2411.02538';
const board: Leaderboard = {
  benchmark: 'milu', static: 'paper', parts: {
  bn: { name: 'Bengali', group: 'Language' },
  en: { name: 'English', group: 'Language' },
  gu: { name: 'Gujarati', group: 'Language' },
  hi: { name: 'Hindi', group: 'Language' },
  kn: { name: 'Kannada', group: 'Language' },
  ml: { name: 'Malayalam', group: 'Language' },
  mr: { name: 'Marathi', group: 'Language' },
  or: { name: 'Odia', group: 'Language' },
  pa: { name: 'Punjabi', group: 'Language' },
  ta: { name: 'Tamil', group: 'Language' },
  te: { name: 'Telugu', group: 'Language' },
}, url: URL, feed: URL + ' (maker average across languages)', terms: PAPER_TERMS,
  async fetch() {
    const t = inlinePaperTables(await paperHtml(URL)).find(t => t[0]?.[1] === 'bn' && t[0]?.at(-1) === 'avg');
    if (!t) throw new Error('MILU aggregate table missing');
    const rows: LeaderboardRow[] = []; let open = false;
    for (const r of t.slice(1)) {
      if (r[0] === 'Open Multilingual Models') open = true;
      if (!/^\d+(\.\d+)?$/.test(r.at(-1)!)) continue;
      const shots = !open || /Llama-3.1-(?:70B-Instruct|405B)$/.test(r[0]) ? 0 : 5;
      rows.push({model: paperModel(r[0].replace(/^[^/]+\//, '')), score: Number(r.at(-1)), open,
        setting: `${shots}-shot; ${open ? 'conditional log probability' : 'response parsing'}`,
        metrics: Object.fromEntries(r.slice(1, -1).map((s, i) => [t[0][i + 1], Number(s)]))});
    }
    if (rows.length < 3) throw new Error('MILU results missing');
    return rows;
  },
};
export default board;
