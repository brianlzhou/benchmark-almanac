// ChatRAG Bench: Main Results / Average (all) is the published whole-suite score.
// Dataset scores, the alternate average, and answerability scores remain supporting metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://huggingface.co/datasets/nvidia/ChatRAG-Bench/raw/main/README.md";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "chatrag-bench",
  url: "https://huggingface.co/datasets/nvidia/ChatRAG-Bench",
  feed: FEED,
  terms: "Public results published by the benchmark authors at huggingface.co; retain source attribution and follow the upstream terms.",
  aliases: {"Llama3-instruct-70b": "llama-3-70b", "GPT-4-0613": "gpt-4-jun-2023", "GPT-3.5-turbo-0613": "gpt-3-5-turbo-jun-2023"},
  
  async fetch() {
    const out: LeaderboardRow[] = [];
    for (const t of mdTables(await fetchText(FEED))) {
      if (!/Main Results|Unanswerable Scenario/.test(t.heading)) continue;
      for (const r of t.rows) for (let i = 1; i < t.head.length; i++) {
        const score = num(r[i]); if (score === undefined) continue;
        out.push({model: identity(t.head[i]), score, setting: `${t.heading}; ${r[0]}`});
      }
    }
    if (!out.length) throw new Error('ChatRAG result tables missing');
    return out.filter(r=>r.setting==='Main Results; Average (all)').map(r=>({...r,setting:undefined,
      metrics:Object.fromEntries(out.filter(x=>x.model===r.model&&x!==r).map(x=>[
        x.setting!.replace('Main Results; ','').replace('Evaluation of Unanswerable Scenario; ','answerability_').toLowerCase().replace(/[^a-z0-9]+/g,'_'),x.score]))}));
  },
};
export default board;
