// BABILong: use the default avg(qa1-5) tab's first aggregate column, ≤32k, for the live v0 results.
// The official page defines it in draw_utils.py: "res['≤32k'] = res[LENGTHS_32k].mean(axis=1)".
// LENGTHS_32k is 0k, 1k, 2k, 4k, 8k, 16k, 32k; pandas excludes missing values and the page replaces -1 with NaN.
// Reproduce that published definition only. Context-length sub-scores remain metrics, and RAG is a harness.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://huggingface.co/spaces/RMT-team/babilong/raw/main/data/leaderboard-v0_results.csv";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "babilong",
  url: "https://huggingface.co/spaces/RMT-team/babilong",
  feed: FEED,
  terms: "Public results published by the benchmark authors at huggingface.co; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const out: LeaderboardRow[] = [];
    for (const r of parseCsv(await fetchText(FEED))) {
      if (!r.model_name || r.task !== 'avg') continue;
      const metrics: Record<string, number> = {};
      for (const [length, value] of Object.entries(r)) {
        if (!/^\d+(?:k|M)$/.test(length)) continue;
        const score = num(value);
        if (score !== undefined && score >= 0) metrics[`ctx_${length}`] = score;
      }
      // The default tab excludes models missing the 0k or 1k evaluations.
      if (metrics.ctx_0k === undefined || metrics.ctx_1k === undefined) continue;
      const values = ['0k','1k','2k','4k','8k','16k','32k']
        .map(k => metrics[`ctx_${k}`]).filter(v => v !== undefined);
      const rag = /\s*\+ RAG$/.test(r.model_name);
      out.push({model: identity(r.model_name.replace(/\s*\+ RAG$/, '')),
        score: values.reduce((a,b) => a+b, 0) / values.length,
        harness: rag ? 'RAG' : undefined, metrics});
    }
    if (!out.length) throw new Error('BABILong context scores missing');
    return out;
  },
};
export default board;
