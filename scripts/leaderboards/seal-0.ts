// Seal-0: answer accuracy in percent from the official SealQA dataset card. Read both search settings, retaining zero scores. Seal-Hard is a different subset and is not used as the Seal-0 score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { mdTables } from './big-bench-extra-hard.ts';
const FEED = "https://huggingface.co/datasets/vtllms/sealqa/resolve/main/README.md";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "seal-0",
  url: "https://huggingface.co/datasets/vtllms/sealqa",
  feed: FEED,
  terms: "Public results published by the benchmark authors at huggingface.co; retain source attribution and follow the upstream terms.",
  aliases: {"Llama-4-Scout-17B-16E (109B)": "llama-4-scout", "DeepSeek-R1-0528-671B": "deepseek-r1-may-2025"},
  
  async fetch() {
    const rows: LeaderboardRow[] = [];
    for (const t of mdTables(await fetchText(FEED))) {
      if (!t.head.includes('Seal-0 w/o Search')) continue;
      for (const r of t.rows) for (const column of ['Seal-0 w/o Search', 'Seal-0 w/ Search']) {
        const score = num(r[t.head.indexOf(column)]);
        if (r[0] && score !== undefined) rows.push({ model: identity(r[0]), score, setting: column.replace('Seal-0 ', '') });
      }
    }
    if (!rows.length) throw new Error('Seal-0 table missing');
    return rows;
  },
};
export default board;
