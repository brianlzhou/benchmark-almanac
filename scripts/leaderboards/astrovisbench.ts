// AstroVisBench tests code for processing and visualizing astronomy data.
// The leaderboard's first metric is the percentage of processing programs that run without error.
import type { Leaderboard, BoardPart } from './types.ts';
import { fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://astrovisbench.github.io/leaderboard.json';
const parts: Record<string, BoardPart> = {
  'Processing No Error %': { name: 'NoErr(P) %' },
  VIscore: { name: 'VIscore', unit: 'score' },
  'Visualization No Error %': { name: 'NoErr(V) %' },
  'CorrectV %': { name: 'CorrectV %' },
  'VisFail %': { name: 'VisFail %', better: 'lower' },
  'MiE %': { name: 'MiE %', better: 'lower' },
  'MaE %': { name: 'MaE %', better: 'lower' },
};
const board: Leaderboard = {
  benchmark: 'astrovisbench',
  url: 'https://astrovisbench.github.io/',
  feed,
  terms: 'The authors release AstroVisBench under CC BY-SA 4.0. https://creativecommons.org/licenses/by-sa/4.0/',
  aliases: { 'QwQ': 'qwq-32b', 'Qwen‑2.5': 'qwen2-5-72b', 'o3‑mini': 'o3-mini', 'Llama‑4 Maverick': 'llama-4-maverick', 'Claude Sonnet 3.7': 'claude-3-7-sonnet', 'Claude Opus 4.0': 'claude-opus-4' },
  parts,
  async fetch() {
    const data = await fetchJson<Record<string, unknown>[]>(feed);
    return checked(data.map(record => {
      if (typeof record.Model !== 'string') throw new Error('Missing AstroVisBench model');
      const metrics: Record<string, number> = {};
      for (const key of Object.keys(parts)) {
        const value = record[key];
        if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Invalid AstroVisBench ' + key);
        metrics[key] = value;
      }
      return { model: record.Model, score: metrics['Processing No Error %'], metrics };
    }), 8);
  },
};
export default board;
