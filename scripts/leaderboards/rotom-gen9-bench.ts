// RotomArena reports Bradley-Terry ratings on an anchored Elo scale for Generation 9 singles. The HTML standings distinguish ranked entrants from an unranked baseline.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables, num } from '../lib/html.ts';

const feed = "https://rotomarena.org/benchmarks/rotom-gen9-bench/";
const board: Leaderboard = {
  benchmark: 'rotom-gen9-bench',
  url: "https://rotomarena.org/benchmarks/rotom-gen9-bench/",
  feed,
  terms: "The robots file publishes content signals. RotomArena dedicates its ratings and match data to CC0. Smogon teams and Pokémon assets have separate rights. https://rotomarena.org/credits/",
  async fetch() {
    const page = await fetchText(feed);
    const source = page.match(/<table\b[^>]*>[\s\S]*?Tokens \/ turn[\s\S]*?<\/table>/)?.[0];
    if (!source || !source.includes('Rating (95% CI)')) throw new Error('Missing Gen9 ratings');
    const rows = [];
    for (const m of source.matchAll(/<tr\b([^>]*data-ranked="1"[^>]*)>([\s\S]*?)<\/tr>/g)) {
      const c = tables('<table><tr>' + m[2] + '</tr></table>')[0][0];
      const model = c[1].attrs['data-value'], score = num(c[2].attrs['data-value']), ci = c[2].html.match(/95% interval (\d+)–(\d+)/);
      const values = c.slice(3,9).map(v => num(v.text));
      if (!model || score == null || values.some(v => v == null)) throw new Error('Incomplete Gen9 entry');
      const href = c[1].html.match(/href="([^"]+)"/)?.[1];
      rows.push({ model, score, low: ci ? Number(ci[1]) : undefined, high: ci ? Number(ci[2]) : undefined, trials: values[0],
        open: m[1].includes('data-open="1"'), cost: c[9].text === 'free' ? 0 : num(c[9].text), link: href ? new URL(href, feed).href : undefined,
        metrics: { wins: values[1]!, losses: values[2]!, winRate: values[3]!, hallucination: values[4]!, tokensPerTurn: values[5]! } });
    }
    if (rows.length < 13) throw new Error('Missing ranked Gen9 entrants');
    return rows;
  },
};
export default board;
