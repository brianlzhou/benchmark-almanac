// SimpleBench: simple-bench.com draws its table from static/js/leaderboard-data.js, a JS array of
// { rank, model, score: "88.4%", organization, dateAdded } objects, one per line.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = 'https://simple-bench.com/static/js/leaderboard-data.js';

const board: Leaderboard = {
  benchmark: 'simplebench',
  url: 'https://simple-bench.com/',
  feed: FEED,
  terms: 'Static data file of the public SimpleBench site; the site states no terms and its GitHub repo is MIT.',
  aliases: {
    // dateAdded 2026-06-10, the day after Claude Fable 5 shipped
    'Claude Fable': 'claude-fable-5',
    'Claude 4 Opus': 'claude-opus-4',
    'Claude 4.1 Opus': 'claude-opus-4-1',
    'Claude 4 Sonnet': 'claude-sonnet-4',
    'Claude 4.5 Sonnet': 'claude-sonnet-4-5',
    'Claude 3.5 Sonnet 06-20': 'claude-3-5-sonnet',
    'Claude 3.5 Sonnet 10-22': 'claude-3-5-sonnet-october-2024',
    'Gemini 2.5 Pro (03-25)': 'gemini-2-5-pro-mar-2025',
    'Gemini 2.5 Pro (06-05)': 'gemini-2-5-pro-jun-2025',
    // added 2025-10-22, when gemini-flash-latest pointed to the September 2025 Flash
    'Gemini 2.5 Flash (latest)': 'gemini-2-5-flash-sep-2025',
    'Gemini 1.5 Pro 002': 'gemini-1-5-pro-sept-2024',
    'GPT-4o 08-06': 'gpt-4o-aug-2024',
    'DeepSeek 3.2 Speciale': 'deepseek-v3-2-speciale',
    'Llama 3.1 405b instruct': 'llama-3-1-405b',
    // the registry lists "DeepSeek-R1-0528" as an alias of the January model
    'DeepSeek R1 05/28': 'deepseek-r1-may-2025',
    // likewise "DeepSeek-V3-0324" sits on the December 2024 model
    'DeepSeek V3 03-24': 'deepseek-v3-mar-2025',
    // listed 2025-07-11, a day before the registry's July 2025 release date
    'Kimi K2': 'kimi-k2-jul-2025',
    // LiveBench's model metadata names Qwen3.8 Max's weights Qwen3.8-2.4T-A95B
    'Qwen 3.8 2.4T A95B': 'qwen-3-8-max',
  },
  async fetch() {
    const js = await fetchText(FEED);
    const start = js.indexOf('leaderboardData');
    const block = js.slice(start, js.indexOf('];', start));
    // modelMeta gives each model's OpenRouter listing date; older rows have no dateAdded, so that date
    // stands in, letting the resolver pick the right snapshot ("DeepSeek V3" is the December 2024 one)
    const listed = new Map<string, string>();
    for (const m of js.slice(js.indexOf('modelMeta')).matchAll(/^\s*"([^"]+)":\s*\{[^}]*released:\s*"([\d-]+)"/gm)) listed.set(m[1], m[2]);
    const rows: LeaderboardRow[] = [];
    const re = /\{\s*rank:\s*"([^"]*)",\s*model:\s*"([^"]*)",\s*score:\s*"([\d.]+)%",\s*organization:\s*"[^"]*",\s*dateAdded:\s*(?:"([\d-]+)"|null)\s*\}/g;
    for (const m of block.matchAll(re)) {
      if (m[1] === '-') continue; // human baselines
      // "o1-2024-12-17 (med)": the resolver knows "medium"
      const model = m[2].trim().replace(/\(med\)$/, '(medium)');
      rows.push({ model, score: Number(m[3]), date: m[4] ?? listed.get(m[2].trim()) });
    }
    if (!rows.length) throw new Error('no leaderboardData rows');
    return rows;
  },
};
export default board;
