// CTI-REALM published mean reward, converted from 0–1 to percent. Keep standard error and confidence intervals on the percentage scale.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, tables, text, jsonAfter, jsLiteral } from '../lib/html.ts';

const FEED = "https://ukgovernmentbeis.github.io/inspect_evals/evals/cti_realm/index.html";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "cti-realm",
  url: "https://ukgovernmentbeis.github.io/inspect_evals/evals/cti_realm/index.html",
  feed: FEED,
  terms: "Public results published by the benchmark authors at ukgovernmentbeis.github.io; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const t = tables(await fetchText(FEED)).find(t => t[0]?.some(c => c.text === 'Rewards'));
    if (!t) throw new Error('CTI-REALM results table missing');
    return t.slice(1).flatMap(r => {
      const score = num(r[2]?.text); if (score === undefined) return [];
      const metrics: Record<string,number> = {};
      const se = num(r[3]?.text); if (se !== undefined) metrics.standardError = se*100;
      const ci = r[4]?.text.match(/\[([\d.]+),\s*([\d.]+)\]/); if (ci) {metrics.ciLow=Number(ci[1])*100;metrics.ciHigh=Number(ci[2])*100;}
      return [{model: identity(r[0].text.replace(/ \((?:high|medium|low)\)$/, '')), setting: r[0].text.match(/\((high|medium|low)\)$/)?.[1], score: score*100, metrics}];
    });
  },
};
export default board;
