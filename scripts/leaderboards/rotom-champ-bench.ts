// Rotom Champ Bench rates competitive Pokémon models on an anchored Elo scale. The standings include confidence intervals, game counts and per-turn token use.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';

const FEED = "https://rotomarena.org/benchmarks/rotom-champ-bench/";
const board: Leaderboard = {
  benchmark: "rotom-champ-bench",
  url: "https://rotomarena.org/benchmarks/rotom-champ-bench/",
  feed: FEED,
  terms: "RotomArena dedicates its ratings and match data to CC0. Smogon teams and Pokémon assets have separate rights. https://rotomarena.org/credits/ The host has no published robots directives at /robots.txt.",
  parts: { wins: { name: 'Wins', unit: 'score' }, losses: { name: 'Losses', unit: 'score' }, winRate: { name: 'Win rate', unit: '%' }, halluc: { name: 'Hallucination rate', unit: '%', better: 'lower' }, tokensPerTurn: { name: 'Tokens per turn', unit: 'score' } },
  async fetch() {
    const html = await fetchText(FEED);
    const table = html.match(/<table\b[^>]*>[\s\S]*?<\/table>/i)?.[0];
    if (!table || !['Rating (95% CI)','Cost / game','Tokens / turn'].every(h => table.includes(h))) throw new Error('Missing Rotom rating table');
    const rows = [...table.matchAll(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/gi)].filter(m => m[1].includes('data-ranked="1"')).map(([,attrs,body]) => {
      const cells = tables('<table><tr>' + body + '</tr></table>')[0][0];
      const values = cells.map(c => c.attrs['data-value']);
      const [,,score,games,wins,losses,winRate,halluc,tokensPerTurn,cost] = values.map(v => v ? Number(v) : NaN);
      if (!values[1] || ![score,games,wins,losses,winRate,halluc,tokensPerTurn,cost].every(Number.isFinite)) throw new Error('Incomplete Rotom row');
      const bounds = cells[2].html.match(/95% interval ([\d.]+)[–-]([\d.]+)/);
      const link = cells[1].html.match(/href="([^"]+)"/)?.[1];
      return { model: values[1], score, trials: games, open: attrs.includes('data-open="1"'), cost, link: link ? new URL(link,FEED).href : undefined,
        low: bounds ? Number(bounds[1]) : undefined, high: bounds ? Number(bounds[2]) : undefined,
        metrics: { wins, losses, winRate: 100*winRate, halluc: 100*halluc, tokensPerTurn } };
    });
    if (rows.length < 44) throw new Error('Missing ranked Rotom models');
    return rows;
  },
};
export default board;
