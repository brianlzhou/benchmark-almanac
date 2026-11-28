// GoBench Track 1 evaluates models playing full games of 9x9 Go directly without tools.
// The author's page embeds the live Bradley-Terry Elo ratings, 95% confidence intervals,
// cost per move and seconds per move in Next.js page data alongside the rendered Track 1 table.
// KataGo reference opponents are listed on the board and excluded via notModels.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { text } from '../lib/html.ts';

const PAGE = 'https://rolandgao.com/blog/gobench/';

interface GoBenchPlayer {
  player: string;
  elo: number;
  ci_low: number;
  ci_high: number;
  games: number;
  track?: number;
  api_seconds_per_move?: number | null;
  seconds_per_move?: number | null;
  cost_usd_per_move?: number | null;
  learning_cost_usd?: number | null;
}

export function readGoBenchPage(html: string) {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('Missing GoBench Next.js data');
  const data = JSON.parse(match[1]) as {
    props?: { pageProps?: { goBenchData?: { datasets?: { llm_players?: GoBenchPlayer[]; katago_players?: GoBenchPlayer[] } } } };
  };
  const datasets = data.props?.pageProps?.goBenchData?.datasets;
  if (!datasets?.llm_players?.length) throw new Error('Missing GoBench player datasets');
  return datasets;
}

const board: Leaderboard = {
  benchmark: 'gobench',
  url: PAGE,
  feed: `${PAGE} (__NEXT_DATA__ Track 1 standings)`,
  terms: 'The author publishes the benchmark code and summary results under the MIT License at https://github.com/RolandGao/gobench/blob/main/LICENSE and rolandgao.com robots.txt allows the leaderboard page.',
  notModels: /^KataGo\b/i,
  chart: {
    title: 'Elo versus cost per move',
    x: { key: 'costPerMove', label: 'Cost per move', unit: '$', better: 'lower', log: true },
    y: { key: 'score', label: 'Elo', unit: 'Elo', better: 'higher' },
    note: 'Track 1 direct 9x9 Go play without tools, plotted against cost per move on a logarithmic scale.',
  },
  stats: {
    costPerMove: { name: 'Cost per move', unit: 'usd', better: 'lower' },
    secondsPerMove: { name: 'Seconds per move', unit: 'seconds', better: 'lower' },
    games: { name: 'Games played', unit: 'count' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const html = await fetchText(PAGE);
    const { llm_players = [], katago_players = [] } = readGoBenchPage(html);
    const byId = new Map<string, GoBenchPlayer>();
    for (const p of [...llm_players, ...katago_players]) byId.set(p.player, p);

    const tableMatch = html.match(/<table class="gobench-table"[\s\S]*?<\/table>/);
    if (!tableMatch) throw new Error('Missing GoBench Track 1 table');
    const rows: LeaderboardRow[] = [];
    for (const rowMatch of tableMatch[0].matchAll(/<tr class="gobench-(?:result|reference)-row"[\s\S]*?<\/tr>/g)) {
      const tr = rowMatch[0];
      const id = tr.match(/<span class="gobench-player-cell" title="([^"]+)"/)?.[1];
      const labelHtml = tr.match(/<span class="gobench-player-details">([\s\S]*?)<\/span><\/span>/)?.[1];
      if (!id || !labelHtml) throw new Error('Malformed GoBench Track 1 row');
      const player = byId.get(id);
      if (!player || !Number.isFinite(player.elo) || !Number.isFinite(player.ci_low) || !Number.isFinite(player.ci_high)) {
        throw new Error('Missing GoBench Track 1 rating for ' + id);
      }
      const label = text(labelHtml);
      const parts = label.split(/\s*·\s*/);
      const model = parts[0];
      const setting = parts.slice(1).join(', ') || undefined;
      const seconds = player.api_seconds_per_move ?? player.seconds_per_move;
      const metrics: Record<string, number> = {};
      if (typeof player.cost_usd_per_move === 'number' && Number.isFinite(player.cost_usd_per_move)) metrics.costPerMove = player.cost_usd_per_move;
      if (typeof seconds === 'number' && Number.isFinite(seconds)) metrics.secondsPerMove = seconds;
      if (typeof player.games === 'number' && Number.isFinite(player.games)) metrics.games = player.games;
      rows.push({
        model,
        setting,
        score: player.elo,
        low: player.ci_low,
        high: player.ci_high,
        metrics,
      });
    }
    if (rows.length < 30) throw new Error(`Expected at least 30 GoBench Track 1 rows, found ${rows.length}`);
    return rows;
  },
};

export default board;
