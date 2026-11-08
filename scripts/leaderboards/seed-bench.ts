// SEED-Bench: Avg. All is whole-benchmark accuracy in percent. Exclude image-only
// submissions whose overall aggregate is unavailable. Keep image/video and task metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { mdCell } from './big-bench-extra-hard.ts';
const FEED = "https://huggingface.co/spaces/AILab-CVC/SEED-Bench_Leaderboard/resolve/main/file/result.csv";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "seed-bench",
  url: "https://huggingface.co/spaces/AILab-CVC/SEED-Bench_Leaderboard",
  feed: FEED,
  terms: "Public results published by the benchmark authors at huggingface.co; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      const name = mdCell(r.Model ?? '');
      const overall = num(r['Avg. All']);
      const image = num(r['Avg. Img']);
      const score = overall && overall > 0 ? overall : undefined;
      if (!name || score === undefined) continue;
      const size = r['Model Size'];
      const sized = ['Otter','OpenFlamingo'].includes(name) ? `${name} (${r['Language Model']})` : /^(LLaVA-1.5|Vicuna|LLaMA|MiniGPT-4|Flan-T5)$/.test(name) ? `${name}-${size}` : name;
      const metrics: Record<string, number> = {};
      for (const [k, v] of Object.entries(r).slice(6)) { const n = num(v); if (n !== undefined && n > 0) metrics[k] = n; }
      rows.push({ model: identity(sized), score, setting: r['Evaluation Method'], metrics });
    }
    if (!rows.length) throw new Error('SEED-Bench CSV empty');
    return rows;
  },
};
export default board;
