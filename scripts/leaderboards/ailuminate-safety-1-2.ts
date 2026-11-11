// AILuminate Safety 1.2 English (US): official percentile scores, preserving model and guard tables. Retain MLCommons citation wording and version.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const FEED = "https://mlcommons.org/ailuminate/safety/results/";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "ailuminate-safety-1-2",
  url: "https://mlcommons.org/ailuminate/safety/results/",
  feed: FEED,
  terms: "Cite: [System] scored in the [Nth] percentile overall on AILuminate Safety [version], English (US); official result retrieved from mlcommons.org on [date], under the MLCommons Benchmark Use and Messaging Policy.",
  aliases: {},
  
  async fetch() {
    const page = await fetchText(FEED);
    const version = text(page).match(/AILuminate Safety (1\.2(?:\.\d+)?), English \(US\)/)?.[1];
    if (!version) throw new Error('Expected AILuminate Safety 1.2 English version missing');
    const out: LeaderboardRow[] = [];
    for (const t of tables(page)) {
      if (t[0]?.[0]?.text !== 'Name' || !t[0]?.[1]?.text.includes('Percentile')) continue;
      for (const r of t.slice(1)) {
        const score = num(r[1]?.text); if (score === undefined) continue;
        const name = r[0].text.replace(/\s+Released\s+.*$/, '');
        out.push({model: identity(name), score, setting: `AILuminate Safety ${version}; English (US); overall percentile`});
      }
    }
    if (!out.length) throw new Error('AILuminate percentile tables missing');
    return out;
  },
};
export default board;
