// SnakeBench. snakebench.com is server-rendered (Next.js) with one HTML table of every model: TrueSkill
// exposed rating (the ranking and the score), uncertainty, wins and losses, win rate, apples, best length
// and total cost. Model names use OpenRouter's "Maker: Model" form, and the maker prefix is dropped.
// Ratings are only comparable within this board. The ±σ uncertainty and Win% are kept as metrics.std and
// metrics.winRate. The site’s statistics endpoint gives game counts including ties, cost totals and last game dates.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson, fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';

const URL = 'https://snakebench.com/';

interface ModelStats {
  games_played: number;
  total_cost: number;
  ties: number;
  elo_rating?: number;
  last_game_time?: string;
}
const STATS = 'https://backend-copy-production-3ef7.up.railway.app/api/stats?simple=true';

const board: Leaderboard = {
  benchmark: 'snakebench',
  url: URL,
  feed: `${URL} (server-rendered HTML table, TrueSkill rating)`,
  terms: 'Server-rendered public page; the site publishes no robots.txt and no terms.',
  aliases: {
    'R1 Distill Llama 70B':'deepseek-r1-distill-llama-70b',
    'Kimi K2 0905':'kimi-k2-sep-2025',
    'Qwen3 235B A22B Instruct 2507':'qwen3-235b-a22b-instruct-jul-2025',
    'Nano Banana (Gemini 2.5 Flash Image)':'gemini-2-5-flash-image-preview-nano-banana',
  },
  async fetch() {
    const t = tables(await fetchText(URL)).find((rows) => rows[0]?.some((c) => /^Rating/.test(c.text)));
    if (!t) throw new Error('SnakeBench table not found');
    const head = t[0].map((c) => c.text);
    const iModel = head.indexOf('Model');
    const iScore = head.findIndex((h) => /^Rating/.test(h));
    const iSigma = head.findIndex((h) => /^±σ|Uncertainty/.test(h));
    const iWin = head.findIndex((h) => /^Win%/.test(h));
    const stats = await fetchJson<{ aggregatedData: Record<string, ModelStats> }>(STATS);
    const rows: LeaderboardRow[] = [];
    for (const r of t.slice(1)) {
      const name = r[iModel]?.text.replace(/^[^:]+:\s*/, '');
      const score = num(r[iScore]?.text);
      const sigma = iSigma >= 0 ? num(r[iSigma]?.text) : undefined;
      const winRate = iWin >= 0 ? num(r[iWin]?.text) : undefined;
      const metrics:Record<string,number> = { ...(sigma === undefined ? {} : { std: sigma }), ...(winRate === undefined ? {} : { winRate }) };
      const totalCost=num(r[head.indexOf('Cost')]?.text);
      if(totalCost!==undefined)metrics['total cost (USD)']=totalCost;
      const wl=r[head.indexOf('W/L')]?.text.match(/(\d+)\s*\/\s*(\d+)/);
      if(wl){metrics.wins=Number(wl[1]);metrics.losses=Number(wl[2]);}
      for (const label of ['Apples', 'Best length', 'Best Length', 'Games']) {
        const value=num(r[head.indexOf(label)]?.text);
        if(value!==undefined)metrics[label]=value;
      }
      const detail = stats.aggregatedData[r[iModel]?.text];
      const best = num(r[head.indexOf('Best')]?.text);
      const mu = num(r[iScore]?.attrs.title);
      if (best !== undefined) metrics.bestLength = best;
      if (mu !== undefined) metrics.mu = mu;
      if (detail && Number.isFinite(detail.ties)) metrics.ties = detail.ties;
      if (typeof detail?.elo_rating === 'number') metrics.eloRating = detail.elo_rating;
      const trials = detail?.games_played;
      const cost = trials && Number.isFinite(detail.total_cost) ? detail.total_cost / trials : undefined;
      const time = Date.parse(detail?.last_game_time ?? '');
      const href = r[iModel]?.html.match(/href="(\/models\/[^"]+)"/)?.[1];
      if (name && score !== undefined) rows.push({
        model: name, score, metrics, cost, trials,
        date: Number.isFinite(time) ? new Date(time).toISOString().slice(0, 10) : undefined,
        link: href ? new globalThis.URL(href.replace(/&amp;/g, '&'), URL).href : undefined,
      });
    }
    return rows;
  },
};
// Retain rolling API labels without assigning an unspecified snapshot.
const fetchRows = board.fetch;
board.fetch = async () => (await fetchRows.call(board)).map(row => {
  const ambiguous = /^(?:GPT[- ]?(?:4o|4|3[.]5[- ]turbo)|Gemini[- ](?:1[.]5|2[.]5)[- ](?:Pro|Flash|Flash[- ]Lite)|Claude[- ]3[.]5[- ]Sonnet)$/i.test(row.model);
  return ambiguous ? {...row, model: row.model + ' [snapshot unspecified]'} : row;
});
export default board;
