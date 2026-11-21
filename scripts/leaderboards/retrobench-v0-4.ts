// Retrobench measures how closely decompiled functions reproduce the original bytes. The v0.4 results table publishes the average and five individual scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://retrobench.ai/";

const board: Leaderboard = {
  benchmark: "retrobench-v0-4",
  url: "https://retrobench.ai/",
  feed,
  terms: "The maker publishes result tables and withholds the game and function names. The page gives no explicit reuse license. https://retrobench.ai/ The site returns 404 for robots.txt.",
  aliases: { 'Fable 5.2': 'claude-fable-5-2', 'Opus 5.5': 'claude-opus-5-5', 'Sonnet 5.5': 'claude-sonnet-5-5', 'Haiku 5.5': 'claude-haiku-5-5' },
  parts: Object.fromEntries(['PEBBLE', 'ATLAS', 'FORGE', 'TEMPEST', 'COLOSSUS'].map(k => [k, k])),
  async fetch() {
    const keys = Object.keys(board.parts!);
    const t = tables(await fetchText(feed)).find(t => t[0].map(c => c.text).join('|') === ['Model', ...keys, 'Avg'].join('|'));
    if (!t || t.length < 16) throw new Error('Missing Retrobench v0.4 standings');
    return t.slice(1).map(c => {
      const values = c.slice(1).map(v => num(v.text));
      if (values.length !== 6 || values.some(v => v === undefined)) throw new Error('Incomplete Retrobench row');
      const [model, setting] = c[0].text.split(' (');
      return { model, setting: setting?.replace(/\)$/, ''), score: values[5]!, metrics: Object.fromEntries(keys.map((k, i) => [k, values[i]!])) };
    });
  },
};

export default board;
