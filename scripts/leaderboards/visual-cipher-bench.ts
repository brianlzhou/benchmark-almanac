// Visual Cipher Bench (Navers Lab, Einsia AI, and Tsinghua University): 40 original hand-drawn visual reasoning
// puzzles across Spatial, Logic, Rule induction, and Decoding subsets where coding agents infer hidden visual rules
// with no written instructions. Reads the live HTML leaderboard table at lab.einsia.ai/visual-cipher-bench/.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';

const PAGE = 'https://lab.einsia.ai/visual-cipher-bench/';

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const board: Leaderboard = {
  benchmark: 'visual-cipher-bench',
  url: PAGE,
  feed: PAGE,
  terms: 'Published openly on Einsia AI Lab with robots.txt Allow: /.',
  parts: {
    spatial: { name: 'Spatial', group: 'Category' },
    logic: { name: 'Logic', group: 'Category' },
    ruleInduction: { name: 'Rule induction', group: 'Category' },
    decoding: { name: 'Decoding', group: 'Category' },
  },
  async fetch() {
    const html = await fetchText(PAGE);
    const tableMatch = html.match(/<table[\s\S]*?<\/table>/);
    if (!tableMatch) throw new Error('Visual Cipher Bench leaderboard table not found');
    const out: LeaderboardRow[] = [];
    for (const tb of tableMatch[0].matchAll(/<tbody[\s\S]*?<\/tbody>/g)) {
      const thMatch = tb[0].match(/<th[^>]*>([\s\S]*?)<\/th>/);
      if (!thMatch) continue;
      const model = stripTags(thMatch[1]);
      for (const tr of tb[0].matchAll(/<tr[\s\S]*?<\/tr>/g)) {
        const tds = [...tr[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => stripTags(m[1]));
        if (tds.length < 6) continue;
        const [effort, overallStr, spatialStr, logicStr, ruleStr, decodingStr] = tds;
        const score = Number(overallStr);
        const spatial = Number(spatialStr);
        const logic = Number(logicStr);
        const ruleInduction = Number(ruleStr);
        const decoding = Number(decodingStr);
        if (![score, spatial, logic, ruleInduction, decoding].every(Number.isFinite)) {
          throw new Error(`Invalid numeric cells for ${model} (${effort})`);
        }
        out.push({
          model,
          setting: effort && effort !== '-' ? `effort ${effort}` : undefined,
          score,
          metrics: { spatial, logic, ruleInduction, decoding },
        });
      }
    }
    if (out.length < 15) throw new Error(`Visual Cipher Bench returned only ${out.length} rows`);
    return out;
  },
};
export default board;
