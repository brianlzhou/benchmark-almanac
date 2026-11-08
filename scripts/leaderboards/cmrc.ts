// CMRC2018: Test F1 is the headline reading-comprehension score, in percent. Preserve test exact match and challenge EM/F1 as separate metrics. Keep submitted system identities, including single-model/ensemble labels, and exclude human performance.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://ymcui.com/cmrc2018/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "cmrc",
  url: "https://ymcui.com/cmrc2018/",
  feed: FEED,
  terms: "Public results published by the benchmark authors at ymcui.com; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const t = tables(await fetchText(FEED)).find(t => t[0]?.some(c => c.text === 'Challenge'));
    if (!t) throw new Error('CMRC table missing');
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(2)) {
      const name = text(r[1]?.html.split(/<p class="institution"/)[0] ?? ''), score = num(r[3]?.text);
      if (!name || /human/i.test(name) || score === undefined) continue;
      const metrics: Record<string, number> = {};
      for (const [k, i] of [['testExactMatch', 2], ['challengeExactMatch', 4], ['challengeF1', 5]] as const) { const n = num(r[i]?.text); if (n !== undefined) metrics[k] = n; }
      rows.push({ model: name, score, metrics });
    }
    if (!rows.length) throw new Error('CMRC score rows missing');
    return rows;
  },
};
export default board;
