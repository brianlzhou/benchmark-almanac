// Clocktower Radio (Che Jami): models play Blood on the Clocktower in mirrored pairs of games, each model taking
// the good side in one game and the evil side in the other. The leaderboard is the table on the home page: a
// Bradley–Terry rating where 1500 is average, with a ± margin (95% interval), the win rate as good and as evil,
// cost per game (in the Cost cell's title) and output tokens per action (in the Verbosity cell's title). A
// parenthesized effort ("GPT-5.2 (Medium)") becomes the setting. The page lists the models still in rotation.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const PAGE = 'https://clocktower-radio.com/';

const board: Leaderboard = {
  benchmark: 'clocktower-radio',
  url: PAGE,
  feed: `${PAGE} (static HTML leaderboard table, Rating)`,
  terms: "robots.txt allows all paths to general agents and sets the content signal use=reference, ai-train=no; one request per sync, scores cited to the site.",
  async fetch() {
    const html = await fetchText(PAGE);
    const body = html.match(/<tbody\b[\s\S]*?<\/tbody>/)?.[0];
    if (!body) throw new Error('no leaderboard table on Clocktower Radio');
    const rows: LeaderboardRow[] = [];
    for (const tr of body.matchAll(/<tr\b[\s\S]*?<\/tr>/g)) {
      const cell = (label: string) => tr[0].match(new RegExp(`data-label=(?:"${label}"|${label})>([\\s\\S]*?)</td>`))?.[1] ?? '';
      let model = text(cell('Model'));
      const rating = cell('Rating').match(/<span>(\d+)<\/span>\s*<span[^>]*>±(\d+)/);
      const rates = [...cell('Win Rate').matchAll(/>(\d+)%</g)].map((m) => Number(m[1]));
      const cost = cell('Cost').match(/title="\$([\d.]+) \/ game"/)?.[1];
      const verbose = cell('Verbosity').match(/title="([\d,]+) tokens \/ action"/)?.[1];
      if (!model || !rating) continue;
      let setting: string | undefined;
      const effort = model.match(/\s*\((Minimal|Low|Medium|High|xhigh|Max)\)$/i);
      if (effort) {
        setting = effort[1].toLowerCase();
        model = model.slice(0, effort.index).trim();
      }
      // "Grok 4.1 Fast (Reasoning)" names a model, not a setting
      model = model.replace(/\s*\(([^)]+)\)$/, ' $1');
      const score = Number(rating[1]);
      const margin = Number(rating[2]);
      const metrics: Record<string, number> = { ciLow: score - margin, ciHigh: score + margin };
      if (rates.length === 2) [metrics.goodWin, metrics.evilWin] = rates;
      if (verbose) metrics.tokensPerAction = Number(verbose.replace(/,/g, ''));
      rows.push({ model, setting, score, cost: cost ? Number(cost) : undefined, metrics });
    }
    if (rows.length < 10) throw new Error(`Clocktower Radio: ${rows.length} rows`);
    return rows;
  },
};
export default board;
