// CharXiv descriptive questions: the CSV repeats the Overall header, first for reasoning and then for descriptive questions. Rename those headers before parsing and use only the descriptive aggregate, in percent; keep its five question-category scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://charxiv.github.io/data/val_result.csv";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "charxiv-dq",
  url: "https://github.com/princeton-nlp/CharXiv",
  feed: FEED,
  terms: "Public results published by the benchmark authors at charxiv.github.io; retain source attribution and follow the upstream terms.",
  aliases: {"GPT-4o 240513": "gpt-4o-may-2024"},
  
  async fetch() {
    const source = await fetchText(FEED), end = source.indexOf('\n');
    let aggregate = 0;
    const header = source.slice(0, end).replace(/Overall/g, () => aggregate++ === 0 ? 'ReasoningOverall' : 'DescriptiveOverall');
    if (aggregate !== 2) throw new Error('CharXiv duplicate aggregate headers changed');
    const rows: LeaderboardRow[] = [];
    for (const r of parseCsv(header + source.slice(end))) {
      const score = num(r.DescriptiveOverall), name = r.Model;
      if (!name || /^(human|random)/i.test(name) || score === undefined) continue;
      const metrics: Record<string, number> = {};
      for (const k of ['INEX', 'ENUM', 'PATT', 'CNTG', 'COMP']) { const n = num(r[k]); if (n !== undefined) metrics[k] = n; }
      rows.push({ model: identity(name), score, setting: 'validation; descriptive questions', metrics });
    }
    if (!rows.length) throw new Error('CharXiv DQ scores missing');
    return rows;
  },
};
export default board;
