// MT-Bench: mean GPT-4 single-answer judgment across questions and both conversation turns, on the original 1–10 scale. Invalid negative judgments are excluded. Turn means and judgment counts remain available as metrics.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';

const FEED = "https://huggingface.co/spaces/lmsys/mt-bench/resolve/main/data/mt_bench/model_judgment/gpt-4_single.jsonl";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "mt-bench",
  url: "https://github.com/lm-sys/FastChat/tree/main/fastchat/llm_judge",
  feed: FEED,
  terms: "Public results published by the benchmark authors at huggingface.co; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const groups = new Map<string, { sum: number; n: number; turns: Record<string, { sum: number; n: number }> }>();
    for (const line of (await fetchText(FEED)).split('\n')) {
      if (!line.trim()) continue;
      const r = JSON.parse(line);
      if (!r.model || typeof r.score !== 'number' || r.score < 0 || r.score > 10) continue;
      const g = groups.get(r.model) ?? { sum: 0, n: 0, turns: {} };
      g.sum += r.score; g.n++;
      const t = g.turns[String(r.turn)] ?? { sum: 0, n: 0 };
      t.sum += r.score; t.n++; g.turns[String(r.turn)] = t;
      groups.set(r.model, g);
    }
    const rows = [...groups].map(([name, g]) => ({ model: identity(name), score: g.sum / g.n,
      setting: 'GPT-4 single-answer judge', metrics: { judgments: g.n, ...Object.fromEntries(Object.entries(g.turns).map(([k, t]) => ['turn' + k, t.sum / t.n])) } }));
    if (!rows.length) throw new Error('MT-Bench judgments missing');
    return rows;
  },
};
export default board;
