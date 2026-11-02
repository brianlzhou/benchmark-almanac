// Lakera B3 (Backbone Breaker Benchmark). b3.lakera.ai is a Vite app whose leaderboard rows are a literal
// array in its hashed bundle (/assets/index-<hash>.js): per evaluation the model name, OpenRouter slug,
// vulnerabilityScore (mean attack success rate over all 30 threat snapshots, 0 to 1, lower is better),
// reasoningEnabled and evaluationTimestamp. This file reads the HTML for the bundle path, cuts the array that
// holds vulnerabilityScore, and reads only those fields. The score is the board's headline, Vulnerability,
// as a percent (lower is better). Evaluations with reasoning on get the setting "thinking". Rows carry the
// evaluation date.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://b3.lakera.ai/';

const board: Leaderboard = {
  benchmark: 'lakera-b3-backbone-breaker-benchmark',
  url: PAGE,
  feed: `${PAGE}assets/index-<hash>.js (leaderboard array, vulnerabilityScore)`,
  terms: 'Public project page of an ICLR 2026 paper; b3.lakera.ai serves no robots.txt (404) and states no terms.',
  aliases: {
    'R1 0528': 'deepseek-r1-may-2025',
    'GPT-4o (2024-11-20)': 'gpt-4o-nov-2024',
    // OpenRouter slugs google/gemini-2.5-flash and -flash-lite are the June 2025 GA models, not the September previews
    'Gemini 2.5 Flash': 'gemini-2-5-flash-jun-2025',
    'Gemini 2.5 Flash Lite': 'gemini-2-5-flash-lite-jun-2025',
    'Qwen3 235B A22B Instruct 2507': 'qwen3-235b-a22b-instruct-jul-2025',
    'Kimi K2 0905': 'kimi-k2-sep-2025',
    'Mistral Large 3 2512': 'mistral-large-3',
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const src = html.match(/src="(\/assets\/index-[\w-]+\.js)"/)?.[1];
    if (!src) throw new Error('bundle path not found');
    const js = await fetchText(new URL(src, PAGE).href);
    const start = js.indexOf('[{modelName:');
    if (start < 0) throw new Error('leaderboard array not found');
    const end = js.indexOf('}]', start);
    const block = js.slice(start, end + 2);
    const rows: LeaderboardRow[] = [];
    const re = /modelName:"([^"]+)",modelSlug:"[^"]+",vulnerabilityScore:([\d.e-]+),stderr:[\d.e-]+,reasoningEnabled:!([01]),evaluationTimestamp:(\d+)/g;
    for (const m of block.matchAll(re)) {
      rows.push({
        model: m[1],
        score: Number((Number(m[2]) * 100).toFixed(2)),
        setting: m[3] === '0' ? 'thinking' : undefined,
        date: new Date(Number(m[4]) * 1000).toISOString().slice(0, 10),
      });
    }
    if (rows.length < 30) throw new Error(`only ${rows.length} B3 rows`);
    return rows;
  },
};
export default board;
