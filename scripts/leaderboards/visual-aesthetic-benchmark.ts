// Visual Aesthetic Benchmark: use the headline Top-1 accuracy percentage.
// TB-1 and category averages are secondary metrics on the overall row.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables, text } from '../lib/html.ts';

const FEED = "https://vab.bakelab.ai";
// Undated API families do not identify a snapshot. Keep these as unlisted entries.
const identity = (name: string) => /^(?:GPT[ -]?4o(?:[ -]?mini)?|GPT[ -]?4(?:[ -]?Turbo)?|GPT-3[.-]5(?:-Turbo)?|ChatGPT|Gemini[ -]1[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]5[ -](?:Pro|Flash)|Gemini[ -]2[.-]0[ -]Flash|Claude[ -]?3[.-]5[ -]Sonnet|DeepSeek[ -](?:R1|V3))$/i.test(name) ? `${name} (snapshot unspecified)` : name;
const board: Leaderboard = {
  benchmark: "visual-aesthetic-benchmark",
  url: "https://vab.bakelab.ai",
  feed: FEED,
  terms: "Public results published by the benchmark authors at vab.bakelab.ai; retain source attribution and follow the upstream terms.",
  aliases: {},
  
  async fetch() {
    const t = tables(await fetchText(FEED)).find(t => t[0]?.some(c => c.text === 'Artwork'));
    if (!t) throw new Error('Visual Aesthetic results missing');
    const out: LeaderboardRow[] = [];
    for (const r of t.slice(2)) {
      const name = r[0]?.text.replace(/^\d+\s*/, ''); if (!name || /^(Human|Model)/i.test(name)) continue;
      const metrics: Record<string, number> = {};
      for (const [i,k] of ['Artwork','Illustration','Photography'].entries()) {const v = num(r[i+3]?.text); if (v !== undefined) metrics[k] = v;}
      for (const [i,setting] of ['Top-1','TB-1'].entries()) {const score = num(r[i+1]?.text); if (score !== undefined) out.push({model: identity(name), score, setting, metrics});}
    }
    if (!out.length) throw new Error('Visual Aesthetic scores missing');
    return out.filter(r => r.setting === 'Top-1').map(r => {
      const tb=out.find(x => x.model===r.model && x.setting==='TB-1');
      return {...r,setting:undefined,metrics:{...r.metrics,...(tb ? {tb1:tb.score} : {})}};
    });
  },
};
export default board;
